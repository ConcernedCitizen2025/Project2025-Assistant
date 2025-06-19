// assets/js/readAloud.js
document.addEventListener("DOMContentLoaded", () => {
  // 1) determine page‐lang & whether to use ResponsiveVoice by default
  const pageLang = (document.documentElement.lang || "en").slice(0,2);
  let useRV         = pageLang === "en";
  // 2) …unless the user explicitly “Use system voices”
  let overrideNative = false;
  // 3) final flag: RV only if English AND not overridden
  let speakUsingRV   = useRV && !overrideNative;

  // Inject a “Use system voices” checkbox under the voice picker:
  const picker = document.getElementById("voicePickerContainer");
  const chkWrap = document.createElement("div");
  chkWrap.innerHTML = `
    <label style="font-size:0.9em;margin-left:1em;">
      <input type="checkbox" id="nativeVoiceToggle"/>
      Use system voices
    </label>
  `;
  picker.appendChild(chkWrap);
  const nativeToggle = document.getElementById("nativeVoiceToggle");
  nativeToggle.addEventListener("change", () => {
    overrideNative = nativeToggle.checked;
    speakUsingRV   = useRV && !overrideNative;
    loadVoices();
  });

  // grab UI
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

  // collect real content
  let paras = Array.from(document.querySelectorAll(
    "#readableContent p, #readableContent li, " +
    "#readableContent h1, #readableContent h2, #readableContent h3," +
    "#readableContent h4, #readableContent h5, #readableContent h6"
  ));
  // strip any leading front-matter echoes
  const first = paras.findIndex(p => !p.textContent.trim().startsWith("---"));
  if (first>0) paras = paras.slice(first);

  let idx      = 0,
      rate     = 1.0,
      isPaused = false,
      suppress = false;  // prevent next-para on cancel

  // speed badge helper
  function showSpeed(txt) {
    let b = document.getElementById("speedBadge");
    if (!b) {
      b = document.createElement("div");
      b.id = "speedBadge";
      Object.assign(b.style, {
        position:"fixed",bottom:"20px",
        left:"50%",transform:"translateX(-50%)",
        background:"#000",color:"#fff",
        padding:"6px 12px",borderRadius:"4px",
        opacity:".8",zIndex:9999,fontSize:"1em"
      });
      document.body.appendChild(b);
    }
    b.textContent = txt;
    clearTimeout(b.to); b.to = setTimeout(()=>b.remove(),2000);
  }

  // update progress/time
  function updateProg() {
    const totalW = paras.reduce((s,p)=>s+p.textContent.split(/\s+/).length,0);
    const doneW  = paras.slice(0,idx)
                  .reduce((s,p)=>s+p.textContent.split(/\s+/).length,0);
    progBar.style.width = Math.min(100,doneW/totalW*100)+"%";
    const remSec = Math.ceil((totalW-doneW)*0.4/rate);
    timeLabel.textContent = `Time left: ${Math.floor(remSec/60)}:`+
      `${String(remSec%60).padStart(2,"0")}`;
  }

  // speak current paragraph
  function speakText(txt) {
    bufIcon.classList.add("spinning");
    if (speakUsingRV) {
      responsiveVoice.speak(txt, voiceSel.value, { rate, onend: rvEnd });
    } else {
      let u = new SpeechSynthesisUtterance(txt);
      u.voice = speechSynthesis.getVoices()
                  .find(v=>v.name===voiceSel.value)
                || speechSynthesis.getVoices()[0];
      u.lang = u.voice.lang;
      u.rate = rate;
      u.onend = rvEnd;
      speechSynthesis.speak(u);
    }
  }
  function rvEnd() {
    bufIcon.style.display="none";
    if (suppress) { suppress=false; return; }
    if (!isPaused && idx<paras.length-1) {
      idx++; updateProg(); readCurrent();
    }
  }

  function readCurrent() {
    const full = paras[idx].textContent.replace(/\[STOP\].*$/,"");
    speakText(full);
  }

  // voice selector
  function loadVoices() {
    voiceSel.innerHTML = "";
    if (speakUsingRV) {
      ["UK English Female","UK English Male"].forEach(name=>{
        const o = document.createElement("option");
        o.value = name;
        o.text  = name.includes("Female")?"Female":"Male";
        voiceSel.appendChild(o);
      });
    } else {
      speechSynthesis.getVoices();
      const langVoices = speechSynthesis.getVoices()
        .filter(v=>v.lang.startsWith(pageLang));
      let fem = langVoices.find(v=>/female/i.test(v.name)),
          mal = langVoices.find(v=>/male/i.test(v.name));
      if (!fem) fem = langVoices[0];
      if (!mal) mal = langVoices[1]||langVoices[0];
      [[fem,"Female"],[mal,"Male"]].forEach(([v,label])=>{
        if (!v) return;
        const o = document.createElement("option");
        o.value = v.name;
        o.text  = label;
        voiceSel.appendChild(o);
      });
    }
  }
  if (!speakUsingRV) speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  // controls wiring
  startBtn.onclick = () => {
    idx = 0; isPaused=false; suppress=false;
    startBtn.style.display="none";
    controls.style.display="block";
    readCurrent();
  };
  playBtn.onclick  = ()=>{ isPaused=false; speakUsingRV?responsiveVoice.resume():speechSynthesis.resume(); };
  pauseBtn.onclick = ()=>{ isPaused=true;  speakUsingRV?responsiveVoice.pause():speechSynthesis.pause(); };
  stopBtn.onclick  = ()=>{
    isPaused=true; suppress=true;
    speakUsingRV?responsiveVoice.cancel():speechSynthesis.cancel();
    idx=0; updateProg();
    controls.style.display="none";
    startBtn.style.display="inline-block";
  };
  nextBtn.onclick  = ()=>{ suppress=true;
    speakUsingRV?responsiveVoice.cancel():speechSynthesis.cancel();
    if(idx<paras.length-1) idx++; readCurrent();
  };
  prevBtn.onclick  = ()=>{ suppress=true;
    speakUsingRV?responsiveVoice.cancel():speechSynthesis.cancel();
    if(idx>0) idx--; readCurrent();
  };

  slowBtn.onclick = ()=>{
    rate=Math.max(0.5,rate-0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress=true;
    speakUsingRV?responsiveVoice.cancel():speechSynthesis.cancel();
    readCurrent();
  };
  normBtn.onclick = ()=>{
    rate=1.0; showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress=true;
    speakUsingRV?responsiveVoice.cancel():speechSynthesis.cancel();
    readCurrent();
  };
  fastBtn.onclick = ()=>{
    rate=Math.min(2.0,rate+0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress=true;
    speakUsingRV?responsiveVoice.cancel():speechSynthesis.cancel();
    readCurrent();
  };
});
