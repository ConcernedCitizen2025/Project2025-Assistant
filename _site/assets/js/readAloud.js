// readAloud.js

document.addEventListener('DOMContentLoaded', function() {
    // Global state variables
    let paragraphs = [];
    let currentParagraphIndex = 0;
    let speechRate = 1.0; // Normal speed
    let isPaused = false;
    let lastStopTime = 0; // For double-stop behavior
    let totalWords = 0;
    let wordsRead = 0;
    let currentParagraphStartTime = 0;
    let bufferingStartTime = 0;
    const SECONDS_PER_WORD = 0.4; // Base time per word at rate 1.0

    // Grab all paragraphs inside the #readableContent container
    paragraphs = document.querySelectorAll("#readableContent p");
    paragraphs.forEach(function(p) {
       totalWords += p.innerText.split(/\s+/).filter(word => word.trim() !== "").length;
    });

    // Grab UI elements
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

    // Variables for intervals
    let progressInterval;

    // Update the reading progress bar and time remaining display.
    function updateProgress() {
      let elapsedCurrent = 0, currentFraction = 0;
      if (currentParagraphIndex < paragraphs.length) {
          let currentText = paragraphs[currentParagraphIndex].innerText;
          let currentWords = currentText.split(/\s+/).filter(word => word.trim() !== "").length;
          elapsedCurrent = (Date.now() - currentParagraphStartTime) / 1000;
          let currentEstimated = currentWords * SECONDS_PER_WORD / speechRate;
          currentFraction = Math.min(1, elapsedCurrent / currentEstimated);
      }
      // Overall words read (including partial progress in current paragraph)
      let progressWords = wordsRead;
      if (currentParagraphIndex < paragraphs.length) {
          let currentText = paragraphs[currentParagraphIndex].innerText;
          let currentWords = currentText.split(/\s+/).filter(word => word.trim() !== "").length;
          progressWords += currentFraction * currentWords;
      }
      let progressPercent = (progressWords / totalWords) * 100;
      readingProgressElem.style.width = progressPercent + "%";

      // Estimate remaining time based on remaining words
      let remainingTimeSec = 0;
      if (currentParagraphIndex < paragraphs.length) {
          let currentText = paragraphs[currentParagraphIndex].innerText;
          let currentWords = currentText.split(/\s+/).filter(word => word.trim() !== "").length;
          let remainingCurrent = (currentWords * SECONDS_PER_WORD / speechRate) - elapsedCurrent;
          if (remainingCurrent < 0) remainingCurrent = 0;
          remainingTimeSec += remainingCurrent;
      }
      for (let i = currentParagraphIndex + 1; i < paragraphs.length; i++) {
          let text = paragraphs[i].innerText;
          let count = text.split(/\s+/).filter(word => word.trim() !== "").length;
          remainingTimeSec += count * SECONDS_PER_WORD / speechRate;
      }
      // Format remaining time as mm:ss
      let minutes = Math.floor(remainingTimeSec / 60);
      let seconds = Math.floor(remainingTimeSec % 60);
      timeRemainingLabel.textContent = "Time remaining: " +
         (minutes < 10 ? "0" + minutes : minutes) + ":" +
         (seconds < 10 ? "0" + seconds : seconds);
    }

    // Update a simulated buffering progress bar (over 2 seconds)
    function updateBufferProgress() {
      if (bufferIndicator.style.display !== "none") {
          let elapsedBuffer = (Date.now() - bufferingStartTime) / 1000;
          let bufferFraction = Math.min(1, elapsedBuffer / 2);
          bufferProgressElem.style.width = (bufferFraction * 100) + "%";
      } else {
          bufferProgressElem.style.width = "0%";
      }
    }

    function startProgressInterval() {
      if (progressInterval) clearInterval(progressInterval);
      progressInterval = setInterval(function() {
          updateProgress();
          updateBufferProgress();
      }, 500);
    }

    function stopProgressInterval() {
      if (progressInterval) clearInterval(progressInterval);
    }

    // Function to read the current paragraph using ResponsiveVoice.
    function readCurrentParagraph() {
      if (currentParagraphIndex < 0 || currentParagraphIndex >= paragraphs.length) {
        return;
      }
      let text = paragraphs[currentParagraphIndex].innerText;
      currentParagraphStartTime = Date.now();
      // Begin buffering simulation
      bufferingStartTime = Date.now();
      bufferIndicator.style.display = "inline-block";
      bufferProgressElem.style.width = "0%";
      
      responsiveVoice.speak(text, "UK English Female", {
        rate: speechRate,
        onstart: function() {
          bufferIndicator.style.display = "none";
          bufferProgressElem.style.width = "100%";
        },
        onend: function() {
          // Update words read based on this paragraph's word count.
          let count = text.split(/\s+/).filter(word => word.trim() !== "").length;
          wordsRead += count;
          if (!isPaused) {
            currentParagraphIndex++;
            if (currentParagraphIndex < paragraphs.length) {
              readCurrentParagraph();
            } else {
              stopProgressInterval();
            }
          }
        }
      });
    }

    // Event Listeners

    // Start reading: hide start button, show control panel (and fix it), start reading and progress updates.
    startBtn.addEventListener('click', function() {
      currentParagraphIndex = 0;
      wordsRead = 0;
      isPaused = false;
      startBtn.style.display = "none";
      controlsDiv.style.display = "block";
      container.classList.add("fixedControlPanel");
      readCurrentParagraph();
      startProgressInterval();
    });
    
    // Play/Resume
    playResumeBtn.addEventListener('click', function() {
      if (isPaused) {
        responsiveVoice.resume();
        isPaused = false;
      } else {
        readCurrentParagraph();
      }
    });
    
    // Pause
    pauseBtn.addEventListener('click', function() {
      responsiveVoice.pause();
      isPaused = true;
    });
    
    // Stop: if clicked twice within 2 seconds, reset to beginning.
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
    
    // Next paragraph
    nextBtn.addEventListener('click', function() {
      responsiveVoice.cancel();
      if (currentParagraphIndex < paragraphs.length - 1) {
        currentParagraphIndex++;
        isPaused = false;
        readCurrentParagraph();
      }
    });
    
    // Previous paragraph
    prevBtn.addEventListener('click', function() {
      responsiveVoice.cancel();
      if (currentParagraphIndex > 0) {
        currentParagraphIndex--;
        isPaused = false;
        readCurrentParagraph();
      }
    });
    
    // Speed controls
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
    
    // Close Panel: Stop speech and reset the control panel to its initial state.
    closePanelBtn.addEventListener('click', function() {
      responsiveVoice.cancel();
      stopProgressInterval();
      controlsDiv.style.display = "none";
      startBtn.style.display = "block";
      container.classList.remove("fixedControlPanel");
      currentParagraphIndex = 0;
      wordsRead = 0;
    });
});
