import { checkPermission } from "./permissions.js";
import { showNotification } from "../ui/notification.js";
import { canUserModifyDocument } from "./core.js";

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const FILE_ICONS = {
  "application/pdf": "file-pdf",
  "image/jpeg": "file-image",
  "image/png": "file-image",
  "application/msword": "file-word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "file-word",
};
const SECURITY_LEVELS = ["public", "internal", "confidential"];

// /**
//  * Uploads a document for a staff member
//  * @param {string} staffId - Staff member ID
//  * @param {File} file - File to upload
//  * @param {string} securityLevel - Document security level
//  * @returns {Promise<Object>} Uploaded document details
//  */
export function uploadDocument(staffId, file, securityLevel = "internal") {
  return new Promise((resolve, reject) => {
    try {
      // Validate permissions
      const currentUser = JSON.parse(localStorage.getItem("wms_user"));
      // Replace current validation with:
      if (!checkPermission(currentUser.role, "upload_documents")) {
        showNotification("Your role cannot upload documents", "error");
        throw new Error("Insufficient permissions");
      }

      // Validate inputs
      if (!staffId || !file) {
        throw new Error("Staff ID and file are required");
      }

      // Validate security level
      if (!SECURITY_LEVELS.includes(securityLevel)) {
        throw new Error("Invalid security level specified");
      }

      // Validate file
      validateFile(file);

      // Read file contents
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const documentData = await createDocumentRecord(
            staffId,
            file,
            e.target.result,
            securityLevel,
            currentUser
          );
          resolve(documentData);

          // ADD THIS LINE:
          showNotification("Document uploaded successfully", "success", {
            timeout: 3000,
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file contents"));
      };

      reader.readAsDataURL(file);
    } catch (error) {
      showNotification(error.message, "error"); // Add this line
      reject(error);
    }
  });
}

function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File exceeds maximum size of ${formatFileSize(MAX_FILE_SIZE)}`
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Unsupported file type. Allowed: PDF, Word, JPEG, PNG");
  }

  if (file.name.length > 100) {
    throw new Error("Filename must be less than 100 characters");
  }
}

async function createDocumentRecord(
  staffId,
  file,
  fileData,
  securityLevel,
  currentUser
) {
  const staffMembers = JSON.parse(localStorage.getItem("staff")) || [];

  const documentData = {
    id: `doc-${Date.now()}-${crypto.randomUUID().substr(0, 8)}`,
    name: sanitizeFilename(file.name),
    type: file.type,
    size: file.size,
    data: fileData,
    uploaded: new Date().toISOString(),
    uploadedBy: currentUser.id,
    lastModified: file.lastModified,
    securityLevel,
    checksum: await generateChecksum(file),
  };

  // Update staff records
  const updatedStaff = staffMembers.map((staff) => {
    if (staff.id === staffId) {
      const documents = [...(staff.documents || []), documentData].sort(
        (a, b) => new Date(b.uploaded) - new Date(a.uploaded)
      );

      return { ...staff, documents };
    }
    return staff;
  });

  // Save to storage
  localStorage.setItem("staff", JSON.stringify(updatedStaff));

  // Update current user if applicable
  if (currentUser.id === staffId) {
    const updatedUser = {
      ...currentUser,
      documents: updatedStaff.find((s) => s.id === staffId).documents,
    };
    localStorage.setItem("wms_user", JSON.stringify(updatedUser));
  }

  return {
    ...documentData,
    staffId,
    downloadUrl: URL.createObjectURL(file),
    icon: getFileIcon(file.type),
    formattedSize: formatFileSize(file.size),
    canDelete: true,
  };
}

async function generateChecksum(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// /**
//  * Retrieves documents for a staff member
//  * @param {string} staffId - Staff member ID
//  * @returns {Array} List of documents
//  */
export function getStaffDocuments(staffId) {
  try {
    if (!staffId) throw new Error("Staff ID is required");

    const staffMembers = JSON.parse(localStorage.getItem("staff")) || [];
    const staff = staffMembers.find((s) => s.id === staffId);
    const currentUser = JSON.parse(localStorage.getItem("wms_user"));

    if (!staff) return [];

    return (staff.documents || []).map((doc) => ({
      ...doc,
      icon: getFileIcon(doc.type),
      formattedSize: formatFileSize(doc.size),
      canDelete: canUserModifyDocument(doc, currentUser),
    }));
  } catch (error) {
    showNotification("Failed to load documents", "error"); // Add this line
    console.error("Failed to fetch documents:", error);
    return [];
  }
}

// /**
//  * Deletes a document
//  * @param {string} staffId - Staff member ID
//  * @param {string} docId - Document ID to delete
//  * @returns {boolean} True if successful
//  */
export function deleteDocument(staffId, docId) {
  try {
    if (!staffId || !docId)
      throw new Error("Staff ID and Document ID are required");

    const staffMembers = JSON.parse(localStorage.getItem("staff")) || [];
    const currentUser = JSON.parse(localStorage.getItem("wms_user"));

    // Verify document exists and user has permission
    const staff = staffMembers.find((s) => s.id === staffId);
    const document = staff?.documents?.find((d) => d.id === docId);

    if (!document) throw new Error("Document not found");
    if (!canUserModifyDocument(document, currentUser)) {
      throw new Error("Unauthorized to delete this document");
    }

    // Update records
    const updatedStaff = staffMembers.map((staff) => {
      if (staff.id === staffId) {
        return {
          ...staff,
          documents: (staff.documents || []).filter((doc) => doc.id !== docId),
        };
      }
      return staff;
    });

    localStorage.setItem("staff", JSON.stringify(updatedStaff));

    // Update current user if applicable
    if (currentUser?.id === staffId) {
      const updatedUser = {
        ...currentUser,
        documents: updatedStaff.find((s) => s.id === staffId).documents,
      };
      localStorage.setItem("wms_user", JSON.stringify(updatedUser));
    }

    // ADD THIS LINE:
    showNotification("Document deleted successfully", "success", {
      timeout: 3000,
    });

    return true;
  } catch (error) {
    showNotification(error.message, "error"); // Add this line
    console.error("Delete failed:", error);
    throw error;
  }
}

function sanitizeFilename(filename) {
  return filename.replace(/[^\w.-]/g, "_");
}

function getFileIcon(mimeType) {
  return FILE_ICONS[mimeType] || "file-alt";
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// Show document modal
export function showDocumentModal(staffId, staffName, documents = []) {
  let modal = document.getElementById("staffDocumentModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "staffDocumentModal";
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Documents for <span id="docStaffName"></span></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div id="docListContainer"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.querySelector("#docStaffName").textContent = staffName;

  const container = modal.querySelector("#docListContainer");
  if (!documents.length) {
    container.innerHTML = `<div class="text-muted">No documents found.</div>`;
  } else {
    container.innerHTML = `
      <ul class="list-group">
        ${documents
          .map(
            (doc) => `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <span>
              <i class="fas fa-${doc.icon || "file-alt"} me-2"></i>
              <strong>${doc.name}</strong>
              <small class="text-muted ms-2">(${doc.formattedSize || formatFileSize(doc.size)})</small>
            </span>
            <span>
              <a href="${doc.downloadUrl || "#"}" download="${doc.name}" class="btn btn-sm btn-outline-primary me-2" title="Download">
                <i class="fas fa-download"></i>
              </a>
              ${
                doc.canDelete
                  ? `<button class="btn btn-sm btn-outline-danger btn-delete-doc" data-docid="${doc.id}"><i class="fas fa-trash-alt"></i></button>`
                  : ""
              }
            </span>
          </li>
        `
          )
          .join("")}
      </ul>
    `;
  }

  // Attach delete handlers
  container.querySelectorAll(".btn-delete-doc").forEach((btn) => {
    btn.onclick = () => {
      const docId = btn.getAttribute("data-docid");
      if (confirm("Delete this document?")) {
        try {
          deleteDocument(staffId, docId);
          btn.closest("li").remove();
          showNotification("Document deleted.", "success");
        } catch (e) {
          showNotification("Failed to delete document.", "error");
        }
      }
    };
  });

  // Show modal using Bootstrap API
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
}
