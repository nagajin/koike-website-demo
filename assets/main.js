// ==========================================================
// 共通スクリプト：ナビ開閉・論文検索・ヒーロー背景アニメーション
// ==========================================================

// ---------- モバイルナビ ----------
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  // ---------- 論文リストの絞り込み検索 ----------
  const search = document.getElementById('pub-search');
  if (search) {
    const items = Array.from(document.querySelectorAll('#paper-list .pub-list li'));
    const count = document.getElementById('pub-count');
    const update = () => {
      const q = search.value.trim().toLowerCase();
      let visible = 0;
      items.forEach(li => {
        const hit = q === '' || li.textContent.toLowerCase().includes(q);
        li.classList.toggle('hidden', !hit);
        if (hit) visible++;
      });
      if (count) count.textContent = `${visible} 件を表示中（全 ${items.length} 件）`;
    };
    search.addEventListener('input', update);
    update();
  }

  // ---------- ヒーロー背景：平均曲率流（曲線短縮流）アニメーション ----------
  const canvas = document.getElementById('mcf-canvas');
  if (canvas) startMCF(canvas);
});

// 閉曲線を曲率ベクトル方向に変形し、円に収束しながら1点に縮む様子を描く。
// 小さくなり切ったら花形の閉曲線から再スタートする。
function startMCF(canvas) {
  const ctx = canvas.getContext('2d');
  const N = 160;          // 曲線の分割点数
  let pts = [];

  function resize() {
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
  }
  resize();
  window.addEventListener('resize', () => { resize(); reset(); });

  function reset() {
    const w = canvas.width, h = canvas.height;
    const cx = w * 0.72, cy = h * 0.5;
    const base = Math.min(w, h) * 0.42;
    const k = 5 + Math.floor(Math.random() * 3); // 花びらの枚数
    pts = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const r = base * (1 + 0.35 * Math.sin(k * t) + 0.1 * Math.sin((k + 2) * t + 1));
      pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
  }
  reset();

  function step() {
    // 各点を離散ラプラシアン（≒曲率ベクトル）方向へ移動
    const next = [];
    for (let i = 0; i < N; i++) {
      const p = pts[i], a = pts[(i + N - 1) % N], b = pts[(i + 1) % N];
      next.push([
        p[0] + 0.22 * ((a[0] + b[0]) / 2 - p[0]),
        p[1] + 0.22 * ((a[1] + b[1]) / 2 - p[1]),
      ]);
    }
    pts = next;
  }

  function perimeter() {
    let L = 0;
    for (let i = 0; i < N; i++) {
      const p = pts[i], q = pts[(i + 1) % N];
      L += Math.hypot(q[0] - p[0], q[1] - p[1]);
    }
    return L;
  }

  let trail = [];
  function draw() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 過去の曲線を薄く残して「流れ」を見せる
    trail.forEach((curve, idx) => {
      ctx.beginPath();
      curve.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.strokeStyle = `rgba(140, 170, 255, ${0.05 + 0.05 * idx / trail.length})`;
      ctx.lineWidth = devicePixelRatio;
      ctx.stroke();
    });

    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.strokeStyle = 'rgba(190, 210, 255, 0.9)';
    ctx.lineWidth = 1.6 * devicePixelRatio;
    ctx.stroke();
  }

  let frame = 0;
  function loop() {
    step();
    if (frame % 14 === 0) {
      trail.push(pts.map(p => p.slice()));
      if (trail.length > 12) trail.shift();
    }
    draw();
    frame++;
    if (perimeter() < Math.min(canvas.width, canvas.height) * 0.25) {
      trail = [];
      reset();
    }
    requestAnimationFrame(loop);
  }
  loop();
}
