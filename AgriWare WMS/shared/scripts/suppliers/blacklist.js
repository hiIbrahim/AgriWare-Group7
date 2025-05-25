const BLACKLIST_KEY = "supplierBlacklist";

// /**
//  * Checks if supplier is blacklisted
//  * @param {string} supplierId
//  * @returns {boolean}
//  */
export function checkBlacklist(supplierId) {
  const blacklist = JSON.parse(localStorage.getItem(BLACKLIST_KEY)) || [];
  return blacklist.some((entry) => entry.id === supplierId);
}

// /**
//  * Adds supplier to blacklist
//  * @param {string} supplierId
//  * @param {string} reason
//  * @param {string} reportedBy
//  */
export function blacklistSupplier(supplierId, reason, reportedBy) {
  const blacklist = JSON.parse(localStorage.getItem(BLACKLIST_KEY)) || [];

  if (!blacklist.some((entry) => entry.id === supplierId)) {
    blacklist.push({
      id: supplierId,
      date: new Date().toISOString(),
      reason,
      reportedBy,
      active: true,
    });
    localStorage.setItem(BLACKLIST_KEY, JSON.stringify(blacklist));
  }
}

// /**
//  * Removes supplier from blacklist
//  * @param {string} supplierId
//  */
export function removeFromBlacklist(supplierId) {
  let blacklist = JSON.parse(localStorage.getItem(BLACKLIST_KEY)) || [];
  blacklist = blacklist.filter((entry) => entry.id !== supplierId);
  localStorage.setItem(BLACKLIST_KEY, JSON.stringify(blacklist));
}

// /**
//  * Gets full blacklist with details
//  * @returns {Array}
//  */
export function getFullBlacklist() {
  return JSON.parse(localStorage.getItem(BLACKLIST_KEY)) || [];
}
