// === PORTFOLIO: UI BEHAVIOR, ACCESSIBILITY & SAFETY ===
const floatContact = document.getElementById('floatContact');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalDialog = modalBackdrop ? modalBackdrop.querySelector('.modal') : null;
const cfCancel = document.getElementById('cf-cancel');
const cfSend = document.getElementById('cf-send');

const lightbox = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightboxContent');
const lbClose = document.getElementById('lb-close');

let lastFocusedElement = null;

// Helper: find focusable elements
function getFocusable(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'))
    .filter(el => el.offsetParent !== null);
}

// Focus trap implementation
function trapFocus(container) {
  const focusable = getFocusable(container);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function keyHandler(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container._focusHandler = keyHandler;
  container.addEventListener('keydown', keyHandler);
  first.focus();
}

function releaseFocus(container) {
  if (!container || !container._focusHandler) return;
  container.removeEventListener('keydown', container._focusHandler);
  delete container._focusHandler;
}

// Modal handlers
function openModal() {
  if (!modalBackdrop) return;
  lastFocusedElement = document.activeElement;
  modalBackdrop.classList.add('active');
  modalBackdrop.setAttribute('aria-hidden', 'false');
  floatContact && floatContact.setAttribute('aria-expanded', 'true');
  trapFocus(modalDialog);
}

function closeModal() {
  if (!modalBackdrop) return;
  modalBackdrop.classList.remove('active');
  modalBackdrop.setAttribute('aria-hidden', 'true');
  floatContact && floatContact.setAttribute('aria-expanded', 'false');
  releaseFocus(modalDialog);
  if (lastFocusedElement) lastFocusedElement.focus();
}

if (floatContact && modalBackdrop) {
  floatContact.addEventListener('click', () => {
    openModal();
  });
}
if (cfCancel && modalBackdrop) {
  cfCancel.addEventListener('click', () => {
    closeModal();
  });
}

// Clicking backdrop closes modal when clicking outside dialog
if (modalBackdrop) {
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
}

// Lightbox handlers
function openLightbox(src, alt) {
  if (!lightbox) return;
  lastFocusedElement = document.activeElement;
  if (lightboxContent) lightboxContent.innerHTML = `<img src="${src}" alt="${alt || 'Preview'}" />`;
  lightbox.classList.add('active');
  lightbox.setAttribute('aria-hidden', 'false');
  trapFocus(lightbox.querySelector('.panel'));
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('active');
  lightbox.setAttribute('aria-hidden', 'true');
  releaseFocus(lightbox.querySelector('.panel'));
  if (lastFocusedElement) lastFocusedElement.focus();
}

document.querySelectorAll('[data-lightbox]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const img = el.querySelector('img');
    if (!img) return;
    openLightbox(img.src, img.alt);
  });
});

if (lbClose && lightbox) {
  lbClose.addEventListener('click', () => {
    closeLightbox();
  });
}

// Close lightbox when clicking backdrop
if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

// Global keyboard handling (Escape to close active overlay)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalBackdrop && modalBackdrop.classList.contains('active')) closeModal();
    if (lightbox && lightbox.classList.contains('active')) closeLightbox();
  }
});

// === FILTER BUTTONS ===
const filterBtns = document.querySelectorAll('.filter-buttons .btn');
const projectItems = document.querySelectorAll('.project-card');

if (filterBtns.length && projectItems.length) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      projectItems.forEach(item => {
        if (filter === 'all') item.style.display = 'block';
        else item.style.display = item.classList.contains(filter) ? 'block' : 'none';
      });
    });
  });
}

// === CONTACT FORM (optional send logic) ===
if (cfSend) {
  cfSend.addEventListener('click', () => {
    const name = document.getElementById('cf-name').value;
    const email = document.getElementById('cf-email').value;
    const message = document.getElementById('cf-message').value;

    if (name && email && message) {
      alert(`Thank you ${name}, your message has been sent!`);
      closeModal();
    } else {
      alert('Please fill all fields.');
    }
  });
}
