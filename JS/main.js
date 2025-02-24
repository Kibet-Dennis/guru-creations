document.addEventListener("DOMContentLoaded", function () {
  // Initialize AOS (Animate on Scroll)
  AOS.init({
    offset: 200,
    duration: 1000,
    easing: "ease-in-out",
    once: true,
  });
});

// Why choose us  section 
// Adding Interactive Animations on Scroll
document.addEventListener("DOMContentLoaded", function () {
  const featureBoxes = document.querySelectorAll(".feature-box");
  let delay = 100;

  featureBoxes.forEach((box, index) => {
    setTimeout(() => {
      box.style.opacity = "1";
      box.style.transform = "scale(1)";
    }, delay * (index + 1));
  });
});

// Smooth Scroll to Section
document.querySelector(".why-choose-us").scrollIntoView({ behavior: "smooth" });





// Our services section 
// Adding Interactive Animations on Scroll
document.addEventListener("DOMContentLoaded", function () {
  const serviceBoxes = document.querySelectorAll(".service-box");
  let delay = 100;

  serviceBoxes.forEach((box, index) => {
    setTimeout(() => {
      box.style.opacity = "1";
      box.style.transform = "scale(1)";
    }, delay * (index + 1));
  });
});

// Smooth Scroll to Section
document.querySelector(".services").scrollIntoView({ behavior: "smooth" });
