// ==========================================================
// 共通スクリプト：ナビ開閉・論文検索・ヒーロー背景アニメーション
// ==========================================================

// ---------- モバイルナビ ----------
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    // 開閉の状態を aria-expanded にも反映し、読み上げソフトに伝える
    const setOpen = open => {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    // Esc キーで閉じ、メニューボタンへ戻る
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // ---------- スクロールで節が現れる・見出しの罫を引く ----------
  // 読み込み時に画面の中にある節はそのまま見せ（罫だけ引く）、画面の下にある節だけ隠しておいて、
  // 入ってきたときに浮かび上がらせる。「視差効果を減らす」設定や古いブラウザでは何もしない。
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const blocks = Array.from(document.querySelectorAll('main > section.block'));
    const title = document.querySelector('.page-title');
    blocks.forEach(b => { if (b.getBoundingClientRect().top > window.innerHeight) b.classList.add('pending'); });
    document.documentElement.classList.add('anim');
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      if (e.target.classList.contains('pending')) e.target.classList.replace('pending', 'revealed');
      e.target.classList.add('drawn');
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px' });
    blocks.forEach(b => io.observe(b));
    if (title) requestAnimationFrame(() => requestAnimationFrame(() => title.classList.add('drawn')));
  }

  // ---------- 論文リストの絞り込み検索 ----------
  const search = document.getElementById('pub-search');
  if (search) {
    const items = Array.from(document.querySelectorAll('#paper-list .pub-list li'));
    const count = document.getElementById('pub-count');
    // 番号は読み込み時の順で固定する（CSS の連番だと、絞り込むたびに振り直されてしまう）
    items.forEach((li, i) => { li.dataset.number = String(i + 1); });
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

  // ---------- ヒーロー背景：曲線短縮流（1次元の平均曲率流） ----------
  const canvas = document.getElementById('mcf-canvas');
  if (canvas) startMCF(canvas);
});

// 花形の閉曲線を発する曲線短縮流を数値計算し、途中の曲線を重ねて描く。
// 各点を「曲率ベクトル」方向へ動かし、毎回、点を弧長について等間隔に並べ直す。
// 平面の閉曲線は丸くなりながら有限時間 T = (初期面積)/(2π) で1点に崩壊するので、
// 面積が初めの 1/10 になる時刻（0.9T）で止め、その図を静止画として残す。
// 動きは約4.5秒で止まる。「視差効果を減らす」設定の閲覧者には最初から静止画を出す。
function startMCF(canvas) {
  const ctx = canvas.getContext('2d');
  const N = 160;            // 曲線の分割点数
  const FRAMES = 270;       // 60fps で約4.5秒（5秒を超えて動かさない）
  const SNAP_EVERY = 18;    // 何フレームごとに途中の曲線を残すか
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pts, trail, T, frame, timer = null;

  function area(ps) {
    let A = 0;
    for (let i = 0; i < N; i++) {
      const p = ps[i], q = ps[(i + 1) % N];
      A += p[0] * q[1] - q[0] * p[1];
    }
    return Math.abs(A) / 2;
  }

  // 折れ線を弧長について等間隔な N 点に並べ直す
  function resample(ps) {
    const seg = [], cum = [0];
    for (let i = 0; i < N; i++) {
      const p = ps[i], q = ps[(i + 1) % N];
      seg.push(Math.hypot(q[0] - p[0], q[1] - p[1]));
      cum.push(cum[i] + seg[i]);
    }
    const L = cum[N], out = [];
    let j = 0;
    for (let k = 0; k < N; k++) {
      const s = (k / N) * L;
      while (cum[j + 1] < s) j++;
      const t = seg[j] > 0 ? (s - cum[j]) / seg[j] : 0;
      const p = ps[j], q = ps[(j + 1) % N];
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
    return { pts: out, h: L / N };
  }

  // 時間 tau だけ流す。陽解法なので、刻み幅は点の間隔 h に対して 0.2h² 以下に抑える。
  function flow(tau) {
    while (tau > 0) {
      let r = resample(pts);
      pts = r.pts;
      const dt = Math.min(tau, 0.2 * r.h * r.h);
      const next = [];
      for (let i = 0; i < N; i++) {
        const p = pts[i], a = pts[(i + N - 1) % N], b = pts[(i + 1) % N];
        const h1 = Math.hypot(p[0] - a[0], p[1] - a[1]) || 1e-9;
        const h2 = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1e-9;
        // 曲率ベクトル ≒ 単位接ベクトルの差 / 弧長
        const kx = 2 * ((b[0] - p[0]) / h2 - (p[0] - a[0]) / h1) / (h1 + h2);
        const ky = 2 * ((b[1] - p[1]) / h2 - (p[1] - a[1]) / h1) / (h1 + h2);
        next.push([p[0] + dt * kx, p[1] + dt * ky]);
      }
      pts = next;
      tau -= dt;
    }
  }

  function init() {
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const w = canvas.width, h = canvas.height;
    const base = Math.min(w, h) * 0.36;
    // 曲線は面積の重心あたりへ縮むので、その点が写真の裏に隠れないよう、
    // 写真の左隣（最後の円の半径ぶん離した位置）を中心にする。写真が無ければ中央。
    let cx = w * 0.5, cy = h * 0.5;
    const photo = document.querySelector('.hero .portrait');
    if (photo && photo.offsetParent) {
      const c = canvas.getBoundingClientRect(), r = photo.getBoundingClientRect();
      const rEnd = base * 0.33;   // 止める時刻での円のおよその半径
      cx = Math.max(base * 0.6, (r.left - c.left) * devicePixelRatio - rEnd - 14 * devicePixelRatio);
      cy = ((r.top + r.bottom) / 2 - c.top) * devicePixelRatio;
    }
    const k = 5 + Math.floor(Math.random() * 3); // 花びらの枚数
    pts = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const r = base * (1 + 0.35 * Math.sin(k * t) + 0.1 * Math.sin((k + 2) * t + 1));
      pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
    }
    pts = resample(pts).pts;
    T = area(pts) / (2 * Math.PI);
    trail = [pts.map(p => p.slice())];
    frame = 0;
  }

  function stroke(ps, alpha, width) {
    ctx.beginPath();
    ps.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    ctx.strokeStyle = `rgba(27, 42, 74, ${alpha})`;
    ctx.lineWidth = width * devicePixelRatio;
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 途中の曲線を薄く重ねて「流れ」を見せる（新しいものほど濃い）
    trail.forEach((c, idx) => stroke(c, 0.06 + 0.12 * idx / Math.max(1, trail.length - 1), 1));
    stroke(pts, 0.45, 1.2);
  }

  function advance() {
    flow((0.9 * T) / FRAMES);
    frame++;
    if (frame % SNAP_EVERY === 0) trail.push(pts.map(p => p.slice()));
  }

  function run() {
    if (timer) cancelAnimationFrame(timer);
    init();
    if (reduceMotion) {
      while (frame < FRAMES) advance();
      draw();
      return;
    }
    const loop = () => {
      advance();
      draw();
      timer = frame < FRAMES ? requestAnimationFrame(loop) : null;
    };
    loop();
  }

  run();
  // 図をクリックすると、新しい花形からもう一度流す（「視差効果を減らす」設定では何もしない）
  if (!reduceMotion) {
    canvas.title = document.documentElement.lang === 'en' ? 'Click to run the flow again' : 'クリックでもう一度流す';
    canvas.addEventListener('click', run);
  }
  // 幅が変わったら描き直す（スマホの縦横回転など）。高さだけの変化は無視する。
  let lastW = canvas.clientWidth;
  window.addEventListener('resize', () => {
    if (canvas.clientWidth === lastW) return;
    lastW = canvas.clientWidth;
    run();
  });
}
