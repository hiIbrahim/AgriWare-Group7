/**
 * Core order processing utilities
 */

const STORAGE_KEY = "wms_orders";

export function createOrder(orderData) {
  const orders = getOrders();
  const newOrder = {
    id: generateOrderId(),
    ...orderData,
    orderDate: new Date().toISOString(),
    status: "pending",
    onTime: null,
    qualityIssues: false,
    history: [
      {
        status: "created",
        timestamp: new Date().toISOString(),
        user: getCurrentUser()?.id || "system",
      },
    ],
  };

  orders.push(newOrder);
  saveOrders(orders);
  return newOrder;
}

export function updateOrderStatus(orderId, status, options = {}) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);

  if (order) {
    order.status = status;
    order.onTime = options.onTime ?? null;
    order.qualityIssues = options.qualityIssues ?? false;

    order.history.push({
      status,
      timestamp: new Date().toISOString(),
      user: getCurrentUser()?.id || "system",
      notes: options.notes,
    });

    saveOrders(orders);
    return true;
  }
  return false;
}

export function getOrderById(orderId) {
  return getOrders().find((o) => o.id === orderId);
}

export function getSupplierOrders(supplierId) {
  return getOrders().filter((o) => o.supplierId === supplierId);
}

export function getRecentOrders(days = 30, status) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return getOrders().filter((o) => {
    try {
      const matchesDate = new Date(o.orderDate) > cutoffDate;
      const matchesStatus = status ? o.status === status : true;
      return matchesDate && matchesStatus;
    } catch (e) {
      console.error(`Invalid order date format: ${o.orderDate}`, e);
      return false;
    }
  });
}

export function getPendingOrders(orders) {
  return (orders || []).filter((order) => order.status === "pending");
}

// Helper functions
function getOrders() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function generateOrderId() {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("wms_user"));
}