// section 4 · OUTRO — the end titles. black, 2.39:1 letterbox, red.
// pinned stage: bars close in, RA.S slams in letter by letter (motion blur, shake, flash), चिथड़े rises
// behind it, a slow push-in, red bike-light trails that stretch with scroll speed (lenis velocity),
// grain and a bit of chromatic aberration. click the mark: it changes fabric (cycles the owner's marks).
// then contact + a credits roll + a post-credits scene + "back to the top".
import { h, svg, clamp } from '../core/util.js';

const MARKS = ['patch', 'grid', 'block', 'rags'];
const SUBS = [
  [0.0, '[motorbikes, somewhere far]'],
  [0.13, '[RA.S, very loud]'],
  [0.4, 'चिथड़े. hindi for rags.'],
  [0.62, 'stitched together. never ironed.'],
  [0.86, '[the end. kind of.]'],
];

export async function mount(el, ctx) {
  const { gsap, ScrollTrigger, site, logos } = ctx;
  const reduced = ctx.reduced;
  let mob = innerWidth < 760;
  const reel = Math.max(1, ctx.blocks.indexOf('outro') + 1);
  const reels = ctx.blocks.length;

  // ---------- stage ----------
  const back = h('canvas.ou-trails.ou-trails--back', { 'aria-hidden': 'true' });
  const front = h('canvas.ou-trails.ou-trails--front', { 'aria-hidden': 'true' });
  const hindi = h('div.ou-hindi', { lang: 'hi', 'aria-label': 'चिथड़े (chithde), hindi for rags' },
    h('span.ou-hindi-c', { 'aria-hidden': 'true' }, 'चिथड़े'),
    h('span.ou-hindi-m', { 'aria-hidden': 'true' }, 'चिथड़े'),
    h('span.ou-hindi-t', { 'aria-hidden': 'true' }, 'चिथड़े'));
  const markBox = h('button.ou-mark', { type: 'button', 'aria-label': 'RA.S. click to change the fabric', 'data-hot': '' });
  const markHint = h('p.ou-hint', { 'aria-hidden': 'true' }, 'click the mark. it changes fabric.');
  const cam = h('div.ou-cam', {}, h('div.ou-glow'), hindi, markBox);
  const grain = h('div.ou-grain', { 'aria-hidden': 'true' });
  const flash = h('div.ou-flash', { 'aria-hidden': 'true' });
  const tc = h('span.ou-tc', {}, '01:32:07:00');
  const barTop = h('div.ou-bar.ou-bar--top', {},
    h('span', {}, h('b', {}, 'RA.S'), ` · reel ${String(reel).padStart(2, '0')}/${String(reels).padStart(2, '0')}`),
    h('span.ou-bar-mid', {}, 'a rags of thoughts picture'),
    tc);
  const subLine = h('p.ou-sub', { 'aria-live': 'off' }, SUBS[0][1]);
  const barBot = h('div.ou-bar.ou-bar--bot', {}, subLine);
  const stage = h('div.ou-stage', {}, back, cam, front, grain, flash, barTop, barBot, markHint);
  el.append(stage);

  // ---------- the mark: main + two colour ghosts (chromatic aberration) ----------
  const svgs = { c: null, m: null, main: null };
  let markName = 'patch', letters = [];
  function buildMark(name) {
    const L = logos[name];
    markBox.innerHTML = '';
    letters = [];
    const make = (kind) => {
      const s = svg('svg', { viewBox: `0 0 ${L.w} ${L.h}`, class: `ou-svg ou-svg--${kind}`, 'aria-hidden': 'true', overflow: 'visible' });
      if (kind === 'main') {
        const defs = svg('defs');
        L.letters.forEach((_, i) => defs.append(svg('filter', { id: `ou-mb-${i}`, x: '-80%', y: '-20%', width: '260%', height: '140%' }, svg('feGaussianBlur', { stdDeviation: '0 0' }))));
        s.append(defs);
      }
      L.letters.forEach((l, i) => {
        const g = svg('g', { class: 'ou-l' });
        if (kind === 'main') {
          g.setAttribute('filter', `url(#ou-mb-${i})`);
          if (l.red) { g.append(svg('path', { d: l.red, class: 'ou-slab' }), svg('path', { d: l.black, class: 'ou-cut' })); }
          else g.append(svg('path', { d: l.black, class: 'ou-slab' }));
        } else {
          if (l.red) g.append(svg('path', { d: l.red }));
          g.append(svg('path', { d: l.black }));
        }
        s.append(g);
        (letters[i] ||= []).push(g);
      });
      svgs[kind] = s;
      return s;
    };
    markBox.append(make('c'), make('m'), make('main'));
    markBox.style.setProperty('--ar', `${L.w} / ${L.h}`);
    markBox.dataset.mark = name;
    // letter centres for scale/blur origins
    letters.forEach((gs) => gs.forEach((g) => gsap.set(g, { transformOrigin: '50% 50%' })));
  }
  buildMark(markName);

  // ---------- grain sprite (4 frames, stepped) ----------
  {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
    const x = c.getContext('2d'); const id = x.createImageData(1024, 256);
    for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() < 0.5 ? 0 : Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    x.putImageData(id, 0, 0);
    grain.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
  }

  // ---------- layout ----------
  let W = 0, H = 0, bar = 0, fh = 0;
  function layout() {
    mob = innerWidth < 760;
    W = innerWidth; H = innerHeight;
    bar = mob ? Math.round(H * 0.115) : Math.max(36, Math.round((H - W / 2.39) / 2));
    fh = H - bar * 2;
    stage.style.height = H + 'px';
    stage.style.setProperty('--bar', bar + 'px');
    stage.style.setProperty('--fh', fh + 'px');
    for (const cv of [back, front]) { const d = Math.min(devicePixelRatio || 1, 1.5); cv.width = W * d; cv.height = H * d; cv.getContext('2d').setTransform(d, 0, 0, d, 0, 0); }
  }
  layout();

  // ---------- light trails ----------
  const streaks = [];
  const mk = (frontLayer) => {
    const z = frontLayer ? 0.85 + Math.random() * 0.15 : Math.pow(Math.random(), 1.6);
    const side = Math.random() < 0.5 ? -1 : 1;
    const y = 0.5 + side * (0.03 + z * 0.47) * (0.75 + Math.random() * 0.25);
    const r = Math.random();
    return { x: Math.random() * 1.4 - 0.2, y, z, sp: 0.6 + Math.random() * 0.8, len: 0.6 + Math.random() * 0.8, front: frontLayer,
      col: r < 0.12 ? [255, 236, 222] : r < 0.4 ? [255, 70, 40] : [229, 51, 31] };
  };
  for (let i = 0; i < (mob ? 34 : 64); i++) streaks.push(mk(false));
  for (let i = 0; i < (mob ? 4 : 7); i++) streaks.push(mk(true));
  let vel = 0, dir = 1, push = 0, ca = 0, kickCA = 0;
  function drawTrails(dt) {
    const v = ctx.lenis && typeof ctx.lenis.velocity === 'number' ? ctx.lenis.velocity : 0;
    vel += (v - vel) * 0.12 * dt;
    if (Math.abs(vel) > 0.4) dir = Math.sign(vel);
    const sp = Math.abs(vel);
    const spread = 1 + push * 0.35;
    const cy = bar + fh * 0.5;
    for (const [cv, isFront] of [[back, false], [front, true]]) {
      const c = cv.getContext('2d');
      c.clearRect(0, 0, W, H);
      c.globalCompositeOperation = 'lighter';
      c.lineCap = 'round';
      for (const s of streaks) {
        if (s.front !== isFront) continue;
        s.x -= dir * (0.0012 + sp * 0.0009) * s.z * s.sp * dt * (isFront ? 1.6 : 1);
        if (s.x < -0.4) { s.x = 1.3 + Math.random() * 0.2; } else if (s.x > 1.4) { s.x = -0.3 - Math.random() * 0.2; }
        const X = s.x * W, Y = cy + (s.y - 0.5) * fh * spread;
        const len = Math.min(W * 0.95, (14 + sp * sp * 0.5 + sp * 10) * (0.3 + s.z) * s.len * (isFront ? 2 : 1));
        const X2 = X + dir * len;
        const lw = (0.7 + s.z * s.z * 3.4) * (isFront ? 1.8 : 1);
        const [r, g, b] = s.col;
        const a = isFront ? 0.75 : 0.35 + s.z * 0.6;
        const gr = c.createLinearGradient(X, Y, X2, Y);
        gr.addColorStop(0, `rgba(${r},${g},${b},${a})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
        c.strokeStyle = gr;
        c.lineWidth = lw * 4.5; c.globalAlpha = 0.16; c.beginPath(); c.moveTo(X, Y); c.lineTo(X2, Y); c.stroke();
        c.lineWidth = lw; c.globalAlpha = 1; c.beginPath(); c.moveTo(X, Y); c.lineTo(X2, Y); c.stroke();
        c.fillStyle = `rgba(255,${isFront ? 200 : 150},${isFront ? 180 : 120},${0.5 + s.z * 0.5})`;
        c.beginPath(); c.arc(X, Y, lw * 0.75, 0, 6.283); c.fill();
      }
    }
    // chromatic aberration follows speed (+ a spike on every slam)
    kickCA *= Math.pow(0.88, dt);
    const target = clamp(1.5 + sp * 0.35, 1.5, 16) + kickCA;
    ca += (target - ca) * 0.2 * dt;
    const q = Math.round(ca * 2) / 2;
    if (q !== drawTrails.q) {
      drawTrails.q = q;
      svgs.c.style.transform = `translate3d(${-q}px, ${q * 0.25}px, 0)`;
      svgs.m.style.transform = `translate3d(${q}px, ${-q * 0.2}px, 0)`;
      hindi.style.setProperty('--ca', q + 'px');
    }
  }
  // a little parallax: the mark and the hindi drift apart under the mouse (css `translate`, so it never fights gsap)
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!ctx.isTouch && !reduced) stage.addEventListener('pointermove', (e) => { par.tx = e.clientX / W - 0.5; par.ty = e.clientY / H - 0.5; }, { passive: true });
  function parallax(dt) {
    par.x += (par.tx - par.x) * 0.06 * dt; par.y += (par.ty - par.y) * 0.06 * dt;
    if (Math.abs(par.tx - par.x) + Math.abs(par.ty - par.y) < 0.0005) return;
    markBox.style.translate = `${(par.x * -22).toFixed(2)}px ${(par.y * -12).toFixed(2)}px`;
    hindi.style.translate = `${(par.x * 14).toFixed(2)}px ${(par.y * 8).toFixed(2)}px`;
  }
  let running = false, last = 0;
  const tick = (t) => { const now = t * 1000; const dt = clamp((now - (last || now)) / 16.667, 0.2, 3); last = now; drawTrails(dt); parallax(dt); };
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; last = 0; gsap.ticker.add(tick); }
    else if (!e.isIntersecting && running) { running = false; gsap.ticker.remove(tick); }
  });
  io.observe(stage);

  // ---------- slams ----------
  const order = letters.map((_, i) => i);
  const fromX = [-1, 1, 0, 1];
  function slam(i, fast) {
    const gs = letters[i]; if (!gs) return;
    const blur = svgs.main.querySelector(`#ou-mb-${i} feGaussianBlur`);
    const d = fast ? 0.26 : 0.4;
    gsap.killTweensOf(gs);
    const tl = gsap.timeline();
    tl.fromTo(gs, { opacity: 0, scale: 2.6, x: fromX[i % 4] * 520, y: -60 }, { opacity: 1, scale: 1, x: 0, y: 0, duration: d, ease: 'power4.in' }, 0);
    if (blur) tl.fromTo(blur, { attr: { stdDeviation: '90 4' } }, { attr: { stdDeviation: '0 0' }, duration: d, ease: 'power3.in' }, 0);
    tl.add(() => impact(i === letters.length - 1 ? 1.4 : 1), d);
    return tl;
  }
  function unslam(i) {
    const gs = letters[i]; if (!gs) return;
    gsap.killTweensOf(gs);
    gsap.to(gs, { opacity: 0, scale: 1.6, duration: 0.18, ease: 'power2.in' });
  }
  function impact(k) {
    kickCA = 14 * k;
    gsap.fromTo(flash, { opacity: 0.3 * k }, { opacity: 0, duration: 0.45, ease: 'power2.out' });
    gsap.fromTo(cam, { x: 0, y: 0 }, { keyframes: [{ x: -10 * k, y: 6 * k }, { x: 8 * k, y: -5 * k }, { x: -4 * k, y: 2 }, { x: 0, y: 0 }], duration: 0.28, ease: 'steps(1)' });
  }
  const landed = letters.map(() => false);
  const SLAM_AT = [0.12, 0.18, 0.245, 0.3];

  // mark click: change the fabric
  let busy = false;
  markBox.addEventListener('click', () => {
    if (busy || !landed.every(Boolean)) return;
    busy = true;
    markName = MARKS[(MARKS.indexOf(markName) + 1) % MARKS.length];
    gsap.to(letters.flat(), { opacity: 0, scale: 0.6, duration: 0.14, ease: 'steps(2)', onComplete: () => {
      buildMark(markName);
      letters.forEach((_, i) => gsap.delayedCall(i * 0.07, () => slam(i, true)));
      gsap.delayedCall(0.6, () => { busy = false; });
      markHint.textContent = { patch: 'patch. the og.', grid: 'grid. very serious.', block: 'block. chunky boy.', rags: 'rags. the g is a dot. don\'t ask.' }[markName];
    } });
  });

  // ---------- the pinned scroll ----------
  let subI = 0;
  function setSub(p) {
    let i = 0; for (let k = 0; k < SUBS.length; k++) if (p >= SUBS[k][0]) i = k;
    if (i !== subI) {
      subI = i;
      gsap.to(subLine, { opacity: 0, duration: 0.12, ease: 'steps(2)', onComplete: () => { subLine.textContent = SUBS[i][1]; subLine.classList.toggle('is-sfx', SUBS[i][1][0] === '['); gsap.to(subLine, { opacity: 1, duration: 0.12, ease: 'steps(2)' }); } });
    }
  }
  subLine.classList.add('is-sfx');
  function setTC(p) {
    const f = Math.floor((92 * 60 + 7) * 24 + p * 24 * 96);
    const ff = f % 24, s = Math.floor(f / 24) % 60, m = Math.floor(f / 1440) % 60, hh = Math.floor(f / 86400);
    tc.textContent = [hh + 1, m, s, ff].map((n) => String(n).padStart(2, '0')).join(':');
  }

  if (reduced) {
    stage.classList.add('is-still');
    letters.flat().forEach((g) => gsap.set(g, { opacity: 1 }));
    landed.fill(true);
    subLine.textContent = 'चिथड़े. hindi for rags.'; subLine.classList.remove('is-sfx');
    markHint.style.opacity = 1;
    for (let i = 0; i < 4; i++) drawTrails(1);
  } else {
    letters.flat().forEach((g) => gsap.set(g, { opacity: 0 }));
    gsap.set(hindi, { '--rv': 0 });
    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    tl.fromTo(stage, { '--bk': 0 }, { '--bk': 1, duration: 0.1 }, 0)
      .fromTo(hindi, { '--rv': 0, yPercent: 18, scale: 1.08 }, { '--rv': 1, yPercent: 0, scale: 1, duration: 0.2, ease: 'power2.out' }, 0.38)
      .fromTo(cam, { scale: 1 }, { scale: mob ? 1.1 : 1.16, duration: 0.55, ease: 'power1.inOut' }, 0.45)
      .fromTo(markHint, { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.36)
      .to({}, { duration: 0.02 }, 0.98);
    ScrollTrigger.create({
      trigger: stage, start: 'top top', end: () => '+=' + Math.round(innerHeight * 1.8),
      pin: true, scrub: 0.5, animation: tl, invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        push = clamp((p - 0.45) / 0.55, 0, 1);
        SLAM_AT.forEach((at, i) => {
          if (i >= letters.length) return;
          if (p >= at && !landed[i]) { landed[i] = true; slam(i); }
          else if (p < at - 0.02 && landed[i]) { landed[i] = false; unslam(i); }
        });
        setSub(p); setTC(p);
      },
    });
  }

  // ---------- the end: contact, credits, post-credits ----------
  const rows = [
    { n: '1', k: 'email', v: site.email, href: `mailto:${site.email}` },
    { n: '2', k: 'whatsapp', v: site.whatsapp, href: site.whatsappLink, ext: true },
    { n: '3', k: 'the cv', v: 'pdf. the boring version.', href: site.cv, ext: true },
  ];
  const contact = h('div.ou-contact', { id: 'outro-contact' },
    h('p.ou-tag', {}, h('b', {}, '§14'), ' the end credits', h('span', {}, ` · reel ${String(reel).padStart(2, '0')}/${String(reels).padStart(2, '0')}`)),
    h('h2.ou-ask', {}, h('span', {}, 'wanna work'), ' ', h('span', {}, 'together', h('em', {}, '?'))),
    h('p.ou-lede', {}, 'if you need a designer who\'s actually into design, let\'s talk. send a brief. i\'ll read it twice and ask too many questions.'),
    h('ul.ou-rows', {}, rows.map((r) => h('li', {},
      h('a.ou-row', { href: r.href, ...(r.ext ? { target: '_blank', rel: 'noopener' } : {}), 'data-hot': '' },
        h('span.ou-row-n', {}, `(${r.n})`),
        h('span.ou-row-k', {}, r.k),
        h('span.ou-row-v', {}, r.v, h('i', {}, ' ↗')))))),
  );

  const credits = [
    ['written, designed and stitched by', 'anshul sehrawat'],
    ['type', 'archivo, instrument serif, gochi hand, reenie beanie, permanent marker, silkscreen, jetbrains mono, bagel fat one, rozha one'],
    ['colour', 'red. no, redder.'],
    ['thread', 'red, mostly'],
    ['cursor', 'one needle. handle with care.'],
    ['references', 'a lot. same vibe, not ditto.'],
    ['fabric', 'whatever was lying around'],
    ['fuel', 'chai. ok, coffee.'],
    ['ironing', 'none'],
    ['made in', 'india, by hand'],
    ['special thanks', 'you, for scrolling this far'],
  ];
  const roll = h('div.ou-roll', {},
    h('p.ou-roll-title', {}, 'credits'),
    h('dl.ou-credits', {}, credits.map(([k, v]) => h('div.ou-cr', {}, h('dt', {}, k), h('dd', {}, v)))),
    h('p.ou-iron', {}, 'no pixels were ironed in the making of this website.'),
  );

  const gem = h('button.ou-gem', { type: 'button', 'aria-label': 'post-credits scene: open it', 'data-hot': '' }, h('span'));
  const gemReveal = h('div.ou-gem-reveal', { 'aria-hidden': 'true' },
    h('p.ou-gem-deva', { lang: 'hi' }, 'गुदड़ी का लाल'),
    h('p.ou-gem-gloss', {}, h('b', {}, 'gudri ka laal'), ' · a gem found in rags.', h('br'), h('span', {}, '(working on it.)')));
  const post = h('div.ou-post', {},
    h('p.ou-post-label', {}, '[post-credits scene]'),
    gem, gemReveal);
  gem.addEventListener('click', () => {
    const open = !post.classList.contains('is-open');
    post.classList.toggle('is-open', open);
    gemReveal.setAttribute('aria-hidden', String(!open));
    gem.setAttribute('aria-label', open ? 'close the post-credits scene' : 'post-credits scene: open it');
    if (open && !reduced) {
      gsap.fromTo(gemReveal.querySelector('.ou-gem-deva'), { opacity: 0, scale: 1.6, filter: 'blur(14px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.42, ease: 'power4.in' });
      gsap.fromTo(gemReveal.querySelector('.ou-gem-gloss'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, delay: 0.45, ease: 'steps(4)' });
    }
  });

  const topBtn = h('button.ou-top', { type: 'button', 'data-hot': '' }, h('span', {}, 'back to the top ↑'), h('small', {}, 'rewind'));
  topBtn.addEventListener('click', () => ctx.lenis.scrollTo(0, { duration: 2.8 }));
  const foot = h('footer.ou-foot', {},
    h('p', {}, '© anshul sehrawat. all rags reserved.'),
    h('p', {}, 'RA.S · rags of thoughts · wash cold, never iron'));

  const end = h('div.ou-end', {}, contact, roll, post, h('div.ou-out', {}, topBtn, foot));
  el.append(end);

  // the roll: lines come up like credits
  if (!reduced) {
    gsap.utils.toArray(roll.querySelectorAll('.ou-cr, .ou-roll-title, .ou-iron')).forEach((n) => {
      gsap.fromTo(n, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: n, start: 'top 92%', toggleActions: 'play none none reverse' } });
    });
    gsap.fromTo(contact.querySelectorAll('.ou-ask > span'), { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: contact, start: 'top 75%' } });
  }

  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { layout(); ScrollTrigger.refresh(); }, 200); });

  el.__outro = { slamAll: () => letters.forEach((_, i) => { landed[i] = true; slam(i, true); }), next: () => markBox.click(), gem: () => gem.click() };
}
