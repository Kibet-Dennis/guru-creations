// Smooth Scroll for Back to Top Button
const backToTop = document.getElementById("back-to-top-btn");
window.onscroll = () => {
  backToTop.style.display = window.scrollY > 300 ? "block" : "none";
};
backToTop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

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
