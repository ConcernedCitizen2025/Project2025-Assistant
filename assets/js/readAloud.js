// assets/js/readAloud.js

document.addEventListener("DOMContentLoaded", () => {
  // ───── GRAB UI ELEMENTS ─────
  const startBtn   = document.getElementById("startReadAloud");
  const controls   = document.getElementById("readAloudControls");
  const voiceSel   = document.getElementById("voiceSelect");
  const closeBtn   = document.getElementById("closePanel");
  const playBtn    = document.getElementById("playResume");
  const pauseBtn   = document.getElementById("pause");
  const stopBtn    = document.getElementById("stop");
  const prevBtn    = document.getElementById("prevParagraph");
  const nextBtn    = document.getElementById("nextParagraph");
  const slowBtn    = document.getElementById("slow");
  const normBtn    = document.getElementById("normal");
  const fastBtn    = document.getElementById("fast");
  const progBar    = document.getElementById("readingProgress");
  const bufIcon    = document.getElementById("bufferIndicator");
  const timeLabel  = document.getElementById("timeRemainingLabel");

  // ───── POPULATE UK VOICES ONLY ─────
  // clear any old entries
  voiceSel.innerHTML = "";
  ["UK English Female", "UK English Male"].forEach(name => {
    const o = document.createElement("option");
    o.value = name;
    o.text  = name.includes("Female") ? "Female" : "Male";
    voiceSel.appendChild(o);
  });

  // ───── GATHER PARAGRAPHS (EXCLUDE-aware) ─────
  const readerEl = document.getElementById("readableContent");

  // 1) Grab the raw text (includes the “[EXCLUDE]” markers)
  const rawText = readerEl.innerText;

  // 2) Split into chunks on two-or-more line-breaks
  const chunks = rawText
    .split(/\n{2,}/g)
    .map(s => s.trim())
    .filter(Boolean);

  // 3) Walk the chunks, skipping everything between [EXCLUDE] … [/EXCLUDE]
  let paras     = [];
  let reading   = true;
  let sawMarker = false;

  for (const chunk of chunks) {
    if (/^\[EXCLUDE\]/i.test(chunk)) {
      sawMarker = true;
      reading   = false;
      continue;              // drop the “[EXCLUDE]” chunk
    }
    if (/^\[\/EXCLUDE\]/i.test(chunk)) {
      reading = true;
      continue;              // drop the “[\/EXCLUDE]” chunk
    }
    if (reading) {
      paras.push(chunk);
    }
  }

  // 4) If we never saw any markers, read *all* chunks
  if (!sawMarker) paras = chunks;

  // 5) Finally, remove the literal tags from the live HTML so they never appear
  readerEl.innerHTML = readerEl.innerHTML.replace(
    /\[EXCLUDE\]|\[\/EXCLUDE\]/gi,
    ""
  );



  let idx      = 0,
      rate     = 1.0,
      isPaused = false,
      suppress = false;

  // ───── SPEED BADGE ─────
  function showSpeed(txt) {
    let b = document.getElementById("speedBadge");
    if (!b) {
      b = document.createElement("div");
      b.id = "speedBadge";
      Object.assign(b.style, {
        position: "fixed",
        bottom:   "20px",
        left:     "50%",
        transform:"translateX(-50%)",
        background:"#000",
        color:    "#fff",
        padding:  "6px 12px",
        borderRadius:"4px",
        opacity:  ".8",
        zIndex:   9999,
        fontSize: "1em"
      });
      document.body.appendChild(b);
    }
    b.textContent = txt;
    clearTimeout(b.to);
    b.to = setTimeout(() => b.remove(), 2000);
  }

  // ───── UPDATE PROGRESS/TIME ─────
  function updateProg() {
    // total words in all chunks
    const totalW = paras.reduce((sum, chunk) =>
      sum + chunk.split(/\s+/).filter(w=>w).length
    , 0);

    // words already read (everything _before_ the current chunk)
    const doneW = paras.slice(0, idx).reduce((sum, chunk) =>
      sum + chunk.split(/\s+/).filter(w=>w).length
    , 0);

    progBar.style.width = Math.min(100, doneW / totalW * 100) + "%";

    // estimate remaining time on the rest
    const remWords = paras
      .slice(idx)
      .reduce((sum, chunk) => sum + chunk.split(/\s+/).filter(w=>w).length, 0);

    const remSec = Math.ceil(remWords * 0.4 / rate);
    const m = Math.floor(remSec / 60), s = remSec % 60;
    timeLabel.textContent = `Time left: ${m}:${String(s).padStart(2,"0")}`;
  }


  // ───── ON END ─────
  function rvEnd() {
    bufIcon.classList.remove("spinning");
    if (suppress) { suppress = false; return; }
    if (!isPaused && idx < paras.length - 1) {
      idx++;
      updateProg();
      readCurrent();
    }
  }

  // ───── SPEAK ONE PARAGRAPH ─────
  function speakText(txt) {
    bufIcon.classList.add("spinning");
    responsiveVoice.speak(txt, voiceSel.value, {
      rate,
      onstart: () => bufIcon.classList.remove("spinning"),
      onend:    rvEnd
    });
  }

  function readCurrent() {
    const text = paras[idx];
    speakText(text);
  }


  // ───── WIRE UP CONTROLS ─────
  startBtn.onclick = () => {
    idx = 0; isPaused = false; suppress = false;
    startBtn.style.display = "none";
    controls.style.display = "block";
    readCurrent();
    updateProg();
  };
  playBtn.onclick  = () => { isPaused = false; responsiveVoice.resume(); };
  pauseBtn.onclick = () => { isPaused = true;  responsiveVoice.pause(); };
  stopBtn.onclick  = () => {
    responsiveVoice.cancel();
    controls.style.display = "none";
    startBtn.style.display = "inline-block";
  };
  nextBtn.onclick  = () => {
    responsiveVoice.cancel();
    if (idx < paras.length - 1) idx++;
    updateProg();
    readCurrent();
  };
  prevBtn.onclick  = () => {
    responsiveVoice.cancel();
    if (idx > 0) idx--;
    updateProg();
    readCurrent();
  };

  slowBtn.onclick = () => {
    rate = Math.max(0.5, rate - 0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    responsiveVoice.cancel();
    readCurrent();
  };
  normBtn.onclick = () => {
    rate = 1.0;
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    responsiveVoice.cancel();
    readCurrent();
  };
  fastBtn.onclick = () => {
    rate = Math.min(2.0, rate + 0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    responsiveVoice.cancel();
    readCurrent();
  };

  // ───── CLOSE PANEL ON “X” ─────
  closeBtn.onclick = () => {
    responsiveVoice.cancel();
    controls.style.display = "none";
    startBtn.style.display = "inline-block";
  };
});
