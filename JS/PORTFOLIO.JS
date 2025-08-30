// === FLOATING CONTACT BUTTON & MODAL ===
const floatContact = document.getElementById('floatContact');
const modalBackdrop = document.getElementById('modalBackdrop');
const cfCancel = document.getElementById('cf-cancel');

floatContact.addEventListener('click', () => {
  modalBackdrop.classList.add('active');
});
cfCancel.addEventListener('click', () => {
  modalBackdrop.classList.remove('active');
});

// === LIGHTBOX ===
const lightbox = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightboxContent');
const lbClose = document.getElementById('lb-close');

document.querySelectorAll('[data-lightbox]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const src = el.querySelector('img').src;
    lightboxContent.innerHTML = `<img src="${src}" alt="Preview" />`;
    lightbox.classList.add('active');
  });
});
lbClose.addEventListener('click', () => {
  lightbox.classList.remove('active');
});

// === FILTER BUTTONS ===
const filterBtns = document.querySelectorAll('.filter-buttons .btn');
const projectItems = document.querySelectorAll('.project-item');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    projectItems.forEach(item => {
      if(filter === 'all') item.style.display = 'block';
      else item.style.display = item.classList.contains(filter) ? 'block' : 'none';
    });
  });
});

// === CONTACT FORM (optional send logic) ===
const cfSend = document.getElementById('cf-send');
cfSend.addEventListener('click', () => {
  const name = document.getElementById('cf-name').value;
  const email = document.getElementById('cf-email').value;
  const message = document.getElementById('cf-message').value;

  if(name && email && message) {
    alert(`Thank you ${name}, your message has been sent!`);
    modalBackdrop.classList.remove('active');
  } else {
    alert('Please fill all fields.');
  }
});
