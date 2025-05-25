import { getStaffMembers } from './core.js';

export const STAFF_PERMISSIONS = {
  worker: ['clock_in', 'view_tasks', 'view_own_documents'],
  supervisor: [
    'clock_in', 
    'manage_tasks', 
    'view_reports',
    'view_staff',
    'manage_shifts',
    'upload_documents',
    'view_orders',
  ],
  staff: [
    'view_staff',
    'view_orders',
  ],
  admin: ['all']
};

/**
 * Checks if a staff member has permission for an action
 * @param {string} staffId - ID of staff member
 * @param {string} action - Action to check permission for
 * @returns {boolean} True if authorized
 */
export function checkPermission(staffId, action) {
  try {
    const staff = getStaffMembers().find(s => s.id === staffId);
    if (!staff) return false;
    if (STAFF_PERMISSIONS[staff.role]?.includes('all')) return true;
    return STAFF_PERMISSIONS[staff.role]?.includes(action) || false;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}