// section 3 · INSIDE — "rags of thoughts".
// a dark field full of torn fabric / paper scraps, each one a thought. they drift, bump into each other and the
// cursor (or a finger) stirs them. "tidy up" = designer brain: everything files itself into a typeset index.
// "let go" = artist brain: back to the pile. click a scrap to pin it to the front.
import { h, rng, clamp } from '../core/util.js';
import { thoughts, drawers, marks } from '../content/inside.js';

const CLOTHS = [ // [class, weight]
  ['paper', 30], ['label', 17], ['red', 17], ['ink', 8], ['brick', 8], ['yellow', 6], ['blue', 7], ['crumple', 7],
];
const RAGS = [['red', 26], ['brick', 14], ['paper', 18], ['label', 8], ['ink', 10], ['blue', 10], ['yellow', 7], ['crumple', 7]];
const RAG_ORDER = ['red', 'brick', 'yellow', 'paper', 'crumple', 'label', 'blue', 'ink']; // the swatch strip, by colour
const FONTS = [['hand', 26], ['display', 18], ['serif', 16], ['marker', 12], ['mono', 12], ['pencil', 9], ['pixel', 7]];

export async function mount(el, ctx) {
  const { gsap } = ctx;
  const reduced = ctx.reduced;
  const R = rng(1303);
  const pick = (list) => { const tot = list.reduce((a, b) => a + b[1], 0); let r = R() * tot; for (const [k, w] of list) { if ((r -= w) <= 0) return k; } return list[0][0]; };
  let mob = innerWidth < 760;

  // ---------- dom ----------
  const field = h('div.in-field');
  const glow = h('div.in-glow', { 'aria-hidden': 'true' });
  const head = h('h2.in-head', {},
    h('span.in-head-a', {}, 'this is what it'), h('br'),
    h('span.in-head-b', {}, 'looks like ', h('em', {}, 'in here.')));
  const sub = h('p.in-sub', {}, 'stir it. click one to pin it.');
  const cornerL = h('p.in-corner.in-corner--l', {}, h('b', {}, '§13'), ' inside', h('br'), h('span', {}, 'the brain, unsupervised'));
  const cornerR = h('p.in-corner.in-corner--r', { 'aria-live': 'polite' });
  const list = h('ul.in-scraps', { 'aria-label': 'thoughts, floating around' });
  const drawerBox = h('div.in-drawers', { 'aria-hidden': 'true' });
  const btnTidy = h('button.in-btn.in-btn--tidy', { type: 'button', 'aria-pressed': 'false' }, h('small', {}, 'designer brain'), h('span', {}, 'tidy up'));
  const btnLoose = h('button.in-btn.in-btn--loose.is-on', { type: 'button', 'aria-pressed': 'true' }, h('small', {}, 'artist brain'), h('span', {}, 'let go'));
  const ctrl = h('div.in-ctrl', {}, btnTidy, btnLoose);
  field.append(glow, cornerL, cornerR, head, sub, drawerBox, list, ctrl);
  el.append(field);

  // ---------- scraps ----------
  const pool = mob ? thoughts.filter((t) => t.m) : thoughts;
  const nRags = mob ? 46 : 86;
  const S = []; // every scrap's state
  let idx = 0;
  for (const t of pool) {
    const cloth = pick(CLOTHS);
    const font = t.deva ? 'deva' : pick(FONTS);
    const n = ++idx;
    const li = h(`li.in-scrap.c-${cloth}.f-${font}${t.big ? '.is-big' : ''}`, { 'data-hot': '' },
      h('span.in-cloth', { style: { clipPath: torn(R) } },
        R() < 0.42 ? h('i', {}, 'th.' + String(n).padStart(3, '0')) : null,
        h('span.in-t', t.deva ? { lang: 'hi' } : {}, t.t)));
    list.append(li);
    S.push({ el: li, kind: 't', c: t.c, txt: t.t.replace(/[^a-z0-9ऀ-ॿ ]/gi, '').trim().toLowerCase(), big: !!t.big, cloth });
  }
  for (let i = 0; i < nRags; i++) {
    const cloth = pick(RAGS);
    const w = Math.round((mob ? 16 : 20) + R() * R() * (mob ? 56 : 80));
    const hh = Math.round((mob ? 9 : 11) + R() * (mob ? 22 : 30));
    const mk = R() < 0.22 ? marks[Math.floor(R() * marks.length)] : '';
    const li = h(`li.in-scrap.in-rag.c-${cloth}${R() < 0.35 ? '.has-stitch' : ''}`, { 'aria-hidden': 'true' },
      h('span.in-cloth', { style: { clipPath: torn(R, 3), width: w + 'px', height: hh + 'px' } }, mk ? h('span.in-t', {}, mk) : null));
    list.append(li);
    S.push({ el: li, kind: 'r', cloth, txt: '' });
  }
  await document.fonts.ready;

  // ---------- geometry ----------
  let W = 0, H = 0, zTop = 10;
  let avoid = []; // rects the scraps keep away from (headline, buttons)
  function measure() {
    mob = innerWidth < 760;
    W = field.clientWidth; H = field.clientHeight;
    for (const p of S) {
      p.w = p.el.offsetWidth; p.h = p.el.offsetHeight;
      p.rad = Math.sqrt(p.w * p.h) * 0.46;
      p.mass = p.kind === 't' ? (p.big ? 3 : 1.6) : 0.6;
    }
    const fr = field.getBoundingClientRect();
    const rr = (n, pad = 0) => { const b = n.getBoundingClientRect(); return { x: b.left - fr.left - pad, y: b.top - fr.top - pad, w: b.width + pad * 2, h: b.height + pad * 2 }; };
    avoid = [{ ...rr(head, 10), k: 0.035 }, { ...rr(ctrl, 18), k: 0.12 }];
    // the thoughts hang around in a loose cloud (the head), leaving air at the edges
    cloud = mob ? { x: W * 0.5, y: H * 0.55, rx: W * 0.3, ry: H * 0.26 } : { x: W * 0.54, y: H * 0.5, rx: W * 0.37, ry: H * 0.36 };
  }
  let cloud;
  measure();

  // starting pile: random, keeps out of the headline + buttons
  for (const p of S) {
    let tries = 0;
    do { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 1.05; p.x = cloud.x + Math.cos(a) * cloud.rx * d; p.y = cloud.y + Math.sin(a) * cloud.ry * d; } while (tries++ < 30 && avoid.some((a) => inRect(p.x, p.y, a, 20)));
    p.vx = p.vy = 0; p.vr = 0;
    p.rest = (R() - 0.5) * (p.kind === 't' ? (p.big ? 14 : 36) : 110);
    p.r = p.rest;
    p.s = 1; p.seed = R() * 100; p.pinned = false; p.z = 0;
    p.el.style.zIndex = p.kind === 't' ? (p.big ? 4 : 3) : (R() < 0.5 ? 1 : 5);
  }

  // ---------- pointer (mouse + touch) ----------
  const ptr = { x: -999, y: -999, vx: 0, vy: 0, on: 0, cx: 0, cy: 0, has: false };
  let fieldTop = 0, fieldLeft = 0;
  const syncRect = () => { const b = field.getBoundingClientRect(); fieldTop = b.top; fieldLeft = b.left; };
  function feed(cx, cy) {
    ptr.cx = cx; ptr.cy = cy; ptr.has = true;
    syncRect();
    const nx = cx - fieldLeft, ny = cy - fieldTop;
    if (ptr.x > -900) { ptr.vx += (nx - ptr.x - ptr.vx) * 0.5; ptr.vy += (ny - ptr.y - ptr.vy) * 0.5; }
    ptr.x = nx; ptr.y = ny; ptr.on = 1;
  }
  let downAt = null;
  field.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') feed(e.clientX, e.clientY); }, { passive: true });
  field.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { ptr.on = 0; ptr.x = -999; } });
  field.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY }; });
  field.addEventListener('touchstart', (e) => { const t = e.touches[0]; ptr.x = -999; feed(t.clientX, t.clientY); }, { passive: true });
  field.addEventListener('touchmove', (e) => { const t = e.touches[0]; feed(t.clientX, t.clientY); }, { passive: true });
  field.addEventListener('touchend', () => { ptr.on = 0; ptr.x = -999; }, { passive: true });
  // scrolling under a still mouse also stirs (the field moves, the hand doesn't)
  addEventListener('scroll', () => { if (ptr.on && ptr.has && !ctx.isTouch) feed(ptr.cx, ptr.cy); }, { passive: true });

  // ---------- click to pin ----------
  const pinned = [];
  list.addEventListener('click', (e) => {
    const li = e.target.closest('.in-scrap:not(.in-rag)');
    if (!li || mode !== 'loose') return;
    if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) return;
    const p = S.find((q) => q.el === li);
    if (p.pinned) unpin(p); else pin(p);
  });
  function pin(p) {
    if (pinned.length >= 3) unpin(pinned[0]);
    p.pinned = true; pinned.push(p);
    p.el.style.zIndex = 50 + (++zTop);
    p.el.classList.add('is-pinned');
    p.vx = p.vy = p.vr = 0;
    const s = p.big ? 1.18 : mob ? 1.35 : 1.6;
    const pad = (p.w * s) / 2 + 12;
    gsap.to(p, { r: (R() - 0.5) * 6, s, x: clamp(p.x, pad, W - pad - (mob ? 0 : 40)), y: clamp(p.y, (p.h * s) / 2 + 30, H - (p.h * s) / 2 - 20), duration: 0.7, ease: 'back.out(2.2)', overwrite: true });
    say(['pinned. that one stays.', 'ok that one is important.', 'noted. probably.', 'this one pays rent.'][pinned.length % 4]);
  }
  function unpin(p) {
    p.pinned = false;
    pinned.splice(pinned.indexOf(p), 1);
    p.el.classList.remove('is-pinned');
    gsap.to(p, { s: 1, duration: 0.5, ease: 'power3.out', overwrite: true });
    p.vx = (R() - 0.5) * 6; p.vy = (R() - 0.5) * 6; p.vr = (R() - 0.5) * 4;
  }

  // ---------- modes ----------
  let mode = 'loose';
  const total = S.filter((p) => p.kind === 't').length;
  const counter = () => {
    cornerR.innerHTML = mode === 'tidy'
      ? `<b>${total}</b> thoughts · ${drawers.length} drawers<br><span>sorted a–z. still 0 finished.</span>`
      : `<b>${total}</b> thoughts · ${S.length - total} loose bits<br><span>0 finished</span>`;
  };
  counter();
  let sayT;
  function say(t) {
    sub.textContent = t;
    gsap.fromTo(sub, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: 'steps(3)' });
    clearTimeout(sayT);
    sayT = setTimeout(() => { if (mode === 'loose') sub.textContent = 'stir it. click one to pin it.'; }, 3800);
  }

  function setMode(m) {
    if (m === mode) { if (m === 'loose') kick(1.4); return; }
    mode = m;
    btnTidy.classList.toggle('is-on', m === 'tidy'); btnTidy.setAttribute('aria-pressed', m === 'tidy');
    btnLoose.classList.toggle('is-on', m === 'loose'); btnLoose.setAttribute('aria-pressed', m === 'loose');
    field.classList.toggle('is-tidy', m === 'tidy');
    counter();
    if (m === 'tidy') tidy(); else letGo();
  }
  btnTidy.addEventListener('click', () => setMode('tidy'));
  btnLoose.addEventListener('click', () => setMode('loose'));

  function layoutTidy() {
    // a typeset index: one block per drawer, label on the left (or above on phones), scraps flowing a–z
    const hr = head.getBoundingClientRect(), fr = field.getBoundingClientRect(), cr = ctrl.getBoundingClientRect();
    const x0 = mob ? 16 : 28;
    const x1 = W - (mob ? 16 : 70);
    const top = mob ? head.offsetTop + head.offsetHeight * 0.34 + 26 : 108;
    const headTop = fr.bottom - fr.top - 34 - head.offsetHeight * 0.42; // the headline shrinks in tidy mode
    const bottom = mob ? cr.top - fr.top - 18 : Math.min(headTop - 40, cr.top - fr.top) - 26;
    const labW = mob ? 0 : 150;
    for (let th = mob ? 26 : 34; th >= 15; th -= 1) {
      const out = new Map(); const heads = [];
      let y = top;
      const gap = Math.round(th * 0.22), rowH = th + Math.round(th * 0.18), drawerGap = mob ? 12 : 18;
      const block = (label, items, tag, sizeOf) => {
        heads.push({ label, n: items.length, x: x0, y, tag });
        if (mob) y += 20;
        let x = x0 + labW;
        let rowY = y;
        for (const p of items) {
          const { s, w, hgt } = sizeOf(p);
          if (x + w > x1 && x > x0 + labW) { x = x0 + labW; rowY += rowH; }
          out.set(p, { x: x + w / 2, y: rowY + hgt / 2 + (th - hgt) / 2, s });
          x += w + gap;
        }
        y = rowY + rowH + drawerGap;
      };
      drawers.forEach((d, i) => {
        const items = S.filter((p) => p.kind === 't' && p.c === d.k).sort((a, b) => a.txt.localeCompare(b.txt));
        block(d.label, items, String(i + 1).padStart(2, '0'), (p) => { const s = Math.min(1, th / p.h); return { s, w: p.w * s, hgt: p.h * s }; });
      });
      const rags = S.filter((p) => p.kind === 'r').sort((a, b) => RAG_ORDER.indexOf(a.cloth) - RAG_ORDER.indexOf(b.cloth) || b.h * b.w - a.h * a.w);
      const sh = Math.round(th * 0.62);
      block('rags, by colour', rags, String(drawers.length + 1).padStart(2, '0'), (p) => { const s = Math.min(sh / p.h, (sh * 1.8) / p.w); return { s, w: p.w * s, hgt: p.h * s }; });
      if (y - (mob ? 12 : 18) <= bottom || th === 15) return { out, heads, top, th, x1 };
    }
  }

  function tidy() {
    pinned.slice().forEach(unpin);
    const L = layoutTidy();
    drawerBox.innerHTML = '';
    L.heads.forEach((d, i) => {
      const lab = h('p.in-drawer', { style: { left: d.x + 'px', top: d.y + 'px', width: (L.x1 - d.x) + 'px', '--th': L.th + 'px' } },
        h('b', {}, d.tag), ' ', d.label, h('span', {}, ` (${d.n})`));
      drawerBox.append(lab);
      gsap.fromTo(lab, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, delay: 0.25 + i * 0.06, ease: 'steps(4)' });
    });
    let k = 0;
    for (const p of S) {
      const t = L.out.get(p);
      p.vx = p.vy = p.vr = 0;
      // swatches: rags get squared off into chips
      if (p.kind === 'r') p.el.classList.add('is-chip');
      gsap.to(p, { x: t.x, y: t.y, r: 0, s: t.s, duration: reduced ? 0.01 : 0.85 + R() * 0.25, delay: reduced ? 0 : (k++) * 0.0035, ease: 'expo.inOut', overwrite: true });
    }
    gsap.to(sub, { opacity: 0, duration: 0.15, onComplete: () => { sub.textContent = 'designer brain: on. (it won\'t last.)'; gsap.to(sub, { opacity: 1, duration: 0.3 }); } });
  }

  function letGo() {
    gsap.killTweensOf(S);
    drawerBox.querySelectorAll('.in-drawer').forEach((d, i) => gsap.to(d, { opacity: 0, x: 8, duration: 0.2, delay: i * 0.02, ease: 'steps(3)' }));
    for (const p of S) {
      p.el.classList.remove('is-chip');
      p.rest = (Math.random() - 0.5) * (p.kind === 't' ? (p.big ? 14 : 36) : 110); // a fresh mess every time
      gsap.to(p, { s: 1, duration: 0.6, ease: 'power2.out' });
    }
    if (reduced) { scatterStatic(); } else kick(1);
    say('artist brain: back in charge.');
  }
  function kick(f) {
    const cx = W / 2, cy = H / 2;
    for (const p of S) {
      if (p.pinned) continue;
      const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1;
      const m = (10 + R() * 22) * f / Math.sqrt(p.mass);
      p.vx += (dx / d) * m * (0.4 + R()) + (R() - 0.5) * 10 * f;
      p.vy += (dy / d) * m * (0.4 + R()) + (R() - 0.5) * 10 * f;
      p.vr += (R() - 0.5) * 10 * f / p.mass;
    }
  }
  function scatterStatic() {
    for (const p of S) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R());
      p.x = cloud.x + Math.cos(a) * cloud.rx * d; p.y = cloud.y + Math.sin(a) * cloud.ry * d; p.r = p.rest; p.s = 1;
    }
    render();
  }

  // ---------- the loop ----------
  const RAD = mob ? 120 : 190;
  let running = false, last = 0, gx = W * 0.5, gy = H * 0.55;
  const cell = 90; const grid = new Map();
  function step(time) {
    const dt = clamp((time - (last || time)) / 16.667, 0.2, 2.5); last = time;
    const t = time * 0.001;
    if (mode === 'loose' && !reduced) {
      // collisions (loose: soft push, a pile is allowed to overlap a bit)
      grid.clear();
      for (const p of S) { const k = ((p.x / cell) | 0) + ',' + ((p.y / cell) | 0); let b = grid.get(k); if (!b) grid.set(k, (b = [])); b.push(p); }
      for (const p of S) {
        const gx0 = (p.x / cell) | 0, gy0 = (p.y / cell) | 0;
        for (let ix = -1; ix <= 1; ix++) for (let iy = -1; iy <= 1; iy++) {
          const b = grid.get((gx0 + ix) + ',' + (gy0 + iy)); if (!b) continue;
          for (const q of b) {
            if (q === p || q.kind === 'r' && p.kind === 'r') continue;
            const dx = q.x - p.x, dy = q.y - p.y; const d = Math.hypot(dx, dy) || 0.01; const min = (p.rad + q.rad) * 0.62;
            if (d < min) {
              const push = (min - d) * 0.012 * dt;
              const pm = p.pinned ? 0 : 1 / p.mass, qm = q.pinned ? 0 : 1 / q.mass;
              p.vx -= (dx / d) * push * pm; p.vy -= (dy / d) * push * pm;
            }
          }
        }
      }
      const pv = Math.hypot(ptr.vx, ptr.vy);
      for (const p of S) {
        if (p.pinned) continue;
        // drift: a slow flow field, so the pile breathes
        const a = Math.sin(p.y * 0.0042 + t * 0.21 + p.seed) * 2.2 + Math.cos(p.x * 0.0031 - t * 0.17) * 1.4;
        p.vx += Math.cos(a) * 0.016 * dt; p.vy += Math.sin(a) * 0.016 * dt;
        p.vr += Math.sin(t * 0.6 + p.seed) * 0.004 * dt + (p.rest - p.r) * 0.0016 * dt;
        // loose pull back into the cloud
        const ex = (p.x - cloud.x) / cloud.rx, ey = (p.y - cloud.y) / cloud.ry, e2 = ex * ex + ey * ey;
        if (e2 > 1) { const k = Math.min(e2 - 1, 2) * 0.05 * dt; p.vx -= ex * k * 3; p.vy -= ey * k * 3; }
        // the hand stirs
        if (ptr.on) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y; const d = Math.hypot(dx, dy);
          if (d < RAD && d > 0.1) {
            const f = 1 - d / RAD; const ff = f * f;
            const rep = (0.55 + pv * 0.05) * ff / Math.sqrt(p.mass);
            p.vx += (dx / d) * rep * dt; p.vy += (dy / d) * rep * dt;
            p.vx += ptr.vx * 0.075 * f * dt; p.vy += ptr.vy * 0.075 * f * dt;
            p.vr += ((dx * ptr.vy - dy * ptr.vx) / (d * RAD)) * f * 3.2 * dt / p.mass;
          }
        }
        // keep out of the headline (soft) and the buttons (firm)
        for (const r of avoid) {
          if (inRect(p.x, p.y, r, 0)) {
            const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
            const ex = (p.x - cx) / (r.w / 2), ey = (p.y - cy) / (r.h / 2);
            if (Math.abs(ex) > Math.abs(ey) * (r.w / r.h) * 0.25) p.vx += Math.sign(ex || 1) * r.k * 6 * dt; else p.vy += Math.sign(ey || 1) * r.k * 6 * dt;
          }
        }
        // walls
        const m = 26, mt = 40;
        if (p.x < m) p.vx += (m - p.x) * 0.01 * dt; else if (p.x > W - m) p.vx -= (p.x - W + m) * 0.01 * dt;
        if (p.y < mt) p.vy += (mt - p.y) * 0.01 * dt; else if (p.y > H - m) p.vy -= (p.y - H + m) * 0.01 * dt;
        const damp = Math.pow(0.935, dt);
        p.vx *= damp; p.vy *= damp; p.vr *= Math.pow(0.93, dt);
        const sp = Math.hypot(p.vx, p.vy); if (sp > 38) { p.vx *= 38 / sp; p.vy *= 38 / sp; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.r += p.vr * dt; p.r = clamp(p.r, -70, 70);
      }
      ptr.vx *= 0.82; ptr.vy *= 0.82;
    }
    // the red glow follows attention, slowly
    const tx = ptr.on ? ptr.x : W * 0.5 + Math.sin(t * 0.3) * W * 0.12, ty = ptr.on ? ptr.y : H * 0.55 + Math.cos(t * 0.23) * H * 0.08;
    gx += (tx - gx) * 0.04 * dt; gy += (ty - gy) * 0.04 * dt;
    glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
    render();
  }
  function render() {
    for (const p of S) {
      const tr = `translate3d(${(p.x - p.w / 2).toFixed(1)}px, ${(p.y - p.h / 2).toFixed(1)}px, 0) rotate(${p.r.toFixed(2)}deg) scale(${p.s.toFixed(3)})`;
      if (tr !== p.tr) { p.el.style.transform = tr; p.tr = tr; }
    }
  }
  const tick = (time) => step(time * 1000);
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; last = 0; gsap.ticker.add(tick); }
    else if (!e.isIntersecting && running) { running = false; gsap.ticker.remove(tick); }
  }, { rootMargin: '80px 0px' });
  io.observe(field);
  render();
  field.classList.add('is-ready');

  // first time you arrive, the pile does a little shrug
  if (!reduced) {
    ctx.ScrollTrigger.create({ trigger: field, start: 'top 60%', once: true, onEnter: () => kick(0.5) });
  }

  let rz;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      measure();
      for (const p of S) { p.x = clamp(p.x, 10, W - 10); p.y = clamp(p.y, 20, H - 10); }
      if (mode === 'tidy') tidy();
    }, 200);
  });

  // debug hooks for screenshots
  el.__inside = { tidy: () => setMode('tidy'), loose: () => setMode('loose'), pin: (i) => pin(S[i]), S, stir: (x, y, vx, vy) => { ptr.x = x; ptr.y = y; ptr.vx = vx; ptr.vy = vy; ptr.on = 1; } };
}

function inRect(x, y, r, pad) { return x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad; }

// a torn edge: straight-ish top and bottom, ragged left and right
function torn(R, jag = 5) {
  const pts = [];
  const n = 4 + Math.floor(R() * 4);
  pts.push(`${(R() * 3).toFixed(1)}px ${(R() * 2).toFixed(1)}px`);
  for (let i = 1; i < 6; i++) pts.push(`${(i * 20).toFixed(0)}% ${(R() * 1.6).toFixed(1)}px`);
  pts.push(`calc(100% - ${(R() * 3).toFixed(1)}px) ${(R() * 2).toFixed(1)}px`);
  for (let i = 1; i < n; i++) pts.push(`calc(100% - ${(R() * jag).toFixed(1)}px) ${((i / n) * 100).toFixed(1)}%`);
  pts.push(`calc(100% - ${(R() * 3).toFixed(1)}px) calc(100% - ${(R() * 2).toFixed(1)}px)`);
  for (let i = 5; i > 0; i--) pts.push(`${(i * 20).toFixed(0)}% calc(100% - ${(R() * 1.6).toFixed(1)}px)`);
  pts.push(`${(R() * 3).toFixed(1)}px calc(100% - ${(R() * 2).toFixed(1)}px)`);
  for (let i = n - 1; i > 0; i--) pts.push(`${(R() * jag).toFixed(1)}px ${((i / n) * 100).toFixed(1)}%`);
  return `polygon(${pts.join(',')})`;
}
