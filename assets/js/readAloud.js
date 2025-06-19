// assets/js/readAloud.js
document.addEventListener("DOMContentLoaded", () => {
  // grab all UI elements
  const startBtn   = document.getElementById("startReadAloud");
  const controls   = document.getElementById("readAloudControls");
  const voiceSelect= document.getElementById("voiceSelect");
  const playBtn    = document.getElementById("playResume");
  const pauseBtn   = document.getElementById("pause");
  const stopBtn    = document.getElementById("stop");
  const prevBtn    = document.getElementById("prevParagraph");
  const nextBtn    = document.getElementById("nextParagraph");
  const slowBtn    = document.getElementById("slow");
  const normalBtn  = document.getElementById("normal");
  const fastBtn    = document.getElementById("fast");
  const readingBar = document.getElementById("readingProgress");
  const bufferBar  = document.getElementById("bufferProgress");
  const bufferIcon = document.getElementById("bufferIndicator");
  const timeLabel  = document.getElementById("timeRemainingLabel");

  // collect text nodes
  let paras = Array.from(document.querySelectorAll(
    "#readableContent p, #readableContent li, " +
    "#readableContent h1, #readableContent h2, #readableContent h3, " +
    "#readableContent h4, #readableContent h5, #readableContent h6"
  ));
  // drop any leading front-matter comment
  const firstReal = paras.findIndex(p=>!p.textContent.trim().startsWith("---"));
  if(firstReal>0) paras = paras.slice(firstReal);

  let idx = 0, rate = 1.0, isPaused = false;

  // progress updater
  function updateProgress() {
    const total = paras.reduce((sum,p)=>
      sum + p.textContent.split(/\s+/).length,0);
    const done  = paras.slice(0,idx).reduce((sum,p)=>
      sum + p.textContent.split(/\s+/).length,0);
    const pct = Math.min(100, done/total*100);
    readingBar.style.width = pct+"%";
    const remWords = total - done;
    const secs = Math.ceil(remWords*0.4/rate);
    timeLabel.textContent = `Time left: ${Math.floor(secs/60)}:` +
      String(secs%60).padStart(2,"0");
  }

  // speak a chunk
  function speak(text) {
    const utt = new SpeechSynthesisUtterance(text);
    const voice = speechSynthesis.getVoices()
      .find(v=>v.name===voiceSelect.value);
    if(voice) utt.voice = voice;
    utt.lang   = utt.voice?.lang||document.documentElement.lang;
    utt.rate   = rate;
    utt.onstart=()=>bufferIcon.style.display="none";
    utt.onend  =()=>{
      updateProgress();
      if(!isPaused && idx<paras.length-1){
        idx++; readCurrent();
      }
    };
    speechSynthesis.speak(utt);
  }

  function readCurrent(){
    bufferIcon.style.display="inline";
    const text = paras[idx].textContent.replace(/\[STOP\].*$/,"");
    speak(text);
  }

  // populate voiceSelect
  function loadVoices(){
    const all = speechSynthesis.getVoices();
    const lang = document.documentElement.lang.slice(0,2);
    voiceSelect.innerHTML="";
    let female, male;

    if(lang==="en"){
      female = all.find(v=>v.lang.startsWith("en-GB") && /female/i.test(v.name));
      male   = all.find(v=>v.lang.startsWith("en-GB") && /male/i.test(v.name));
      if(!female) female = all.find(v=>v.lang.startsWith("en-US") && /female/i.test(v.name));
      if(!male)   male   = all.find(v=>v.lang.startsWith("en-US") && /male/i.test(v.name));
      if(!female) female = all.find(v=>v.lang.startsWith("en"));
      if(!male)   male   = all.find(v=>v.lang.startsWith("en") && v.name!==female?.name);
    } else {
      female = all.find(v=>v.lang.startsWith(lang) && /female/i.test(v.name));
      male   = all.find(v=>v.lang.startsWith(lang) && /male/i.test(v.name));
      const any  = all.filter(v=>v.lang.startsWith(lang));
      if(!female) female = any[0];
      if(!male)   male   = any[1]||any[0];
    }

    [[female,"Female"],[male,"Male"]].forEach(([v,label])=>{
      if(v){
        const o = document.createElement("option");
        o.value = v.name;
        o.text  = label;
        voiceSelect.appendChild(o);
      }
    });
  }
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  // BUTTON HOOKUPS
  startBtn.onclick = ()=>{
    idx=0; isPaused=false;
    startBtn.style.display="none";
    controls.style.display="block";
    readCurrent();
  };
  playBtn.onclick  = ()=>{ isPaused=false; speechSynthesis.resume(); };
  pauseBtn.onclick = ()=>{ isPaused=true;  speechSynthesis.pause(); };
  stopBtn.onclick  = ()=>{
    isPaused=true; speechSynthesis.cancel();
    idx=0; updateProgress();
    controls.style.display="none";
    startBtn.style.display="inline-block";
  };
  nextBtn.onclick  = ()=>{ speechSynthesis.cancel(); if(idx<paras.length-1) idx++; readCurrent(); };
  prevBtn.onclick  = ()=>{ speechSynthesis.cancel(); if(idx>0) idx--; readCurrent(); };
  slowBtn.onclick  = ()=>{ rate=Math.max(0.5,rate-0.1); };
  normalBtn.onclick= ()=>{ rate=1.0; };
  fastBtn.onclick  = ()=>{ rate=Math.min(2,rate+0.1); };
});
