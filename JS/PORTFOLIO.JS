// Guru Creations Portfolio Interactivity
document.addEventListener("DOMContentLoaded", () => {
  // Gallery Tabs
  const tabs = document.querySelectorAll(".tab-btn");
  const grids = document.querySelectorAll(".gallery-grid");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.dataset.tab;
      grids.forEach(grid => {
        grid.classList.toggle("active", grid.id === target);
      });
    });
  });

  // Floating Contact Button
  const floatBtn = document.getElementById("floatContact");
  floatBtn.addEventListener("click", () => {
    document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
  });

  // Navbar Smooth Scroll
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      target.scrollIntoView({ behavior: "smooth" });
    });
  });
});
