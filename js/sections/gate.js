// RA.S gate: the owner's wordmark, a different mark on every return. Each letter is a window into a world.
// Scroll assembles the mark, holds, then zooms through the target letter into its world. Click any letter to jump.
import { h, svg, rng, clamp } from '../core/util.js';

const LOOK = {
  // field colour, patch colour, shape colour, how images sit in the letters
  patch: { bg: 'var(--paper)', fg: 'var(--ink)', patch: '#C94A35', shapes: '#15120F', thread: '#E5331F', mode: 'patch' },
  grid: { bg: 'var(--red)', fg: 'var(--paper)', shapes: '#F2EDE1', thread: '#F2EDE1', mode: 'fill' },
  block: { bg: 'var(--blue)', fg: 'var(--white)', shapes: '#FFFFFF', thread: '#FFD43B', mode: 'pixel' },
  rags: { bg: 'var(--ink)', fg: 'var(--paper)', patch: '#C94A35', shapes: '#F2EDE1', thread: '#FFD43B', mode: 'patch' },
};
// which world sits behind which letter
const LETTER_WORLD = { R: 'sketchbook', A: 'diary', '.': 'digital', g: 'digital', S: 'desk' };
let uid = 0;

export async function mount(el, ctx) {
  const { gsap, ScrollTrigger, site, logos, lenis, opts } = ctx;
  const { mark, target, n } = opts;
  const L = logos[mark];
  const look = LOOK[mark];
  const id = 'g' + (uid++);
  el.dataset.mark = mark;
  el.style.setProperty('--gate-bg', look.bg);
  el.style.setProperty('--gate-fg', look.fg);
  el.style.setProperty('--thread', look.thread);

  // ---------- svg mark ----------
  const pad = 40;
  const vb = `${-pad} ${-pad} ${L.w + pad * 2} ${L.h + pad * 2}`;
  const s = svg('svg', { viewBox: vb, class: 'gate-svg', 'aria-hidden': 'true' });
  const defs = svg('defs');
  s.append(defs);
  // pixelate filter for the digital gate
  if (look.mode === 'pixel') {
    defs.innerHTML = `<filter id="${id}-px" x="0" y="0" width="1" height="1">
      <feFlood x="4" y="4" height="2" width="2"/><feComposite width="14" height="14"/><feTile result="a"/>
      <feComposite in="SourceGraphic" in2="a" operator="in"/><feMorphology operator="dilate" radius="7"/></filter>`;
  }
  const letters = [];
  L.letters.forEach((l, i) => {
    const world = LETTER_WORLD[l.k];
    const inCut = ctx.worldsInCut.includes(world);
    const cid = `${id}-c${i}`;
    const windowPath = look.mode === 'patch' ? l.red : l.black;
    const clip = svg('clipPath', { id: cid }, svg('path', { d: windowPath }));
    defs.append(clip);
    const g = svg('g', { class: 'gate-letter', 'data-k': l.k, 'data-world': world, tabindex: inCut ? 0 : -1, role: 'link', 'aria-label': site.worlds[world].title });
    if (!inCut) g.classList.add('is-out');
    const win = svg('g', { 'clip-path': `url(#${cid})`, class: 'gate-win' });
    // the world preview fills the letter's bbox (worked out after it's in the DOM)
    const im = svg('image', { href: `media/gate/${world}.webp`, preserveAspectRatio: 'xMidYMid slice', class: 'gate-img' });
    win.append(im);
    if (look.mode === 'patch') win.append(svg('rect', { class: 'gate-tint', x: 0, y: 0, width: L.w, height: L.h, fill: look.patch }));
    if (look.mode === 'pixel') { im.setAttribute('href', `media/gate/${world}-px.png`); im.style.imageRendering = 'pixelated'; im.dataset.full = `media/gate/${world}.webp`; }
    const hit = svg('path', { d: windowPath, class: 'gate-hit', fill: 'transparent' });
    g.append(win, hit);
    if (look.mode === 'patch') {
      g.append(svg('path', { d: l.red, class: 'gate-edge', fill: 'none' }));
      g.append(svg('path', { d: l.black, class: 'gate-shape', fill: look.shapes }));
    } else {
      g.append(svg('path', { d: l.black, class: 'gate-edge', fill: 'none' }));
    }
    const slot = svg('g', { class: 'gate-slot' });
    slot.append(g); s.append(slot);
    letters.push({ k: l.k, world, g, slot, win, im, hit, inCut, path: windowPath, off: { x: 0, y: 0 } });
  });
  if (mark === 'grid') {
    // the owner's grid mark is built from tiles: hairline seams over the letters
    const lines = svg('g', { class: 'gate-gridlines' });
    const step = L.h / 3;
    for (let y = step; y < L.h - 1; y += step) lines.append(svg('line', { x1: 0, x2: L.w, y1: y, y2: y }));
    for (let x = 0; x < L.w; x += step) lines.append(svg('line', { x1: x, x2: x, y1: 0, y2: L.h }));
    s.append(lines);
  }

  // ---------- copy ----------
  const tw = site.worlds[target];
  const first = n === 0;
  const copy = h('div.gate-copy', {},
    h('p.gate-kicker', {}, first ? `RA.S — ${site.markLong}` : `RA.S, return ${n + 1}`),
    first
      ? h('p.gate-lede', {}, h('b', {}, 'RA.S = rags of thoughts. '), site.ras.explain)
      : h('p.gate-lede', {}, site.ras.returns[(n - 1) % site.ras.returns.length]),
  );
  const legend = h('ol.gate-legend', {}, L.letters.map((l) => {
    const w = LETTER_WORLD[l.k], ww = site.worlds[w];
    return h('li', { 'data-world': w, class: ctx.worldsInCut.includes(w) ? '' : 'is-out' },
      h('b', {}, l.k === '.' ? '·' : l.k), h('span', {}, h('i', {}, ww.word), ' ', ww.title));
  }));
  const hint = h('p.gate-hint', {}, h('span', {}, first ? site.ras.pick : 'keep scrolling'), h('em', {}, `→ ${tw.letter === '.' ? 'the dot' : tw.letter}: ${tw.title}`));
  const tag = h('div.gate-tag', { 'aria-hidden': 'true' }, h('b'), h('span'));
  const cover = h('div.gate-cover', { style: { background: tw.color } });
  const stage = h('div.gate-stage', {}, s);
  const ui = h('div.gate-ui', {}, copy, legend, hint);
  const pin = h('div.gate-pin', {}, ui, stage, tag, cover);
  el.append(pin);

  // size images to each letter's bbox
  await new Promise((r) => requestAnimationFrame(r));
  letters.forEach((lt) => {
    const b = lt.hit.getBBox();
    const m = 20;
    Object.entries({ x: b.x - m, y: b.y - m, width: b.width + m * 2, height: b.height + m * 2 }).forEach(([k, v]) => lt.im.setAttribute(k, v));
    lt.box = b;
    const tint = lt.g.querySelector('.gate-tint');
    if (tint) Object.entries({ x: b.x - m, y: b.y - m, width: b.width + m * 2, height: b.height + m * 2 }).forEach(([k, v]) => tint.setAttribute(k, v));
  });

  // phones: the mark stacks 2 x 2 (R A / . S) so the letters stay big
  if (ctx.mobile && letters.length === 4) {
    const gap = 50, rows = [letters.slice(0, 2), letters.slice(2)];
    const rowH = Math.max(...letters.map((l) => l.box.height));
    const rowW = rows.map((r) => r.reduce((a, l) => a + l.box.width, 0) + gap);
    const W = Math.max(...rowW);
    rows.forEach((r, ri) => {
      let x = (W - rowW[ri]) / 2;
      r.forEach((l) => {
        const b = l.box;
        l.off = { x: x - b.x, y: ri * (rowH + gap) + (rowH - b.height) - b.y };
        l.slot.setAttribute('transform', `translate(${l.off.x} ${l.off.y})`);
        x += b.width + gap;
      });
    });
    s.setAttribute('viewBox', `${-pad} ${-pad} ${W + pad * 2} ${rowH * 2 + gap + pad * 2}`);
    s.querySelector('.gate-gridlines')?.remove();
  }

  // ---------- focus point inside the target letter (deepest point of the shape) ----------
  const T = letters.find((l) => l.world === target && l.inCut) || letters[0];
  T.g.classList.add('is-target');
  const withOff = (lt) => { const f = deepestPoint(lt.hit, lt.box); return { ...f, x: f.x + lt.off.x, y: f.y + lt.off.y }; };
  const focus = withOff(T);

  // ---------- interaction: hover lifts a letter, click enters ----------
  const tagB = tag.querySelector('b'), tagS = tag.querySelector('span');
  letters.forEach((lt) => {
    const ww = site.worlds[lt.world];
    const enter = () => {
      if (!lt.inCut) return;
      pin.classList.add('is-hovering'); lt.g.classList.add('is-hot');
      legend.querySelector(`[data-world="${lt.world}"]`)?.classList.add('is-hot');
      tagB.textContent = lt.k === '.' ? 'the dot' : lt.k; tagS.textContent = `${ww.word} — ${ww.title} →`;
      tag.classList.add('is-on');
      if (lt.im.dataset.full) { lt.im.dataset.px = lt.im.getAttribute('href'); lt.im.setAttribute('href', lt.im.dataset.full); }
    };
    const leave = () => {
      pin.classList.remove('is-hovering'); lt.g.classList.remove('is-hot');
      legend.querySelectorAll('.is-hot').forEach((x) => x.classList.remove('is-hot'));
      tag.classList.remove('is-on');
      if (lt.im.dataset.px) lt.im.setAttribute('href', lt.im.dataset.px);
    };
    const go = () => { if (lt.inCut) jump(lt.world); };
    lt.g.addEventListener('pointerenter', enter);
    lt.g.addEventListener('pointerleave', leave);
    lt.g.addEventListener('click', go);
    lt.g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  legend.querySelectorAll('li').forEach((li) => {
    li.addEventListener('click', () => { if (!li.classList.contains('is-out')) jump(li.dataset.world); });
    li.addEventListener('pointerenter', () => letters.find((l) => l.world === li.dataset.world)?.g.dispatchEvent(new Event('pointerenter')));
    li.addEventListener('pointerleave', () => letters.find((l) => l.world === li.dataset.world)?.g.dispatchEvent(new Event('pointerleave')));
  });
  pin.addEventListener('pointermove', (e) => {
    const r = pin.getBoundingClientRect();
    tag.style.transform = `translate(${e.clientX - r.left + 18}px, ${e.clientY - r.top + 18}px)`;
  });

  function jump(world) {
    const t = document.getElementById(world);
    if (!t) return;
    const own = world === target;
    // the target letter: let the scroll-zoom do it. other letters: quick zoom, then cut there
    if (own && st) { lenis.scrollTo(st.end + 2, { duration: 1.8 }); return; }
    const lt = letters.find((l) => l.world === world);
    const f = withOff(lt);
    const p = toStage(f);
    gsap.timeline()
      .set(stage, { transformOrigin: `${p.x}px ${p.y}px` })
      .to(stage, { scale: zoomFor(f.r), duration: .9, ease: 'expo.in' })
      .to(cover, { opacity: 1, background: worldBg(world), duration: .25 }, '-=.3')
      .add(() => { lenis.scrollTo(t, { immediate: true }); })
      .set(stage, { scale: 1, rotation: 0, clearProps: 'transformOrigin' }, '+=.1')
      .set(cover, { opacity: 0, background: worldBg(target) });
  }

  // map a viewBox point to stage pixels
  function toStage(pt) {
    const r = s.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const [vx, vy, vw, vh] = s.getAttribute('viewBox').split(' ').map(Number);
    const k = Math.min(r.width / vw, r.height / vh);
    const ox = r.left + (r.width - vw * k) / 2, oy = r.top + (r.height - vh * k) / 2;
    return { x: ox + (pt.x - vx) * k - sr.left, y: oy + (pt.y - vy) * k - sr.top, k };
  }
  function zoomFor(rad) {
    const p = toStage({ x: 0, y: 0 });
    const need = Math.hypot(innerWidth, innerHeight) / 2;
    return clamp((need / (rad * p.k)) * 1.25, 4, 140);
  }

  let st = null;
  // ---------- the scroll timeline ----------
  if (ctx.reduced) {
    el.classList.add('is-static');
    return;
  }
  const R = rng(17 + n * 101);
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  const asm = gsap.timeline({ defaults: { ease: 'none' } });
  const gs = letters.map((l) => l.g);
  gsap.set(gs, { transformOrigin: mark === 'rags' ? '50% 0%' : '50% 50%', smoothOrigin: false });
  // 1. assemble: every return arrives differently
  if (mark === 'patch') {
    asm.fromTo(gs, { y: () => -300 - R() * 400, rotation: () => (R() - .5) * 70, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, stagger: .06, duration: .5, ease: 'back.out(1.4)' }, 0);
  } else if (mark === 'grid') {
    asm.fromTo(gs, { scale: 0, rotation: () => (R() > .5 ? 90 : -90), opacity: 1 }, { scale: 1, rotation: 0, opacity: 1, stagger: .07, duration: .45, ease: 'expo.out' }, 0);
    const gl = s.querySelector('.gate-gridlines');
    if (gl) asm.fromTo(gl, { opacity: 0 }, { opacity: 1, duration: .3 }, .25);
  } else if (mark === 'block') {
    asm.fromTo(gs, { y: () => (R() - .5) * 600, x: () => (R() - .5) * 300, opacity: 0 }, { y: 0, x: 0, opacity: 1, stagger: .05, duration: .5, ease: 'steps(6)' }, 0);
  } else {
    asm.fromTo(gs, { x: (i) => (i % 2 ? 1 : -1) * 900, rotation: (i) => (i % 2 ? 25 : -25), opacity: 1 }, { x: 0, rotation: 0, opacity: 1, stagger: .07, duration: .55, ease: 'elastic.out(1, .5)' }, 0);
  }
  asm.fromTo([copy, legend, hint], { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: .05, duration: .25, ease: 'power2.out' }, .35);
  // assembly plays while the gate scrolls up into view, so it never arrives empty
  ScrollTrigger.create({ trigger: el, start: 'top 92%', end: 'top 8%', scrub: .6, animation: asm });
  // 2. hold, 3. zoom through the target letter
  tl.to({}, { duration: .3 });
  const zt = tl.duration();
  tl.add(() => {}, zt);
  tl.fromTo(ui, { opacity: 1, y: 0 }, { opacity: 0, y: -20, duration: .2, ease: 'power1.in', immediateRender: false }, zt);
  tl.fromTo(letters.filter((l) => l !== T).map((l) => l.slot), { opacity: 1 }, { opacity: 0, duration: .25, immediateRender: false }, zt + .05);
  tl.fromTo(T.g.querySelectorAll('.gate-tint,.gate-shape,.gate-edge'), { opacity: (i, t) => (t.classList.contains('gate-tint') ? .92 : 1) }, { opacity: 0, duration: .5, immediateRender: false }, zt + .1);
  tl.fromTo(stage, { scale: 1, rotation: 0 }, { scale: () => zoomFor(focus.r), rotation: n % 2 ? 7 : -7, duration: 1, ease: 'expo.in', immediateRender: false }, zt);
  tl.fromTo(cover, { opacity: 0 }, { opacity: 1, duration: .18, immediateRender: false }, zt + .85);

  st = ScrollTrigger.create({
    trigger: el, start: 'top top', end: () => '+=' + innerHeight * 1.7, pin: pin, scrub: .7, animation: tl,
    invalidateOnRefresh: true,
    onRefresh: () => { const p = toStage(focus); gsap.set(stage, { transformOrigin: `${p.x}px ${p.y}px` }); cover.style.background = worldBg(target); },
  });
  const p0 = toStage(focus);
  gsap.set(stage, { transformOrigin: `${p0.x}px ${p0.y}px` });
}

// the colour the world really starts with, so the hand-off from the zoom is seamless
function worldBg(world) {
  const el = document.getElementById(world);
  const fallback = { diary: '#E5331F', sketchbook: '#1E9C5B', digital: '#2443F0', desk: '#E9E2D2' }[world];
  if (!el) return fallback;
  for (const n of [el, el.firstElementChild, el.firstElementChild?.firstElementChild]) {
    if (!n) continue;
    const c = getComputedStyle(n).backgroundColor;
    if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c;
  }
  return fallback;
}

// sample the shape and return the inside point farthest from any edge, with that distance as r
function deepestPoint(path, b) {
  const N = 28, pts = [];
  const pt = (x, y) => { try { return path.isPointInFill(new DOMPoint(x, y)); } catch { return false; } };
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
    const x = b.x + (b.width * i) / N, y = b.y + (b.height * j) / N;
    pts.push({ x, y, inside: pt(x, y) });
  }
  const outs = pts.filter((p) => !p.inside);
  // edges of the bbox count as outside too
  let best = { x: b.x + b.width / 2, y: b.y + b.height / 2, r: Math.min(b.width, b.height) / 4 };
  for (const p of pts) {
    if (!p.inside) continue;
    let d = Math.min(p.x - b.x, b.x + b.width - p.x, p.y - b.y, b.y + b.height - p.y);
    for (const o of outs) d = Math.min(d, Math.hypot(o.x - p.x, o.y - p.y));
    if (d > best.r || !best.found) best = { x: p.x, y: p.y, r: d, found: true };
  }
  return best;
}
