import { showNotification } from "../ui/notification.js";
import { search } from "../ui/search.js";
import { createOrder } from "./core.js";

const SHIPPING_COSTS = {
  standard: 15.0,
  express: 25.0,
};

const elements = {
  productGrid: document.getElementById("productGrid"),
  selectedItems: document.getElementById("selectedItems"),
  emptyCart: document.getElementById("emptyCart"),
  orderContents: document.getElementById("orderContents"),
  submitBtn: document.getElementById("submitOrder"),
  productSearch: document.getElementById("productSearch"),
  clearSearch: document.getElementById("clearSearch"),
  shippingMethod: document.getElementById("shippingMethod"),
  supplierSelect: document.getElementById("supplierSelect"),
  shippingForm: document.getElementById("supplierForm"),
  contactPerson: document.getElementById("contactPerson"),
  shippingAddress: document.getElementById("shippingAddress"),
};

let cart = [];

document.addEventListener("DOMContentLoaded", initOrderCreation);

function initOrderCreation() {
  verifyPermissions();
  loadProducts();
  setupSuppliers();
  setupEventListeners();
  renderCart();
}

function verifyPermissions() {
  const user = JSON.parse(localStorage.getItem("wms_user"));
  if (!user || !(user.role === "admin" || user.permissions?.includes("create_orders"))) {
    showNotification("You lack permissions to create orders", "error");
    setTimeout(() => (window.location.href = "../shared/401.html"), 2000);
  }
}

function loadProducts() {
  try {
    const products = JSON.parse(localStorage.getItem("wms_products")) || [];
    renderProducts(products);
  } catch (error) {
    showNotification("Failed to load products", "error");
    console.error("Product loading error:", error);
  }
}

function renderProducts(products) {
  const grid = elements.productGrid;
  grid.innerHTML = "";
  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.productId = product.id;
    if (cart.some(item => item.id === product.id)) card.classList.add("selected");
    card.innerHTML = `
      <div class="product-image"><img src="${product.image || '/assets/box.png'}" alt="${product.name}"></div>
      <div class="product-body">
        <div class="product-name">${product.name}</div>
        <div class="product-sku">${product.id}</div>
        <div class="product-meta">
          <span class="product-price">$${Number(product.price).toFixed(2)}</span>
          <span class="stock-badge badge-${getStockBadge(product.quantity)}">${product.quantity} in stock</span>
        </div>
      </div>
    `;
    card.addEventListener("click", () => addToCart(product));
    grid.appendChild(card);
  });
  highlightSelectedProducts();
}

function getStockBadge(qty) {
  if (qty > 10) return "success";
  if (qty > 0) return "warning";
  return "danger";
}

function addToCart(product) {
  const index = cart.findIndex(item => item.id === product.id);
  if (index >= 0) {
    cart.splice(index, 1);
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  renderCart();
  highlightSelectedProducts();
}

function highlightSelectedProducts() {
  const grid = elements.productGrid;
  if (!grid) return;
  cart.forEach(item => {
    const card = grid.querySelector(`[data-product-id="${item.id}"]`);
    if (card) card.classList.add("selected");
  });
  grid.querySelectorAll(".product-card").forEach(card => {
    if (!cart.some(item => item.id === card.dataset.productId)) {
      card.classList.remove("selected");
    }
  });
}

function renderCart() {
  const list = elements.selectedItems;
  const emptyCart = elements.emptyCart;
  const orderContents = elements.orderContents;
  const itemCount = document.getElementById("itemCount");
  if (cart.length === 0) {
    list.innerHTML = "";
    emptyCart.classList.remove("d-none");
    orderContents.classList.add("d-none");
    itemCount.textContent = "0 items";
    updateSubmitButton();
    return;
  }
  emptyCart.classList.add("d-none");
  orderContents.classList.remove("d-none");
  itemCount.textContent = `${cart.length} items`;
  list.innerHTML = cart
    .map(
      (item) => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      <span>${item.name} <span class="text-muted">x${item.quantity}</span></span>
      <span>$${(item.price * item.quantity).toFixed(2)}</span>
    </li>
  `
    )
    .join("");
  updateTotals();
  updateSubmitButton();
}

function updateTotals() {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;
  const shipping = subtotal > 0 ? 10 : 0;
  const tax = subtotal * 0.05;
  document.getElementById("shipping").textContent = `$${shipping.toFixed(2)}`;
  document.getElementById("tax").textContent = `$${tax.toFixed(2)}`;
  document.getElementById("total").innerHTML = `<strong>$${(
    subtotal +
    shipping +
    tax
  ).toFixed(2)}</strong>`;
}

function setupSuppliers() {
  const supplierSelect = elements.supplierSelect;
  if (!supplierSelect) return;
  const suppliers = JSON.parse(localStorage.getItem("wms_suppliers")) || [];
  supplierSelect.innerHTML =
    `<option value="">-- Select a supplier --</option>` +
    suppliers
      .map(
        (supplier) =>
          `<option value="${supplier.id}" data-contact="${supplier.email || supplier.phone || ""}">${supplier.name}</option>`
      )
      .join("");

  // Preselect supplier if set in sessionStorage
  const preselectId = sessionStorage.getItem("selectedSupplierId");
  const preselectContact = sessionStorage.getItem("selectedSupplierContact");
  if (preselectId) {
    supplierSelect.value = preselectId;
    // Autofill contact person with supplier contact if contact is empty
    if (preselectContact && elements.contactPerson.value.trim() === "") {
      elements.contactPerson.value = preselectContact;
    } else {
      // fallback: use contact from dropdown
      const selectedOption = supplierSelect.options[supplierSelect.selectedIndex];
      if (elements.contactPerson.value.trim() === "" && selectedOption) {
        elements.contactPerson.value = selectedOption.getAttribute("data-contact") || "";
      }
    }
    sessionStorage.removeItem("selectedSupplierId");
    sessionStorage.removeItem("selectedSupplierName");
    sessionStorage.removeItem("selectedSupplierContact");
  }

  // ALWAYS autofill contact person when supplier changes
  supplierSelect.addEventListener("change", function () {
    const selectedOption = supplierSelect.options[supplierSelect.selectedIndex];
    elements.contactPerson.value = selectedOption.getAttribute("data-contact") || "";
    updateSubmitButton();
  });
}

function setupEventListeners() {
  elements.shippingMethod.addEventListener("change", (e) => {
    updateTotals();
    updateSubmitButton();
  });

  elements.supplierSelect.addEventListener("change", (e) => {
    updateSubmitButton();
  });

  elements.contactPerson.addEventListener("input", updateSubmitButton);
  elements.shippingAddress.addEventListener("input", updateSubmitButton);

  elements.productSearch.addEventListener("input", (e) => {
    const products = JSON.parse(localStorage.getItem("wms_products")) || [];
    const filtered = search(products, e.target.value, [
      "name",
      "category",
    ]);
    renderProducts(filtered);
  });

  elements.clearSearch.addEventListener("click", () => {
    elements.productSearch.value = "";
    loadProducts();
  });

  elements.submitBtn.addEventListener("click", submitOrder);
}

async function submitOrder() {
  if (!validateOrder()) return;

  try {
    const orderData = {
      supplierId: elements.supplierSelect.value,
      items: cart.map(item => ({
        product: item,
        quantity: item.quantity
      })),
      shippingMethod: elements.shippingMethod.value,
      contactPerson: elements.contactPerson.value,
      shippingAddress: elements.shippingAddress.value,
    };

    // Save the order (your existing logic)
    const order = await createOrder(orderData);

    // --- STOCK UPDATE LOGIC START ---
    // Load products from localStorage
    let products = JSON.parse(localStorage.getItem("wms_products")) || [];
    // For each ordered item, decrement stock
    orderData.items.forEach(({ product, quantity }) => {
      const idx = products.findIndex(p => p.id === product.id);
      if (idx !== -1) {
        products[idx].quantity -= quantity;
        if (products[idx].quantity <= 0) {
          // Remove product if out of stock
          products.splice(idx, 1);
        }
      }
    });
    // Save updated products back to localStorage
    localStorage.setItem("wms_products", JSON.stringify(products));
    // --- STOCK UPDATE LOGIC END ---

    showNotification(`Order ${order.id} created successfully!`, "success");
    resetOrderForm();
    loadProducts(); // Refresh product list in UI
  } catch (error) {
    showNotification("Failed to create order: " + error.message, "error");
    console.error("Order submission error:", error);
  }
}

function validateOrder() {
  if (cart.length === 0) {
    return false;
  }
  if (!elements.supplierSelect.value) {
    return false;
  }
  if (!elements.contactPerson.value.trim()) {
    return false;
  }
  if (!elements.shippingAddress.value.trim()) {
    return false;
  }
  return true;
}

function updateSubmitButton() {
  elements.submitBtn.disabled = !validateOrder();
}

function resetOrderForm() {
  cart = [];
  renderCart();
  elements.shippingForm.reset();
  updateSubmitButton();
}
