// /**
//  * Predicts stockouts based on historical usage
//  * @param {Array} inventory - Current inventory items
//  * @returns {Array} Enhanced inventory with risk analysis
//  */
export function predictStockouts(inventory) {
    const warningThreshold = 7; // Days of stock remaining
    
    return inventory.map(item => {
      // Calculate average daily usage (protect against divide-by-zero)
      const dailyUsage = item.last30daysUsage 
        ? (item.last30daysUsage / 30) 
        : item.quantity > 0 ? 0.1 : 0; // Default to 0.1 if no usage data
      
      const daysRemaining = Math.floor(item.quantity / dailyUsage);
      
      return {
        ...item,
        stockoutRisk: daysRemaining < warningThreshold,
        daysRemaining: isFinite(daysRemaining) ? daysRemaining : '∞'
      };
    });
  }
  
  // Utility function to update historical data
  export function updateUsageHistory(itemId, quantityUsed) {
    const inventory = JSON.parse(localStorage.getItem('wms_products')) || [];
    const item = inventory.find(i => i.id === itemId);
    
    if (item) {
      // Initialize if missing
      if (!item.usageHistory) item.usageHistory = [];
      
      // Record usage (with timestamp)
      item.usageHistory.push({
        date: new Date().toISOString(),
        quantityUsed
      });
      
      // Update 30-day rolling average
      const recentUsage = item.usageHistory
        .filter(entry => new Date(entry.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, entry) => sum + entry.quantityUsed, 0);
      
      item.last30daysUsage = recentUsage;
      localStorage.setItem('wms_products', JSON.stringify(inventory));
    }
  }