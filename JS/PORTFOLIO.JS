// Portfolio Specific Logic

document.addEventListener("DOMContentLoaded", function () {
  // 1. Typing Animation
  const words = ["Websites", "Photography", "Branding", "Cinematography"];
  let i = 0;
  const typingSpan = document.getElementById("typing");
  
  if (typingSpan) {
    setInterval(() => {
      typingSpan.style.opacity = 0;
      setTimeout(() => {
        typingSpan.innerText = words[i];
        typingSpan.style.opacity = 1;
        i = (i + 1) % words.length;
      }, 500);
    }, 2500);
  }

  // 2. Project Filtering Logic
  const filterButtons = document.querySelectorAll(".filter-buttons .btn");
  const projectItems = document.querySelectorAll(".project-item");

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Update active button
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      const filterValue = this.getAttribute("data-filter");

      projectItems.forEach((item) => {
        item.style.opacity = "0";
        item.style.transform = "scale(0.8)";
        
        setTimeout(() => {
          if (filterValue === "all" || item.classList.contains(filterValue)) {
            item.style.display = "block";
            setTimeout(() => {
              item.style.opacity = "1";
              item.style.transform = "scale(1)";
            }, 50);
          } else {
            item.style.display = "none";
          }
        }, 400);
      });
    });
  });

  // Apply filter if URL hash present (e.g., #web-design)
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const targetBtn = Array.from(filterButtons).find(b => b.getAttribute('data-filter') === hash);
    if (targetBtn) {
      targetBtn.click();
      // scroll to grid
      const grid = document.getElementById('project-grid');
      if (grid) grid.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // 3. Modal Case Study Population
  const projectModal = document.getElementById("projectModal");
  if (projectModal) {
    projectModal.addEventListener("show.bs.modal", (event) => {
      const button = event.relatedTarget;
      const title = button.getAttribute("data-title");
      const category = button.getAttribute("data-category");
      const image = button.getAttribute("data-image");
      const description = button.getAttribute("data-description");

      projectModal.querySelector("#modalProjectTitle").textContent = title;
      projectModal.querySelector("#modalProjectCategory").textContent = category;
      projectModal.querySelector("#modalProjectImage").src = image;
      projectModal.querySelector("#modalProjectDescription").textContent = description;
    });
  }

  // 4. Stats Counter Animation
  const counters = document.querySelectorAll(".number");
  const speed = 200;

  const animateCounters = () => {
    counters.forEach((counter) => {
      const target = +counter.getAttribute("data-target");
      const count = +counter.innerText;
      const inc = target / speed;

      if (count < target) {
        counter.innerText = Math.ceil(count + inc);
        setTimeout(animateCounters, 10);
      } else {
        counter.innerText = target;
      }
    });
  };

  // Simple trigger for counters when section is in view
  const statsSection = document.querySelector(".stats-counter");
  if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateCounters();
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(statsSection);
  }
});
