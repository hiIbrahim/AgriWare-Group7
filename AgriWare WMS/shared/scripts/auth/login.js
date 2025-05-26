// shared/scripts/auth/login.js
import { APP_CONFIG } from "../config.js";
import { authenticate } from "./mockusers.js";
import { createSession, checkSession, clearSession } from "./session.js";
import { updateRoleBadge } from "../ui/rolebadge.js";
import { showNotification } from "../ui/notification.js";

export function initLogin() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  // Check for existing valid session
  checkSession().then((user) => {
    if (user) {
      redirectUser(user.role);
    }
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const loginBtn = loginForm.querySelector('[type="submit"]');

    try {
      loginBtn.disabled = true;
      loginBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm"></span> Logging in...';

      const email = loginForm.querySelector("#loginEmail").value.trim();
      const password = loginForm.querySelector("#loginPassword").value;

      if (!email || !password) {
        throw new Error("Please enter both email and password");
      }

      const user = await authenticateUser(email, password);
      createSession(user);
      await handleSuccessfulLogin(user);
    } catch (error) {
      handleLoginError(error, loginForm, loginBtn);
    }
  });
}

async function authenticateUser(email, password) {
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay
  const user = authenticate(email, password);

  if (!user) throw new Error("Invalid email or password");
  if (password.length < APP_CONFIG.minPasswordLength) {
    throw new Error(
      `Password must be at least ${APP_CONFIG.minPasswordLength} characters`
    );
  }

  return user;
}

async function handleSuccessfulLogin(user) {
  updateRoleBadge();
  showNotification(`Welcome, ${user.name}!`, "success");
  await new Promise((resolve) => setTimeout(resolve, 800));
  redirectUser(user.role);
}

function redirectUser(role) {
  const basePath = window.location.pathname.includes("/shared/") ? "../" : "./";
  const routes = {
    admin: `${basePath}admin/dashboard.html`,
    staff: `${basePath}admin/inventory.html`,
    worker: `${basePath}worker/tasks.html`,
    user: `${basePath}orders/new.html`,
  };
  window.location.href = routes[role] || `${basePath}shared/login.html`;
}

function handleLoginError(error, form, button) {
  console.error("Login error:", error);
  showNotification(error.message, "danger");
  form.querySelector("#loginPassword").value = "";
  button.disabled = false;
  button.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i> Login';
  form.classList.add("shake");
  setTimeout(() => form.classList.remove("shake"), 500);
}

export function checkLogoutStatus() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("logout")) {
    clearSession();
    if (!document.querySelector(".notification-container")) {
      showNotification("Logged out successfully", "success");
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
