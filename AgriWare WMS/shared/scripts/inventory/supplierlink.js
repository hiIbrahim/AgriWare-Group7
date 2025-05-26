// /**
//  * Links inventory items to their suppliers
//  * @param {Array} inventory 
//  * @param {Array} suppliers 
//  * @returns {Array} Inventory with embedded supplier data
//  */
export function linkItemsToSuppliers(inventory, suppliers) {
    return inventory.map(item => ({
      ...item,
      supplierInfo: suppliers.find(s => s.id === item.supplierId) || null,
      supplierLink: `../admin/suppliers.html#${item.supplierId}`
    }));
  }
  
//   /**
//    * Finds alternative suppliers for an item
//    * @param {string} itemId 
//    * @param {Array} suppliers 
//    * @returns {Array} Alternative suppliers
//    */
  export function getAlternativeSuppliers(itemId, suppliers) {
    const itemCategory = inventory.find(i => i.id === itemId)?.category;
    return suppliers.filter(s => 
      s.certifiedCategories?.includes(itemCategory) && 
      !checkBlacklist(s.id)
    );
  }