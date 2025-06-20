document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('globalReaderToggle');
  if (!btn) return;

  // restore state from hash
  if (location.hash === '#reader') {
    document.body.classList.add('reader-mode');
    btn.textContent = 'Exit Reader View';
  }

  btn.addEventListener('click', e => {
    e.preventDefault();
    const on = document.body.classList.toggle('reader-mode');
    btn.textContent = on ? 'Exit Reader View' : 'Reader View';
    // update URL fragment so back/forward works
    history.replaceState(null, '', on ? '#reader' : '#');
  });
});
