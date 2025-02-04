// readAloud.js

document.addEventListener('DOMContentLoaded', function() {
    // Global state variables
    let paragraphs = [];
    let currentParagraphIndex = 0;
    let speechRate = 1.0; // Normal speed
    let isPaused = false;
    
    // Grab all paragraphs inside the #readableContent container
    paragraphs = document.querySelectorAll("#readableContent p");
    
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
    
    // Function to read the current paragraph
    function readCurrentParagraph() {
      if (currentParagraphIndex < 0 || currentParagraphIndex >= paragraphs.length) {
        // Out of range – nothing to read.
        return;
      }
      const text = paragraphs[currentParagraphIndex].innerText;
      
      // Show buffering indicator while starting
      bufferIndicator.style.display = "inline-block";
      
      // Use ResponsiveVoice to speak the text with the selected rate
      responsiveVoice.speak(text, "UK English Female", {
        rate: speechRate,
        onstart: function() {
          // Hide buffering indicator once speech starts
          bufferIndicator.style.display = "none";
        },
        onend: function() {
          // Auto-advance to next paragraph if not paused
          if (!isPaused) {
            currentParagraphIndex++;
            if (currentParagraphIndex < paragraphs.length) {
              readCurrentParagraph();
            }
          }
        }
      });
    }
    
    // Start button: hide itself, show controls, and start reading from paragraph 0.
    startBtn.addEventListener('click', function() {
      currentParagraphIndex = 0;
      isPaused = false;
      startBtn.style.display = "none";
      controlsDiv.style.display = "block";
      readCurrentParagraph();
    });
    
    // Play/Resume: if paused, resume speech; otherwise, start reading.
    playResumeBtn.addEventListener('click', function() {
      if (isPaused) {
        responsiveVoice.resume();
        isPaused = false;
      } else {
        readCurrentParagraph();
      }
    });
    
    // Pause the speech
    pauseBtn.addEventListener('click', function() {
      responsiveVoice.pause();
      isPaused = true;
    });
    
    // Stop the speech entirely
    stopBtn.addEventListener('click', function() {
      responsiveVoice.cancel();
      isPaused = false;
      // Optionally, reset the paragraph index:
      // currentParagraphIndex = 0;
    });
    
    // Jump to the next paragraph
    nextBtn.addEventListener('click', function() {
      responsiveVoice.cancel();
      if (currentParagraphIndex < paragraphs.length - 1) {
        currentParagraphIndex++;
        isPaused = false;
        readCurrentParagraph();
      }
    });
    
    // Jump to the previous paragraph
    prevBtn.addEventListener('click', function() {
      responsiveVoice.cancel();
      if (currentParagraphIndex > 0) {
        currentParagraphIndex--;
        isPaused = false;
        readCurrentParagraph();
      }
    });
    
    // Speed controls – adjust the speech rate
    slowBtn.addEventListener('click', function() {
      // Decrease rate (minimum 0.5)
      speechRate = Math.max(0.5, speechRate - 0.1);
      responsiveVoice.cancel();
      readCurrentParagraph();
    });
    
    normalBtn.addEventListener('click', function() {
      // Reset to normal speed (1.0)
      speechRate = 1.0;
      responsiveVoice.cancel();
      readCurrentParagraph();
    });
    
    fastBtn.addEventListener('click', function() {
      // Increase rate (maximum 2.0)
      speechRate = Math.min(2.0, speechRate + 0.1);
      responsiveVoice.cancel();
      readCurrentParagraph();
    });
});
  