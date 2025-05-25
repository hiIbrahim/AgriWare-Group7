import { loadNavbar } from "../ui/navbar.js";
import { checkLowStock, checkExpiringItems, getLowStockItems } from "./alerts.js";
import { predictStockouts } from "./forecasting.js";
import {
  linkItemsToSuppliers,
  getAlternativeSuppliers,
} from "../inventory/supplierlink.js";
import {
  generatePurchaseOrders,
  calculateReorderPoints,
} from "./replenishment.js";
import { showNotification } from "../ui/notification.js";
import { getPendingOrders } from "../orders/core.js";
import { loadFooter } from "../ui/footer.js";

let inventory = JSON.parse(localStorage.getItem("wms_products")) || [];

export function updateAllRoleBadges() {
  const user = JSON.parse(localStorage.getItem("wms_user"));
  const headerBadge = document.getElementById("roleBadgeHeader");
  if (headerBadge && user) {
    headerBadge.innerHTML = `
      <i class="fas fa-${
        user.role === "admin"
          ? "user-shield"
          : user.role === "staff"
          ? "user-tie"
          : user.role === "worker"
          ? "hard-hat"
          : "user"
      } me-1"></i>
      ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
    `;
    headerBadge.className = `badge ${
      user.role === "admin"
        ? "bg-danger"
        : user.role === "staff"
        ? "bg-primary"
        : user.role === "worker"
        ? "bg-warning"
        : "bg-secondary"
    } text-white fs-6`;
  }
}

export function populateSupplierDropdown() {
  const supplierSelect = document.getElementById("prodSupplier");
  if (!supplierSelect) return;
  supplierSelect.innerHTML = `<option value="">Select Supplier</option>`;
  const suppliers = JSON.parse(localStorage.getItem("suppliers")) || [];
  suppliers.forEach((s) => {
    supplierSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
  });
}

export async function loadInventoryData() {
  const products = JSON.parse(localStorage.getItem("wms_products")) || [];
  inventory = products;
  renderInventory();
  updateMetrics();
}

export function renderInventory(filteredItems = null) {
  const suppliers = JSON.parse(localStorage.getItem("suppliers")) || [];
  const dataToRender = filteredItems || inventory;
  const enhancedInventory = predictStockouts(
    calculateReorderPoints(linkItemsToSuppliers(dataToRender, suppliers))
  );

  const tbody = document.querySelector("#inventoryTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  enhancedInventory.forEach((product) => {
    const pendingQty = getPendingOrders()
      .flatMap((o) => o.items)
      .filter((oi) => oi.id === product.id)
      .reduce((sum, oi) => sum + oi.quantity, 0);

    const row = document.createElement("tr");
    row.dataset.id = product.id;
    row.innerHTML = `
      <td><input type="checkbox" class="product-checkbox" data-id="${product.id}"></td>
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>${product.expiryDate || "N/A"}</td>
      <td>${product.category}</td>
      <td class="${
        product.quantity < (product.reorderPoint || 5) ? "text-danger fw-bold" : ""
      }">
        ${product.quantity}
        ${
          pendingQty > 0
            ? `<span class="pending-qty" title="Pending orders">+${pendingQty}</span>`
            : ""
        }
        ${
          product.stockoutRisk
            ? `<span class="stock-warning" title="Predicted to stock out in ${product.daysRemaining} days">
            <i class="fas fa-exclamation-triangle"></i>
          </span>`
            : ""
        }
      </td>
      <td>$${product.price !== undefined && !isNaN(product.price) ? Number(product.price).toFixed(2) : "0.00"}</td>
      <td>
        ${
          product.supplierInfo
            ? `<a href="../admin/suppliers.html#${product.supplierInfo.id}" class="supplier-link">
            ${product.supplierInfo.name}
          </a>`
            : getSupplierName(product.supplier)
        }
      </td>
      <td>${formatDate(product.lastUpdated)}</td>
      <td class="action-buttons">
        <button class="btn-use btn btn-sm btn-outline-secondary" data-id="${product.id}" title="Record usage">
          <i class="fas fa-minus-circle"></i>
        </button>
        <button class="btn-edit btn btn-sm btn-outline-primary" data-id="${product.id}" title="Edit product">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-delete btn btn-sm btn-outline-danger" data-id="${product.id}" title="Delete product">
          <i class="fas fa-trash"></i>
        </button>
        <button class="btn-history btn btn-sm btn-outline-info" data-id="${product.id}" title="Order history">
          <i class="fas fa-history"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  updateMetrics();
  checkLowStock(enhancedInventory);
  checkExpiringItems(enhancedInventory);
}

export function getSupplierName(supplierId) {
  if (!supplierId) return "N/A";
  const suppliers = JSON.parse(localStorage.getItem("suppliers")) || [];
  const supplier = suppliers.find((s) => s.id == supplierId);
  return supplier ? supplier.name : "N/A";
}

export function updateMetrics() {
  document.getElementById("totalProducts").textContent = inventory.length;
  document.getElementById("lowStockItems").textContent = inventory.filter(
    (p) => p.quantity < (p.reorderPoint || 5)
  ).length;
  document.getElementById("expiringItems").textContent = inventory.filter(
    (p) =>
      p.expiryDate &&
      new Date(p.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length;
}

// export function initModal() {
//   const modalElement = document.getElementById('productModal');
//   const productModal = new bootstrap.Modal(modalElement, {
//     keyboard: false,
//     backdrop: 'static'
//   });

//   document.getElementById("addProductBtn").onclick = () => {
//     document.getElementById("productForm").reset();
//     delete document.getElementById("saveProductBtn").dataset.editing;
//     productModal.show();
//   };

//   document.getElementById("saveProductBtn").onclick = () => {
//     saveProduct(productModal);
//   };

//   modalElement.addEventListener('hidden.bs.modal', () => {
//     document.getElementById("productForm").reset();
//   });
// }

// function saveProduct(productModal) {
//   const name = document.getElementById("prodName").value.trim();
//   const category = document.getElementById("prodCategory").value;
//   const quantity = Number(document.getElementById("prodQuantity").value);
//   const price = Number(document.getElementById("prodPrice").value);
//   const supplier = document.getElementById("prodSupplier").value;
//   const expiryDate = document.getElementById("prodExpiry").value;
//   const location = document.getElementById("prodLocation").value;
//   const notes = document.getElementById("prodNotes").value;
//   const editingId = document.getElementById("saveProductBtn").dataset.editing;

//   if (!name || !category || isNaN(quantity) || isNaN(price)) {
//     showNotification("Please fill all required fields.", "warning");
//     return;
//   }

//   try {
//     if (editingId) {
//       // Edit existing
//       const product = inventory.find((p) => p.id === editingId);
//       if (product) {
//         product.name = name;
//         product.category = category;
//         product.quantity = quantity;
//         product.price = price;
//         product.supplier = supplier;
//         product.expiryDate = expiryDate;
//         product.location = location;
//         product.notes = notes;
//         product.lastUpdated = new Date().toISOString();
//       }
//       delete document.getElementById("saveProductBtn").dataset.editing;
//       showNotification("Product updated successfully", "success");
//     } else {
//       // Add new
//       const newProduct = {
//         id: `PROD-${Date.now().toString(36).toUpperCase()}`,
//         name,
//         category,
//         quantity,
//         price,
//         supplier,
//         expiryDate,
//         location,
//         notes,
//         lastUpdated: new Date().toISOString(),
//         reorderPoint: 10,
//         last30daysUsage: 0,
//         usageHistory: [],
//       };
//       inventory.push(newProduct);
//       showNotification("Product added successfully", "success");
//     }
//     saveInventory();
//     renderInventory();
//     updateMetrics();
//     productModal.hide();
//     document.getElementById("productForm").reset();
//   } catch (error) {
//     console.error("Save error:", error);
//     showNotification("Error saving product: " + error.message, "error");
//   }
// }

function saveInventory() {
  try {
    localStorage.setItem("wms_products", JSON.stringify(inventory));
  } catch (e) {
    showNotification("Failed to save inventory: " + e.message, "error");
  }
}

export function initEventListeners() {
  // Search
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", searchInventory);
  }
  const inventorySearch = document.getElementById("inventorySearch");
  if (inventorySearch) {
    inventorySearch.addEventListener("keyup", (e) => {
      if (e.key === "Enter") searchInventory();
    });
  }

  // Select all
  const selectAll = document.getElementById("selectAll");
  if (selectAll) {
    selectAll.addEventListener("change", function () {
      const checkboxes = document.querySelectorAll(".product-checkbox");
      checkboxes.forEach((checkbox) => {
        checkbox.checked = this.checked;
      });
      updateBulkActionButtons();
    });
  }

  // Export
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportInventory);
  }

  // Auto reorder
  const autoReorderBtn = document.getElementById("autoReorderBtn");
  if (autoReorderBtn) {
    autoReorderBtn.addEventListener("click", handleAutoReorder);
  }

  // Table actions
  const inventoryTable = document.querySelector("#inventoryTable");
  if (inventoryTable) {
    inventoryTable.addEventListener("click", (e) => {
      if (e.target.closest(".btn-history")) {
        const itemId = e.target.closest("tr").dataset.id;
        showOrderHistory(itemId);
      }
      if (e.target.closest(".btn-delete")) {
        const itemId = e.target.closest("tr").dataset.id;
        deleteProduct(itemId);
      }
      if (e.target.closest(".btn-use")) {
        const itemId = e.target.closest("tr").dataset.id;
        const quantity = parseInt(
          prompt(
            `How many ${
              e.target.closest("tr").querySelector("td:nth-child(3)").textContent
            } were used?`
          )
        );
        if (!isNaN(quantity)) {
          recordItemUsage(itemId, quantity);
        }
      }
    });
  }
}

function searchInventory() {
  const searchTerm = document.getElementById("inventorySearch").value.toLowerCase();
  const filtered = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm) ||
      item.id.toLowerCase().includes(searchTerm)
  );
  renderInventory(filtered);
}

function updateBulkActionButtons() {
  const checkedCount = document.querySelectorAll(
    ".product-checkbox:checked"
  ).length;
  document.getElementById("bulkEditBtn").disabled = checkedCount === 0;
  document.getElementById("bulkDeleteBtn").disabled = checkedCount === 0;
}

function exportInventory() {
  showNotification("Export functionality will be implemented", "info");
}

async function handleAutoReorder() {
  try {
    showNotification("Generating purchase orders...", "info");
    const suppliers = JSON.parse(localStorage.getItem("suppliers")) || [];
    const poList = generatePurchaseOrders(inventory, suppliers);

    const poResults = document.getElementById("poResults");
    if (poList.length > 0) {
      showNotification(`Generated ${poList.length} purchase orders`, "success");
      poResults.innerHTML = `
        <h3>Suggested Purchase Orders</h3>
        <div class="po-list">
          ${poList
            .map(
              (po) => `
            <div class="po-card ${po.urgency.toLowerCase()}">
              <h4>${po.itemName}</h4>
              <p><strong>Quantity:</strong> ${po.recommendedOrder} units</p>
              <p><strong>Supplier:</strong> ${
                po.supplierName || "No preferred supplier"
              }</p>
              <p><strong>Urgency:</strong> <span class="urgency-${po.urgency.toLowerCase()}">${
                po.urgency
              }</span></p>
              <p><strong>Estimated Cost:</strong> $${po.estimatedCost.toFixed(
                2
              )}</p>
              ${
                getAlternativeSuppliers(po.itemId, suppliers).length > 0
                  ? `
                <button class="btn btn-sm btn-alternate" data-item="${po.itemId}">
                  Show Alternatives
                </button>
              `
                  : ""
              }
            </div>
          `
            )
            .join("")}
        </div>
      `;
    } else {
      showNotification("No purchase orders needed", "info");
      poResults.innerHTML = "";
    }
  } catch (error) {
    console.error("Error generating POs:", error);
    showNotification("Failed to generate purchase orders", "error");
  }
}

function showOrderHistory(itemId) {
  const orders = JSON.parse(localStorage.getItem("orders")) || [];
  const itemOrders = orders
    .filter((o) => o.items.some((i) => i.id === itemId))
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  const contentDiv = document.getElementById("orderHistoryContent");
  if (!contentDiv) return;

  if (itemOrders.length > 0) {
    contentDiv.innerHTML = `
      <div class="order-history-list">
        ${itemOrders
          .slice(0, 5)
          .map(
            (o) => `
          <div class="order-item ${o.status}">
            <p><strong>Order ID:</strong> ${o.id}</p>
            <p><strong>Date:</strong> ${new Date(o.orderDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span class="status-${o.status}">${o.status}</span></p>
            <p><strong>Quantity:</strong> ${o.items.find((i) => i.id === itemId).quantity}</p>
            ${
              o.status === "delivered"
                ? `<p><strong>On Time:</strong> ${o.onTime ? "Yes" : "No"}</p>
                   <p><strong>Quality:</strong> ${o.qualityIssues ? "Issues Reported" : "Good"}</p>`
                : ""
            }
          </div>
        `
          )
          .join("")}
      </div>
      ${
        itemOrders.length > 5
          ? `<p>+ ${itemOrders.length - 5} more orders...</p>`
          : ""
      }
    `;
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("orderHistoryModal"));
    modal.show();
  } else {
    showNotification("No order history found for this item", "info");
  }
}

function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  inventory = inventory.filter((p) => p.id !== productId);
  saveInventory();
  renderInventory();
  updateMetrics();
  showNotification("Product deleted.", "success");
}

function recordItemUsage(itemId, quantityUsed) {
  const item = inventory.find((item) => item.id === itemId);
  if (item) {
    if (item.quantity >= quantityUsed) {
      item.quantity -= quantityUsed;

      // Initialize if missing
      if (!item.usageHistory) item.usageHistory = [];

      // Record usage
      item.usageHistory.push({
        date: new Date().toISOString(),
        quantityUsed,
      });

      // Update 30-day average
      const recentUsage = item.usageHistory
        .filter(
          (entry) =>
            new Date(entry.date) >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        )
        .reduce((sum, entry) => sum + entry.quantityUsed, 0);

      item.last30daysUsage = recentUsage;
      saveInventory();
      renderInventory();
      return true;
    }
    showNotification(
      `Not enough stock to deduct ${quantityUsed} items`,
      "error"
    );
    return false;
  }
  showNotification("Item not found", "error");
  return false;
}

export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
