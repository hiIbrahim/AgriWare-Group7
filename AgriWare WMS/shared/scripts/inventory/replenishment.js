import { getSupplierOrders, getPendingOrders } from '../orders/core.js';

export function generatePurchaseOrders(inventory, suppliers) {
  return inventory
    .filter(item => item.quantity < item.reorderPoint)
    .map(item => {
      const supplier = suppliers.find(s => s.id === item.supplierId) || {};
      const leadTime = supplier.averageLeadTime || 7; // Default 7 days
      const usageRate = item.last30daysUsage / 30 || 1;
      
      // Check existing pending orders for this item
      const pendingOrders = getPendingOrders();
      const pendingForItem = pendingOrders.flatMap(o => 
        o.items.filter(oi => oi.id === item.id)
      );
      const pendingQty = pendingForItem.reduce((sum, oi) => sum + oi.quantity, 0);
      
      // Calculate needed quantity considering pending orders
      const neededQty = Math.ceil(usageRate * leadTime * 1.2) - pendingQty;
      const recommendedOrder = Math.max(0, neededQty);

      // Get supplier performance data
      const supplierOrders = getSupplierOrders(supplier.id);
      const deliveredOrders = supplierOrders.filter(o => o.status === 'delivered');
      const onTimeRate = deliveredOrders.length > 0 
        ? deliveredOrders.filter(o => o.onTime).length / deliveredOrders.length
        : 1; // Assume good performance if no data
      
      return {
        itemId: item.id,
        itemName: item.name,
        currentStock: item.quantity,
        pendingOrders: pendingQty,
        recommendedOrder,
        supplierId: supplier.id,
        supplierName: supplier.name,
        leadTime,
        urgency: calculateUrgency(item.quantity, usageRate, leadTime, pendingQty),
        estimatedCost: (item.price * 0.8) * recommendedOrder, // Assuming 20% margin
        supplierPerformance: onTimeRate,
        qualityRisk: deliveredOrders.some(o => o.qualityIssues)
      };
    })
    .filter(po => po.recommendedOrder > 0); // Only include items that actually need ordering
}

function calculateUrgency(currentQty, usageRate, leadTime, pendingQty) {
  const daysCoverage = (currentQty + pendingQty) / usageRate;
  
  if (daysCoverage < leadTime * 0.5) return 'CRITICAL';
  if (daysCoverage < leadTime) return 'HIGH';
  if (daysCoverage < leadTime * 1.5) return 'MEDIUM';
  return 'LOW';
}

export function calculateReorderPoints(inventory, serviceLevel = 95) {
  const pendingOrders = getPendingOrders();
  
  return inventory.map(item => {
    // Get pending quantities for this item
    const pendingForItem = pendingOrders.flatMap(o => 
      o.items.filter(oi => oi.id === item.id)
    );
    const pendingQty = pendingForItem.reduce((sum, oi) => sum + oi.quantity, 0);
    
    // Calculate safety stock considering lead time variability
    const leadTimeVar = 2; // Assume 2 days variability
    const dailyUsage = item.last30daysUsage / 30 || 1;
    const safetyStock = Math.ceil(dailyUsage * leadTimeVar * (serviceLevel / 100));
    
    return {
      ...item,
      reorderPoint: Math.ceil(dailyUsage * (item.leadTime || 7)) + safetyStock,
      pendingQuantity: pendingQty
    };
  });
}