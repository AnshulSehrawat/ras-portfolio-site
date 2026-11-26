// poster: WARDROBE — "no one style. a whole wardrobe."
// a black type-specimen sheet on a 6×4 grid. the word is RA.S, and every glyph keeps changing clothes:
// typefaces, fabrics, the owner's own marks, his art as a fill. hover to try one on, click to keep it.
// keep all four and you've made your own RA.S.
import { h, svg, clamp, rng } from '../core/util.js';

const POSTERS = ['hello', 'split', 'wardrobe', 'loupe'];
const NS = 'http://www.w3.org/2000/svg';
const C = { paper: '#F2EDE1', ink: '#15120F', red: '#E5331F', blue: '#2443F0', yellow: '#FFD43B', green: '#1E9C5B', white: '#FFFFFF' };
const GLYPHS = ['R', 'A', '.', 'S'];

// every skin = one way to wear a letter. t: text skins (font + paint), m: the owner's marks, g: shape-built letters
const SKINS = [
  { n: 'archivo black, 125 wide', t: { f: 'Archivo', w: 900, s: 'expanded', fill: C.paper } },
  { n: 'archivo hairline, 62', t: { f: 'Archivo', w: 100, s: 'extra-condensed', fill: C.paper } },
  { n: 'archivo 900, outline', t: { f: 'Archivo', w: 900, s: 'extra-condensed', fill: 'none', stroke: C.paper, sw: 2.2 } },
  { n: 'instrument serif italic', t: { f: 'Instrument Serif', i: 1, fill: C.paper } },
  { n: 'instrument serif, red', t: { f: 'Instrument Serif', fill: C.red } },
  { n: 'gochi hand, yellow', t: { f: 'Gochi Hand', fill: C.yellow } },
  { n: 'bagel fat one, sticker', t: { f: 'Bagel Fat One', fill: C.red, stroke: C.white, sw: 16, sticker: 1 } },
  { n: 'silkscreen, green', t: { f: 'Silkscreen', w: 700, fill: C.green } },
  { n: 'permanent marker', t: { f: 'Permanent Marker', fill: C.paper, rough: 1 } },
  { n: 'rozha one', t: { f: 'Rozha One', fill: C.paper } },
  { n: 'reenie beanie, pencil', t: { f: 'Reenie Beanie', fill: '#CFC8B8', rough: 1 } },
  { n: 'jetbrains mono', t: { f: 'JetBrains Mono', fill: C.paper } },
  { n: 'fill: my art no. 25', t: { f: 'Archivo', w: 900, s: 'normal', fill: 'url(#wd-art1)' } },
  { n: 'fill: my art no. 64', t: { f: 'Bagel Fat One', fill: 'url(#wd-art2)' } },
  { n: 'fill: my art no. 40', t: { f: 'Archivo', w: 900, s: 'expanded', fill: 'url(#wd-art3)' } },
  { n: 'fabric: red stripe', t: { f: 'Archivo', w: 900, s: 'condensed', fill: 'url(#wd-stripe)' } },
  { n: 'fabric: gingham', t: { f: 'Bagel Fat One', fill: 'url(#wd-ging)' } },
  { n: 'fabric: denim patch', t: { f: 'Archivo', w: 800, s: 'normal', fill: 'url(#wd-denim)', stroke: C.yellow, sw: 2, dash: '7 5', inset: 1 } },
  { n: 'running stitch', t: { f: 'Archivo', w: 900, s: 'expanded', fill: 'none', stroke: C.yellow, sw: 3, dash: '9 7' } },
  { n: 'halftone, red', t: { f: 'Archivo', w: 900, s: 'extra-condensed', fill: 'url(#wd-dots)' } },
  { n: 'cut paper, two tone', t: { f: 'Archivo', w: 900, s: 'normal', fill: C.blue, block: C.yellow } },
  { n: 'inverted, 62', t: { f: 'Archivo', w: 900, s: 'extra-condensed', fill: C.ink, block: C.paper, full: 1 } },
  { n: 'my mark: grid', m: { k: 'grid', fill: C.paper } },
  { n: 'my mark: block', m: { k: 'block', fill: C.red } },
  { n: 'my mark: patch', m: { k: 'patch', fill: C.paper, red: C.red } },
  { n: 'built from shapes', g: 1 },
];
const STRETCH = { 'extra-condensed': '62.5%', condensed: '75%', normal: '100%', expanded: '125%' };

// shape-built letters (cap height = 100), the same tile grammar as the owner's marks
const SHAPES = {
  R: { w: 76, p: [['M0 0H26V100H0Z', C.blue], ['M26 0H40A30 30 0 0 1 40 60H26Z', C.red], ['M30 60L76 100H38Z', C.yellow]] },
  A: { w: 86, p: [['M0 100L43 0V100Z', C.yellow], ['M43 0L86 100H43Z', C.red], ['M43 62m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0', C.ink]] },
  '.': { w: 26, p: [['M13 74a13 13 0 1 0 0.01 0Z', C.green]] },
  S: { w: 66, p: [['M66 0H32A25 25 0 0 0 32 50H66Z', C.blue], ['M0 50H34A25 25 0 0 1 34 100H0Z', C.yellow]] },
};

export async function mount(el, ctx) {
  const { reduced, logos, gsap } = ctx;
  const list = POSTERS.filter((p) => (ctx.blocks || POSTERS).includes(p));
  const no = `${String(list.indexOf('wardrobe') + 1).padStart(2, '0')}/${String(list.length).padStart(2, '0')}`;
  const combos = Math.pow(SKINS.length, GLYPHS.length).toLocaleString('en-US');
  el.setAttribute('aria-label', 'no one style. a whole wardrobe. a type specimen of RA.S you can dress.');

  // ---------- html: grid, header, meta, furniture ----------
  const cells = h('div.wd-cells', { 'aria-hidden': 'true' },
    Array.from({ length: 24 }, (_, i) => h('i', {}, h('span', {}, 'ABCDEF'[i % 6] + (Math.floor(i / 6) + 1)))));
  const head = h('div.wd-head', {},
    h('h2.wd-title', {},
      h('span.wd-t1', {}, h('em.f-a', {}, 'no'), ' ', h('em.f-s', {}, 'one'), ' ', h('em.f-h', {}, 'style.')),
      h('span.wd-t2', {}, h('em.f-s', {}, 'a whole'), ' ', h('em.f-a2', {}, 'wardrobe.'))),
    h('div.wd-done', { 'aria-live': 'polite' },
      h('p.wd-d1', {}, 'that\'s your ', h('b', {}, 'RA.S.')),
      h('p.wd-d2', {}, 'nobody else has this one.'),
      h('button.wd-shuffle', { type: 'button' }, h('span', {}, '↻'), ' shuffle the wardrobe')));
  const now = h('b.wd-now', {}, '—');
  const kept = h('b.wd-kept', {}, '0/4');
  const meta = h('div.wd-meta', {},
    h('p', {}, h('span.wd-k', {}, 'specimen'), 'RA.S, set in everything i own'),
    h('p', {}, h('span.wd-k', {}, 'glyphs'), `4 × ${SKINS.length} skins = ${combos} ways to wear it`),
    h('p', {}, h('span.wd-k', {}, 'trying on'), now),
    h('p', {}, h('span.wd-k', {}, 'kept'), kept),
    h('p.wd-how', {}, ctx.isTouch ? 'tap a letter to keep it. tap again to let it go.' : 'hover to try one on. click to keep it.'));
  const bar = h('div.wd-bar', { 'aria-hidden': 'true' }, [C.paper, C.ink, C.red, C.yellow, C.blue, C.green].map((c) => h('i', { style: { background: c } })));
  const pf = h('div.wd-pf', { 'aria-hidden': 'true' },
    h('span.pf-tl', {}, 'hey, i\'m anshul'),
    h('span.pf-tc', {}, 'type specimen · no one style'),
    h('span.pf-bl', {}, h('b', {}, no), ' rags / patchwork'),
    h('span.pf-br', {}, 'RA.S'),
    bar);
  const stamp = h('div.wd-stamp', { 'aria-hidden': 'true' }, h('b', {}, '1/1'), h('span', {}, 'one of one'));

  // ---------- svg stage ----------
  const st = svg('svg', { class: 'wd-stage', role: 'group', 'aria-label': 'the letters R, A, dot, S' });
  const defs = svg('defs', {});
  st.append(defs);
  el.append(cells, head, meta, st, pf, stamp);
  buildDefs(defs, ctx);

  // glyph slots
  const R = rng(Date.now() % 9973 || 7);
  const slots = GLYPHS.map((ch, i) => {
    const order = shuffle([...SKINS.keys()], R);
    const g = svg('g', { class: 'wd-g', tabindex: '0', role: 'button', 'aria-pressed': 'false', 'data-i': i });
    const hit = svg('rect', { class: 'wd-hit' });
    const art = svg('g', { class: 'wd-art' });
    const guide = svg('g', { class: 'wd-sel' });
    const cap = svg('text', { class: 'wd-cap' });
    g.append(hit, art, guide, cap);
    st.append(g);
    return { ch, i, order, k: 0, g, hit, art, guide, cap, locked: false, hover: false, next: 0, box: null, ink: null };
  });
  const guides = svg('g', { class: 'wd-guides', 'aria-hidden': 'true' });
  st.insertBefore(guides, slots[0].g);

  // ---------- measuring ----------
  await document.fonts.ready;
  await Promise.all(['900 50px Archivo', '100 50px Archivo', '50px "Instrument Serif"', 'italic 50px "Instrument Serif"', '50px "Gochi Hand"', '50px "Bagel Fat One"',
    '700 50px Silkscreen', '50px "Permanent Marker"', '50px "Rozha One"', '50px "Reenie Beanie"', '50px "JetBrains Mono"'].map((f) => document.fonts.load(f, 'RAS.H')));
  const cv = document.createElement('canvas').getContext('2d');
  const metric = new Map();
  const measure = (t, ch) => {
    const key = `${t.f}|${t.w || 400}|${t.i ? 1 : 0}|${t.s || 'normal'}|${ch}`;
    if (metric.has(key)) return metric.get(key);
    cv.font = `${t.i ? 'italic ' : ''}${t.w || 400} 100px "${t.f}"`;
    try { cv.fontStretch = t.s || 'normal'; } catch (e) { /* older engines */ }
    const m = cv.measureText(ch), H = cv.measureText('H');
    const v = { l: m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent, cap: H.actualBoundingBoxAscent };
    metric.set(key, v);
    return v;
  };
  // owner marks: bbox of each letter in its own coordinates
  const markBox = {};
  const tmp = svg('svg', { width: 0, height: 0, style: 'position:absolute' });
  document.body.append(tmp);
  for (const k of ['grid', 'block', 'patch']) {
    markBox[k] = logos[k].letters.map((l) => {
      const p = svg('path', { d: [l.black, l.red].filter(Boolean).join(' ') });
      tmp.append(p);
      const b = p.getBBox();
      p.remove();
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    });
  }
  tmp.remove();

  // ---------- layout ----------
  let W = 0, H = 0, capH = 0, mob = false;
  function layout() {
    W = el.clientWidth; H = el.clientHeight; mob = W < 760;
    st.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const L = mob ? 16 : 40, Rm = mob ? 16 : 76;
    const sw = W - L - Rm;
    if (!mob) {
      capH = Math.min(H * 0.45, sw * 0.3);
      const base = H - Math.max(118, H * 0.14);
      const fr = [0.3, 0.315, 0.085, 0.3];
      let x = L;
      slots.forEach((s, i) => { const w = sw * fr[i]; s.box = { x, y: base - capH, w, h: capH, base }; x += w; });
    } else {
      capH = Math.min((H - 380) / 2 - 30, sw * 0.52);
      const b1 = 232 + capH, b2 = b1 + 64 + capH;
      const fr1 = [0.5, 0.5], fr2 = [0.24, 0.76];
      slots[0].box = { x: L, y: b1 - capH, w: sw * fr1[0], h: capH, base: b1 };
      slots[1].box = { x: L + sw * fr1[0], y: b1 - capH, w: sw * fr1[1], h: capH, base: b1 };
      slots[2].box = { x: L, y: b2 - capH, w: sw * fr2[0], h: capH, base: b2 };
      slots[3].box = { x: L + sw * fr2[0], y: b2 - capH, w: sw * fr2[1], h: capH, base: b2 };
    }
    drawGuides();
    slots.forEach((s) => paint(s, false));
  }

  function drawGuides() {
    guides.replaceChildren();
    const lines = mob ? [slots[0].box, slots[2].box] : [slots[0].box];
    for (const b of lines) {
      const y0 = b.base, y1 = b.base - capH, ov = capH * 0.025;
      const x0 = mob ? 0 : 0, x1 = W;
      guides.append(
        svg('line', { x1: x0, x2: x1, y1: y0, y2: y0, class: 'wd-gl' }),
        svg('line', { x1: x0, x2: x1, y1: y1, y2: y1, class: 'wd-gl' }),
        svg('line', { x1: x0, x2: x1, y1: y0 + ov, y2: y0 + ov, class: 'wd-gl wd-gl--o' }),
        svg('line', { x1: x0, x2: x1, y1: y1 - ov, y2: y1 - ov, class: 'wd-gl wd-gl--o' }),
        svg('line', { x1: x0, x2: x1, y1: b.base - capH * 0.5, y2: b.base - capH * 0.5, class: 'wd-gl wd-gl--x' }),
        txt(mob ? 6 : 12, y1 - 6, `cap ${Math.round(capH)}`, 'wd-gt'),
        txt(mob ? 6 : 12, y0 - 6, 'baseline 0', 'wd-gt'),
      );
    }
  }

  // draw slot s in its current skin
  function paint(s, jitter = true) {
    const sk = SKINS[s.order[s.k % SKINS.length]];
    const b = s.box;
    s.art.replaceChildren();
    s.hit.setAttribute('x', b.x); s.hit.setAttribute('y', b.y - 20); s.hit.setAttribute('width', b.w); s.hit.setAttribute('height', b.h + 60);
    let ink; // ink box in stage coords
    const maxW = b.w * (s.ch === '.' ? 0.9 : 0.9);
    if (sk.t) {
      const t = sk.t;
      const m = measure(t, s.ch);
      let fs = capH * 100 / m.cap;
      const iw = (m.l + m.r) * fs / 100;
      if (iw > maxW) fs *= maxW / iw;
      const k = fs / 100;
      const inkW = (m.l + m.r) * k;
      const x = b.x + (b.w - inkW) / 2 + m.l * k;
      ink = { x: x - m.l * k, y: b.base - m.a * k, w: inkW, h: (m.a + m.d) * k };
      if (t.block) {
        // a cut-paper block behind the letter
        const pad = capH * 0.07;
        const bx = t.full ? b.x + 4 : ink.x - pad, by = t.full ? b.base - capH - pad * 1.4 : b.base - capH - pad, bw = t.full ? b.w - 8 : ink.w + pad * 2, bh = t.full ? capH + pad * 1.9 : capH + pad * 1.5;
        s.art.append(svg('path', { d: roughRect(bx, by, bw, bh, R), fill: t.block }));
      }
      const el2 = svg('text', {
        x, y: b.base, 'font-family': `'${t.f}'`, 'font-size': fs.toFixed(1), 'font-weight': t.w || 400,
        'font-style': t.i ? 'italic' : 'normal', fill: t.fill,
        style: `font-stretch:${STRETCH[t.s || 'normal']}`,
      }, document.createTextNode(s.ch));
      if (t.stroke) {
        el2.setAttribute('stroke', t.stroke); el2.setAttribute('stroke-width', t.sw);
        el2.setAttribute('stroke-linejoin', 'round'); el2.setAttribute('stroke-linecap', 'round');
        if (t.dash) el2.setAttribute('stroke-dasharray', t.dash);
        if (t.sticker) { el2.setAttribute('paint-order', 'stroke fill'); el2.setAttribute('filter', 'url(#wd-shadow)'); el2.setAttribute('stroke-width', Math.max(8, fs * 0.05)); }
      }
      if (t.rough) el2.setAttribute('filter', 'url(#wd-rough)');
      s.art.append(el2);
      if (t.inset) {
        // denim gets its stitch line on the inside too
        const el3 = el2.cloneNode(true);
        el3.setAttribute('fill', 'none'); el3.setAttribute('stroke', 'rgba(255,255,255,.18)'); el3.setAttribute('stroke-width', fs * 0.035); el3.removeAttribute('stroke-dasharray');
        s.art.prepend(el3);
      }
      s.fs = Math.round(fs);
    } else if (sk.m) {
      const mk = logos[sk.m.k];
      const idx = GLYPHS.indexOf(s.ch);
      const letter = mk.letters[idx];
      const bb = markBox[sk.m.k][idx], r0 = markBox[sk.m.k][0];
      let sc = capH / r0.h;
      if (bb.w * sc > maxW) sc = maxW / bb.w;
      const bottom = r0.y + r0.h; // R sits on the baseline; the others keep their place relative to it
      const tx = b.x + (b.w - bb.w * sc) / 2 - bb.x * sc;
      const ty = b.base - bottom * sc;
      const gm = svg('g', { transform: `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${sc.toFixed(4)})` });
      if (letter.red) gm.append(svg('path', { d: letter.red, fill: sk.m.red || C.red }));
      if (letter.black) gm.append(svg('path', { d: letter.black, fill: sk.m.fill }));
      s.art.append(gm);
      ink = { x: tx + bb.x * sc, y: ty + bb.y * sc, w: bb.w * sc, h: bb.h * sc };
      s.fs = Math.round(capH);
    } else {
      const sh = SHAPES[s.ch];
      let sc = capH / 100;
      if (sh.w * sc > maxW) sc = maxW / sh.w;
      const tx = b.x + (b.w - sh.w * sc) / 2, ty = b.base - 100 * sc;
      const gm = svg('g', { transform: `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${sc.toFixed(4)})` });
      sh.p.forEach(([d, f]) => gm.append(svg('path', { d, fill: f })));
      s.art.append(gm);
      const top = s.ch === '.' ? 74 : 0;
      ink = { x: tx, y: ty + top * sc, w: sh.w * sc, h: (100 - top) * sc };
      s.fs = Math.round(capH);
    }
    s.ink = ink;
    s.name = sk.n;
    s.rag = s.order[s.k % SKINS.length] + 1;
    // stop-motion jitter: every frame lands a little off, like paper cut-outs swapped by hand
    if (jitter && !reduced) {
      const cx = b.x + b.w / 2, cy = b.base - capH / 2;
      s.art.setAttribute('transform', `rotate(${((R() - 0.5) * 3).toFixed(2)} ${cx} ${cy}) translate(${((R() - 0.5) * 6).toFixed(1)} ${((R() - 0.5) * 5).toFixed(1)})`);
    } else s.art.removeAttribute('transform');
    drawSel(s);
    s.cap.replaceChildren();
    const right = !mob && s.i === 3;
    const cx = right ? b.x + b.w - 4 : b.x + (mob ? 2 : 4);
    const cy = b.base + (mob ? 24 : 36);
    s.cap.setAttribute('x', cx); s.cap.setAttribute('y', cy);
    s.cap.setAttribute('text-anchor', right ? 'end' : 'start');
    const rag = `rag #${String(s.rag).padStart(2, '0')}`;
    const lines = s.ch === '.'
      ? [`dot · ${rag}`, '']
      : mob ? [`${s.ch} · ${rag}`, sk.n] : [`${s.ch} · ${rag} · ${s.fs}px`, sk.n];
    lines.forEach((l, j) => { if (l) s.cap.append(svg('tspan', { x: cx, dy: j ? '1.35em' : 0 }, document.createTextNode(l))); });
    if (s.locked) s.cap.append(svg('tspan', { x: cx, dy: '1.35em', class: 'wd-cap-k' }, document.createTextNode('kept.')));
  }

  function drawSel(s) {
    s.guide.replaceChildren();
    const show = s.hover || s.locked;
    if (!show) return;
    const p = 8, i = s.ink;
    const x = i.x - p, y = i.y - p, w = i.w + p * 2, hh = i.h + p * 2;
    const col = s.locked ? C.red : C.yellow;
    s.guide.append(svg('rect', { x, y, width: w, height: hh, fill: 'none', stroke: col, 'stroke-width': 1.2, 'stroke-dasharray': s.locked ? '5 4' : '' }));
    for (const [hx, hy] of [[0, 0], [0.5, 0], [1, 0], [1, 0.5], [1, 1], [0.5, 1], [0, 1], [0, 0.5]]) {
      s.guide.append(svg('rect', { x: x + w * hx - 3.5, y: y + hh * hy - 3.5, width: 7, height: 7, fill: C.ink, stroke: col, 'stroke-width': 1.2 }));
    }
    const label = `${s.ch === '.' ? 'dot' : s.ch} — ${s.locked ? 'kept' : s.name}`;
    const lw = label.length * 6.3 + 14;
    const ly = Math.max(y - 22, 2);
    s.guide.append(
      svg('rect', { x, y: ly, width: lw, height: 17, fill: col }),
      svg('text', { x: x + 7, y: ly + 12, class: 'wd-chip', fill: s.locked ? C.white : C.ink }, document.createTextNode(label)));
    // side bearings: where the ink starts and stops
    if (s.hover && !mob) {
      s.guide.append(
        svg('line', { x1: i.x, x2: i.x, y1: s.box.y - 40, y2: s.box.base + 14, class: 'wd-sb' }),
        svg('line', { x1: i.x + i.w, x2: i.x + i.w, y1: s.box.y - 40, y2: s.box.base + 14, class: 'wd-sb' }),
        txt(i.x + 3, s.box.y - 30, `${Math.round(i.w)}`, 'wd-gt'));
    }
  }

  // ---------- behaviour ----------
  const FAST = 105, IDLE = [520, 980];
  let lastHover = -1e9, inView = false, done = false, lastSlot = null;
  const nowLabel = () => {
    const s = slots.find((q) => q.hover) || lastSlot;
    now.textContent = s ? `${s.name} (rag #${String(s.rag).padStart(2, '0')})` : '—';
    kept.textContent = `${slots.filter((q) => q.locked).length}/4`;
  };
  const step = (s) => { s.k++; paint(s); if (s.hover) nowLabel(); };
  function setLock(s, v) {
    s.locked = v;
    s.g.setAttribute('aria-pressed', v ? 'true' : 'false');
    s.g.classList.toggle('is-kept', v);
    paint(s, false);
    nowLabel();
    const all = slots.every((q) => q.locked);
    if (all !== done) {
      done = all;
      el.classList.toggle('is-done', done);
      if (done && !reduced) {
        gsap.fromTo(stamp, { scale: 1.8, rotate: -24, opacity: 0 }, { scale: 1, rotate: -12, opacity: 1, duration: 0.45, ease: 'steps(5)' });
        gsap.fromTo(head.querySelector('.wd-done'), { y: 18 }, { y: 0, duration: 0.5, ease: 'steps(4)' });
      }
      if (done) now.textContent = `1 of ${combos}`;
    }
  }
  slots.forEach((s) => {
    s.g.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; s.hover = true; lastHover = performance.now(); if (!s.locked) step(s); else { drawSel(s); } el.classList.add('is-touched'); nowLabel(); });
    s.g.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse') return; s.hover = false; lastHover = performance.now(); drawSel(s); nowLabel(); });
    s.g.addEventListener('click', () => { lastSlot = s; setLock(s, !s.locked); el.classList.add('is-touched'); });
    s.g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLock(s, !s.locked); } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); if (!s.locked) step(s); } });
  });
  head.querySelector('.wd-shuffle').addEventListener('click', () => {
    slots.forEach((s) => { s.locked = false; s.g.setAttribute('aria-pressed', 'false'); s.g.classList.remove('is-kept'); s.order = shuffle(s.order, R); s.k = 0; });
    done = false; el.classList.remove('is-done');
    // a quick riffle through the rack
    let n = 0;
    const riffle = () => { slots.forEach((s) => step(s)); if (++n < 7) setTimeout(riffle, 70); else nowLabel(); };
    riffle();
  });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.05 }).observe(el);

  function tick() {
    if (!inView || !W) return;
    const t = performance.now();
    for (const s of slots) {
      if (s.locked) continue;
      if (s.hover) { if (t >= s.next) { step(s); s.next = t + FAST; } continue; }
      if (reduced) continue;
      // nobody touching: the letters change clothes on their own, at stop-motion pace
      const idle = t - lastHover > 1600;
      if (idle && t >= s.next) { step(s); s.next = t + IDLE[0] + R() * (IDLE[1] - IDLE[0]); }
    }
  }
  layout();
  nowLabel();
  gsap.ticker.add(tick);
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layout, 120); });

  // debug hooks for screenshots
  window.__wardrobe = {
    keep(ks) { slots.forEach((s, i) => { if (ks[i] != null) { s.k = s.order.indexOf(ks[i]); setLock(s, true); } }); },
    hover(i) { slots[i].hover = true; lastHover = performance.now() + 1e7; paint(slots[i], false); nowLabel(); },
    freeze() { lastHover = performance.now() + 1e9; },
    set(ks) { slots.forEach((s, i) => { s.k = s.order.indexOf(ks[i]); paint(s, false); }); },
    skins: SKINS.map((s) => s.n),
  };
}

// ---------- helpers ----------
function txt(x, y, s, cls) { return svg('text', { x, y, class: cls }, document.createTextNode(s)); }
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function roughRect(x, y, w, hh, r) {
  const j = () => (r() - 0.5) * 6;
  return `M${x + j()} ${y + j()} L${x + w * 0.5 + j()} ${y + j()} L${x + w + j()} ${y + j()} L${x + w + j()} ${y + hh * 0.5 + j()} L${x + w + j()} ${y + hh + j()} L${x + w * 0.5 + j()} ${y + hh + j()} L${x + j()} ${y + hh + j()} L${x + j()} ${y + hh * 0.5 + j()}Z`;
}
function buildDefs(defs, ctx) {
  const img = (id) => ctx.img(id, 's');
  const pat = (id, attrs, ...kids) => svg('pattern', { id, ...attrs }, ...kids);
  const artPat = (id, src) => pat(id, { patternUnits: 'objectBoundingBox', patternContentUnits: 'objectBoundingBox', width: 1, height: 1 },
    svg('rect', { width: 1, height: 1, fill: '#15120F' }), // ink under the photo: the letter shows even before it loads
    svg('image', { href: src, width: 1, height: 1, preserveAspectRatio: 'xMidYMid slice' }));
  defs.append(
    artPat('wd-art1', img('a25')),
    artPat('wd-art2', img('a64')),
    artPat('wd-art3', img('a40')),
    pat('wd-stripe', { patternUnits: 'userSpaceOnUse', width: 18, height: 18, patternTransform: 'rotate(35)' },
      svg('rect', { width: 18, height: 18, fill: C.paper }), svg('rect', { width: 9, height: 18, fill: C.red })),
    pat('wd-ging', { patternUnits: 'userSpaceOnUse', width: 26, height: 26 },
      svg('rect', { width: 26, height: 26, fill: C.white }),
      svg('rect', { width: 13, height: 26, fill: C.blue, opacity: 0.55 }),
      svg('rect', { width: 26, height: 13, fill: C.blue, opacity: 0.55 })),
    pat('wd-denim', { patternUnits: 'userSpaceOnUse', width: 256, height: 256 },
      svg('image', { href: 'media/tex/blue.webp', width: 256, height: 256 }),
      svg('path', { d: 'M0 0L256 256M-128 0L128 256M128 0L384 256', stroke: 'rgba(255,255,255,.08)', 'stroke-width': 3 })),
    pat('wd-dots', { patternUnits: 'userSpaceOnUse', width: 11, height: 11, patternTransform: 'rotate(20)' },
      svg('circle', { cx: 5.5, cy: 5.5, r: 3.6, fill: C.red })),
    svg('filter', { id: 'wd-shadow', x: '-20%', y: '-20%', width: '140%', height: '140%' },
      svg('feDropShadow', { dx: 3, dy: 6, stdDeviation: 4, 'flood-color': '#000', 'flood-opacity': 0.55 })),
    svg('filter', { id: 'wd-rough', x: '-10%', y: '-10%', width: '120%', height: '120%' },
      svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.04, numOctaves: 2, seed: 4, result: 'n' }),
      svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 5 })),
  );
}
