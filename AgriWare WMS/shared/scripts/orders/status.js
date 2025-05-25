import { getRecentOrders, updateOrderStatus } from "../orders/core.js";
import { showNotification } from "../ui/notification.js";

// DOM Elements
const elements = {
  pendingOrders: document.getElementById("pendingOrders"),
  processingOrders: document.getElementById("processingOrders"),
  shippedOrders: document.getElementById("shippedOrders"),
  orderModal: document.getElementById("orderModal"),
  modalTitle: document.getElementById("modalTitle"),
  modalItems: document.getElementById("modalItems"),
  orderTimeline: document.getElementById("orderTimeline"),
  printOrderBtn: document.getElementById("printOrderBtn"),
  updateStatusBtn: document.getElementById("updateStatusBtn"),
  closeModal: document.querySelector(".close"),
};

// State
let currentOrder = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadOrders();
  setupEventListeners();
});

// Load and render orders
function loadOrders() {
  try {
    const orders = getRecentOrders(30);
    renderOrderPipeline(orders);
  } catch (error) {
    showNotification("Failed to load orders", "error");
    console.error("Order loading error:", error);
  }
}

// Render order pipeline
function renderOrderPipeline(orders) {
  // Clear existing
  elements.pendingOrders.innerHTML = "";
  elements.processingOrders.innerHTML = "";
  elements.shippedOrders.innerHTML = "";

  // Group and render
  orders.forEach((order) => {
    const container = getStatusContainer(order.status);
    if (container) {
      container.appendChild(createOrderCard(order));
    }
  });
}

// Get container for status
function getStatusContainer(status) {
  switch (status) {
    case "pending":
      return elements.pendingOrders;
    case "processing":
      return elements.processingOrders;
    case "shipped":
      return elements.shippedOrders;
    default:
      return null;
  }
}

// Create order card element
function createOrderCard(order) {
  const card = document.createElement("div");
  card.className = `order-card status-${order.status}`;
  card.dataset.id = order.id;

  card.innerHTML = `
    <div class="order-header">
      <strong>${order.id}</strong>
      <span>${formatDate(order.orderDate)}</span>
    </div>
    <div class="order-body">
      <p>${order.items.length} items</p>
      <p>Supplier: ${order.supplierId}</p>
    </div>
  `;

  return card;
}

// Show order details
function showOrderDetails(orderId) {
  try {
    const orders = getRecentOrders();
    currentOrder = orders.find((o) => o.id === orderId);

    if (!currentOrder) {
      showNotification("Order not found", "error");
      return;
    }

    // Update modal content
    elements.modalTitle.textContent = `Order ${currentOrder.id}`;
    elements.modalItems.innerHTML = currentOrder.items
      .map(
        (item) => `
      <li>${item.quantity}x ${item.product?.name || item.id}</li>
    `
      )
      .join("");

    renderTimeline(currentOrder);
    elements.orderModal.style.display = "block";
  } catch (error) {
    showNotification("Failed to load order details", "error");
    console.error("Order details error:", error);
  }
}

// Render order timeline
function renderTimeline(order) {
  const statusHistory = [
    { status: "created", date: order.orderDate },
    { status: order.status, date: order.lastUpdated || order.orderDate },
  ];

  elements.orderTimeline.innerHTML = statusHistory
    .map(
      (entry) => `
    <div class="timeline-item">
      <h5>${entry.status.toUpperCase()}</h5>
      <p>${formatDateTime(entry.date)}</p>
    </div>
  `
    )
    .join("");
}

// Update order status
async function updateStatus(newStatus) {
  if (!currentOrder) return;

  try {
    await updateOrderStatus(currentOrder.id, newStatus);
    showNotification(`Order status updated to ${newStatus}`, "success");
    elements.orderModal.style.display = "none";
    await loadOrders(); // Refresh view
  } catch (error) {
    showNotification("Failed to update status", "error");
    console.error("Status update error:", error);
  }
}

// Event listeners
function setupEventListeners() {
  // Order card clicks (delegated)
  document.querySelectorAll(".pipeline-stage").forEach((stage) => {
    stage.addEventListener("click", (e) => {
      const card = e.target.closest(".order-card");
      if (card) showOrderDetails(card.dataset.id);
    });
  });

  // Modal controls
  elements.closeModal.addEventListener("click", () => {
    elements.orderModal.style.display = "none";
  });

  elements.printOrderBtn.addEventListener("click", () => {
    window.print();
  });

  elements.updateStatusBtn.addEventListener("click", () => {
    if (!currentOrder) return;

    const nextStatus = getNextStatus(currentOrder.status);
    if (nextStatus) updateStatus(nextStatus);
  });

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === elements.orderModal) {
      elements.orderModal.style.display = "none";
    }
  });
}

// Status progression
function getNextStatus(currentStatus) {
  switch (currentStatus) {
    case "pending":
      return "processing";
    case "processing":
      return "shipped";
    default:
      return null;
  }
}

// Helpers
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString();
}
