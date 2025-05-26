import { ROLE_PATHS, DEFAULT_REDIRECT } from "../config.js";

export function redirectBasedOnRole(user) {
  try {
    if (!user) {
      localStorage.removeItem("wms_user");
      window.location.href = "/shared/login.html?error=no_user";
      return;
    }

    const currentPath = window.location.pathname;
    const allowedPaths = ROLE_PATHS[user.role] || [];
    console.log("ROLE:", user.role, "PATH:", currentPath, "ALLOWED:", allowedPaths);

    const isAllowed = allowedPaths.some(
      (path) => path === currentPath || path === "/" || currentPath.startsWith(path)
    );
    if (!isAllowed) {
      localStorage.setItem("redirect_error", "unauthorized_access");
      window.location.href = `${DEFAULT_REDIRECT}?from=${encodeURIComponent(
        currentPath
      )}&requires=role_${user.role}`;
      return;
    }
  } catch (error) {
    console.error("Redirect error:", error);
    localStorage.clear();
    window.location.href = "/shared/404.html?error=system_error";
  }
}
