// THE DESK (S = self). a top-down desk where the objects are the nav and the content.
// everything is drawn here (svg/css + media/tex), lit by a soft window, switchable to the desk lamp.
// physics: gsap Draggable + inertia for objects, a verlet rope for the lanyard badge.
import { h, svg, rng, clamp } from '../core/util.js';
import { desk as D } from '../content/desk.js';

const SVGNS = 'http://www.w3.org/2000/svg';

// ---------- layouts: centre point of each object. d = desktop [x frac, y frac, deg], m = mobile [x frac, y px, deg]
// t = "tidy" (knolling) desktop positions.
const L = {
  mat:    { d: [.19, .76, -4], m: [.5, 1190, -7],  t: [.2, .72, 0] },
  ruler:  { d: [.215, .47, -3], m: [.5, 935, -4],   t: [.2, .461, 0] },
  knife:  { d: [.085, .79, -24], m: [.9, 1300, -70], t: [.375, .72, 90] },
  sheet:  { d: [.272, .742, -2.5], m: [.5, 1185, -2], t: [.2, .72, 0] },
  pad:    { d: [.215, .15, -7],  m: [.27, 1600, -6],  t: [.182, .167, 0] },
  lamp:   { d: [.072, .21, 0],   m: [.16, 500, 0],     t: [.069, .194, 0] },
  pencilY:{ d: [.14, .375, 7],  m: [.45, 1455, -4],  t: [.028, .72, 90] },
  pencilB:{ d: [.158, .397, 13], m: [.5, 1476, 3],  t: [.043, .72, 90] },
  tape:   { d: [.412, .15, 0],   m: [.8, 815, 0],   t: [.394, .167, 0] },
  eraser: { d: [.555, .955, 16],  m: [.8, 2770, 14],  t: [.052, .928, 0] },
  crumple:{ d: [.493, .09, 0],   m: [.82, 690, 0],    t: [.43, .867, 0] },
  cv:     { d: [.598, .175, 5],  m: [.3, 762, -5],   t: [.549, .189, 0] },
  dymo:   { d: [.43, .525, -2],  m: [.31, 292, -3],   t: [.43, .506, 0] },
  mug:    { d: [.535, .765, 0],  m: [.68, 1785, 0],   t: [.51, .855, 0] },
  phone:  { d: [.65, .815, 9],   m: [.3, 2690, -6],   t: [.65, .82, 0] },
  receipt:{ d: [.887, .49, 3],   m: [.5, 2165, 2],   t: [.887, .52, 0] },
  env:    { d: [.785, .885, -6], m: [.55, 2985, -4],  t: [.77, .89, 0] },
  clipA:  { d: [.335, .565, 30], m: [.1, 1012, 30],  t: [.361, .517, 0] },
  clipB:  { d: [.35, .585, -12], m: [.13, 1032, -12], t: [.361, .539, 0] },
};
// loose sticky notes already on the desk
const NOTES = [
  { i: 6, d: [.315, .2, 9], m: [.73, 1590, 7] },
  { i: 4, d: [.06, .405, -6], m: [.78, 2600, 5] },
];
const BADGE = { d: { ax: .705, len: 195 }, m: { ax: .74, len: 300 } };
const MOB_H = 3150;
// objects that carry content: always kept fully on the desk
const FIT = new Set(['sheet', 'cv', 'phone', 'receipt', 'env', 'mug', 'pad', 'dymo', 'note']);

export async function mount(el, ctx) {
  const { gsap, Draggable, site } = ctx;
  const reduced = ctx.reduced;
  const touch = ctx.isTouch;
  const R = rng(20261120);
  let mob = innerWidth < 760;

  // ---------------------------------------------------------------- skeleton
  const surface = h('div.dk-surface');
  const stage = h('div.dk-stage', { 'data-light': 'day' });
  const stains = h('div.dk-stains', { 'aria-hidden': 'true' });
  const objs = h('div.dk-objs');
  const light = h('div.dk-light', { 'aria-hidden': 'true' });
  const ropeSvg = svg('svg', { class: 'dk-rope', 'aria-hidden': 'true' });
  // the "camera": vignette on the desk, warm low-contrast grade + film grain over everything
  const grade = h('div.dk-grade', { 'aria-hidden': 'true' }, h('i.dk-vig'), h('i.dk-tone'), h('i.dk-desat'), h('i.dk-lift'), h('i.dk-grain'));
  stage.append(stains, objs, ropeSvg, light);
  surface.append(stage, grade);
  el.append(surface);

  const title = h('h2.sr', {}, `${site.name}, ${D.room}. ${D.role}.`);
  stage.prepend(title);

  // ---------------------------------------------------------------- the light
  const sun = h('div.dk-sun');
  const leaves = h('div.dk-leaves', { html: leavesSVG() });
  const fall = h('div.dk-fall');
  const night = h('div.dk-night');
  const warm = h('div.dk-warm');
  light.append(fall, leaves, sun, night, warm);

  // stains + scuffs written straight onto the desk
  stains.append(
    h('div.dk-ring', { style: { left: '60.5%', top: '62%' } }),
    h('div.dk-ring.dk-ring--b', { style: { left: '73%', top: '33%' } }),
    h('div.dk-ring.dk-ring--c', { style: { left: '47.5%', top: '84%' } }),
    h('div.dk-scuff', { html: scuffSVG(), style: { left: '42%', top: '58%' } }),
  );

  // ---------------------------------------------------------------- centre: name + pencil lines
  const nameWrap = h('div.dk-name', { 'aria-hidden': 'true' });
  const nameSvg = svg('svg', { class: 'dk-sig' });
  const nameText = svg('text', { x: 0, y: 0 });
  nameText.textContent = site.name;
  nameSvg.append(nameText);
  const kicker = h('p.dk-kick', {}, h('span', {}, D.kicker), h('span', {}, D.room));
  const pencil1 = h('p.dk-pencil.dk-pencil--a', {}, D.pencil[0]);
  const pencil2 = h('p.dk-pencil.dk-pencil--b', {}, D.pencil[1]);
  nameWrap.append(kicker, h('i.dk-hl', { html: '<svg viewBox="0 0 600 60" preserveAspectRatio="none"><path d="M8 38 C 120 22, 260 30, 360 26 S 540 18, 594 30 L 590 50 C 470 44, 330 52, 200 50 S 40 56, 10 56 Z" fill="#FFD43B"/></svg>' }), nameSvg);
  stains.append(nameWrap, pencil1, pencil2);

  // corner labels
  const corners = [
    h('p.dk-corner.dk-corner--tl', {}, 'desk no. 01 · top view · ', h('span.dk-lightlabel', {}, 'light: window')),
    h('p.dk-corner.dk-corner--tr', {}, touch ? 'drag anything. well, almost.' : 'drag anything. well, almost.'),
  ];
  const tidyBtn = h('button.dk-tidy', { type: 'button', 'aria-pressed': 'false' }, h('span', {}, 'tidy up'));
  stage.append(...corners, tidyBtn);

  // ---------------------------------------------------------------- objects
  const all = [];
  let zTop = 20;
  const add = (o) => { all.push(o); objs.append(o.el); return o; };

  const mk = (id, cls, attrs = {}, ...kids) => {
    const e = h(`div.dk-obj.dk-${cls}`, { 'data-id': id, ...attrs }, ...kids);
    return e;
  };
  const label = (txt, cls = '') => h(`span.dk-lab${cls}`, { 'aria-hidden': 'true' }, txt);

  // --- cutting mat
  const mat = add({ id: 'mat', heavy: true, low: true, el: mk('mat', 'mat', { tabindex: 0, role: 'img', 'aria-label': 'a green self-healing cutting mat. arrow keys move it.' }, h('div.dk-shadow.dk-mat-body', { html: matSVG(R) })) });
  mat.el.style.zIndex = 2;

  const ruler = add({ id: 'ruler', el: mk('ruler', 'ruler', { tabindex: 0, role: 'img', 'aria-label': 'a steel ruler' }, h('div.dk-ruler-body.dk-dshadow', { html: rulerSVG() })) });
  const knife = add({ id: 'knife', el: mk('knife', 'knife', { tabindex: 0, role: 'img', 'aria-label': 'a craft knife' }, h('div.dk-dshadow', { html: knifeSVG() })) });

  // --- about sheet (folds open)
  const sheet = buildSheet();
  add(sheet);

  // --- sticky pad (tear the top note off)
  const pad = buildPad();
  add(pad);

  // --- lamp
  const lamp = buildLamp();
  add(lamp);

  // --- pencils, tape, eraser, crumpled paper, clips
  add({ id: 'pencilY', el: mk('pencilY', 'pen', { tabindex: 0, role: 'img', 'aria-label': 'a yellow pencil' }, h('div.dk-dshadow', { html: pencilSVG('#F2C21B', '#D9A400', '#FFE27A') })) });
  add({ id: 'pencilB', el: mk('pencilB', 'pen', { tabindex: 0, role: 'img', 'aria-label': 'a blue pencil' }, h('div.dk-dshadow', { html: pencilSVG('#2443F0', '#1730B8', '#5C74FF') })) });
  add({ id: 'tape', el: mk('tape', 'taperoll', { tabindex: 0, role: 'img', 'aria-label': 'a roll of masking tape' }, h('div.dk-shadow.dk-taperoll-body', {}, h('i'))) });
  const eraser = add({ id: 'eraser', el: mk('eraser', 'eraser', { tabindex: 0, role: 'img', 'aria-label': 'an eraser. drag it around, it leaves crumbs.' }, h('div.dk-shadow.dk-eraser-body', {}, h('span', {}, 'RA.S'), h('b', {}, 'soft'))) });
  add({ id: 'crumple', el: mk('crumple', 'crumple', { tabindex: 0, role: 'img', 'aria-label': 'a crumpled up first draft' }, h('div.dk-crumple-body.dk-dshadow', { html: crumpleSVG(R) }), label('v1. bin.', '.dk-lab--crumple')) });
  add({ id: 'clipA', el: mk('clipA', 'clip', { tabindex: 0, role: 'img', 'aria-label': 'a paper clip' }, h('div.dk-dshadow', { html: clipSVG('#9AA0A6') })) });
  add({ id: 'clipB', el: mk('clipB', 'clip', { tabindex: 0, role: 'img', 'aria-label': 'a red paper clip' }, h('div.dk-dshadow', { html: clipSVG('#E5331F') })) });

  // --- cv printout
  add(buildCV());
  // --- dymo label under the name
  add({ id: 'dymo', el: mk('dymo', 'dymo', { tabindex: 0, role: 'img', 'aria-label': D.role }, h('div.dk-dymo-body.dk-shadow', {}, D.role.toUpperCase())) });
  // --- coffee
  const mug = buildMug();
  add(mug);
  // --- phone
  const phone = buildPhone();
  add(phone);
  // --- receipt
  add(buildReceipt());
  // --- envelope
  const env = buildEnvelope();
  add(env);

  // loose notes
  NOTES.forEach((n, k) => {
    const o = makeNote(D.notes[n.i], k);
    o.lay = { d: n.d, m: n.m, t: null };
    add(o);
  });

  // ---------------------------------------------------------------- badge (rope physics)
  const badge = buildBadge();
  stage.append(badge.el);

  // ---------------------------------------------------------------- contact (legal pad)
  const contact = buildContact();
  surface.append(contact);

  // ---------------------------------------------------------------- toast
  const toast = h('div.dk-toast', { role: 'status', 'aria-live': 'polite' });
  el.append(toast);
  let toastT;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-on'), 2600);
  }

  // ================================================================ layout
  let W = 0, H = 0;
  function measure() {
    mob = innerWidth < 760;
    W = stage.clientWidth;
    if (mob) H = MOB_H;
    else H = clamp(innerHeight, 700, 1080);
    stage.style.height = H + 'px';
    surface.style.setProperty('--stage-h', H + 'px');
    const k = mob ? clamp(W / 430, .82, 1) : Math.min(clamp(W / 1440, .66, 1.2), clamp(H / 1000, .68, 1.05));
    stage.style.setProperty('--k', k.toFixed(3));
  }
  function posFor(o, mode) {
    const t = o.lay || L[o.id];
    if (!t) return null;
    if (mode === 'tidy' && !mob && t.t) return [t.t[0] * W, t.t[1] * H, t.t[2]];
    const p = mob ? t.m : t.d;
    return [p[0] * W, mob ? p[1] : p[1] * H, p[2]];
  }
  function place(reset) {
    measure();
    all.forEach((o) => {
      const p = o.dyn ? null : posFor(o, 'mess');
      if (p) { o.left = p[0]; o.top = p[1]; o.rot = p[2]; if (FIT.has(o.id)) fitIn(o); }
      if (o.dyn && (o.left == null)) return;
      o.el.style.left = o.left + 'px';
      o.el.style.top = o.top + 'px';
      if (reset) gsap.set(o.el, { xPercent: -50, yPercent: -50, x: 0, y: 0, rotation: o.rot });
    });
    badge.layout();
    padTopFollow();
    shadeAll();
  }

  function fitIn(o) {
    const w = o.el.offsetWidth, hh0 = o.el.offsetHeight, a = Math.abs(o.rot * Math.PI / 180);
    const bw = (w * Math.cos(a) + hh0 * Math.sin(a)) / 2, bh = (w * Math.sin(a) + hh0 * Math.cos(a)) / 2;
    const m = mob ? 8 : 14, right = mob ? 8 : 48; // keep clear of the care-label index on the right edge
    if (bw * 2 < W - m - right) o.left = clamp(o.left, bw + m, W - right - bw);
    if (bh * 2 < H - 2 * m) o.top = clamp(o.top, bh + m + (mob ? 0 : 10), H - m - bh);
  }

  // ================================================================ shadows: light comes from the window (day) or the lamp (night)
  let lampOn = false;
  let nightT = 0; // 0 day .. 1 night (tweened)
  const lampPos = () => {
    const r = lamp.aim.getBoundingClientRect(), s = stage.getBoundingClientRect();
    return [r.left + r.width / 2 - s.left, r.top + r.height / 2 - s.top];
  };
  function lightVec(cx, cy) {
    // day: window off the top-right, shadows fall down-left. night: away from the lamp.
    const day = [-0.9, 1.15];
    if (nightT <= 0) return day;
    const [lx, ly] = lampPos();
    let dx = cx - lx, dy = cy - ly;
    const d = Math.hypot(dx, dy) || 1;
    const len = clamp(d / 420, .5, 2.4);
    const n = [dx / d * len, dy / d * len];
    return [day[0] + (n[0] - day[0]) * nightT, day[1] + (n[1] - day[1]) * nightT];
  }
  function shade(o) {
    const rot = (gsap.getProperty(o.el, 'rotation') || 0) * Math.PI / 180;
    const cx = (o.left || 0) + (gsap.getProperty(o.el, 'x') || 0);
    const cy = (o.top || 0) + (gsap.getProperty(o.el, 'y') || 0);
    const [gx, gy] = lightVec(cx, cy);
    // rotate the world light vector into the object's own (rotated) space
    const c = Math.cos(-rot), s = Math.sin(-rot);
    o.el.style.setProperty('--sx', (gx * c - gy * s).toFixed(3));
    o.el.style.setProperty('--sy', (gx * s + gy * c).toFixed(3));
  }
  function shadeAll() { all.forEach(shade); badge.shade(); }

  // ================================================================ dragging
  const drags = [];
  function boundsFor(o) {
    return { minX: 16 - o.left, maxX: W - 16 - o.left, minY: 30 - o.top, maxY: H - 16 - o.top };
  }
  function bringTop(o) { if (!o.low) o.el.style.zIndex = ++zTop; }
  const tilt = new WeakMap();
  function lift(o, on) {
    o.el.classList.toggle('is-lifted', on);
    if (reduced) return;
    const rest = o.el.matches(':hover') ? (o.heavy ? 1.006 : 1.022) : 1;
    if (!on) o.el.classList.toggle('is-hover', rest > 1);
    gsap.to(o.el, { scale: on ? (o.heavy ? 1.012 : 1.06) : rest, duration: on ? .22 : .5, ease: on ? 'power2.out' : 'back.out(2.4)', overwrite: 'auto' });
  }
  function hover(o, on) {
    o.el.classList.toggle('is-hover', on);
    if (reduced || o.el.classList.contains('is-lifted')) return;
    gsap.to(o.el, { scale: on ? (o.heavy ? 1.006 : 1.022) : 1, duration: on ? .35 : .45, ease: on ? 'power2.out' : 'power3.out', overwrite: 'auto' });
  }
  function enableDrag(o) {
    if (o.noDrag) return;
    if (touch && o.noTouch) return;
    if (!touch) {
      o.el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !(o.drag && o.drag.isPressed)) hover(o, true); });
      o.el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !(o.drag && o.drag.isPressed)) hover(o, false); });
    }
    const trigger = touch && o.handle ? o.handle : o.el;
    let lastX = 0;
    const d = Draggable.create(o.el, {
      type: 'x,y',
      trigger,
      inertia: !reduced,
      minimumMovement: 4,
      dragClickables: true,
      allowContextMenu: true,
      zIndexBoost: false,
      throwResistance: o.heavy ? 4200 : 1500,
      edgeResistance: .8,
      onPress() {
        bringTop(o);
        lift(o, true);
        this.applyBounds(boundsFor(o));
        lastX = this.x;
        tilt.set(o, gsap.getProperty(o.el, 'rotation'));
        o.onPress && o.onPress(this);
      },
      onDrag() {
        // held paper swings a little with the hand
        const vx = this.x - lastX; lastX = this.x;
        if (!reduced && !o.heavy) {
          const base = tilt.get(o) ?? o.rot;
          gsap.to(o.el, { rotation: base + clamp(vx * .55, -9, 9), duration: .35, ease: 'power2.out', overwrite: false });
        }
        shade(o);
        if (o === lamp) shadeAll(), syncLampLight();
        if (o === phone) syncLampLight();
        o.onDrag && o.onDrag(this);
      },
      onRelease() {
        lift(o, false);
        o.onRelease && o.onRelease(this);
        if (!reduced && !o.heavy) {
          const base = tilt.get(o) ?? o.rot;
          gsap.to(o.el, { rotation: base + (R() - .5) * 3, duration: .7, ease: 'elastic.out(1, .5)', onUpdate: () => shade(o) });
        }
      },
      onThrowUpdate() { shade(o); if (o === lamp) shadeAll(), syncLampLight(); if (o === phone) syncLampLight(); o.onDrag && o.onDrag(this); },
      onClick(e) {
        if (e && e.target && e.target.closest && e.target.closest('a')) return; // native links do their own thing
        o.action && o.action(e);
      },
    })[0];
    o.drag = d;
    drags.push(d);
  }

  // keyboard: arrows move the focused object, enter/space = its action
  objs.addEventListener('keydown', (e) => {
    const t = e.target.closest('.dk-obj');
    if (!t) return;
    const o = all.find((x) => x.el === t);
    if (!o) return;
    const step = e.shiftKey ? 48 : 14;
    const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (mv) {
      e.preventDefault();
      bringTop(o);
      const b = boundsFor(o);
      const nx = clamp(gsap.getProperty(o.el, 'x') + mv[0], b.minX, b.maxX);
      const ny = clamp(gsap.getProperty(o.el, 'y') + mv[1], b.minY, b.maxY);
      gsap.to(o.el, { x: nx, y: ny, duration: .25, ease: 'power3.out', onUpdate: () => { shade(o); if (o === lamp) syncLampLight(), shadeAll(); } });
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target === t && o.action) {
      e.preventDefault();
      o.action(e);
    }
  });

  // ================================================================ tidy (knolling)
  let tidy = false;
  tidyBtn.addEventListener('click', () => {
    tidy = !tidy;
    tidyBtn.setAttribute('aria-pressed', String(tidy));
    tidyBtn.firstChild.textContent = tidy ? 'mess it up again' : 'tidy up';
    stage.classList.toggle('is-tidy', tidy);
    const loose = all.filter((o) => o.note);
    all.forEach((o, i) => {
      let p = posFor(o, tidy ? 'tidy' : 'mess');
      if (o.note) {
        const k = loose.indexOf(o);
        if (tidy && !mob) p = [.295 * W + k * 3, .167 * H - k * 4, 0];
        else if (o.dyn) p = [o.left + (R() - .5) * 40, o.top + (R() - .5) * 40, o.rot];
      }
      if (!p) return;
      if (o === pad.cur) return;
      const x = p[0] - o.left, y = p[1] - o.top;
      gsap.to(o.el, { x, y, rotation: p[2], duration: reduced ? 0 : .9 + R() * .3, delay: reduced ? 0 : i * .018, ease: 'expo.inOut', onUpdate: () => { shade(o); if (o === pad) padTopFollow(); }, onComplete: () => { if (o === lamp) syncLampLight(), shadeAll(); } });
    });
    padTopFollow(true);
    say(tidy ? 'knolled. everything at 90°. feels illegal.' : 'ahh. that\'s better.');
  });

  // ================================================================ lamp + light
  function syncLampLight() {
    const [lx, ly] = lampPos();
    stage.style.setProperty('--lx', lx.toFixed(0) + 'px');
    stage.style.setProperty('--ly', ly.toFixed(0) + 'px');
    const pr = phone.screen.getBoundingClientRect(), s = stage.getBoundingClientRect();
    stage.style.setProperty('--px', (pr.left + pr.width / 2 - s.left).toFixed(0) + 'px');
    stage.style.setProperty('--py', (pr.top + pr.height / 2 - s.top).toFixed(0) + 'px');
  }
  function setLamp(on) {
    lampOn = on;
    lamp.el.setAttribute('aria-pressed', String(on));
    stage.dataset.light = on ? 'lamp' : 'day';
    corners[0].querySelector('.dk-lightlabel').textContent = on ? 'light: lamp' : 'light: window';
    syncLampLight();
    const st = { t: nightT };
    gsap.killTweensOf(st);
    if (reduced) { nightT = on ? 1 : 0; apply(); return; }
    if (on) {
      // a cheap bulb: flick, flick, on
      const tl = gsap.timeline({ onUpdate: apply });
      tl.to(st, { t: .55, duration: .06, ease: 'none', onUpdate: () => (nightT = st.t) })
        .to(st, { t: .15, duration: .05, ease: 'none', onUpdate: () => (nightT = st.t) })
        .to(st, { t: .8, duration: .07, ease: 'none', onUpdate: () => (nightT = st.t) })
        .to(st, { t: .55, duration: .08, ease: 'none', onUpdate: () => (nightT = st.t) })
        .to(st, { t: 1, duration: .5, ease: 'power2.out', onUpdate: () => (nightT = st.t) });
    } else {
      gsap.to(st, { t: 0, duration: .7, ease: 'power2.inOut', onUpdate: () => { nightT = st.t; apply(); } });
    }
    function apply() {
      stage.style.setProperty('--night', nightT.toFixed(3));
      shadeAll();
    }
  }

  // ================================================================ builders
  function buildSheet() {
    const paras = D.about.paras;
    const content = () => h('div.dk-sheet-content', {},
      h('p.dk-sheet-title', {}, D.about.title, h('small', {}, D.about.sub)),
      ...paras.map((p, i) => h('p.dk-sheet-p', { 'data-i': i }, i === 1 ? [h('span.dk-sheet-note.dk-sheet-note--a', {}, D.about.margin[0] + ' →'), h('span.dk-ul', {}, 'self-taught.'), p.replace('self-taught.', '')] : i === 3 ? [p.split('ridiculously strong')[0], h('span.dk-circ', {}, 'ridiculously strong', h('span.dk-sheet-note.dk-sheet-note--b', {}, D.about.margin[1])), p.split('ridiculously strong')[1]] : p)),
      h('p.dk-sheet-sign', {}, D.about.sign),
    );
    const top = h('div.dk-sheet-half.dk-sheet-top', {}, content());
    const frontB = h('div.dk-sheet-face.dk-sheet-front', { 'aria-hidden': 'true' }, content());
    const back = h('div.dk-sheet-face.dk-sheet-back', {}, h('span', {}, D.about.title), h('small', {}, 'open me'));
    const bot = h('div.dk-sheet-half.dk-sheet-bot', {}, frontB, back);
    const foldBtn = h('button.dk-sheet-fold', { type: 'button', tabindex: -1 }, 'fold ↑');
    const tapeH = h('i.dk-sheet-tape', { 'aria-hidden': 'true' });
    const body = h('div.dk-sheet-body.dk-shadow', {}, top, bot, foldBtn);
    const e = mk('sheet', 'sheet', { tabindex: 0, role: 'button', 'aria-expanded': 'false', 'aria-label': 'about me, a folded sheet. press enter to open it.' }, body, tapeH);
    const o = { id: 'sheet', el: e, handle: tapeH, open: false };
    // the readable copy is the top half; the front of the bottom half is a visual duplicate
    top.querySelector('.dk-sheet-content').setAttribute('aria-hidden', 'false');
    o.set = (open, instant) => {
      o.open = open;
      e.setAttribute('aria-expanded', String(open));
      e.setAttribute('aria-label', open ? 'about me, an open sheet. press enter to fold it.' : 'about me, a folded sheet. press enter to open it.');
      e.classList.toggle('is-open', open);
      gsap.to(bot, { rotationX: open ? 0 : 179.5, duration: instant || reduced ? 0 : .9, ease: open ? 'power3.inOut' : 'power2.inOut', transformPerspective: 1600 });
    };
    o.action = () => o.set(!o.open);
    foldBtn.addEventListener('click', (ev) => { ev.stopPropagation(); o.set(false); });
    gsap.set(bot, { rotationX: 179.5, transformPerspective: 1600, transformOrigin: '50% 0%' });
    return o;
  }

  function buildPad() {
    const e = mk('pad', 'pad', { tabindex: 0, role: 'button', 'aria-label': 'a pad of sticky notes. press enter to tear one off.' },
      h('div.dk-pad-body.dk-shadow', {}, h('i'), h('i'), h('i')),
      label('notes to self', '.dk-lab--pad'));
    const o = { id: 'pad', el: e, noDrag: true, used: new Set(NOTES.map((n) => n.i)), cur: null };
    o.next = () => {
      for (let i = 0; i < D.notes.length; i++) if (!o.used.has(i)) { o.used.add(i); return i; }
      return -1;
    };
    o.spawnTop = () => {
      const i = o.next();
      if (i < 0) { e.classList.add('is-empty'); e.setAttribute('aria-label', 'an empty sticky pad. out of notes. that\'s a first.'); o.cur = null; return; }
      const n = makeNote(D.notes[i], all.length, 'y');
      n.dyn = true; n.onPad = true;
      n.el.classList.add('is-ontop');
      o.cur = n;
      n.action = () => { if (n.onPad) o.action(); };
      all.push(n);
      objs.append(n.el);
      padTopFollow(true);
      shade(n);
      enableDrag(n);
      n.el.style.zIndex = Number(e.style.zIndex || 10) + 1;
      n.onPress = () => {};
      n.onDrag = () => { if (n.onPad) tear(n); };
    };
    function tear(n) {
      n.onPad = false;
      n.el.classList.remove('is-ontop');
      n.el.classList.add('is-torn');
      if (!reduced) gsap.fromTo(n.el.querySelector('.dk-note-body'), { rotationX: 18 }, { rotationX: 0, duration: .6, ease: 'elastic.out(1,.45)', transformPerspective: 600, transformOrigin: '50% 0%' });
      o.spawnTop();
    }
    o.action = () => {
      const n = o.cur;
      if (!n) { say('out of notes. that\'s a first.'); return; }
      tear(n);
      bringTop(n);
      gsap.to(n.el, { x: '+=' + (90 + R() * 80), y: '+=' + (60 + R() * 70), rotation: (R() - .5) * 16, duration: reduced ? 0 : .7, ease: 'power3.out', onUpdate: () => shade(n) });
      n.el.focus({ preventScroll: true });
    };
    return o;
  }
  function padTopFollow(force) {
    const n = pad.cur;
    if (!n || typeof pad.left !== 'number') return;
    n.left = pad.left; n.top = pad.top;
    n.el.style.left = pad.left + 'px';
    n.el.style.top = pad.top + 'px';
    const pr = gsap.getProperty(pad.el, 'rotation');
    gsap.set(n.el, { xPercent: -50, yPercent: -50, x: gsap.getProperty(pad.el, 'x') - 2, y: gsap.getProperty(pad.el, 'y') - 3, rotation: pr });
    n.rot = pr;
  }

  function makeNote(text, k, tone = ['y', 'w'][k % 2]) {
    const e = mk('note', `note.dk-note--${tone}`, { tabindex: 0, role: 'note', 'aria-label': 'sticky note: ' + text },
      h('div.dk-note-body.dk-shadow', {}, h('p', {}, text)));
    return { id: 'note', note: true, el: e };
  }

  function buildLamp() {
    const shadeEl = h('div.dk-lamp-shade', { html: lampHeadSVG() });
    const aim = h('i.dk-lamp-aim');
    const e = mk('lamp', 'lamp', { tabindex: 0, role: 'button', 'aria-pressed': 'false', 'aria-label': 'desk lamp. press enter to switch it on or off.' },
      h('div.dk-lamp-arm.dk-dshadow', { html: lampArmSVG() }),
      h('div.dk-lamp-glow'),
      h('div.dk-lamp-head.dk-dshadow', {}, shadeEl),
      aim,
      label('click me', '.dk-lab--lamp'));
    const o = { id: 'lamp', el: e, shade: shadeEl, aim };
    o.action = () => setLamp(!lampOn);
    return o;
  }

  function buildCV() {
    const link = h('a.dk-cv-link', { href: site.cv, target: '_blank', rel: 'noopener', download: 'anshul-sehrawat-cv.pdf', 'aria-label': 'my cv, a pdf. take one.' },
      h('span.dk-cv-file', {}, 'anshul-sehrawat-cv.pdf'),
      h('span.dk-cv-h', {}, 'Hey, I’m Anshul.'),
      h('span.dk-cv-t', {}, 'I design. Mostly DTC static ads, product listings, merch, logos, and websites.'),
      h('span.dk-cv-lines', {}, ...Array.from({ length: 13 }, (_, i) => h('i', { style: { width: (55 + ((i * 37) % 45)) + '%' } }))),
      h('span.dk-cv-stamp', {}, 'take one'),
    );
    const clip = h('i.dk-cv-clip', { 'aria-hidden': 'true', html: binderSVG() });
    const e = mk('cv', 'cv', {}, h('div.dk-cv-under.dk-shadow'), h('div.dk-cv-page.dk-shadow', {}, link), clip, label('cv (take one)', '.dk-lab--cv'));
    return { id: 'cv', el: e, handle: clip };
  }

  function buildMug() {
    const nope = h('p.dk-mug-nope', { 'aria-hidden': 'true' });
    const coffee = h('div.dk-mug-coffee', {}, h('i.dk-mug-ripple'), h('i.dk-mug-shine', { html: windowGlintSVG() }));
    const e = mk('mug', 'mug', { tabindex: 0, role: 'button', 'aria-label': 'my coffee. please don\'t move it.' },
      h('div.dk-mug-handle.dk-shadow'),
      h('div.dk-mug-body.dk-shadow', {}, h('div.dk-mug-wall', {}, coffee)),
      h('div.dk-steam', { html: steamSVG() }),
      nope,
      label('don\'t.', '.dk-lab--mug'));
    const o = { id: 'mug', el: e, noDrag: true, n: 0 };
    o.action = () => {
      nope.textContent = D.mugNope[o.n++ % D.mugNope.length];
      nope.classList.remove('is-on'); void nope.offsetWidth; nope.classList.add('is-on');
      if (reduced) return;
      gsap.fromTo(e, { x: -5 }, { x: 0, duration: .5, ease: 'elastic.out(3, .2)' });
      gsap.fromTo(coffee.querySelector('.dk-mug-ripple'), { scale: .2, opacity: .9 }, { scale: 1.1, opacity: 0, duration: .9, ease: 'power2.out' });
    };
    e.addEventListener('pointerdown', (ev) => { ev.preventDefault(); o.action(); });
    return o;
  }

  function buildPhone() {
    const clock = h('span.dk-ph-time');
    const tickClock = () => { const d = new Date(); clock.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
    tickClock(); setInterval(tickClock, 20000);
    const screen = h('a.dk-ph-screen', { href: site.whatsappLink, target: '_blank', rel: 'noopener', 'aria-label': `whatsapp me: ${site.whatsapp}` },
      h('span.dk-ph-status', {}, clock, h('span.dk-ph-icons', { html: '<svg viewBox="0 0 34 10"><path d="M1 9h2V7H1zm4 0h2V5H5zm4 0h2V3H9zm4 0h2V1h-2z" fill="currentColor"/><rect x="20" y="1.5" width="12" height="7" rx="2" fill="none" stroke="currentColor"/><rect x="21.5" y="3" width="8" height="4" rx="1" fill="currentColor"/></svg>' })),
      h('span.dk-ph-head', {},
        h('span.dk-ph-back', {}, '‹'),
        h('img.dk-ph-ava', { src: ctx.img('a13', 's'), alt: '', width: 32, height: 32, loading: 'lazy', decoding: 'async' }),
        h('span.dk-ph-who', {}, h('b', {}, site.name), h('small', {}, site.whatsapp))),
      h('span.dk-ph-chat', {},
        h('span.dk-ph-day', {}, 'today'),
        ...D.phone.map((m) => h('span.dk-ph-msg', {}, m.t, h('small', {}, ' ✓✓'))),
        h('span.dk-ph-typing', {}, h('i'), h('i'), h('i'))),
      h('span.dk-ph-input', {}, h('span', {}, 'say hi'), h('b', { html: '<svg viewBox="0 0 24 24"><path d="M3 20l18-8L3 4v6l12 2-12 2z" fill="#fff"/></svg>' })),
    );
    const e = mk('phone', 'phone', {}, h('div.dk-ph-body.dk-shadow', {}, screen, h('i.dk-ph-island'), h('i.dk-ph-glare', { html: windowGlintSVG(true) }), h('i.dk-ph-btn')), label('whatsapp', '.dk-lab--phone'));
    return { id: 'phone', el: e, screen, noTouch: true };
  }

  function buildReceipt() {
    const r = D.receipt;
    const d = new Date();
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const row = (a, b, cls = '') => h(`p.dk-rc-row${cls}`, {}, h('span', {}, a), h('span', {}, b));
    const list = (t, arr) => h('div.dk-rc-block', {}, h('p.dk-rc-h', {}, t), h('p.dk-rc-list', {}, arr.join(' · ')));
    const head = h('div.dk-rc-top', {}, h('p.dk-rc-shop', {}, r.shop), h('p.dk-rc-tag', {}, r.tag), h('p.dk-rc-meta', {}, h('span', {}, 'desk 01 · till S'), h('span', {}, date)));
    const body = h('div.dk-rc-body.dk-shadow', {},
      head,
      h('p.dk-rc-cut'),
      row('item', 'qty', '.dk-rc-row--h'),
      ...r.items.map(([a, b]) => row(a, b)),
      h('p.dk-rc-cut'),
      list('learned from', site.learnedFrom),
      list('niches', site.niches),
      list('brands (a few)', site.clients),
      h('p.dk-rc-cut'),
      row(r.total[0], r.total[1], '.dk-rc-row--total'),
      row(r.paid[0], r.paid[1]),
      h('p.dk-rc-cut'),
      h('p.dk-rc-bye', {}, r.bye),
      h('p.dk-rc-bar', { 'aria-hidden': 'true' }),
      h('p.dk-rc-no', { 'aria-hidden': 'true' }, '0 2026 1120 RA.S'),
    );
    const handle = h('i.dk-rc-grab', { 'aria-hidden': 'true' });
    const e = mk('receipt', 'receipt', { tabindex: 0, role: 'group', 'aria-label': 'history, printed as a receipt' }, body, handle, label('history', '.dk-lab--receipt'));
    return { id: 'receipt', el: e, handle };
  }

  function buildEnvelope() {
    const mailto = h('a.dk-env-mail', { href: `mailto:${site.email}?subject=${encodeURIComponent('hi from the desk')}` }, 'or open mail ↗');
    const e = mk('env', 'env', { tabindex: 0, role: 'button', 'aria-label': `email: ${site.email}. press enter to copy it.` },
      h('div.dk-env-body.dk-shadow', {},
        h('i.dk-env-flap'),
        h('span.dk-env-stamp', {}, h('b', {}, 'S'), h('small', {}, 'RA.S · 1 hello')),
        h('i.dk-env-post', { html: postmarkSVG() }),
        h('span.dk-env-to', {}, 'to:'),
        h('span.dk-env-addr', {}, site.name),
        h('span.dk-env-mailline', {}, site.email),
        h('span.dk-env-hint', {}, 'click = copy'),
        mailto),
      label('email', '.dk-lab--env'));
    const o = { id: 'env', el: e, flying: false };
    o.action = async () => {
      await copy(site.email);
      say(`copied: ${site.email}`);
      if (reduced || o.flying) return;
      o.flying = true;
      const body = e.querySelector('.dk-env-body');
      const tl = gsap.timeline({ onComplete: () => { o.flying = false; } });
      tl.to(body, { scale: 1.06, rotation: -4, duration: .18, ease: 'power2.out' })
        .to(body, { x: W * .5, y: -H * .6, rotation: 38, scale: .7, duration: .75, ease: 'power3.in' })
        .set(body, { x: -W * .3, y: H * .3, rotation: -30, scale: .9 })
        .to(body, { x: 0, y: 0, rotation: 0, scale: 1, duration: .9, ease: 'expo.out', delay: .6 });
    };
    return o;
  }

  function buildBadge() {
    const strap = svg('path', { class: 'dk-strap-edge', id: 'dk-strap' });
    const strap2 = svg('path', { class: 'dk-strap-face' });
    const strapText = svg('text', { class: 'dk-strap-text' });
    const tp = svg('textPath', { href: '#dk-strap', startOffset: '0' });
    tp.textContent = ' RA.S · RAGS OF THOUGHTS · ANSHUL SEHRAWAT · RA.S · RAGS OF THOUGHTS · ANSHUL SEHRAWAT · RA.S';
    strapText.append(tp);
    const strapShadow = svg('path', { class: 'dk-strap-shadow' });
    ropeSvg.append(strapShadow, strap, strap2, strapText);
    const B = D.badge;
    const card = h('div.dk-bd-card', {},
      h('div.dk-bd-band', {}, h('b', {}, B.org), h('span', {}, B.dept)),
      h('div.dk-bd-photo', {}, h('img', { src: ctx.img('a13', 's'), alt: 'a cartoon character drawn by anshul: black hair, headphones, side-eye', width: 160, height: 160, loading: 'lazy', decoding: 'async' })),
      h('p.dk-bd-cap', {}, B.photoNote),
      h('p.dk-bd-name', {}, site.name),
      h('p.dk-bd-role', {}, D.role),
      h('p.dk-bd-meta', {}, B.access),
      h('div.dk-bd-foot', {}, h('i.dk-bd-bar'), h('span', {}, 'S-0001'), h('span', {}, B.valid)),
    );
    const bEl = h('div.dk-badge', { tabindex: 0, role: 'group', 'aria-label': `my id badge: ${site.name}, ${D.role}, ${B.org}. arrow keys or enter to swing it.` },
      h('div.dk-bd-hook', { html: hookSVG() }),
      h('div.dk-bd-sleeve.dk-shadow', {}, h('i.dk-bd-slot'), card, h('i.dk-bd-glare')),
      h('span.dk-bd-stk.dk-bd-stk--star', { html: starSVG() }),
      h('span.dk-bd-stk.dk-bd-stk--round', {}, 'no', h('br'), 'slop'),
      label('me, officially', '.dk-lab--badge'));

    const N = 8;
    let pts = [], anchor = [0, 0], seg = 20, len = 260, dragging = false, target = [0, 0], grabOff = [0, 0];
    let ang = 0, active = false, settled = false, t0 = 0;
    const o = { el: bEl };
    o.layout = () => {
      const c = mob ? BADGE.m : BADGE.d;
      const k = parseFloat(stage.style.getPropertyValue('--k')) || 1;
      len = c.len * (mob ? 1 : k);
      anchor = [c.ax * W, -36];
      seg = len / (N - 1);
      pts = Array.from({ length: N }, (_, i) => {
        const x = anchor[0] + (reduced ? 0 : i * i * .9), y = anchor[1] + (reduced ? i * seg : i * seg * .55);
        return { x, y, px: x, py: y };
      });
      if (reduced) render();
    };
    function step() {
      const g = .55;
      const t = performance.now() / 1000;
      const breeze = nightT < .5 ? Math.sin(t * .7) * .012 + Math.sin(t * 1.9) * .006 : 0;
      for (let i = 1; i < N; i++) {
        const p = pts[i];
        const damp = i === N - 1 ? .996 : .99;
        const vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp;
        p.px = p.x; p.py = p.y;
        p.x += vx + breeze * i / N; p.y += vy + g * (i === N - 1 ? 1.6 : 1);
      }
      if (dragging) { const l = pts[N - 1]; l.x = target[0]; l.y = target[1]; }
      for (let it = 0; it < 14; it++) {
        pts[0].x = anchor[0]; pts[0].y = anchor[1];
        for (let i = 0; i < N - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .001;
          const diff = (d - seg) / d;
          // inverse masses: anchor fixed, strap light, badge heavy (so it swings like a real one)
          const wa = i === 0 ? 0 : 1, wb = (i + 1 === N - 1) ? (dragging ? 0 : .12) : 1;
          const sum = wa + wb || 1;
          a.x += dx * diff * (wa / sum); a.y += dy * diff * (wa / sum);
          b.x -= dx * diff * (wb / sum); b.y -= dy * diff * (wb / sum);
        }
      }
    }
    function render() {
      let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < N - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        d += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
      }
      const l = pts[N - 1], p = pts[N - 2];
      d += ` L ${l.x.toFixed(1)} ${l.y.toFixed(1)}`;
      strap.setAttribute('d', d); strap2.setAttribute('d', d);
      const [gx, gy] = lightVec(l.x, l.y);
      strapShadow.setAttribute('d', d);
      strapShadow.setAttribute('transform', `translate(${(gx * 10).toFixed(1)} ${(gy * 14).toFixed(1)})`);
      const target = -Math.atan2(l.x - p.x, l.y - p.y) * 180 / Math.PI;
      ang += (target - ang) * .35;
      bEl.style.transform = `translate(${(l.x - bEl.offsetWidth / 2).toFixed(1)}px, ${(l.y - 4).toFixed(1)}px) rotate(${ang.toFixed(2)}deg)`;
      o.shadeNow(l.x, l.y + 150);
    }
    o.shadeNow = (cx, cy) => {
      const [gx, gy] = lightVec(cx, cy);
      const r = -ang * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
      // the badge hangs a bit off the desk, so its shadow sits further away
      bEl.style.setProperty('--sx', ((gx * c - gy * s) * 2.2).toFixed(3));
      bEl.style.setProperty('--sy', ((gx * s + gy * c) * 2.2).toFixed(3));
    };
    o.shade = () => { if (pts.length) { const l = pts[N - 1]; o.shadeNow(l.x, l.y + 150); } };
    let acc = 0, last = 0;
    function tick() {
      const now = performance.now();
      acc += Math.min(64, now - (last || now)); last = now;
      while (acc >= 16.6) { step(); acc -= 16.6; }
      render();
    }
    o.start = () => { if (active || reduced) return; active = true; last = 0; gsap.ticker.add(tick); };
    o.stop = () => { if (!active) return; active = false; gsap.ticker.remove(tick); };
    o.kick = (vx = 14, vy = -4) => { const l = pts[N - 1]; l.px -= vx; l.py -= vy; if (reduced) return; };

    // drag the badge with the pointer (it stays on the rope)
    const toStage = (e) => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    bEl.addEventListener('pointerdown', (e) => {
      if (reduced) return;
      e.preventDefault();
      bEl.setPointerCapture(e.pointerId);
      const [x, y] = toStage(e);
      const l = pts[N - 1];
      grabOff = [l.x - x, l.y - y];
      target = [l.x, l.y];
      dragging = true;
      bEl.classList.add('is-lifted');
      o.start();
    });
    bEl.addEventListener('pointermove', (e) => {
      if (!dragging) { if (e.pointerType === 'mouse' && !reduced) { const l = pts[N - 1]; l.px -= e.movementX * .12; } return; }
      let [x, y] = toStage(e);
      x += grabOff[0]; y += grabOff[1];
      const dx = x - anchor[0], dy = y - anchor[1], d = Math.hypot(dx, dy), max = len * 1.01;
      if (d > max) { x = anchor[0] + dx / d * max; y = anchor[1] + dy / d * max; }
      target = [clamp(x, 10, W - 10), clamp(y, 0, H - 40)];
    });
    const up = () => { if (!dragging) return; dragging = false; bEl.classList.remove('is-lifted'); };
    bEl.addEventListener('pointerup', up);
    bEl.addEventListener('pointercancel', up);
    bEl.addEventListener('keydown', (e) => {
      const k = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -10], ArrowDown: [0, 6], Enter: [22, -6], ' ': [-22, -6] }[e.key];
      if (!k) return;
      e.preventDefault();
      o.kick(-k[0], -k[1]);
    });
    return o;
  }

  function buildContact() {
    const C = D.contact;
    const copyBtn = h('button.dk-copy', { type: 'button' }, 'copy');
    copyBtn.addEventListener('click', async () => { await copy(site.email); copyBtn.textContent = 'copied ✓'; say(`copied: ${site.email}`); setTimeout(() => (copyBtn.textContent = 'copy'), 2200); });
    const item = (n, k, v, extra) => h('li.dk-li', {}, h('span.dk-li-n', {}, `(${n})`), h('span.dk-li-k', {}, k), h('span.dk-li-v', {}, v, extra || ''));
    const list = h('ol.dk-list', {},
      item(1, 'EMAIL', h('a', { href: `mailto:${site.email}` }, site.email), copyBtn),
      item(2, 'WHATSAPP', h('a', { href: site.whatsappLink, target: '_blank', rel: 'noopener' }, site.whatsapp + ' ↗')),
      item(3, 'CV', h('a', { href: site.cv, target: '_blank', rel: 'noopener', download: 'anshul-sehrawat-cv.pdf' }, 'the pdf. take it ↓')),
    );
    // contact as a checklist: ticks write the email for you
    const opts = [...site.services.map((s) => s.k), C.other];
    const send = h('a.dk-send', { href: '#' }, C.send, h('span', {}, ' →'));
    const boxes = opts.map((t, i) => {
      const input = h('input', { type: 'checkbox', id: `dk-ck-${i}`, value: t });
      const tick = svg('svg', { viewBox: '0 0 30 30', class: 'dk-ck-svg', 'aria-hidden': 'true' },
        svg('rect', { x: 3, y: 4, width: 23, height: 22, rx: 2, class: 'dk-ck-box' }),
        svg('path', { d: 'M7 15 L13 22 L28 2', class: 'dk-ck-tick', pathLength: 1 }));
      return h('li', {}, input, h('label', { for: `dk-ck-${i}` }, tick, h('span', {}, t)));
    });
    const ul = h('ul.dk-checks', {}, boxes);
    const upd = () => {
      const picked = [...ul.querySelectorAll('input:checked')].map((x) => x.value);
      const body = `hey anshul,\n\ni found your desk. i need: ${picked.length ? picked.join(', ') : '(tell you in a sec)'}.\n\n`;
      send.href = `mailto:${site.email}?subject=${encodeURIComponent('hi from the desk')}&body=${encodeURIComponent(body)}`;
      send.classList.toggle('is-ready', picked.length > 0);
      send.querySelector('span').textContent = picked.length ? ` (${picked.length}) →` : ' →';
    };
    ul.addEventListener('change', upd); upd();

    const eyes = h('div.dk-eyes', { 'aria-hidden': 'true' }, h('i', {}, h('b')), h('i', {}, h('b')));
    const pad = h('div.dk-legal', {},
      h('div.dk-legal-top', { 'aria-hidden': 'true' }, h('span', {}, 'RA.S · legal pad · 50 sheets (49 left)')),
      h('div.dk-legal-sheet', {},
        h('p.dk-legal-kick', {}, h('span', {}, '(S) contact'), h('span', {}, 'reply time: faster than my renders')),
        h('h3.dk-ask', {}, C.ask),
        h('p.dk-line', {}, C.line),
        list,
        h('div.dk-checkwrap', {}, h('p.dk-checkt', {}, C.checkTitle), ul, send),
        h('p.dk-foot', {}, C.foot),
        eyes,
        h('span.dk-stk.dk-stk--hi', { 'aria-hidden': 'true' }, 'hi.'),
        h('span.dk-stk.dk-stk--star', { 'aria-hidden': 'true', html: starSVG() }),
      ),
      h('div.dk-legal-pencil', { 'aria-hidden': 'true', html: pencilSVG('#E5331F', '#B22412', '#FF6A55') }),
    );
    const wrap = h('div.dk-contact#desk-contact', { role: 'region', 'aria-label': 'contact' }, pad);
    // googly eyes look at the pointer
    if (!reduced) {
      const pupils = [...eyes.querySelectorAll('b')];
      addEventListener('pointermove', (e) => {
        const r = eyes.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        pupils.forEach((p) => {
          const pr = p.parentNode.getBoundingClientRect();
          const cx = pr.left + pr.width / 2, cy = pr.top + pr.height / 2;
          const a = Math.atan2(e.clientY - cy, e.clientX - cx), d = Math.min(1, Math.hypot(e.clientX - cx, e.clientY - cy) / 200);
          gsap.to(p, { x: Math.cos(a) * pr.width * .2 * d, y: Math.sin(a) * pr.width * .2 * d, duration: .5, ease: 'elastic.out(1,.4)', overwrite: true });
        });
      }, { passive: true });
    }
    return wrap;
  }

  // ================================================================ init
  place(true);
  all.forEach((o, i) => { if (!o.el.style.zIndex) o.el.style.zIndex = 5 + i; });
  zTop = 5 + all.length;
  // stacking that makes sense: sheet on the mat, knife + ruler on the sheet edge
  sheet.el.style.zIndex = 6; ruler.el.style.zIndex = 7; knife.el.style.zIndex = 8;
  all.forEach(enableDrag);
  // tab order = reading order (paint order is set by z-index, so the dom can be re-sorted freely)
  const ORDER = ['sheet', 'receipt', 'phone', 'env', 'cv', 'mug', 'lamp', 'pad', 'note', 'dymo', 'mat', 'ruler', 'knife', 'pencilY', 'pencilB', 'tape', 'eraser', 'crumple', 'clipA', 'clipB'];
  [...all].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id)).forEach((o) => objs.append(o.el));
  stage.insertBefore(badge.el, objs);
  pad.spawnTop();
  pad.el.style.zIndex = 9; if (pad.cur) pad.cur.el.style.zIndex = 10;
  syncLampLight();
  shadeAll();

  // signature: fit the svg to the text once the serif has loaded
  try { await document.fonts.load('italic 100px "Instrument Serif"'); } catch (_) { /* fine */ }
  const setName = () => {
    nameText.textContent = '';
    if (mob) {
      const [a, b] = site.name.split(' ');
      const t1 = svg('tspan', { x: 0, dy: 0 }); t1.textContent = a;
      const t2 = svg('tspan', { x: 0, dy: '0.92em' }); t2.textContent = b;
      nameText.append(t1, t2);
    } else nameText.textContent = site.name;
    nameWrap.classList.toggle('is-2line', mob);
  };
  setName();
  const fitName = () => {
    const bb = nameText.getBBox();
    nameSvg.setAttribute('viewBox', `${(bb.x - 8).toFixed(0)} ${(bb.y - 6).toFixed(0)} ${(bb.width + 16).toFixed(0)} ${(bb.height + 12).toFixed(0)}`);
  };
  fitName();
  const nameLen = 2600;
  nameText.style.strokeDasharray = nameLen;

  addEventListener('resize', (() => {
    let t, lastMob = mob, lastW = innerWidth;
    return () => { clearTimeout(t); t = setTimeout(() => { if (innerWidth === lastW && mob === lastMob) return; const was = lastMob; lastW = innerWidth; place(false); lastMob = mob; if (was !== mob) { place(true); setName(); fitName(); } syncLampLight(); }, 180); };
  })());

  // ---------------------------------------------------------------- entrance: things get put down on the desk
  const placed = all.filter((o) => !o.onPad || true);
  if (reduced) {
    nameText.style.strokeDashoffset = 0; nameSvg.classList.add('is-filled');
    sheet.set(true, true);
    gsap.from(stage, { opacity: 0, duration: .6 });
  } else {
    gsap.set(placed.map((o) => o.el), { autoAlpha: 0 });
    gsap.set(nameText, { strokeDashoffset: nameLen });
    ctx.ScrollTrigger.create({
      trigger: stage, start: 'top 72%', once: true,
      onEnter: () => {
        const order = [...placed].sort((a, b) => (a.low ? -1 : 0) - (b.low ? -1 : 0) || (R() - .5));
        order.forEach((o, i) => {
          const tl = gsap.timeline({ delay: .05 + i * .045 });
          const tx = o.heavy ? 0 : (R() - .5) * 22, ty = o.heavy ? 0 : (R() - .5) * 18;
          tl.set(o.el, { autoAlpha: 1 })
            .fromTo(o.el, { scale: o.heavy ? 1.03 : 1.13, y: '-=' + (o.heavy ? 10 : 30), rotation: o.rot + (R() - .5) * 12, rotationX: tx, rotationY: ty, transformPerspective: 1100 },
              { scale: 1, y: '+=' + (o.heavy ? 10 : 30), rotation: o.rot, rotationX: 0, rotationY: 0, duration: .9, ease: 'power3.out', onStart: () => o.el.classList.add('is-lifted'), onComplete: () => { o.el.classList.remove('is-lifted'); gsap.set(o.el, { transformPerspective: 0 }); shade(o); }, onUpdate: () => shade(o) }, 0)
            // the shadow lands a beat before the object settles
            .call(() => o.el.classList.remove('is-lifted'), null, .55);
        });
        gsap.to(nameText, { strokeDashoffset: 0, duration: 2.6, ease: 'power1.inOut', delay: .4, onComplete: () => nameSvg.classList.add('is-filled') });
        gsap.delayedCall(1.5, () => sheet.set(true));
        badge.start();
      },
    });
  }
  // badge physics only runs while the desk is on screen
  ctx.ScrollTrigger.create({
    trigger: stage, start: 'top bottom', end: 'bottom top',
    onToggle: (st) => { if (st.isActive) { if (stage.dataset.entered) badge.start(); } else badge.stop(); },
    onEnter: () => { stage.dataset.entered = '1'; },
  });
  if (reduced) { badge.layout(); }

  // debug hooks for screenshots / tests
  window.__desk = { setLamp, sheet, pad, env, mug, badge, tidyBtn, all, place, shadeAll };
}

// ==================================================================== helpers
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (_) {
    const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.append(t); t.select();
    try { document.execCommand('copy'); } catch (__) { /* ignore */ }
    t.remove(); return false;
  }
}

// ==================================================================== drawings (svg strings)
function matSVG(R) {
  const W = 594, H = 420, m = 16;
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="dkMatN" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0"/></filter>
    <filter id="dkMatB" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="8"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0"/></filter>
    <clipPath id="dkMatC"><rect x="${m}" y="${m}" width="${W - 2 * m}" height="${H - 2 * m}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" rx="7" fill="#256647"/>
  <rect width="${W}" height="${H}" rx="7" filter="url(#dkMatB)"/>
  <g clip-path="url(#dkMatC)" stroke="#D9EBD9" fill="none">`;
  for (let x = m; x <= W - m + .1; x += 10) s += `<line x1="${x}" y1="${m}" x2="${x}" y2="${H - m}" stroke-width="${(x - m) % 50 === 0 ? .9 : .35}" opacity="${(x - m) % 50 === 0 ? .6 : .32}"/>`;
  for (let y = m; y <= H - m + .1; y += 10) s += `<line x1="${m}" y1="${y}" x2="${W - m}" y2="${y}" stroke-width="${(y - m) % 50 === 0 ? .9 : .35}" opacity="${(y - m) % 50 === 0 ? .6 : .32}"/>`;
  // angle guides from the bottom-left corner: 30, 45, 60
  [30, 45, 60].forEach((a) => { const r = a * Math.PI / 180, L = 900; s += `<line x1="${m}" y1="${H - m}" x2="${m + Math.cos(r) * L}" y2="${H - m - Math.sin(r) * L}" stroke-width=".6" opacity=".45" stroke-dasharray="${a === 45 ? 'none' : '4 3'}"/>`; });
  s += `<circle cx="${m}" cy="${H - m}" r="60" stroke-width=".6" opacity=".5"/><circle cx="${m}" cy="${H - m}" r="110" stroke-width=".5" opacity=".35" stroke-dasharray="2 3"/>`;
  s += '</g><g fill="#E4F1E2" font-family="JetBrains Mono, monospace" opacity=".8">';
  for (let i = 0, x = m; x <= W - m + .1; x += 10, i++) {
    s += `<text x="${x}" y="${m - 4}" font-size="${i % 5 === 0 ? 5.2 : 3.6}" text-anchor="middle">${i}</text>`;
    s += `<line x1="${x}" y1="${m - 2.5}" x2="${x}" y2="${m}" stroke="#E4F1E2" stroke-width=".4"/>`;
  }
  for (let i = 0, y = m; y <= H - m + .1; y += 10, i++) {
    s += `<text x="${m - 4}" y="${y + 1.4}" font-size="${i % 5 === 0 ? 5.2 : 3.6}" text-anchor="end">${i}</text>`;
  }
  s += `<text x="${W - m}" y="${H - 5}" font-size="5.6" text-anchor="end" letter-spacing="1.2">SELF HEALING CUTTING MAT · A2 · 594 × 420 mm</text>`;
  s += `<text x="${m + 6}" y="${H - 5}" font-size="5.6" letter-spacing="1.2">RA.S DESK SUPPLY · cut here, not on the table</text>`;
  s += `<text x="${m + 64}" y="${H - m - 4}" font-size="4.2">60°</text><text x="${m + 88}" y="${H - m - 40}" font-size="4.2">45°</text><text x="${m + 54}" y="${H - m - 80}" font-size="4.2">30°</text>`;
  s += '</g><g stroke="#EAF5E8" fill="none" stroke-linecap="round">';
  // knife scratches: lighter, healed, mostly straight (ruler cuts) + a few free ones
  for (let i = 0; i < 26; i++) {
    const x = m + R() * (W - 2 * m), y = m + R() * (H - 2 * m), a = (R() < .6 ? (R() < .5 ? 0 : 90) : R() * 180) * Math.PI / 180, l = 20 + R() * 140;
    s += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + Math.cos(a) * l).toFixed(1)}" y2="${(y + Math.sin(a) * l).toFixed(1)}" stroke-width="${(.3 + R() * .5).toFixed(2)}" opacity="${(.1 + R() * .18).toFixed(2)}"/>`;
  }
  s += `</g><rect width="${W}" height="${H}" rx="7" filter="url(#dkMatN)"/>
  <rect x=".6" y=".6" width="${W - 1.2}" height="${H - 1.2}" rx="7" fill="none" stroke="#163F2C" stroke-width="1.2" opacity=".6"/></svg>`;
  return s;
}

function rulerSVG() {
  let s = '<svg viewBox="0 0 520 34" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dkRul" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F5F6"/><stop offset=".18" stop-color="#C9CDD1"/><stop offset=".55" stop-color="#DEE1E3"/><stop offset="1" stop-color="#A9AEB3"/></linearGradient><linearGradient id="dkRulS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff" stop-opacity=".55"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#fff" stop-opacity=".3"/><stop offset=".8" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>';
  s += '<rect width="520" height="34" rx="2" fill="url(#dkRul)"/><rect width="520" height="34" rx="2" fill="url(#dkRulS)"/><g stroke="#2A2622" stroke-width=".7">';
  for (let i = 0; i <= 500; i++) { const x = 10 + i; if (x > 512) break; const l = i % 10 === 0 ? 11 : i % 5 === 0 ? 7.5 : 4.5; if (i % 1 === 0 && i <= 500 && (i % 2 === 0 || i % 5 === 0)) s += `<line x1="${x}" y1="0" x2="${x}" y2="${l}"/>`; }
  s += '</g><g font-family="JetBrains Mono, monospace" font-size="6.5" fill="#2A2622" text-anchor="middle">';
  for (let c = 0; c <= 50; c++) s += `<text x="${10 + c * 10}" y="19">${c}</text>`;
  s += '</g><text x="500" y="30" font-family="JetBrains Mono, monospace" font-size="5" fill="#2A2622" text-anchor="end" letter-spacing="1">STAINLESS · 50 cm · RA.S</text><circle cx="512" cy="26" r="2.4" fill="#8E9398"/></svg>';
  return s;
}

function knifeSVG() {
  return `<svg viewBox="0 0 230 26" xmlns="http://www.w3.org/2000/svg"><defs>
  <linearGradient id="dkKn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9ECEE"/><stop offset=".35" stop-color="#9DA3A8"/><stop offset=".6" stop-color="#D8DCDF"/><stop offset="1" stop-color="#6F757A"/></linearGradient>
  <pattern id="dkKnurl" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="3" fill="none"/><line x1="0" y1="0" x2="0" y2="3" stroke="#5B6166" stroke-width=".8" opacity=".55"/></pattern></defs>
  <path d="M190 9 L229 12.6 L190 17 Z" fill="#DCE0E3" stroke="#8B9196" stroke-width=".6"/>
  <path d="M190 12.4 L229 12.6" stroke="#fff" stroke-width=".7" opacity=".8"/>
  <rect x="2" y="6" width="150" height="14" rx="7" fill="url(#dkKn)"/>
  <rect x="40" y="6" width="80" height="14" fill="url(#dkKnurl)"/>
  <rect x="150" y="5" width="24" height="16" rx="3" fill="url(#dkKn)"/>
  <rect x="172" y="7.5" width="20" height="11" rx="2" fill="#B5BABE"/>
  <rect x="2" y="6" width="190" height="3" rx="1.5" fill="#fff" opacity=".35"/></svg>`;
}

function pencilSVG(c, dark, light) {
  return `<svg viewBox="0 0 300 16" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 8 L11 5.4 L11 10.6 Z" fill="#2B2B2E"/>
  <path d="M11 5.4 L42 0.5 L42 15.5 L11 10.6 Z" fill="#E9C9A0"/>
  <path d="M42 0.5 Q 39 3 42 5.3 Q 39 8 42 10.6 Q 39 13 42 15.5 Z" fill="${c}"/>
  <path d="M11 5.4 L42 0.5 L42 5.3 Z" fill="#F4DDBA"/>
  <rect x="42" y="0.5" width="214" height="5" fill="${light}"/>
  <rect x="42" y="5.5" width="214" height="5" fill="${c}"/>
  <rect x="42" y="10.5" width="214" height="5" fill="${dark}"/>
  <text x="70" y="9.6" font-family="Archivo, sans-serif" font-weight="800" font-size="4.6" fill="#15120F" opacity=".7" letter-spacing=".6">RA.S · HB · ROUGH NO.2</text>
  <rect x="256" y="0" width="22" height="16" fill="#C9CDD1"/>
  <g stroke="#8B9196" stroke-width=".8"><line x1="260" y1="0" x2="260" y2="16"/><line x1="263" y1="0" x2="263" y2="16"/><line x1="271" y1="0" x2="271" y2="16"/><line x1="274" y1="0" x2="274" y2="16"/></g>
  <rect x="256" y="0" width="22" height="4" fill="#fff" opacity=".45"/>
  <path d="M278 0 H294 Q300 0 300 8 Q300 16 294 16 H278 Z" fill="#F28CA0"/>
  <path d="M278 0 H294 Q298 0 299 4 H278 Z" fill="#fff" opacity=".35"/></svg>`;
}

function clipSVG(c) {
  return `<svg viewBox="0 0 64 20" xmlns="http://www.w3.org/2000/svg"><path d="M50 4 H10 a6 6 0 0 0 0 12 H56 a5 5 0 0 0 0 -10 H14 a3 3 0 0 0 0 6 H48" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/><path d="M50 4 H10 a6 6 0 0 0 0 12" fill="none" stroke="#fff" stroke-width=".7" opacity=".55" stroke-linecap="round"/></svg>`;
}

function binderSVG() {
  return `<svg viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dkBn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3A3E"/><stop offset=".5" stop-color="#18181A"/><stop offset="1" stop-color="#2B2B2E"/></linearGradient></defs>
  <path d="M22 26 C 14 10, 18 2, 26 2 C 33 2, 33 14, 28 26" fill="none" stroke="#C9CDD1" stroke-width="3"/>
  <path d="M58 26 C 66 10, 62 2, 54 2 C 47 2, 47 14, 52 26" fill="none" stroke="#C9CDD1" stroke-width="3"/>
  <path d="M8 24 H72 L66 58 H14 Z" fill="url(#dkBn)"/><path d="M10 26 H70" stroke="#fff" stroke-width="1" opacity=".3"/></svg>`;
}

function lampArmSVG() {
  // two arm segments with their tension springs, a knuckle, the clamp at the desk edge. lit from the top right.
  const spring = (x1, y1, x2, y2, n) => {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = -uy, py = ux;
    let d = `M${x1} ${y1}`;
    for (let i = 1; i <= n; i++) { const t = i / n, s = (i % 2 ? 2.6 : -2.6); d += ` L${(x1 + dx * t + px * s).toFixed(1)} ${(y1 + dy * t + py * s).toFixed(1)}`; }
    return d;
  };
  return `<svg viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg"><defs>
  <linearGradient id="dkArm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3F3F1"/><stop offset=".28" stop-color="#C9CBCC"/><stop offset=".62" stop-color="#8C9094"/><stop offset="1" stop-color="#55595D"/></linearGradient>
  <radialGradient id="dkKnk" cx=".62" cy=".32" r=".75"><stop offset="0" stop-color="#F6F6F4"/><stop offset=".45" stop-color="#9DA1A5"/><stop offset="1" stop-color="#3E4246"/></radialGradient></defs>
  <g stroke-linecap="round" fill="none">
    <path d="M-40 168 L 74 126" stroke="#4A4E52" stroke-width="9.5"/>
    <path d="M-40 168 L 74 126" stroke="url(#dkArm)" stroke-width="7.5"/>
    <path d="M-38 160 L 72 120" stroke="#5E6368" stroke-width="1.6"/>
    <path d="${spring(-14, 150, 60, 122, 26)}" stroke="#B7BBBE" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M74 126 L 196 92" stroke="#4A4E52" stroke-width="8.5"/>
    <path d="M74 126 L 196 92" stroke="url(#dkArm)" stroke-width="6.5"/>
    <path d="${spring(86, 113, 180, 86, 32)}" stroke="#B7BBBE" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M80 118 L 184 89" stroke="#FFFFFF" stroke-width="1" opacity=".55"/>
  </g>
  <circle cx="74" cy="124" r="9" fill="url(#dkKnk)"/><circle cx="74" cy="124" r="3" fill="#2E3134"/>
  <rect x="-40" y="148" width="40" height="34" rx="4" fill="#2B2B2E"/><rect x="-40" y="148" width="40" height="5" rx="2" fill="#55585C"/></svg>`;
}

function lampHeadSVG() {
  // an anglepoise shade seen from straight above: a cone tipped toward the desk, so we see its back,
  // a sliver of the lit inside at the rim, and the chrome cap where the arm holds it.
  // light from the top right: specular stripe along the cone on that side, core shadow on the other.
  const body = 'M61 27 Q103 33 130.8 57.2 A52 30 -45 0 1 57.2 130.8 Q33 103 27 61 A24 24 0 0 1 61 27 Z';
  const rim = 'M130.8 57.2 A52 30 -45 0 1 57.2 130.8';
  return `<svg viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg"><defs>
  <linearGradient id="dkShd" gradientUnits="userSpaceOnUse" x1="57" y1="131" x2="131" y2="57">
    <stop offset="0" stop-color="#4E120A"/><stop offset=".22" stop-color="#7C1E12"/><stop offset=".5" stop-color="#A92D1B"/>
    <stop offset=".66" stop-color="#C9442C"/><stop offset=".74" stop-color="#E9846A"/><stop offset=".79" stop-color="#C74129"/><stop offset="1" stop-color="#8E2415"/></linearGradient>
  <linearGradient id="dkShdL" gradientUnits="userSpaceOnUse" x1="34" y1="34" x2="104" y2="104">
    <stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".06"/></linearGradient>
  <radialGradient id="dkIn" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#F2ECE2"/><stop offset=".7" stop-color="#CFC6B8"/><stop offset="1" stop-color="#8E8576"/></radialGradient>
  <radialGradient id="dkInOn" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#FFF1CF"/><stop offset="1" stop-color="#F4B866"/></radialGradient>
  <radialGradient id="dkCap" cx=".64" cy=".3" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".25" stop-color="#D9DCDE"/><stop offset=".7" stop-color="#7D8286"/><stop offset="1" stop-color="#3C4044"/></radialGradient>
  <filter id="dkPeel" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <clipPath id="dkShC"><path d="${body}"/></clipPath>
  <radialGradient id="dkDome" cx=".36" cy=".3" r=".55"><stop offset="0" stop-color="#FFC2AE" stop-opacity=".55"/><stop offset=".5" stop-color="#FF8A6A" stop-opacity=".12"/><stop offset="1" stop-color="#FF8A6A" stop-opacity="0"/></radialGradient>
  <mask id="dkLip"><ellipse cx="94" cy="94" rx="52" ry="30" transform="rotate(-45 94 94)" fill="#fff"/><ellipse cx="86.5" cy="86.5" rx="52" ry="30" transform="rotate(-45 86.5 86.5)" fill="#000"/></mask></defs>
  <path d="${body}" fill="url(#dkShd)"/>
  <path d="${body}" fill="url(#dkShdL)"/>
  <path d="${body}" fill="url(#dkDome)"/>
  <g clip-path="url(#dkShC)"><path d="${body}" filter="url(#dkPeel)" fill="#fff"/>
    <ellipse cx="100" cy="52" rx="5" ry="30" transform="rotate(-24 100 52)" fill="#fff" opacity=".22"/></g>
  <g mask="url(#dkLip)"><ellipse cx="94" cy="94" rx="52" ry="30" transform="rotate(-45 94 94)" fill="url(#dkIn)"/>
    <ellipse class="dk-lh-on" cx="97" cy="97" rx="48" ry="27" transform="rotate(-45 97 97)" fill="url(#dkInOn)"/></g>
  <path d="${rim}" fill="none" stroke="#3A0D07" stroke-width="1.4" opacity=".55"/>
  <path d="M130.8 57.2 A52 30 -45 0 1 119 111" fill="none" stroke="#FFE3D8" stroke-width="1.2" opacity=".7"/>
  <circle cx="42" cy="42" r="15" fill="#2A2C2F" opacity=".85"/>
  <circle cx="43" cy="41.5" r="12" fill="url(#dkCap)"/>
  <circle cx="43" cy="41.5" r="4.6" fill="none" stroke="#5A5F63" stroke-width=".8" opacity=".7"/>
  <rect x="22" y="22" width="9" height="5" rx="1.5" transform="rotate(-45 26.5 24.5)" fill="#1E1F21"/></svg>`;
}

function windowGlintSVG(big) {
  // the window, reflected: two panes with a mullion, soft. used on coffee and on the phone glass.
  const o = big ? .3 : .26;
  return `<svg viewBox="0 0 100 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><defs><filter id="dkGl${big ? 'B' : 'S'}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${big ? 2.4 : 4.5}"/></filter></defs>
  <g filter="url(#dkGl${big ? 'B' : 'S'})" fill="#FFFDF6" opacity="${o}" transform="skewX(-14)">
  <rect x="22" y="4" width="34" height="33"/><rect x="60" y="4" width="34" height="33"/><rect x="22" y="41" width="34" height="33" opacity=".8"/><rect x="60" y="41" width="34" height="33" opacity=".8"/></g></svg>`;
}

function steamSVG() {
  return `<svg viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#fff" stroke-linecap="round">
  <path class="dk-st dk-st--1" d="M70 170 C 50 140, 92 120, 70 90 S 60 40, 82 16" stroke-width="9"/>
  <path class="dk-st dk-st--2" d="M92 175 C 112 150, 74 126, 98 98 S 110 52, 90 24" stroke-width="7"/>
  <path class="dk-st dk-st--3" d="M80 172 C 70 152, 96 138, 82 112 S 70 74, 88 50" stroke-width="5"/></g></svg>`;
}

function postmarkSVG() {
  return `<svg viewBox="0 0 150 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#2443F0" stroke-width="1.6" opacity=".75">
  <circle cx="30" cy="30" r="22"/><circle cx="30" cy="30" r="17" stroke-width=".8"/>
  <path d="M58 18 q 10 -6 20 0 t 20 0 t 20 0 t 20 0"/><path d="M58 30 q 10 -6 20 0 t 20 0 t 20 0 t 20 0"/><path d="M58 42 q 10 -6 20 0 t 20 0 t 20 0 t 20 0"/></g>
  <text x="30" y="27" font-family="JetBrains Mono, monospace" font-size="6" fill="#2443F0" text-anchor="middle" opacity=".8">DESK · S</text>
  <text x="30" y="36" font-family="JetBrains Mono, monospace" font-size="5" fill="#2443F0" text-anchor="middle" opacity=".8">20 XI 26</text></svg>`;
}

function hookSVG() {
  return `<svg viewBox="0 0 40 46" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dkHk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8E9398"/><stop offset=".4" stop-color="#F1F2F3"/><stop offset="1" stop-color="#7A7F84"/></linearGradient></defs>
  <rect x="11" y="0" width="18" height="12" rx="3" fill="#E7B400"/>
  <path d="M14 10 h12 v6 q0 3 -3 3 h-6 q-3 0 -3 -3 z" fill="url(#dkHk)"/>
  <path d="M20 18 v6 q -9 0 -9 9 q 0 10 9 10 q 9 0 9 -10" fill="none" stroke="url(#dkHk)" stroke-width="3.2"/>
  <path d="M29 33 l -4 -5" stroke="#8E9398" stroke-width="2.4"/></svg>`;
}

function starSVG() {
  return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 4 L61 37 L96 38 L68 59 L78 94 L50 73 L22 94 L32 59 L4 38 L39 37 Z" fill="#FFD43B" stroke="#fff" stroke-width="9" stroke-linejoin="round" paint-order="stroke"/><path d="M50 4 L61 37 L96 38 L68 59 L78 94 L50 73 L22 94 L32 59 L4 38 L39 37 Z" fill="none" stroke="#15120F" stroke-width="2.4" stroke-linejoin="round"/></svg>';
}

function crumpleSVG(R) {
  // a scrunched ball: an irregular blob with folded facets
  const n = 13, pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = 40 + R() * 9; pts.push([60 + Math.cos(a) * r, 60 + Math.sin(a) * r]); }
  const d = 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L') + ' Z';
  let facets = '';
  for (let i = 0; i < 16; i++) {
    const a = pts[Math.floor(R() * n)], b = [60 + (R() - .5) * 50, 60 + (R() - .5) * 50], c = pts[Math.floor(R() * n)];
    facets += `<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)} L${c[0].toFixed(1)} ${c[1].toFixed(1)}" fill="${R() < .5 ? '#000' : '#fff'}" opacity="${(.04 + R() * .09).toFixed(2)}" stroke="#7A746A" stroke-width=".5" stroke-opacity=".35"/>`;
  }
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="dkCr" cx=".66" cy=".3" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#EDE8DD"/><stop offset="1" stop-color="#C9C2B4"/></radialGradient><clipPath id="dkCrC"><path d="${d}"/></clipPath></defs>
  <path d="${d}" fill="url(#dkCr)"/><g clip-path="url(#dkCrC)">${facets}<path d="M30 70 q 14 -10 30 -2 t 26 -6" stroke="#2443F0" stroke-width="1.6" fill="none" opacity=".45"/><path d="M40 52 l 30 4" stroke="#15120F" stroke-width="1.2" opacity=".3"/></g></svg>`;
}

function leavesSVG() {
  // soft shadow of a plant on the windowsill, falling into the light
  const leaf = (x, y, r, s) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0 C 30 -40, 90 -40, 120 0 C 90 34, 30 34, 0 0 Z"/><path d="M-60 6 L 4 0" stroke="#000" stroke-width="5" fill="none"/></g>`;
  return `<svg viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><g fill="#000">${leaf(330, 120, 200, 1.4)}${leaf(380, 210, 160, 1.1)}${leaf(300, 260, 230, 1.25)}${leaf(420, 330, 140, .9)}${leaf(250, 160, 250, .8)}</g></svg>`;
}

function scuffSVG() {
  return '<svg viewBox="0 0 220 80" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#6B6157" stroke-linecap="round" opacity=".22"><path d="M8 50 q 30 -20 60 -6 t 64 -10" stroke-width="1"/><path d="M20 62 l 40 -3" stroke-width=".7"/><path d="M150 30 q 10 8 26 2 q 8 -4 18 4" stroke-width=".8"/><path d="M120 66 c 6 -6 10 6 16 0 s 10 6 16 0" stroke-width=".7"/></g></svg>';
}

// keep `svg` and SVGNS referenced for tree-shaking linters
void SVGNS;
