document.addEventListener("DOMContentLoaded", function () {
  // Initialize AOS (Animate on Scroll)
  AOS.init({
    offset: 200,
    duration: 1000,
    easing: "ease-in-out",
    once: true,
  });
});

// Navbar 
// Optional scroll shadow effect
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.custom-navbar');
  if (window.scrollY > 30) {
    navbar.style.background = 'rgba(0, 0, 0, 0.75)';
    navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
  } else {
    navbar.style.background = 'rgba(255, 255, 255, 0.1)';
    navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
  }
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

// About us section 
document.addEventListener("DOMContentLoaded", function () {
  const aboutSection = document.querySelector(".about-text");
  const features = document.querySelectorAll(".features-list li");

  function fadeInElements() {
    if (aboutSection.getBoundingClientRect().top < window.innerHeight - 100) {
      aboutSection.style.opacity = "1";
      aboutSection.style.transform = "translateY(0)";
    }

    features.forEach((feature, index) => {
      setTimeout(() => {
        feature.style.opacity = "1";
        feature.style.transform = "translateX(0)";
      }, index * 200);
    });
  }

  window.addEventListener("scroll", fadeInElements);
  fadeInElements();
});





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

// Our process 
document.addEventListener("DOMContentLoaded", function () {
  const steps = document.querySelectorAll(".process-box");

  function fadeInSteps() {
    steps.forEach((step, index) => {
      if (step.getBoundingClientRect().top < window.innerHeight - 100) {
        step.style.opacity = "1";
        step.style.transform = "translateY(0)";
      }
    });
  }

  window.addEventListener("scroll", fadeInSteps);
  fadeInSteps();
});




// Pricing section 
document.addEventListener("DOMContentLoaded", function () {
  const toggleSwitch = document.getElementById("pricing-toggle");
  const priceValues = {
    starter: { monthly: "$199", yearly: "$1799" },
    pro: { monthly: "$499", yearly: "$4499" },
    enterprise: { monthly: "Custom Pricing", yearly: "Custom Pricing" }
  };

  toggleSwitch.addEventListener("change", function () {
    const isYearly = toggleSwitch.checked;
    document.getElementById("starter-price").innerHTML = isYearly
      ? `<strong>${priceValues.starter.yearly}</strong> / year`
      : `<strong>${priceValues.starter.monthly}</strong> / month`;

    document.getElementById("pro-price").innerHTML = isYearly
      ? `<strong>${priceValues.pro.yearly}</strong> / year`
      : `<strong>${priceValues.pro.monthly}</strong> / month`;

    document.getElementById("enterprise-price").innerHTML = isYearly
      ? `<strong>${priceValues.enterprise.yearly}</strong>`
      : `<strong>${priceValues.enterprise.monthly}</strong>`;
  });
});


// Requesting for consultation form 
document.getElementById('fcs-form').addEventListener('submit', function (e) {
  e.preventDefault();

  let valid = true;

  const name = document.getElementById("fcs-name");
  const email = document.getElementById("fcs-email");
  const message = document.getElementById("fcs-message");

  document.getElementById("fcs-name-error").textContent = "";
  document.getElementById("fcs-email-error").textContent = "";
  document.getElementById("fcs-message-error").textContent = "";

  if (name.value.trim() === "") {
    document.getElementById("fcs-name-error").textContent = "Full name is required.";
    valid = false;
  }

  if (email.value.trim() === "" || !email.value.includes("@")) {
    document.getElementById("fcs-email-error").textContent = "Valid email is required.";
    valid = false;
  }

  if (message.value.trim().length < 10) {
    document.getElementById("fcs-message-error").textContent = "Please describe your project.";
    valid = false;
  }

  if (valid) {
    alert("Thank you! Your request has been submitted.");
    this.reset();
  }
});

// Our portfolio section
// JavaScript for Portfolio Functionality

document.addEventListener('DOMContentLoaded', function () {
  // 1. Section Introduction Animation (Fade-up/Slide-in)
  const portfolioIntro = document.getElementById('portfolio-intro');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target); // Stop observing once animated
      }
    });
  }, { threshold: 0.1 }); // Trigger when 10% of the element is visible

  if (portfolioIntro) {
    observer.observe(portfolioIntro);
  }

  // 2. Project Filtering
  const filterButtons = document.querySelectorAll('.filter-buttons .btn');
  const projectItems = document.querySelectorAll('.project-item');
  const projectGrid = document.getElementById('project-grid');

  filterButtons.forEach(button => {
    button.addEventListener('click', function () {
      // Remove 'active' class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      // Add 'active' class to the clicked button
      this.classList.add('active');

      const filterValue = this.getAttribute('data-filter');

      // Apply filtering with a slight delay for animation
      projectItems.forEach(item => {
        // Hide all items initially for a cleaner re-arrangement
        item.style.opacity = '0';
        item.style.transform = 'scale(0.9)';
        item.style.display = 'none'; // Hide to prevent layout issues during animation
      });

      setTimeout(() => { // Small delay to allow opacity/transform to start
        projectItems.forEach(item => {
          if (filterValue === 'all' || item.classList.contains(filterValue)) {
            item.style.display = 'block'; // Make visible first
            setTimeout(() => { // Then fade/scale in
              item.style.opacity = '1';
              item.style.transform = 'scale(1)';
            }, 50); // Slight delay for individual items
          }
        });
      }, 300); // Wait for all items to start hiding
    });
  });

  // 3. Lightbox (Bootstrap Modal) Functionality
  const projectModal = document.getElementById('projectModal');
  projectModal.addEventListener('show.bs.modal', event => {
    // Button that triggered the modal
    const button = event.relatedTarget;
    // Extract info from data-* attributes
    const title = button.getAttribute('data-title');
    const category = button.getAttribute('data-category');
    const image = button.getAttribute('data-image');
    const description = button.getAttribute('data-description');

    // Update the modal's content.
    const modalProjectTitle = projectModal.querySelector('#modalProjectTitle');
    const modalProjectCategory = projectModal.querySelector('#modalProjectCategory');
    const modalProjectImage = projectModal.querySelector('#modalProjectImage');
    const modalProjectDescription = projectModal.querySelector('#modalProjectDescription');

    modalProjectTitle.textContent = title;
    modalProjectCategory.textContent = category;
    modalProjectImage.src = image;
    modalProjectImage.alt = title;
    modalProjectDescription.textContent = description;
  });

  // 4. Stats Counter Animation
  const statsSection = document.querySelector('.stats-counter');
  const statItems = document.querySelectorAll('.stats-counter .number');
  let statsAnimated = false; // Flag to ensure animation runs only once

  const startCounter = (entry) => {
    if (entry.isIntersecting && !statsAnimated) {
      statItems.forEach(item => {
        const target = parseInt(item.getAttribute('data-target'));
        let current = 0;
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 10); // Calculate increment per 10ms

        const counter = setInterval(() => {
          current += increment;
          if (current < target) {
            item.textContent = Math.ceil(current);
          } else {
            item.textContent = target;
            clearInterval(counter);
          }
        }, 10);
      });
      statsAnimated = true; // Set flag to true
    }
  };

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(startCounter);
  }, { threshold: 0.5 }); // Trigger when 50% of the section is visible

  if (statsSection) {
    statsObserver.observe(statsSection);
  }
});


// Lightbox Feature
function openLightbox(imageSrc, caption) {
  document.getElementById("lightbox-img").src = imageSrc;
  document.getElementById("lightbox-caption").textContent = caption;
  document.getElementById("lightbox").classList.add("show");
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("show");
}


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
document.addEventListener("DOMContentLoaded", function () {
  // Add slight hover effect on team members
  document.querySelectorAll(".team-member").forEach((member) => {
    member.addEventListener("mouseenter", () => {
      member.style.transition = "all 0.3s ease-in-out";
    });
  });

  // Lazy load team images for better performance
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

  if (!backToTopBtn) return; // Ensure the button exists

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
;



