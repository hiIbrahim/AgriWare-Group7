import { loadNavbar } from "../ui/navbar.js";
import {
  calculateSupplierMetrics,
  flagUnderperformers,
} from "./performance.js";
import { checkBlacklist, blacklistSupplier } from "./blacklist.js";
import { loadFooter } from "../ui/footer.js";

let suppliers = JSON.parse(localStorage.getItem("suppliers")) || [];

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();
  loadFooter();
  renderSuppliers();
  setupEventListeners();

  // Initialize Select2 for multi-select
  if ($) {
    $("#supCategories").select2({
      placeholder: "Select categories",
      width: "100%",
    });
  }
});

function renderSuppliers(filteredSuppliers = null) {
  const tbody = document.querySelector("#suppliersTable tbody");
  tbody.innerHTML = "";

  const demoOrders = [
    {
      supplierId: suppliers[0]?.id,
      status: "delivered",
      onTime: true,
      qualityIssues: false,
    },
    {
      supplierId: suppliers[1]?.id,
      status: "delivered",
      onTime: false,
      qualityIssues: true,
    },
  ];

  const dataToRender = filteredSuppliers || suppliers;
  const metrics = calculateSupplierMetrics(dataToRender, demoOrders);
  const enhancedSuppliers = flagUnderperformers(metrics).map((supplier) => ({
    ...supplier,
    isBlacklisted: checkBlacklist(supplier.id),
  }));

  enhancedSuppliers.forEach((supplier) => {
    const row = document.createElement("tr");
    if (supplier.isBlacklisted) row.classList.add("blacklisted");

    row.innerHTML = `
      <td>${supplier.id}</td>
      <td>${supplier.name}</td>
      <td>
        ${supplier.contactPerson ? `<strong>${supplier.contactPerson}</strong><br>` : ""}
        ${supplier.email}<br>
        ${supplier.phone || "N/A"}
      </td>
      <td>${supplier.products || "-"}</td>
      <td>
        <div class="performance-gauge">
          <div class="gauge-fill" style="width: ${supplier.onTimeRate || 0}%"></div>
          <span>${supplier.onTimeRate || 0}% On-Time</span>
        </div>
        <small>${supplier.orderCount || 0} orders</small>
      </td>
      <td>${supplier.lastUpdated ? new Date(supplier.lastUpdated).toLocaleDateString() : "N/A"}</td>
      <td class="status-cell">
        ${
          supplier.isBlacklisted
            ? '<span class="status-badge blacklisted">Blacklisted</span>'
            : supplier.underperforming
            ? '<span class="status-badge warning">Needs Review</span>'
            : '<span class="status-badge active">Active</span>'
        }
      </td>
      <td class="action-buttons">
        <button class="btn-edit" data-id="${supplier.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-delete" data-id="${supplier.id}">
          <i class="fas fa-trash"></i>
        </button>
        ${
          !supplier.isBlacklisted
            ? `
        <button class="btn-blacklist" data-id="${supplier.id}">
          <i class="fas fa-ban"></i> Blacklist
        </button>
        <button class="btn btn-success btn-order"
          data-supid="${supplier.id}"
          data-supname="${supplier.name}"
          data-supcontact="${supplier.email || supplier.phone || ''}">
          <i class="fas fa-cart-plus"></i> Create Order
        </button>
      `
            : ""
        }
      </td>
    `;
    tbody.appendChild(row);
  });

  // Update total suppliers dynamically
  document.getElementById("totalSuppliers").textContent = (filteredSuppliers || suppliers).length;
}

function setupEventListeners() {
  // Add supplier button
  document.getElementById("addSupplierBtn").addEventListener("click", () => {
    const supplierModal = new bootstrap.Modal(document.getElementById("supplierModal"));
    supplierModal.show();
  });

  // Form submission
  document.getElementById("supplierForm").addEventListener("submit", (e) => {
    e.preventDefault();
    addSupplier();
  });

  // Close modal
  //document.querySelector(".close").addEventListener("click", closeModal);
  document
    .getElementById("cancelSupplierBtn")
    .addEventListener("click", closeModal);
  document.getElementById("closeSupplierModal").addEventListener("click", closeModal);

  // Search functionality
  document.getElementById("supplierSearch").addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.products?.toLowerCase().includes(term)
    );
    renderSuppliers(filtered);
  });

  // Export functionality
  document
    .getElementById("exportSuppliers")
    .addEventListener("click", exportSuppliers);

  // Action buttons (edit, delete, blacklist)
  document.querySelector("#suppliersTable tbody").addEventListener("click", (e) => {
    const orderBtn = e.target.closest(".btn-order");
    if (orderBtn) {
      sessionStorage.setItem("selectedSupplierId", orderBtn.dataset.supid);
      sessionStorage.setItem("selectedSupplierName", orderBtn.dataset.supname);
      sessionStorage.setItem("selectedSupplierContact", orderBtn.dataset.supcontact); // <-- add this
      window.location.href = "/orders/new.html";
      return;
    }

    const editBtn = e.target.closest(".btn-edit");
    const deleteBtn = e.target.closest(".btn-delete");
    const blacklistBtn = e.target.closest(".btn-blacklist");

    if (editBtn) {
      const supplierId = editBtn.dataset.id;
      editSupplier(supplierId);
    }
    if (deleteBtn) {
      const supplierId = deleteBtn.dataset.id;
      if (confirm("Are you sure you want to delete this supplier?")) {
        suppliers = suppliers.filter(s => s.id !== supplierId);
        localStorage.setItem("suppliers", JSON.stringify(suppliers));
        localStorage.setItem("wms_suppliers", JSON.stringify(suppliers)); // <-- always sync!
        renderSuppliers();
      }
    }
    if (blacklistBtn) {
      const supplierId = blacklistBtn.dataset.id;
      const reason = prompt("Reason for blacklisting:");
      if (reason) {
        blacklistSupplier(supplierId, reason, "System");
        renderSuppliers();
      }
    }
  });
}

function closeModal() {
  const supplierModal = bootstrap.Modal.getInstance(document.getElementById("supplierModal"));
  if (supplierModal) supplierModal.hide();
  document.getElementById("supplierForm").reset();
}

function addSupplier() {
  const selectedCategories = Array.from(
    document.getElementById("supCategories").selectedOptions
  ).map((option) => option.value);

  const newSupplier = {
    id: generateId(),
    name: document.getElementById("supName").value,
    email: document.getElementById("supEmail").value,
    phone: document.getElementById("supPhone").value,
    contactPerson: document.getElementById("supContact").value, // <-- THIS LINE
    products: document.getElementById("supProducts").value,
    status: "Active",
    lastUpdated: new Date().toISOString(),
    averageLeadTime:
      parseInt(document.getElementById("supLeadTime").value) || 7,
    certifiedCategories: selectedCategories,
  };

  suppliers.push(newSupplier);
  localStorage.setItem("suppliers", JSON.stringify(suppliers));
  localStorage.setItem("wms_suppliers", JSON.stringify(suppliers)); // <-- always sync!
  renderSuppliers();
  closeModal();
}

function exportSuppliers() {
  const headers = ["ID", "Name", "Email", "Phone", "Products", "Status"];
  const csvContent = [
    headers.join(","),
    ...suppliers.map((s) =>
      [
        s.id,
        `"${s.name}"`,
        s.email,
        s.phone || "",
        `"${s.products || ""}"`,
        s.isBlacklisted ? "Blacklisted" : "Active",
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `suppliers_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function generateId() {
  return "SUP-" + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function editSupplier(supplierId) {
  const supplier = suppliers.find(s => s.id === supplierId);
  if (!supplier) return;
  document.getElementById("supName").value = supplier.name;
  document.getElementById("supEmail").value = supplier.email;
  document.getElementById("supPhone").value = supplier.phone || "";
  document.getElementById("supProducts").value = supplier.products || "";
  document.getElementById("supLeadTime").value = supplier.averageLeadTime || 7;
  $("#supCategories").val(supplier.certifiedCategories || []).trigger("change");
  const supplierModal = new bootstrap.Modal(document.getElementById("supplierModal"));
  supplierModal.show();

  document.getElementById("supplierForm").onsubmit = function (e) {
    e.preventDefault();
    supplier.name = document.getElementById("supName").value;
    supplier.email = document.getElementById("supEmail").value;
    supplier.phone = document.getElementById("supPhone").value;
    supplier.products = document.getElementById("supProducts").value;
    supplier.averageLeadTime = parseInt(document.getElementById("supLeadTime").value) || 7;
    supplier.certifiedCategories = Array.from(document.getElementById("supCategories").selectedOptions).map(opt => opt.value);
    supplier.lastUpdated = new Date().toISOString();
    localStorage.setItem("suppliers", JSON.stringify(suppliers));
    localStorage.setItem("wms_suppliers", JSON.stringify(suppliers)); // <-- always sync!
    renderSuppliers();
    closeModal();
    document.getElementById("supplierForm").onsubmit = null;
    document.getElementById("supplierForm").addEventListener("submit", (ev) => {
      ev.preventDefault();
      addSupplier();
    }, { once: true });
  };
}

// Call this function whenever you add/edit/delete suppliers
function saveSuppliersToStorage(suppliers) {
  localStorage.setItem("wms_suppliers", JSON.stringify(suppliers));
}

// Example usage after adding a supplier:
// const suppliers = getSuppliersFromTableOrForm();
// saveSuppliersToStorage(suppliers);
