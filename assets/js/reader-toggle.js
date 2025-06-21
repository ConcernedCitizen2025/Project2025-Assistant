// assets/js/reader-toggle.js

document.addEventListener("DOMContentLoaded", () => {
  const btn       = document.getElementById("globalReaderToggle");
  const translate = document.querySelector(".translate-container");
  const controls  = document.getElementById("readAloudContainer");
  const content   = document.querySelector("main"); // your page body

  // Make sure the things start hidden:
  translate.style.display = "none";
  controls.style.display  = "none";

  btn.addEventListener("click", () => {
    const inReader = btn.textContent.startsWith("←");
    if (!inReader) {
      // Enter reader mode
      content.classList.add("reader-mode");
      translate.style.display = "block";
      controls.style.display  = "block";
      btn.textContent          = "← Back to Normal View";
    } else {
      // Exit reader mode
      content.classList.remove("reader-mode");
      translate.style.display = "none";
      controls.style.display  = "none";
      btn.textContent          = "Reader View";
    }
  });
});
