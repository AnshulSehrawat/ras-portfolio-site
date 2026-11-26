// poster 01: "hey, i'm anshul sehrawat". every letter is a loose patch on a thread.
// drag a letter: the thread stretches and the letter goes thin. let go: it springs home.
// tap a letter: it swaps fabric. left alone, a letter wriggles loose now and then.
import { h, svg, clamp, rng } from '../core/util.js';

// fabrics. 'img' letters show the owner's own work through the glyph.
const FABRIC = [
  { c: 'var(--red)' },
  { c: 'var(--ink)', patch: 'var(--yellow)' },
  { img: 'a29' },
  { c: 'var(--blue)' },
  { c: 'transparent', stroke: 'var(--ink)' },
  { c: 'var(--paper)', patch: 'var(--red)' },
  { c: 'var(--ink)' },
  { img: 'b35' },
  { c: 'var(--red)' },
  { c: 'var(--paper)', patch: 'var(--blue)' },
  { img: 'a59' },
  { c: 'var(--red)', ruled: true },
  { c: 'var(--ink)' },
  { c: 'var(--blue)', patch: 'var(--yellow)' },
];
const WORDS = ['ANSHUL', 'SEHRAWAT'];

export async function mount(el, ctx) {
  const { site, img } = ctx;
  const R = rng(9);

  const threads = svg('svg', { class: 'h-threads', 'aria-hidden': 'true' });
  const name = h('h1.h-name', { 'aria-label': 'Anshul Sehrawat' });
  const letters = [];
  let k = 0;
  const words = ctx.mobile ? ['ANS', 'HUL', 'SEHR', 'AWAT'] : WORDS;
  words.forEach((w, wi) => {
    const row = h('span.h-word', { 'aria-hidden': 'true', 'data-w': wi });
    [...w].forEach((ch) => {
      const g = h('span.h-g', {}, ch);
      const l = h('span.h-l', { 'data-hot': '' }, g);
      row.append(l);
      const st = { el: l, g, i: k, mat: k % FABRIC.length, x: 0, y: 0, vx: 0, vy: 0, r: 0, drag: false, jit: (R() - .5) * 2.4 };
      paint(st);
      letters.push(st);
      k++;
    });
    name.append(row);
  });

  function paint(st) {
    const f = FABRIC[st.mat];
    const s = st.el.style, gs = st.g.style;
    st.el.classList.toggle('has-patch', !!f.patch);
    s.setProperty('--patch', f.patch || 'transparent');
    s.setProperty('--prot', `${(R() - .5) * 7}deg`);
    st.g.classList.toggle('is-img', !!f.img);
    st.g.classList.toggle('is-ruled', !!f.ruled);
    gs.backgroundImage = f.img ? `url(${img(f.img, 's')})` : '';
    gs.color = f.img ? 'transparent' : f.c;
    gs.webkitTextStroke = f.stroke ? '0.035em ' + f.stroke : '';
    if (f.ruled) { gs.color = 'transparent'; gs.webkitTextStroke = '0.03em var(--ink)'; }
  }

  const tag = h('div.h-tag', {}, h('b', {}, 'RA.S'), h('span', {}, site.markLong));
  const hey = h('p.h-hey', {}, h('span', {}, 'hey, i\'m', tag),
    svg('svg', { class: 'h-under', viewBox: '0 0 300 30', preserveAspectRatio: 'none' },
      svg('path', { d: 'M4 18 C 60 8, 120 26, 180 14 S 270 10, 296 20' })));
  const line = h('p.h-line', {}, 'i make ads that stop thumbs.', h('br'), 'and art that doesn\'t have to.');
  const roles = h('ul.h-roles', {}, h('li', {}, 'designer'), h('li', {}, 'artist'), h('li', {}, h('s', {}, 'normal'), ' both'));
  const note = h('p.h-note', {},
    'pull a letter.', h('br'), 'they\'re loosely stitched.',
    svg('svg', { viewBox: '0 0 120 90', class: 'h-arrow' }, svg('path', { d: 'M8 80 C 30 70, 70 60, 92 20' }), svg('path', { d: 'M78 24 L 93 18 L 96 34' })));
  const sticky = h('div.h-sticky', { 'data-hot': '' }, h('p', {}, 'designer + artist.', h('br'), 'both. sorry.'));
  const furn = h('div.h-furn', { 'aria-hidden': 'true' },
    h('span.f-tl', {}, `RA.S — ${site.markLong}`),
    h('span.f-tr', {}, 'design · art · digital · me'),
    h('span.f-bl', {}, `01 / ${String(ctx.blocks.filter((b) => ['hello', 'split', 'wardrobe', 'loupe'].includes(b)).length).padStart(2, '0')} hello`),
    h('span.f-br', {}, 'scroll ↓ gently. it\'s handmade.'));
  const reg = ['tc'].map((p) => h(`i.h-reg.r-${p}`, { 'aria-hidden': 'true' }));
  const stage = h('div.h-stage', {}, furn, ...reg, hey, name, threads, line, roles, note, sticky);
  el.append(stage);

  // fit each word to the width
  function fit() {
    const W = stage.clientWidth * (ctx.mobile ? .94 : .9);
    name.querySelectorAll('.h-word').forEach((row) => {
      row.style.fontSize = '100px';
      const w = row.scrollWidth;
      row.style.fontSize = (100 * W) / w + 'px';
    });
    letters.forEach((l) => { l.el.style.width = ''; l.el.style.width = l.el.offsetWidth + 'px'; l.home = null; });
  }
  await document.fonts.ready;
  fit();
  addEventListener('resize', () => { fit(); });

  // ---------- drag + spring ----------
  let touched = false;
  letters.forEach((st) => {
    let sx, sy, ox, oy, moved;
    st.el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      st.el.setPointerCapture(e.pointerId);
      st.drag = true; touched = true; moved = false;
      sx = e.clientX; sy = e.clientY; ox = st.x; oy = st.y; st.tx = st.x; st.ty = st.y;
      st.el.classList.add('is-drag');
      note.classList.add('is-done');
    });
    st.el.addEventListener('pointermove', (e) => {
      if (!st.drag) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.hypot(dx, dy) > 4) moved = true;
      st.tx = ox + dx; st.ty = oy + dy;
    });
    const up = () => {
      if (!st.drag) return;
      st.drag = false; st.el.classList.remove('is-drag');
      if (!moved) { st.mat = (st.mat + 3) % FABRIC.length; paint(st); kick(st, 4); }
    };
    st.el.addEventListener('pointerup', up);
    st.el.addEventListener('pointercancel', up);
  });
  function kick(st, s = 9) { st.vx += (R() - .5) * s * 2; st.vy -= R() * s; }

  // the sticky note is loose too
  dragLoose(sticky);

  // threads: one path per letter
  const paths = letters.map(() => svg('path', { class: 'h-thread' }));
  const knots = letters.map(() => svg('path', { class: 'h-knot' }));
  threads.append(...paths, ...knots);

  let raf, t0 = performance.now(), nextPoke = 2600;
  const reduced = ctx.reduced;
  function tick(t) {
    const sr = stage.getBoundingClientRect();
    threads.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`);
    letters.forEach((st, i) => {
      if (st.drag) {
        st.vx = (st.tx - st.x) * .5; st.vy = (st.ty - st.y) * .5;
        st.x += st.vx; st.y += st.vy;
      } else {
        st.vx = (st.vx - st.x * .075) * .86; st.vy = (st.vy - st.y * .075) * .86;
        st.x += st.vx; st.y += st.vy;
      }
      const d = Math.hypot(st.x, st.y);
      st.r = clamp(st.vx * .9 + st.x * .02, -28, 28);
      const boil = reduced ? 0 : (((t / 250) | 0) % 2 ? st.jit : -st.jit * .5);
      st.el.style.transform = `translate(${st.x}px, ${st.y}px) rotate(${st.r + boil * .4}deg)`;
      st.g.style.fontStretch = clamp(125 - d / 4, 62, 125) + '%';
      // thread from the letter's home to where it is now
      if (!st.home) {
        const lr = st.el.getBoundingClientRect();
        st.home = { x: lr.left - sr.left + lr.width / 2 - st.x, y: lr.top - sr.top + lr.height * .55 - st.y };
      }
      const hx = st.home.x, hy = st.home.y, cx = hx + st.x, cy = hy + st.y;
      if (d > 3) {
        const mx = (hx + cx) / 2, my = (hy + cy) / 2 + d * .28;
        paths[i].setAttribute('d', `M ${hx} ${hy} Q ${mx} ${my} ${cx} ${cy}`);
        knots[i].setAttribute('d', `M ${hx - 6} ${hy - 6} L ${hx + 6} ${hy + 6} M ${hx + 6} ${hy - 6} L ${hx - 6} ${hy + 6}`);
        paths[i].style.opacity = knots[i].style.opacity = clamp(d / 30, 0, 1);
      } else {
        paths[i].style.opacity = knots[i].style.opacity = 0;
      }
    });
    // nobody's touching it: a letter wriggles loose now and then
    if (!touched && !reduced && t - t0 > nextPoke) {
      t0 = t; nextPoke = 2200 + R() * 2200;
      const st = letters[(R() * letters.length) | 0];
      st.vx += (R() - .5) * 60; st.vy -= 20 + R() * 30;
    }
    raf = requestAnimationFrame(tick);
  }
  // only run while on screen
  const io = new IntersectionObserver(([e]) => {
    cancelAnimationFrame(raf);
    if (e.isIntersecting) raf = requestAnimationFrame(tick);
  });
  io.observe(el);
  addEventListener('resize', () => letters.forEach((l) => (l.home = null)));

  // debug hook for screenshots: pull a letter out
  el.__pull = (i, x, y) => { const st = letters[i]; st.drag = true; st.tx = x; st.ty = y; touched = true; };

  // entrance: letters dropped onto the page like cut paper
  if (!reduced) {
    ctx.gsap.from(letters.map((l) => l.g), { yPercent: -120, rotation: () => (R() - .5) * 60, opacity: 0, duration: 1.1, ease: 'back.out(1.6)', stagger: { each: .045, from: 'random' }, delay: .35 });
    ctx.gsap.from([hey, line, roles, note, sticky, furn], { opacity: 0, y: 20, duration: .8, stagger: .06, delay: 1.0, ease: 'expo.out' });
  }
}

function dragLoose(node) {
  let sx, sy, ox = 0, oy = 0, x = 0, y = 0, on = false;
  node.addEventListener('pointerdown', (e) => { on = true; node.setPointerCapture(e.pointerId); sx = e.clientX; sy = e.clientY; ox = x; oy = y; node.classList.add('is-drag'); });
  node.addEventListener('pointermove', (e) => {
    if (!on) return; x = ox + e.clientX - sx; y = oy + e.clientY - sy;
    node.style.translate = `${x}px ${y}px`;
  });
  const up = () => { on = false; node.classList.remove('is-drag'); };
  node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up);
}
