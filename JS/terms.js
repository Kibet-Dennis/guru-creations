// Smooth Scroll for Back to Top Button
const backToTop = document.getElementById("back-to-top-btn");
window.onscroll = () => {
  backToTop.style.display = window.scrollY > 300 ? "block" : "none";
};
backToTop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });


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


// jsPDF Terms Download
async function downloadTermsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const sections = document.querySelectorAll(".accordion-header button");
  const contents = document.querySelectorAll(".accordion-body");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Terms of Service - Guru Creations", 10, 20);

  let y = 30;
  for (let i = 0; i < sections.length; i++) {
    const title = sections[i].textContent.trim();
    const content = contents[i].textContent.trim();

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 255);
    doc.text(title, 10, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const splitContent = doc.splitTextToSize(content, 180);
    doc.text(splitContent, 10, y);
    y += splitContent.length * 6 + 6;

    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }

  doc.save("Terms-of-Service-GuruCreations.pdf");
}

// Table of Contents (TOC)
// document.addEventListener("DOMContentLoaded", () => {
//   const toc = document.getElementById("toc-container");
//   if (!toc) return;

//   toc.innerHTML = `<h5>On this page</h5><ul></ul>`;
//   const list = toc.querySelector("ul");

//   document.querySelectorAll(".accordion-item").forEach((item, index) => {
//     const id = "terms" + (index + 1);
//     const title = item.querySelector(".accordion-button").textContent.trim();
//     const anchor = document.createElement("li");
//     anchor.innerHTML = `<a href="#${id}">${title}</a>`;
//     list.appendChild(anchor);
//   });
// });

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


// Cookie Consent
const cookieBanner = document.getElementById("cookie-banner");
const acceptBtn = document.getElementById("accept-cookies");

if (!localStorage.getItem("cookiesAccepted")) {
  cookieBanner.style.display = "flex";
}

acceptBtn.addEventListener("click", () => {
  localStorage.setItem("cookiesAccepted", "true");
  cookieBanner.style.display = "none";
});
