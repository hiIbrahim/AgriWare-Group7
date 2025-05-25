// /**
//  * Calculates key supplier metrics
//  * @param {Array} suppliers - Supplier list
//  * @param {Array} orders - Completed orders
//  * @returns {Array} Enhanced suppliers with performance data
//  */
export function calculateSupplierMetrics(suppliers, orders) {
  return suppliers.map((supplier) => {
    const supplierOrders = orders.filter((o) => o.supplierId === supplier.id);
    const completedOrders = supplierOrders.filter(
      (o) => o.status === "delivered"
    );

    // On-time delivery rate
    const onTimeRate =
      completedOrders.length > 0
        ? Math.round(
            (completedOrders.filter((o) => o.onTime).length /
              completedOrders.length) *
              100
          )
        : 0;

    // Quality issue percentage
    const qualityRating =
      completedOrders.length > 0
        ? 100 -
          Math.round(
            (completedOrders.filter((o) => o.qualityIssues).length /
              completedOrders.length) *
              100
          )
        : 100;

    return {
      ...supplier,
      orderCount: supplierOrders.length,
      completedOrders: completedOrders.length,
      onTimeRate,
      qualityRating,
      overallScore: Math.round(onTimeRate * 0.6 + qualityRating * 0.4),
    };
  });
}

//   /**
//    * Flags underperforming suppliers
//    * @param {Array} suppliers - Supplier list with metrics
//    * @param {number} threshold - Minimum acceptable score (0-100)
//    * @returns {Array} Suppliers with performance alerts
//    */
export function flagUnderperformers(suppliers, threshold = 70) {
  return suppliers.map((s) => ({
    ...s,
    underperforming: s.overallScore < threshold,
  }));
}
