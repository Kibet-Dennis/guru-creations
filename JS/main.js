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
// Book with us button 
document.querySelector(".btn-book").addEventListener("mouseenter", function () {
  this.style.transition = "all 0.3s ease-in-out";
});


// blog section 
// Add hover effect with slight zoom animation
document.querySelectorAll(".blog-post").forEach((post) => {
  post.addEventListener("mouseenter", () => {
    post.style.transition = "all 0.3s ease-in-out";
  });
});

// Lazy load blog images for performance boost
document.addEventListener("DOMContentLoaded", function () {
  const images = document.querySelectorAll(".blog-img img");
  images.forEach((img) => {
    img.setAttribute("loading", "lazy");
  });
});

// Our team section 
// Add hover effect with slight zoom animation
document.querySelectorAll(".team-member").forEach((member) => {
  member.addEventListener("mouseenter", () => {
    member.style.transition = "all 0.3s ease-in-out";
  });
});

// Lazy load team images for better performance
document.addEventListener("DOMContentLoaded", function () {
  const images = document.querySelectorAll(".team-img img");
  images.forEach((img) => {
    img.setAttribute("loading", "lazy");
  });
});


// Select all FAQ questions
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  item.addEventListener("click", () => {
    // Close all open FAQs
    faqItems.forEach((faq) => {
      if (faq !== item) {
        faq.classList.remove("active");
      }
    });

    // Toggle the selected FAQ
    item.classList.toggle("active");
  });
});


// Contact us  Section 
document.querySelector(".contact-form").addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent default form submission

  // Simulate form submission process
  setTimeout(() => {
    alert("Your message has been sent successfully! We will get back to you soon.");
    this.reset(); // Reset the form after submission
  }, 1000);
});



