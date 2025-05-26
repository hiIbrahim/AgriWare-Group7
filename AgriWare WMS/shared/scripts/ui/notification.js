import { NOTIFICATION_CONFIG } from "../config.js";

// /**
//  * Shows a notification with optional action button
//  * @param {string} message - Notification message
//  * @param {string} type - Notification type (success, error, warning, info)
//  * @param {object} options - Additional options
//  * @param {object} options.action - Action button configuration
//  * @param {string} options.action.text - Button text
//  * @param {function} options.action.callback - Click handler
//  * @param {number} options.timeout - Auto-dismiss timeout (ms)
//  */
export function showNotification(message, type = "info", options = {}) {
  const config = NOTIFICATION_CONFIG.types[type] || NOTIFICATION_CONFIG.types.info;
  const container = document.createElement("div");
  container.className = "notification-container position-fixed top-0 end-0 p-3";
  container.style.zIndex = "1100";

  const alert = document.createElement("div");
  alert.className = `alert ${config.class} alert-dismissible fade show d-flex align-items-center`;

  // Notification content
  const content = document.createElement("div");
  content.className = "d-flex align-items-center flex-grow-1";
  content.innerHTML = `<i class="fas fa-${config.icon} me-2"></i>${message}`;

  // Action button if provided
  if (options.action) {
    const actionBtn = document.createElement("button");
    actionBtn.className = "btn btn-sm ms-2";
    actionBtn.classList.add(
      type === "warning" ? "btn-outline-warning" : "btn-outline-light"
    );
    actionBtn.textContent = options.action.text;
    actionBtn.onclick = options.action.callback;
    content.appendChild(actionBtn);
  }

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn-close";
  closeBtn.setAttribute("data-bs-dismiss", "alert");
  closeBtn.setAttribute("aria-label", "Close");

  alert.appendChild(content);
  alert.appendChild(closeBtn);
  container.appendChild(alert);
  document.body.appendChild(container);

  // Auto-dismiss if no action or custom timeout
  const timeout = options.action 
  ? options.timeout || NOTIFICATION_CONFIG.timeout.withAction
  : NOTIFICATION_CONFIG.timeout.default;  setTimeout(() => {
    alert.classList.remove("show");
    setTimeout(() => container.remove(), 150);
  }, timeout);
}

// Initialize notification styles if not already present
if (!document.getElementById("notification-styles")) {
  const style = document.createElement("style");
  style.id = "notification-styles";
  style.textContent = `
      .notification-container {
        min-width: 300px;
        max-width: 100%;
      }
      .notification-container .alert {
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
      }
    `;
  document.head.appendChild(style);
}
