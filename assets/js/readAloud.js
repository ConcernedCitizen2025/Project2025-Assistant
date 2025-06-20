// assets/js/readAloud.js

document.addEventListener("DOMContentLoaded", () => {
  const pageLang = (document.documentElement.lang||"en").slice(0,2);
  const useRV    = pageLang === "en";         // only use RV on English pages
  let overrideNative = false;                 // user toggle “Use system voices”
  
  // Recompute speaking mode:
  function speakingWithRV() {
    return useRV && !overrideNative;
  }

  // Inject “Use system voices” checkbox:
  const picker = document.getElementById("voicePickerContainer");
  const chkWrap = document.createElement("div");
  chkWrap.innerHTML = `
    <label style="font-size:0.9em; margin-left:1em">
      <input type="checkbox" id="nativeVoiceToggle"/>
      Use system voices
    </label>`;
  picker.appendChild(chkWrap);
  document.getElementById("nativeVoiceToggle")
    .addEventListener("change", e => {
      overrideNative = e.target.checked;
      loadVoices();
    });

  // ───── GRAB UI ELEMENTS ─────
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

  // ───── LOAD & POPULATE VOICES ─────
  function loadVoices() {
    voiceSelect.innerHTML = "";
    if (speakingWithRV()) {
      ["UK English Female","UK English Male"].forEach(name => {
        let o = document.createElement("option");
        o.value = name;
        o.text  = name.includes("Female") ? "Female" : "Male";
        voiceSelect.appendChild(o);
      });
    } else {
      let all = speechSynthesis.getVoices().filter(v =>
        v.lang.startsWith(pageLang)
      );
      let female = all.find(v=>/female/i.test(v.name)) || all[0];
      let male   = all.find(v=>/male/i.test(v.name))   || all[1]||female;
      [[female,"Female"],[male,"Male"]].forEach(([v,label])=>{
        let o = document.createElement("option");
        o.value = v.name;
        o.text  = label;
        voiceSelect.appendChild(o);
      });
    }
  }
  if (!speakingWithRV()) speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  // …then later, when you call speakText():
  function speakText(txt) {
    bufIcon.classList.add("spinning");    // start spinner
    if (speakingWithRV()) {
      responsiveVoice.speak(txt, voiceSelect.value, { rate, onend: onEnd });
    } else {
      let u = new SpeechSynthesisUtterance(txt);
      u.voice = speechSynthesis.getVoices()
                .find(v=>v.name === voiceSelect.value)
              || speechSynthesis.getVoices()[0];
      u.lang = u.voice.lang;
      u.rate = rate;
      u.onend = onEnd;
      speechSynthesis.speak(u);
    }
  }
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  // ───── GATHER PARAGRAPHS ─────
  let paras = Array.from(document.querySelectorAll(
    "#readableContent p, #readableContent li, " +
    "#readableContent h1, #readableContent h2, #readableContent h3," +
    "#readableContent h4, #readableContent h5, #readableContent h6"
  ));
  const firstReal = paras.findIndex(p => !p.textContent.trim().startsWith("---"));
  if (firstReal > 0) paras = paras.slice(firstReal);

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
        position:"fixed", bottom:"20px", left:"50%",
        transform:"translateX(-50%)", background:"#000",
        color:"#fff", padding:"6px 12px", borderRadius:"4px",
        opacity:".8", zIndex:9999, fontSize:"1em"
      });
      document.body.appendChild(b);
    }
    b.textContent = txt;
    clearTimeout(b.to);
    b.to = setTimeout(()=>b.remove(), 2000);
  }

  // ───── UPDATE PROGRESS/TIME ─────
  function updateProg() {
    const totalW = paras.reduce((sum,p)=>sum + p.textContent.split(/\s+/).length, 0);
    const doneW  = paras.slice(0, idx)
                   .reduce((sum,p)=>sum + p.textContent.split(/\s+/).length, 0);
    progBar.style.width = Math.min(100, doneW/totalW*100) + "%";
    const remSec = Math.ceil((totalW - doneW)*0.4 / rate);
    const m = Math.floor(remSec/60), s = remSec%60;
    timeLabel.textContent = `Time left: ${m}:${String(s).padStart(2,"0")}`;
  }

  // ───── SPEAK FUNCTIONS ─────
  function rvEnd() {
    // stop and hide spinner
    bufIcon.classList.remove("spinning");

    if (suppress) { suppress = false; return; }
    if (!isPaused && idx < paras.length - 1) {
      idx++; updateProg(); readCurrent();
    }
  }

  function speakText(txt) {
    // show and start spinner
    bufIcon.classList.add("spinning");

    if (speakUsingRV) {
      responsiveVoice.speak(txt, voiceSel.value, { rate, onend: rvEnd });
    } else {
    let u = new SpeechSynthesisUtterance(txt);
    /* … */
    u.onend = rvEnd;
    speechSynthesis.speak(u);
    }
  }

  function readCurrent() {
    const text = paras[idx].textContent.replace(/\[STOP\].*$/,"");
    speakText(text);
  }

  // ───── WIRE UP CONTROLS ─────
  startBtn.onclick = () => {
    idx = 0; isPaused = false; suppress = false;
    startBtn.style.display   = "none";
    controls.style.display    = "block";
    readCurrent(); updateProg();
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
    readCurrent(); updateProg();
  };
  prevBtn.onclick  = () => {
    suppress = true;
    if (speakUsingRV()) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    if (idx > 0) idx--;
    readCurrent(); updateProg();
  };
    slowBtn.onclick = () => {
    rate = Math.max(0.5, rate - 0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    // immediately restart current
    if (speakingWithRV()) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    readCurrent();        // same idx
  };

  normBtn.onclick = () => {
    rate = 1.0;
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    if (speakingWithRV()) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    readCurrent();
  };

  fastBtn.onclick = () => {
    rate = Math.min(2.0, rate + 0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    if (speakingWithRV()) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    readCurrent();
  };

});
