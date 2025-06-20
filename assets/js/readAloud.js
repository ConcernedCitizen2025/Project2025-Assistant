// assets/js/readAloud.js
document.addEventListener("DOMContentLoaded", () => {
  // ───── 1) LANG & ENGINE FLAGS ─────
  const pageLang = (document.documentElement.lang || "en").slice(0,2);
  const useRV    = pageLang === "en";   // only use ResponsiveVoice for English
  let overrideNative = false;           // user can toggle this

  // helper to decide which engine to use
  function speakUsingRV() {
    return useRV && !overrideNative && window.responsiveVoice;
  }

  // ───── 2) INJECT “USE SYSTEM VOICES” TOGGLE ─────
  const picker = document.getElementById("voicePickerContainer");
  if (picker) {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <label style="font-size:0.9em; margin-left:1em;">
        <input type="checkbox" id="nativeVoiceToggle"/>
        Use system voices
      </label>
    `;
    picker.appendChild(wrap);
    document.getElementById("nativeVoiceToggle")
      .addEventListener("change", e => {
        overrideNative = e.target.checked;
        loadVoices();
      });
  }

  // ───── 3) GRAB UI ELEMENTS ─────
  const startBtn  = document.getElementById("startReadAloud");
  const controls  = document.getElementById("readAloudControls");
  const voiceSel  = document.getElementById("voiceSelect");
  const playBtn   = document.getElementById("playResume");
  const pauseBtn  = document.getElementById("pause");
  const stopBtn   = document.getElementById("stop");
  const prevBtn   = document.getElementById("prevParagraph");
  const nextBtn   = document.getElementById("nextParagraph");
  const slowBtn   = document.getElementById("slow");
  const normBtn   = document.getElementById("normal");
  const fastBtn   = document.getElementById("fast");
  const progBar   = document.getElementById("readingProgress");
  const bufBar    = document.getElementById("bufferProgress");
  const bufIcon   = document.getElementById("bufferIndicator");
  const timeLabel = document.getElementById("timeRemainingLabel");

  // ───── 4) LOAD & POPULATE VOICES ─────
  function loadVoices() {
    voiceSel.innerHTML = "";
    if (speakUsingRV()) {
      // ResponsiveVoice only: British Female & Male
      ["UK English Female","UK English Male"].forEach(name => {
        const o = document.createElement("option");
        o.value = name;
        o.text  = name.includes("Female") ? "Female" : "Male";
        voiceSel.appendChild(o);
      });
    } else {
      // native speechSynthesis: pick two voices for pageLang
      const all = speechSynthesis.getVoices();
      const matches = all.filter(v => v.lang.startsWith(pageLang));
      let fem = matches.find(v=>/female/i.test(v.name)) || matches[0];
      let mal = matches.find(v=>/male/i.test(v.name))   || matches[1] || fem;
      [[fem,"Female"],[mal,"Male"]].forEach(([v,label]) => {
        if (!v) return;
        const o = document.createElement("option");
        o.value = v.name;
        o.text  = label;
        voiceSel.appendChild(o);
      });
    }
  }
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  // ───── 5) GATHER PARAGRAPHS ─────
  let paras = Array.from(document.querySelectorAll(
    "#readableContent p, #readableContent li, " +
    "#readableContent h1, #readableContent h2, #readableContent h3," +
    "#readableContent h4, #readableContent h5, #readableContent h6"
  ));
  // strip any leading YAML/front-matter echoes
  const firstReal = paras.findIndex(p => !p.textContent.trim().startsWith("---"));
  if (firstReal > 0) paras = paras.slice(firstReal);

  let idx      = 0;
  let rate     = 1.0;
  let isPaused = false;
  let suppress = false;

  // speed badge
  function showSpeed(txt) {
    let b = document.getElementById("speedBadge");
    if (!b) {
      b = document.createElement("div");
      b.id = "speedBadge";
      Object.assign(b.style, {
        position:"fixed", bottom:"20px", left:"50%",
        transform:"translateX(-50%)",
        background:"#000", color:"#fff",
        padding:"6px 12px", borderRadius:"4px",
        opacity:".8", zIndex:9999, fontSize:"1em"
      });
      document.body.appendChild(b);
    }
    b.textContent = txt;
    clearTimeout(b.to); b.to = setTimeout(()=>b.remove(),2000);
  }

  function updateProg() {
    const totalW = paras.reduce((s,p)=>s+p.textContent.split(/\s+/).length,0);
    const doneW  = paras.slice(0, idx)
                      .reduce((s,p)=>s+p.textContent.split(/\s+/).length,0);
    progBar.style.width = Math.min(100, doneW/totalW * 100) + "%";
    const remSec = Math.ceil((totalW - doneW) * 0.4 / rate);
    const m = Math.floor(remSec/60), s = remSec%60;
    timeLabel.textContent = `Time left: ${m}:${String(s).padStart(2,"0")}`;
  }

  // ───── 6) SPEAKING FUNCTIONS ─────
  function rvEnd() {
    bufIcon.style.display = "none";
    if (suppress) { suppress = false; return; }
    if (!isPaused && idx < paras.length - 1) {
      idx++; updateProg(); readCurrent();
    }
  }

  function speakText(txt) {
    bufIcon.style.display = "inline";
    if (speakUsingRV()) {
      responsiveVoice.speak(txt, voiceSel.value, { rate, onend: rvEnd });
    } else {
      const u = new SpeechSynthesisUtterance(txt);
      u.voice = speechSynthesis.getVoices().find(v=>v.name===voiceSel.value)
               || speechSynthesis.getVoices()[0];
      u.lang = u.voice.lang;
      u.rate = rate;
      u.onend = rvEnd;
      speechSynthesis.speak(u);
    }
  }

  function readCurrent() {
    const text = paras[idx].textContent.replace(/\[STOP\].*$/,"");
    speakText(text);
  }

  // ───── 7) WIRE UP CONTROLS ─────
  startBtn.onclick = () => {
    idx = 0; isPaused = false; suppress = false;
    startBtn.style.display = "none";
    controls.style.display = "block";
    readCurrent();
    updateProg();
  };
  playBtn.onclick  = () => {
    isPaused = false;
    speakUsingRV() ? responsiveVoice.resume() : speechSynthesis.resume();
  };
  pauseBtn.onclick = () => {
    isPaused = true;
    speakUsingRV() ? responsiveVoice.pause() : speechSynthesis.pause();
  };
  stopBtn.onclick  = () => {
    isPaused = true; suppress = true;
    if (speakUsingRV()) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    idx = 0; updateProg();
    controls.style.display = "none";
    startBtn.style.display = "inline-block";
  };
  nextBtn.onclick  = () => {
    suppress = true;
    if (speakUsingRV()) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    if (idx < paras.length - 1) idx++;
    readCurrent();
    updateProg();
  };
  prevBtn.onclick  = () => {
    suppress = true;
    if (speakUsingRV()) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    if (idx > 0) idx--;
    readCurrent();
    updateProg();
  };
  slowBtn.onclick  = () => {
    rate = Math.max(0.5, rate - 0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress = true;
    if (speakUsingRV()) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    readCurrent();
    updateProg();
  };
  normBtn.onclick  = () => {
    rate=1.0; showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress = true;
    if (speakUsingRV()) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    readCurrent();
    updateProg();
  };
  fastBtn.onclick  = () => {
    rate = Math.min(2.0, rate + 0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress = true;
    if (speakUsingRV()) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    readCurrent();
    updateProg();
  };
});
