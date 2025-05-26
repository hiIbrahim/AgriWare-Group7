// Replace the ROLE_STYLES constant with:
import { ROLE_STYLES } from "../config.js";

export function updateRoleBadge() {
  try {
    // Check session validity first
    const userData = localStorage.getItem("wms_user");
    if (!userData) {
      localStorage.removeItem("csrf_token");
      return;
    }

    const user = userData ? JSON.parse(userData) : null;
    const badge = document.getElementById("roleBadge");
    const navLinks = document.querySelectorAll("[data-roles]");
    const logoutSection = document.getElementById("logoutSection");
    const loginSection = document.getElementById("loginSection");

    if (user) {
      logoutSection?.classList.remove("d-none");
      loginSection?.classList.add("d-none");
    } else {
      logoutSection?.classList.add("d-none");
      loginSection?.classList.remove("d-none");
    }

    if (badge) {
      const role = user?.role || "guest";
      const style = ROLE_STYLES[role] || ROLE_STYLES.guest;

      badge.innerHTML = `
        <i class="fas ${style.icon} me-1"></i>
        ${user?.name || style.text}
      `;
      badge.style.backgroundColor = style.bg;
      badge.style.color = "white";
    }

    // Update role-based links
    navLinks.forEach((link) => {
      const allowedRoles = link.dataset.roles?.split(" ") || [];
      const shouldShow =
        allowedRoles.includes(user?.role) ||
        (allowedRoles.includes("guest") && !user);
      link.classList.toggle("d-none", !shouldShow);
    });
  } catch (error) {
    console.error("Role badge update failed:", error);
    localStorage.clear();
  }
}

// Initialize with session check
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("wms_user"));
  if (!user || user.expiresAt < Date.now()) {
    localStorage.removeItem("wms_user");
  }
  updateRoleBadge();
});

export function getRoleBadgeColor(role) {
  switch (role) {
    case "admin": return "danger";
    case "staff": return "primary";
    case "worker": return "warning";
    default: return "secondary";
  }
}