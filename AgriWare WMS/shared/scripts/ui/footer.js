export function loadFooter() {
  // Optionally, load footer HTML dynamically here
  const container = document.getElementById("footerContainer");
  if (container) {
    container.innerHTML = `<footer class="footer bg-light text-center py-3">
      <span class="text-muted">&copy; ${new Date().getFullYear()} AgriWare WMS</span>
    </footer>`;
  }
}