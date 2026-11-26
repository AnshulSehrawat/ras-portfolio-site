// THE DIGITAL DRAWER: you zoomed into the full stop of RA.S. it was a pixel. now you're inside a computer.
// a small, slightly wrong desktop: paper windows on a cobalt wallpaper, an 8px grid, a pixel cursor,
// a file browser, a player that plays frame sequences (and real mp4s once they exist), an info panel,
// a dock with a clock, a zip that explodes, a screensaver. everything moves in steps, on purpose.
import { h, clamp, rng } from '../core/util.js';
import { drawer } from '../content/digital.js';

const GRID = 8;
const INK = '#15120F', PAPER = '#F2EDE1', RED = '#E5331F', YEL = '#FFD43B', BLUE = '#2443F0';
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
  const mob = () => innerWidth < 760;
  let MOB = mob();

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
  const bigArrow = h('div.dg-bigarrow', { html: pix(BM.arrow, { scale: 9, pal: { '#': RED, o: PAPER } }) });
  const arrowNote = h('p.dg-arrow-note', {}, 'click stuff. drag stuff.', h('br'), 'right-click too.');
  const wallCap = h('p.dg-wallcap', {}, h('b', {}, 'DIGITAL / MOVING IMAGES'), h('span', {}, 'made with ai, picked by hand'));
  const hero = h('div.dg-hero', {}, countEl, countNote);
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
    const minB = h('button.dg-wb', { type: 'button', 'aria-label': 'minimise ' + title, 'data-hot': '' }, '_');
    const xB = h('button.dg-wb', { type: 'button', 'aria-label': 'close ' + title, 'data-hot': '' }, 'x');
    const tbar = h('div.dg-tbar', {}, h('span.dg-tico', { html: icon }), h('span.dg-ttl', {}, title), h('span.dg-tpath', {}, path),
      h('span.dg-wbs', {}, minB, closable ? xB : null));
    const body = h('div.dg-wbody');
    const w = h('div.dg-win.dg-win--' + id, { 'data-win': id, role: 'region', 'aria-label': title }, tbar, body);
    desk.append(w);
    const W = wins[id] = { id, el: w, tbar, body, open: true, min: false, rot: 0, moved: false, x: 0, y: 0, title };
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
    W.open = true; W.min = false;
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

  function minimise(id) {
    const W = wins[id];
    if (!W || !W.open) return;
    if (MOB) return;
    W.min = true;
    const d = dockPos(id);
    W.el.classList.remove('is-focus');
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

  // ---------- PLAYER ----------
  const player = (() => {
    const W = makeWin('player', { title: 'player', path: './clips', icon: ICON.player(1.15) });
    const layers = h('div.dg-layers');
    const busy = h('p.dg-busy', {}, 'loading frames..');
    const hudL = h('span.dg-hud.dg-hud--l', {}, '● frame sequence');
    const hudR = h('span.dg-hud.dg-hud--r', {}, 'frm 01/01');
    const view = h('div.dg-view', {}, layers, busy, hudL, hudR);
    const bPrev = h('button.dg-pb', { type: 'button', 'aria-label': 'previous frame', html: pix(BM.prev, { scale: 2 }) });
    const bPlay = h('button.dg-pb.dg-pb--play', { type: 'button', 'aria-label': 'play / pause', html: pix(BM.play, { scale: 2 }) });
    const bNext = h('button.dg-pb', { type: 'button', 'aria-label': 'next frame', html: pix(BM.next, { scale: 2 }) });
    const tc = h('span.dg-tc', {}, '00:00:00:00');
    const bFps = h('button.dg-chip', { type: 'button', title: 'playback speed' }, '8 fps');
    const bBlend = h('button.dg-chip', { type: 'button', title: 'crossfade between frames' }, 'blend off');
    const bOpen = h('button.dg-chip.dg-chip--open', { type: 'button', title: 'open every frame big' }, 'frames ⤢');
    const film = h('div.dg-film', { 'data-lenis-prevent': '' });
    const head = h('div.dg-head');
    const filmWrap = h('div.dg-filmwrap', {}, film, head);
    const capT = h('b', {}, '');
    const capK = h('span', {}, '');
    const capN = h('span.dg-cap-note', {}, '');
    W.body.append(view,
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
    function show(i) {
      if (!it || it.kind === 'video') return;
      const prev = idx;
      idx = ((i % n) + n) % n;
      const cur = imgs[idx];
      if (cur) {
        const d = it.blend && !scrubbing ? Math.round((1000 / it.fps) * 0.7) : 0;
        cur.style.zIndex = ++zTop;
        cur.style.transition = d ? `opacity ${d}ms linear` : 'none';
        cur.style.opacity = 1;
        imgs.forEach((im, k) => {
          if (k === idx) return;
          clearTimeout(im._t);
          if (k === prev && d) im._t = setTimeout(() => { if (idx !== k) { im.style.transition = 'none'; im.style.opacity = 0; } }, d + 30);
          else { im.style.transition = 'none'; im.style.opacity = 0; }
        });
      }
      hud();
    }
    function load(item, at = 0, autoplay = wantPlay) {
      it = item; idx = 0; acc = 0;
      layers.textContent = ''; imgs = []; film.textContent = '';
      if (vid) { vid.pause(); vid.remove(); vid = null; }
      W.el.querySelector('.dg-ttl').textContent = it.title + (it.kind === 'video' ? '.mp4' : it.kind === 'frames' ? '.seq' : '.png');
      W.el.querySelector('.dg-tpath').textContent = './' + it.folder;
      W.el.dataset.kind = it.kind;
      capT.textContent = it.title;
      capK.textContent = it.kind === 'video' ? 'video' : it.kind === 'frames' ? `frame sequence · ${it.frames.length} frames` : 'still · 1 frame';
      capN.textContent = it.note || '';
      hudL.textContent = it.kind === 'video' ? '● video' : it.kind === 'frames' ? '● frame sequence' : '● still. it doesn\'t move. it\'s fine.';
      bFps.textContent = it.kind === 'video' ? `${it.fps || 24} fps` : `${it.fps} fps`;
      bBlend.textContent = it.blend ? 'blend on' : 'blend off';
      busy.hidden = false;
      view.style.setProperty('--ar', it.w && it.h ? `${it.w} / ${it.h}` : '16 / 9');

      if (it.kind === 'video') {
        n = 1;
        vid = h('video', { src: it.src, muted: true, playsinline: true, loop: true, preload: 'auto', poster: it.poster ? src(it.poster) : null });
        vid.muted = true;
        vid.addEventListener('loadeddata', () => { busy.hidden = true; hud(); });
        vid.addEventListener('loadedmetadata', () => {
          it._dur = vid.duration; it.w = it.w || vid.videoWidth; it.h = it.h || vid.videoHeight;
          view.style.setProperty('--ar', `${it.w} / ${it.h}`);
          info.set(it);
        }, { once: true });
        vid.addEventListener('timeupdate', hud);
        layers.append(vid);
        for (let k = 0; k < 24; k++) film.append(h('span.dg-tick'));
        head.style.width = '6px';
      } else {
        n = it.frames.length;
        it.frames.forEach((id, k) => {
          const a = artById[id] || {};
          const im = h('img', { src: ctx.img(id), alt: k === 0 ? `${it.title}, frame ${k + 1}` : '', width: a.w, height: a.h, loading: 'lazy', decoding: 'async', draggable: 'false' });
          im.style.opacity = k === 0 ? 1 : 0;
          if (k === 0) im.addEventListener('load', () => { busy.hidden = true; }, { once: true });
          layers.append(im); imgs.push(im);
          const t = h('button.dg-fthumb', { type: 'button', 'aria-label': `frame ${k + 1}`, tabindex: '-1' },
            h('img', { src: ctx.img(id, 's'), alt: '', loading: 'lazy', decoding: 'async', width: a.w, height: a.h, draggable: 'false' }),
            h('i', {}, pad(k + 1)));
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
      show(at);
      if (canPlay && autoplay) play(); else setPlayIcon();
      info.set(it);
      browser.mark(it.id);
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

    bPlay.onclick = () => (playing ? pause(true) : play());
    bNext.onclick = () => { pause(true); if (vid) vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 1 / (it.fps || 24)); else show(idx + 1); };
    bPrev.onclick = () => { pause(true); if (vid) vid.currentTime = Math.max(0, vid.currentTime - 1 / (it.fps || 24)); else show(idx - 1); };
    bFps.onclick = () => {
      if (!it || it.kind !== 'frames') return;
      const k = FPS.indexOf(it.fps);
      it.fps = FPS[(k + 1) % FPS.length];
      bFps.textContent = `${it.fps} fps`; info.set(it); hud();
    };
    bBlend.onclick = () => { if (!it || it.kind !== 'frames') return; it.blend = !it.blend; bBlend.textContent = it.blend ? 'blend on' : 'blend off'; info.set(it); };
    bOpen.onclick = () => {
      if (!it) return;
      if (it.kind === 'video') { lightbox.open([{ src: posterOf(it), caption: it.title }], 0); return; }
      lightbox.open(it.frames.map((id, k) => ({ src: ctx.img(id), caption: `${it.title} · frame ${k + 1}/${it.frames.length}` })), idx);
    };
    view.addEventListener('click', () => (playing ? pause(true) : play()));

    // scrub on the filmstrip: snaps to frames, steps on purpose
    let wasPlaying = false;
    const scrubTo = (e) => {
      const r = film.getBoundingClientRect();
      const f = clamp((e.clientX - r.left) / r.width, 0, 0.9999);
      if (vid) { if (vid.duration) vid.currentTime = f * vid.duration; hud(); return; }
      if (Math.floor(f * n) !== idx) show(Math.floor(f * n));
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
    return { W, load, play, pause, get item() { return it; }, get playing() { return playing; }, get wantPlay() { return wantPlay; } };
  })();

  // ---------- INFO ----------
  const info = (() => {
    const W = makeWin('info', { title: 'info', path: 'get info', icon: ICON.info(1.2) });
    const dl = h('dl.dg-dl');
    W.body.append(dl);
    let cur = null;
    const row = (k, v, cls = '') => [h('dt', {}, k), h('dd' + cls, {}, v)];
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
        ...row('name', it.title + (it.kind === 'video' ? '.mp4' : it.kind === 'frames' ? '.seq' : '.png')),
        ...row('kind', it.kind === 'frames' ? 'frame sequence' : it.kind),
        ...row('where', `./${it.folder}`),
        ...row('size', it.w ? `${it.w} × ${it.h}` : 'from the file'),
        ...row('aspect', ratio(it.w, it.h)),
        ...row('frames', it.kind === 'video' ? (it._dur ? String(Math.round(it._dur * (it.fps || 24))) : '..') : pad(it.frames.length)),
        ...(it.kind === 'still' ? [] : row('plays at', `${it.fps || 24} fps${it.kind === 'frames' ? (it.blend ? ' · blend' : ' · hard cut') : ''}`)),
        ...row('length', len),
        ...row('made with', 'ai + a lot of re-tries', '.is-red'),
        ...row('picked by', h('span.dg-hand', {}, 'taste')),
        ...row('slop', 'removed'),
      );
      const fr = h('dd.dg-frm', {}, it.kind === 'frames' ? `01/${pad(it.frames.length)}` : '--');
      dl.append(h('dt', {}, 'now'), fr);
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
        const ext = it.kind === 'video' ? '.mp4' : it.kind === 'frames' ? '.seq' : '.png';
        let b;
        if (view === 'strips') {
          const tall = [0.72, 0.86, 0.96, 0.9, 0.78, 0.94, 0.82][k % 7];
          const im = h('img', { src: posterOf(it), alt: '', loading: 'lazy', decoding: 'async', draggable: 'false' });
          b = h('button.dg-strip', { type: 'button', style: { '--t': tall }, 'aria-label': `open ${it.title}` },
            h('span.dg-strip-l', {}, h('i', {}), it.title + ext),
            h('span.dg-strip-im', {}, im, it.kind === 'frames' ? h('span.dg-strip-n', {}, `${it.frames.length} frm`) : null));
          if (it.kind === 'frames') {
            b.addEventListener('pointermove', (e) => {
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
    { id: 'drawer', label: 'drawer', html: ICON.folder(3), act: () => { browser.go('clips'); openWin('drawer'); } },
    { id: 'zip', label: 'everything.zip', html: ICON.zip(3), act: () => explode() },
    { id: 'readme', label: 'readme.txt', html: ICON.text(3), act: () => openWin('readme') },
    { id: 'trash', label: 'trash', html: ICON.trash(3), act: () => openWin('trash') },
  ];
  ICONS.forEach((ic, k) => {
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
    const r = (MOB || !z.offsetParent ? DOCK.find((d) => d.id === 'zip').el : z).getBoundingClientRect(), s = sr();
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
  setInterval(() => { if (inViewMost && !saver.on && performance.now() - idleT > IDLE) saver.start(); }, 1000);

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

  // ---------- layout ----------
  function layout(reset = false) {
    MOB = mob();
    stage.classList.toggle('is-mob', MOB);
    if (MOB) {
      Object.values(wins).forEach((W) => {
        gsap.set(W.el, { clearProps: 'transform,opacity,visibility,left,top,zIndex' });
        W.el.style.left = W.el.style.top = '';
        W.el.hidden = false;
        if (W.id !== 'trash') { W.open = true; W.min = false; }
        W.el.classList.toggle('is-open', W.open);
      });
      ICONS.forEach((ic) => { ic.el.style.left = ic.el.style.top = ''; });
      syncDock();
      return;
    }
    const SW = stage.clientWidth, SH = stage.clientHeight;
    const top = 64, bottom = SH - 92;
    // desktop icons, top-left column
    ICONS.forEach((ic, k) => {
      if (ic.moved && !reset) return;
      ic.pos.x = 16; ic.pos.y = 88 + k * 96;
      ic.el.style.left = ic.pos.x + 'px'; ic.el.style.top = ic.pos.y + 'px';
      ic.moved = false;
    });
    const dw = clamp(Math.round(SW * 0.36), 400, 640);
    wins.drawer.body.style.height = Math.round(clamp(SH * 0.355, 300, 430)) + 'px';
    const dx = SW - dw - 66;
    // the player leaves a band under it for the readme, the count and the arrow
    const pw = Math.round(clamp(Math.min(SW * 0.44, dx - 128 + 30, (SH - 590) * 16 / 9 + 24), 430, 880));
    const L = {
      player: { x: 128, y: top + 8, w: pw, rot: 0 },
      drawer: { x: dx, y: top + 22, w: dw, rot: 1.5 },
      info: { x: SW - 66 - clamp(Math.round(SW * 0.19), 268, 330), y: 0, w: clamp(Math.round(SW * 0.19), 268, 330), rot: -2 },
      readme: { x: 100, y: 0, w: 352, rot: -2.5 },
      trash: { x: Math.round(SW * 0.42), y: top + 120, w: 330, rot: 2.5 },
    };
    Object.entries(L).forEach(([id, l]) => {
      const W = wins[id];
      W.el.style.width = l.w + 'px';
      if (W.moved && !reset) return;
      W.rot = l.rot;
    });
    const pH = wins.player.el.offsetHeight, dH = wins.drawer.el.offsetHeight, iH = wins.info.el.offsetHeight, rH = wins.readme.el.offsetHeight;
    const pB = L.player.y + pH, dB = L.drawer.y + dH;
    L.info.y = clamp(dB + 22, top, bottom - iH + 24);
    L.readme.y = clamp(pB + 24, top + 160, bottom - rH + 44);
    Object.entries(L).forEach(([id, l]) => {
      const W = wins[id];
      if (W.moved && !reset) {
        place(W, clamp(W.x, -W.el.offsetWidth + 80, SW - 60), clamp(W.y, 48, SH - 40));
        return;
      }
      W.moved = false;
      place(W, Math.round(l.x / GRID) * GRID, Math.round(l.y / GRID) * GRID);
      gsap.set(W.el, { rotation: W.el.classList.contains('is-focus') ? 0 : W.rot, x: 0, y: 0 });
    });
    // wallpaper bits live in the band under the player: readme | count | arrow | info
    const cx = L.readme.x + L.readme.w + 18;
    const cw = clamp(Math.min(250, (SH - pB - 110) / 0.9), 140, 250);
    countEl.style.width = cw + 'px';
    countEl.style.left = cx + 'px';
    countEl.style.top = clamp(pB + 4, top + 200, SH - cw * 0.9 - 96) + 'px';
    countNote.style.left = cx + cw * 0.9 + 'px';
    countNote.style.top = clamp(pB + cw * 0.42, top + 260, SH - 150) + 'px';
    // the giant pixel arrow sits in the gutter between player and drawer, clicking at the player
    const ax = clamp(128 + pw + 14, 128 + pw - 40, dx - 96);
    const ay = clamp(L.drawer.y + 170, top + 120, SH - 360);
    bigArrow.style.left = ax + 'px';
    bigArrow.style.top = ay + 'px';
    arrowNote.style.left = ax + 10 + 'px';
    arrowNote.style.top = Math.max(ay + 186, dB + 30) + 'px';
    if (reset && !reduced) {
      Object.values(wins).forEach((W, i) => {
        if (!W.open || W.min) return;
        gsap.fromTo(W.el, { y: -10 }, { y: 0, duration: 0.24, ease: 'steps(3)', delay: i * 0.05 });
      });
    }
  }

  // ---------- visibility, boot ----------
  let inView = false, inViewMost = false, booted = false;
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      inView = e.isIntersecting;
      inViewMost = e.intersectionRatio > 0.6;
      if (inView && !booted) boot();
      if (!inView && player.item?.kind === 'video') player.pause();
      if (inView && player.item?.kind === 'video' && player.wantPlay) player.play();
    });
  }, { threshold: [0, 0.35, 0.6, 0.9] });
  io.observe(stage);

  // boil the hand-drawn count at 8fps
  const turb = countEl.querySelector('feTurbulence');
  let seed = 3;
  if (!reduced) setInterval(() => { if (inView) { seed = (seed % 7) + 1; turb.setAttribute('seed', seed); } }, 125);

  // closed at start: trash. everything else is "restored from last session"
  wins.trash.open = false; wins.trash.el.hidden = true;

  function boot() {
    booted = true;
    if (MOB || reduced) {
      Object.values(wins).forEach((W) => { if (W.open) gsap.set(W.el, { autoAlpha: 1 }); });
      if (!reduced) player.play();
      return;
    }
    const order = ['readme', 'info', 'drawer', 'player'];
    const msgs = ['restoring session..', `${items.length} files, ${totalFrames} frames..`, '0 slop. ok.', ''];
    order.forEach((id) => gsap.set(wins[id].el, { autoAlpha: 0 }));
    const tl = gsap.timeline({ delay: 0.15 });
    order.forEach((id, i) => {
      tl.call(() => { bootLine.textContent = msgs[i]; }, null, i * 0.22);
      tl.fromTo(wins[id].el, { scale: 0.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'steps(4)' }, i * 0.22);
    });
    tl.call(() => { focus('player'); wins.player.el.style.zIndex = ++Z; player.play(); }, null, 0.75);
    tl.fromTo(countEl.querySelectorAll('.dg-count-a, .dg-count-b'), { strokeDashoffset: 420 }, { strokeDashoffset: 0, duration: 0.7, ease: 'steps(8)', stagger: 0.12 }, 0.4);
    tl.fromTo(countEl.querySelector('.dg-count-c'), { strokeDashoffset: 1200 }, { strokeDashoffset: 0, duration: 0.6, ease: 'steps(6)' }, 1.0);
    tl.fromTo([bigArrow, arrowNote, countNote], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'steps(2)', stagger: 0.15 }, 1);
  }

  // ---------- start ----------
  layout(true);
  wins.readme.el.style.zIndex = ++Z;
  wins.info.el.style.zIndex = ++Z;
  wins.drawer.el.style.zIndex = ++Z;
  focus('player');
  wins.player.el.style.zIndex = ++Z;
  if (!booted) player.load(items[0], 0, false);
  if (!MOB && !reduced && !booted) {
    ['readme', 'info', 'drawer', 'player'].forEach((id) => gsap.set(wins[id].el, { autoAlpha: 0 }));
    gsap.set([bigArrow, arrowNote, countNote], { autoAlpha: 0 });
  }
  syncDock();
  document.fonts?.ready.then(() => layout(false));
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const was = MOB; layout(was !== mob()); }, 150); });

  // debug hooks for screenshots / tests
  window.__digital = { open: openWin, close: closeWin, minimise, focus, explode, implode, saver, retry, layout, player, browser, wins,
    load: (id, f = 0) => player.load(byId[id], f, false) };
}
