document.addEventListener("DOMContentLoaded", function () {
  // Initialize AOS (Animate on Scroll)
  AOS.init({
    offset: 200,
    duration: 1000,
    easing: "ease-in-out",
    once: true,
  });
});

// Hero section 
document.addEventListener("DOMContentLoaded", function () {
  // Dynamic Text Animation
  const textElement = document.getElementById("dynamic-text");
  const textOptions = [
    "Elevate Your Brand with Digital Excellence",
    "Innovative Solutions for a Digital World",
    "Your Success, Our Passion",
    "Building the Future of Digital Media"
  ];
  let textIndex = 0;

  setInterval(() => {
    textElement.style.opacity = 0;
    setTimeout(() => {
      textElement.innerText = textOptions[textIndex];
      textElement.style.opacity = 1;
      textIndex = (textIndex + 1) % textOptions.length;
    }, 500);
  }, 4000);

  // Particle Effect
  const canvas = document.getElementById("particle-canvas");
  const ctx = canvas.getContext("2d");
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function Particle(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 2 - 1;
    this.speedY = Math.random() * 2 - 1;
    this.alpha = 1;
  }

  Particle.prototype.update = function () {
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= 0.02;
  };

  Particle.prototype.draw = function () {
    ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  };

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    requestAnimationFrame(animateParticles);
  }

  window.addEventListener("resize", resizeCanvas);
  canvas.addEventListener("mousemove", function (event) {
    for (let i = 0; i < 5; i++) {
      particles.push(new Particle(event.clientX, event.clientY));
    }
  });

  resizeCanvas();
  animateParticles();
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

window.onload = function () {
  document.documentElement.scrollTop = 0;
};

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

// Footer section 
// Smooth scroll to top when clicking the logo
document.querySelector(".footer-logo").addEventListener("click", function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Whats up floating button 
document.addEventListener("DOMContentLoaded", function () {
  const whatsappBtn = document.querySelector(".whatsapp-float");

  // Add bounce effect every 5 seconds
  setInterval(() => {
    whatsappBtn.classList.add("bounce");

    setTimeout(() => {
      whatsappBtn.classList.remove("bounce");
    }, 1500);
  }, 5000);
});


// Back to top button 
document.addEventListener("DOMContentLoaded", function () {
  const backToTopBtn = document.getElementById("back-to-top-btn");

  // Show/hide button when scrolling
  window.addEventListener("scroll", function () {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  });

  // Smooth scroll to top
  backToTopBtn.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
});



