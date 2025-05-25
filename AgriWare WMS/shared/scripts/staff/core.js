import { loadNavbar } from "../ui/navbar.js";
import { generateShifts, autoSchedule } from "./scheduling.js";
import { checkPermission } from "./permissions.js";
import { showNotification } from "../ui/notification.js";
import {
  uploadDocument,
  getStaffDocuments,
  showDocumentModal,
} from "./documents.js";
import {
  initProductivityChart,
  calculateProductivity,
  getAttendanceRate,
} from "./metric.js";
import { loadFooter } from "../ui/footer.js";
import flatpickr from "https://cdn.skypack.dev/flatpickr";
//import Chart from "chart.js/auto"; // Only if you're using ES modules and not a global Chart

// --- AUTO-SYNC ADMIN USER INTO STAFF LIST IF MISSING ---
let currentUser = JSON.parse(localStorage.getItem("wms_user")) || null;
let staff = JSON.parse(localStorage.getItem("staff")) || [];
if (
  currentUser &&
  !staff.find((s) => s.id === currentUser.id)
) {
  staff.push({
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role || "admin",
    status: "active",
    permissions: currentUser.permissions || ["all"],
    skills: [],
    documents: [],
    attendance: {},
    joinDate: new Date().toISOString(),
  });
  localStorage.setItem("staff", JSON.stringify(staff));
}
// --- END AUTO-SYNC ---

// Constants
const STAFF_STORAGE_KEY = "staff";
const SHIFT_STORAGE_KEY = "shifts";
const DEFAULT_ADMIN = {
  id: "ADM-001",
  name: "System Admin",
  email: "admin@agriware.com",
  role: "admin",
  lastActive: new Date().toISOString(),
  status: "active",
  permissions: ["all"],
  skills: [],
  documents: [],
  attendance: {},
  joinDate: new Date().toISOString(),
};

// State management
let staffMembers = loadStaffData();
let attendanceChartInstance = null;
let productivityChartInstance = null;

// Initialize application
document.addEventListener("DOMContentLoaded", initializeApp);

async function initializeApp() {
  try {
    // Allow admin or staff to view, but only admin can manage
    if (!currentUser || !["admin", "staff", "user", "worker"].includes(currentUser.role)) {
      window.location.href = "/shared/401.html";
      return;
    }

    await Promise.all([loadNavbar(), loadFooter()]);

    initializeStaffData();
    renderStaff();
    setupEventListeners();
    setupAdvancedFeatures();
    setupBulkActions();
    initCharts();
    updatePermissionBasedUI();

    showNotification("successfully loaded", "success");
  } catch (error) {
    console.error("Initialization failed:", error);
    showNotification("Failed to initialize staff module", "error");
  }
}

function initCharts() {
  // Productivity Chart
  const productivityCanvas = document.getElementById("productivityChart");
  if (productivityCanvas) {
    // Destroy any existing chart instance on this canvas
    const existing = Chart.getChart(productivityCanvas);
    if (existing) existing.destroy();

    // Create new chart and store reference
    productivityChartInstance = new Chart(productivityCanvas, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "Productivity",
          data: [80, 85, 78, 90, 88, 92, 87],
          borderColor: "#3a86ff",
          backgroundColor: "rgba(58,134,255,0.18)",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#3a86ff",
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 3,
          tension: 0.4
        }]
      },
      options: {
        plugins: { legend: { labels: { color: "#f8f9fa" } } },
        scales: {
          x: { ticks: { color: "#f8f9fa" }, grid: { color: "#2a2a2a" } },
          y: { ticks: { color: "#f8f9fa" }, grid: { color: "#2a2a2a" }, beginAtZero: true, max: 100 }
        }
      }
    });
  }

  // Attendance Chart
  const attendanceCanvas = document.getElementById("attendanceChart");
  if (attendanceCanvas) {
    // Destroy any existing chart instance on this canvas
    const existing = Chart.getChart(attendanceCanvas);
    if (existing) existing.destroy();

    attendanceChartInstance = new Chart(attendanceCanvas, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "Attendance",
          data: [95, 92, 97, 93, 96, 94, 98],
          borderColor: "#ffd166",
          backgroundColor: "rgba(255,209,102,0.18)",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#ffd166",
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 3,
          tension: 0.4
        }]
      },
      options: {
        plugins: { legend: { labels: { color: "#f8f9fa" } } },
        scales: {
          x: { ticks: { color: "#f8f9fa" }, grid: { color: "#2a2a2a" } },
          y: { ticks: { color: "#f8f9fa" }, grid: { color: "#2a2a2a" }, beginAtZero: true, max: 100 }
        }
      }
    });
  }
}

function updatePermissionBasedUI() {
  // Hide buttons based on permissions
  const permissionElements = {
    add_staff: "addStaffBtn",
    export_data: "exportStaff",
    import_data: "importStaff",
    manage_shifts: "manageShiftsBtn",
    auto_schedule: "autoScheduleBtn",
  };

  Object.entries(permissionElements).forEach(([permission, elementId]) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = checkPermission(currentUser.id, permission)
        ? ""
        : "none";
    }
  });

  // Update role badge
  const roleBadge = document.getElementById("roleBadge");
  if (roleBadge && currentUser) {
    roleBadge.textContent = currentUser.role.toUpperCase();
    roleBadge.className = `badge rounded-pill p-2 bg-${currentUser.role}`;
  }
}

function loadStaffData() {
  try {
    const data = JSON.parse(localStorage.getItem(STAFF_STORAGE_KEY)) || [];
    return data.map((staff) => ({
      ...DEFAULT_ADMIN,
      ...staff,
      skills: staff.skills || [],
      documents: staff.documents || [],
      attendance: staff.attendance || {},
      joinDate: staff.joinDate || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error loading staff data:", error);
    return [];
  }
}

function initializeStaffData() {
  if (staffMembers.length === 0 && currentUser) {
    staffMembers = [DEFAULT_ADMIN];
    saveStaffData();
  }

  // Initialize shift data if empty
  if (!localStorage.getItem(SHIFT_STORAGE_KEY)) {
    generateShifts();
  }
}

function setupAdvancedFeatures() {
  // Document upload
  document
    .getElementById("staffDocument")
    ?.addEventListener("change", handleDocumentUpload);

  // Attendance management
  document.getElementById("attendanceLink")?.addEventListener("click", () => {
    if (checkPermission(currentUser.id, "view_attendance")) {
      document.getElementById("attendanceModal").style.display = "block";
      loadAttendanceData();
    } else {
      showNotification(
        "You don't have permission to view attendance",
        "warning"
      );
    }
  });

  // Auto-schedule button
  document.getElementById("autoScheduleBtn")?.addEventListener("click", () => {
    if (checkPermission(currentUser.id, "manage_shifts")) {
      autoSchedule();
      renderStaff();
      showNotification("Shifts auto-scheduled successfully", "success");
    }
  });
}

function setupBulkActions() {
  const table = document.getElementById("staffTable");
  const bulkBar = document.querySelector(".bulk-actions-bar");

  if (!table) return; // Prevent errors if not on staff page

  // Select all checkbox
  document.getElementById("selectAll")?.addEventListener("change", (e) => {
    const checkboxes = table.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => (checkbox.checked = e.target.checked));
    updateBulkActions();
  });

  // Bulk actions
  document
    .getElementById("bulkDeleteBtn")
    ?.addEventListener("click", handleBulkDelete);
  document
    .getElementById("bulkStatusBtn")
    ?.addEventListener("click", handleBulkStatusChange);
  document
    .getElementById("bulkEditBtn")
    ?.addEventListener("click", handleBulkEdit);

  // Table row selection
  table.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") {
      updateBulkActions();
    }
  });
}

function handleBulkDelete() {
  if (!checkPermission(currentUser.id, "bulk_delete_staff")) {
    showNotification("Permission denied", "error");
    return;
  }
  const selected = getSelectedStaffIds();
  if (
    selected.length > 0 &&
    confirm(`Delete ${selected.length} selected staff members?`)
  ) {
    staffMembers = staffMembers.filter((staff) => !selected.includes(staff.id));
    saveStaffData();
    renderStaff();
    showNotification(`${selected.length} staff members deleted`, "success");
  }
}

function handleBulkStatusChange() {
  const selected = getSelectedStaffIds();
  if (selected.length > 0) {
    const newStatus = prompt("Set status (active/inactive):", "active");
    if (newStatus && ["active", "inactive"].includes(newStatus.toLowerCase())) {
      staffMembers = staffMembers.map((staff) =>
        selected.includes(staff.id)
          ? { ...staff, status: newStatus.toLowerCase() }
          : staff
      );
      saveStaffData();
      renderStaff();
      showNotification(
        `Updated status for ${selected.length} staff`,
        "success"
      );
    }
  }
}

function handleBulkEdit() {
  const selected = getSelectedStaffIds();
  if (selected.length > 0) {
    showNotification("Bulk edit is not yet implemented", "info");
  }
}

function updateBulkActions() {
  const selectedCount = getSelectedStaffIds().length;
  const bulkBar = document.querySelector(".bulk-actions-bar");

  document.getElementById(
    "selectedCount"
  ).textContent = `${selectedCount} selected`;
  document.getElementById("bulkDeleteBtn").disabled = selectedCount === 0;
  document.getElementById("bulkStatusBtn").disabled = selectedCount === 0;
  document.getElementById("bulkEditBtn").disabled = selectedCount === 0;

  bulkBar.style.display = selectedCount > 0 ? "block" : "none";
}

function getSelectedStaffIds() {
  return Array.from(
    document.querySelectorAll('#staffTable input[type="checkbox"]:checked')
  )
    .map((checkbox) => checkbox.closest("tr").dataset.id)
    .filter(Boolean);
}

function updateStaffMetrics() {
  const total = staffMembers.length;
  const active = staffMembers.filter(s => s.status === "active").length;
  // Example: Understaffed departments (customize as needed)
  const departments = ["inventory", "shipping", "receiving", "quality"];
  const deptCounts = {};
  staffMembers.forEach(s => {
    if (s.department) {
      deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
    }
  });
  const understaffed = departments.filter(d => (deptCounts[d] || 0) < 2).length;

  document.getElementById("totalStaff").textContent = total;
  document.getElementById("activeStaff").textContent = active;
  document.getElementById("understaffed").textContent = understaffed;
}

// Call this after renderStaff()
function renderStaff(filteredStaff = null) {
  const tbody = document.querySelector("#staffTable tbody");
  if (!tbody) return;

  const dataToRender = filteredStaff || staffMembers;

  tbody.innerHTML = dataToRender
    .map(
      (staff) => `
    <tr data-id="${staff.id}">
      <td><input type="checkbox" class="staff-checkbox"></td>
      <td>${staff.id}</td>
      <td>${staff.name}</td>
      <td class="role-${staff.role}">${formatRole(staff.role)}</td>
      <td>${staff.email}</td>
      <td>${formatDate(staff.lastActive)}</td>
      <td class="status-${staff.status}">
        ${formatStatus(staff.status)}
        ${
          staff.status === "active"
            ? `
          <span class="badge bg-success ms-2">${getAttendanceRate(
            staff.id
          )}%</span>
          <span class="badge bg-info ms-1">${calculateProductivity(
            staff.id
          )}%</span>
        `
            : ""
        }
      </td>
      <td class="action-buttons">
        <button class="btn-edit" data-id="${staff.id}" ${
        !checkPermission(currentUser.id, "edit_staff") ? "disabled" : ""
      }>
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-delete" data-id="${staff.id}" ${
        !checkPermission(currentUser.id, "delete_staff") ? "disabled" : ""
      }>
          <i class="fas fa-trash"></i>
        </button>
        <button class="btn-documents" data-id="${staff.id}" ${
        !checkPermission(currentUser.id, "view_documents") ? "disabled" : ""
      }>
          <i class="fas fa-folder"></i>
        </button>
        <button class="btn-shifts" data-id="${staff.id}" ${
        !checkPermission(currentUser.id, "manage_shifts") ? "disabled" : ""
      }>
          <i class="fas fa-calendar-alt"></i>
        </button>
      </td>
    </tr>
  `
    )
    .join("");

  // Add event listeners
  const addListeners = (selector, handler) => {
    tbody.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener("click", (e) =>
        handler(e.target.closest("button").dataset.id)
      );
    });
  };

  addListeners(".btn-edit", handleEditStaff);
  addListeners(".btn-delete", handleDeleteStaff);
  addListeners(".btn-documents", viewStaffDocuments);
  addListeners(".btn-shifts", viewStaffShifts);

  updateStaffMetrics();
}

function setupEventListeners() {
  const staffForm = document.getElementById("staffForm");
  if (staffForm) {
    staffForm.onsubmit = function (e) {
      e.preventDefault();
      const form = e.target;
      const isEdit = !!form.dataset.editId;

      const staffData = {
        name: form.staffFirstName.value.trim() + " " + form.staffLastName.value.trim(),
        email: form.staffEmail.value.trim(),
        role: form.staffRole.value,
        department: form.staffDepartment.value,
        skills: Array.from(form.querySelectorAll('input[name="skills"]:checked')).map(cb => cb.value),
        lastUpdated: new Date().toISOString(),
      };

      if (!validateStaffForm(staffData, isEdit)) return;

      if (isEdit) {
        updateStaff(form.dataset.editId, staffData);
      } else {
        addStaff(staffData);
      }
      document.getElementById("addStaffFormContainer").classList.add("d-none");
    };
  }

  const addStaffBtn = document.getElementById("addStaffBtn");
  if (addStaffBtn) {
    addStaffBtn.onclick = function() {
      document.getElementById("addStaffFormContainer").classList.remove("d-none");
      document.getElementById("staffForm").reset();
      document.getElementById("staffForm").removeAttribute("data-edit-id");
      document.getElementById("saveStaffBtn").querySelector(".submit-text").textContent = "Save Staff";
    };
  }

  const cancelAddStaff = document.getElementById("cancelAddStaff");
  if (cancelAddStaff) {
    cancelAddStaff.onclick = () => {
      document.getElementById("addStaffFormContainer").classList.add("d-none");
    };
  }
}

// Search
document.getElementById("staffSearch")?.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = staffMembers.filter(
    (staff) =>
      staff.name.toLowerCase().includes(term) ||
      staff.email.toLowerCase().includes(term) ||
      staff.id.toLowerCase().includes(term) ||
      staff.role.toLowerCase().includes(term)
  );
  renderStaff(filtered);
});

// Refresh
document.getElementById("refreshData")?.addEventListener("click", () => {
  staffMembers = loadStaffData();
  renderStaff();
  showNotification("Data refreshed", "success");
});

// Export
document
  .getElementById("exportStaff")
  ?.addEventListener("click", exportStaffData);

// Import
document
  .getElementById("importStaff")
  ?.addEventListener("click", importStaffData);

// Shift modal actions
document.getElementById("shiftModal")?.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-shift")) {
    const shiftId = e.target.dataset.shiftId;
    const staffId = e.target.dataset.staffId;
    removeShift(staffId, shiftId);
  }
});

document.getElementById("assignShiftForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const staffId = form.dataset.staffId;
  const date = form.querySelector(".shift-date").value;
  const hours = form.querySelector('input[type="number"]').value;
  const notes = form.querySelector("textarea").value;

  assignNewShift(staffId, date, hours, notes);
});

function openStaffModal() {
  if (!checkPermission(currentUser.id, "add_staff")) {
    showNotification("You don't have permission to add staff", "error");
    return;
  }
  const form = document.getElementById("staffForm");
  form.reset();
  form.removeAttribute("data-edit-id");
  form.querySelector('button[type="submit"]').textContent = "Add Staff";
  // Use Bootstrap Modal API
  const modal = new bootstrap.Modal(document.getElementById("staffModal"));
  modal.show();
}

function closeStaffModal() {
  // Use Bootstrap Modal API
  const modalEl = document.getElementById("staffModal");
  const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modal.hide();
}

function handleDocumentUpload(e) {
  const file = e.target.files[0];
  const staffId = document.querySelector("#staffTable tr.selected")?.dataset.id;

  if (file && staffId) {
    uploadDocument(staffId, file)
      .then(() => {
        showNotification("Document uploaded successfully", "success");
        renderStaff();
      })
      .catch((err) => showNotification(err.message, "error"));
  }
}

function viewStaffDocuments(staffId) {
  const staff = staffMembers.find((s) => s.id === staffId);
  if (staff) {
    const docs = getStaffDocuments(staffId);
    showDocumentModal(staffId, staff.name, docs);
  }
}

function viewStaffShifts(staffId) {
  const shifts = JSON.parse(localStorage.getItem("shifts")) || [];
  const staffShifts = shifts.filter((shift) => shift.staffId === staffId);
  const staff = staffMembers.find((s) => s.id === staffId);

  if (staffShifts.length > 0) {
    const modalContent = `
      <div class="shift-management">
        <h4>Current Shifts for ${staff.name}</h4>
        ${staffShifts
          .map(
            (shift) => `
          <div class="shift-item mb-3 p-3 border rounded">
            <h5>${new Date(shift.start).toLocaleString()}</h5>
            <p><strong>Duration:</strong> ${shift.hours} hours</p>
            ${
              shift.notes ? `<p><strong>Notes:</strong> ${shift.notes}</p>` : ""
            }
            <button class="btn btn-sm btn-danger remove-shift" 
                    data-shift-id="${shift.id}" 
                    data-staff-id="${staffId}">
              Remove Shift
            </button>
          </div>
        `
          )
          .join("")}
        
        <hr>
        <h5>Assign New Shift</h5>
        <form id="assignShiftForm" data-staff-id="${staffId}">
          <div class="mb-3">
            <label class="form-label">Date</label>
            <input type="datetime-local" class="form-control shift-date" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Duration (hours)</label>
            <input type="number" class="form-control" min="1" max="12" value="8" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Notes</label>
            <textarea class="form-control"></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Assign Shift</button>
        </form>
      </div>
    `;

    document.getElementById("shiftModalContent").innerHTML = modalContent;
    document.getElementById("shiftModal").style.display = "block";

    // Initialize date picker
    flatpickr(".shift-date", {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
      minDate: "today",
    });
  } else {
    showNotification("No shifts scheduled for this staff member", "info");
  }
}

// document.getElementById("staffForm").onsubmit = function (e) {
//   e.preventDefault();
//   // Collect form data, validate, add staff to localStorage, update table, etc.
//   // ...
//   document.getElementById("addStaffFormContainer").classList.add("d-none");
// };

// function handleStaffFormSubmit(e) {
//   e.preventDefault();
//   const form = e.target;
//   const isEdit = !!form.dataset.editId;

//   const staffData = {
//     name: form.staffFirstName.value.trim() + " " + form.staffLastName.value.trim(),
//     email: form.staffEmail.value.trim(),
//     role: form.staffRole.value,
//     department: form.staffDepartment.value,
//     skills: Array.from(form.querySelectorAll('input[name="skills"]:checked')).map(cb => cb.value),
//     lastUpdated: new Date().toISOString(),
//   };

//   if (!validateStaffForm(staffData, isEdit)) return;

//   if (isEdit) {
//     updateStaff(form.dataset.editId, staffData);
//   } else {
//     addStaff(staffData);
//   }
// }

function validateStaffForm(data, isEdit = false) {
  if (!data.name || data.name.length < 2) {
    showNotification("Name must be at least 2 characters", "warning");
    return false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    showNotification("Please enter a valid email", "warning");
    return false;
  }

  if (!isEdit && staffMembers.some((s) => s.email === data.email)) {
    showNotification("Email already exists", "warning");
    return false;
  }

  return true;
}

function addStaff(data) {
  const newStaff = {
    id: generateStaffId(),
    ...data,
    status: "active",
    lastActive: new Date().toISOString(),
    documents: [],
    attendance: {},
    joinDate: new Date().toISOString(),
  };

  staffMembers.push(newStaff);
  saveStaffData();
  renderStaff();
  closeStaffModal();
  showNotification(`${data.name} added successfully`, "success");
}

function updateStaff(id, data) {
  staffMembers = staffMembers.map((staff) =>
    staff.id === id ? { ...staff, ...data } : staff
  );

  saveStaffData();
  renderStaff();
  closeStaffModal();
  showNotification("Staff updated successfully", "success");
}

function handleEditStaff(staffId) {
  if (!checkPermission(currentUser.id, "edit_staff")) {
    showNotification("You don't have permission to edit staff", "error");
    return;
  }

  const staff = staffMembers.find((s) => s.id === staffId);
  if (!staff) return;

  // Split name into first and last for the form
  const [firstName, ...lastNameArr] = staff.name.split(" ");
  document.getElementById("staffFirstName").value = firstName || "";
  document.getElementById("staffLastName").value = lastNameArr.join(" ") || "";
  document.getElementById("staffEmail").value = staff.email;
  document.getElementById("staffRole").value = staff.role;
  document.getElementById("staffDepartment").value = staff.department || "";

  // Set skills
  document.querySelectorAll('input[name="skills"]').forEach((checkbox) => {
    checkbox.checked = staff.skills?.includes(checkbox.value) || false;
  });

  // Set edit mode
  const form = document.getElementById("staffForm");
  form.dataset.editId = staffId;
  document.getElementById("saveStaffBtn").querySelector(".submit-text").textContent = "Update Staff";
  document.getElementById("addStaffFormContainer").classList.remove("d-none");
}

function handleDeleteStaff(staffId) {
  if (!checkPermission(currentUser.id, "delete_staff")) {
    showNotification("You don't have permission to delete staff", "error");
    return;
  }

  if (!confirm("Are you sure you want to delete this staff member?")) return;

  staffMembers = staffMembers.filter((staff) => staff.id !== staffId);
  saveStaffData();
  renderStaff();

  showNotification("Staff member deleted", "success");
}

function toggleShiftPanel() {
  const panel = document.getElementById("shiftPanel");
  panel.classList.toggle("active");

  if (panel.classList.contains("active")) {
    initDatePickers();
    loadShiftData();
  }
}

function initDatePickers() {
  flatpickr(".shift-date", {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    minDate: "today",
    minuteIncrement: 15,
    locale: "default",
  });
}

function loadShiftData() {
  const shifts = JSON.parse(localStorage.getItem("shifts")) || [];
  const container = document.getElementById("shiftContainer");

  container.innerHTML =
    shifts.length > 0
      ? shifts
          .map(
            (shift) => `
        <div class="shift-card mb-3">
          <div class="d-flex justify-content-between">
            <h4 class="mb-1">${shift.staffName} (${shift.role})</h4>
            <button class="btn btn-sm btn-danger delete-shift" data-id="${
              shift.id
            }">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <p class="mb-1"><strong>Date:</strong> ${new Date(
            shift.start
          ).toLocaleString()}</p>
          <p class="mb-1"><strong>Duration:</strong> ${shift.hours} hours</p>
          ${
            shift.notes
              ? `<p class="mb-0"><strong>Notes:</strong> ${shift.notes}</p>`
              : ""
          }
        </div>
      `
          )
          .join("")
      : '<div class="alert alert-info">No shifts scheduled</div>';
}

function exportStaffData() {
  if (!checkPermission(currentUser.id, "export_data")) {
    showNotification("You don't have permission to export data", "error");
    return;
  }

  const csv = [
    [
      "ID",
      "Name",
      "Email",
      "Role",
      "Status",
      "Last Active",
      "Join Date",
      "Skills",
    ],
    ...staffMembers.map((s) => [
      s.id,
      s.name,
      s.email,
      s.role,
      s.status,
      s.lastActive,
      s.joinDate || "N/A",
      s.skills?.join("; ") || "None",
    ]),
  ]
    .map((row) =>
      row.map((field) => `"${field.toString().replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `staff_export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function importStaffData() {
  if (!checkPermission(currentUser.id, "import_data")) {
    showNotification("You don't have permission to import data", "error");
    return;
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv,.json";

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        let importedData = [];

        if (file.name.endsWith(".json")) {
          importedData = JSON.parse(content);
        } else {
          // Simple CSV parsing (for demonstration)
          const lines = content.split("\n").slice(1); // Skip header
          importedData = lines
            .filter((line) => line.trim())
            .map((line) => {
              const [
                id,
                name,
                email,
                role,
                status,
                lastActive,
                joinDate,
                skills,
              ] = line.split(",");
              return {
                id: id.replace(/"/g, ""),
                name: name.replace(/"/g, ""),
                email: email.replace(/"/g, ""),
                role: role.replace(/"/g, ""),
                status: status.replace(/"/g, ""),
                lastActive: lastActive.replace(/"/g, ""),
                joinDate: joinDate.replace(/"/g, ""),
                skills:
                  skills
                    ?.replace(/"/g, "")
                    .split(";")
                    .map((s) => s.trim()) || [],
              };
            });
        }

        if (
          confirm(
            `Import ${importedData.length} staff members? This will overwrite existing data.`
          )
        ) {
          staffMembers = importedData;
          saveStaffData();
          renderStaff();
          showNotification(
            `${importedData.length} staff members imported`,
            "success"
          );
        }
      } catch (error) {
        console.error("Import failed:", error);
        showNotification(
          "Failed to import data. Please check the file format.",
          "error"
        );
      }
    };
    reader.readAsText(file);
  };

  input.click();
}

// Utility functions
function generateStaffId() {
  const prefix = "STAFF-";
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return prefix + randomNum;
}

function formatDate(dateString) {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? "Invalid date" : date.toLocaleString();
}

function formatRole(role) {
  const roles = {
    admin: "Administrator",
    supervisor: "Supervisor",
    manager: "Manager",
    worker: "Worker",
    driver: "Driver",
    technician: "Technician",
  };
  return roles[role] || role.charAt(0).toUpperCase() + role.slice(1);
}

function formatStatus(status) {
  return status === "active" ? "Active" : "Inactive";
}

// Attendance functions
function loadAttendanceData() {
  const container = document.getElementById("attendanceContainer");
  const attendanceData = staffMembers.map((staff) => ({
    id: staff.id,
    name: staff.name,
    attendance: staff.attendance || {},
  }));

  container.innerHTML = attendanceData
    .map(
      (staff) => `
    <div class="attendance-item">
      <h4>${staff.name} (${staff.id})</h4>
      <p>Last 7 days: ${calculateRecentAttendance(staff.attendance)}%</p>
      <canvas id="attendanceChart-${
        staff.id
      }" width="400" height="200"></canvas>
    </div>
  `
    )
    .join("");
}

function calculateRecentAttendance(attendance) {
  // Implementation would calculate attendance rate for recent period
  return Math.floor(Math.random() * 40 + 60); // Mock data
}

function removeShift(staffId, shiftId) {
  if (!checkPermission(currentUser.id, "manage_shifts")) {
    showNotification("You don't have permission to remove shifts", "error");
    return;
  }

  const shifts = JSON.parse(localStorage.getItem("shifts")) || [];
  const updatedShifts = shifts.filter((shift) => shift.id !== shiftId);

  localStorage.setItem("shifts", JSON.stringify(updatedShifts));
  renderStaff();
  showNotification("Shift removed successfully", "success");

  // Refresh the shift modal
  viewStaffShifts(staffId);
}

function assignNewShift(staffId, date, hours, notes = "") {
  if (!checkPermission(currentUser.id, "manage_shifts")) {
    showNotification("You don't have permission to assign shifts", "error");
    return;
  }

  const staff = staffMembers.find((s) => s.id === staffId);
  if (!staff) {
    showNotification("Staff member not found", "error");
    return;
  }

  const shifts = JSON.parse(localStorage.getItem("shifts")) || [];
  const newShift = {
    id: `shift-${Date.now()}`,
    staffId,
    staffName: staff.name,
    role: staff.role,
    start: date,
    hours: parseInt(hours),
    notes,
    assignedBy: currentUser.id,
    assignedAt: new Date().toISOString(),
  };

  shifts.push(newShift);
  localStorage.setItem("shifts", JSON.stringify(shifts));
  renderStaff();
  showNotification("Shift assigned successfully", "success");

  // Refresh the shift modal
  viewStaffShifts(staffId);
}

export function canUserModifyDocument(
  document,
  user = JSON.parse(localStorage.getItem("wms_user"))
) {
  console.log("Checking permissions for user:", user, "on document:", document);
  if (user?.role === "admin") return true;
  return document.uploadedBy === user?.id;
}

// Export functions that need to be available to other modules
export function getStaffMembers() {
  return staffMembers;
}

export function getCurrentUser() {
  return currentUser;
}

export function saveStaffData() {
  try {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffMembers));
    return true;
  } catch (error) {
    console.error("Failed to save staff data:", error);
    showNotification(
      "Failed to save staff data. Storage might be full.",
      "error"
    );
    return false;
  }
}
