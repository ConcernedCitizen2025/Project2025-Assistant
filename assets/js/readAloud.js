// assets/js/readAloud.js
document.addEventListener("DOMContentLoaded", () => {
  // ─── 1) Determine whether to use RV by default ───
  const pageLang = (document.documentElement.lang || "en").slice(0,2);
  const useRV     = pageLang === "en";      // only use ResponsiveVoice on English
  let overrideNative = false;               // user can opt into system voices
  let speakUsingRV   = useRV && !overrideNative;

  // ─── 2) Inject “Use system voices” toggle ───
  const picker = document.getElementById("voicePickerContainer");
  const chkWrap = document.createElement("div");
  chkWrap.innerHTML = `
    <label style="font-size:0.9em;margin-left:1em;">
      <input type="checkbox" id="nativeVoiceToggle"/>
      Use system voices
    </label>
  `;
  picker.appendChild(chkWrap);
  document.getElementById("nativeVoiceToggle")
    .addEventListener("change", (e) => {
      overrideNative = e.target.checked;
      speakUsingRV   = useRV && !overrideNative;
      loadVoices();
    });

  // ─── 3) Grab UI controls ───
  const startBtn = document.getElementById("startReadAloud");
  const controls = document.getElementById("readAloudControls");
  const voiceSel = document.getElementById("voiceSelect");
  const playBtn  = document.getElementById("playResume");
  const pauseBtn = document.getElementById("pause");
  const stopBtn  = document.getElementById("stop");
  const prevBtn  = document.getElementById("prevParagraph");
  const nextBtn  = document.getElementById("nextParagraph");
  const slowBtn  = document.getElementById("slow");
  const normBtn  = document.getElementById("normal");
  const fastBtn  = document.getElementById("fast");
  const progBar  = document.getElementById("readingProgress");
  const bufBar   = document.getElementById("bufferProgress");
  const bufIcon  = document.getElementById("bufferIndicator");
  const timeLbl  = document.getElementById("timeRemainingLabel");

  // ─── 4) Collect paragraphs, strip front-matter echoes ───
  let paras = Array.from(document.querySelectorAll(
    "#readableContent p, #readableContent li, " +
    "#readableContent h1, #readableContent h2, #readableContent h3," +
    "#readableContent h4, #readableContent h5, #readableContent h6"
  ));
  const firstReal = paras.findIndex(p=>!p.textContent.trim().startsWith("---"));
  if (firstReal > 0) paras = paras.slice(firstReal);

  // ─── 5) State for reading ───
  let idx      = 0,
      rate     = 1.0,
      isPaused = false,
      suppress = false;  // to prevent auto-advance after stop

  // ─── 6) Speed badge helper ───
  function showSpeed(txt) {
    let b = document.getElementById("speedBadge");
    if (!b) {
      b = document.createElement("div");
      b.id = "speedBadge";
      Object.assign(b.style, {
        position:"fixed", bottom:"20px",
        left:"50%", transform:"translateX(-50%)",
        background:"#000", color:"#fff",
        padding:"6px 12px", borderRadius:"4px",
        opacity:".8", zIndex:9999, fontSize:"1em"
      });
      document.body.appendChild(b);
    }
    b.textContent = txt;
    clearTimeout(b.to);
    b.to = setTimeout(()=>b.remove(), 1500);
  }

  // ─── 7) Update progress/time ───
  function updateProg() {
    const totalW = paras.reduce((sum,p)=>sum+p.textContent.split(/\s+/).length,0);
    const doneW  = paras.slice(0,idx)
                    .reduce((sum,p)=>sum+p.textContent.split(/\s+/).length,0);
    progBar.style.width = Math.min(100, doneW/totalW*100) + "%";
    const remSec = Math.ceil((totalW-doneW)*0.4/rate);
    timeLbl.textContent = `Time left: ${Math.floor(remSec/60)}:` +
      `${String(remSec%60).padStart(2,"0")}`;
  }

  // ─── 8) Speak text helper ───
  function speakText(txt) {
    bufIcon.style.display = "inline";
    if (speakUsingRV && window.responsiveVoice) {
      responsiveVoice.speak(txt, voiceSel.value, { rate, onend: onSpeakEnd });
    } else {
      const u = new SpeechSynthesisUtterance(txt);
      u.voice = speechSynthesis.getVoices()
                .find(v=>v.name===voiceSel.value)
                || speechSynthesis.getVoices()[0];
      u.lang = u.voice.lang;
      u.rate = rate;
      u.onend = onSpeakEnd;
      speechSynthesis.speak(u);
    }
  }
  function onSpeakEnd() {
    bufIcon.style.display = "none";
    if (suppress) { suppress = false; return; }
    if (!isPaused && idx < paras.length-1) {
      idx++;
      updateProg();
      readCurrent();
    }
  }

  function readCurrent() {
    const txt = paras[idx].textContent.replace(/\[STOP\].*$/,"");
    speakText(txt);
  }

  // ─── 9) Populate the <select> ───
  function loadVoices() {
    voiceSel.innerHTML = "";
    if (speakUsingRV) {
      ["UK English Female","UK English Male"].forEach(name => {
        const o = document.createElement("option");
        o.value = name;
        o.text  = name.includes("Female") ? "Female" : "Male";
        voiceSel.appendChild(o);
      });
    } else {
      const langVoices = speechSynthesis.getVoices()
        .filter(v => v.lang.startsWith(pageLang));
      let fem = langVoices.find(v=>/female/i.test(v.name)) || langVoices[0];
      let mal = langVoices.find(v=>/male/i.test(v.name))   || langVoices[1]||langVoices[0];
      [[fem,"Female"],[mal,"Male"]].forEach(([v,label])=>{
        if (!v) return;
        const o = document.createElement("option");
        o.value = v.name;
        o.text  = label;
        voiceSel.appendChild(o);
      });
    }
  }
  // Ensure system‐voice list populates once they load
  if (!speakUsingRV) speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  // ─── 10) Hook up buttons ───
  startBtn.onclick = () => {
    idx = 0; isPaused=false; suppress=false;
    startBtn.style.display = "none";
    controls.style.display   = "block";
    updateProg();
    readCurrent();
  };
  playBtn.onclick  = () => (isPaused=false,
    speakUsingRV
      ? responsiveVoice.resume()
      : speechSynthesis.resume()
  );
  pauseBtn.onclick = () => (isPaused=true,
    speakUsingRV
      ? responsiveVoice.pause()
      : speechSynthesis.pause()
  );
  stopBtn.onclick  = () => {
    isPaused=true; suppress=true;
    if (speakUsingRV) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    idx = 0; updateProg();
    controls.style.display = "none";
    startBtn.style.display = "inline-block";
  };
  nextBtn.onclick  = () => {
    suppress = true;
    if (speakUsingRV) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    if (idx < paras.length-1) idx++;
    readCurrent();
  };
  prevBtn.onclick  = () => {
    suppress = true;
    if (speakUsingRV) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    if (idx>0) idx--;
    readCurrent();
  };

  slowBtn.onclick = () => {
    rate = Math.max(0.5, rate-0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress=true;
    if (speakUsingRV) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    readCurrent();
  };
  normBtn.onclick = () => {
    rate = 1.0;
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress=true;
    if (speakUsingRV) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    readCurrent();
  };
  fastBtn.onclick = () => {
    rate = Math.min(2.0, rate+0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress=true;
    if (speakUsingRV) responsiveVoice.cancel();
    else speechSynthesis.cancel();
    readCurrent();
  };
});
