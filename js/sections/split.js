// poster: SPLIT — designer | artist.
// one poster, two worlds sewn together by a seam the viewer moves. left of the seam a strict blue swiss poster
// ("i sell things."), right of it a crayon page ("i make things."). each world hides its work under the other one,
// so you have to push the seam to see it. the zip pull carries a woven label: "same guy."
import { h, svg, clamp, rng, img as photoUrl } from '../core/util.js';

const POSTERS = ['hello', 'split', 'wardrobe', 'loupe'];

export async function mount(el, ctx) {
  const { gsap, ScrollTrigger, reduced, img } = ctx;
  const list = POSTERS.filter((p) => (ctx.blocks || POSTERS).includes(p));
  const no = `${String(list.indexOf('split') + 1).padStart(2, '0')}/${String(list.length).padStart(2, '0')}`;
  const touch = ctx.isTouch;

  el.setAttribute('aria-label', 'designer, artist. same guy.');

  // ---------- the designer: a swiss poster ----------
  const svc = ['static ads', 'product listings', 'visual direction', 'gen ai'];
  const ads = [
    { id: 'b03', cap: 'one tee. one word. very big.' },
    { id: 'b13', cap: 'a lineup with one honest fit.' },
    { id: 'b06', cap: 'the price, divided by wears.' },
  ];
  const des = h('div.sp-layer.sp-des', { 'aria-hidden': 'false' },
    h('div.sp-cols', { 'aria-hidden': 'true' }, Array.from({ length: 8 }, () => h('i'))),
    h('div.sp-ruler', { 'aria-hidden': 'true' }),
    h('div.sp-sw', {},
      h('p.sp-info', {}, h('b', {}, 'A —'), ' the designer', h('br'), 'static ads, listings,', h('br'), 'visual direction, gen ai.', h('br'), h('span', {}, '2 years in the static ad game.')),
      h('p.sp-info.sp-info--r', {}, 'grid: 8 col / 12 row', h('br'), 'gutter 16 / margin 56', h('br'), 'archivo 900, 62% wide'),
      h('h2.sp-h.sp-h--des', {}, h('span.sp-l', {}, 'i sell'), h('span.sp-l', {}, 'things.')),
      h('ol.sp-svc', {}, svc.map((s, i) => h('li', {}, h('b', {}, String(i + 1).padStart(2, '0')), s))),
      ...ads.map((a, i) => h(`figure.sp-pin.sp-pin--${i + 1}`, {},
        h('img', { src: img(a.id, 's'), alt: 'static ad by anshul: ' + a.cap, width: 560, height: 700, loading: 'lazy', decoding: 'async' }),
        h('figcaption', {}, h('b', {}, `fig. 0${i + 1}`), ` static ad, 4:5. ${a.cap}`))),
      h('p.sp-push', { 'aria-hidden': 'true' }, 'the ads are under the crayons →'),
    ),
    h('div.sp-dim', { 'aria-hidden': 'true' }, h('span.sp-dim-n', {}, '—')),
    h('div.sp-cap', { 'aria-hidden': 'true' }, h('span', {}, 'cap'), h('span', {}, 'base')),
    furniture('des', no),
  );

  // ---------- the artist: a crayon page ----------
  const art = h('div.sp-layer.sp-art', {},
    h('div.sp-page', {},
      h('h2.sp-h.sp-h--art', {}, h('span.sp-l', {}, 'i make'), h('span.sp-l', {}, 'things.')),
      h('p.sp-and', {}, '(and things that don\'t have to sell.)'),
      h('ol.sp-hlist', {},
        h('li', {}, 'sketchbooks'), h('li', {}, 'ink faces'), h('li', {}, 'fan art'), h('li', {}, 'stuff at 3 a.m.')),
      piece('a63', 'sp-p1', '3 a.m. idea. still like it.', 640, 360),
      piece('a43', 'sp-p2', 'ink. no undo.', 640, 640),
      piece('a14', 'sp-p3', 'colour first, sense later', 640, 640),
      h('p.sp-pull-hint', { 'aria-hidden': 'true' }, '← the art is under the blue'),
    ),
    doodles(),
    furniture('art', no),
  );

  // ---------- the seam ----------
  const seamSvg = svg('svg', { class: 'sp-stitch', 'aria-hidden': 'true' });
  const tag = h('div.sp-tag', {},
    h('span.sp-tag-t', {}, 'same guy.'),
    h('span.sp-tag-s', {}, '100% anshul'));
  const pull = h('div.sp-pull', {
    role: 'slider', tabindex: '0', 'aria-label': 'the seam between designer and artist', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '50', 'data-hot': '',
    html: `<svg class="sp-slider" viewBox="0 0 40 74" aria-hidden="true">
      <rect x="9" y="2" width="22" height="20" rx="5" fill="#f4f1ea" stroke="#15120F" stroke-width="1.6"/>
      <rect x="13" y="6" width="14" height="5" rx="2" fill="#15120F" opacity=".18"/>
      <path d="M14 21 L14 58 Q14 70 20 70 Q26 70 26 58 L26 21" fill="#f4f1ea" stroke="#15120F" stroke-width="1.6"/>
      <rect x="17.5" y="30" width="5" height="30" rx="2.5" fill="#15120F" opacity=".85"/>
    </svg>`,
  }, tag);
  const readD = h('p.sp-read.sp-read--d', { 'aria-hidden': 'true' }, h('b', {}, '720'), ' px', h('br'), h('span', {}, '50.0%'));
  const readA = h('p.sp-read.sp-read--a', { 'aria-hidden': 'true' }, 'here-ish');
  const seam = h('div.sp-seam', {}, h('div.sp-fold'), seamSvg, readD, readA, pull);
  const hint = h('p.sp-hint', { 'aria-hidden': 'true' }, touch ? '← drag the seam →' : '← move. the seam follows →');

  el.append(svgDefs(), art, des, seam, hint);
  art.querySelector('.sp-h--art .sp-l:last-child').append(art.querySelector('.sp-d-under'));

  // ---------- layout ----------
  let W = 0, H = 0;
  const fit = (node, target, axis = 'w') => {
    node.style.setProperty('transition', 'none', 'important'); // base.css gives everything a .01ms transition under reduced motion
    node.style.fontSize = '100px';
    const r = node.getBoundingClientRect();
    const m = axis === 'w' ? r.width : r.height;
    node.style.fontSize = (100 * target / Math.max(1, m)) + 'px';
  };
  function layout() {
    W = el.clientWidth; H = el.clientHeight;
    const mob = W < 760;
    el.classList.toggle('is-mob', mob);
    // headlines
    const hd = des.querySelector('.sp-h--des');
    const ha = art.querySelector('.sp-h--art');
    if (mob) {
      fit(hd, Math.min(H * 0.6, 560), 'h');
      fit(ha, Math.min(H * 0.55, 520), 'h');
    } else {
      const colW = (W - 56 - 72 - 7 * 16) / 8;
      fit(hd, Math.min(4 * colW + 3 * 16 - 8, (H - 330) * 1.18), 'w');
      fit(ha, Math.min(W * 0.36, 560), 'w');
    }
    // dimension + cap/base marks follow the real headline
    const box = el.getBoundingClientRect();
    const l2 = hd.lastElementChild.getBoundingClientRect();
    const dim = des.querySelector('.sp-dim');
    const cap = des.querySelector('.sp-cap');
    if (!mob) {
      dim.style.cssText = `left:${l2.left - box.left}px; top:${l2.bottom - box.top + 6}px; width:${l2.width}px`;
      dim.firstChild.textContent = `${Math.round(l2.width)} px`;
      const fs = parseFloat(hd.style.fontSize);
      const capH = fs * 0.72;
      const base = l2.top - box.top + l2.height * 0.86;
      cap.style.cssText = `top:${base - capH}px; height:${capH}px; left:${l2.right - box.left + 14}px`;
    } else {
      const r = hd.getBoundingClientRect();
      dim.style.cssText = `left:${r.right - box.left + 6}px; top:${r.top - box.top}px; height:${r.height}px; width:0`;
      dim.firstChild.textContent = `${Math.round(r.height)} px`;
      cap.style.cssText = 'display:none';
    }
    // ruler + stitches
    drawRuler(des.querySelector('.sp-ruler'), W);
    drawStitch(seamSvg, H);
    if (!started) { x = tx = W * (reduced ? 0.5 : 0.9); y = ty = H * 0.5; }
  }

  // ---------- motion: a springy seam ----------
  let x = 0, vx = 0, tx = 0, y = 0, vy = 0, ty = 0, rot = 0, vr = 0;
  let started = false, lastInput = -1e9, dragging = false, inView = false, intro = reduced ? 1 : 0, t0 = performance.now();

  const setTarget = (cx, cy) => {
    const r = el.getBoundingClientRect();
    tx = clamp(cx - r.left, 0, W);
    if (cy != null) ty = clamp(cy - r.top, H * 0.16, H * 0.84);
    lastInput = performance.now();
    if (!started) { started = true; el.classList.add('is-touched'); }
  };
  if (!touch) {
    el.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') setTarget(e.clientX, e.clientY); });
  }
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    dragging = true; setTarget(e.clientX, e.clientY);
  });
  el.addEventListener('pointermove', (e) => { if (dragging && e.pointerType !== 'mouse') setTarget(e.clientX, e.clientY); });
  const end = () => { dragging = false; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  pull.addEventListener('keydown', (e) => {
    const step = W * (e.shiftKey ? 0.2 : 0.05);
    if (e.key === 'ArrowLeft') { tx = clamp(tx - step, 0, W); }
    else if (e.key === 'ArrowRight') { tx = clamp(tx + step, 0, W); }
    else if (e.key === 'Home') tx = 0;
    else if (e.key === 'End') tx = W;
    else return;
    e.preventDefault(); lastInput = performance.now(); started = true; el.classList.add('is-touched');
  });

  if (!reduced) {
    ScrollTrigger.create({
      trigger: el, start: 'top bottom', end: 'top 15%', scrub: true,
      onUpdate: (st) => { intro = st.progress; },
    });
  }
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0 }).observe(el);

  // crayon lines boil at 8 fps
  const turb = el.querySelector('#sp-rough feTurbulence');
  let boilT = 0, seed = 1;

  let readTick = 0;
  function tick(time, dt) {
    if (!inView || !W) return;
    const now = performance.now();
    const k = Math.min(dt / 16.67, 3);
    const idle = now - lastInput > (started ? 4200 : 0);
    if (idle && !dragging) {
      const s = (now - t0) / 1000;
      const sway = reduced ? 0 : Math.sin(s * 0.55) * 0.13 + Math.sin(s * 1.3) * 0.02;
      tx = W * (0.5 + 0.4 * (1 - intro) + sway * intro);
      ty = H * (0.5 + Math.sin(s * 0.4) * 0.08);
    }
    if (reduced) { x = tx; y = ty; }
    else {
      vx += (tx - x) * 0.085 * k; vx *= Math.pow(0.74, k); x += vx * k;
      vy += (ty - y) * 0.06 * k; vy *= Math.pow(0.78, k); y += vy * k;
      // the tag swings against the motion
      vr += ((-vx * 0.9 - vy * 0.2) - rot) * 0.08 * k - rot * 0.02 * k; vr *= Math.pow(0.86, k); rot += vr * k;
      rot = clamp(rot, -38, 38);
    }
    const xp = clamp(x, 0, W);
    el.style.setProperty('--x', xp.toFixed(1) + 'px');
    el.style.setProperty('--y', y.toFixed(1) + 'px');
    // keep the label on the poster when the seam runs to an edge
    const half = tag.offsetWidth / 2 || 70;
    const shift = xp + half > W - 10 ? W - 10 - half - xp : xp - half < 10 ? 10 + half - xp : 0;
    tag.style.transform = `translateX(${shift.toFixed(1)}px) rotate(${(rot + 4).toFixed(2)}deg)`;
    if (++readTick % 3 === 0) {
      readD.firstChild.textContent = String(Math.round(xp));
      readD.lastChild.textContent = (xp / W * 100).toFixed(1) + '%';
      const p = xp / W;
      const say = p < 0.2 ? 'ok.. mostly art now' : p < 0.4 ? 'more art pls' : p > 0.82 ? 'ok ok, he sells' : p > 0.62 ? 'bit more design' : 'here-ish';
      if (readA.textContent !== say) readA.textContent = say;
      pull.setAttribute('aria-valuenow', Math.round(p * 100));
      el.classList.toggle('is-l', p < 0.4);
      el.classList.toggle('is-r', p > 0.6);
      el.classList.toggle('is-er', p > 0.86);
      el.classList.toggle('is-el', p < 0.14);
    }
    if (!reduced && turb && (boilT += dt) > 125) { boilT = 0; seed = (seed % 5) + 1; turb.setAttribute('seed', seed); }
  }

  await document.fonts.load('900 100px Archivo');
  await Promise.all([document.fonts.load('100px "Permanent Marker"'), document.fonts.load('20px "Gochi Hand"'), document.fonts.load('10px "JetBrains Mono"')]);
  layout();
  el.style.setProperty('--x', x + 'px');
  gsap.ticker.add(tick);
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layout, 120); });

  // debug hook for screenshots: __split(0.3) puts the seam at 30%
  window.__split = (p, py = 0.5) => { started = true; lastInput = performance.now() + 1e7; tx = x = W * p; ty = y = H * py; vx = 0; };
}

// ---------- pieces ----------
function furniture(kind, no) {
  return h(`div.sp-pf.sp-pf--${kind}`, { 'aria-hidden': 'true' },
    h('span.pf-tl', {}, 'hey, i\'m anshul'),
    h('span.pf-tc', {}, kind === 'des' ? 'designer' : 'artist'),
    h('span.pf-bl', {}, h('b', {}, no), kind === 'des' ? ' designer | artist' : ' designer | artist'),
    h('span.pf-br', {}, 'RA.S'),
    kind === 'des' ? h('span.pf-reg', { html: regMark() }) : h('span.pf-reg', { html: scribbleMark() }),
  );
}

function regMark() {
  return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" stroke-width="1"/><path d="M12 0v24M0 12h24" stroke="currentColor" stroke-width="1"/></svg>';
}
function scribbleMark() {
  return '<svg viewBox="0 0 24 24"><path d="M5 13c1-6 9-8 13-4s-1 11-7 10S2 14 6 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" filter="url(#sp-rough)"/><path d="M12 2v20M2 12h20" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" filter="url(#sp-rough)"/></svg>';
}

function piece(id, cls, note, w, hgt) {
  return h(`figure.sp-piece.${cls}`, {},
    h('span.tape'),
    h('img', { src: photoUrl(id, 's'), alt: 'artwork by anshul', width: w, height: hgt, loading: 'lazy', decoding: 'async' }),
    h('figcaption', {}, note));
}

function svgDefs() {
  return svg('svg', { class: 'sp-defs', width: 0, height: 0, 'aria-hidden': 'true' },
    svg('defs', {},
      svg('filter', { id: 'sp-rough', x: '-10%', y: '-10%', width: '120%', height: '120%' },
        svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.045', numOctaves: '2', seed: '1', result: 'n' }),
        svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '3.2' })),
      svg('filter', { id: 'sp-crayon', x: '-5%', y: '-20%', width: '110%', height: '140%' },
        svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: '1', seed: '3', result: 'g' }),
        svg('feColorMatrix', { in: 'g', type: 'matrix', values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.5', result: 'm' }),
        svg('feComposite', { in: 'SourceGraphic', in2: 'm', operator: 'in', result: 'c' }),
        svg('feDisplacementMap', { in: 'c', in2: 'g', scale: '2.4' }))));
}

function doodles() {
  // hand-drawn bits on the crayon page (viewBox = poster in %, so they stretch with it)
  return h('div.sp-doodles', {
    'aria-hidden': 'true',
    html: `
    <svg class="sp-d sp-d-under" viewBox="0 0 400 40" preserveAspectRatio="none"><path d="M4 26 C 70 14, 150 30, 230 18 S 350 12, 396 22 M 20 34 C 120 26, 240 34, 380 28" fill="none" stroke="#E5331F" stroke-width="9" stroke-linecap="round" filter="url(#sp-crayon)"/></svg>
    <svg class="sp-d sp-d-star" viewBox="0 0 60 60"><path d="M30 4 L36 24 L56 24 L40 36 L46 56 L30 44 L14 56 L20 36 L4 24 L24 24 Z" fill="#FFD43B" stroke="#15120F" stroke-width="2.4" stroke-linejoin="round" filter="url(#sp-rough)"/></svg>
    <svg class="sp-d sp-d-spiral" viewBox="0 0 80 80"><path d="M40 40 m0 -3 a3 3 0 1 1 -3 3 a7 7 0 0 1 7 -7 a11 11 0 0 1 11 11 a15 15 0 0 1 -15 15 a19 19 0 0 1 -19 -19 a23 23 0 0 1 23 -23 a27 27 0 0 1 27 27" fill="none" stroke="#1E9C5B" stroke-width="4" stroke-linecap="round" filter="url(#sp-crayon)"/></svg>
    <svg class="sp-d sp-d-face" viewBox="0 0 70 70"><circle cx="35" cy="35" r="27" fill="none" stroke="#15120F" stroke-width="2.4" filter="url(#sp-rough)"/><circle cx="26" cy="30" r="2.6" fill="#15120F"/><circle cx="44" cy="30" r="2.6" fill="#15120F"/><path d="M24 44 Q35 53 47 43" fill="none" stroke="#15120F" stroke-width="2.4" stroke-linecap="round" filter="url(#sp-rough)"/></svg>
    <svg class="sp-d sp-d-blob" viewBox="0 0 120 90"><path d="M20 50 C 4 20, 50 2, 70 18 C 92 0, 124 30, 104 52 C 120 80, 70 92, 56 74 C 36 92, 4 78, 20 50 Z" fill="#2443F0" opacity=".9" filter="url(#sp-crayon)"/></svg>
    <svg class="sp-d sp-d-arrow" viewBox="0 0 120 60"><path d="M112 40 C 80 54, 40 50, 12 22 M12 22 L 30 24 M12 22 L 16 40" fill="none" stroke="#15120F" stroke-width="2.6" stroke-linecap="round" filter="url(#sp-rough)"/></svg>
    <svg class="sp-d sp-d-scrib" viewBox="0 0 200 80"><path d="M6 60 C 30 10, 40 70, 62 22 S 92 70, 112 20 S 150 74, 168 24 S 190 50, 196 40" fill="none" stroke="#FFD43B" stroke-width="10" stroke-linecap="round" filter="url(#sp-crayon)"/></svg>`,
  });
}

function drawRuler(box, W) {
  const s = svg('svg', { viewBox: `0 0 ${W} 22`, width: W, height: 22 });
  let d = '';
  const labels = [];
  for (let i = 0; i <= W; i += 8) {
    const big = i % 80 === 0, mid = i % 40 === 0;
    d += `M${i + 0.5} 0V${big ? 12 : mid ? 8 : 4}`;
    if (big && i > 0 && i < W - 30) labels.push(svg('text', { x: i + 3, y: 20 }, document.createTextNode(String(i))));
  }
  s.append(svg('path', { d, stroke: 'currentColor', 'stroke-width': 1 }), ...labels);
  box.replaceChildren(s);
}

function drawStitch(s, H) {
  // a running stitch down the seam + little cross stitches holding the two fabrics together
  const r = rng(11);
  let d = `M0 -10`;
  for (let y = 0; y <= H + 30; y += 30) d += ` Q ${(r() - 0.5) * 2.4} ${y + 15} 0 ${y + 30}`;
  let x = '';
  for (let y = 12; y < H; y += 26) x += `M-7 ${y - 4} L7 ${y + 4} `;
  s.setAttribute('viewBox', `-12 0 24 ${H}`);
  s.setAttribute('height', H);
  s.replaceChildren(
    svg('path', { d: x, class: 'sp-x' }),
    svg('path', { d, class: 'sp-run' }));
}
