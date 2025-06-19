// assets/js/readAloud.js

document.addEventListener('DOMContentLoaded', () => {
  // ——— grab UI elements ———
  const voiceSelect     = document.getElementById('voiceSelect');
  const startBtn        = document.getElementById('startReadAloud');
  const controlsDiv     = document.getElementById('readAloudControls');
  const playResumeBtn   = document.getElementById('playResume');
  const pauseBtn        = document.getElementById('pause');
  const stopBtn         = document.getElementById('stop');
  const prevBtn         = document.getElementById('prevParagraph');
  const nextBtn         = document.getElementById('nextParagraph');
  const slowBtn         = document.getElementById('slow');
  const normalBtn       = document.getElementById('normal');
  const fastBtn         = document.getElementById('fast');
  const closePanelBtn   = document.getElementById('closePanel');
  const readingBar      = document.getElementById('readingProgress');
  const bufferBar       = document.getElementById('bufferProgress');
  const bufferIndicator = document.getElementById('bufferIndicator');
  const timeLabel       = document.getElementById('timeRemainingLabel');

  // ——— collect text nodes ———
  const paragraphs = Array.from(
    document
      .querySelectorAll('#readableContent p, #readableContent li, #readableContent h1, #readableContent h2, #readableContent h3')
  );
  let paragraphWordCounts = [],
      totalWords = 0;
  paragraphs.forEach(el => {
    let c = el.innerText.trim().split(/\s+/).length;
    paragraphWordCounts.push(c);
    totalWords += c;
  });

  // ——— state ———
  let currentIndex     = 0;
  let speechRate       = 1.0;
  let isPaused         = false;
  let lastStop         = 0;
  let wordsRead        = 0;
  let paragraphStart   = 0;
  let bufferStart      = 0;
  let rafID           = null;
  const SEC_PER_WORD   = 0.4;

  // ——— “today” filter (not strictly needed here) ———
  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Los_Angeles', year:'numeric',month:'2-digit',day:'2-digit'
  });

  // ——— voice loading & picker ———
  const pageLang = document.documentElement.lang.slice(0,2) || 'en';
  let allVoices = [];
  function populateVoices() {
    allVoices = window.speechSynthesis.getVoices();
    // pick only voices matching pageLang
    let candidates = allVoices.filter(v => v.lang.startsWith(pageLang));
    if (pageLang === 'en') {
      // force UK
      candidates = candidates.filter(v => v.lang.match(/^(en-GB|en-gb)/));
    }
    let female = candidates.find(v => /female/i.test(v.name)) || candidates[0];
    let male   = candidates.find(v => /male/i.test(v.name))   || candidates[1] || female;
    voiceSelect.innerHTML = '';
    if (female) {
      let o = document.createElement('option');
      o.value = female.name; o.text = 'Female';
      voiceSelect.appendChild(o);
    }
    if (male && male.name !== female.name) {
      let o = document.createElement('option');
      o.value = male.name; o.text = 'Male';
      voiceSelect.appendChild(o);
    }
  }
  window.speechSynthesis.addEventListener('voiceschanged', populateVoices);
  populateVoices();

  // ——— helpers ———
  function updateProgress() {
    let elapsed = (Date.now() - paragraphStart)/1000;
    let count   = paragraphWordCounts[currentIndex];
    let est     = count*SEC_PER_WORD/speechRate;
    let frac    = Math.min(1, elapsed/est);
    let read    = wordsRead + frac*count;
    readingBar.style.width = (read/totalWords*100)+'%';

    // remaining
    let rem = Math.max(0, est - elapsed);
    for (let i=currentIndex+1; i<paragraphs.length; i++){
      rem += paragraphWordCounts[i]*SEC_PER_WORD/speechRate;
    }
    let m = Math.floor(rem/60), s = Math.floor(rem%60);
    timeLabel.textContent = `Time remaining: ${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }
  function updateBuffer() {
    let b = Math.min(1, (Date.now()-bufferStart)/2000);
    bufferBar.style.width = (b*100)+'%';
  }
  function progressLoop() {
    updateProgress(); updateBuffer();
    rafID = requestAnimationFrame(progressLoop);
  }

  function speakText(txt) {
    const u = new SpeechSynthesisUtterance(txt);
    u.voice = allVoices.find(v=>v.name===voiceSelect.value);
    u.lang  = u.voice.lang;
    u.rate  = speechRate;
    u.onstart = () => { bufferStart=Date.now(); bufferIndicator.style.display='inline-block'; };
    u.onend   = () => {
      bufferIndicator.style.display='none';
      bufferBar.style.width='0%';
      let w = txt.trim().split(/\s+/).length;
      wordsRead += w;
      if (!isPaused && currentIndex < paragraphs.length-1) {
        currentIndex++; readCurrentParagraph();
      } else {
        cancelAnimationFrame(rafID);
      }
    };
    window.speechSynthesis.speak(u);
  }

  let stopFound=false;
  function readCurrentParagraph() {
    let full = paragraphs[currentIndex].innerText;
    stopFound = full.includes('[STOP]');
    let txt     = stopFound ? full.split('[STOP]')[0] : full;
    paragraphStart = Date.now();
    bufferStart    = Date.now();
    updateProgress();
    updateBuffer();
    speakText(txt);
  }

  // ——— event handlers ———
  startBtn.addEventListener('click', () => {
    currentIndex=0; wordsRead=0; isPaused=false;
    startBtn.style.display = 'none';
    controlsDiv.style.display = 'block';
    readCurrentParagraph();
    progressLoop();
  });
  playResumeBtn.addEventListener('click', ()=>{
    if (isPaused) { window.speechSynthesis.resume(); isPaused=false; }
    else { readCurrentParagraph(); }
  });
  pauseBtn.addEventListener('click', ()=>{
    window.speechSynthesis.pause(); isPaused=true;
  });
  stopBtn.addEventListener('click', ()=>{
    let now=Date.now();
    if (now-lastStop<2000) { currentIndex=0; wordsRead=0; }
    lastStop=now;
    window.speechSynthesis.cancel();
  });
  nextBtn.addEventListener('click', ()=>{
    window.speechSynthesis.cancel();
    if (currentIndex<paragraphs.length-1) { currentIndex++; readCurrentParagraph(); }
  });
  prevBtn.addEventListener('click', ()=>{
    window.speechSynthesis.cancel();
    if (currentIndex>0) { currentIndex--; readCurrentParagraph(); }
  });
  slowBtn.addEventListener('click', ()=>{
    speechRate = Math.max(0.5, speechRate-0.1);
    window.speechSynthesis.cancel(); readCurrentParagraph();
  });
  normalBtn.addEventListener('click', ()=>{
    speechRate=1.0; window.speechSynthesis.cancel(); readCurrentParagraph();
  });
  fastBtn.addEventListener('click', ()=>{
    speechRate=Math.min(2.0, speechRate+0.1);
    window.speechSynthesis.cancel(); readCurrentParagraph();
  });
  closePanelBtn.addEventListener('click', ()=>{
    window.speechSynthesis.cancel();
    controlsDiv.style.display='none';
    startBtn.style.display='inline-block';
    cancelAnimationFrame(rafID);
  });
});
