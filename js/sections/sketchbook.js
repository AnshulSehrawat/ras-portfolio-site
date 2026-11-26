// THE SKETCHBOOK (R = rough). one giant loose spread you wander across.
// scroll: the camera follows the green thread sewn across the page. drag: roam anywhere (with inertia).
// pieces are pasted, taped, pinned. series are flip-books you flick, pairs are flaps you lift.
// doodles draw themselves and boil at 8 fps. pick a crayon and draw on the page; "rip out page" clears it.
import { h as h0, svg, rng, clamp, lerp } from '../core/util.js';

// util's h() assigns style objects directly; custom properties (--x) need setProperty
function h(tag, attrs = {}, ...kids) {
  const vars = [];
  if (attrs && attrs.style && typeof attrs.style === 'object') {
    const st = { ...attrs.style };
    for (const k of Object.keys(st)) if (k.startsWith('--')) { vars.push([k, st[k]]); delete st[k]; }
    attrs = { ...attrs, style: st };
  }
  const el = h0(tag, attrs, ...kids);
  for (const [k, v] of vars) el.style.setProperty(k, v);
  return el;
}
import { book } from '../content/sketchbook.js';

const COL = {
  ink: '#15120F', red: '#E5331F', green: '#1E9C5B', blue: '#2443F0', yellow: '#FFD43B',
  wax: '#F2B300', brick: '#C94A35', paper: '#F2EDE1', white: '#FFFFFF',
};
const CRAYONS = [
  { k: 'green', c: '#1E9C5B', label: 'green' },
  { k: 'red', c: '#E5331F', label: 'red' },
  { k: 'blue', c: '#2443F0', label: 'blue' },
  { k: 'yellow', c: '#F2B300', label: 'yellow' },
  { k: 'ink', c: '#15120F', label: 'black' },
];
const STORE = 'ras.sketchbook.v1';
const TILE = 512;

/* ------------------------------------------------------------------ crayon engine */
// paper tooth: two octaves of value noise in page space. wax only sticks to the peaks.
const LAT = new Float32Array(128 * 128);
{ const r = rng(911); for (let i = 0; i < LAT.length; i++) LAT[i] = r(); }
const lat = (i, j) => LAT[((j & 127) << 7) | (i & 127)];
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = lat(xi, yi), b = lat(xi + 1, yi), c = lat(xi, yi + 1), d = lat(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const grain = (x, y) => 0.58 * vnoise(x * 0.7, y * 0.7) + 0.42 * vnoise(x * 0.09 + 17.3, y * 0.21 + 5.1);

// one waxy segment: lots of tiny dabs inside radius r, skipped where the tooth is low
function crayonSeg(put, x0, y0, x1, y1, r, rand, thr = 0.36, dens = 1.15) {
  const d = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(d / 1.3));
  const n = Math.max(3, Math.ceil(r * 1.7 * dens));
  for (let s = 0; s < steps; s++) {
    const t = s / steps, cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
    for (let k = 0; k < n; k++) {
      const a = rand() * 6.2832, e = Math.sqrt(rand()), px = cx + Math.cos(a) * e * r, py = cy + Math.sin(a) * e * r;
      if (grain(px, py) < thr + e * e * 0.3 + rand() * 0.1) continue;
      put(px, py, 0.32 + rand() * 0.6);
    }
  }
}

// scribble generators for the crayon marks baked into the page
function scribble(kind, w, h, rand) {
  const lines = [];
  if (kind === 'zig') { // tall loose vertical loops, like a crayon field
    for (let row = 0; row < Math.max(1, Math.round(h / 300)); row++) {
      const pts = []; const y0 = row * (h / Math.max(1, Math.round(h / 300)));
      const hh = h / Math.max(1, Math.round(h / 300));
      for (let x = 10; x < w - 10; x += 9 + rand() * 7) {
        pts.push([x + rand() * 4, y0 + 8 + rand() * 18], [x + 4 + rand() * 6, y0 + hh - 10 - rand() * 22]);
      }
      lines.push(pts);
    }
  } else if (kind === 'blob' || kind === 'scrub') { // back-and-forth fill of a wobbly ellipse
    const pts = []; const rows = Math.round(h / (kind === 'blob' ? 11 : 15));
    for (let i = 0; i <= rows; i++) {
      const y = (i / rows) * h; const k = 1 - Math.pow((y - h / 2) / (h / 2), 2);
      const half = (w / 2) * Math.sqrt(Math.max(0, k)) * (0.85 + rand() * 0.2);
      const a = w / 2 - half + rand() * 14, b = w / 2 + half - rand() * 14;
      if (i % 2) pts.push([a, y + rand() * 6], [b, y + rand() * 6]); else pts.push([b, y + rand() * 6], [a, y + rand() * 6]);
    }
    lines.push(pts);
  } else if (kind === 'hatch') { // ballpoint-ish diagonal hatching in patches
    for (let i = 0; i < 70; i++) {
      const x = rand() * w * 0.9, y = rand() * h * 0.9, L = 40 + rand() * 90;
      lines.push([[x, y + L * 0.6], [x + L * 0.8, y]]);
    }
  } else if (kind === 'loop') { // a long loopy coil
    const pts = []; const turns = Math.round(w / 34);
    for (let i = 0; i <= turns * 18; i++) {
      const t = i / 18, a = t * 6.2832;
      pts.push([20 + (t / turns) * (w - 60) + Math.cos(a) * 34, h / 2 + Math.sin(a) * (h * 0.36) + Math.sin(t * 0.7) * 16]);
    }
    lines.push(pts);
  }
  return lines;
}

// paints a crayon mark into its own small canvas, returns an <img> (canvas memory gets freed)
function bakeCrayon(w, h, color, kind, seed, r = 7) {
  const dpr = 1.25;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr);
  const c = cv.getContext('2d'); c.scale(dpr, dpr); c.fillStyle = color;
  const rand = rng(seed);
  const put = (x, y, a) => { c.globalAlpha = a; c.fillRect(x - 0.8, y - 0.8, 1.7, 1.7); };
  const lines = scribble(kind, w, h, rand);
  const rr = kind === 'hatch' ? 1.6 : r;
  for (const pts of lines) for (let i = 1; i < pts.length; i++) crayonSeg(put, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], rr, rand, kind === 'hatch' ? 0.3 : 0.4, kind === 'hatch' ? 1.6 : 1);
  return new Promise((res) => cv.toBlob((b) => res(URL.createObjectURL(b)), 'image/webp', 0.85));
}

/* ------------------------------------------------------------------ doodles (boiling svg lines) */
function pts(fn, n) { const a = []; for (let i = 0; i <= n; i++) a.push(fn(i / n)); return a; }
const DOOD = {
  star: (s) => { const p = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? s * 0.42 : s; p.push([Math.cos(a) * r, Math.sin(a) * r]); } p.push([p[1][0] * 0.9, p[1][1] * 0.9]); return [p]; },
  burst: (s) => { const L = []; for (let i = 0; i < 11; i++) { const a = (i / 11) * 6.2832; L.push([[Math.cos(a) * s * 0.4, Math.sin(a) * s * 0.4], [Math.cos(a) * s * (0.85 + (i % 2) * 0.2), Math.sin(a) * s * (0.85 + (i % 2) * 0.2)]]); } return L; },
  circle: (s, o = {}) => { const rx = s * (o.ax || 1), ry = s * (o.ay || 0.62); return [pts((t) => { const a = -0.4 + t * 6.2832 * 1.12; const k = 1 + 0.06 * Math.sin(t * 9); return [Math.cos(a) * rx * k, Math.sin(a) * ry * k + t * 8]; }, 48)]; },
  spiral: (s) => [pts((t) => { const a = t * 6.2832 * 3.2; return [Math.cos(a) * s * t, Math.sin(a) * s * t]; }, 70)],
  zig: (s) => [pts((t) => [t * s * 2 - s, (Math.round(t * 14) % 2 ? -1 : 1) * s * 0.1], 14)],
  squig: (s) => [pts((t) => [t * s * 2 - s, Math.sin(t * 6.2832 * 3) * s * 0.14 * (0.4 + t)], 40)],
  heart: (s) => [pts((t) => { const a = t * 6.2832; return [16 * Math.pow(Math.sin(a), 3) * s / 17, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * s / 17]; }, 40)],
  sun: (s) => { const L = [pts((t) => [Math.cos(t * 6.4) * s * 0.42, Math.sin(t * 6.4) * s * 0.42], 24)]; for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.2832 + 0.2; L.push([[Math.cos(a) * s * 0.6, Math.sin(a) * s * 0.6], [Math.cos(a) * s, Math.sin(a) * s]]); } return L; },
  sparkle: (s) => [[[0, -s], [s * 0.12, -s * 0.12], [s, 0], [s * 0.12, s * 0.12], [0, s], [-s * 0.12, s * 0.12], [-s, 0], [-s * 0.12, -s * 0.12], [0, -s]]],
  cat: (s) => [
    pts((t) => { const a = Math.PI * 0.05 + t * Math.PI * 1.9; return [Math.cos(a + Math.PI / 2) * s * 0.8 * -1, Math.sin(a + Math.PI / 2) * s * 0.62 + s * 0.12]; }, 30),
    [[-s * 0.72, -s * 0.15], [-s * 0.58, -s * 0.85], [-s * 0.18, -s * 0.48]], [[s * 0.18, -s * 0.48], [s * 0.58, -s * 0.85], [s * 0.72, -s * 0.15]],
    [[-s * 0.3, s * 0.05], [-s * 0.26, s * 0.12]], [[s * 0.3, s * 0.05], [s * 0.26, s * 0.12]],
    [[-s * 0.08, s * 0.3], [0, s * 0.36], [s * 0.08, s * 0.3]],
    [[-s * 0.5, s * 0.32], [-s * 1.05, s * 0.22]], [[-s * 0.5, s * 0.42], [-s * 1.0, s * 0.5]], [[s * 0.5, s * 0.32], [s * 1.05, s * 0.22]], [[s * 0.5, s * 0.42], [s * 1.0, s * 0.5]],
  ],
  x: (s) => [[[-s, -s], [s, s]], [[s, -s * 0.9], [-s * 0.9, s]]],
  check: (s) => [[[-s, 0], [-s * 0.3, s * 0.7], [s, -s * 0.9]]],
  bolt: (s) => [[[s * 0.2, -s], [-s * 0.5, s * 0.1], [0, s * 0.1], [-s * 0.25, s], [s * 0.55, -s * 0.15], [0, -s * 0.15], [s * 0.2, -s]]],
  crown: (s) => [[[-s, s * 0.4], [-s, -s * 0.5], [-s * 0.5, 0], [0, -s * 0.7], [s * 0.5, 0], [s, -s * 0.5], [s, s * 0.4], [-s, s * 0.4]]],
  flower: (s) => { const L = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.2832; L.push(pts((t) => { const b = a + (t - 0.5) * 1.1; const r = Math.sin(t * Math.PI) * s * 0.55 + s * 0.12; return [Math.cos(b) * r, Math.sin(b) * r - s * 0.45]; }, 12)); } L.push([[0, s * 0.1], [s * 0.06, s * 0.5], [-s * 0.04, s * 1.1]]); L.push(pts((t) => [s * 0.05 + t * s * 0.45, s * 0.75 - Math.sin(t * Math.PI) * s * 0.22], 8)); return L; },
  bubble: (s) => [pts((t) => { const a = t * 6.2832 * 1.02; return [Math.cos(a) * s, Math.sin(a) * s * 0.55]; }, 36), [[-s * 0.3, s * 0.5], [-s * 0.55, s * 0.95], [-s * 0.05, s * 0.53]]],
  hatch: (s) => { const L = []; for (let i = 0; i < 7; i++) L.push([[-s + i * s * 0.3, s * 0.5], [-s * 0.6 + i * s * 0.3, -s * 0.5]]); return L; },
  arrow: (s, o) => { // o.to = [dx, dy] relative, o.bend
    const [dx, dy] = o.to; const bend = o.bend ?? 0.25; const mx = dx / 2 - dy * bend, my = dy / 2 + dx * bend;
    const curve = pts((t) => [2 * (1 - t) * t * mx + t * t * dx, 2 * (1 - t) * t * my + t * t * dy], 22);
    const a = Math.atan2(dy - my, dx - mx), hl = Math.max(16, Math.hypot(dx, dy) * 0.12);
    return [curve, [[dx + Math.cos(a + 2.6) * hl, dy + Math.sin(a + 2.6) * hl], [dx, dy], [dx + Math.cos(a - 2.6) * hl, dy + Math.sin(a - 2.6) * hl]]];
  },
};

// [type, x, y, size, colour, rotation, opts]
const DOODLES = [
  ['sparkle', 960, 140, 34, 'red', 0],
  ['arrow', 600, 1210, 0, 'blue', 0, { to: [-150, 120], bend: -0.3 }],
  ['circle', 2110, 205, 120, 'green', -4, { ax: 1, ay: 0.5 }],
  ['arrow', 1700, 800, 0, 'ink', 0, { to: [70, -110], bend: 0.3 }],
  ['cat', 2440, 380, 46, 'ink', -8],
  ['sun', 3500, 130, 46, 'red', 0],
  ['star', 3230, 980, 40, 'yellow', 12],
  ['star', 3290, 1030, 22, 'red', -6],
  ['burst', 3740, 1170, 60, 'red', 0],
  ['zig', 2930, 1290, 140, 'blue', 2],
  ['crown', 2920, 1350, 42, 'yellow', -10],
  ['x', 4040, 1060, 26, 'red', 0],
  ['hatch', 4930, 860, 50, 'blue', 0],
  ['spiral', 4920, 1560, 60, 'blue', 0],
  ['arrow', 4600, 1230, 0, 'blue', 0, { to: [-150, 70], bend: -0.35 }],
  ['check', 3260, 2290, 28, 'green', 0],
  ['bolt', 3540, 1860, 44, 'yellow', 10],
  ['heart', 2050, 1820, 34, 'red', -10],
  ['squig', 1440, 1400, 120, 'green', -3],
  ['flower', 2120, 2700, 64, 'red', 6],
  ['flower', 2240, 2770, 48, 'blue', -8],
  ['bubble', 1180, 1990, 70, 'ink', 0],
  ['arrow', 1330, 3170, 0, 'green', 0, { to: [-230, 90], bend: -0.3 }],
  ['sparkle', 620, 2960, 30, 'green', 0],
  ['circle', 410, 2160, 300, 'red', 3, { ax: 1, ay: 0.7 }],
  ['star', 170, 1880, 26, 'blue', 0],
  ['spiral', 1120, 1500, 40, 'red', 0],
  ['arrow', 3060, 2560, 0, 'green', 0, { to: [60, 110], bend: -0.4 }],
  ['sun', 4880, 2280, 50, 'yellow', 0],
  ['squig', 4300, 3200, 200, 'red', -2],
  ['burst', 700, 120, 44, 'yellow', 0],
  ['sparkle', 1890, 2700, 26, 'green', 0],
  ['x', 2500, 1640, 20, 'ink', 0],
];

function smoothD(p) {
  if (p.length < 3) return `M${p.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L')}`;
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
    d += `Q${p[i][0].toFixed(1)} ${p[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const L = p[p.length - 1]; return d + `L${L[0].toFixed(1)} ${L[1].toFixed(1)}`;
}

/* ------------------------------------------------------------------ path (catmull-rom, dwells at each stop) */
function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}
function pathAt(P, prog) {
  const n = P.length - 1; const f = clamp(prog, 0, 1) * n; const i = Math.min(n - 1, Math.floor(f)); let t = f - i;
  t = t - Math.sin(t * 6.2832) / 6.2832 * 0.85; // linger at stops, travel between
  const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(n, i + 2)];
  return [0, 1, 2].map((k) => (k === 2 ? lerp(b[k], c[k], t) : catmull(a[k], b[k], c[k], d[k], t)));
}

/* ------------------------------------------------------------------ mount */
export async function mount(el, ctx) {
  const { gsap, ScrollTrigger } = ctx;
  const R = rng(2026);
  const { W, H } = book;
  const reduced = ctx.reduced;
  const touch = ctx.isTouch;
  const art = Object.fromEntries(ctx.media.art.map((a) => [a.id, a]));
  const aspect = (id) => (art[id] ? art[id].h / art[id].w : 1);

  el.append(h('h2.sr', {}, 'the sketchbook. art, no brief, no grid.'));
  const stage = h('div.sk-stage', { 'aria-label': 'the sketchbook: a loose page of drawings and paintings. drag to move around.' });
  const world = h('div.sk-world', { style: { width: W + 'px', height: H + 'px' } });
  const pageL = h('div.sk-page.sk-page--l'), pageR = h('div.sk-page.sk-page--r');
  const under = h('div.sk-under');          // crayon fields + thread live under the pieces
  const layer = h('div.sk-layer');          // pieces, notes, words, stickers
  const ink = h('div.sk-ink');              // the viewer's crayon tiles
  world.append(pageL, pageR, under, layer, ink);
  stage.append(world);
  el.append(stage);

  /* ---- binding: a saddle stitch down the fold, in the thread colour ---- */
  const gx = W / 2;
  const bind = svg('svg', { class: 'sk-bind', viewBox: `0 0 80 ${H}`, width: 80, height: H, style: `left:${gx - 40}px` });
  let stitchD = '', holes = [];
  for (let y = 70, i = 0; y < H - 60; y += 96, i++) {
    holes.push(svg('circle', { cx: 40, cy: y, r: 3.2, class: 'sk-hole' }));
    if (i % 2 === 0) stitchD += `M${40 + (R() - 0.5) * 2} ${y} Q ${42 + (R() - .5) * 3} ${y + 48} ${40 + (R() - 0.5) * 2} ${y + 96} `;
  }
  bind.append(svg('path', { d: stitchD, class: 'sk-stitch-sh' }), svg('path', { d: stitchD, class: 'sk-stitch' }), ...holes,
    svg('path', { d: `M40 70 C 30 40, 70 30, 52 8 S 20 -10, 30 -30`, class: 'sk-stitch sk-tail' }),
    svg('path', { d: `M40 ${H - 74} C 60 ${H - 40}, 10 ${H - 30}, 34 ${H - 4}`, class: 'sk-stitch sk-tail' }));
  under.append(h('div.sk-fold', { style: { left: gx - 120 + 'px', height: H + 'px' } }), bind);

  /* ---- the thread the camera follows, sewn as you scroll ---- */
  const P = book.path.map((p) => p.slice());
  const threadPts = []; for (let i = 0; i <= 400; i++) { const q = pathAt(P.slice(0, -1), i / 400); threadPts.push([q[0] + Math.sin(i * 0.21) * 26, q[1] + 140 + Math.cos(i * 0.13) * 30]); }
  const threadSvg = svg('svg', { class: 'sk-threadsvg', viewBox: `0 0 ${W} ${H}`, width: W, height: H });
  const threadD = smoothD(threadPts);
  const threadSh = svg('path', { d: threadD, class: 'sk-thread-sh', pathLength: 1 });
  const thread = svg('path', { d: threadD, class: 'sk-thread', pathLength: 1 });
  threadSvg.append(threadSh, thread);
  const needle = h('div.sk-needle', { html: '<svg viewBox="0 0 74 14"><path d="M2 7 Q 30 1.5 66 4.2 Q 73 5 73 7 Q 73 9 66 9.8 Q 30 12.5 2 7 Z" fill="#d9d9d9" stroke="#15120F" stroke-width="1.2"/><ellipse cx="64" cy="7" rx="4.4" ry="1.3" fill="#15120F"/><path d="M8 6.2 Q 34 3.4 60 5" stroke="#fff" stroke-width="1" fill="none"/></svg>' });
  under.append(threadSvg, needle);
  let threadLen = 0; requestAnimationFrame(() => { try { threadLen = thread.getTotalLength(); } catch (e) { threadLen = 0; } });
  let needleP = -1;

  /* ---- a loose ruled sheet for the viewer ---- */
  { const g = book.guest;
    under.append(h('div.sk-guest', { style: { left: g.x + 'px', top: g.y + 'px', width: g.w + 'px', height: g.h + 'px', transform: `rotate(${g.r}deg)` } },
      h('i.sk-holes'), h('h3', {}, 'your turn.'),
      h('p', {}, touch ? 'tap a crayon down there, then draw on this sheet. or on my stuff. i\'ll pretend i drew it.' : 'grab a crayon from the box (bottom left) and draw. on this sheet, on my stuff, anywhere. i\'ll pretend i drew it.'))); }

  /* ---- crayon fields baked into the page ---- */
  book.crayon.forEach(([x, y, w, hh, c, kind], i) => {
    const im = h('img.sk-crayonfield', { alt: '', width: w, height: hh, style: { left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px' } });
    under.append(im);
    const go = () => bakeCrayon(w, hh, COL[c === 'yellow' ? 'wax' : c] || c, kind, 50 + i * 13, kind === 'zig' ? 6 : 8).then((u) => { im.src = u; });
    (window.requestIdleCallback || setTimeout)(go);
  });

  // flat dot stickers + coloured scraps (density, like a collage page)
  const dots = [[1560, 160, 70, 'green'], [2590, 1170, 46, 'red'], [3990, 130, 56, 'yellow'], [1210, 1430, 40, 'blue'], [4980, 2140, 64, 'green'], [720, 2700, 50, 'yellow'], [3460, 2330, 44, 'red'], [100, 2780, 60, 'blue'], [2700, 3150, 54, 'green']];
  dots.forEach(([x, y, s, c]) => layer.append(h('i.sk-dot', { style: { left: x + 'px', top: y + 'px', width: s + 'px', height: s * (0.92 + R() * 0.12) + 'px', background: COL[c] } })));

  /* ---- pieces ---- */
  const gallery = []; // every single piece, in order, for the lightbox
  const objs = [];    // things with a world box (lazy load, visibility)
  const flips = [];
  const TAPES = ['y', 'g', 'b', 'w', 'r'];
  const BACKS = ['green', 'yellow', 'brick', 'blue', 'ink', 'paper'];

  function mountDeco(fig, m, w, hh, r) {
    if (m === 'tape') {
      const two = r() > 0.4;
      const t1 = h(`i.sk-tape.t-${TAPES[Math.floor(r() * TAPES.length)]}`, { style: { left: (two ? -26 : w / 2 - 50) + 'px', top: '-14px', transform: `rotate(${two ? -38 + r() * 10 : -4 + r() * 8}deg)` } });
      fig.append(t1);
      if (two) fig.append(h(`i.sk-tape.t-${TAPES[Math.floor(r() * TAPES.length)]}`, { style: { left: w - 70 + 'px', top: hh - 10 + 'px', transform: `rotate(${-40 + r() * 12}deg)` } }));
    } else if (m === 'corners') {
      ['tl', 'tr', 'bl', 'br'].forEach((k) => fig.append(h(`i.sk-corner.c-${k}`)));
    } else if (m === 'clip') {
      fig.append(h('i.sk-clip', { html: '<svg viewBox="0 0 26 70"><path d="M8 52 V12 a6 6 0 0 1 12 0 V58 a9 9 0 0 1 -18 0 V18" fill="none" stroke="#8d8f93" stroke-width="2.6" stroke-linecap="round"/><path d="M8 52 V12 a6 6 0 0 1 12 0 V58 a9 9 0 0 1 -18 0 V18" fill="none" stroke="#e9eaec" stroke-width="1" stroke-linecap="round" transform="translate(-.6 -.6)"/></svg>', style: { left: 24 + r() * 40 + 'px' } }));
    } else if (m === 'pin') {
      fig.append(h('i.sk-pin', { style: { left: w / 2 - 11 + (r() - .5) * 30 + 'px', '--pin': ['#E5331F', '#1E9C5B', '#2443F0', '#FFD43B'][Math.floor(r() * 4)] } }));
    } else if (m === 'staple') {
      fig.append(h('i.sk-staple', { style: { left: w * 0.2 + 'px', transform: `rotate(${-8 + r() * 6}deg)` } }), h('i.sk-staple', { style: { left: w * 0.7 + 'px', transform: `rotate(${4 + r() * 6}deg)` } }));
    }
  }

  function tornPoly(r, n = 22, d = 2.2) {
    const p = [];
    for (let i = 0; i <= n; i++) p.push(`${(i / n) * 100}% ${r() * d}%`);
    for (let i = 0; i <= n; i++) p.push(`${100 - r() * d * 0.6}% ${(i / n) * 100}%`);
    for (let i = n; i >= 0; i--) p.push(`${(i / n) * 100}% ${100 - r() * d}%`);
    for (let i = n; i >= 0; i--) p.push(`${r() * d * 0.6}% ${(i / n) * 100}%`);
    return `polygon(${p.join(',')})`;
  }

  const imgEl = (id, w, cls = '') => {
    const a = art[id] || { w: 1, h: 1 };
    return h(`img${cls}`, { alt: '', 'data-src': ctx.img(id, 's'), width: a.w, height: a.h, decoding: 'async', loading: 'lazy', draggable: 'false' });
  };

  book.items.forEach((it, idx) => {
    const r = rng(100 + idx * 7);
    const asp = aspect(it.ids[0]);
    const framed = it.m === 'tape' || it.m === 'pin' || it.m === 'clip' || it.m === 'staple';
    const pad = framed && it.k !== 'flap' ? Math.round(it.w * 0.035) : 0;
    const ih = Math.round(it.w * asp); const w = it.w + pad * 2, hh = ih + pad * 2;
    const fig = h(`figure.sk-it.sk-${it.k}.m-${it.m || 'flap'}`, {
      style: { left: it.x + 'px', top: it.y + 'px', width: w + 'px', height: hh + 'px', '--r': it.r + 'deg', zIndex: 10 + Math.round(r() * 20) },
      'data-hot': '',
    });
    // coloured scrap behind some pieces
    if (r() < 0.38 && it.k !== 'flap') {
      const c = BACKS[Math.floor(r() * BACKS.length)];
      fig.append(h('i.sk-back', { style: { background: c === 'paper' ? 'var(--paper-2)' : COL[c], clipPath: tornPoly(r, 16, 3), transform: `translate(${(r() - .5) * 60}px, ${(r() - .3) * 50}px) rotate(${(r() - .5) * 12}deg) scale(1.08)` } }));
    }
    const lift = h('div.sk-lift');
    const paper = h('div.sk-paper', { style: { padding: pad + 'px', '--pad': pad + 'px' } });
    if (it.m === 'torn') paper.style.clipPath = tornPoly(r);
    lift.append(paper);
    fig.append(lift);
    const caption = it.cap;

    if (it.k === 'piece') {
      const im = imgEl(it.ids[0], it.w);
      paper.append(im);
      const gi = gallery.push({ src: ctx.img(it.ids[0]), caption }) - 1;
      fig.addEventListener('click', () => { if (!moved) ctx.lightbox.open(gallery, gi); });
      fig.setAttribute('role', 'button'); fig.setAttribute('aria-label', caption); fig.tabIndex = 0;
      fig.addEventListener('keydown', (e) => { if (e.key === 'Enter') ctx.lightbox.open(gallery, gi); });
    } else if (it.k === 'flip') {
      const frames = it.ids.map((id, i) => { const im = imgEl(id, it.w, i ? '.sk-fr' : '.sk-fr.is-on'); paper.append(im); return im; });
      fig.classList.add('has-stack');
      const count = h('span.sk-count', {}, `1/${frames.length}`);
      const ear = h('button.sk-ear', { 'aria-label': 'flick to the next one' }, h('span', {}, 'flick'), count);
      lift.append(ear);
      const F = { fig, frames, i: 0, count, hover: false, tick: 0, ids: it.ids };
      F.set = (i) => { F.i = (i + frames.length) % frames.length; frames.forEach((f, k) => f.classList.toggle('is-on', k === F.i)); count.textContent = `${F.i + 1}/${frames.length}`; };
      ear.addEventListener('click', (e) => { e.stopPropagation(); if (moved) return; F.set(F.i + 1); fig.classList.remove('is-flick'); void fig.offsetWidth; fig.classList.add('is-flick'); });
      if (!touch) {
        paper.addEventListener('pointerenter', () => { F.hover = true; });
        paper.addEventListener('pointerleave', () => { F.hover = false; });
        paper.addEventListener('pointermove', (e) => {
          if (drawing || panning) return;
          const b = paper.getBoundingClientRect(); const k = Math.floor(clamp((e.clientX - b.left) / b.width, 0, 0.999) * frames.length);
          if (k !== F.i) F.set(k);
        });
      }
      paper.addEventListener('click', () => { if (!moved) ctx.lightbox.open(it.ids.map((id, k) => ({ src: ctx.img(id), caption: `${caption} (${k + 1}/${it.ids.length})` })), F.i); });
      flips.push(F);
    } else if (it.k === 'flap') {
      const [a, b] = it.ids;
      const under2 = imgEl(b, it.w, '.sk-flap-under');
      const top = h('div.sk-flap-top', {}, imgEl(a, it.w));
      paper.append(under2, top);
      lift.append(h(`i.sk-tape.t-${TAPES[idx % TAPES.length]}.sk-flaptape`, { style: { left: w / 2 - 46 + 'px' } }));
      const list = [{ src: ctx.img(a), caption }, { src: ctx.img(b), caption }];
      if (touch) {
        fig.addEventListener('click', () => { if (moved) return; if (!fig.classList.contains('is-up')) fig.classList.add('is-up'); else ctx.lightbox.open(list, 1); });
      } else {
        fig.addEventListener('click', () => { if (!moved) ctx.lightbox.open(list, fig.classList.contains('is-up') ? 1 : 0); });
        fig.addEventListener('pointerenter', () => { if (!drawing && !panning) fig.classList.add('is-up'); });
        fig.addEventListener('pointerleave', () => fig.classList.remove('is-up'));
      }
    }
    mountDeco(fig, it.m, w, hh, r);
    layer.append(fig);
    objs.push({ el: fig, x: it.x, y: it.y, w, h: hh, imgs: [...fig.querySelectorAll('img[data-src]')] });
  });

  /* ---- handwriting ---- */
  book.notes.forEach((n) => {
    layer.append(h(`p.sk-note.f-${n.f}`, { style: { left: n.x + 'px', top: n.y + 'px', fontSize: n.s + 'px', color: COL[n.c], transform: `rotate(${n.r}deg)`, maxWidth: n.max ? n.max + 'px' : null } }, n.t));
  });

  /* ---- big words: every letter its own scrap, boils at 8 fps ---- */
  const boilers = []; // {el, x, y, w, h, kind}
  book.words.forEach((wd, wi) => {
    const r = rng(300 + wi);
    const multi = wd.multi ? ['red', 'green', 'blue', 'wax', 'brick'] : null;
    const box = h(`div.sk-word.f-${wd.f}`, { style: { left: wd.x + 'px', top: wd.y + 'px', fontSize: wd.s + 'px', color: COL[wd.c], transform: `rotate(${wd.r}deg)` }, 'aria-hidden': 'true' });
    const letters = [...wd.t].map((ch, i) => {
      const s = h('span', { style: multi ? { color: COL[multi[(i + wi) % multi.length]] } : {} }, ch === ' ' ? ' ' : ch);
      s.dataset.r = ((r() - 0.5) * 8).toFixed(1); s.dataset.y = ((r() - 0.5) * wd.s * 0.08).toFixed(1);
      s.style.transform = `translateY(${s.dataset.y}px) rotate(${s.dataset.r}deg)`;
      return s;
    });
    box.append(...letters);
    layer.append(box);
    boilers.push({ kind: 'word', letters, x: wd.x, y: wd.y, w: wd.s * wd.t.length * 0.62, h: wd.s * 1.2 });
  });

  // the giant crayon R you landed in through RA.S
  const bigR = h('div.sk-bigr', { 'aria-hidden': 'true' }, 'R');
  layer.append(bigR);
  bakeCrayon(560, 640, COL.green, 'zig', 7, 9).then((u) => bigR.style.setProperty('--wax', `url(${u})`));

  /* ---- doodles ---- */
  const doodles = DOODLES.map(([type, x, y, s, c, rot, o = {}], di) => {
    const strokes = DOOD[type](s, o);
    const rr = (rot * Math.PI) / 180, cs = Math.cos(rr), sn = Math.sin(rr);
    const rotd = strokes.map((st) => st.map(([px, py]) => [px * cs - py * sn, px * sn + py * cs]));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    rotd.flat().forEach(([px, py]) => { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); });
    const pad = 14, bw = x1 - x0 + pad * 2, bh = y1 - y0 + pad * 2;
    const r = rng(700 + di);
    const variants = [0, 1, 2].map(() => rotd.map((st) => smoothD(st.map(([px, py]) => [px - x0 + pad + (r() - .5) * 3.2, py - y0 + pad + (r() - .5) * 3.2]))));
    const sw = type === 'circle' || type === 'arrow' ? 5 : s > 50 ? 5 : 4;
    const svgEl = svg('svg', { class: 'sk-dd', width: bw, height: bh, viewBox: `0 0 ${bw} ${bh}`, style: `left:${x + x0 - pad}px;top:${y + y0 - pad}px` });
    const paths = variants[0].map((d) => svg('path', { d, stroke: COL[c === 'yellow' ? 'wax' : c], 'stroke-width': sw, pathLength: 1, class: 'sk-dpath' }));
    svgEl.append(...paths);
    layer.append(svgEl);
    return { kind: 'doodle', paths, variants, x: x + x0 - pad, y: y + y0 - pad, w: bw, h: bh, drawn: false, v: 0 };
  });
  boilers.push(...doodles);

  /* ---- stickers you can peel off and move ---- */
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { saved = {}; }
  const stickerPos = saved.st || {};
  const stickers = book.stickers.filter((s) => s.kind !== 'big-r').map((s, i) => {
    const pos = stickerPos[i] || [s.x, s.y];
    const el2 = h(`div.sk-sticker.k-${s.kind}.c-${s.c}`, { style: { left: pos[0] + 'px', top: pos[1] + 'px', '--r': ((rng(40 + i)() - 0.5) * 24).toFixed(1) + 'deg' }, 'data-hot': '', title: 'peel me' }, h('span', {}, s.t));
    el2.dataset.i = i;
    layer.append(el2);
    return el2;
  });

  /* ---- the viewer's crayon layer (tiles, only where you draw) ---- */
  const tiles = new Map();
  const tdpr = Math.min(1.5, devicePixelRatio || 1);
  function tileCtx(i, j) {
    const key = i + ',' + j; let t = tiles.get(key);
    if (!t) {
      const cv = h('canvas.sk-tile', { width: TILE * tdpr, height: TILE * tdpr, style: { left: i * TILE + 'px', top: j * TILE + 'px' } });
      ink.append(cv); const c = cv.getContext('2d'); c.scale(tdpr, tdpr);
      t = { cv, c }; tiles.set(key, t);
    }
    return t.c;
  }
  let curColor = '#1E9C5B';
  const putInk = (x, y, a) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = Math.floor(x / TILE), j = Math.floor(y / TILE); const c = tileCtx(i, j);
    c.fillStyle = curColor; c.globalAlpha = a; c.fillRect(x - i * TILE - 0.85, y - j * TILE - 0.85, 1.7, 1.7);
  };
  let strokes = Array.isArray(saved.ink) ? saved.ink : [];
  let saveT = 0;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => {
    try {
      let tot = 0; for (let k = strokes.length - 1; k >= 0; k--) { tot += strokes[k].p.length; if (tot > 60000) { strokes = strokes.slice(k + 1); break; } }
      localStorage.setItem(STORE, JSON.stringify({ ink: strokes, st: stickerPos }));
    } catch (e) { /* private mode: fine, the drawing just won't stay */ }
  }, 300); };

  /* ---- HUD: labels, crayon box, minimap ---- */
  const hud = h('div.sk-hud');
  const tl = h('p.sk-lbl.sk-lbl--tl', {}, h('b', {}, 'R'), ' — rough', h('br'), 'the sketchbook / art');
  const tr = h('p.sk-lbl.sk-lbl--tr', {}, 'pg. ∞', h('br'), 'no grid on this page');
  const coords = h('p.sk-lbl.sk-coords', {}, 'x 0000 · y 0000');
  const hint = h('p.sk-hint', {}, touch ? 'scroll to wander · swipe sideways to roam' : 'scroll to wander · drag to roam');

  let tool = 'hand';
  const toolBtns = [];
  const handBtn = h('button.sk-tool.sk-hand.is-on', { 'aria-label': 'move the page', 'aria-pressed': 'true', 'data-hot': '' },
    h('span', { html: '<svg viewBox="0 0 32 32"><path d="M10 17V8.5a2 2 0 0 1 4 0V15m0-8.5a2 2 0 0 1 4 0V15m0-6a2 2 0 0 1 4 0v7m0-3a2 2 0 0 1 4 0v6c0 5-3.5 9-8.5 9-3.6 0-5.5-1.6-7.5-4.5L6.4 19a2.1 2.1 0 0 1 3.6-2.2l1 1.6"/></svg>' }),
    h('em', {}, 'move'));
  toolBtns.push(handBtn);
  const crayonBtns = CRAYONS.map((c, i) => {
    const b = h('button.sk-tool.sk-crayon', { 'aria-label': `draw with the ${c.label} crayon`, 'aria-pressed': 'false', style: { '--c': c.c }, 'data-hot': '' },
      h('span', { html: `<svg viewBox="0 0 22 92"><path d="M5 22 L11 3 L17 22 Z" fill="var(--c)"/><path d="M8.5 11 L11 3 L13.5 11 Z" fill="rgba(0,0,0,.25)"/><rect x="4" y="22" width="14" height="66" rx="1.6" fill="var(--c)"/><rect x="4" y="34" width="14" height="38" fill="rgba(255,255,255,.88)"/><path d="M4 37h14M4 69h14" stroke="var(--c)" stroke-width="1.2"/><text x="11" y="54" font-size="6.4" text-anchor="middle" transform="rotate(-90 11 54)" fill="#15120F" font-family="monospace" font-weight="700">${c.label.toUpperCase()}</text></svg>` }));
    b.addEventListener('click', () => setTool(i));
    toolBtns.push(b);
    return b;
  });
  handBtn.addEventListener('click', () => setTool('hand'));
  const rip = h('button.sk-rip', { 'data-hot': '' }, h('span', {}, 'rip out page'));
  const box = h('div.sk-box', {}, h('p.sk-box-lbl', {}, 'crayons ↓ draw on anything'), h('div.sk-box-row', {}, handBtn, ...crayonBtns), rip);

  const mini = h('div.sk-mini', { 'aria-label': 'map of the page. click to go there.', 'data-hot': '' });
  const miniView = h('i.sk-mini-view');
  const mS = 168 / W;
  mini.style.width = W * mS + 'px'; mini.style.height = H * mS + 'px';
  book.items.forEach((it) => mini.append(h('i.sk-mini-it', { style: { left: it.x * mS + 'px', top: it.y * mS + 'px', width: it.w * mS + 'px', height: it.w * aspect(it.ids[0]) * mS + 'px' } })));
  mini.append(h('i.sk-mini-fold'), miniView);
  const miniWrap = h('div.sk-miniwrap', {}, h('p.sk-lbl', {}, 'you are here ↓'), mini, coords);

  const crayCursor = h('div.sk-craycur', { html: '<svg viewBox="0 0 22 92"><path d="M5 22 L11 3 L17 22 Z" fill="var(--c)"/><rect x="4" y="22" width="14" height="66" rx="1.6" fill="var(--c)"/><rect x="4" y="34" width="14" height="38" fill="rgba(255,255,255,.88)"/></svg>' });
  hud.append(tl, tr, hint, box, miniWrap, crayCursor);
  stage.append(hud);

  let drawing = false;
  function setTool(t) {
    tool = t; drawing = t !== 'hand';
    toolBtns.forEach((b, i) => { const on = (t === 'hand' && i === 0) || (t === i - 1); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
    stage.classList.toggle('is-drawing', drawing);
    if (drawing) { curColor = CRAYONS[t].c; crayCursor.style.setProperty('--c', curColor); }
    if (!drawing) crayCursor.style.opacity = 0;
  }

  rip.addEventListener('click', () => {
    if (!tiles.size) { rip.classList.remove('is-shake'); void rip.offsetWidth; rip.classList.add('is-shake'); return; }
    const t0 = [...tiles.values()];
    gsap.to(ink, {
      duration: reduced ? 0.01 : 0.85, ease: 'power2.in', y: 900, rotation: -7, opacity: 0, transformOrigin: '50% 0%',
      onComplete: () => { t0.forEach((t) => t.cv.remove()); tiles.clear(); gsap.set(ink, { clearProps: 'all' }); strokes = []; save(); },
    });
    rip.classList.add('is-ripped'); setTimeout(() => rip.classList.remove('is-ripped'), 900);
  });

  /* ---- camera ---- */
  let vw = 0, vh = 0, base = 1, sFit = 0.3;
  const cam = { x: P[0][0], y: P[0][1], s: 1 };
  let prog = 0, lastProg = 0, ox = 0, oy = 0, vx = 0, vy = 0;
  let panning = false, moved = false, dirty = true, idleT = 0;
  function measure() {
    vw = stage.clientWidth || innerWidth; vh = stage.clientHeight || innerHeight;
    base = clamp(Math.min(vw / 1440, vh / 820), 0.42, 1.15);
    if (vw < 760) base = clamp(vw / 900, 0.38, 0.6);
    sFit = Math.min(vw / W, vh / H) * 0.93;
    // phones: the last stop pulls back to the spine instead of a postage stamp of the whole book
    const sEnd = vw < 760 ? Math.max(sFit, (vh / H) * 0.56) : sFit;
    P[P.length - 1][2] = sEnd / base;
    book.path.forEach((q, i) => { P[i][0] = vw < 760 && book.mobileX && book.mobileX[i] != null ? book.mobileX[i] : q[0]; });
    dirty = true;
  }
  measure();
  const target = () => {
    const q = pathAt(P, prog);
    const s = Math.max(sFit, q[2] * base);
    if (prog > 0.03) hint.classList.add('is-gone');
    return { x: q[0] + ox, y: q[1] + oy, s };
  };
  function clampCam(c) {
    const hw = vw / (2 * c.s), hh2 = vh / (2 * c.s);
    c.x = W > hw * 2 ? clamp(c.x, hw, W - hw) : W / 2;
    c.y = H > hh2 * 2 ? clamp(c.y, hh2, H - hh2) : H / 2;
    return c;
  }
  { const t = clampCam(target()); Object.assign(cam, t); }

  function apply() {
    world.style.transform = `translate3d(${(vw / 2 - cam.x * cam.s).toFixed(2)}px, ${(vh / 2 - cam.y * cam.s).toFixed(2)}px, 0) scale(${cam.s.toFixed(4)})`;
    const vwW = vw / cam.s, vhW = vh / cam.s;
    miniView.style.transform = `translate(${((cam.x - vwW / 2) * mS).toFixed(1)}px, ${((cam.y - vhW / 2) * mS).toFixed(1)}px)`;
    miniView.style.width = vwW * mS + 'px'; miniView.style.height = vhW * mS + 'px';
    coords.textContent = `x ${String(Math.round(cam.x)).padStart(4, '0')} · y ${String(Math.round(cam.y)).padStart(4, '0')} · ${Math.round(cam.s * 100)}%`;
  }

  function tick() {
    if (!vw) return;
    if (Math.abs(prog - lastProg) > 0.0002) { ox *= 0.955; oy *= 0.955; lastProg = prog; }
    if (!panning) { ox += vx; oy += vy; vx *= 0.92; vy *= 0.92; if (Math.abs(vx) < 0.01) vx = 0; if (Math.abs(vy) < 0.01) vy = 0; }
    const t = target(); const c = clampCam({ ...t });
    // don't let the drag offset run away past the page edge
    ox += c.x - t.x; oy += c.y - t.y;
    const k = panning ? 0.5 : 0.16;
    const nx = lerp(cam.x, c.x, k), ny = lerp(cam.y, c.y, k), ns = lerp(cam.s, c.s, 0.14);
    if (Math.abs(nx - cam.x) + Math.abs(ny - cam.y) + Math.abs(ns - cam.s) * 400 > 0.02 || dirty) {
      cam.x = nx; cam.y = ny; cam.s = ns; dirty = false;
      apply();
      world.classList.add('is-moving'); clearTimeout(idleT); idleT = setTimeout(() => world.classList.remove('is-moving'), 220);
    }
    const p = clamp(prog * 1.02, 0, 1);
    if (Math.abs(p - needleP) > 0.0004) {
      needleP = p;
      thread.style.strokeDashoffset = (1 - p).toFixed(4);
      threadSh.style.strokeDashoffset = (1 - p).toFixed(4);
      if (threadLen) {
        const L = Math.max(2, p * threadLen), a = thread.getPointAtLength(L), b = thread.getPointAtLength(Math.max(0, L - 30));
        // the needle leads the thread: it points along the direction of travel
        needle.style.transform = `translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px) rotate(${(Math.atan2(a.y - b.y, a.x - b.x) * 57.3 + 180).toFixed(1)}deg)`;
        needle.style.opacity = p > 0.003 && p < 0.995 ? 1 : 0;
      }
    }
  }

  /* ---- pointer: pan, draw, peel ---- */
  const toWorld = (cx, cy) => { const b = stage.getBoundingClientRect(); return [(cx - b.left - vw / 2) / cam.s + cam.x, (cy - b.top - vh / 2) / cam.s + cam.y]; };
  let down = null, stroke = null, sticker = null, lastPt = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || hud.contains(e.target)) return;
    moved = false;
    const st = e.target.closest('.sk-sticker');
    if (st && !drawing) {
      sticker = { el: st, i: +st.dataset.i, sx: e.clientX, sy: e.clientY, x0: parseFloat(st.style.left), y0: parseFloat(st.style.top) };
      st.classList.add('is-peeled'); st.setPointerCapture(e.pointerId); e.preventDefault(); return;
    }
    if (drawing) {
      const [x, y] = toWorld(e.clientX, e.clientY);
      const ti = CRAYONS.findIndex((c) => c.c === curColor);
      stroke = { c: ti, w: Math.round(clamp(6.5 / cam.s, 4, 26) * 10) / 10, seed: Math.floor(Math.random() * 1e6), p: [Math.round(x), Math.round(y)] };
      strokes.push(stroke); lastPt = [x, y];
      stage.setPointerCapture(e.pointerId); e.preventDefault();
      crayonSeg(putInk, x, y, x + 0.5, y + 0.5, stroke.w, rng(stroke.seed));
      return;
    }
    down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, lx: e.clientX, ly: e.clientY };
    vx = vy = 0;
  });
  stage.addEventListener('pointermove', (e) => {
    if (drawing && e.pointerType === 'mouse' && !touch) {
      const b = stage.getBoundingClientRect();
      crayCursor.style.opacity = 1; crayCursor.style.transform = `translate(${e.clientX - b.left}px, ${e.clientY - b.top}px) rotate(28deg)`;
    }
    if (sticker) {
      const dx = (e.clientX - sticker.sx) / cam.s, dy = (e.clientY - sticker.sy) / cam.s;
      sticker.el.style.left = sticker.x0 + dx + 'px'; sticker.el.style.top = sticker.y0 + dy + 'px'; moved = true; return;
    }
    if (stroke) {
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of evs.length ? evs : [e]) {
        const [x, y] = toWorld(ev.clientX, ev.clientY);
        if (Math.hypot(x - lastPt[0], y - lastPt[1]) < 1.5) continue;
        curColor = CRAYONS[stroke.c].c;
        const n = stroke.p.length / 2;
        stroke.p.push(Math.round(x), Math.round(y));
        crayonSeg(putInk, stroke.p[2 * n - 2], stroke.p[2 * n - 1], stroke.p[2 * n], stroke.p[2 * n + 1], stroke.w, rng(stroke.seed + n));
        lastPt = [x, y];
      }
      return;
    }
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (!panning && Math.hypot(dx, dy) > 6) {
      panning = true; moved = true; stage.classList.add('is-panning');
      try { stage.setPointerCapture(down.id); } catch (er) { /* fine */ }
      hint.classList.add('is-gone');
    }
    if (panning) {
      const mx = (e.clientX - down.lx) / cam.s, my = (e.clientY - down.ly) / cam.s;
      ox -= mx; oy -= (touch ? 0 : my); // on touch, vertical belongs to the scroll
      vx = -mx * 0.9; vy = touch ? 0 : -my * 0.9;
      down.lx = e.clientX; down.ly = e.clientY;
    }
  });
  const end = () => {
    if (sticker) {
      sticker.el.classList.remove('is-peeled');
      stickerPos[sticker.i] = [Math.round(parseFloat(sticker.el.style.left)), Math.round(parseFloat(sticker.el.style.top))];
      sticker = null; save();
    }
    if (stroke) {
      // re-seed per segment so a reload draws it the same way
      stroke = null; save();
    }
    if (panning) { panning = false; stage.classList.remove('is-panning'); }
    down = null;
    setTimeout(() => { moved = false; }, 0);
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('pointerleave', () => { if (drawing) crayCursor.style.opacity = 0; });
  // stop clicks that ended a pan from opening the lightbox
  stage.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); } }, true);
  // sideways trackpad swipes pan the page
  stage.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2) { ox += e.deltaX / cam.s; e.preventDefault(); }
  }, { passive: false });
  // minimap: click or drag to go there
  const miniGo = (e) => {
    const b = mini.getBoundingClientRect();
    const x = clamp((e.clientX - b.left) / mS, 0, W), y = clamp((e.clientY - b.top) / mS, 0, H);
    const q = pathAt(P, prog); ox = x - q[0]; oy = y - q[1]; vx = vy = 0;
    hint.classList.add('is-gone');
  };
  let miniDown = false;
  mini.addEventListener('pointerdown', (e) => { miniDown = true; mini.setPointerCapture(e.pointerId); miniGo(e); e.stopPropagation(); });
  mini.addEventListener('pointermove', (e) => { if (miniDown) miniGo(e); });
  mini.addEventListener('pointerup', () => { miniDown = false; });

  // replay a saved stroke with the same per-segment seeds the live drawing used
  function replay(s) {
    curColor = CRAYONS[s.c]?.c || '#15120F';
    crayonSeg(putInk, s.p[0], s.p[1], s.p[0] + 0.5, s.p[1] + 0.5, s.w, rng(s.seed));
    for (let n = 1; n < s.p.length / 2; n++) crayonSeg(putInk, s.p[2 * n - 2], s.p[2 * n - 1], s.p[2 * n], s.p[2 * n + 1], s.w, rng(s.seed + n));
  }
  strokes = strokes.filter((s) => s && Array.isArray(s.p) && s.p.length >= 2);
  strokes.forEach(replay);

  /* ---- lazy images + visibility (in page space, with a margin) ---- */
  function viewRect(m = 0) {
    const hw = vw / (2 * cam.s), hh2 = vh / (2 * cam.s);
    return [cam.x - hw - m, cam.y - hh2 - m, cam.x + hw + m, cam.y + hh2 + m];
  }
  const near = (o, r) => o.x + o.w > r[0] && o.x < r[2] && o.y + o.h > r[1] && o.y < r[3];
  let live = false;
  function loadNear() {
    if (!live) return;
    const r = viewRect(700 / Math.max(cam.s, 0.3));
    for (const o of objs) {
      if (!o.imgs.length || !near(o, r)) continue;
      o.imgs.forEach((im) => { if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); } }); // core/imgload may have started it already
      o.imgs = [];
    }
  }

  /* ---- 8 fps: boil, draw-on, flick ---- */
  let boilN = 0;
  function boil() {
    if (!live) return;
    loadNear();
    const r = viewRect(60);
    boilN++;
    for (const b of boilers) {
      if (!near(b, r)) continue;
      if (b.kind === 'doodle') {
        if (!b.drawn) {
          b.drawn = true;
          b.paths.forEach((p, i) => gsap.fromTo(p, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: reduced ? 0.01 : 0.55, delay: i * 0.12, ease: 'power1.inOut' }));
        }
        if (reduced) continue;
        b.v = (b.v + 1) % 3;
        b.paths.forEach((p, i) => p.setAttribute('d', b.variants[b.v][i]));
      } else if (!reduced) {
        b.letters.forEach((s) => {
          const j = (Math.random() - 0.5);
          s.style.transform = `translate(${(j * 2.4).toFixed(1)}px, ${(+s.dataset.y + (Math.random() - .5) * 2.4).toFixed(1)}px) rotate(${(+s.dataset.r + j * 1.6).toFixed(1)}deg)`;
        });
      }
    }
    if (!reduced && boilN % 3 === 0) {
      for (const F of flips) if (!F.hover && near({ x: +F.fig.style.left.replace('px', ''), y: +F.fig.style.top.replace('px', ''), w: F.fig.offsetWidth, h: F.fig.offsetHeight }, r)) F.set(F.i + 1);
    }
  }

  /* ---- scroll: pin the stage, scroll walks the thread ---- */
  const pinLen = () => Math.round(vh * (vw < 760 ? 3 : 2.9));
  if (!reduced) {
    ScrollTrigger.create({
      trigger: el, start: 'top top', end: () => '+=' + pinLen(), pin: stage, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (self) => { prog = self.progress; },
    });
  }
  ScrollTrigger.create({
    trigger: el, start: 'top bottom+=60%', end: 'bottom top-=40%',
    onToggle: (self) => { live = self.isActive; if (live) { loadNear(); } },
  });

  gsap.ticker.add(tick);
  let boilAcc = 0, lastT = 0;
  gsap.ticker.add((t) => { if (t - lastT >= 0.125) { lastT = t; boil(); } });
  addEventListener('resize', () => { measure(); });

  // keyboard: arrows roam when the stage is focused
  stage.tabIndex = 0;
  stage.addEventListener('keydown', (e) => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!k || e.target !== stage) return;
    vx = k[0] * 26 / cam.s; vy = k[1] * 26 / cam.s; e.preventDefault();
  });

  // debug hooks for screenshots
  window.__sk = {
    go(p) { prog = p; ox = oy = 0; const t = clampCam(target()); Object.assign(cam, t); dirty = true; apply(); live = true; loadNear(); boil(); },
    at(x, y, s) { const q = pathAt(P, prog); ox = x - q[0]; oy = y - q[1]; if (s) { cam.s = s; } const t = clampCam(target()); Object.assign(cam, t); if (s) cam.s = s; dirty = true; apply(); live = true; loadNear(); boil(); },
    tool: setTool, cam, strokes: () => strokes.length,
    scribble(pts2, ci = 0) { setTool(ci); const s = { c: ci, w: 7, seed: 5, p: pts2.flat().map(Math.round) }; strokes.push(s); replay(s); },
  };
}
