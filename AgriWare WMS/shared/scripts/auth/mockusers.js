const MOCK_USERS = [
  {
    id: "admin-001",
    email: "admin@agriware.com",
    password: "admin123",
    role: "admin",
    name: "System Admin",
    permissions: [
      "all",
      "scan_items",
      "view_dashboard",
      "manage_orders",
      "manage_staff",
      "manage_inventory",
      "view_reports",
    ],
    avatar: "/assets/avatars/admin.png",
  },
  {
    id: "staff-001",
    email: "staff@agriware.com",
    password: "staff123",
    role: "staff",
    name: "Warehouse Staff",
    permissions: [
      "process_orders",
      "view_inventory",
      "view_profile",
      "scan_items",
      "view_staff",
      "view_orders",
    ],
    avatar: "/assets/avatars/staff.png",
  },
  {
    id: "worker-001",
    email: "worker@agriware.com",
    password: "worker123",
    role: "worker",
    name: "Field Worker",
    permissions: ["view_tasks", "scan_items", "clock_in", "view_shiftlog"],
    avatar: "/assets/avatars/worker.png",
  },

  {
    id: "user-001", // Changed from number to string
    email: "user@agriware.com",
    password: "users123",
    role: "user",
    name: "Regular User", // Added name
    permissions: ["create_orders", "view_orders", "edit_profile"],
    avatar: "/assets/avatars/user.png", // Added avatar
  },
];

// /**
//  * Authenticates user credentials
//  * @param {string} email - User email
//  * @param {string} password - User password
//  * @returns {object|null} User object or null if invalid
//  */
export function authenticate(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    MOCK_USERS.find(
      (user) =>
        user.email.toLowerCase() === normalizedEmail &&
        user.password === password
    ) || null
  );
}

// /**
//  * Gets user by ID
//  * @param {string} userId
//  * @returns {object|null} User object or null
//  */
export function getUserById(userId) {
  return MOCK_USERS.find((user) => user.id === userId) || null;
}
