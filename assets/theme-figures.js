// ==========================================================
// 研究テーマの線画（トップページと英語版のトップだけで読み込む）
//
// HTML の <div class="theme-fig" data-fig="名前"></div> の中に SVG を描き、
// その図が画面に入ったときに一度だけ線を引いていく。名前と図の対応は下の FIGS。
//   submersion       … 平坦なヒルベルト空間から球面（コンパクト型対称空間）への写像
//   complexification … ポアンカレ円板の測地線と、理想境界の外まで延ばした続き
//   flows            … 同じ曲線から、内へ平均曲率流・外へ逆平均曲率流（数値計算）
//   surgery          … ダンベル形の首がくびれ、手術で2つに分かれる様子（模式図）
// 「視差効果を減らす」設定の閲覧者には、線を引かずに完成した図を出す。
// ==========================================================
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 120, H = 84;

  // 点列 → SVG の path 文字列
  const d = (pts, close) =>
    pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('') + (close ? 'Z' : '');

  function add(svg, attrs) {
    const el = document.createElementNS(NS, 'path');
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    svg.appendChild(el);
    return el;
  }

  // 矢印の頭（終点 to に向かう2本の短い線）
  function arrowHead(from, to, size = 3.2) {
    const a = Math.atan2(to[1] - from[1], to[0] - from[0]);
    const p = t => [to[0] - size * Math.cos(a + t), to[1] - size * Math.sin(a + t)];
    return 'M' + p(0.5).join(' ') + 'L' + to.join(' ') + 'L' + p(-0.5).join(' ');
  }

  // ---------- 平面曲線の流れ（トップの背景と同じ考え方） ----------
  // 曲率ベクトル K ≒ 単位接ベクトルの差 / 弧長。毎ステップ、弧長について等間隔に並べ直す。
  function resample(ps) {
    const n = ps.length, seg = [], cum = [0];
    for (let i = 0; i < n; i++) {
      const p = ps[i], q = ps[(i + 1) % n];
      seg.push(Math.hypot(q[0] - p[0], q[1] - p[1]));
      cum.push(cum[i] + seg[i]);
    }
    const L = cum[n], out = [];
    let j = 0;
    for (let k = 0; k < n; k++) {
      const s = (k / n) * L;
      while (cum[j + 1] < s) j++;
      const t = seg[j] > 0 ? (s - cum[j]) / seg[j] : 0;
      const p = ps[j], q = ps[(j + 1) % n];
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
    return { pts: out, h: L / n, L };
  }
  function curvatureVectors(ps) {
    const n = ps.length;
    return ps.map((p, i) => {
      const a = ps[(i + n - 1) % n], b = ps[(i + 1) % n];
      const h1 = Math.hypot(p[0] - a[0], p[1] - a[1]) || 1e-9;
      const h2 = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1e-9;
      return [2 * ((b[0] - p[0]) / h2 - (p[0] - a[0]) / h1) / (h1 + h2),
              2 * ((b[1] - p[1]) / h2 - (p[1] - a[1]) / h1) / (h1 + h2)];
    });
  }
  // 平均曲率流（曲線短縮流）：速度 = K。時間 tau だけ流す
  function mcf(ps, tau) {
    while (tau > 0) {
      const r = resample(ps);
      const dt = Math.min(tau, 0.2 * r.h * r.h);
      const K = curvatureVectors(r.pts);
      ps = r.pts.map((p, i) => [p[0] + dt * K[i][0], p[1] + dt * K[i][1]]);
      tau -= dt;
    }
    return ps;
  }
  // 逆平均曲率流：外向き単位法線方向に速さ 1/κ、すなわち速度 = −K/|K|²（凸な曲線で使う）。
  // 平面では長さが e^t 倍になるので、長さが目標に達するまで流す
  function imcf(ps, lengthRatio) {
    const L0 = resample(ps).L;
    for (let guard = 0; guard < 20000; guard++) {
      const r = resample(ps);
      if (r.L >= L0 * lengthRatio) return r.pts;
      const K = curvatureVectors(r.pts);
      const kmin = Math.min(...K.map(k => Math.hypot(k[0], k[1])));
      const dt = 0.3 * r.h * r.h * kmin * kmin;   // 陽解法の安定条件の目安
      ps = r.pts.map((p, i) => {
        const k2 = K[i][0] * K[i][0] + K[i][1] * K[i][1];
        return [p[0] - dt * K[i][0] / k2, p[1] - dt * K[i][1] / k2];
      });
    }
    return ps;
  }
  const area = ps => Math.abs(ps.reduce((A, p, i) => {
    const q = ps[(i + 1) % ps.length];
    return A + p[0] * q[1] - q[0] * p[1];
  }, 0)) / 2;

  // ---------- 4つの図 ----------
  const FIGS = {
    submersion(svg) {
      // 上：平坦な空間（平行四辺形）と、その上の2本の平行な直線
      add(svg, { d: 'M16 8L100 8L108 26L24 26Z', class: 'f-main' });
      add(svg, { d: 'M34 11L56 23', class: 'f-accent' });
      add(svg, { d: 'M58 11L80 23', class: 'f-accent' });
      // 下へ落とす写像（破線の矢印）
      add(svg, { d: 'M46 29L52 43', class: 'f-dash' });
      add(svg, { d: arrowHead([46, 29], [52, 43]), class: 'f-sub' });
      add(svg, { d: 'M74 29L68 43', class: 'f-dash' });
      add(svg, { d: arrowHead([74, 29], [68, 43]), class: 'f-sub' });
      // 下：球面（輪郭・赤道）と、像として現れる曲線
      add(svg, { d: 'M43 63A17 17 0 1 0 77 63A17 17 0 1 0 43 63', class: 'f-main' });
      add(svg, { d: 'M43 63A17 5 0 0 0 77 63', class: 'f-sub' });
      add(svg, { d: 'M43 63A17 5 0 0 1 77 63', class: 'f-dash' });
      add(svg, { d: 'M48 52C55 57 63 64 72 73', class: 'f-accent' });
    },

    complexification(svg) {
      const O = [52, 42], R = 28;
      add(svg, { d: `M${O[0] - R} ${O[1]}A${R} ${R} 0 1 0 ${O[0] + R} ${O[1]}A${R} ${R} 0 1 0 ${O[0] - R} ${O[1]}`, class: 'f-main' });
      // 境界と直交する円（＝ポアンカレ円板の測地線）を描き、円板の中は実線、外は破線
      const geodesic = (t1, t2) => {
        const a1 = t1 * Math.PI / 180, a2 = t2 * Math.PI / 180;
        const half = Math.abs(a2 - a1) / 2, mid = (a1 + a2) / 2;
        const dist = R / Math.cos(half), rho = R * Math.tan(half);
        const C = [O[0] + dist * Math.cos(mid), O[1] + dist * Math.sin(mid)];
        // 境界と直交するので、C から見て円板内の弧は「O の方向 ± atan(R/ρ)」
        const phi0 = Math.atan2(O[1] - C[1], O[0] - C[0]), alpha = Math.atan(R / rho);
        const at = phi => [C[0] + rho * Math.cos(phi), C[1] + rho * Math.sin(phi)];
        const inside = [];
        for (let i = 0; i <= 80; i++) inside.push(at(phi0 - alpha + (2 * alpha * i) / 80));
        // 外への続き：端点から先へ、円板の 1.45 倍の範囲と図の枠の中だけ伸ばす
        const beyond = dir => {
          const pts = [];
          for (let i = 0; i <= 200; i++) {
            const p = at(phi0 + dir * (alpha + (i / 200) * Math.PI / 2));
            const r = Math.hypot(p[0] - O[0], p[1] - O[1]);
            if (r > R * 1.45 || p[0] < 2 || p[0] > W - 2 || p[1] < 2 || p[1] > H - 2) break;
            pts.push(p);
          }
          return pts;
        };
        return { inside, outside: [beyond(1), beyond(-1)].filter(s => s.length > 3) };
      };
      const gs = [geodesic(200, 320), geodesic(330, 450), geodesic(100, 190)];
      gs.forEach(g => add(svg, { d: d(g.inside), class: 'f-accent' }));
      gs.forEach(g => g.outside.forEach(s => add(svg, { d: d(s), class: 'f-dash' })));
    },

    flows(svg) {
      const c = [60, 42], b = 13, N = 96;
      let start = [];
      for (let i = 0; i < N; i++) {
        const t = (i / N) * 2 * Math.PI;
        const r = b * (1 + 0.1 * Math.cos(3 * t));   // 振幅 0.1 < 1/8 なので凸
        start.push([c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]);
      }
      start = resample(start).pts;
      add(svg, { d: d(start, true), class: 'f-accent' });
      // 内側：平均曲率流（面積が 0.6, 0.3, 0.1 倍になる時刻。崩壊時刻は 初期面積/2π）
      const T = area(start) / (2 * Math.PI);
      let prev = 0, ps = start;
      [0.4, 0.7, 0.9].forEach(f => {
        ps = mcf(ps, (f - prev) * T);
        prev = f;
        add(svg, { d: d(ps, true), class: 'f-main' });
      });
      // 外側：逆平均曲率流（長さが 1.5, 2.1, 2.8 倍になる時刻）
      let qs = start, ratio = 1;
      [1.5, 2.1, 2.8].forEach(m => {
        qs = imcf(qs, m / ratio);
        ratio = m;
        add(svg, { d: d(qs, true), class: 'f-dash' });
      });
    },

    surgery(svg) {
      // 上から下へ時間が進む：首が太い → 首がくびれる → 首を切り取ってふたをし、2つに分かれる
      const cx = 50, c = 15, R = 10.5;
      const profile = (cy, neck) => {   // 回転対称なダンベル形の断面（2つの球をなめらかにつなぐ）
        const top = [];
        for (let i = 0; i <= 100; i++) {
          const x = -(c + R) + (i / 100) * 2 * (c + R);
          const s = Math.sqrt(Math.max(0, R * R - (Math.abs(x) - c) ** 2));
          const r = Math.abs(x) < c ? Math.pow(s ** 4 + neck ** 4, 1 / 4) : s;
          top.push([cx + x, cy - r]);
        }
        return top.concat(top.slice().reverse().map(p => [p[0], 2 * cy - p[1]]));
      };
      const ball = (x0, cy, r) => {
        const pts = [];
        for (let i = 0; i <= 72; i++) {
          const t = (i / 72) * 2 * Math.PI;
          pts.push([x0 + r * Math.cos(t), cy + r * Math.sin(t)]);
        }
        return pts;
      };
      add(svg, { d: d(profile(13, 6.5), true), class: 'f-sub' });
      add(svg, { d: 'M88 22L88 31', class: 'f-dash' });
      add(svg, { d: arrowHead([88, 22], [88, 31], 2.6), class: 'f-sub' });
      add(svg, { d: d(profile(42, 2.2), true), class: 'f-main' });
      add(svg, { d: 'M88 51L88 60', class: 'f-dash' });
      add(svg, { d: arrowHead([88, 51], [88, 60], 2.6), class: 'f-sub' });
      add(svg, { d: d(ball(cx - c - 2.5, 71, R - 0.5), true), class: 'f-accent' });
      add(svg, { d: d(ball(cx + c + 2.5, 71, R - 0.5), true), class: 'f-accent' });
    },
  };

  // ---------- 描いて、画面に入ったら線を引く ----------
  function draw(el) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    el.appendChild(svg);
    FIGS[el.dataset.fig](svg);
    if (reduceMotion) return;
    // 実線は「線を引く」（stroke-dashoffset）、破線は破線の模様を保つため薄く現す
    [...svg.querySelectorAll('path')].forEach((p, i) => {
      p.style.setProperty('--i', i);
      if (p.classList.contains('f-dash') || p.classList.contains('f-axis')) {
        p.classList.add('fade');
      } else {
        const len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        p.classList.add('stroke');
      }
    });
  }

  const figs = document.querySelectorAll('.theme-fig[data-fig]');
  figs.forEach(el => { if (FIGS[el.dataset.fig]) draw(el); });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    figs.forEach(el => el.classList.add('drawn'));
    return;
  }
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('drawn');
    io.unobserve(e.target);
  }), { threshold: 0.5 });
  figs.forEach(el => io.observe(el));
})();
