// readAloud.js
document.addEventListener('DOMContentLoaded', () => {
  // UI elements
  const voiceSelect    = document.getElementById('voiceSelect');
  const startBtn       = document.getElementById('startReadAloud');
  const playBtn        = document.getElementById('playResume');
  const pauseBtn       = document.getElementById('pause');
  const stopBtn        = document.getElementById('stop');
  const prevBtn        = document.getElementById('prevParagraph');
  const nextBtn        = document.getElementById('nextParagraph');
  const slowBtn        = document.getElementById('slow');
  const normalBtn      = document.getElementById('normal');
  const fastBtn        = document.getElementById('fast');
  const closeBtn       = document.getElementById('closePanel');
  const contentEls     = Array.from(
    document.querySelectorAll('#readableContent p, ' +
      '#readableContent li, #readableContent h1, #readableContent h2, ' +
      '#readableContent h3, #readableContent h4, #readableContent h5, ' +
      '#readableContent h6')
  );

  // state
  let voices               = [];
  let currentIndex         = 0;
  let isPaused             = false;
  let speechRate           = 1.0;
  let lastStop             = 0;

  // load and filter voices
  function loadVoices() {
    voices = speechSynthesis.getVoices();
    populateVoiceSelect();
  }
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  function populateVoiceSelect() {
    voiceSelect.innerHTML = '';
    const lang = (document.documentElement.lang || 'en').slice(0,2);
    let male, female;
    if (lang === 'en') {
      female = voices.find(v => v.lang === 'en-GB' && /female/i.test(v.name));
      male   = voices.find(v => v.lang === 'en-GB' && /male/i.test(v.name));
    } else {
      female = voices.find(v => v.lang.startsWith(lang) && /female/i.test(v.name));
      male   = voices.find(v => v.lang.startsWith(lang) && /male/i.test(v.name));
    }
    // fallbacks
    if (!female) female = voices.find(v => v.lang.startsWith(lang));
    if (!male)   male   = female;

    if (female) {
      let o = document.createElement('option');
      o.value = female.name;
      o.text  = 'Female';
      voiceSelect.appendChild(o);
    }
    if (male && male.name !== female.name) {
      let o = document.createElement('option');
      o.value = male.name;
      o.text  = 'Male';
      voiceSelect.appendChild(o);
    }
  }

  // speak a string
  function speak(text, onend) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = voices.find(v => v.name === voiceSelect.value);
    utter.lang  = utter.voice.lang;
    utter.rate  = speechRate;
    utter.onend = onend;
    speechSynthesis.speak(utter);
  }

  // step through paragraphs
  function readCurrent() {
    if (currentIndex < 0 || currentIndex >= contentEls.length) return;
    const txt = contentEls[currentIndex].innerText;
    speak(txt, () => {
      if (!isPaused) {
        currentIndex++;
        readCurrent();
      }
    });
  }

  // controls
  startBtn.addEventListener('click', () => {
    speechSynthesis.cancel();
    isPaused = false;
    currentIndex = 0;
    readCurrent();
  });

  playBtn.addEventListener('click', () => {
    if (isPaused) {
      isPaused = false;
      speechSynthesis.resume();
    } else {
      readCurrent();
    }
  });

  pauseBtn.addEventListener('click', () => {
    isPaused = true;
    speechSynthesis.pause();
  });

  stopBtn.addEventListener('click', () => {
    const now = Date.now();
    if (now - lastStop < 2000) currentIndex = 0;
    lastStop = now;
    isPaused = false;
    speechSynthesis.cancel();
  });

  nextBtn.addEventListener('click', () => {
    speechSynthesis.cancel();
    currentIndex = Math.min(contentEls.length-1, currentIndex+1);
    readCurrent();
  });

  prevBtn.addEventListener('click', () => {
    speechSynthesis.cancel();
    currentIndex = Math.max(0, currentIndex-1);
    readCurrent();
  });

  slowBtn.addEventListener('click', () => {
    speechRate = Math.max(0.5, speechRate - 0.1);
    speechSynthesis.cancel();
    readCurrent();
  });
  normalBtn.addEventListener('click', () => {
    speechRate = 1.0;
    speechSynthesis.cancel();
    readCurrent();
  });
  fastBtn.addEventListener('click', () => {
    speechRate = Math.min(2.0, speechRate + 0.1);
    speechSynthesis.cancel();
    readCurrent();
  });

  closeBtn.addEventListener('click', () => {
    speechSynthesis.cancel();
    isPaused = false;
    currentIndex = 0;
  });
});
