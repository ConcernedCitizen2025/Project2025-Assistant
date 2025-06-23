// assets/js/reader-toggle.js

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("globalReaderToggle");

  btn.addEventListener("click", () => {
    // toggle the class on <body>
    const inReader = document.body.classList.toggle("reader-mode");

    // update the button text
    btn.textContent = inReader
      ? "← Back to Normal View"
      : "Reader View";
  });
});
