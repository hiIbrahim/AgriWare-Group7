// shared/scripts/config.js

// Session Configuration
export const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
export const DEFAULT_REDIRECT = "../shared/login.html"; // CHANGED

// Role Path Configuration
export const ROLE_PATHS = {
  admin: ["../admin/", "../orders/status.html", "../orders/new.html", "../shared/"],
  staff: ["../admin/inventory.html", "../orders/status.html", "../shared/"],
  worker: ["../worker/", "../shared/"],
  user: ["../orders/", "../shared/"]
};

// CSRF Configuration
export const CSRF_CONFIG = {
  length: 32,
  storageKey: "wms_csrf"
};

// Role Style Configuration
export const ROLE_STYLES = {
  admin: {
    bg: "#2c7873",
    icon: "fa-user-shield",
    text: "Admin",
    displayText: "Administrator"
  },
  staff: {
    bg: "#6fb98f",
    icon: "fa-user-gear",
    text: "Staff",
    displayText: "Staff"
  },
  worker: {
    bg: "#f8b400",
    icon: "fa-user-hard-hat",
    text: "Worker",
    displayText: "Worker"
  },
  user: {
    bg: "#2c3e50",
    icon: "fa-user",
    text: "Customer",
    displayText: "Customer"
  },
  public: {
    bg: "#6c757d",
    icon: "fa-user",
    text: "Guest",
    displayText: "Guest"
  }
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  timeout: {
    default: 3000,
    withAction: 10000
  },
  types: {
    success: {
      icon: "check-circle",
      class: "alert-success"
    },
    error: {
      icon: "exclamation-triangle",
      class: "alert-danger"
    },
    warning: {
      icon: "exclamation-circle",
      class: "alert-warning"
    },
    info: {
      icon: "info-circle",
      class: "alert-info"
    }
  }
};

export const APP_CONFIG = {
  version: "1.0.0",
  minPasswordLength: 8,
  apiEndpoints: {
    login: "../api/auth/login", // CHANGED
    logout: "../api/auth/logout" // CHANGED
  },
  defaultPageSize: 25
};


export const MOCK_PROFILES = {
  'admin-001': {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@agriware.com',
    phone: '+1 (555) 123-4567',
    department: 'Management',
    employeeId: 'ADM-001',
    position: 'System Administrator',
    shift: 'Day'
  },
  'staff-001': {
    firstName: 'Warehouse',
    lastName: 'Staff',
    email: 'staff@agriware.com',
    phone: '+1 (555) 987-6543',
    emergencyContact: '+1 (555) 111-2222',
    employeeId: 'STF-001',
    position: 'Inventory Specialist',
    shift: 'Morning'
  },
  'worker-001': {
    firstName: 'Field',
    lastName: 'Worker',
    email: 'worker@agriware.com',
    employeeId: 'WRK-001',
    position: 'Picker/Packer',
    shift: 'Evening'
  },
  'user-001': {
    firstName: 'Regular',
    lastName: 'User',
    email: 'user@agriware.com',
    phone: '+1 (555) 555-5555',
    contactMethod: 'email'
  }
};