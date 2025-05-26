import { updateRoleBadge } from "./rolebadge.js";
import { checkPermission } from "../auth/permissions.js";
import { showNotification } from "./notification.js";
import { checkSession } from "../auth/session.js";

let isNavbarInitialized = false;

export async function loadNavbar() {
  try {
    const response = await fetch("/shared/partials/navbar.html");
    if (!response.ok) throw new Error("Network response was not ok");
    const html = await response.text();

    const container = document.getElementById("navbarContainer");
    if (!container) throw new Error("Navbar container not found");

    container.innerHTML = html;
    await initializeNavbarComponents();
    return true;
  } catch (error) {
    console.error("Navbar loading failed:", error);
    showNotification("Navigation system error", "error");
    return false;
  }
}

async function initializeNavbarComponents() {
  try {
    const user = await checkSession(); 
    applyRoleStyling(user);
    
    if (user) {
      addRoleSpecificNavItems(user);
    }
    
    updateAuthUI(!!user);
    updateRoleBadge();
    attachNavbarHandlers();
  } catch (error) {
    console.error("Navbar initialization error:", error);
    applyRoleStyling(null);
    updateAuthUI(false);
  }
}

function applyRoleStyling(user) {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  navbar.classList.remove(
    "navbar-admin", "navbar-staff", "navbar-worker", "navbar-user", "navbar-public"
  );

  if (user?.role) {
    navbar.classList.add(`navbar-${user.role}`);
    document.body.dataset.role = user.role;
  } else {
    navbar.classList.add("navbar-public");
    document.body.dataset.role = "public";
  }
}

function updateAuthUI(isLoggedIn) {
  const authButton = document.getElementById("authButton");
  const profileLink = document.getElementById("profileLink");

  if (isLoggedIn) {
    authButton.innerHTML = '<i class="fas fa-sign-out-alt me-1"></i> Logout';
    authButton.className = 'btn btn-sm btn-danger';
    authButton.onclick = handleLogout;
    profileLink?.classList.remove("d-none");
  } else {
    authButton.innerHTML = '<i class="fas fa-sign-in-alt me-1"></i> Login';
    authButton.className = 'btn btn-sm btn-secondary';
    authButton.onclick = null;
    authButton.href = "/shared/login.html";
    profileLink?.classList.add("d-none");
  }
}

function handleLogout(e) {
  e.preventDefault();
  ["wms_user", "csrf_token", "last_active"].forEach((key) => {
    localStorage.removeItem(key);
  });
  window.location.href = "/shared/login.html?logout=true";
}

function addRoleSpecificNavItems(user) {
  const navContainer = document.getElementById("dynamicNavItems");
  if (!navContainer || !user) return;

  // Clear existing dynamic items
  navContainer.innerHTML = "";

  let navHTML = "";
  switch (user.role) {
    case "admin":
      navHTML = `
        <li class="nav-item">
          <a class="nav-link" href="/admin/dashboard.html" data-required-permission="view_dashboard">
            <i class="fas fa-tachometer-alt me-1"></i> Dashboard
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/admin/inventory.html" data-required-permission="view_inventory">
            <i class="fas fa-boxes me-1"></i> Inventory
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/admin/staff.html" data-required-permission="manage_staff">
            <i class="fas fa-users me-1"></i> Staff
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/admin/reports.html" data-required-permission="view_reports">
            <i class="fas fa-chart-bar me-1"></i> Reports
          </a>
        </li>`;
      break;
    case "staff":
      navHTML = `
        <li class="nav-item">
          <a class="nav-link" href="/admin/inventory.html" data-required-permission="view_inventory">
            <i class="fas fa-boxes me-1"></i> Inventory
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/orders/status.html" data-required-permission="view_orders">
            <i class="fas fa-clipboard-list me-1"></i> Orders
          </a>
        </li>`;
      break;
    case "worker":
      navHTML = `
        <li class="nav-item" data-permission="scan_items">
          <a class="nav-link" href="/worker/scanner.html">
            <i class="fas fa-barcode me-1"></i> Scanner
          </a>
        </li>
        <li class="nav-item" data-permission="view_tasks">
          <a class="nav-link" href="/worker/tasks.html">
            <i class="fas fa-tasks me-1"></i> Tasks
          </a>
        </li>
        <li class="nav-item" data-permission="view_shiftlog">
          <a class="nav-link" href="/worker/shiftlog.html">
            <i class="fas fa-clipboard-list me-1"></i> Shift Log
          </a>
        </li>`;
      break;
    case "user":
      navHTML = `
        <li class="nav-item" data-permission="create_orders">
          <a class="nav-link" href="/orders/new.html">
            <i class="fas fa-plus-circle me-1"></i> New Order
          </a>
        </li>
        <li class="nav-item" data-permission="view_orders">
          <a class="nav-link" href="/orders/status.html">
            <i class="fas fa-history me-1"></i> Order Status
          </a>
        </li>`;
      break;
  }

  if (navHTML) {
    navContainer.insertAdjacentHTML("beforeend", navHTML);
    secureNavLinks(user);
  }
}

function secureNavLinks(user) {
  document.querySelectorAll("[data-roles]").forEach((item) => {
    const allowedRoles = item.getAttribute("data-roles").split(" ");
    item.classList.toggle("d-none", !allowedRoles.includes(user?.role || "public"));
  });

  document.querySelectorAll("[data-required-permission]").forEach((item) => {
    const requiredPermission = item.getAttribute("data-required-permission");
    item.classList.toggle("d-none", !checkPermission(user, requiredPermission));
  });
}

export function attachNavbarHandlers() {
  document.querySelector(".navbar-toggler")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector(".navbar-collapse")?.classList.toggle("show");
  });
}

export function initializeNavbar() {
  if (isNavbarInitialized) return;
  isNavbarInitialized = true;

  return loadNavbar().catch((error) => {
    console.error("Navbar initialization failed:", error);
    const container = document.getElementById("navbarContainer");
    if (container) {
      container.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
          <div class="container-fluid">
            <a class="navbar-brand" href="/">
              <i class="fas fa-warehouse me-2"></i>AgriWare WMS
            </a>
            <div class="d-flex">
              <a href="/shared/login.html" class="btn btn-sm btn-secondary">
                <i class="fas fa-sign-in-alt me-1"></i> Login
              </a>
            </div>
          </div>
        </nav>`;
    }
  });
}

export function refreshNavbar(user) {
  applyRoleStyling(user);
  updateAuthUI(!!user);
  addRoleSpecificNavItems(user);
  secureNavLinks(user);
  updateRoleBadge();
}

if (typeof document !== "undefined") {
  if (document.readyState === "complete") {
    initializeNavbar();
  } else {
    document.addEventListener("DOMContentLoaded", initializeNavbar);
  }
}

