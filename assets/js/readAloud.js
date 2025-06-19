// assets/js/readAloud.js
document.addEventListener("DOMContentLoaded", () => {
  // UI elements
  const voiceSelect    = document.getElementById("voiceSelect");
  const startBtn       = document.getElementById("startReadAloud");
  const playBtn        = document.getElementById("playResume");
  const pauseBtn       = document.getElementById("pause");
  const stopBtn        = document.getElementById("stop");
  const prevBtn        = document.getElementById("prevParagraph");
  const nextBtn        = document.getElementById("nextParagraph");
  const slowBtn        = document.getElementById("slow");
  const normalBtn      = document.getElementById("normal");
  const fastBtn        = document.getElementById("fast");
  const readingBar     = document.getElementById("readingProgress");
  const bufferBar      = document.getElementById("bufferProgress");
  const bufferIcon     = document.getElementById("bufferIndicator");
  const timeLabel      = document.getElementById("timeRemainingLabel");

  // Gather paragraphs
  const paras = Array.from(
    document.querySelectorAll(
      "#readableContent p, #readableContent li, " +
      "#readableContent h1, h2, h3, h4, h5, h6"
    )
  );
  let idx = 0, rate = 1.0, isPaused = false;

  // Filter out front-matter comments if any
  const startIdx = paras.findIndex(p =>
    !p.textContent.trim().startsWith("---")
  );
  if (startIdx > 0) paras.splice(0, startIdx);

  // Helper to compute remaining time & progress
  function updateProgress() {
    const totalWords = paras.reduce((sum, p) =>
      sum + p.textContent.split(/\s+/).length, 0
    );
    const readWords  = paras
      .slice(0, idx)
      .reduce((sum, p) => sum + p.textContent.split(/\s+/).length, 0);
    const pct = Math.min(100, (readWords/totalWords)*100);
    readingBar.style.width = pct + "%";
    // a rough remaining time
    const remWords = totalWords - readWords;
    const secs = Math.ceil(remWords*0.4 / rate);
    timeLabel.textContent = `Time left: ${Math.floor(secs/60)}:` +
      String(secs%60).padStart(2,"0");
  }

  // Speak a given text chunk
  function speak(text) {
    if (!voiceSelect.value) return;
    const utt = new SpeechSynthesisUtterance(text);
    const voice = speechSynthesis.getVoices()
      .find(v => v.name === voiceSelect.value);
    if (voice) utt.voice = voice;
    utt.rate = rate;
    utt.onstart = () => bufferIcon.style.display = "none";
    utt.onend   = () => {
      updateProgress();
      if (!isPaused && idx < paras.length-1) {
        idx++;
        readCurrent();
      }
    };
    speechSynthesis.speak(utt);
  }

  function readCurrent() {
    bufferIcon.style.display = "inline";
    const text = paras[idx].textContent.replace(/\[STOP\].*$/, "");
    speak(text);
  }

  // Load and populate `voiceSelect`
  function loadVoices() {
    const all = speechSynthesis.getVoices();
    voiceSelect.innerHTML = "";
    const lang = document.documentElement.lang.slice(0,2);
    let opts = [];
    if (lang === "en") {
      // British Female/Male
      const f = all.find(v=>v.lang==="en-GB" && /female/i.test(v.name));
      const m = all.find(v=>v.lang==="en-GB" && /male/i.test(v.name));
      if (f) opts.push({name:f.name,label:"Female"});
      if (m) opts.push({name:m.name,label:"Male"});
    }
    if (!opts.length) {
      // fallback to page language voices
      opts = all
        .filter(v=>v.lang.startsWith(lang))
        .map(v=>({ name:v.name, label:v.name }));
    }
    // ensure at least two
    opts.slice(0,2).forEach(o=>{
      const el = document.createElement("option");
      el.value = o.name;
      el.text  = o.label;
      voiceSelect.appendChild(el);
    });
  }
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  // Button handlers
  startBtn.onclick  = () => { idx=0; isPaused=false; readCurrent(); };
  playBtn.onclick   = () => { isPaused=false; speechSynthesis.resume(); };
  pauseBtn.onclick  = () => { isPaused=true;  speechSynthesis.pause();  };
  stopBtn.onclick   = () => { isPaused=true;  speechSynthesis.cancel(); idx=0; updateProgress(); };
  nextBtn.onclick   = () => { speechSynthesis.cancel(); if(idx<paras.length-1) idx++; readCurrent(); };
  prevBtn.onclick   = () => { speechSynthesis.cancel(); if(idx>0) idx--; readCurrent(); };
  slowBtn.onclick   = () => { rate=Math.max(0.5,rate-0.1); };
  normalBtn.onclick = () => { rate=1.0; };
  fastBtn.onclick   = () => { rate=Math.min(2.0,rate+0.1); };
});
