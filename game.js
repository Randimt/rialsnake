(() => {
  const cvs = document.getElementById('game');
  const ctx = cvs.getContext('2d');
  const scoreEl = document.getElementById('score');
  const pauseBtn = document.getElementById('pause');
  const restartBtn = document.getElementById('restart');
  const highScoreEl = document.getElementById('highscore');

  const COLS = 24, ROWS = 24;
  let CELL;

  function resizeCanvas() {
    const size = Math.min(window.innerWidth * 0.9, 400);
    cvs.width = size;
    cvs.height = size;
    CELL = Math.floor(size / COLS);
    if (CELL < 8) CELL = 8;
    draw();
  }
  window.addEventListener('resize', resizeCanvas);

  let snake, dir, nextDir, food, score, tickMs, last, paused, over;
  let highScore = parseInt(localStorage.getItem("rialSnakeHS") || "0");
  highScoreEl.textContent = highScore;

  // 🎵 Background soundtrack
  const bgMusic = new Audio('assets/bg_music.mp3');
  bgMusic.loop = true;     // muter terus
  bgMusic.volume = 0.35;   // volume sedang

 // 🎮 Overlay "Tap to Start"
  const overlay = document.getElementById('overlay');
  overlay.addEventListener('click', () => {
  overlay.style.display = 'none'; // sembunyikan overlay
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => console.log("Audio blocked"));
  reset();
  resizeCanvas();
  requestAnimationFrame(step);
});
    // Simple sound helper
  function playBeep(freq = 440, duration = 0.1, type = 'square') {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function reset(speed = 140) {
    snake = [{x:12,y:12},{x:11,y:12},{x:10,y:12}];
    dir = {x:1,y:0};
    nextDir = {x:1,y:0};
    placeFood();
    score = 0; tickMs = speed; last = 0; paused = false; over = false;
    scoreEl.textContent = `SCORE ${score}`;
    if (bgMusic.paused) {
    bgMusic.currentTime = 0; // mulai dari awal
    bgMusic.play().catch(()=>{});
    }
    draw();
  }

  function placeFood() {
    while (true) {
      const f = {x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS)};
      if (!snake.some(s => s.x===f.x && s.y===f.y)) { food=f; return; }
    }
  }

  function setDir(nx, ny) {
    if (nx === -dir.x && ny === -dir.y) return;
    nextDir = {x:nx,y:ny};
  }

  function step(ts) {
    if (paused || over) return requestAnimationFrame(step);
    if (!last) last = ts;
    const delta = ts - last;
    if (delta >= tickMs) {
      last = ts;
      dir = nextDir;
      const head = {x:(snake[0].x+dir.x+COLS)%COLS, y:(snake[0].y+dir.y+ROWS)%ROWS};
      if (snake.some((s,i)=>i&&s.x===head.x&&s.y===head.y)){
        playBeep(180, 0.3, 'sawtooth'); // 💀 suara mati
        over = true; flash();
        showGameOver(); // 🎯 tampilkan teks fade-in
        if (score > highScore) {
          highScore = score;
          localStorage.setItem("rialSnakeHS", highScore);
          highScoreEl.textContent = highScore;
        }
        return;
      }
      snake.unshift(head);
      if (head.x===food.x && head.y===food.y){
          playBeep(600, 0.08, 'triangle'); // 🍏 makan
          score++; scoreEl.textContent = `SCORE ${score}`; placeFood();
          tickMs = Math.max(60, tickMs-3);
        }else snake.pop();
      draw();
    }
    requestAnimationFrame(step);
  }

  function draw() {
    ctx.clearRect(0,0,cvs.width,cvs.height);
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    for (let y=0; y<ROWS; y++) for (let x=0; x<COLS; x++) ctx.fillRect(x*CELL, y*CELL, 1, 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#111';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('RIALO', 8, 18);
    ctx.fillStyle = '#222';
    pixelRect(food.x, food.y);
    for (let i=0; i<snake.length; i++) {
      const s = snake[i];
      ctx.fillStyle = '#111';
      pixelRect(s.x, s.y);
      if (i===0) {
        ctx.fillStyle = '#efe8d8';
        ctx.fillRect(s.x*CELL+Math.floor(CELL/3), s.y*CELL+Math.floor(CELL/3),
          Math.max(1,Math.floor(CELL/3)), Math.max(1,Math.floor(CELL/3)));
      }
    }
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.strokeRect(1,1,cvs.width-2,cvs.height-2);
  }

  function showGameOver() {
    if (!bgMusic.paused) bgMusic.pause();
  let alpha = 0; // mulai dari transparan

  function fade() {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#efe8d8';
    ctx.font = `bold ${Math.floor(cvs.width / 10)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', cvs.width / 2, cvs.height / 2);
    ctx.font = `bold ${Math.floor(cvs.width / 20)}px monospace`;
    ctx.fillText('Press R to restart', cvs.width / 2, cvs.height / 2 + 40);
    ctx.restore();

    if (alpha < 1) {
      alpha += 0.03; // kecepatan fade (semakin kecil semakin lambat)
      requestAnimationFrame(fade);
    }
  }

  fade();
}


  function pixelRect(x,y){ ctx.fillRect(x*CELL, y*CELL, CELL, CELL); }

  function flash(){
    const bar = document.querySelector('.topbar');
    let c=0; const iv = setInterval(()=>{
      bar.style.background = (c++%2)? '#a00' : '#efe8d8';
      if (c>6){ clearInterval(iv); bar.style.background = '#efe8d8'; }
    },120);
  }

  window.addEventListener('keydown',(e)=>{
    switch(e.key){
      case 'ArrowUp': case 'w': case 'W': setDir(0,-1); break;
      case 'ArrowDown': case 's': case 'S': setDir(0,1); break;
      case 'ArrowLeft': case 'a': case 'A': setDir(-1,0); break;
      case 'ArrowRight': case 'd': case 'D': setDir(1,0); break;
      case 'p': case 'P': paused=!paused; pauseBtn.textContent = paused?'▶ Resume':'⏸ Pause'; break;
      case 'r': case 'R': reset(); break;
    }
  });

  const btnUp = document.getElementById('up');
const btnDown = document.getElementById('down');
const btnLeft = document.getElementById('left');
const btnRight = document.getElementById('right');

if (btnUp && btnDown && btnLeft && btnRight) {
  btnUp.onclick = () => setDir(0, -1);
  btnDown.onclick = () => setDir(0, 1);
  btnLeft.onclick = () => setDir(-1, 0);
  btnRight.onclick = () => setDir(1, 0);
}

  pauseBtn.onclick = ()=>{ paused=!paused; pauseBtn.textContent = paused?'▶ Resume':'⏸ Pause'; };
  restartBtn.onclick = ()=> {
  if (bgMusic.paused) {
  bgMusic.currentTime = 0;
  bgMusic.play().catch(()=>{});
  }
  reset();
  resizeCanvas();
  requestAnimationFrame(step)
};

})();
