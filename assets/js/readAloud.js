// assets/js/readAloud.js
document.addEventListener("DOMContentLoaded", () => {
  const pageLang = (document.documentElement.lang || "en").slice(0,2);
  const useRV    = pageLang === "en";     // ResponsiveVoice only for English

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
    bufIcon.style.display="inline";
    if (useRV) {
      responsiveVoice.speak(txt, voiceSel.value, {
        rate,
        onend: rvEnd
      });
    } else {
      const u = new SpeechSynthesisUtterance(txt);
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
    if (useRV) {
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
  if (!useRV) speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  // controls wiring
  startBtn.onclick = () => {
    idx = 0; isPaused=false; suppress=false;
    startBtn.style.display="none";
    controls.style.display="block";
    readCurrent();
  };
  playBtn.onclick  = ()=>{ isPaused=false; useRV?responsiveVoice.resume():speechSynthesis.resume(); };
  pauseBtn.onclick = ()=>{ isPaused=true;  useRV?responsiveVoice.pause():speechSynthesis.pause(); };
  stopBtn.onclick  = ()=>{
    isPaused=true; suppress=true;
    useRV?responsiveVoice.cancel():speechSynthesis.cancel();
    idx=0; updateProg();
    controls.style.display="none";
    startBtn.style.display="inline-block";
  };
  nextBtn.onclick  = ()=>{ suppress=true;
    useRV?responsiveVoice.cancel():speechSynthesis.cancel();
    if(idx<paras.length-1) idx++; readCurrent();
  };
  prevBtn.onclick  = ()=>{ suppress=true;
    useRV?responsiveVoice.cancel():speechSynthesis.cancel();
    if(idx>0) idx--; readCurrent();
  };

  slowBtn.onclick = ()=>{
    rate=Math.max(0.5,rate-0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress=true;
    useRV?responsiveVoice.cancel():speechSynthesis.cancel();
    readCurrent();
  };
  normBtn.onclick = ()=>{
    rate=1.0; showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress=true;
    useRV?responsiveVoice.cancel():speechSynthesis.cancel();
    readCurrent();
  };
  fastBtn.onclick = ()=>{
    rate=Math.min(2.0,rate+0.1);
    showSpeed(`Speed: ${rate.toFixed(1)}×`);
    suppress=true;
    useRV?responsiveVoice.cancel():speechSynthesis.cancel();
    readCurrent();
  };
});
