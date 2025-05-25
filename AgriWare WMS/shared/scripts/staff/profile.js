import { showNotification } from '../ui/notification.js';
import { uploadDocument, getStaffDocuments, deleteDocument } from './documents.js';
import { checkPermission } from '../auth/permissions.js';

// Initialize profile page
document.addEventListener("DOMContentLoaded", () => {
  verifyProfileAccess();
  loadProfileData();
  setupEventListeners();
  loadDocuments();
});

function verifyProfileAccess() {
  const user = JSON.parse(localStorage.getItem("wms_user"));
  if (!checkPermission(user?.role, 'access_profile')) {
    window.location.href = '../../shared/401.html';
  }
}

function loadProfileData() {
  const user = JSON.parse(localStorage.getItem("wms_user")) || {};

  // Basic Info
  document.getElementById("profileName").textContent = user.name || "Unknown";
  document.getElementById("profileRole").textContent = user.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Unknown";

  // Form Fields
  document.getElementById("fullName").value = user.name || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("phone").value = user.phone || "";

  // Stats
  document.getElementById("attendanceRate").textContent = user.attendanceRate || "95%";
  document.getElementById("tasksCompleted").textContent = user.completedTasks || "0";

  // Activity Feed
  renderActivityFeed(user.recentActivities || []);
}

function renderActivityFeed(activities) {
  const feed = document.getElementById("activityFeed");
  
  if (!activities?.length) {
    feed.innerHTML = '<li class="list-group-item text-muted">No recent activity</li>';
    return;
  }

  feed.innerHTML = activities.map(activity => `
    <li class="list-group-item">
      <i class="fas fa-circle small text-success me-2"></i>
      ${activity.action} at ${new Date(activity.timestamp).toLocaleTimeString()}
    </li>
  `).join("");
}

async function loadDocuments() {
  const user = JSON.parse(localStorage.getItem("wms_user"));
  if (!user?.id) return;

  try {
    const documents = await getStaffDocuments(user.id);
    renderDocuments(documents);
  } catch (error) {
    showNotification('Failed to load documents', 'error');
  }
}

function renderDocuments(documents) {
  const container = document.getElementById("documentList");
  
  if (!documents?.length) {
    container.innerHTML = '<p class="text-muted">No documents uploaded yet</p>';
    return;
  }

  container.innerHTML = documents.map(doc => `
    <div class="document-card" data-id="${doc.id}">
      <div class="d-flex align-items-center">
        <div class="document-icon me-3">
          <i class="fas fa-${doc.icon}"></i>
        </div>
        <div class="flex-grow-1">
          <h6 class="mb-1">${doc.name}</h6>
          <small class="text-muted">
            ${new Date(doc.uploaded).toLocaleDateString()} • ${doc.formattedSize}
          </small>
        </div>
        <div class="document-actions">
          <button class="btn btn-sm btn-outline-primary view-document me-1">
            <i class="fas fa-eye"></i>
          </button>
          ${doc.canDelete ? `
          <button class="btn btn-sm btn-outline-danger delete-document">
            <i class="fas fa-trash"></i>
          </button>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  // Add event listeners
  container.querySelectorAll('.view-document').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const docId = e.target.closest('.document-card').dataset.id;
      viewDocument(docId);
    });
  });

  container.querySelectorAll('.delete-document').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const docId = e.target.closest('.document-card').dataset.id;
      deleteDocumentHandler(docId);
    });
  });
}

async function deleteDocumentHandler(docId) {
  const user = JSON.parse(localStorage.getItem("wms_user"));
  if (!user?.id) return;

  if (confirm('Are you sure you want to delete this document?')) {
    try {
      await deleteDocument(user.id, docId);
      showNotification('Document deleted', 'success');
      loadDocuments();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }
}

function viewDocument(docId) {
  const user = JSON.parse(localStorage.getItem("wms_user"));
  const doc = user.documents?.find(d => d.id === docId);
  if (!doc) return;

  if (doc.type.includes('image')) {
    const win = window.open();
    win.document.write(`<img src="${doc.data}" style="max-width:100%">`);
  } else {
    const link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.name;
    link.click();
  }
}

function setupEventListeners() {
  // Form submission
  document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    saveProfileChanges();
  });

  // Document upload
  document.getElementById("documentUpload").addEventListener("change", handleFileUpload);

  // Refresh documents
  document.getElementById("refreshDocuments").addEventListener("click", loadDocuments);
}

async function handleFileUpload(e) {
  if (!e.target.files.length) return;

  const file = e.target.files[0];
  const user = JSON.parse(localStorage.getItem("wms_user"));
  const feedback = document.getElementById("uploadFeedback");
  const progressBar = document.getElementById("uploadProgress");
  const progressInner = progressBar.querySelector('.progress-bar');

  // Show loading state
  feedback.textContent = `Uploading ${file.name}...`;
  feedback.className = 'upload-feedback small mt-2 text-primary';
  progressBar.classList.remove('d-none');

  try {
    const progressInterval = setInterval(() => {
      const currentWidth = parseInt(progressInner.style.width);
      if (currentWidth < 90) {
        progressInner.style.width = `${currentWidth + 10}%`;
      }
    }, 300);

    await uploadDocument(user.id, file);
    
    clearInterval(progressInterval);
    progressInner.style.width = '100%';
    feedback.textContent = 'Upload complete!';
    feedback.className = 'upload-feedback small mt-2 text-success';
    
    showNotification('Document uploaded successfully', 'success');
    loadDocuments();
  } catch (error) {
    progressBar.classList.add('d-none');
    feedback.textContent = error.message;
    feedback.className = 'upload-feedback small mt-2 text-danger';
    showNotification(error.message, 'error');
  } finally {
    setTimeout(() => {
      progressBar.classList.add('d-none');
      feedback.className = 'upload-feedback small mt-2 d-none';
    }, 3000);
    e.target.value = '';
  }
}

function saveProfileChanges() {
  const user = JSON.parse(localStorage.getItem("wms_user")) || {};
  user.name = document.getElementById("fullName").value;
  user.phone = document.getElementById("phone").value;

  localStorage.setItem("wms_user", JSON.stringify(user));
  showNotification("Profile updated successfully", "success");
  loadProfileData();
}