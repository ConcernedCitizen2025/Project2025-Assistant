<script>
document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll('.sign-download').forEach(link => {
    link.addEventListener('click', () => {
      if (window.gtag) {
        gtag('event', 'sign_download', {
          event_category: 'Protest Sign',
          event_label: link.dataset.sign,
        });
      }
    });
  });
});
</script>
