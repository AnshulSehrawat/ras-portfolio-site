// THE DIGITAL DRAWER: you zoomed into the full stop of RA.S. it was a pixel. now you're inside a computer.
// a small, slightly wrong desktop: paper windows on a cobalt wallpaper, an 8px grid, a pixel cursor,
// a file browser, a player that plays frame sequences (and real mp4s once they exist), an info panel,
// a dock with a clock, a zip that explodes, a screensaver. the chrome moves in steps, on purpose.
// the only smooth thing in here is the footage itself: it drifts, breathes and crossfades inside a little display.
// you land from the zoom on big pixels: the desktop boots out of them.
import { h, clamp, rng } from '../core/util.js';
import { drawer } from '../content/digital.next.js';

const GRID = 8;
const INK = '#15120F', PAPER = '#F2EDE1', PAPER2 = '#E9E2D2', RED = '#E5331F', YEL = '#FFD43B', BLUE = '#2443F0';
const PAL = { o: INK, W: PAPER, w: '#FFFFFF', r: RED, y: YEL, Y: '#D9A916', b: BLUE, g: '#8E887C', k: 'rgba(21,18,15,.35)' };

// ---------- pixel art: rows of chars -> crisp svg ----------
function pix(rows, { scale = 1, pal = {}, cls = '' } = {}) {
  const P = { ...PAL, ...pal };
  const w = Math.max(...rows.map((r) => r.length)), ht = rows.length;
  let rects = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === '.' || c === ' ') { x++; continue; }
      let n = 1; while (row[x + n] === c) n++;
      rects += `<rect x="${x}" y="${y}" width="${n}" height="1.02" fill="${P[c] || c}"/>`;
      x += n;
    }
  });
  return `<svg class="${cls}" viewBox="0 0 ${w} ${ht}" width="${w * scale}" height="${ht * scale}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

const BM = {
  arrow: ['o...........', 'oo..........', 'o#o.........', 'o##o........', 'o###o.......', 'o####o......', 'o#####o.....', 'o######o....',
    'o#######o...', 'o########o..', 'o#####ooooo.', 'o##o##o.....', 'o#o.o##o....', 'oo..o##o....', 'o....o##o...', '.....o##o...',
    '......o##o..', '......o##o..', '.......oo...'],
  hand: ['.....oo.........', '....o##o........', '....o##o........', '....o##o........', '....o##ooo......', '....o##o##ooo...',
    '.oo.o##o##o##oo.', 'o##oo##o##o##o#o', 'o###o########o#o', '.o##o##########o', '..o############o', '..o###########o.',
    '...o##########o.', '...o#########o..', '....o########o..', '....o########o..'],
  folder: ['.ooooo..........', 'oYYYYYo.........', 'oYYYYYYoooooooo.', 'oYYYYYYYYYYYYYYo', 'oooooooooooooooo', 'oyyyyyyyyyyyyyyo',
    'oywwwwwwwwwwwwyo', 'oyyyyyyyyyyyyyyo', 'oyyyyyyyyyyyyyyo', 'oyyyyyyyyyyyyyyo', 'oyyyyyyyyyyyyyyo', 'oyyyyyyyyyyyyyyo', 'oooooooooooooooo'],
  film: ['oooooooooooooooo', 'oWoorrrrrrrrooWo', 'oooorrrrrrrroooo', 'oWoorrrrrrrrooWo', 'oooorrrrrrrroooo', 'oWooooooooooooWo',
    'ooooyyyyyyyyoooo', 'oWooyyyyyyyyooWo', 'ooooyyyyyyyyoooo', 'oWooyyyyyyyyooWo', 'oooooooooooooooo'],
  still: ['oooooooooooooooo', 'oWWWWWWWWWWWWWWo', 'oWbbbbbbbbbbbbWo', 'oWbbbbbbbbyybbWo', 'oWbbbbbbbbyybbWo', 'oWbbbbbobbbbbbWo',
    'oWbbbboooobbbbWo', 'oWbbbooooooboWWo', 'oWbooooooooooWWo', 'oWWWWWWWWWWWWWWo', 'oWWWWWWWWWWWWWWo', 'oooooooooooooooo'],
  zip: ['oooooooooooooo', 'orrrrrWorrrrro', 'orrrrroWrrrrro', 'orrrrrWorrrrro', 'orrrrroWrrrrro', 'orrrrooooorrro', 'orrrroWWWorrro',
    'orrrroWWWorrro', 'orrrroooooorro', 'orrrrrrrrrrrro', 'orrrrrrrrrrrro', 'oooooooooooooo'],
  trash: ['.....oooo.....', '.oooooooooooo.', 'oWWWWWWWWWWWWo', 'oooooooooooooo', '.oWWWoWWoWWWo.', '.oWWWoWWoWWWo.', '.oWWWoWWoWWWo.',
    '.oWWWoWWoWWWo.', '.oWWWoWWoWWWo.', '.oWWWoWWoWWWo.', '..oooooooooo..'],
  text: ['ooooooooo...', 'oWWWWWWWoo..', 'oWWWWWWWoWo.', 'oWooooWWoooo', 'oWWWWWWWWWWo', 'oWoooooooWWo', 'oWWWWWWWWWWo',
    'oWooooooooWo', 'oWWWWWWWWWWo', 'oWoooooWWWWo', 'oWWWWWWWWWWo', 'oooooooooooo'],
  info: ['oooooooooooo', 'oWWWWWWWWWWo', 'oWWWWrrWWWWo', 'oWWWWrrWWWWo', 'oWWWWWWWWWWo', 'oWWWrrrWWWWo', 'oWWWWrrWWWWo',
    'oWWWWrrWWWWo', 'oWWWWrrWWWWo', 'oWWWrrrrWWWo', 'oWWWWWWWWWWo', 'oooooooooooo'],
  player: ['oooooooooooooo', 'oWWWWWWWWWWWWo', 'oWbbbbbbbbbbWo', 'oWbbbybbbbbbWo', 'oWbbbyybbbbbWo', 'oWbbbyyybbbbWo', 'oWbbbyyyybbbWo',
    'oWbbbyyybbbbWo', 'oWbbbyybbbbbWo', 'oWbbbybbbbbbWo', 'oWbbbbbbbbbbWo', 'oWWWWWWWWWWWWo', 'oooooooooooooo', '.....oooo.....', '...oooooooo...'],
  play: ['o......', 'oo.....', 'ooo....', 'oooo...', 'ooooo..', 'oooo...', 'ooo....', 'oo.....', 'o......'],
  pause: ['oo.oo', 'oo.oo', 'oo.oo', 'oo.oo', 'oo.oo', 'oo.oo', 'oo.oo', 'oo.oo', 'oo.oo'],
  next: ['o....o', 'oo...o', 'ooo..o', 'oooo.o', 'oooooo', 'oooo.o', 'ooo..o', 'oo...o', 'o....o'],
  prev: ['o....o', 'o...oo', 'o..ooo', 'o.oooo', 'oooooo', 'o.oooo', 'o..ooo', 'o...oo', 'o....o'],
  ff: ['o...o...', 'oo..oo..', 'ooo.ooo.', 'oooooooo', 'ooooooooo', 'oooooooo', 'ooo.ooo.', 'oo..oo..', 'o...o...'],
  rew: ['...o...o', '..oo..oo', '.ooo.ooo', 'oooooooo', 'ooooooooo', 'oooooooo', '.ooo.ooo', '..oo..oo', '...o...o'],
};
// one-stroke hand digits in a 60x100 box
const DIGIT = {
  0: 'M30 6 C 8 6, 4 40, 6 55 C 8 80, 18 96, 32 95 C 50 94, 56 70, 55 48 C 54 22, 46 5, 28 7',
  1: 'M12 26 C 22 20, 30 12, 35 4 C 34 34, 35 66, 34 95 M 14 96 C 26 95, 40 95, 52 96',
  2: 'M8 28 C 10 8, 46 0, 50 24 C 54 44, 30 62, 8 94 C 24 92, 40 92, 55 93',
  3: 'M10 14 C 30 0, 54 8, 48 28 C 44 42, 30 46, 22 47 C 44 46, 58 60, 52 80 C 46 98, 18 100, 6 86',
  4: 'M40 96 C 40 64, 41 34, 40 4 C 28 26, 16 46, 6 66 C 22 66, 40 65, 56 66',
  5: 'M50 6 C 38 6, 26 6, 14 7 C 13 20, 11 32, 10 44 C 24 34, 52 38, 54 64 C 56 90, 30 100, 8 88',
  6: 'M46 8 C 24 4, 8 30, 8 62 C 8 88, 26 98, 40 92 C 58 84, 56 52, 34 50 C 20 49, 10 58, 8 66',
  7: 'M6 8 C 22 7, 38 7, 54 6 C 40 30, 28 60, 24 96 M 18 52 C 28 51, 38 51, 46 52',
  8: 'M30 48 C 8 40, 10 6, 30 6 C 52 6, 52 42, 30 48 C 6 54, 6 94, 30 95 C 56 96, 54 54, 30 48',
  9: 'M50 40 C 48 58, 12 60, 10 34 C 8 10, 46 2, 50 30 C 54 60, 46 86, 16 94',
};
const ICON = {
  folder: (s = 3) => pix(BM.folder, { scale: s }),
  film: (s = 3) => pix(BM.film, { scale: s }),
  still: (s = 3) => pix(BM.still, { scale: s }),
  zip: (s = 3) => pix(BM.zip, { scale: s }),
  trash: (s = 3) => pix(BM.trash, { scale: s }),
  text: (s = 3) => pix(BM.text, { scale: s }),
  info: (s = 3) => pix(BM.info, { scale: s }),
  player: (s = 3) => pix(BM.player, { scale: s }),
};
const kindIcon = (it, s) => (it.kind === 'still' ? ICON.still(s) : ICON.film(s));

// ---------- data helpers ----------
const pad = (n, l = 2) => String(n).padStart(l, '0');
const isUrl = (s) => typeof s === 'string' && /[/.]/.test(s);

const extOf = (it) => (it.kind === 'video' ? '.mp4' : it.kind === 'frames' ? '.seq' : '.png');

// a 160px tile of film grain, made once
function noiseTile() {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 160;
    const g = c.getContext('2d');
    const d = g.createImageData(160, 160);
    const r = rng(77);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.floor(r() * 255);
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    return c.toDataURL('image/png');
  } catch (e) { return ''; }
}

// draw an image into a box like object-fit (contain | cover)
function fitDraw(g, im, x, y, w, ht, fit = 'contain') {
  const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
  if (!iw || !ih) return;
  const k = fit === 'cover' ? Math.max(w / iw, ht / ih) : Math.min(w / iw, ht / ih);
  const dw = iw * k, dh = ih * k;
  if (fit === 'cover') {
    const sw = w / k, sh = ht / k;
    g.drawImage(im, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, ht);
  } else g.drawImage(im, x + (w - dw) / 2, y + (ht - dh) / 2, dw, dh);
}

export async function mount(el, ctx) {
  const { gsap, media, lenis, cursor, lightbox } = ctx;
  const reduced = ctx.reduced;
  const artById = Object.fromEntries(media.art.map((a) => [a.id, a]));
  const items = drawer.items.map((it) => {
    const first = it.frames?.[0] && artById[it.frames[0]];
    const kind = it.kind === 'video' || it.src ? 'video' : (it.frames?.length > 1 ? 'frames' : 'still');
    return { fps: 8, blend: false, ...it, kind, w: it.w || first?.w || 0, h: it.h || first?.h || 0, frames: it.frames || [] };
  });
  const byId = Object.fromEntries(items.map((it) => [it.id, it]));
  const src = (id, size) => (isUrl(id) ? id : ctx.img(id, size));
  const posterOf = (it) => (it.poster ? src(it.poster, 's') : it.frames[0] ? ctx.img(it.frames[0], 's') : '');
  const totalFrames = items.reduce((s, it) => s + (it.kind === 'video' ? 0 : it.frames.length), 0);
  const folderItems = (f) => items.filter((it) => it.folder === f);

  // ---------- skeleton ----------
  const stage = h('div.dg-stage');
  const wall = h('div.dg-wall', { 'aria-hidden': 'true' });
  const desk = h('div.dg-desk');
  stage.append(wall, desk);
  el.append(stage);
  const noise = noiseTile();
  if (noise) stage.style.setProperty('--dg-noise', `url(${noise})`);
  const mob = () => innerWidth < 760;
  let MOB = mob();
  let MODE = 'wide';

  // ---------- wallpaper: grid, the big hand count, the giant pixel arrow ----------
  const count = items.length;
  // the count is drawn, not typeset: one marker stroke per digit (10 hand-drawn digits), boiling at 8fps
  const digits = String(count).split('');
  const DW = 66, cvw = digits.length * DW + 34;
  const dr = rng(count * 13 + 5);
  const strokes = digits.map((d, i) => {
    const t = `translate(${18 + i * DW + (dr() - 0.5) * 6} ${22 + (dr() - 0.5) * 8}) rotate(${((dr() - 0.5) * 10).toFixed(1)} 30 50)`;
    return `<g transform="${t}"><path class="dg-count-a" d="${DIGIT[d]}"/><path class="dg-count-b" d="${DIGIT[d]}" transform="translate(-4 -4)"/></g>`;
  }).join('');
  const countEl = h('div.dg-count', {
    html: `<svg viewBox="0 0 ${cvw} 150" aria-hidden="true">
      <defs><filter id="dg-boil" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="3" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter></defs>
      <g filter="url(#dg-boil)">
        <path class="dg-count-c" d="M${cvw * 0.2} 22 C ${cvw * 0.02} 50, ${cvw * 0.06} 140, ${cvw * 0.5} 140 C ${cvw * 0.94} 140, ${cvw * 1.02} 60, ${cvw * 0.82} 24 C ${cvw * 0.66} 2, ${cvw * 0.3} 0, ${cvw * 0.14} 30 C ${cvw * 0.1} 38, ${cvw * 0.14} 42, ${cvw * 0.24} 34"/>
        ${strokes}
      </g></svg>`,
  });
  countEl.setAttribute('aria-label', `${count} things in here`);
  const countNote = h('p.dg-count-note', {}, 'things in here.', h('br'), 'the slop got deleted.');
  const ARROW_SVG = pix(BM.arrow, { scale: 9, pal: { '#': RED, o: PAPER } });
  const bigArrow = h('div.dg-bigarrow', { html: ARROW_SVG });
  const arrowNote = h('p.dg-arrow-note', {}, 'click stuff. drag stuff.', h('br'), 'right-click too.');
  const wallCap = h('p.dg-wallcap', {}, h('b', {}, 'DIGITAL / MOVING IMAGES'), h('span', {}, 'made with ai, picked by hand'));
  const mTitle = h('p.dg-mtitle', { 'aria-hidden': 'true' }, 'the digital drawer');
  const hero = h('div.dg-hero', {}, countEl, h('div.dg-hero-r', {}, mTitle, countNote));
  wall.append(h('div.dg-grid'), hero, bigArrow, arrowNote, wallCap);

  // ---------- menu bar ----------
  const bootLine = h('span.dg-boot', {}, '');
  const viewBtn = h('button.dg-mi', { type: 'button' }, 'view: strips');
  const bar = h('header.dg-bar', {},
    h('span.dg-slot', { 'aria-hidden': 'true' }),
    h('h2.dg-title', {}, 'the digital drawer'),
    h('nav.dg-menu-items', {},
      h('button.dg-mi', { type: 'button', 'data-act': 'file' }, 'file'),
      viewBtn,
      h('button.dg-mi', { type: 'button', 'data-act': 'retry' }, 're-try'),
      h('button.dg-mi', { type: 'button', 'data-act': 'help' }, 'help')),
    bootLine,
    h('span.dg-here', {}, 'you are here: ', h('b', {}, '.')),
    h('span.dg-barclock', {}, ''),
  );
  stage.append(bar);

  // ---------- window manager ----------
  const wins = {};
  let Z = 20;
  const sr = () => stage.getBoundingClientRect();

  function makeWin(id, { title, path = '', icon, closable = true }) {
    const minB = h('button.dg-wb', { type: 'button', 'aria-label': 'minimise ' + title, 'data-hot': '' }, h('i.dg-wb-min'));
    const xB = h('button.dg-wb', { type: 'button', 'aria-label': 'close ' + title, 'data-hot': '' }, h('i.dg-wb-x'));
    const tbar = h('div.dg-tbar', {}, h('span.dg-tico', { html: icon }), h('span.dg-ttl', {}, title), h('span.dg-tpath', {}, path),
      h('span.dg-tgrip', { 'aria-hidden': 'true' }), h('span.dg-wbs', {}, minB, closable ? xB : null));
    const body = h('div.dg-wbody');
    const w = h('div.dg-win.dg-win--' + id, { 'data-win': id, role: 'region', 'aria-label': title }, tbar, body);
    desk.append(w);
    const W = wins[id] = { id, el: w, tbar, body, open: true, min: false, rot: 0, moved: false, x: 0, y: 0, title, auto: false };
    minB.onclick = (e) => { e.stopPropagation(); minimise(id); };
    xB.onclick = (e) => { e.stopPropagation(); closeWin(id); };
    w.addEventListener('pointerdown', () => focus(id));
    dragify(w, tbar, {
      onMove: (x, y) => { W.x = x; W.y = y; W.moved = true; },
      get: () => [W.x, W.y],
      size: () => [w.offsetWidth, w.offsetHeight],
    });
    return W;
  }

  function place(W, x, y) { W.x = x; W.y = y; W.el.style.left = x + 'px'; W.el.style.top = y + 'px'; }

  function focus(id) {
    const W = wins[id];
    if (!W || !W.open) return;
    if (W.el.classList.contains('is-focus')) { W.el.style.zIndex = Z; return; }
    W.el.style.zIndex = ++Z;
    Object.values(wins).forEach((o) => {
      const f = o === W;
      o.el.classList.toggle('is-focus', f);
      if (!MOB && o.open) gsap.to(o.el, { rotation: f ? 0 : o.rot, duration: reduced ? 0 : 0.2, ease: 'steps(3)', overwrite: 'auto' });
    });
    syncDock();
  }

  function openWin(id, { quiet = false } = {}) {
    const W = wins[id];
    if (!W) return;
    const wasHidden = !W.open || W.min;
    W.open = true; W.min = false; W.auto = false;
    W.el.hidden = false;
    if (MOB) {
      W.el.classList.add('is-open');
      if (!quiet) lenis.scrollTo(W.el, { offset: -70, duration: 1.1 });
      syncDock(); return;
    }
    if (wasHidden && !reduced) {
      const d = dockPos(id);
      gsap.fromTo(W.el, { x: d ? d[0] - W.x : 0, y: d ? d[1] - W.y : 0, scale: 0.12, autoAlpha: 0 },
        { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: 0.36, ease: 'steps(6)', overwrite: true });
    } else gsap.set(W.el, { autoAlpha: 1, x: 0, y: 0, scale: 1 });
    focus(id);
    W.el.style.zIndex = ++Z;
    syncDock();
  }

  function minimise(id, { instant = false } = {}) {
    const W = wins[id];
    if (!W || !W.open) return;
    if (MOB) return;
    W.min = true;
    const d = dockPos(id);
    W.el.classList.remove('is-focus');
    if (instant) { gsap.set(W.el, { autoAlpha: 0 }); W.el.hidden = true; syncDock(); return; }
    gsap.to(W.el, { x: d ? d[0] - W.x : 0, y: d ? d[1] - W.y : 0, scale: 0.1, autoAlpha: 0, duration: reduced ? 0 : 0.36, ease: 'steps(6)', overwrite: true,
      onComplete: () => { W.el.hidden = true; } });
    syncDock();
  }

  function closeWin(id) {
    const W = wins[id];
    if (!W) return;
    W.open = false; W.min = false;
    W.el.classList.remove('is-focus');
    if (MOB) { W.el.classList.remove('is-open'); syncDock(); return; }
    gsap.to(W.el, { scale: 0.2, autoAlpha: 0, duration: reduced ? 0 : 0.24, ease: 'steps(4)', overwrite: true, onComplete: () => { W.el.hidden = true; } });
    if (id === 'player') player.pause();
    syncDock();
  }

  // drag with an 8px snap. works for windows, desktop icons and unzipped cards.
  function dragify(target, handle, { onMove, get, size, onClick, threshold = 4 }) {
    let sx, sy, ox, oy, dragging = false, down = false, pid;
    handle.addEventListener('pointerdown', (e) => {
      if (MOB || e.button !== 0 || e.target.closest('button:not(.dg-ico):not(.dg-card), input, .dg-film')) return;
      down = true; dragging = false; pid = e.pointerId;
      sx = e.clientX; sy = e.clientY; [ox, oy] = get();
      handle.setPointerCapture(pid);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!down || e.pointerId !== pid) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!dragging && Math.hypot(dx, dy) < threshold) return;
      if (!dragging) { dragging = true; target.classList.add('is-drag'); stage.classList.add('is-grabbing'); }
      const [w, ht] = size();
      const S = { w: stage.clientWidth, h: stage.clientHeight };
      const x = clamp(Math.round((ox + dx) / GRID) * GRID, -w + 80, S.w - 60);
      const y = clamp(Math.round((oy + dy) / GRID) * GRID, 48, S.h - 40);
      target.style.left = x + 'px'; target.style.top = y + 'px';
      onMove(x, y);
    });
    const up = (e) => {
      if (!down || e.pointerId !== pid) return;
      down = false;
      if (dragging) { target.classList.remove('is-drag'); stage.classList.remove('is-grabbing'); }
      else if (onClick) onClick(e);
      dragging = false;
    };
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
    if (onClick) handle.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } });
  }

  // ---------- visibility flags (set by observers further down) ----------
  let inView = false, inViewMost = false, booted = false, near = false;

  // ---------- PLAYER: a little display. the footage breathes (slow drift), the chrome steps. ----------
  const player = (() => {
    const W = makeWin('player', { title: 'player', path: './clips', icon: ICON.player(1.15) });
    const layers = h('div.dg-layers');
    const kb = h('div.dg-kb', {}, layers);
    const amb = h('img.dg-amb', { alt: '', 'aria-hidden': 'true', decoding: 'async', draggable: 'false' });
    const pxc = h('canvas.dg-pxin', { 'aria-hidden': 'true' });
    const fx = h('div.dg-fx', { 'aria-hidden': 'true' }, h('i.dg-grain'), h('i.dg-scan'), h('i.dg-roll'));
    const busy = h('p.dg-busy', {}, 'loading frames..');
    const hudL = h('span.dg-hud.dg-hud--l', {}, h('i.dg-rec'), h('span', {}, 'frame sequence'));
    const hudR = h('span.dg-hud.dg-hud--r', {}, 'frm 01/01');
    const swipe = h('span.dg-swipe', { 'aria-hidden': 'true' }, '← swipe →');
    const view = h('div.dg-view', {}, amb, kb, pxc, fx, busy, hudL, hudR, swipe);
    const screen = h('div.dg-screen', {}, view);
    const bPrev = h('button.dg-pb', { type: 'button', 'aria-label': 'previous frame', html: pix(BM.prev, { scale: 2 }) });
    const bPlay = h('button.dg-pb.dg-pb--play', { type: 'button', 'aria-label': 'play / pause', html: pix(BM.play, { scale: 2 }) });
    const bNext = h('button.dg-pb', { type: 'button', 'aria-label': 'next frame', html: pix(BM.next, { scale: 2 }) });
    const tc = h('span.dg-tc', {}, '00:00:00:00');
    const bFps = h('button.dg-chip', { type: 'button', title: 'playback speed' }, '8 fps');
    const bBlend = h('button.dg-chip', { type: 'button', title: 'crossfade between frames' }, 'cut');
    const bOpen = h('button.dg-chip.dg-chip--open', { type: 'button', title: 'open every frame big' }, 'frames ⤢');
    const film = h('div.dg-film', { 'data-lenis-prevent': '' });
    const head = h('div.dg-head');
    const filmWrap = h('div.dg-filmwrap', {}, film, head);
    // phone: clip pager under the screen (the screen itself swipes too)
    const pgPrev = h('button.dg-pg', { type: 'button', 'aria-label': 'previous clip', html: pix(BM.rew, { scale: 2 }) });
    const pgNext = h('button.dg-pg', { type: 'button', 'aria-label': 'next clip', html: pix(BM.ff, { scale: 2 }) });
    const pgN = h('b', {}, '01/' + pad(items.length));
    const pgT = h('span', {}, '');
    const pager = h('div.dg-pager', {}, pgPrev, h('span.dg-pg-l', {}, pgN, pgT), pgNext);
    const capT = h('b', {}, '');
    const capK = h('span', {}, '');
    const capN = h('span.dg-cap-note', {}, '');
    W.body.append(screen, pager,
      h('div.dg-ctrl', {}, bPrev, bPlay, bNext, tc, h('span.dg-sp'), bFps, bBlend, bOpen),
      filmWrap,
      h('p.dg-cap', {}, capT, capK, capN));

    let it = null, idx = 0, n = 1, playing = false, acc = 0, imgs = [], vid = null, wantPlay = !reduced, zTop = 2, scrubbing = false;
    const FPS = [2, 3, 4, 6, 8, 10, 12];

    function setPlayIcon() {
      bPlay.innerHTML = pix(playing ? BM.pause : BM.play, { scale: 2 });
      W.el.classList.toggle('is-playing', playing);
    }
    function tcOf(i) {
      if (it?.kind === 'video' && vid) {
        const t = vid.currentTime || 0, f = it.fps || 24;
        return `00:${pad(Math.floor(t / 60))}:${pad(Math.floor(t % 60))}:${pad(Math.floor((t % 1) * f))}`;
      }
      const f = it.fps, s = Math.floor(i / f);
      return `00:00:${pad(s)}:${pad(i % f)}`;
    }
    function hud() {
      if (!it) return;
      if (it.kind === 'video') {
        const d = vid?.duration || 0, t = vid?.currentTime || 0, f = it.fps || 24;
        hudR.textContent = `frm ${pad(Math.floor(t * f), 3)}/${pad(Math.floor(d * f) || 0, 3)}`;
        tc.textContent = tcOf();
        head.style.left = (d ? (t / d) * 100 : 0) + '%';
        return;
      }
      hudR.textContent = `frm ${pad(idx + 1)}/${pad(n)}`;
      tc.textContent = tcOf(idx);
      head.style.left = (idx / n) * 100 + '%';
      head.style.width = 100 / n + '%';
      film.querySelectorAll('.dg-fthumb').forEach((t, k) => t.classList.toggle('is-on', k === idx));
      info.frame(idx);
    }

    // --- the footage drift: a slow ken burns that never stops, plus a little pointer parallax ---
    let kbT = Math.random() * 20, kbSeed = 0, parX = 0, parY = 0, tParX = 0, tParY = 0, jit = 0, jitY = 0;
    function kbTick(time, dt) {
      if (reduced || !inView || !it) return;
      const d = Math.min(dt, 64) / 1000;
      kbT += d * (playing ? 1 : 0.35);
      parX += (tParX - parX) * 0.06; parY += (tParY - parY) * 0.06;
      const s = 1.075 + 0.025 * Math.sin(kbT * 0.23 + kbSeed);
      const x = Math.sin(kbT * 0.17 + kbSeed * 2) * 1.1 + parX + jit;
      const y = Math.cos(kbT * 0.13 + kbSeed) * 0.9 + parY + jitY;
      kb.style.transform = `translate3d(${x.toFixed(3)}%, ${y.toFixed(3)}%, 0) scale(${s.toFixed(4)})`;
      jit = 0; jitY = 0;
    }
    gsap.ticker.add(kbTick);
    view.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = view.getBoundingClientRect();
      tParX = -((e.clientX - r.left) / r.width - 0.5) * 1.8;
      tParY = -((e.clientY - r.top) / r.height - 0.5) * 1.4;
    });
    view.addEventListener('pointerleave', () => { tParX = tParY = 0; });

    // --- every clip arrives the way you arrived: out of big pixels ---
    let pxRun = 0;
    function pixelIn(url) {
      if (reduced || !url || !view.clientWidth) return;
      const run = ++pxRun;
      const im = new Image();
      im.decoding = 'async';
      im.src = url;
      const go = () => {
        if (run !== pxRun) return;
        const Wd = view.clientWidth, Ht = view.clientHeight;
        pxc.width = Wd; pxc.height = Ht;
        const g = pxc.getContext('2d');
        const sm = document.createElement('canvas');
        const steps = [36, 18, 9, 4];
        let i = 0;
        pxc.style.opacity = 1;
        const draw = () => {
          if (run !== pxRun) return;
          if (i >= steps.length) { pxc.style.opacity = 0; return; }
          const b = steps[i++];
          const w = Math.max(1, Math.ceil(Wd / b)), hh = Math.max(1, Math.ceil(Ht / b));
          sm.width = w; sm.height = hh;
          const s = sm.getContext('2d');
          s.imageSmoothingEnabled = true;
          s.fillStyle = INK; s.fillRect(0, 0, w, hh);
          fitDraw(s, im, 0, 0, w, hh, 'cover');
          g.imageSmoothingEnabled = false;
          g.clearRect(0, 0, Wd, Ht);
          g.drawImage(sm, 0, 0, w, hh, 0, 0, w * b, hh * b);
          setTimeout(draw, 70);
        };
        draw();
      };
      if (im.complete && im.naturalWidth) go();
      else im.decode().then(go).catch(() => {});
    }

    // --- big frames only when the drawer is near, and only if the screen needs them ---
    function wantsBig() { return view.clientWidth * (window.devicePixelRatio || 1) > 660; }
    function upgrade() {
      if (!near || !it || it.kind === 'video' || !wantsBig()) return;
      const cur = it;
      const order = it.frames.map((id, k) => k).sort((a, b) => ((a - idx + n) % n) - ((b - idx + n) % n));
      let p = Promise.resolve();
      order.forEach((k) => {
        const im = imgs[k];
        if (!im || im.dataset.big === '1') return;
        p = p.then(() => {
          if (it !== cur) return;
          const big = ctx.img(cur.frames[k]);
          const pre = new Image();
          pre.decoding = 'async';
          pre.src = big;
          return pre.decode().then(() => { if (imgs[k] === im) { im.src = big; im.dataset.big = '1'; } }).catch(() => {});
        });
      });
    }

    function show(i, { cut = true } = {}) {
      if (!it || it.kind === 'video') return;
      const prev = idx;
      idx = ((i % n) + n) % n;
      const cur = imgs[idx];
      if (cur) {
        const d = it.blend && !scrubbing ? Math.round((1000 / it.fps) * 0.85) : 0;
        cur.style.zIndex = ++zTop;
        cur.style.transition = d ? `opacity ${d}ms linear` : 'none';
        cur.style.opacity = 1;
        imgs.forEach((im, k) => {
          if (k === idx) return;
          clearTimeout(im._t);
          if (k === prev && d) im._t = setTimeout(() => { if (idx !== k) { im.style.transition = 'none'; im.style.opacity = 0; } }, d + 30);
          else { im.style.transition = 'none'; im.style.opacity = 0; }
        });
        // a hard cut gets a one-frame shove, like a bad splice
        if (!d && cut && prev !== idx && !reduced) { jit = (Math.random() - 0.5) * 1.6; jitY = (Math.random() - 0.5) * 0.8; }
      }
      hud();
    }
    function load(item, at = 0, autoplay = wantPlay, { fx: doFx = true } = {}) {
      it = item; idx = 0; acc = 0; kbSeed = Math.random() * 6;
      layers.textContent = ''; imgs = []; film.textContent = '';
      if (vid) { vid.pause(); vid.remove(); vid = null; }
      W.el.querySelector('.dg-ttl').textContent = it.title + extOf(it);
      W.el.querySelector('.dg-tpath').textContent = './' + it.folder;
      W.el.dataset.kind = it.kind;
      capT.textContent = it.title;
      capK.textContent = it.kind === 'video' ? 'video' : it.kind === 'frames' ? `frame sequence · ${it.frames.length} frames` : 'still · 1 frame';
      capN.textContent = it.note || '';
      hudL.lastChild.textContent = it.kind === 'video' ? 'video' : it.kind === 'frames' ? 'frame sequence' : 'still. it breathes a bit.';
      bFps.textContent = it.kind === 'video' ? `${it.fps || 24} fps` : `${it.fps} fps`;
      bBlend.textContent = it.blend ? 'blend' : 'cut';
      busy.hidden = false;
      const k = items.indexOf(it);
      pgN.textContent = `${pad(k + 1)}/${pad(items.length)}`;
      pgT.textContent = it.title;
      amb.src = posterOf(it);

      if (it.kind === 'video') {
        n = 1;
        vid = h('video', { src: it.src, muted: true, playsinline: true, loop: true, preload: near ? 'auto' : 'metadata', poster: it.poster ? src(it.poster) : null });
        vid.muted = true;
        vid.addEventListener('loadeddata', () => { busy.hidden = true; hud(); });
        vid.addEventListener('loadedmetadata', () => {
          it._dur = vid.duration; it.w = it.w || vid.videoWidth; it.h = it.h || vid.videoHeight;
          info.set(it);
        }, { once: true });
        vid.addEventListener('timeupdate', hud);
        layers.append(vid);
        for (let q = 0; q < 24; q++) film.append(h('span.dg-tick'));
        head.style.width = '6px';
      } else {
        n = it.frames.length;
        it.frames.forEach((id, q) => {
          const a = artById[id] || {};
          // small first. big ones get swapped in by upgrade() when the section is near
          const im = h('img', { src: ctx.img(id, 's'), alt: q === 0 ? `${it.title}, frame ${q + 1}` : '', width: a.w, height: a.h, loading: 'lazy', decoding: 'async', draggable: 'false' });
          im.style.opacity = q === 0 ? 1 : 0;
          if (q === 0) im.addEventListener('load', () => { busy.hidden = true; }, { once: true });
          layers.append(im); imgs.push(im);
          const t = h('button.dg-fthumb', { type: 'button', 'aria-label': `frame ${q + 1}`, tabindex: '-1' },
            h('img', { src: ctx.img(id, 's'), alt: '', loading: 'lazy', decoding: 'async', width: a.w, height: a.h, draggable: 'false' }),
            h('i', {}, pad(q + 1)));
          film.append(t);
        });
        if (imgs[0]?.complete) busy.hidden = true;
      }
      film.style.setProperty('--n', it.kind === 'video' ? 24 : n);
      bOpen.textContent = it.kind === 'still' ? 'open ⤢' : 'frames ⤢';
      bOpen.hidden = it.kind === 'video';
      const canPlay = it.kind !== 'still';
      [bPlay, bPrev, bNext, bFps, bBlend].forEach((b) => (b.disabled = !canPlay));
      bBlend.disabled = it.kind !== 'frames';
      playing = false;
      show(at, { cut: false });
      if (canPlay && autoplay) play(); else setPlayIcon();
      info.set(it);
      browser.mark(it.id);
      upgrade();
      if (doFx && booted) pixelIn(it.kind === 'video' ? (it.poster ? src(it.poster, 's') : '') : ctx.img(it.frames[at] || it.frames[0], 's'));
    }
    function play() {
      if (!it || it.kind === 'still') return;
      playing = true; wantPlay = true;
      if (vid) vid.play().catch(() => {});
      setPlayIcon();
    }
    function pause(user) {
      playing = false;
      if (user) wantPlay = false;
      if (vid) vid.pause();
      setPlayIcon();
    }
    function tick(time, dt) {
      if (!playing || !it || it.kind !== 'frames' || !inView || scrubbing) return;
      acc += Math.min(dt, 200) / 1000;
      const spf = 1 / it.fps;
      if (acc >= spf) { acc %= spf; show(idx + 1); }
    }
    gsap.ticker.add(tick);
    function stepClip(dir) {
      const k = items.indexOf(it);
      const nx = items[(k + dir + items.length) % items.length];
      load(nx, 0, true);
      if (!MOB) openWin('player');
    }

    bPlay.onclick = () => (playing ? pause(true) : play());
    bNext.onclick = () => { pause(true); if (vid) vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 1 / (it.fps || 24)); else show(idx + 1); };
    bPrev.onclick = () => { pause(true); if (vid) vid.currentTime = Math.max(0, vid.currentTime - 1 / (it.fps || 24)); else show(idx - 1); };
    pgPrev.onclick = () => stepClip(-1);
    pgNext.onclick = () => stepClip(1);
    bFps.onclick = () => {
      if (!it || it.kind !== 'frames') return;
      const k = FPS.indexOf(it.fps);
      it.fps = FPS[(k + 1) % FPS.length];
      bFps.textContent = `${it.fps} fps`; info.set(it); hud();
    };
    bBlend.onclick = () => { if (!it || it.kind !== 'frames') return; it.blend = !it.blend; bBlend.textContent = it.blend ? 'blend' : 'cut'; info.set(it); };
    bOpen.onclick = () => {
      if (!it) return;
      if (it.kind === 'video') { lightbox.open([{ src: posterOf(it), caption: it.title }], 0); return; }
      lightbox.open(it.frames.map((id, k) => ({ src: ctx.img(id), caption: `${it.title} · frame ${k + 1}/${it.frames.length}` })), idx);
    };
    // tap = play/pause. a sideways swipe (finger or mouse) = next / previous clip
    let sw = null, swiped = false;
    view.addEventListener('pointerdown', (e) => { if (e.button === 0 || e.pointerType !== 'mouse') sw = { x: e.clientX, y: e.clientY }; });
    view.addEventListener('pointerup', (e) => {
      if (!sw) return;
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      sw = null;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) { swiped = true; stepClip(dx < 0 ? 1 : -1); }
    });
    view.addEventListener('pointercancel', () => { sw = null; });
    view.addEventListener('click', () => { if (swiped) { swiped = false; return; } playing ? pause(true) : play(); });

    // scrub on the filmstrip: snaps to frames, steps on purpose
    let wasPlaying = false;
    const scrubTo = (e) => {
      const r = film.getBoundingClientRect();
      const f = clamp((e.clientX - r.left) / r.width, 0, 0.9999);
      if (vid) { if (vid.duration) vid.currentTime = f * vid.duration; hud(); return; }
      if (Math.floor(f * n) !== idx) show(Math.floor(f * n), { cut: false });
    };
    filmWrap.addEventListener('pointerdown', (e) => {
      scrubbing = true; wasPlaying = playing; if (playing) pause(); filmWrap.setPointerCapture(e.pointerId); scrubTo(e);
      W.el.classList.add('is-scrub');
    });
    filmWrap.addEventListener('pointermove', (e) => { if (scrubbing) scrubTo(e); });
    const end = () => { if (!scrubbing) return; scrubbing = false; W.el.classList.remove('is-scrub'); if (wasPlaying) play(); };
    filmWrap.addEventListener('pointerup', end); filmWrap.addEventListener('pointercancel', end);
    W.el.addEventListener('keydown', (e) => {
      if (e.target.closest('input')) return;
      if (e.key === ' ') { e.preventDefault(); playing ? pause(true) : play(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); bNext.onclick(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); bPrev.onclick(); }
    });
    W.el.tabIndex = -1;
    return { W, view, load, play, pause, upgrade, pixelIn, stepClip, get item() { return it; }, get playing() { return playing; }, get wantPlay() { return wantPlay; } };
  })();

  // ---------- INFO ----------
  const info = (() => {
    const W = makeWin('info', { title: 'info', path: 'get info', icon: ICON.info(1.2) });
    const dl = h('dl.dg-dl');
    W.body.append(dl);
    let cur = null;
    // opt rows are dropped on phones, where the info sheet has to be short
    const row = (k, v, cls = '', opt = false) => [h('dt' + (opt ? '.dg-opt' : ''), {}, k), h('dd' + cls + (opt ? '.dg-opt' : ''), {}, v)];
    function ratio(w, hh) {
      if (!w || !hh) return '?';
      const r = w / hh, known = [[16 / 9, '16:9'], [1, '1:1'], [4 / 5, '4:5'], [2 / 3, '2:3'], [21 / 9, '21:9'], [9 / 16, '9:16'], [4 / 3, '4:3'], [7 / 9, '7:9'], [3 / 4, '3:4']];
      const k = known.find(([v]) => Math.abs(v - r) < 0.03);
      return k ? k[1] : r.toFixed(2) + ':1';
    }
    function set(it) {
      cur = it;
      dl.textContent = '';
      const len = it.kind === 'frames' ? `${(it.frames.length / it.fps).toFixed(2)}s, looped` : it.kind === 'video' ? (it._dur ? `${it._dur.toFixed(2)}s` : '..') : '1 frame. forever.';
      dl.append(
        ...row('name', it.title + extOf(it)),
        ...row('kind', it.kind === 'frames' ? 'frame sequence' : it.kind),
        ...row('where', `./${it.folder}`, '', true),
        ...row('size', it.w ? `${it.w} × ${it.h}` : 'from the file', '', true),
        ...row('aspect', ratio(it.w, it.h), '', true),
        ...row('frames', it.kind === 'video' ? (it._dur ? String(Math.round(it._dur * (it.fps || 24))) : '..') : pad(it.frames.length)),
        ...(it.kind === 'still' ? [] : row('plays at', `${it.fps || 24} fps${it.kind === 'frames' ? (it.blend ? ' · blend' : ' · hard cut') : ''}`)),
        ...row('length', len, '', true),
        ...row('made with', 'ai + a lot of re-tries', '.is-red'),
        ...row('picked by', h('span.dg-hand', {}, 'taste')),
        ...row('slop', 'removed'),
      );
      const fr = h('dd.dg-frm.dg-opt', {}, it.kind === 'frames' ? `01/${pad(it.frames.length)}` : '--');
      dl.append(h('dt.dg-opt', {}, 'now'), fr);
    }
    function frame(i) { const f = dl.querySelector('.dg-frm'); if (f && cur?.kind === 'frames') f.textContent = `${pad(i + 1)}/${pad(cur.frames.length)}`; }
    return { W, set, frame };
  })();

  // ---------- FILE BROWSER ----------
  const browser = (() => {
    const W = makeWin('drawer', { title: 'drawer', path: '~/RA.S/./', icon: ICON.folder(1.1) });
    const crumbs = h('span.dg-crumbs', {}, '');
    const views = ['strips', 'icons', 'list'].map((v) => h('button.dg-vb', { type: 'button', 'data-v': v }, v));
    const side = h('nav.dg-side', {});
    const main = h('div.dg-main', { 'data-lenis-prevent': '' });
    const status = h('p.dg-status', {}, '');
    W.body.append(h('div.dg-btool', {}, crumbs, h('span.dg-sp'), ...views), h('div.dg-bwrap', {}, side, main), status);
    let folder = 'clips', view = 'strips', marked = null;
    const folders = [...drawer.folders.map((f) => ({ ...f, n: folderItems(f.id).length })), { id: 'trash', label: 'trash', n: 0 }];
    folders.forEach((f) => {
      const b = h('button.dg-fold', { type: 'button', 'data-f': f.id, html: (f.id === 'trash' ? ICON.trash(1.2) : ICON.folder(1.2)) });
      b.append(h('span', {}, f.label), h('i', {}, String(f.n)));
      b.onclick = () => go(f.id);
      side.append(b);
    });
    views.forEach((b) => (b.onclick = () => setView(b.dataset.v)));

    function setView(v) {
      view = v;
      views.forEach((b) => b.classList.toggle('is-on', b.dataset.v === v));
      viewBtn.textContent = 'view: ' + v;
      render();
    }
    function go(f) {
      folder = f;
      side.querySelectorAll('.dg-fold').forEach((b) => b.classList.toggle('is-on', b.dataset.f === f));
      render();
    }
    function render() {
      main.textContent = '';
      main.scrollLeft = 0;
      main.dataset.view = view;
      crumbs.textContent = `RA.S / . / ${folder}`;
      W.el.querySelector('.dg-tpath').textContent = `~/RA.S/./${folder}`;
      if (folder === 'trash') {
        main.dataset.view = 'empty';
        main.append(h('div.dg-empty', {}, h('span', { html: ICON.trash(4) }), h('p', {}, '0 items.'), h('p.dg-empty-l', {}, drawer.trash)));
        status.textContent = '0 items · 0 bytes · 0 slop';
        return;
      }
      const list = folderItems(folder);
      if (view === 'list') {
        main.append(h('div.dg-lhead', {}, h('span', {}, 'name'), h('span', {}, 'kind'), h('span', {}, 'frm'), h('span', {}, 'size')));
      }
      const r = rng(list.length * 7 + folder.length);
      list.forEach((it, k) => {
        const ext = extOf(it);
        let b;
        if (view === 'strips') {
          // tape spines: the name runs up a paper label, like a shelf of tapes. nothing gets cut off.
          const tall = [0.8, 0.9, 1, 0.94, 0.84, 0.97, 0.88][k % 7];
          const im = h('img', { src: posterOf(it), alt: '', loading: 'lazy', decoding: 'async', draggable: 'false' });
          b = h('button.dg-strip', { type: 'button', style: { '--t': tall }, 'aria-label': `open ${it.title}` },
            h('span.dg-strip-im', {}, im,
              h('span.dg-strip-l', { title: it.title + ext }, h('i', {}), h('span', {}, it.title)),
              h('span.dg-strip-n', {}, it.kind === 'frames' ? `${it.frames.length} frm` : '1 frm')));
          if (it.kind === 'frames') {
            b.addEventListener('pointermove', (e) => {
              if (e.pointerType !== 'mouse') return;
              const rr = b.getBoundingClientRect();
              const f = clamp(Math.floor(((e.clientX - rr.left) / rr.width) * it.frames.length), 0, it.frames.length - 1);
              const s = ctx.img(it.frames[f], 's');
              if (im.getAttribute('src') !== s) im.src = s;
              b.querySelector('.dg-strip-n').textContent = `${pad(f + 1)}/${pad(it.frames.length)}`;
            });
            b.addEventListener('pointerleave', () => { im.src = posterOf(it); b.querySelector('.dg-strip-n').textContent = `${it.frames.length} frm`; });
          }
        } else if (view === 'icons') {
          b = h('button.dg-icon-it', { type: 'button', style: { '--r': ((r() - 0.5) * 3).toFixed(2) + 'deg' } },
            h('span.dg-icon-im', {}, h('img', { src: posterOf(it), alt: '', loading: 'lazy', decoding: 'async', draggable: 'false' }), h('span.dg-badge', { html: kindIcon(it, 1) })),
            h('span.dg-icon-l', {}, it.title + ext));
        } else {
          b = h('button.dg-row', { type: 'button' },
            h('span', { html: kindIcon(it, 1) }, it.title + ext),
            h('span', {}, it.kind === 'frames' ? 'seq' : it.kind),
            h('span', {}, it.kind === 'video' ? '--' : pad(it.frames.length)),
            h('span', {}, it.w ? `${it.w}×${it.h}` : '--'));
        }
        b.dataset.id = it.id;
        b.classList.toggle('is-sel', it.id === marked);
        b.addEventListener('click', () => { player.load(it, 0, true); openWin('player'); });
        main.append(b);
      });
      const fr = list.reduce((s, it) => s + (it.kind === 'video' ? 0 : it.frames.length), 0);
      status.textContent = `${list.length} items · ${fr} frames · 0 slop`;
    }
    function mark(id) {
      marked = id;
      const it = byId[id];
      if (it && it.folder !== folder && W.open) go(it.folder);
      main.querySelectorAll('[data-id]').forEach((b) => b.classList.toggle('is-sel', b.dataset.id === id));
      // phones: keep the selected tape in view
      if (MOB) {
        const s = main.querySelector('.is-sel');
        if (s && main.scrollWidth > main.clientWidth) main.scrollTo({ left: s.offsetLeft - 12, behavior: reduced ? 'auto' : 'smooth' });
      }
    }
    go('clips'); setView('strips');
    return { W, go, setView, mark, get view() { return view; } };
  })();

  // ---------- README ----------
  const readme = (() => {
    const W = makeWin('readme', { title: 'readme.txt', path: 'plain text', icon: ICON.text(1.2) });
    const tape1 = h('span.tape.dg-tape1'), tape2 = h('span.tape.dg-tape2');
    const txt = h('div.dg-txt');
    drawer.readme.forEach((p, k) => {
      txt.append(h('p' + (k === 1 ? '.dg-hl' : ''), {}, k === 1 ? h('mark', {}, p) : p));
      if (k === 1) txt.append(h('p.dg-scribble', {}, '↑ the important bit'));
    });
    W.el.append(tape1, tape2);
    W.body.append(txt);
    return { W };
  })();

  // ---------- TRASH ----------
  const trash = (() => {
    const W = makeWin('trash', { title: 'trash', path: '0 items', icon: ICON.trash(1.2) });
    const nope = h('button.dg-chip', { type: 'button' }, 'restore everything?');
    nope.onclick = () => { nope.textContent = 'nope.'; gsap.fromTo(W.el, { x: -6 }, { x: 0, duration: 0.3, ease: 'steps(5)' }); };
    W.body.append(h('div.dg-empty', {}, h('span', { html: ICON.trash(4) }), h('p', {}, '0 items.'), h('p.dg-empty-l', {}, drawer.trash), nope));
    return { W };
  })();

  // ---------- desktop icons ----------
  const icons = h('div.dg-icons');
  const ICONS = [
    { id: 'drawer', label: 'drawer', html: ICON.folder(3), col: YEL, act: () => { browser.go('clips'); openWin('drawer'); } },
    { id: 'zip', label: 'everything.zip', html: ICON.zip(3), col: RED, act: () => explode() },
    { id: 'readme', label: 'readme.txt', html: ICON.text(3), col: PAPER, act: () => openWin('readme') },
    { id: 'trash', label: 'trash', html: ICON.trash(3), col: PAPER, act: () => openWin('trash') },
  ];
  ICONS.forEach((ic) => {
    const b = h('button.dg-ico', { type: 'button', 'data-ico': ic.id }, h('span.dg-ico-im', { html: ic.html }), h('span.dg-ico-l', { html: ic.label.replace('.', '<wbr>.') }));
    const pos = { x: 0, y: 0 };
    ic.el = b; ic.pos = pos;
    dragify(b, b, {
      onMove: (x, y) => { pos.x = x; pos.y = y; ic.moved = true; },
      get: () => [pos.x, pos.y], size: () => [b.offsetWidth, b.offsetHeight],
      onClick: () => {
        icons.querySelectorAll('.dg-ico').forEach((o) => o.classList.toggle('is-sel', o === b));
        ic.act();
      },
    });
    if (MOB) b.onclick = ic.act;
    icons.append(b);
  });
  desk.prepend(icons);

  // ---------- dock ----------
  const DOCK = [
    { id: 'drawer', label: 'drawer', html: ICON.folder(2.25) },
    { id: 'player', label: 'player', html: ICON.player(2.25) },
    { id: 'info', label: 'info', html: ICON.info(2.25) },
    { id: 'readme', label: 'readme', html: ICON.text(2.25) },
    { id: 'zip', label: 'unzip', html: ICON.zip(2.25) },
    { id: 'trash', label: 'trash', html: ICON.trash(2.25) },
  ];
  const clockT = h('b', {}, '00:00'), clockD = h('span', {}, '');
  const dock = h('nav.dg-dock', { 'aria-label': 'dock' });
  DOCK.forEach((d) => {
    const b = h('button.dg-dk', { type: 'button', 'data-dk': d.id, 'aria-label': d.label }, h('span.dg-dk-im', { html: d.html }), h('span.dg-dk-l', {}, d.label), h('i.dg-dk-dot'));
    b.onclick = () => {
      if (d.id === 'zip') return explode();
      const W = wins[d.id];
      if (!W.open || W.min) openWin(d.id);
      else if (MOB) lenis.scrollTo(W.el, { offset: -70, duration: 1.1 });
      else if (W.el.classList.contains('is-focus')) minimise(d.id);
      else { focus(d.id); W.el.style.zIndex = ++Z; }
    };
    d.el = b;
    dock.append(b);
  });
  dock.append(h('span.dg-dk-sep'), h('span.dg-clock', {}, clockT, clockD));
  stage.append(dock);
  function dockPos(id) {
    const d = DOCK.find((o) => o.id === id);
    if (!d) return null;
    const r = d.el.getBoundingClientRect(), s = sr();
    return [r.left - s.left + r.width / 2 - 40, r.top - s.top - 20];
  }
  function syncDock() {
    DOCK.forEach((d) => {
      const W = wins[d.id];
      if (!W) return;
      d.el.classList.toggle('is-open', W.open && !W.min);
      d.el.classList.toggle('is-min', W.min);
      d.el.classList.toggle('is-focus', W.el.classList.contains('is-focus') && W.open && !W.min);
    });
  }
  const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  function clock() {
    const d = new Date();
    clockT.innerHTML = `${pad(d.getHours())}<span class="dg-colon">:</span>${pad(d.getMinutes())}`;
    clockD.textContent = `${DAYS[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
    bar.querySelector('.dg-barclock').innerHTML = clockT.innerHTML;
  }
  clock();
  setInterval(() => { if (!inView && booted) return; clock(); stage.classList.toggle('dg-tock'); }, 1000);

  // ---------- context menu (right-click the desktop, or "file") ----------
  const menu = h('div.dg-ctx', { role: 'menu', hidden: true });
  const MENU = [
    ['open drawer', () => openWin('drawer')],
    ['unzip everything.zip', () => explode()],
    ['re-try', () => retry()],
    ['clean up desktop', () => layout(true)],
    ['screensaver', () => saver.start()],
    null,
    ['about this drawer', () => openWin('readme')],
  ];
  MENU.forEach((m) => {
    if (!m) return menu.append(h('hr'));
    menu.append(h('button', { type: 'button', role: 'menuitem', onclick: () => { hideMenu(); m[1](); } }, m[0]));
  });
  stage.append(menu);
  function showMenu(x, y) {
    menu.hidden = false;
    const S = { w: stage.clientWidth, h: stage.clientHeight };
    menu.style.left = clamp(x, 8, S.w - 230) + 'px';
    menu.style.top = clamp(y, 40, S.h - menu.offsetHeight - 10) + 'px';
    if (!reduced) gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.16, ease: 'steps(4)' });
  }
  const hideMenu = () => { menu.hidden = true; };
  stage.addEventListener('contextmenu', (e) => {
    if (MOB || e.target.closest('.dg-win, .dg-dock, .dg-bar')) return;
    e.preventDefault();
    const s = sr();
    showMenu(e.clientX - s.left, e.clientY - s.top);
  });
  bar.querySelector('[data-act="file"]').onclick = (e) => {
    e.stopPropagation();
    if (!menu.hidden) return hideMenu();
    const r = e.currentTarget.getBoundingClientRect(), s = sr();
    showMenu(r.left - s.left - 6, r.bottom - s.top + 4);
  };
  document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('[data-act="file"]')) hideMenu(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { hideMenu(); if (zipOpen) implode(); } });
  viewBtn.onclick = () => {
    const v = ['strips', 'icons', 'list'];
    browser.setView(v[(v.indexOf(browser.view) + 1) % 3]);
    openWin('drawer');
  };
  bar.querySelector('[data-act="retry"]').onclick = () => retry();
  bar.querySelector('[data-act="help"]').onclick = () => openWin('readme');

  // re-try: what i do all day. a random clip, and every window gets nudged a bit.
  let retries = 0;
  function retry() {
    const pool = items.filter((it) => it.kind !== 'still' && it.id !== player.item?.id);
    const it = pool[Math.floor(Math.random() * pool.length)] || items[0];
    retries++;
    bootLine.textContent = retries === 1 ? 're-try #1. classic.' : `re-try #${retries}. still going.`;
    player.load(it, 0, true);
    openWin('player');
    if (!MOB && !reduced) {
      Object.values(wins).forEach((W) => {
        if (!W.open || W.min || W.id === 'player') return;
        W.rot = Math.round((Math.random() - 0.5) * 6 * 2) / 2;
        gsap.to(W.el, { rotation: W.rot, duration: 0.24, ease: 'steps(3)' });
      });
    }
  }

  // ---------- everything.zip: explodes into every frame, then zips back ----------
  const zipLayer = h('div.dg-ziplayer', { hidden: true });
  const zipBar = h('div.dg-zipbar', {}, h('span', {}, `unzipped: ${totalFrames + items.filter((i) => i.kind === 'video').length} files. pick one.`), h('button.dg-chip', { type: 'button', onclick: () => implode() }, 'zip it back'));
  zipLayer.append(zipBar);
  stage.append(zipLayer);
  let zipOpen = false, cards = null;
  function zipOrigin() {
    const z = ICONS.find((i) => i.id === 'zip').el;
    const r = (MOB || !z.offsetParent || !z.offsetWidth ? DOCK.find((d) => d.id === 'zip').el : z).getBoundingClientRect(), s = sr();
    return [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2];
  }
  function buildCards() {
    cards = [];
    items.forEach((it) => {
      const list = it.kind === 'video' ? [it.poster || null] : it.frames;
      list.forEach((id, k) => {
        if (!id) return;
        const a = artById[id] || { w: 16, h: 9 };
        const c = h('button.dg-card', { type: 'button', 'aria-label': `${it.title} frame ${k + 1}` },
          h('img', { src: src(id, 's'), alt: '', decoding: 'async', draggable: 'false', width: a.w, height: a.h }),
          h('span', {}, `${it.title}_${pad(k + 1)}`));
        const pos = { x: 0, y: 0 };
        c.dataset.ar = (a.w / a.h).toFixed(3);
        dragify(c, c, {
          onMove: (x, y) => { pos.x = x; pos.y = y; }, get: () => [parseFloat(c.style.left) || 0, parseFloat(c.style.top) || 0],
          size: () => [c.offsetWidth, c.offsetHeight],
          onClick: () => { implode(); player.load(it, k, true); openWin('player'); },
        });
        if (MOB) c.onclick = () => { implode(); player.load(it, k, true); openWin('player'); };
        cards.push(c);
        zipLayer.append(c);
      });
    });
  }
  function explode() {
    if (zipOpen) return implode();
    if (!cards) buildCards();
    zipOpen = true;
    zipLayer.hidden = false;
    stage.classList.add('is-unzipped');
    const s0 = sr();
    const vTop = MOB ? clamp(-s0.top, 0, stage.clientHeight - innerHeight) : 0;
    const S = { w: stage.clientWidth, h: MOB ? innerHeight - 60 : stage.clientHeight };
    const [ox, oy] = zipOrigin();
    const r = rng(Date.now() % 9973);
    const cols = Math.ceil(Math.sqrt(cards.length * (S.w / S.h)));
    const rows = Math.ceil(cards.length / cols);
    const cw = (S.w - (MOB ? 40 : 140)) / cols, ch = (S.h - (MOB ? 190 : 300)) / rows;
    const order = cards.map((c, i) => i).sort(() => r() - 0.5);
    cards.forEach((c, i) => {
      const slot = order[i];
      const base = MOB ? 74 : clamp(cw * 0.86, 84, 150);
      const ar = parseFloat(c.dataset.ar) || 1;
      const w = Math.round(base * clamp(Math.sqrt(ar), 0.75, 1.3));
      c.style.width = w + 'px';
      const x = Math.round(((MOB ? 12 : 60) + (slot % cols) * cw + r() * Math.max(0, cw - w * 0.7)) / GRID) * GRID;
      const y = vTop + Math.round(((MOB ? 70 : 96) + Math.floor(slot / cols) * ch + r() * ch * 0.4) / GRID) * GRID;
      c.style.left = x + 'px'; c.style.top = y + 'px';
      gsap.fromTo(c, { x: ox - x - w / 2, y: oy - y - 30, scale: 0.15, rotation: 0, autoAlpha: 0 },
        { x: 0, y: 0, scale: 1, rotation: (r() - 0.5) * 22, autoAlpha: 1, duration: reduced ? 0 : 0.5, ease: 'steps(6)', delay: reduced ? 0 : i * 0.012, overwrite: true });
    });
    gsap.fromTo(zipBar, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'steps(2)' });
  }
  function implode() {
    if (!zipOpen) return;
    zipOpen = false;
    stage.classList.remove('is-unzipped');
    const [ox, oy] = zipOrigin();
    cards.forEach((c, i) => {
      const x = parseFloat(c.style.left), y = parseFloat(c.style.top), w = c.offsetWidth;
      gsap.to(c, { x: ox - x - w / 2, y: oy - y - 30, scale: 0.1, rotation: 0, autoAlpha: 0, duration: reduced ? 0 : 0.36, ease: 'steps(5)', delay: reduced ? 0 : (cards.length - i) * 0.006, overwrite: true });
    });
    gsap.to(zipBar, { autoAlpha: 0, duration: 0.15, ease: 'steps(2)', onComplete: () => { if (!zipOpen) zipLayer.hidden = true; } });
  }

  // ---------- screensaver: the full stop, bouncing. it will hit the corner eventually ----------
  const saver = (() => {
    const dot = h('span.dg-sv-dot');
    const trail = Array.from({ length: 6 }, () => h('span.dg-sv-tr'));
    const msg = h('p.dg-sv-msg', {}, 'screensaver: the full stop got out. move anything to put it back.');
    const toast = h('p.dg-sv-toast', {}, '');
    const ghost = h('p.dg-sv-ghost', {}, 'RA', h('span'), 'S');
    const S = h('div.dg-saver', { hidden: true, 'aria-hidden': 'true' }, ghost, ...trail, dot, msg, toast);
    stage.append(S);
    let on = false, x = 80, y = 120, vx = 16, vy = 12, acc = 0, hist = [], hits = 0, SZ = 40, leaving = false;
    function step() {
      const W = stage.clientWidth, H = stage.clientHeight;
      x += vx; y += vy;
      let hx = false, hy = false;
      if (x <= 0 || x >= W - SZ) { vx *= -1; x = clamp(x, 0, W - SZ); hx = true; }
      if (y <= 0 || y >= H - SZ) { vy *= -1; y = clamp(y, 0, H - SZ); hy = true; }
      if (hx || hy) dot.dataset.c = (Number(dot.dataset.c || 0) + 1) % 4;
      if (hx && hy) { hits++; toast.textContent = hits === 1 ? 'it hit the corner. finally.' : `corner #${hits}. i saw it.`; gsap.fromTo(toast, { autoAlpha: 1 }, { autoAlpha: 0, delay: 2, duration: 0.3, ease: 'steps(3)' }); }
      hist.unshift([x, y]); hist.length = Math.min(hist.length, trail.length);
      dot.style.transform = `translate(${x}px, ${y}px)`;
      trail.forEach((t, k) => { const p = hist[k + 1]; if (p) t.style.transform = `translate(${p[0]}px, ${p[1]}px)`; t.style.opacity = p ? 0.5 - k * 0.08 : 0; });
    }
    function tick(t, dt) { if (!on || leaving) return; acc += dt; if (acc > 83) { acc = 0; step(); } }
    gsap.ticker.add(tick);
    return {
      start() {
        if (on || reduced || MOB) return;
        on = true; leaving = false; S.hidden = false; hideMenu();
        const slot = ghost.querySelector('span');
        SZ = Math.round(clamp(slot.offsetWidth, 32, 96) / 4) * 4;
        dot.style.width = dot.style.height = SZ + 'px';
        trail.forEach((t) => { t.style.width = t.style.height = SZ + 'px'; t.style.opacity = 0; });
        hist = [];
        x = 40 + Math.random() * (stage.clientWidth - 200); y = 80 + Math.random() * (stage.clientHeight - 260);
        gsap.fromTo(S, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'steps(3)' });
      },
      stop() {
        if (!on || leaving) return;
        // the full stop goes back where it belongs, then the desk comes back
        leaving = true;
        const r = ghost.querySelector('span').getBoundingClientRect(), s = sr();
        trail.forEach((t) => (t.style.opacity = 0));
        gsap.set(dot, { x, y });
        gsap.to(dot, { x: r.left - s.left, y: r.top - s.top, duration: 0.42, ease: 'steps(6)',
          onComplete: () => {
            gsap.to(S, { autoAlpha: 0, duration: 0.2, delay: 0.25, ease: 'steps(2)', onComplete: () => { on = false; leaving = false; S.hidden = true; gsap.set(dot, { clearProps: 'transform' }); } });
          } });
      },
      get on() { return on; },
    };
  })();
  let idleT = 0;
  const IDLE = 28000;
  const wake = () => { idleT = performance.now(); if (saver.on) saver.stop(); };
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => addEventListener(ev, wake, { passive: true }));
  lenis.on?.('scroll', wake);
  setInterval(() => { if (inViewMost && booted && !saver.on && performance.now() - idleT > IDLE) saver.start(); }, 1000);

  // ---------- pixel cursor (the needle turns into a pixel arrow in here) ----------
  const pc = h('div.dg-pc', { 'aria-hidden': 'true', html: pix(BM.arrow, { scale: 2, pal: { '#': RED, o: INK } }) + pix(BM.hand, { scale: 2, pal: { '#': PAPER, o: INK }, cls: 'dg-pc-hand' }) });
  stage.append(pc);
  let pcX = -99, pcY = -99, pcIn = false;
  const fine = matchMedia('(pointer: fine)').matches && !ctx.isTouch && document.documentElement.classList.contains('has-needle');
  function pcMove(cx, cy) {
    const s = sr();
    pcX = Math.round((cx - s.left) / 2) * 2; pcY = Math.round((cy - s.top) / 2) * 2;
    pc.style.transform = `translate(${pcX}px, ${pcY}px)`;
  }
  if (fine) {
    let lx = 0, ly = 0;
    stage.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; pcIn = true; stage.classList.add('has-pc'); cursor.hide?.(); pcMove(e.clientX, e.clientY); });
    stage.addEventListener('pointerleave', () => { pcIn = false; stage.classList.remove('has-pc'); cursor.show?.(); });
    stage.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (!pcIn) { pcIn = true; stage.classList.add('has-pc'); cursor.hide?.(); }
      lx = e.clientX; ly = e.clientY; pcMove(lx, ly);
      const hot = e.target.closest('button, a, .dg-tbar, .dg-film, .dg-filmwrap, .dg-view');
      pc.classList.toggle('is-hand', !!hot);
    }, { passive: true });
    lenis.on?.('scroll', () => { if (pcIn) pcMove(lx, ly); });
  }

  // ---------- BOOT PIXELS: the zoom ends in big pixels. the desktop resolves out of them. ----------
  const bootPx = h('canvas.dg-bootpx', { 'aria-hidden': 'true' });
  const useBootPx = !reduced;
  if (useBootPx) stage.append(bootPx);
  let arrowImg = null;
  if (useBootPx) {
    arrowImg = new Image();
    arrowImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ARROW_SVG.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
  }
  const posterCache = {};
  function posterImg(it) {
    const u = posterOf(it);
    if (!u) return null;
    if (!posterCache[u]) { const im = new Image(); im.decoding = 'async'; im.src = u; posterCache[u] = im; }
    return posterCache[u];
  }
  // offset of a node inside a positioned ancestor (layout box, ignores the window's tilt)
  function offIn(node, root) {
    let x = 0, y = 0, n = node;
    while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return n === root ? [x, y] : null;
  }
  // a rough raster of the desktop at 1/4 size: wallpaper, windows (tilted), their pictures, the dock
  function rasterDesk() {
    const SW = stage.clientWidth, SH = MOB ? Math.min(stage.clientHeight, innerHeight) : stage.clientHeight;
    const q = 0.25;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(SW * q)); c.height = Math.max(1, Math.ceil(SH * q));
    const g = c.getContext('2d');
    g.scale(q, q);
    g.fillStyle = BLUE; g.fillRect(0, 0, SW, SH);
    const s = sr();
    const rectIn = (n) => { const r = n.getBoundingClientRect(); return [r.left - s.left, r.top - s.top, r.width, r.height]; };
    const box = (x, y, w, ht, fill, ring = true, shadow = 0) => {
      if (shadow) { g.fillStyle = INK; g.fillRect(x + shadow, y + shadow, w, ht); }
      if (ring) { g.fillStyle = INK; g.fillRect(x - 2, y - 2, w + 4, ht + 4); }
      g.fillStyle = fill; g.fillRect(x, y, w, ht);
    };
    if (!MOB) {
      // wallpaper bits
      ICONS.forEach((ic) => { if (!ic.el.offsetWidth) return; const [x, y] = rectIn(ic.el); g.fillStyle = ic.col; g.fillRect(x + 30, y + 8, 40, 36); });
      if (countEl.offsetWidth) { const [x, y, w, ht] = rectIn(countEl); g.strokeStyle = YEL; g.lineWidth = 5; g.strokeRect(x + w * 0.1, y + ht * 0.1, w * 0.8, ht * 0.8); g.fillStyle = RED; g.fillRect(x + w * 0.25, y + ht * 0.2, w * 0.15, ht * 0.6); g.fillRect(x + w * 0.58, y + ht * 0.2, w * 0.15, ht * 0.6); }
      if (arrowImg?.complete && bigArrow.offsetWidth && getComputedStyle(bigArrow).display !== 'none') { const [x, y, w, ht] = rectIn(bigArrow); g.drawImage(arrowImg, x, y, w, ht); }
    }
    Object.values(wins)
      .filter((W) => W.open && !W.min && !W.el.hidden && W.el.offsetWidth)
      .sort((a, b) => (+a.el.style.zIndex || 0) - (+b.el.style.zIndex || 0))
      .forEach((W) => {
        const w = W.el.offsetWidth, ht = W.el.offsetHeight;
        let x = W.x, y = W.y;
        if (MOB) { const r = rectIn(W.el); x = r[0]; y = r[1]; }
        const f = W.el.classList.contains('is-focus');
        const rot = MOB || f ? 0 : (W.rot * Math.PI) / 180;
        g.save();
        g.translate(x + w / 2, y + ht * 0.2); g.rotate(rot); g.translate(-w / 2, -ht * 0.2);
        box(0, 0, w, ht, PAPER, true, f ? 9 : 5);
        g.fillStyle = f ? YEL : PAPER2; g.fillRect(0, 0, w, 32);
        g.fillStyle = INK; g.fillRect(0, 32, w, 2);
        // the pictures inside it
        if (W.id === 'player') {
          const o = offIn(player.view, W.el);
          if (o) {
            const vw = player.view.offsetWidth, vh = player.view.offsetHeight;
            g.fillStyle = INK; g.fillRect(o[0], o[1], vw, vh);
            const pim = player.item && posterImg(player.item);
            if (pim?.complete && pim.naturalWidth) fitDraw(g, pim, o[0], o[1], vw, vh, 'contain');
          }
        }
        W.el.querySelectorAll('.dg-strip-im img, .dg-icon-im img, .dg-fthumb img').forEach((im) => {
          if (!im.complete || !im.naturalWidth || !im.offsetWidth) return;
          const o = offIn(im, W.el);
          if (o) fitDraw(g, im, o[0], o[1], im.offsetWidth, im.offsetHeight, 'cover');
        });
        // text reads as grey rows at this size
        if (W.id === 'readme' || W.id === 'info') {
          g.fillStyle = 'rgba(21,18,15,.28)';
          for (let ry = 52; ry < ht - 14; ry += 22) g.fillRect(14, ry, w * (0.55 + ((ry * 7) % 30) / 100), 5);
        }
        g.restore();
      });
    if (!MOB) {
      [bar, dock].forEach((n) => { if (!n.offsetWidth) return; const [x, y, w, ht] = rectIn(n); box(x, y, w, ht, PAPER, true, n === dock ? 6 : 0); });
    }
    return c;
  }
  let bootSrc = null, bootTimer = 0, bootDone = !useBootPx;
  const BOOT_STEPS = [44, 30, 20, 12, 8];
  function drawBlocks(b, keep = null) {
    if (!bootSrc) return;
    const SW = stage.clientWidth, SH = MOB ? Math.min(stage.clientHeight, innerHeight) : stage.clientHeight;
    if (bootPx.width !== SW || bootPx.height !== SH) { bootPx.width = SW; bootPx.height = SH; }
    const w = Math.max(1, Math.ceil(SW / b)), ht = Math.max(1, Math.ceil(SH / b));
    const sm = document.createElement('canvas');
    sm.width = w; sm.height = ht;
    const s = sm.getContext('2d');
    s.imageSmoothingEnabled = true; s.imageSmoothingQuality = 'medium';
    s.drawImage(bootSrc, 0, 0, w, ht);
    const g = bootPx.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, SW, SH);
    g.drawImage(sm, 0, 0, w, ht, 0, 0, w * b, ht * b);
    bootPx.classList.remove('is-blank');
    if (keep) { // dissolve: punch out the cells that are already gone
      for (let i = 0; i < keep.cut; i++) { const cell = keep.order[i]; g.clearRect((cell % w) * b, Math.floor(cell / w) * b, b, b); }
    }
    return [w, ht];
  }
  function bootPrime() {
    if (!useBootPx || booted || bootDone) return;
    try { bootSrc = rasterDesk(); drawBlocks(BOOT_STEPS[0]); bootPx.style.opacity = 1; } catch (e) { bootPx.style.opacity = 0; }
  }
  function bootDissolve(after) {
    if (!useBootPx || bootDone) { after?.(); return; }
    try { bootSrc = rasterDesk(); } catch (e) { bootPx.style.opacity = 0; bootDone = true; after?.(); return; }
    bootPx.style.opacity = 1;
    let i = 0;
    const last = BOOT_STEPS[BOOT_STEPS.length - 1];
    let dis = null;
    const frame = () => {
      if (i < BOOT_STEPS.length) { drawBlocks(BOOT_STEPS[i++]); bootTimer = setTimeout(frame, i === 1 ? 140 : 80); return; }
      if (!dis) {
        const [w, ht] = drawBlocks(last);
        const r = rng(42), order = Array.from({ length: w * ht }, (_, k) => k);
        for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
        dis = { order, cut: 0, n: order.length, step: 0 };
      }
      dis.step++;
      dis.cut = Math.round(dis.n * Math.min(1, dis.step / 4));
      if (dis.cut >= dis.n) { bootPx.style.opacity = 0; bootDone = true; return; }
      drawBlocks(last, dis);
      bootTimer = setTimeout(frame, 80);
    };
    frame();
    after?.();
  }

  // ---------- layout ----------
  // three desks: wide (≥1180), tablet (760–1179, landscape or portrait), phone (stacked, CSS).
  // short screens (≤820 tall) get a tighter version of wide so the dock never falls off.
  function layout(reset = false) {
    MOB = mob();
    stage.classList.toggle('is-mob', MOB);
    if (MOB) {
      MODE = 'mob';
      stage.classList.remove('is-tab', 'is-short');
      wins.drawer.el.classList.remove('is-narrow');
      Object.values(wins).forEach((W) => {
        gsap.set(W.el, { clearProps: 'transform,opacity,visibility,left,top,zIndex,width' });
        W.el.style.left = W.el.style.top = W.el.style.width = '';
        W.el.hidden = false;
        if (W.id !== 'trash') { W.open = true; W.min = false; }
        W.el.classList.toggle('is-open', W.open);
      });
      wins.drawer.body.style.height = '';
      ICONS.forEach((ic) => { ic.el.style.left = ic.el.style.top = ''; });
      [countEl, countNote, bigArrow, arrowNote].forEach((n) => { n.style.left = n.style.top = n.style.width = ''; });
      syncDock();
      return;
    }
    const SW = stage.clientWidth, SH = stage.clientHeight;
    const tab = SW < 1180;
    const short = !tab && SH < 840;
    const portrait = tab && SH > SW * 1.05;
    MODE = tab ? (portrait ? 'tabp' : 'tab') : short ? 'short' : 'wide';
    stage.classList.toggle('is-tab', tab);
    stage.classList.toggle('is-short', short);
    const top = 64, dockTop = SH - 96;
    const RG = 56; // keep clear of the care label on the right edge
    // desktop icons, top-left column (hidden on tablets: the dock does that job there)
    ICONS.forEach((ic, k) => {
      if (ic.moved && !reset) return;
      ic.pos.x = 16; ic.pos.y = 80 + k * 96;
      ic.el.style.left = ic.pos.x + 'px'; ic.el.style.top = ic.pos.y + 'px';
      ic.moved = false;
    });
    const L = {};
    const chrome = 192; // player height minus its screen
    if (MODE === 'wide' || MODE === 'short') {
      const dw = clamp(Math.round(SW * 0.34), 400, 600);
      const dx = SW - dw - RG - 8;
      const dh = short ? clamp(SH * 0.36, 232, 300) : clamp(SH * 0.36, 300, 400);
      wins.drawer.body.style.height = Math.round(dh) + 'px';
      // the player takes what's left between the icon column and the drawer, capped by height
      const roomH = short ? dockTop - top - 8 : SH - top - 330;
      const pw = Math.round(clamp(Math.min(dx - 128 - 40, (roomH - chrome) * 16 / 9 + 16, 900), 420, 900));
      L.player = { x: 128, y: top + 8, w: pw, rot: 0 };
      L.drawer = { x: dx, y: top + 16, w: dw, rot: 1.5 };
      L.info = { w: clamp(Math.round(SW * 0.19), 272, 328), rot: -2 };
      L.info.x = SW - RG - 8 - L.info.w;
      L.info.y = top + 40;
      L.readme = { x: 104, y: 0, w: 360, rot: -2.5 };
      L.trash = { x: Math.round(SW * 0.42), y: top + 120, w: 336, rot: 2.5 };
      if (short) { L.readme.w = Math.min(SW - RG - 8 - (dx - 24), 440); }
    } else if (MODE === 'tab') {
      const pw = Math.round(clamp(Math.min(SW * 0.56, (dockTop - top - 16 - chrome) * 16 / 9 + 16), 400, 640));
      L.player = { x: 24, y: top + 8, w: pw, rot: 0 };
      const dx = 24 + pw + 24, dw = SW - dx - RG;
      wins.drawer.body.style.height = Math.round(clamp(SH * 0.4, 280, 330)) + 'px';
      L.drawer = { x: dx, y: top + 16, w: dw, rot: 1.5 };
      L.readme = { x: dx + 8, y: 0, w: Math.min(dw - 8, 360), rot: -2 };
      L.info = { x: dx, y: top + 40, w: Math.min(dw, 300), rot: -2 };
      L.trash = { x: Math.round(SW * 0.3), y: top + 120, w: 320, rot: 2.5 };
    } else { // tablet portrait
      const pw = SW - 24 - RG - 8;
      L.player = { x: 24, y: top + 8, w: pw, rot: 0 };
      wins.drawer.body.style.height = Math.round(clamp(SH * 0.27, 280, 340)) + 'px';
      const dw = Math.round(pw * 0.56);
      L.drawer = { x: 24, y: 0, w: dw, rot: 1 };
      L.readme = { x: 24 + dw + 8, y: 0, w: SW - RG - 8 - (24 + dw + 8), rot: -2 };
      L.info = { x: SW - RG - 300, y: top + 40, w: 300, rot: -2 };
      L.trash = { x: Math.round(SW * 0.3), y: top + 120, w: 320, rot: 2.5 };
    }
    wins.drawer.el.classList.toggle('is-narrow', L.drawer.w < 440);
    Object.entries(L).forEach(([id, l]) => {
      const W = wins[id];
      W.el.style.width = l.w + 'px';
      if (W.moved && !reset) return;
      W.rot = l.rot;
    });
    const pH = wins.player.el.offsetHeight, dH = wins.drawer.el.offsetHeight, iH = wins.info.el.offsetHeight, rH = wins.readme.el.offsetHeight;
    const pB = L.player.y + pH, dB = L.drawer.y + dH;
    // which windows sit on this desk, which start in the dock
    let infoOn = true;
    if (MODE === 'wide') {
      L.info.y = clamp(dB + 24, top, dockTop - iH + 24);
      L.readme.y = clamp(pB + 24, top + 160, SH - rH - 24);
      infoOn = L.info.y + iH < SH - 8;
    } else if (MODE === 'short') {
      // no room under the player: the readme sits under the drawer, info waits in the dock
      L.readme.x = L.drawer.x - 24;
      L.readme.w = Math.min(L.readme.w, SW - RG - 8 - L.readme.x);
      L.readme.y = clamp(dB + 20, top, SH - rH - 16);
      infoOn = false;
    } else if (MODE === 'tab') {
      L.readme.y = clamp(dB + 20, top, SH - rH - 16);
      infoOn = false;
    } else {
      L.drawer.y = pB + 24;
      L.readme.y = pB + 40;
      infoOn = false;
    }
    const iW = wins.info;
    if (!infoOn && (reset || iW.auto || (!iW.moved && iW.open && !iW.min))) {
      if (iW.open && !iW.min) { iW.auto = true; minimise('info', { instant: true }); }
    } else if (infoOn && iW.auto && iW.min) {
      iW.auto = false; iW.min = false; iW.el.hidden = false; gsap.set(iW.el, { autoAlpha: 1, x: 0, y: 0, scale: 1 });
    }
    Object.entries(L).forEach(([id, l]) => {
      const W = wins[id];
      if (W.moved && !reset) {
        place(W, clamp(W.x, -W.el.offsetWidth + 80, SW - 60), clamp(W.y, 48, SH - 40));
        return;
      }
      W.moved = false;
      place(W, Math.round(l.x / GRID) * GRID, Math.round(l.y / GRID) * GRID);
      if (!W.min) gsap.set(W.el, { rotation: W.el.classList.contains('is-focus') ? 0 : W.rot, x: 0, y: 0 });
    });
    // the dock: centred on the wide desk; on short screens and tablets it tucks under the player
    if (MODE === 'short') dock.style.left = Math.round(L.player.x + L.player.w - dock.offsetWidth / 2) + 'px';
    else if (MODE === 'tab') dock.style.left = Math.round(L.player.x + L.player.w / 2) + 'px';
    else if (MODE === 'tabp') dock.style.left = Math.round(SW - RG - 8 - dock.offsetWidth / 2) + 'px';
    else dock.style.left = '';
    const dockL = dock.offsetLeft - dock.offsetWidth / 2;
    // wallpaper bits: the count, its note, the giant arrow + its note
    const show = (n, on) => n.classList.toggle('is-off', !on);
    if (MODE === 'wide') {
      const cx = L.readme.x + L.readme.w + 24;
      const cw = clamp(Math.min(240, (SH - pB - 120) / 0.9), 150, 240);
      countEl.style.width = cw + 'px';
      countEl.style.left = cx + 'px';
      countEl.style.top = clamp(pB + 8, top + 200, SH - cw * 0.9 - 104) + 'px';
      countNote.style.left = cx + cw * 0.9 + 'px';
      countNote.style.top = clamp(pB + cw * 0.42, top + 260, SH - 156) + 'px';
      const ax = clamp(128 + L.player.w + 16, 128 + L.player.w - 40, L.drawer.x - 100);
      const ay = clamp(L.drawer.y + 168, top + 120, SH - 360);
      bigArrow.style.left = ax + 'px'; bigArrow.style.top = ay + 'px';
      arrowNote.style.left = ax + 8 + 'px';
      arrowNote.style.top = Math.max(ay + 184, dB + 32) + 'px';
      show(countEl, true); show(countNote, true); show(bigArrow, L.drawer.x - (128 + L.player.w) > 90); show(arrowNote, true);
    } else if (MODE === 'short' && dock.offsetTop - pB > 120) {
      // a band between the player and the dock: count, its note, the "click stuff" note
      const cw = 120, band = dock.offsetTop - pB, x0 = L.player.x + 8;
      countEl.style.width = cw + 'px';
      countEl.style.left = x0 + 'px';
      countEl.style.top = pB + Math.max(4, (band - cw * 0.9) / 2) + 'px';
      countNote.style.left = x0 + cw + 4 + 'px';
      countNote.style.top = pB + band / 2 - 26 + 'px';
      arrowNote.style.left = x0 + cw + 214 + 'px';
      arrowNote.style.top = pB + band / 2 - 22 + 'px';
      show(countEl, true); show(countNote, true); show(bigArrow, false);
      show(arrowNote, x0 + cw + 214 + 180 < L.drawer.x - 8);
    } else if (MODE === 'short') {
      // bottom-left corner, under the icons and beside the dock
      const cw = 104;
      countEl.style.width = cw + 'px';
      countEl.style.left = '16px';
      countEl.style.top = SH - 16 - cw * 0.9 + 'px';
      countNote.style.left = L.player.x + 'px';
      countNote.style.top = Math.max(pB + 12, SH - 72) + 'px';
      show(countEl, SH - 16 - cw * 0.9 > 80 + 4 * 96); show(countNote, dockL - L.player.x > 180 && SH - pB > 64);
      show(bigArrow, false); show(arrowNote, false);
    } else if (MODE === 'tab') {
      // the band between the player and the dock: count, its note, the "click stuff" note
      const cw = 112, band = dock.offsetTop - pB;
      countEl.style.width = cw + 'px';
      countEl.style.left = '32px';
      countEl.style.top = pB + Math.max(4, (band - cw * 0.9) / 2) + 'px';
      countNote.style.left = 32 + cw + 4 + 'px';
      countNote.style.top = pB + band / 2 - 26 + 'px';
      arrowNote.style.left = 32 + cw + 210 + 'px';
      arrowNote.style.top = pB + band / 2 - 22 + 'px';
      show(countEl, band > 96); show(countNote, band > 70); show(bigArrow, false);
      show(arrowNote, band > 70 && 32 + cw + 210 + 180 < L.player.x + L.player.w + 16);
    } else {
      // portrait tablet: count bottom-left, under the drawer; the dock sits bottom-right
      const y0 = Math.max(L.drawer.y, L.readme.y) + Math.max(dH, rH) + 16;
      const cw = Math.round(clamp((SH - 16 - y0) / 0.9, 90, 150));
      const y = Math.max(y0, SH - 16 - cw * 0.9);
      countEl.style.width = cw + 'px';
      countEl.style.left = '32px';
      countEl.style.top = y + 'px';
      countNote.style.left = 32 + cw + 4 + 'px';
      countNote.style.top = y + cw * 0.3 + 'px';
      show(countEl, y + cw * 0.9 < SH); show(countNote, y + cw * 0.9 < SH && dockL - (32 + cw) > 190); show(bigArrow, false); show(arrowNote, false);
    }
    if (reset && !reduced && booted) {
      Object.values(wins).forEach((W, i) => {
        if (!W.open || W.min) return;
        gsap.fromTo(W.el, { y: -10 }, { y: 0, duration: 0.24, ease: 'steps(3)', delay: i * 0.05 });
      });
    }
    syncDock();
  }

  // ---------- visibility, boot ----------
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      inView = e.isIntersecting;
      inViewMost = e.intersectionRatio > 0.6;
      // boot once half the desk is on screen (or all of it, when the stage is taller than the screen)
      const enough = e.intersectionRatio >= 0.45 || e.intersectionRect.height >= innerHeight * 0.55;
      if (inView && !booted && enough) boot();
      if (!inView && player.item?.kind === 'video') player.pause();
      if (inView && player.item?.kind === 'video' && player.wantPlay) player.play();
    });
  }, { threshold: [0, 0.2, 0.35, 0.45, 0.6, 0.9] });
  io.observe(stage);
  // "near": start fetching big frames a screen before you get here
  const nearIO = new IntersectionObserver(([e]) => {
    near = e.isIntersecting;
    if (near) { player.upgrade(); if (!booted) { posterImg(player.item); bootPrime(); } }
  }, { rootMargin: '100% 0px 100% 0px' });
  nearIO.observe(stage);

  // boil the hand-drawn count at 8fps
  const turb = countEl.querySelector('feTurbulence');
  let seed = 3;
  if (!reduced) setInterval(() => { if (inView) { seed = (seed % 7) + 1; turb.setAttribute('seed', seed); } }, 125);

  // closed at start: trash. everything else is "restored from last session"
  wins.trash.open = false; wins.trash.el.hidden = true;

  function boot() {
    booted = true;
    if (MOB || reduced) {
      Object.values(wins).forEach((W) => { if (W.open && !W.min) gsap.set(W.el, { autoAlpha: 1 }); });
      bootPx.style.opacity = 0; bootDone = true;
      if (!reduced) {
        player.play();
        const it = player.item;
        if (it) player.pixelIn(it.kind === 'video' ? '' : ctx.img(it.frames[0], 's'));
      }
      return;
    }
    // windows are already in place under the pixels; the pixels resolve, then the session "restores"
    const order = ['readme', 'info', 'drawer', 'player'].filter((id) => wins[id].open && !wins[id].min);
    order.forEach((id) => gsap.set(wins[id].el, { autoAlpha: 1 }));
    gsap.set([bigArrow, arrowNote, countNote], { autoAlpha: 1 });
    gsap.set(countEl.querySelectorAll('.dg-count-a, .dg-count-b'), { strokeDashoffset: 420 });
    gsap.set(countEl.querySelector('.dg-count-c'), { strokeDashoffset: 1200 });
    bootDissolve();
    const msgs = ['restoring session..', `${items.length} files, ${totalFrames} frames..`, '0 slop. ok.', ''];
    const tl = gsap.timeline({ delay: 0.1 });
    msgs.forEach((m, i) => tl.call(() => { bootLine.textContent = m; }, null, i * 0.32));
    tl.call(() => { focus('player'); wins.player.el.style.zIndex = ++Z; player.play(); }, null, 0.75);
    tl.fromTo(countEl.querySelectorAll('.dg-count-a, .dg-count-b'), { strokeDashoffset: 420 }, { strokeDashoffset: 0, duration: 0.7, ease: 'steps(8)', stagger: 0.12 }, 0.9);
    tl.fromTo(countEl.querySelector('.dg-count-c'), { strokeDashoffset: 1200 }, { strokeDashoffset: 0, duration: 0.6, ease: 'steps(6)' }, 1.4);
  }

  // ---------- start ----------
  layout(true);
  wins.readme.el.style.zIndex = ++Z;
  wins.info.el.style.zIndex = ++Z;
  wins.drawer.el.style.zIndex = ++Z;
  focus('player');
  wins.player.el.style.zIndex = ++Z;
  if (!booted) player.load(items[0], 0, false, { fx: false });
  if (!MOB && !reduced && !booted) { bootPx.style.opacity = 1; bootPx.classList.add('is-blank'); } // solid cobalt until it's primed
  syncDock();
  document.fonts?.ready.then(() => { layout(false); if (!booted) bootPrime(); });
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const was = MOB; layout(was !== mob()); if (!booted) bootPrime(); }, 150); });

  // debug hooks for screenshots / tests
  window.__digital = { open: openWin, close: closeWin, minimise, focus, explode, implode, saver, retry, layout, player, browser, wins,
    load: (id, f = 0) => player.load(byId[id], f, false), boot: () => { if (!booted) boot(); }, get mode() { return MODE; } };
}
