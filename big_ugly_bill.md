---
layout: default
title: "Big Ugly Bill — Full Text"
---

## Full Text of the “Big Ugly Bill”

<iframe
  src="{{ '/assets/pdfjs/web/viewer.html' | relative_url }}?file={{ '/assets/docs/big_ugly_bill.pdf' | relative_url | url_encode }}"
  width="100%"
  height="800"
  style="border:none;"
></iframe>

<button id="back-to-top" style="margin:1em 0;">
  ↑ Back to Top
</button>
<script>
  document.getElementById('back-to-top').onclick = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });
</script>
