document.addEventListener('DOMContentLoaded', () => {
  const btns = document.querySelectorAll('#globalReaderToggle');
  btns.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      document.body.classList.toggle('reader-mode');
      // if you like, update the URL fragment so back/forward still works:
      if (document.body.classList.contains('reader-mode')) {
        history.replaceState(null,'','?#reader');
      } else {
        history.replaceState(null,'','?#');
      }
    });
  });
  // on load, restore from fragment:
  if (location.hash === '#reader') {
    document.body.classList.add('reader-mode');
  }
});
