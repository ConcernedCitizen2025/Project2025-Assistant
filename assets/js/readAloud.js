// readAloud.js

document.addEventListener('DOMContentLoaded', function() {
    // ─────────── VOICE MAP ───────────
    const VOICES_BY_LANG = {
      en: [
        { label: "English (US) – Female", value: "US English Female" },
        { label: "English (US) – Male",   value: "US English Male"   },
        { label: "English (UK) – Female", value: "UK English Female" },
        { label: "English (UK) – Male",   value: "UK English Male"   },
      ],
      fr: [
        { label: "Français – Féminin",  value: "French Female" },
        { label: "Français – Masculin", value: "French Male"   },
      ],
      es: [
        { label: "Español – Femenino",   value: "Spanish Female" },
        { label: "Español – Masculino",  value: "Spanish Male"   },
      ],
      de: [
        { label: "Deutsch – Weiblich",  value: "Deutsch Female" },
        { label: "Deutsch – Männlich",  value: "Deutsch Male"   },
      ],
      // …add more languages here as needed…
    };


    // Global state variables
    let paragraphs = [];  // This will be our collection of text-bearing elements.
    let paragraphWordCounts = [];
    let currentParagraphIndex = 0;
    let speechRate = 1.0; // Normal speed
    let isPaused = false;
    let lastStopTime = 0; // For double-stop behavior
    let totalWords = 0;
    let wordsRead = 0;
    let currentParagraphStartTime = 0;
    let bufferingStartTime = 0;
    const SECONDS_PER_WORD = 0.4; // Base time per word at rate 1.0

    // ───────── POPULATE VOICE DROPDOWN ─────────
    const voiceSelect = document.getElementById("voiceSelect");
    // detect two-letter page lang, fallback to "en"
    const pageLang = (document.documentElement.lang || "en").slice(0,2);
    const options  = VOICES_BY_LANG[pageLang] || VOICES_BY_LANG.en;

    // fill the <select>
    options.forEach(opt=>{
      const o = document.createElement("option");
      o.value = opt.value;
      o.text  = opt.label;
      voiceSelect.appendChild(o);
    });

    // ───────── LOAD BROWSER VOICES ─────────
    const synth     = window.speechSynthesis;
    let allVoices   = [];
    function loadVoices() {
      allVoices = synth.getVoices();
    }
    synth.addEventListener("voiceschanged", loadVoices);
    loadVoices();


    // --- Collect All Relevant Text Elements ---
    // This selects paragraphs (<p>), list items (<li>), and headings (<h1>-<h6>) within #readableContent.
    let contentElements = Array.from(document.querySelectorAll(
      "#readableContent p, #readableContent li, #readableContent h1, #readableContent h2, #readableContent h3, #readableContent h4, #readableContent h5, #readableContent h6"
    ));
    
    // --- Force Stop Anchor or Default "Sources" Stop ---
    // First, check for an element with the class "read-aloud-stop".
    let forceStopIndex = contentElements.findIndex(el =>
      el.classList.contains("read-aloud-stop")
    );
    if (forceStopIndex !== -1) {
      // If found, slice the array so that reading stops there.
      contentElements = contentElements.slice(0, forceStopIndex);
    } else {
      // Otherwise, check for an element whose text begins with "sources" (default behavior).
      let sourcesIndex = contentElements.findIndex(el =>
          el.textContent.trim().toLowerCase().startsWith("sources")
      );
      if (sourcesIndex !== -1) {
          contentElements = contentElements.slice(0, sourcesIndex);
      }
    }
    paragraphs = contentElements;

    // Pre-calculate word counts for each element and the total word count.
    paragraphs.forEach(function(el) {
       let count = el.innerText.split(/\s+/).filter(word => word.trim() !== "").length;
       paragraphWordCounts.push(count);
       totalWords += count;
    });

    // Grab UI elements from the control panel.
    const startBtn = document.getElementById('startReadAloud');
    const controlsDiv = document.getElementById('readAloudControls');
    const playResumeBtn = document.getElementById('playResume');
    const pauseBtn = document.getElementById('pause');
    const stopBtn = document.getElementById('stop');
    const prevBtn = document.getElementById('prevParagraph');
    const nextBtn = document.getElementById('nextParagraph');
    const slowBtn = document.getElementById('slow');
    const normalBtn = document.getElementById('normal');
    const fastBtn = document.getElementById('fast');
    const bufferIndicator = document.getElementById('bufferIndicator');
    const container = document.getElementById('readAloudContainer');
    const readingProgressElem = document.getElementById('readingProgress');
    const bufferProgressElem = document.getElementById('bufferProgress');
    const timeRemainingLabel = document.getElementById('timeRemainingLabel');
    const closePanelBtn = document.getElementById('closePanel');

    // Use requestAnimationFrame for smoother progress updates.
    let progressAnimationFrame;

    // Update the reading progress bar and time remaining display.
    function updateProgress() {
      let elapsedCurrent = 0, currentFraction = 0;
      if (currentParagraphIndex < paragraphs.length) {
          let currentWords = paragraphWordCounts[currentParagraphIndex];
          elapsedCurrent = (Date.now() - currentParagraphStartTime) / 1000;
          let currentEstimated = currentWords * SECONDS_PER_WORD / speechRate;
          currentFraction = Math.min(1, elapsedCurrent / currentEstimated);
      }
      // Calculate overall words read (including partial progress in the current element).
      let progressWords = wordsRead;
      if (currentParagraphIndex < paragraphs.length) {
          let currentWords = paragraphWordCounts[currentParagraphIndex];
          progressWords += currentFraction * currentWords;
      }
      let progressPercent = (progressWords / totalWords) * 100;
      readingProgressElem.style.width = progressPercent + "%";

      // Estimate remaining time based on the remaining words.
      let remainingTimeSec = 0;
      if (currentParagraphIndex < paragraphs.length) {
          let currentWords = paragraphWordCounts[currentParagraphIndex];
          let remainingCurrent = (currentWords * SECONDS_PER_WORD / speechRate) - elapsedCurrent;
          if (remainingCurrent < 0) remainingCurrent = 0;
          remainingTimeSec += remainingCurrent;
      }
      for (let i = currentParagraphIndex + 1; i < paragraphs.length; i++) {
          remainingTimeSec += paragraphWordCounts[i] * SECONDS_PER_WORD / speechRate;
      }
      // Format remaining time as mm:ss.
      let minutes = Math.floor(remainingTimeSec / 60);
      let seconds = Math.floor(remainingTimeSec % 60);
      timeRemainingLabel.textContent = "Time remaining: " +
         (minutes < 10 ? "0" + minutes : minutes) + ":" +
         (seconds < 10 ? "0" + seconds : seconds);
    }

    // Update a simulated buffering progress bar (over a 2-second period).
    function updateBufferProgress() {
      if (bufferIndicator.style.display !== "none") {
          let elapsedBuffer = (Date.now() - bufferingStartTime) / 1000;
          let bufferFraction = Math.min(1, elapsedBuffer / 2);
          bufferProgressElem.style.width = (bufferFraction * 100) + "%";
      } else {
          bufferProgressElem.style.width = "0%";
      }
    }

    // Main loop for progress updates using requestAnimationFrame.
    function updateProgressLoop() {
      updateProgress();
      updateBufferProgress();
      progressAnimationFrame = requestAnimationFrame(updateProgressLoop);
    }

    function startProgressLoop() {
      progressAnimationFrame = requestAnimationFrame(updateProgressLoop);
    }

    function stopProgressLoop() {
      if (progressAnimationFrame) cancelAnimationFrame(progressAnimationFrame);
    }

    // Function to read the current element using ResponsiveVoice.
    // Now, it also checks for the in-text stop token "[STOP]".
    function readCurrentParagraph() {
      if (currentParagraphIndex < 0 || currentParagraphIndex >= paragraphs.length) {
        return;
      }
      let fullText = paragraphs[currentParagraphIndex].innerText;
      let stopFound = false;
      let text;
      if (fullText.includes("[STOP]")) {
          // If the token is found, only speak the text before the token.
          text = fullText.split("[STOP]")[0];
          stopFound = true;
      } else {
          text = fullText;
      }
      currentParagraphStartTime = Date.now();
      // Begin buffering simulation.
      bufferingStartTime = Date.now();
      bufferIndicator.style.display = "inline-block";
      bufferProgressElem.style.width = "0%";
      
      responsiveVoice.speak(text, voiceSelect.value, {
        rate: speechRate,
        onstart() {
          bufferIndicator.style.display = "none";
          bufferProgressElem.style.width = "100%";
        },
        onend: function() {
          // Update words read based on the spoken text.
          let count = text.split(/\s+/).filter(word => word.trim() !== "").length;
          wordsRead += count;
          if (!isPaused && !stopFound) {
            currentParagraphIndex++;
            if (currentParagraphIndex < paragraphs.length) {
              readCurrentParagraph();
            } else {
              stopProgressLoop();
            }
          } else {
            // If a stop token was found, then end reading.
            stopProgressLoop();
          }
        }
      });
    }

    // --- Event Listeners ---

    // Start reading: hide the start button, show the control panel (and fix it to the top),
    // then start reading and progress updates.
    startBtn.addEventListener('click', function() {
      currentParagraphIndex = 0;
      wordsRead = 0;
      isPaused = false;
      startBtn.style.display = "none";
      controlsDiv.style.display = "block";
      container.classList.add("fixedControlPanel");
      readCurrentParagraph();
      startProgressLoop();
    });
    
    // Play/Resume button.
    playResumeBtn.addEventListener('click', function() {
      if (isPaused) {
        responsiveVoice.resume();
        isPaused = false;
      } else {
        readCurrentParagraph();
      }
    });
    
    // Pause button.
    pauseBtn.addEventListener('click', function() {
      responsiveVoice.pause();
      isPaused = true;
    });
    
    // Stop button: if clicked twice within 2 seconds, reset to the beginning.
    stopBtn.addEventListener('click', function() {
      let now = Date.now();
      if (now - lastStopTime < 2000) {
        currentParagraphIndex = 0;
        wordsRead = 0;
      }
      lastStopTime = now;
      responsiveVoice.cancel();
      isPaused = false;
    });
    
    // Next element button.
    nextBtn.addEventListener('click', function() {
      responsiveVoice.cancel();
      if (currentParagraphIndex < paragraphs.length - 1) {
        currentParagraphIndex++;
        isPaused = false;
        readCurrentParagraph();
      }
    });
    
    // Previous element button.
    prevBtn.addEventListener('click', function() {
      responsiveVoice.cancel();
      if (currentParagraphIndex > 0) {
        currentParagraphIndex--;
        isPaused = false;
        readCurrentParagraph();
      }
    });
    
    // Speed controls.
    slowBtn.addEventListener('click', function() {
      speechRate = Math.max(0.5, speechRate - 0.1);
      responsiveVoice.cancel();
      readCurrentParagraph();
    });
    normalBtn.addEventListener('click', function() {
      speechRate = 1.0;
      responsiveVoice.cancel();
      readCurrentParagraph();
    });
    fastBtn.addEventListener('click', function() {
      speechRate = Math.min(2.0, speechRate + 0.1);
      responsiveVoice.cancel();
      readCurrentParagraph();
    });
    
    // Close Panel button: stop speech and reset the control panel to its initial state.
    closePanelBtn.addEventListener('click', function() {
      responsiveVoice.cancel();
      stopProgressLoop();
      controlsDiv.style.display = "none";
      startBtn.style.display = "block";
      container.classList.remove("fixedControlPanel");
      currentParagraphIndex = 0;
      wordsRead = 0;
    });
});
