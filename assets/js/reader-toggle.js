// assets/js/reader-toggle.js
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('globalReaderToggle');
  if (!btn) return;

  btn.addEventListener('click', e => {
    e.preventDefault();
    const on = document.body.classList.toggle('reader-mode');
    // show/hide the read-aloud controls
    document.getElementById('readAloudContainer').style.display = on ? 'block' : 'none';
    // update the button text
    btn.textContent = on ? '← Exit Reader View' : 'Reader View';
  });
});
