// assets/js/readAloud.js
document.addEventListener("DOMContentLoaded", () => {
  // 1) Populate the dropdown with only your two UK voices
  const voiceSel = document.getElementById("voiceSelect");
  ["UK English Female","UK English Male"].forEach(name => {
    const o = document.createElement("option");
    o.value = name;
    o.text  = name.includes("Female") ? "Female" : "Male";
    voiceSel.appendChild(o);
  });

  // 2) Grab all the controls
  const startBtn  = document.getElementById("startReadAloud");
  const controls  = document.getElementById("readAloudControls");
  const playBtn   = document.getElementById("playResume");
  const pauseBtn  = document.getElementById("pause");
  const stopBtn   = document.getElementById("stop");
  const prevBtn   = document.getElementById("prevParagraph");
  const nextBtn   = document.getElementById("nextParagraph");
  const slowBtn   = document.getElementById("slow");
  const normBtn   = document.getElementById("normal");
  const fastBtn   = document.getElementById("fast");
  const progBar   = document.getElementById("readingProgress");
  const bufIcon   = document.getElementById("bufferIndicator");
  const bufBar    = document.getElementById("bufferProgress");
  const timeLabel = document.getElementById("timeRemainingLabel");

  // 3) Gather your content paragraphs
  let paras = Array.from(document.querySelectorAll(
    "#readableContent p, #readableContent li, " +
    "#readableContent h1, #readableContent h2, #readableContent h3," +
    "#readableContent h4, #readableContent h5, #readableContent h6"
  ));
  // strip leading front-matter echoes:
  const first = paras.findIndex(p => !p.textContent.trim().startsWith("---"));
  if (first > 0) paras = paras.slice(first);

  // 4) State vars
  let idx      = 0,
      rate     = 1.0,
      isPaused = false,
      suppress = false;

  // 5) Speed badge helper
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

  // 6) Update progress/time
  function updateProg() {
    const wordCount = el => el.textContent.split(/\s+/).filter(w=>w).length;
    const totalW = paras.reduce((s,p)=>s+wordCount(p),0);
    const doneW  = paras.slice(0,idx)
                  .reduce((s,p)=>s+wordCount(p),0);
    progBar.style.width = Math.min(100,doneW/totalW*100) + "%";
    const remSec = Math.ceil((totalW - doneW) * 0.4 / rate);
    timeLabel.textContent = 
      `Time left: ${String(Math.floor(remSec/60)).padStart(2,"0")}` +
      `:${String(remSec%60).padStart(2,"0")}`;
  }

  // 7) Speak helper
  function rvEnd() {
    bufIcon.style.display = "none";
    if (suppress) { suppress = false; return; }
    if (!isPaused && idx < paras.length - 1) {
      idx++; updateProg(); readCurrent();
    }
  }

  function readCurrent() {
    bufIcon.style.display = "inline";
    const text = paras[idx].textContent.replace(/\[STOP\].*$/,"");
    responsiveVoice.speak(text, voiceSel.value, {
      rate,
      onend: rvEnd
    });
  }

  // 8) Wire up controls
  startBtn.onclick = () => {
    idx = 0; isPaused = false; suppress = false;
    startBtn.style.display = "none";
    controls.style.display = "block";
    readCurrent();
    updateProg();
  };
  playBtn.onclick  = () => { isPaused = false; responsiveVoice.resume();   };
  pauseBtn.onclick = () => { isPaused = true;  responsiveVoice.pause();    };
  stopBtn.onclick  = () => {
    isPaused = true; suppress = true;
    responsiveVoice.cancel();
    idx = 0; updateProg();
    controls.style.display = "none";
    startBtn.style.display = "inline-block";
  };
  nextBtn.onclick  = () => {
    suppress = true;
    responsiveVoice.cancel();
    if (idx < paras.length - 1) { idx++; readCurrent(); updateProg(); }
  };
  prevBtn.onclick  = () => {
    suppress = true;
    responsiveVoice.cancel();
    if (idx > 0) { idx--; readCurrent(); updateProg(); }
  };
  slowBtn.onclick = () => {
    rate = Math.max(0.5, rate - 0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress = true;
    responsiveVoice.cancel();
    readCurrent();
  };
  normBtn.onclick = () => {
    rate = 1.0;
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress = true;
    responsiveVoice.cancel();
    readCurrent();
  };
  fastBtn.onclick = () => {
    rate = Math.min(2.0, rate + 0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress = true;
    responsiveVoice.cancel();
    readCurrent();
  };
});
