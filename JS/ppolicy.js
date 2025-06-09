// Particle Canvas Animation (Optional but futuristic)
const canvas = document.getElementById('particle-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [];

  function initParticles() {
    particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        dx: Math.random() * 0.5 - 0.25,
        dy: Math.random() * 0.5 - 0.25,
      });
    }
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = document.querySelector('.hero').offsetHeight;
    initParticles();
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff55';
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });
    requestAnimationFrame(drawParticles);
  }

  resizeCanvas();
  drawParticles();
  window.addEventListener('resize', resizeCanvas);
}

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

