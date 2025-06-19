// readAloud.js

document.addEventListener('DOMContentLoaded', function() {
    function speakText(text) {
      const utter = new SpeechSynthesisUtterance(text);
      // pick the voice the user chose
      utter.voice = speechSynthesis.getVoices()
                        .find(v => v.name === voiceSelect.value);
      // make sure the utterance language matches the voice
      utter.lang = utter.voice.lang;
      utter.rate = speechRate;
      utter.onstart = () => {
        bufferIndicator.style.display = "none";
        bufferProgressElem.style.width = "100%";
      };
      utter.onend = () => {
        // count words and advance or stop
        const count = text.split(/\s+/).filter(w=>w).length;
        wordsRead += count;
        if (!isPaused && !stopFound) {
          currentParagraphIndex++;
          if (currentParagraphIndex < paragraphs.length) {
            readCurrentParagraph();
          } else {
            stopProgressLoop();
          }
        } else {
          stopProgressLoop();
        }
      };
      speechSynthesis.speak(utter);
    }
    // ────────────────────────────────────────────────────────
    // VOICE SELECTION (drop into your DOMContentLoaded handler)
    // ────────────────────────────────────────────────────────
    const voiceSelect = document.getElementById("voiceSelect");
    const pageLang    = (document.documentElement.lang || "en").slice(0,2);

    // when voices load (and again if they change)
    speechSynthesis.onvoiceschanged = () => {
      const allVoices = speechSynthesis.getVoices();
      let female, male;

      if (pageLang === "en") {
        // English: force UK voices
        female = allVoices.find(v =>
          v.lang.startsWith("en-") && /female/i.test(v.name) && /gb/i.test(v.lang)
        );
        male   = allVoices.find(v =>
          v.lang.startsWith("en-") && /male/i.test(v.name)   && /gb/i.test(v.lang)
        );
        // fallback to any en-GB if exact gender not found
        if (!female) female = allVoices.find(v => v.lang.startsWith("en-"));
        if (!male)   male   = allVoices.find(v => v.lang.startsWith("en-"));
      } else {
        // Non-English: pick any voices matching pageLang
        female = allVoices.find(v =>
          v.lang.startsWith(pageLang) && /female/i.test(v.name)
        );
        male   = allVoices.find(v =>
          v.lang.startsWith(pageLang) && /male/i.test(v.name)
        );
        // fallback: if only one voice exists, use it for both
        const anyMatching = allVoices.filter(v => v.lang.startsWith(pageLang));
        if (!female) female = anyMatching[0];
        if (!male)   male   = anyMatching.length>1 ? anyMatching[1] : anyMatching[0];
      }

      // build dropdown
      voiceSelect.innerHTML = "";
      if (female) {
        let o = document.createElement("option");
        o.value = female.name;
        o.text  = "Female";
        voiceSelect.appendChild(o);
      }
      if (male && male.name !== female?.name) {
        let o = document.createElement("option");
        o.value = male.name;
        o.text  = "Male";
        voiceSelect.appendChild(o);
      }
      // if neither found, fall back to all English voices
      if (!voiceSelect.children.length) {
        allVoices
          .filter(v => v.lang.startsWith("en"))
          .slice(0,2)
          .forEach(v => {
            let o = document.createElement("option");
            o.value = v.name;
            o.text  = v.name + ` (${v.lang})`;
            voiceSelect.appendChild(o);
          });
      }
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
    // detect two-letter page lang, fallback to "en"
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
      
      function readCurrentParagraph() {
        if (currentParagraphIndex < 0 ||
            currentParagraphIndex >= paragraphs.length) return;

        let fullText = paragraphs[currentParagraphIndex].innerText;
        stopFound = fullText.includes("[STOP]");
        let text = stopFound
          ? fullText.split("[STOP]")[0]
          : fullText;

        currentParagraphStartTime = Date.now();
        bufferingStartTime = Date.now();
        bufferIndicator.style.display = "inline-block";
        bufferProgressElem.style.width = "0%";

        // now call our speakText helper
        speakText(text);
      };
    }

    // --- Event Listeners ---

    // Start reading
    startBtn.addEventListener('click', () => {
      currentParagraphIndex = 0;
      wordsRead = 0;
      isPaused = false;
      startBtn.style.display = 'none';
      controlsDiv.style.display = 'block';
      container.classList.add('fixedControlPanel');
      readCurrentParagraph();
      startProgressLoop();
    });

    // Play/Resume
    playResumeBtn.addEventListener('click', () => {
      if (isPaused) {
        speechSynthesis.resume();
        isPaused = false;
      } else {
        readCurrentParagraph();
      }
    });

    // Pause
    pauseBtn.addEventListener('click', () => {
      speechSynthesis.pause();
      isPaused = true;
    });

    // Stop (double-tap reset)
    stopBtn.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastStopTime < 2000) {
        currentParagraphIndex = 0;
        wordsRead = 0;
      }
      lastStopTime = now;
      speechSynthesis.cancel();
      isPaused = false;
    });

    // Next paragraph
    nextBtn.addEventListener('click', () => {
      speechSynthesis.cancel();
      if (currentParagraphIndex < paragraphs.length - 1) {
        currentParagraphIndex++;
        isPaused = false;
        readCurrentParagraph();
      }
    });

    // Previous paragraph
    prevBtn.addEventListener('click', () => {
      speechSynthesis.cancel();
      if (currentParagraphIndex > 0) {
        currentParagraphIndex--;
        isPaused = false;
        readCurrentParagraph();
      }
    });

    // Speed controls
    slowBtn.addEventListener('click', () => {
      speechRate = Math.max(0.5, speechRate - 0.1);
      speechSynthesis.cancel();
      readCurrentParagraph();
    });
    normalBtn.addEventListener('click', () => {
      speechRate = 1.0;
      speechSynthesis.cancel();
      readCurrentParagraph();
    });
    fastBtn.addEventListener('click', () => {
      speechRate = Math.min(2.0, speechRate + 0.1);
      speechSynthesis.cancel();
      readCurrentParagraph();
    });

    // Close panel
    closePanelBtn.addEventListener('click', () => {
      speechSynthesis.cancel();
      stopProgressLoop();
      controlsDiv.style.display = 'none';
      startBtn.style.display = 'block';
      container.classList.remove('fixedControlPanel');
      currentParagraphIndex = 0;
      wordsRead = 0;
    });

});
