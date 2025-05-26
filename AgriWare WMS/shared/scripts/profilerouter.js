// shared/scripts/profilerouter.js
import { checkSession } from "../scripts/auth/session.js";
import { showNotification } from "./ui/notification.js";
import { DEFAULT_REDIRECT } from "./config.js";

export async function loadComponent(containerId, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }
    container.innerHTML = await response.text();
  } catch (error) {
    console.error(`Error loading ${url}:`, error);
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          Failed to load component: ${error.message}
        </div>
      `;
    }
    throw error;
  }
}

export async function loadProfile() {
  try {
    const user = await checkSession();
    if (!user) {
      window.location.href = `${DEFAULT_REDIRECT}?session_expired=1`;
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get("id") || user.id;

    // profile access
    if (profileId !== user.id && user.role !== "admin") {
      showNotification("Access denied: Invalid profile permissions", "error");
      window.location.href = "./403.html";
      return;
    }

    // Load appropriate profile view
    let profileView;
    switch (user.role) {
      case "admin":
        profileView = "adminp.html";
        break;
      case "staff":
        profileView = "staffp.html";
        break;
      case "worker":
        profileView = "workerp.html";
        break;
      default:
        profileView = "userp.html";
    }

    await loadComponent(
      "profileContainer",
      "./partials/profiles/" + profileView
    ).catch(async (error) => {
      console.error("Failed to load profile view:", error);
      await loadComponent(
        "profileContainer",
        "./partials/profiles/userp.html"
      );
      showNotification("Loaded basic profile view", "warning");
    });

    // Update profile header
    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileRole").textContent =
      user.role.charAt(0).toUpperCase() + user.role.slice(1);
  } catch (error) {
    console.error("Failed to load profile:", error);
    showNotification("Failed to load profile data", "error");
    window.location.href = "../shared/401.html";
  }
}