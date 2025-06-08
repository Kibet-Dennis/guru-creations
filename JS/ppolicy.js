// extras.js

// Auto-close mobile nav on link click
document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
  const navbarCollapse = document.getElementById("navMenu");

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 992) {
        new bootstrap.Collapse(navbarCollapse).hide();
      }
    });
  });
});

// Scroll to top on load
window.addEventListener("load", () => {
  window.scrollTo(0, 0);
});

// Optional: Animate WhatsApp button in
const wa = document.querySelector(".whatsapp-float");
wa.classList.add("wa-in");

// Optional: Add a click event to the WhatsApp button
wa.addEventListener("click", () => {
  window.open("https://wa.me/1234567890", "_blank"); // Replace with your WhatsApp number
}, false);      
// Optional: Add a click event to the WhatsApp button for mobile
wa.addEventListener("touchstart", () => {
  window.open("https://wa.me/1234567890", "_blank"); // Replace with your WhatsApp number
}, false);
// Optional: Add a click event to the WhatsApp button for desktop
wa.addEventListener("mousedown", () => {
  window.open("https://wa.me/1234567890", "_blank"); // Replace with your WhatsApp number
}, false);



// Optional: Add a click event to the WhatsApp button for keyboard users
wa.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    window.open("https://wa.me/1234567890", "_blank"); // Replace with your WhatsApp number
  }
}, false);
