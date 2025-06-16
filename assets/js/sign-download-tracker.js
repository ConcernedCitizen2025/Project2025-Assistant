// assets/js/sign-download-tracker.js
document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll('.sign-download').forEach(function(link) {
    link.addEventListener('click', function() {
      if (typeof gtag === 'function') {
        gtag('event', 'sign_download', {
          event_category: 'Protest Sign',
          event_label: link.dataset.sign
        });
      }
    });
  });
});
