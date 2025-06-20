// readAloud.js
document.addEventListener('DOMContentLoaded', function() {
  // 1) Populate voice dropdown with British options
  const voiceSelect = document.getElementById('voiceSelect');
  ['UK English Female','UK English Male'].forEach(name => {
    const o = document.createElement('option');
    o.value = name;
    o.text  = name.includes('Female') ? 'Female' : 'Male';
    voiceSelect.appendChild(o);
  });

  // 2) Grab all UI elements
  const startBtn = document.getElementById('startReadAloud'),
        controls = document.getElementById('readAloudControls'),
        playBtn  = document.getElementById('playResume'),
        pauseBtn = document.getElementById('pause'),
        stopBtn  = document.getElementById('stop'),
        prevBtn  = document.getElementById('prevParagraph'),
        nextBtn  = document.getElementById('nextParagraph'),
        slowBtn  = document.getElementById('slow'),
        normBtn  = document.getElementById('normal'),
        fastBtn  = document.getElementById('fast'),
        bufIcon  = document.getElementById('bufferIndicator'),
        progBar  = document.getElementById('readingProgress'),
        timeLbl  = document.getElementById('timeRemainingLabel');

  // 3) Collect paragraphs & headings to read
  let paras = Array.from(document.querySelectorAll(
    '#readableContent p, ' +
    '#readableContent li, ' +
    '#readableContent h1, ' +
    '#readableContent h2, ' +
    '#readableContent h3'
  ));
  // strip any leading front-matter echoes
  const firstReal = paras.findIndex(p => !p.textContent.trim().startsWith('---'));
  if (firstReal > 0) paras = paras.slice(firstReal);

  let idx = 0, rate = 1.0, isPaused = false;

  // 4) Read current paragraph via ResponsiveVoice
  function readCurrent() {
    const txt = paras[idx].textContent.replace(/\[STOP\].*$/, '');
    bufIcon.classList.add('spinning');
    responsiveVoice.speak(txt, voiceSelect.value, {
      rate,
      onstart: () => bufIcon.classList.remove('spinning'),
      onend:   onEnd
    });
  }

  function onEnd() {
    if (idx < paras.length - 1 && !isPaused) {
      idx++;
      readCurrent();
    }
  }

  // 5) Wire up buttons
  startBtn.onclick = () => {
    idx = 0; isPaused = false;
    startBtn.style.display   = 'none';
    controls.style.display    = 'block';
    readCurrent();
  };
  playBtn.onclick  = () => { isPaused = false; responsiveVoice.resume(); };
  pauseBtn.onclick = () => { isPaused = true;  responsiveVoice.pause();  };
  stopBtn.onclick  = () => {
    isPaused = true;
    responsiveVoice.cancel();
    idx = 0;
    controls.style.display = 'none';
    startBtn.style.display  = 'inline-block';
  };
  nextBtn.onclick = () => {
    responsiveVoice.cancel();
    if (idx < paras.length - 1) { idx++; readCurrent(); }
  };
  prevBtn.onclick = () => {
    responsiveVoice.cancel();
    if (idx > 0) { idx--; readCurrent(); }
  };
  slowBtn.onclick = () => {
    rate = Math.max(0.5, rate - 0.1);
    responsiveVoice.cancel();
    readCurrent();
  };
  normBtn.onclick = () => {
    rate = 1.0;
    responsiveVoice.cancel();
    readCurrent();
  };
  fastBtn.onclick = () => {
    rate = Math.min(2.0, rate + 0.1);
    responsiveVoice.cancel();
    readCurrent();
  };
});
