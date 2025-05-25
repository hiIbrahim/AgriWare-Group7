/**
 * Inventory Alert System
 */

import { showNotification } from '../ui/notification.js';

// /**
//  * Checks for low stock items and shows notification if found
//  * @param {Array} inventory - Inventory items array
//  * @param {number} threshold - Low stock threshold
//  * @returns {Array} Low stock items
//  */
export function checkLowStock(inventory, threshold = 10) {
  const lowStockItems = inventory.filter(item => 
    item.quantity < (item.reorderPoint || threshold)
  );
  
  if (lowStockItems.length > 0) {
    showNotification(
      `${lowStockItems.length} item(s) below ${threshold} stock`,
      'warning',
      {
        action: {
          text: "View Items",
          callback: () => window.location.href = "../admin/inventory.html?filter=low_stock"
        },
        timeout: 10000
      }
    );
  }
  return lowStockItems;
}

// /**
//  * Checks for expired items
//  * @param {Array} inventory - Inventory items array
//  * @returns {Array} Expired items
//  */
export function checkExpiredItems(inventory) {
  const today = new Date();
  const expiredItems = inventory.filter(item => 
    item.expiryDate && new Date(item.expiryDate) < today
  );
  
  if (expiredItems.length > 0) {
    showNotification(
      `${expiredItems.length} expired item(s) found`,
      'error',
      {
        action: {
          text: "Review",
          callback: () => window.location.href = "../admin/inventory.html?filter=expired"
        }
      }
    );
  }
  return expiredItems;
}

// /**
//  * Checks for items expiring soon
//  * @param {Array} inventory - Inventory items array 
//  * @param {number} daysThreshold - Days threshold for expiry warning
//  * @returns {Array} Expiring soon items
//  */
export function checkExpiringItems(inventory, daysThreshold = 7) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  
  const expiringItems = inventory.filter(item => 
    item.expiryDate && new Date(item.expiryDate) <= thresholdDate
  );
  
  if (expiringItems.length > 0) {
    showNotification(
      `${expiringItems.length} items expiring within ${daysThreshold} days`,
      'warning',
      {
        action: {
          text: "View",
          callback: () => window.location.href = "../admin/inventory.html?filter=expiring"
        }
      }
    );
  }
  return expiringItems;
}

/**
 * Gets the low stock items from the inventory
 * @param {Array} inventory - Inventory items array
 * @returns {Array} Low stock items
 */
export function getLowStockItems(inventory) {
  return (inventory || []).filter(item => item.quantity < (item.reorderPoint || 10));
}