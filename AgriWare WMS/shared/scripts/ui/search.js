// /**
//  * Universal search functionality for WMS
//  * @param {Array} data - Items to search through
//  * @param {string} term - Search term
//  * @param {Array} fields - Fields to search within
//  * @returns {Array} Filtered results
//  */
export function search(data, term, fields = ["name"]) {
  if (!term) return data;

  const searchTerm = term.toLowerCase();

  return data.filter((item) => {
    return fields.some((field) => {
      const fieldValue = String(item[field] || "").toLowerCase();
      return fieldValue.includes(searchTerm);
    });
  });
}

//   /**
//    * Highlights search terms in text
//    * @param {string} text - Original text
//    * @param {string} term - Search term
//    * @returns {string} HTML with highlighted matches
//    */
export function highlightMatches(text, term) {
  if (!term) return text;

  const regex = new RegExp(`(${term})`, "gi");
  return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Initialize search on input fields with class 'live-search'
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".live-search").forEach((input) => {
    input.addEventListener("input", (e) => {
      const containerId = e.target.dataset.searchTarget;
      const container = document.getElementById(containerId);
      if (!container) return;

      const items = JSON.parse(container.dataset.searchItems || "[]");
      const fields = JSON.parse(e.target.dataset.searchFields || '["name"]');
      const filtered = search(items, e.target.value, fields);

      // Re-render results (implementation varies per component)
      if (typeof window.renderSearchResults === "function") {
        window.renderSearchResults(container, filtered, e.target.value);
      }
    });
  });
});
