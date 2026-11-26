// poster: LOUPE — "i care about tiny details to a slightly silly degree."
// a full red poster. a loupe follows the cursor (drag it on touch) and magnifies the poster ×2.5. inside it the
// texture turns into notes: kerning marks, a 2px nudge that became 1px, an optical dot, a word rotated by one
// (silly) degree, and one note that's only for whoever bothers to look.
import { h, svg, clamp } from '../core/util.js';

const POSTERS = ['hello', 'split', 'wardrobe', 'loupe'];
const INK = '#15120F', CREAM = '#F2EDE1';

const WORD = {
  i: '<span data-a="i">i</span>',
  care: '<span data-a="c">c</span><span data-a="a">a</span>re',
  about: 'ab<span data-a="o">o</span>ut<span data-a="end1"></span>',
  tiny: '<span class="lp-tiny" data-a="tiny">tiny</span>',
  details: '<span data-a="det">details</span>',
  to: '<span data-a="to">to</span>',
  a: '<span data-a="a2">a</span>',
  slightly: 'slight<span data-a="ly">ly</span>',
  silly: '<span class="lp-silly" data-a="silly">silly</span>',
  degree: 'de<span data-a="g">g</span>ree<span class="lp-dot" data-a="dot">.</span>',
};
const LINES = {
  wide: [['i', 'care', 'about'], ['tiny', 'details'], ['to', 'a', 'slightly'], ['silly', 'degree']],
  tall: [['i', 'care'], ['about'], ['tiny', 'details'], ['to', 'a'], ['slightly'], ['silly'], ['degree']],
};

export async function mount(el, ctx) {
  const { gsap, reduced } = ctx;
  const list = POSTERS.filter((p) => (ctx.blocks || POSTERS).includes(p));
  const no = `${String(list.indexOf('loupe') + 1).padStart(2, '0')}/${String(list.length).padStart(2, '0')}`;
  el.setAttribute('aria-label', 'i care about tiny details to a slightly silly degree.');

  const stage = h('div.lp-stage');
  const lens = h('div.lp-lens', { 'aria-hidden': 'true' });
  const zoomTag = h('span.lp-zoom', {}, '×2.5');
  const ring = h('div.lp-ring', { 'aria-hidden': 'true', 'data-hot': '' }, zoomTag);
  const found = h('b', {}, '00');
  const total = h('span', {}, '/00');
  const counter = h('p.lp-count', { 'aria-live': 'polite' }, 'details spotted ', found, total);
  const tip = h('p.lp-tip', { 'aria-hidden': 'true' }, ctx.isTouch ? 'drag the loupe. read the small print.' : 'move the loupe. read the small print. click to zoom more.');
  el.append(stage, lens, ring, counter, tip);

  await document.fonts.load('900 100px Archivo');
  await Promise.all([document.fonts.load('20px "Gochi Hand"'), document.fonts.load('10px "JetBrains Mono"')]);

  const cv = document.createElement('canvas').getContext('2d');
  let W = 0, H = 0, mob = false, R = 120, spots = [], clone = null;

  function build() {
    W = el.clientWidth; H = el.clientHeight; mob = W < 760;
    R = mob ? 90 : 140;
    el.classList.toggle('is-mob', mob);
    const lines = mob ? LINES.tall : LINES.wide;
    const ml = mob ? 18 : 56, mr = mob ? 18 : 84;
    const type = h('h2.lp-type', {},
      lines.map((ws) => h('span.lp-line', { html: ws.map((w) => WORD[w]).join(' ') + '<i class="lp-bl"></i>' })));
    const grid = h('div.lp-grid', { 'aria-hidden': 'true' }, Array.from({ length: 12 }, (_, i) => h('i', {}, h('span', {}, String(i + 1).padStart(2, '0')))));
    const pf = h('div.lp-pf', { 'aria-hidden': 'true' },
      h('span.pf-tl', {}, 'hey, i\'m anshul'),
      h('span.pf-tc', {}, 'tiny details · proof 3, final final'),
      h('span.pf-bl', {}, h('b', {}, no), ' the small print'),
      h('span.pf-br', {}, 'RA.S'));
    const notes = svg('svg', { class: 'lp-notes', width: W, height: H, viewBox: `0 0 ${W} ${H}` });
    stage.replaceChildren(grid, type, notes, pf);
    stage.style.setProperty('--ml', ml + 'px');
    stage.style.setProperty('--mr', mr + 'px');

    // fit the type: widest line fills the measure, the block fits the height
    type.style.setProperty('transition', 'none', 'important'); // measure now, not after a .01ms transition
    type.style.fontSize = '100px';
    const widest = Math.max(...[...type.children].map((l) => l.getBoundingClientRect().width));
    const byW = 100 * (W - ml - mr) / widest;
    const byH = (H - (mob ? 210 : 230)) / (lines.length * 0.84);
    const fs = Math.min(byW, byH);
    type.style.fontSize = fs.toFixed(1) + 'px';
    type.style.top = Math.max(mob ? 96 : 104, (H - lines.length * fs * 0.84) / 2 + (mob ? 6 : 14)) + 'px';

    // ---------- measure everything we annotate ----------
    const sb = stage.getBoundingClientRect();
    const rel = (r) => ({ x: r.left - sb.left, y: r.top - sb.top, w: r.width, h: r.height, r: r.right - sb.left, b: r.bottom - sb.top });
    const A = {};
    stage.querySelectorAll('[data-a]').forEach((n) => { A[n.dataset.a] = rel(n.getBoundingClientRect()); });
    const bases = [...type.querySelectorAll('.lp-bl')].map((n) => n.getBoundingClientRect().top - sb.top);
    const lineOf = (k) => { const y = A[k].y + A[k].h / 2; let best = 0; bases.forEach((b, i) => { if (Math.abs(b - y) < Math.abs(bases[best] - y)) best = i; }); return best; };
    cv.font = `900 ${fs}px Archivo`;
    try { cv.fontStretch = 'condensed'; } catch (e) { /* */ }
    const m = (ch) => cv.measureText(ch);
    const capH = m('H').actualBoundingBoxAscent, xH = m('x').actualBoundingBoxAscent;
    const iTop = m('i').actualBoundingBoxAscent, stemTop = m('ı').actualBoundingBoxAscent;
    const oDrop = m('o').actualBoundingBoxDescent, gDrop = m('g').actualBoundingBoxDescent;

    let N = notes; // where new marks go
    const T = (x, y, str, cls = 'lp-n lp-hand', anchor = 'middle', rot = 0) => {
      const t = svg('text', { x, y, class: cls, 'text-anchor': anchor, transform: rot ? `rotate(${rot} ${x} ${y})` : null });
      str.split('\n').forEach((l, i) => t.append(svg('tspan', { x, dy: i ? '1.15em' : 0 }, document.createTextNode(l))));
      N.append(t); return t;
    };
    const P = (d, cls = 'lp-ln') => { const p = svg('path', { d, class: cls }); N.append(p); return p; };
    const O = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
    const fz = mob ? 5.6 : 7; // note size in the poster. ×2.5 in the loupe = readable.
    const L = fz * 1.15;
    spots = [];
    const groups = [];
    // each note is one small cluster, small enough to fit inside the glass at once
    const G = (id, fn) => { const g = svg('g', { class: 'lp-g' }); notes.append(g); N = g; fn(); N = notes; groups.push([id, g]); };

    G('dot-i', () => { // the optical dot on the i
      const a = A.i, bl = bases[lineOf('i')];
      const cx = a.x + a.w / 2, th = (iTop - stemTop) * 0.62, cy = bl - iTop + th / 2, r = th * 0.92;
      P(O(cx, cy, r), 'lp-ln');
      P(`M${cx - r * 1.5} ${cy}H${cx + r * 1.5}M${cx} ${cy - r * 1.5}V${cy + r * 1.5}`, 'lp-ln lp-thin');
      T(cx + r * 0.3, cy - r - fz * 0.8 - L, 'this dot is optical,\nnot mathematical.', 'lp-n lp-hand', 'middle', -2);
    });
    G('kern', () => { // c|a
      const c = A.c, a = A.a, bl = bases[lineOf('c')];
      const x0 = c.r - fs * 0.03, x1 = a.x + fs * 0.03, y = bl - xH - fs * 0.05, mx = (x0 + x1) / 2;
      P(`M${x0} ${y - 5}V${y + 5}M${x1} ${y - 5}V${y + 5}M${x0} ${y}H${x1}M${x0 + 2} ${y - 2}L${x0} ${y}L${x0 + 2} ${y + 2}M${x1 - 2} ${y - 2}L${x1} ${y}L${x1 - 2} ${y + 2}`);
      T(mx, y - 7, 'kern −14', 'lp-n lp-mono');
      T(mx, y - 7 - L * 1.1 - L, 'kerned by eye.\nit was bugging me.', 'lp-n lp-hand', 'middle', -2);
    });
    G('cons', () => { // construction lines on the a
      const a = A.a, bl = bases[lineOf('a')];
      const r = xH * 0.27, bx = a.x + a.w * 0.4, by = bl - r * 1.05;
      P(O(bx, by, r), 'lp-ln lp-cons');
      P(`M${a.r - a.w * 0.19} ${bl - xH - 8}V${bl + 6}M${a.x + a.w * 0.15} ${bl - xH}H${a.r - a.w * 0.05}`, 'lp-ln lp-cons');
      T(bx + r + 4, by - r * 0.6, 'construction\nlines.\nignore me.', 'lp-n lp-mono', 'start');
    });
    G('overshoot', () => { // the o
      const o = A.o, bl = bases[lineOf('o')], cx = o.x + o.w / 2, wd = Math.min(o.w * 0.5, fz * 7);
      P(`M${cx - wd} ${bl}H${cx + wd}`, 'lp-ln');
      P(`M${cx - wd * 0.7} ${bl + oDrop}H${cx + wd * 0.7}`, 'lp-ln lp-dash');
      T(cx + wd + 3, bl + oDrop * 0.5 + 2, `+${oDrop.toFixed(1)}`, 'lp-n lp-mono', 'start');
      T(cx, bl + oDrop + fz * 1.5, 'overshoot. the o dips\nbelow the line so it\nlooks like it doesn\'t.', 'lp-n lp-mono');
    });
    G('tiny', () => {
      const t = A.tiny, p = 3;
      P(`M${t.x - p} ${t.y + 3}v-3h4M${t.r + p} ${t.y + 3}v-3h-4M${t.x - p} ${t.b - 3}v3h4M${t.r + p} ${t.b - 3}v3h-4`, 'lp-ln lp-cream');
      T(t.x + t.w / 2, t.y - fz * 0.6 - L, 'yes. tiny.\nyou\'re welcome.', 'lp-n lp-hand', 'middle', -3);
    });
    G('space', () => { // the word space between to and a
      const a0 = A.to, a1 = A.a2, bl = bases[lineOf('to')];
      const x0 = a0.r, x1 = a1.x, y = bl - xH * 0.45, mx = (x0 + x1) / 2;
      P(`M${x0} ${y - 4}V${y + 4}M${x1} ${y - 4}V${y + 4}M${x0} ${y}H${x1}`);
      T(mx, y + fz * 1.3, `${((x1 - x0) / fs).toFixed(2)}em`, 'lp-n lp-mono');
      T(mx, y - fz * 0.9 - L, 'word space: tightened.\nbig type needs less.', 'lp-n lp-hand');
    });
    G('ly', () => { // l·y
      const l = A.ly, bl = bases[lineOf('ly')];
      const x = l.x + l.w * 0.2, top = bl - capH * 1.06;
      P(`M${x} ${top - 2}V${top - fz * 1.4}`);
      T(x, top - fz * 1.8 - L, 'l·y pair checked.\nfine. moving on.', 'lp-n lp-hand', 'middle', 2);
    });
    G('silly', () => { // rotated by one degree
      const s = A.silly, bl = bases[lineOf('silly')];
      const x0 = s.x, len = fz * 11, y = bl + 4, rad = Math.PI / 180;
      P(`M${x0} ${y}H${x0 + len}`, 'lp-ln lp-dash');
      P(`M${x0} ${y}L${x0 + len} ${y + len * Math.tan(rad)}`);
      P(`M${x0 + len * 0.7} ${y}A${len * 0.7} ${len * 0.7} 0 0 1 ${x0 + len * 0.7 * Math.cos(rad * 6)} ${y + len * 0.7 * Math.sin(rad * 6)}`, 'lp-ln lp-thin');
      T(x0 + len + 3, y + 2, '1°', 'lp-n lp-mono', 'start');
      T(x0 + len * 0.55, y + fz * 1.7, 'rotated 1°.\na slightly silly degree.', 'lp-n lp-hand');
    });
    G('nudge', () => { // the full stop
      const d = A.dot, bl = bases[lineOf('dot')];
      const x = d.r + fz * 0.6, y = bl - fs * 0.09;
      T(x + fz * 0.4, y - L * 0.35, 'nudged 2px.', 'lp-n lp-hand', 'start');
      P(`M${x + fz * 0.2} ${y - L * 0.35 - fz * 0.3}h${fz * 5.4}`, 'lp-ln lp-strike');
      T(x + fz * 0.4, y + L * 0.95, 'ok fine, 1px.', 'lp-n lp-hand', 'start');
      P(`M${x} ${y + L * 0.6}q${-fz * 0.6} 0 ${-fz * 1.2} ${-fz * 0.4}m${fz * 0.5} ${-fz * 0.45}l${-fz * 0.5} ${fz * 0.45}l${fz * 0.55} ${fz * 0.25}`);
    });
    G('desc', () => { // the g
      const g = A.g, bl = bases[lineOf('g')], cx = g.x + g.w / 2, wd = fz * 4.5;
      P(`M${cx - wd} ${bl + gDrop}H${cx + wd}`);
      T(cx, bl + gDrop + fz * 1.5, `descender ${(gDrop / fs).toFixed(2)}em.\nchecked twice.`, 'lp-n lp-mono');
    });
    G('margin', () => {
      const bl = bases[mob ? 4 : 2];
      const x1 = type.getBoundingClientRect().left - sb.left, y = bl - capH * 0.5;
      P(`M2 ${y - 4}V${y + 4}M${x1} ${y - 4}V${y + 4}M2 ${y}H${x1}`, 'lp-ln lp-cream');
      T(x1 / 2 + 1, y - 4, `${Math.round(x1)}px.`, 'lp-n lp-mono');
      T(x1 / 2 + 1, y + fz * 1.5, `not ${Math.round(x1) - 1}.`, 'lp-n lp-hand');
    });
    G('joke', () => { // out in the rag, for whoever looks
      const e = A.end1, bl = bases[lineOf('end1')];
      const x = mob ? W - mr - fz * 15 : e.r + fs * 0.42, y = mob ? bases[0] - capH * 0.55 : bl - capH * 0.6;
      T(x, y, 'if you can read this,\nwe\'d get along.', 'lp-n lp-hand lp-joke');
      P(`M${x - fz * 4.5} ${y + L * 1.55}q${fz * 4.5} ${fz * 1.2} ${fz * 9} 0`);
    });
    G('hair', () => { // a line nobody sees
      const x = mob ? ml + 4 : W - mr - fz * 18, y = H - (mob ? 92 : 70);
      P(`M${x} ${y}h${fz * 10}`, 'lp-ln lp-hair');
      T(x, y - 4 - L, 'hairline, 0.5px.\nyou can\'t see it. i can.', 'lp-n lp-mono', 'start');
    });
    // baseline numbers on the left edge
    bases.forEach((b, i) => T(mob ? 4 : 18, b - 2, `bl ${String(i + 1).padStart(2, '0')}`, 'lp-n lp-mono lp-dim', 'start'));
    // each spot = the middle of its cluster
    for (const [id, g] of groups) { const b = g.getBBox(); spots.push({ id, x: b.x + b.width / 2, y: b.y + b.height / 2, got: false }); }
    // the baseline: one cream rule under every line of type
    bases.forEach((b) => notes.prepend(svg('line', { x1: 0, x2: W, y1: b + 0.5, y2: b + 0.5, class: 'lp-base' })));

    // the magnified copy
    clone = stage.cloneNode(true);
    clone.classList.add('is-mag');
    clone.removeAttribute('id');
    lens.replaceChildren(clone);
    total.textContent = '/' + String(spots.length).padStart(2, '0');
    countFound();
    if (!placed) { const t0 = spots.find((s) => s.id === 'tiny'); lx = tx = clamp(t0.x, R * 0.45, W - R * 0.45); ly = ty = t0.y; }
  }

  // ---------- the loupe ----------
  let lx = 0, ly = 0, tx = 0, ty = 0, z = 2.5, zt = 2.5, placed = false, inside = false, dragging = false, inView = false;
  let lastInput = -1e9, tourI = 0, tourT = 0;
  const tourOrder = ['tiny', 'dot-i', 'nudge', 'silly', 'kern', 'joke', 'space', 'overshoot'];
  function countFound() {
    const n = spots.filter((s) => s.got).length;
    found.textContent = String(n).padStart(2, '0');
    el.classList.toggle('is-all', n === spots.length && n > 0);
    if (n === spots.length && n > 0) counter.lastChild.textContent = `/${spots.length}. ok, you're also this guy.`;
  }
  const input = (cx, cy) => {
    const r = el.getBoundingClientRect();
    tx = clamp(cx - r.left, 0, W); ty = clamp(cy - r.top, 0, H);
    lastInput = performance.now(); placed = true;
    el.classList.add('is-touched');
  };
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') { input(e.clientX, e.clientY); if (!inside) { inside = true; ctx.cursor.hide(); } }
    else if (dragging) input(e.clientX, e.clientY);
  });
  el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { inside = false; ctx.cursor.show(); } });
  ring.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; dragging = true; ring.setPointerCapture(e.pointerId); input(e.clientX, e.clientY); });
  ring.addEventListener('pointermove', (e) => { if (dragging) input(e.clientX, e.clientY); });
  const up = () => { dragging = false; };
  ring.addEventListener('pointerup', up); ring.addEventListener('pointercancel', up);
  el.addEventListener('click', (e) => {
    if (ctx.isTouch) return;
    zt = zt === 2.5 ? 4 : 2.5;
    zoomTag.textContent = zt === 4 ? '×4' : '×2.5';
  });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.05 }).observe(el);

  function tick(time, dt) {
    if (!inView || !W) return;
    const now = performance.now();
    const k = Math.min(dt / 16.67, 3);
    // nobody steering: the loupe takes itself on a tour of the notes
    if (now - lastInput > 3500 && !dragging && !reduced) {
      if (now - tourT > 2600) {
        tourT = now;
        const id = tourOrder[tourI++ % tourOrder.length];
        const s = spots.find((q) => q.id === id);
        if (s) { tx = clamp(s.x, R * 0.45, W - R * 0.45); ty = clamp(s.y, R * 0.45, H - R * 0.45); }
      }
    }
    const f = reduced ? 1 : 1 - Math.pow(1 - (now - lastInput < 400 ? 0.32 : 0.06), k);
    lx += (tx - lx) * f; ly += (ty - ly) * f;
    z += (zt - z) * (reduced ? 1 : 1 - Math.pow(0.82, k));
    const r = R * (z > 3 ? 1.08 : 1);
    lens.style.clipPath = `circle(${r.toFixed(1)}px at ${lx.toFixed(1)}px ${ly.toFixed(1)}px)`;
    if (clone) clone.style.transform = `translate(${(lx - lx * z).toFixed(2)}px, ${(ly - ly * z).toFixed(2)}px) scale(${z.toFixed(3)})`;
    ring.style.transform = `translate(${(lx - r).toFixed(1)}px, ${(ly - r).toFixed(1)}px)`;
    ring.style.width = ring.style.height = (r * 2).toFixed(1) + 'px';
    // spotting: a note counts once it has sat inside the glass
    let changed = false;
    for (const s of spots) {
      if (!s.got && (now - lastInput < 3500 || dragging) && Math.hypot(s.x - lx, s.y - ly) < (r / z) * 0.6) { s.got = true; changed = true; }
    }
    if (changed) countFound();
  }

  build();
  gsap.ticker.add(tick);
  if (!reduced) gsap.from(ring, { scale: 0, duration: 0.9, ease: 'elastic.out(1, .5)', scrollTrigger: { trigger: el, start: 'top 60%' } });
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { spots.forEach((s) => (s.got = false)); build(); }, 140); });

  // debug hook for screenshots
  window.__loupe = { at(id, zoom) { const s = spots.find((q) => q.id === id); lastInput = performance.now() + 1e7; placed = true; tx = lx = s.x; ty = ly = s.y; if (zoom) { zt = z = zoom; } }, xy(x, y) { lastInput = performance.now() + 1e7; tx = lx = x; ty = ly = y; }, spots: () => spots.map((s) => s.id) };
}
