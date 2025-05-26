export const PERMISSIONS = {
  admin: [
    "all",
    "view_dashboard",
    "manage_inventory",
    "view_reports",
    "manage_staff",
    "manage_orders",
    "scan_items",
    "edit_profiles",
    "view_staff",
    'add_staff',

  ],
  staff: [
    "view_inventory",
    "process_orders", 
    "view_profile",
    "scan_items",
    "update_orders",
    "view_orders",
    "view_staff",

  ],
  worker: [
    "view_tasks", 
    "clock_in", 
    "scan_items",
    "view_shiftlog",
    "update_tasks"

  ],
  user: ["create_orders", "view_orders", "edit_profile", "view_profile"],
};

// Add this import
import { DEFAULT_REDIRECT } from "../config.js";
import { checkSession } from "./session.js";
import { getStaffMembers } from "../staff/core.js"; // <-- Add this line

export async function canPerformAction(action) {
  try {
   
    const user = await checkSession(); // Consistent session check

    localStorage.setItem("last_active", Date.now());

    if (PERMISSIONS[user.role]?.includes("all")) return true;
    return PERMISSIONS[user.role]?.includes(action) || false;
  } catch (error) {
    console.error("Permission check failed:", error);
    return false;
  }
}

// export function checkPermission(user, permission) {
//   if (!user) return false;
//   if (PERMISSIONS[user.role]?.includes('all')) return true;
//   return PERMISSIONS[user.role]?.includes(permission) || false;
// }
/**
/**
 * Checks if a staff member has permission for an action
 * @param {string} staffId - ID of staff member
 * @param {string} action - Action to check permission for
 * @returns {boolean} True if authorized
 */
export function checkPermission(staffId, action) {
  try {
    const staff = getStaffMembers().find(s => s.id === staffId);
    let role = staff && staff.role;
    if (!role) {
      const user = JSON.parse(localStorage.getItem("wms_user"));
      role = user?.role;
    }
    if (!role) return false;
    if (PERMISSIONS[role]?.includes('all')) return true;
    return PERMISSIONS[role]?.includes(action) || false;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}

export function requirePermission(permission) {
  const user = checkSession();
  if (!user || !checkPermission(user, permission)) {
    localStorage.removeItem('wms_user');
    window.location.href = `${DEFAULT_REDIRECT}?session_expired=1`;
    return false;
  }
  return user;
}

export async function redirectIfUnauthorized(action) {
  if (!canPerformAction(action)) {
    const currentPath = encodeURIComponent(window.location.pathname);
    window.location.href = `../shared/403.html?from=${currentPath}&requires=${encodeURIComponent(action)}`; // CHANGED
    return false;
  }
  return true;
}