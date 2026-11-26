// THE DIARY (A = ads). design / commercial static ads, kept in a real notebook on a red cloth desk.
// ruled 32px baseline, red margin line, cloth spine. ads are pasted in (tape, clips, pins), never framed in cards.
// signature: the rolodex (flick through registers by drag or scroll). prints can be picked up and re-pasted.
// "see more" = the back pocket: every ad, filterable, opened as an overlay.
import { h, svg, rng, clamp } from '../core/util.js';
import { diary as D } from '../content/diary.js';

const R = 32; // the ruled line

export async function mount(el, ctx) {
  const { gsap, ScrollTrigger, Draggable, Flip, lenis, lightbox, site, media, img, reduced, isTouch } = ctx;
  const ALL = [...media.best, ...media.archive];
  const M = Object.fromEntries(ALL.map((m) => [m.id, m]));
  const rnd = rng(1104);
  const canDrag = !isTouch && !reduced && !!Draggable;
  const isMob = () => innerWidth < 760;

  // ---------- small helpers ----------
  const capFor = (id) => {
    const m = M[id];
    return [m.concept || (id[0] === 'x' ? 'from the archive' : 'one of the good ones'), m.fmt, m.niche].join(' · ');
  };
  const smallW = (id) => (id[0] === 'x' ? 480 : 560);
  const pic = (id, sizes, eager) => {
    const m = M[id];
    return h('img', {
      src: img(id, 's'), srcset: `${img(id, 's')} ${smallW(id)}w, ${img(id)} ${m.w}w`, sizes,
      width: m.w, height: m.h, alt: 'static ad: ' + capFor(id), loading: eager ? 'eager' : 'lazy', decoding: 'async', draggable: 'false',
    });
  };
  const lbItems = (ids) => ids.map((id) => ({ src: img(id), caption: capFor(id), alt: 'static ad: ' + capFor(id) }));
  const mono = (t, cls = '') => h(`span.dy-mono${cls}`, {}, t);
  const arrow = (cls = '') => {
    const s = svg('svg', { class: 'dy-arrow ' + cls, viewBox: '0 0 60 20', 'aria-hidden': 'true' });
    s.append(svg('path', { d: 'M2 11 C 16 6, 34 15, 52 9', fill: 'none' }), svg('path', { d: 'M45 3 L54 9 L46 16', fill: 'none' }));
    return s;
  };
  const clipSvg = () => h('i.dy-clip', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 40 70"><path d="M12 64 V14 a8 8 0 0 1 16 0 V54 a5 5 0 0 1 -10 0 V20" fill="none" stroke="#6f6a63" stroke-width="3" stroke-linecap="round"/><path d="M12 64 V14 a8 8 0 0 1 16 0 V54 a5 5 0 0 1 -10 0 V20" fill="none" stroke="#e9e6df" stroke-width="1.2" stroke-linecap="round" transform="translate(-.8 -.8)"/></svg>' });

  // a print = an ad pasted on the page
  function print(id, o = {}) {
    const m = M[id];
    const f = h('figure.dy-print' + (o.cls ? '.' + o.cls.split(' ').join('.') : ''), { 'data-id': id, 'data-hot': '', style: `--ar:${m.w}/${m.h}` },
      h('div.dy-print-in', {}, pic(id, o.sizes || '200px', o.eager)));
    const tape = o.tape ?? 'top';
    if (tape === 'top') f.append(h('i.dy-tape.dy-tape--t'));
    if (tape === 'corners') f.append(h('i.dy-tape.dy-tape--tl'), h('i.dy-tape.dy-tape--br'));
    if (tape === 'clip') f.append(clipSvg());
    if (tape === 'pin') f.append(h('i.dy-pin'));
    if (o.label) f.append(h('figcaption.dy-cap', {}, o.label));
    f._rot = o.rot ?? (rnd() - 0.5) * 6;
    f._ids = o.ids || [id];
    f._i = o.i || 0;
    return f;
  }

  // pick it up, move it, it re-sticks somewhere else (desktop). click/tap = look closer.
  const prints = [];
  function pasteable(f, bounds) {
    prints.push(f);
    gsap.set(f, { rotation: f._rot });
    const open = () => lightbox.open(lbItems(f._ids), f._i);
    const tapes = f.querySelectorAll('.dy-tape, .dy-pin, .dy-clip');
    const moved = () => f.dispatchEvent(new CustomEvent('dy:move', { bubbles: true }));
    const settle = () => {
      if (!f.classList.contains('is-up')) return;
      f.classList.remove('is-up');
      f._rot = (rnd() - 0.5) * 7;
      gsap.to(f, { scale: 1, rotation: f._rot, duration: 0.7, ease: 'elastic.out(1, 0.45)', onUpdate: moved });
      gsap.fromTo(tapes, { scaleX: 1.3, scaleY: 1.2, opacity: 0.5 }, { scaleX: 1, scaleY: 1, opacity: 1, duration: 0.24, ease: 'steps(3)', delay: 0.05 });
    };
    if (!canDrag) { f.addEventListener('click', open); return; }
    Draggable.create(f, {
      type: 'x,y', bounds, inertia: true, minimumMovement: 5, zIndexBoost: true, edgeResistance: 0.8,
      onPress() { f.classList.add('is-up'); gsap.to(f, { scale: 1.05, rotation: f._rot * 0.25, duration: 0.25, ease: 'power3.out', onUpdate: moved }); },
      onDrag: moved, onThrowUpdate: moved,
      onRelease() { if (!this.isThrowing) settle(); },
      onThrowComplete: settle,
      onClick() { settle(); open(); },
    });
  }

  // chapters snap their height to whole ruled lines, so text always sits on a line
  const snaps = [];
  const ro = new ResizeObserver((entries) => {
    for (const e of entries) {
      const chEl = e.target.parentElement;
      const pad = parseFloat(getComputedStyle(chEl).paddingTop) + parseFloat(getComputedStyle(chEl).paddingBottom);
      chEl.style.height = Math.ceil((e.target.offsetHeight + pad) / R) * R + 'px';
    }
    clearTimeout(ro._t); ro._t = setTimeout(() => ScrollTrigger.refresh(), 120);
  });
  const chapter = (cls, id) => {
    const inner = h('div.dy-ch-in');
    const c = h(`section.dy-ch.${cls}`, id ? { id: 'diary-' + id } : {}, inner);
    snaps.push(inner);
    c.in = inner;
    return c;
  };
  const page = (side, ...kids) => h(`div.dy-pg.dy-pg--${side}`, {}, ...kids);

  // =====================================================================================
  // DOM
  // =====================================================================================
  el.innerHTML = '';
  const wrap = h('div.dy-wrap');
  el.append(wrap);

  // ---------- book A: opener + spreads ----------
  const bookA = h('article.dy-book.dy-book--a', {}, h('div.dy-spine', { 'aria-hidden': 'true' }), h('i.dy-binder', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 64 44"><path d="M2 30 L40 22 L40 42 L2 42 Z" fill="#15120F"/><path d="M40 22 L40 42" stroke="#3a352f" stroke-width="2"/><path d="M18 26 C 30 8, 50 4, 62 10" fill="none" stroke="#bdb7ae" stroke-width="3" stroke-linecap="round"/><path d="M24 28 C 34 14, 52 12, 62 16" fill="none" stroke="#8d867c" stroke-width="3" stroke-linecap="round"/></svg>' }));
  wrap.append(bookA);

  // opener
  const nBest = media.best.length, nArch = media.archive.length;
  const op = chapter('dy-open', 'open');
  const yrs = (site.years || '').match(/^(\d+)\s+years?\s+(.*)$/i);
  const stamp = h('div.dy-stamp', { 'aria-label': site.years },
    h('span.dy-stamp-k', {}, 'est. by hand'),
    h('b', {}, yrs ? `${yrs[1]} yrs` : site.years),
    h('span', {}, yrs ? yrs[2] : ''));
  const lineTxt = site.worlds?.diary?.line || 'design that has to sell. kept neat. ish.';
  const title = h('h2.dy-title', {}, h('span.dy-title-the', {}, 'the'), h('span.dy-title-w', {}, D.title.replace(/^the\s+/, '')));
  const opL = page('l',
    h('div.dy-row', {}, mono(D.label), mono(D.vol)),
    title,
    h('p.dy-line', { html: lineTxt.replace(/(ish\.)$/, '<em>$1</em>') }),
    h('div.dy-open-mid', {}, stamp,
      h('p.dy-hook', {}, D.hook)),
    h('p.dy-count', {}, h('b', {}, String(nBest)), ' i\'d frame. ', h('b', {}, String(nArch)), ' more stuffed in the back pocket.'),
    h('div.dy-niches', {}, mono('made for'), h('ul', {}, site.niches.map((n) => h('li', {}, n)))),
  );
  const pile = h('div.dy-pile');
  const pileDef = [['b45', -8, 'corners'], ['b13', 6.5, 'top'], ['b31', 3, 'top'], ['b23', -4.5, 'top'], ['b08', -2, 'clip']];
  const pileIds = pileDef.map((d) => d[0]);
  pileDef.forEach(([id, rot, tape], i) => pile.append(print(id, { cls: 'dy-pp dy-pp' + i, rot, tape, ids: pileIds, i, sizes: '(max-width: 760px) 46vw, 300px', eager: true })));
  const sticky = h('div.dy-sticky', {}, h('b', {}, 'A = ads.'), h('span', {}, 'you came in through the A.'));
  const hint = h('p.dy-hint', {}, arrow('dy-arrow--up'), canDrag ? 'pick one up. they\'re only taped.' : 'tap one to look closer.');
  const opR = page('r', pile, sticky, hint);
  op.in.append(opL, opR);
  bookA.append(op);

  // spreads intro: a numbered contents page on ruled lines
  const intro = chapter('dy-intro', 'spreads');
  const toc = h('ol.dy-toc');
  intro.in.append(
    page('l',
      h('div.dy-row', {}, mono('chapter 01'), mono('concept spreads')),
      h('h3.dy-h2', {}, D.spreadsIntro.title, h('br'), h('em', {}, D.spreadsIntro.titleB))),
    page('r', h('p.dy-intro-note', {}, D.spreadsIntro.note), toc),
  );
  bookA.append(intro);

  const spreadEls = [];
  D.spreads.forEach((s, si) => {
    const c = chapter('dy-spread', 'sp-' + s.id);
    c.dataset.side = si % 2 ? 'l' : 'r'; // where the hero print goes
    const ids = [s.hero, ...s.sibs, ...(s.strip || [])];
    const fmts = [...new Set(ids.map((id) => M[id].fmt))].join(' + ');
    const meta = h('div.dy-meta', {},
      h('span', {}, mono('spread'), h('b', {}, String(si + 1).padStart(2, '0'))),
      h('span', {}, mono('hooks'), h('b', {}, String(1 + s.sibs.length + (s.strip?.length || 0)))),
      h('span', {}, mono('format'), h('b', {}, fmts)),
      h('span', {}, mono('niche'), h('b', {}, M[s.hero].niche)));
    const notes = h('ol.dy-notes', {}, s.notes.map((t, k) => h('li.dy-note', { 'data-n': k + 1, html: `<span class="dy-nn">${k + 1}</span><span class="dy-nt">${t}</span>` })));
    const angle = h('p.dy-angle', {}, mono('angle'), h('s', {}, s.from), arrow(), h('b', {}, s.to));
    const sibs = h('div.dy-sibs' + (s.pins ? '.dy-sibs--pins' : ''));
    s.sibs.forEach((id, k) => sibs.append(print(id, { cls: 'dy-sib', tape: s.pins ? 'pin' : 'top', label: `hook ${String(k + 2).padStart(2, '0')}`, ids, i: k + 1, sizes: '(max-width: 760px) 30vw, 170px' })));
    const txt = page(c.dataset.side === 'r' ? 'l' : 'r',
      h('div.dy-o1', {}, h('span.dy-bigno', { 'aria-hidden': 'true' }, String(si + 1).padStart(2, '0'), h('small', {}, s.tag)), meta, h('h3.dy-h', {}, s.title), angle),
      h('div.dy-o3', {}, notes, sibs));
    const hero = print(s.hero, { cls: 'dy-hero', tape: s.pins ? 'pin' : 'corners', ids, i: 0, rot: (si % 2 ? -1 : 1) * (1.2 + rnd() * 1.4), sizes: '(max-width: 760px) 80vw, 460px' });
    s.marks.forEach((mk) => hero.append(h('span.dy-mark', { 'data-n': mk.n, style: { left: mk.x + '%', top: mk.y + '%' } }, h('b', {}, mk.n))));
    const heroPg = page(c.dataset.side, h('div.dy-o2', {}, hero, s.aside ? h('p.dy-aside', {}, arrow('dy-arrow--up'), s.aside) : null));
    if (s.strip) {
      const st = h('div.dy-strip', {}, mono('same line, three rooms'));
      s.strip.forEach((id, k) => st.append(print(id, { cls: 'dy-mini', tape: 'top', ids, i: 1 + s.sibs.length + k, rot: (k - 1) * 3, sizes: '120px' })));
      heroPg.firstChild.append(st);
    }
    c.in.append(txt, heroPg);
    if (s.pins) {
      const string = svg('svg', { class: 'dy-string', 'aria-hidden': 'true' });
      string.append(svg('path', { class: 'dy-string-sh' }), svg('path', { class: 'dy-string-p' }));
      c.in.append(string);
      c._string = string;
      c._pinned = [...sibs.children, hero];
      c._pinned.forEach((p, k) => p.append(h('span.dy-pinlab', {}, s.pins[k] || '')));
    }
    // notes <-> circled numbers on the print
    notes.querySelectorAll('.dy-note').forEach((li) => {
      const mk = hero.querySelector(`.dy-mark[data-n="${li.dataset.n}"]`);
      if (!mk) return;
      li.classList.add('has-mark');
      const on = (v) => { li.classList.toggle('is-on', v); mk.classList.toggle('is-on', v); };
      li.addEventListener('pointerenter', () => on(true)); li.addEventListener('pointerleave', () => on(false));
      mk.addEventListener('pointerenter', () => on(true)); mk.addEventListener('pointerleave', () => on(false));
    });
    c._s = s;
    spreadEls.push(c);
    bookA.append(c);
    toc.append(h('li', {}, h('button', { type: 'button', onclick: () => lenis.scrollTo(c, { offset: -24, duration: 1.4 }) },
      mono(String(si + 1).padStart(2, '0')), h('span.dy-toc-t', {}, s.tag), h('i'), h('span.dy-toc-h', {}, `${1 + s.sibs.length + (s.strip?.length || 0)} hooks`))));
  });

  // ---------- the rolodex (on the desk, between the two books) ----------
  const RC = D.rolodex.cards.filter((c) => M[c.id]);
  const N = RC.length;
  const REG_COL = { clean: 'paper', quirky: 'yellow', premium: 'ink', callout: 'red', status: 'blue', story: 'white', proof: 'green', offer: 'yellow', loud: 'red' };
  const rolo = h('section.dy-rolo', { id: 'diary-rolodex' });
  const roloPin = h('div.dy-rolo-pin');
  const deck = h('div.dy-deck', { tabindex: '0', role: 'listbox', 'aria-label': 'the rolodex: ' + N + ' ads. arrow keys to flick.' });
  const wheel = h('div.dy-wheel');
  const cards = RC.map((c, i) => {
    const m = M[c.id];
    const card = h('div.dy-card', { role: 'option', 'data-i': i, 'data-c': REG_COL[c.reg] || 'paper' },
      h('button.dy-card-tab', { type: 'button', style: { left: (4 + (i % 4) * 23) + '%' }, 'aria-label': `card ${i + 1}: ${c.reg}`, 'data-i': i }, c.reg),
      h('div.dy-card-f', {}, h('div.dy-card-img', { style: `--ar:${m.w}/${m.h}` }, pic(c.id, '(max-width: 760px) 60vw, 360px', i < 3)),
        h('span.dy-card-no', {}, `${String(i + 1).padStart(2, '0')}`), h('i.dy-card-shade')),
      h('div.dy-card-b', {}, mono(String(i + 1).padStart(2, '0') + ' / ' + N)));
    return card;
  });
  wheel.append(...cards);
  deck.append(h('div.dy-stage', {}, wheel), h('div.dy-rolo-base', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 400 70" preserveAspectRatio="none"><path d="M8 10 H392 V58 Q392 66 384 66 H16 Q8 66 8 58 Z" fill="#15120F"/><path d="M20 18 H380" stroke="#4a4540" stroke-width="2"/><path d="M20 26 H380" stroke="#2f2b27" stroke-width="1"/></svg>' }),
    h('i.dy-knob.dy-knob--l'), h('i.dy-knob.dy-knob--r'));
  const regEl = h('p.dy-reg', {}, RC[0]?.reg || '');
  const noteEl = h('p.dy-rnote', {}, RC[0]?.note || '');
  const countEl = h('p.dy-rcount', {}, h('b', {}, '01'), ' / ' + String(N).padStart(2, '0'));
  const prevB = h('button.dy-rbtn', { type: 'button', 'aria-label': 'previous card' }, '↑ back');
  const nextB = h('button.dy-rbtn.dy-rbtn--go', { type: 'button', 'aria-label': 'next card' }, 'flick ↓');
  const roloCopy = h('div.dy-rolo-copy', {},
    h('div.dy-row', {}, mono('chapter 02'), mono('the rolodex')),
    h('h3.dy-rolo-t', {}, D.rolodex.title),
    h('p.dy-rolo-sub', {}, D.rolodex.sub),
    h('div.dy-rolo-now', {}, mono('register'), regEl, noteEl),
    h('div.dy-rolo-ctl', {}, countEl, prevB, nextB),
    h('p.dy-rolo-hint', {}, isTouch ? 'scroll to flick. tap a card to look closer.' : D.rolodex.hint));
  roloPin.append(roloCopy, deck);
  rolo.append(roloPin);
  wrap.append(rolo);

  // ---------- book B: rules, client log, back pocket ----------
  const bookB = h('article.dy-book.dy-book--b', {}, h('div.dy-spine', { 'aria-hidden': 'true' }));
  wrap.append(bookB);

  const rules = chapter('dy-rules', 'rules');
  const rl = h('ol.dy-rl');
  D.rules.list.forEach((r, i) => {
    const u = svg('svg', { class: 'dy-ul', viewBox: '0 0 300 12', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    u.append(svg('path', { d: 'M2 8 C 60 2, 120 11, 180 6 S 270 4, 298 7' }));
    rl.append(h('li.dy-rule', {},
      h('div.dy-rule-l', {}, mono(`(${i + 1})`, '.dy-rule-n'),
        r.draft ? h('s.dy-draft', {}, r.draft) : null,
        h('p.dy-rule-r', {}, h('span', {}, r.r), u)),
      h('div.dy-rule-g', {}, h('p', {}, r.g))));
  });
  rules.in.append(
    h('div.dy-rules-head', {},
      page('l', h('div.dy-row', {}, mono('chapter 03'), mono('rules')), h('h3.dy-h2', {}, D.rules.title, h('br'), h('em', {}, D.rules.titleB))),
      page('r', h('p.dy-rules-aside', {}, 'the rule on the left. why, on the right.'))),
    rl);
  bookB.append(rules);

  // client log + services
  const log = chapter('dy-log', 'log');
  const clientList = h('ol.dy-clients', {}, site.clients.map((c, i) => h('li', {}, mono(String(i + 1).padStart(2, '0')), h('b', {}, c))));
  const tick = () => h('i.dy-tick', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24"><path d="M3 13 L9 19 L21 4" fill="none"/></svg>' });
  const learned = (site.learnedFrom || []).slice();
  const first = learned.shift() || 'real-world testing';
  const learnedTxt = `most of my creative strategy comes from actual ${first}. the rest: ${learned.join(', ').replace(/, ([^,]*)$/, ' and $1')}.`;
  const bigStamp = h('div.dy-bigstamp', { 'aria-hidden': 'true' }, h('span', {}, 'in the'), h('b', {}, yrs ? `${yrs[1]} years` : 'years'), h('span', {}, 'static ad game'));
  const proof = proofBlock();
  const services = h('ul.dy-services', {}, site.services.map((s) => h('li', {}, tick(), h('div', {}, h('b', {}, s.k), h('p', {}, s.v)))));
  log.in.append(
    page('l',
      h('div.dy-row', {}, mono('chapter 04'), mono('the client log')),
      h('h3.dy-h2', {}, D.log.title),
      h('p.dy-log-sub', {}, D.log.sub),
      h('div.dy-clients-w', {}, clientList, bigStamp),
      h('div.dy-niches2', {}, mono(D.log.niches), h('ul', {}, site.niches.map((n) => h('li', {}, tick(), n)))),
      h('div.dy-learned', {}, mono(D.log.learned), h('p', {}, learnedTxt))),
    page('r',
      h('div.dy-row', {}, mono('services'), mono(String(site.services.length) + ' things')),
      h('h3.dy-h2', {}, h('em', {}, D.log.services)),
      services,
      proof,
      h('p.dy-numbers', {}, h('a', { href: `mailto:${site.email}` }, D.log.numbers), arrow())));
  bookB.append(log);

  // back pocket
  const back = chapter('dy-back', 'pocket');
  const peekIds = ['x012', 'b58', 'x040', 'b49', 'x077', 'b21'].filter((id) => M[id]);
  const peeks = h('div.dy-peeks', {}, peekIds.map((id, k) => h('span.dy-peek', { style: `--k:${k}` }, h('img', { src: img(id, 's'), width: M[id].w, height: M[id].h, alt: '', loading: 'lazy', decoding: 'async', draggable: 'false' }))));
  const pocketBtn = h('button.dy-pocket', { type: 'button', 'aria-label': `open the back pocket: all ${ALL.length} ads` },
    peeks,
    h('span.dy-pocket-front', {},
      h('span.dy-pocket-l', {}, D.pocket.label),
      h('b', {}, String(ALL.length)),
      h('span.dy-pocket-s', {}, 'ads. ', D.pocket.pull, ' ↑')));
  back.in.append(
    page('l',
      h('div.dy-row', {}, mono('chapter 05'), mono('last page')),
      h('h3.dy-h2', {}, D.pocket.left),
      h('p.dy-back-note', {}, D.pocket.leftB),
      h('p.dy-sign', {}, site.first || 'anshul')),
    page('r', h('div.dy-cover', {}, pocketBtn)));
  bookB.append(back);

  // ---------- index tabs on the page edge ----------
  const rail = h('div.dy-rail', { 'aria-hidden': 'false' });
  const tabsNav = h('nav.dy-tabs', { 'aria-label': 'diary chapters' });
  const tabTargets = { spreads: intro, rolodex: rolo, rules, log, pocket: back };
  const tabBtns = D.tabs.map((t) => {
    const b = h('button.dy-tab', { type: 'button', 'data-c': t.c, 'data-t': t.id }, h('span', {}, t.label));
    b.onclick = () => lenis.scrollTo(tabTargets[t.id], { offset: t.id === 'rolodex' ? 0 : -24, duration: 1.6 });
    return b;
  });
  tabsNav.append(...tabBtns);
  rail.append(tabsNav);
  wrap.append(rail);

  snaps.forEach((s) => ro.observe(s));

  // =====================================================================================
  // behaviour
  // =====================================================================================
  // pasteables
  pile.querySelectorAll('.dy-print').forEach((f) => pasteable(f, op));
  spreadEls.forEach((c) => c.querySelectorAll('.dy-print').forEach((f) => pasteable(f, c)));

  // the string between pushpins follows the prints when you move them
  function drawString(c) {
    if (!c._string) return;
    const box = c.in.getBoundingClientRect();
    const pts = c._pinned.map((p) => {
      const pin = p.querySelector('.dy-pin').getBoundingClientRect();
      return { x: pin.left + pin.width / 2 - box.left, y: pin.top + pin.height / 2 - box.top };
    });
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const sag = Math.min(70, Math.hypot(b.x - a.x, b.y - a.y) * 0.12);
      d += ` Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + sag} ${b.x} ${b.y}`;
    }
    c._string.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    c._string.querySelectorAll('path').forEach((p) => p.setAttribute('d', d));
  }
  spreadEls.forEach((c) => { if (c._string) c.addEventListener('dy:move', () => drawString(c)); });
  const redrawStrings = () => spreadEls.forEach(drawString);

  // index tab state
  const setTab = (id) => tabBtns.forEach((b) => b.classList.toggle('is-on', b.dataset.t === id));
  Object.entries(tabTargets).forEach(([id, t]) => {
    ScrollTrigger.create({ trigger: id === 'spreads' ? intro : t, endTrigger: id === 'spreads' ? spreadEls[spreadEls.length - 1] : t, start: 'top 55%', end: 'bottom 55%', onToggle: (st) => st.isActive && setTab(id) });
  });
  ScrollTrigger.create({ trigger: op, start: 'top 55%', end: 'bottom 55%', onToggle: (st) => st.isActive && setTab('') });

  // ---------- rolodex engine ----------
  const state = { target: 0, cur: 0, shown: -1, idx: 0 };
  const mode = reduced ? 'free' : 'scroll';
  let st = null, dragging = false, dragMoved = false;
  if (mode === 'scroll') {
    st = ScrollTrigger.create({
      trigger: roloPin, pin: true, start: 'top top', end: () => '+=' + Math.round(innerHeight * Math.min(2.6, N * 0.12)),
      onUpdate: (s) => { if (!dragging) state.target = s.progress * (N - 1); },
    });
  }
  const scrollFor = (p) => st.start + (clamp(p, 0, N - 1) / (N - 1)) * (st.end - st.start);
  const go = (i, dur = 0.7) => {
    i = clamp(Math.round(i), 0, N - 1);
    if (mode === 'scroll') lenis.scrollTo(scrollFor(i), { duration: dur, force: true });
    else gsap.to(state, { target: i, duration: dur, ease: 'power3.out' });
  };
  prevB.onclick = () => go(state.idx - 1);
  nextB.onclick = () => go(state.idx + 1);
  deck.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowRight'].includes(e.key)) { e.preventDefault(); go(state.idx + 1); }
    if (['ArrowUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); go(state.idx - 1); }
    if (e.key === 'Enter') lightbox.open(lbItems(RC.map((c) => c.id)), state.idx);
  });

  // drag the cards (mouse); on touch the page scroll already flicks them
  let y0 = 0, p0 = 0, lastY = 0, lastT = 0, vel = 0;
  deck.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' && mode === 'scroll') return;
    if (e.button !== 0) return;
    dragging = true; dragMoved = false; y0 = lastY = e.clientY; lastT = performance.now(); p0 = state.target; vel = 0;
    deck.classList.add('is-grab');
    e.preventDefault();
  });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dy = e.clientY - y0;
    if (Math.abs(dy) > 5) dragMoved = true;
    const now = performance.now();
    vel = (e.clientY - lastY) / Math.max(1, now - lastT); lastY = e.clientY; lastT = now;
    const per = deck.offsetHeight * 0.38;
    const np = clamp(p0 + dy / per, 0, N - 1);
    state.target = np;
    if (mode === 'scroll' && st) lenis.scrollTo(scrollFor(np), { immediate: true, force: true });
  });
  addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false; deck.classList.remove('is-grab');
    if (dragMoved) go(state.target + clamp(vel * 2.5, -2, 2), 0.55);
  });
  deck.addEventListener('click', (e) => {
    if (dragMoved) { dragMoved = false; return; }
    const tab = e.target.closest('.dy-card-tab');
    if (tab) { go(+tab.dataset.i); return; }
    const card = e.target.closest('.dy-card');
    if (!card) return;
    const i = +card.dataset.i;
    if (i === state.idx) lightbox.open(lbItems(RC.map((c) => c.id)), i);
    else go(i);
  });

  // idle snap: never leave a card half-flipped
  if (mode === 'scroll') {
    let t;
    lenis.on('scroll', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (!st || !st.isActive || dragging) return;
        const want = Math.round(state.target);
        if (Math.abs(want - state.target) > 0.015) lenis.scrollTo(scrollFor(want), { duration: 0.45 });
      }, 170);
    });
  }

  const detent = (p) => {
    const b = Math.floor(p), f = p - b;
    const e = f < 0.5 ? 0.5 * Math.pow(2 * f, 1.8) : 1 - 0.5 * Math.pow(2 * (1 - f), 1.8);
    return b + e;
  };
  function renderDeck(p) {
    const mob = isMob();
    const lift = mob ? 15 : 22, depth = mob ? 26 : 38;
    for (let i = 0; i < N; i++) {
      const c = cards[i];
      const d = i - p;
      let t, op = 1, shade = 0;
      if (d >= 0) {
        if (d > 7) { c.style.visibility = 'hidden'; continue; }
        t = `translate3d(0, ${-d * lift}px, ${-d * depth}px) rotateX(${d * 3.5}deg)`;
        shade = Math.min(0.55, d * 0.09);
        op = d > 6 ? 7 - d : 1;
      } else if (d > -1) {
        t = `translate3d(0, 0, 0) rotateX(${d * 104}deg)`;
        shade = -d * 0.35;
      } else {
        const k = Math.min(-d - 1, 5);
        t = `translate3d(0, ${k * 3}px, ${k * 2}px) rotateX(${-104 - k * 2.5}deg)`;
        op = -d > 5 ? Math.max(0, 6 + d) : 1;
      }
      c.style.visibility = op <= 0 ? 'hidden' : 'visible';
      c.style.transform = t;
      c.style.opacity = op;
      c.style.setProperty('--shade', shade.toFixed(3));
    }
  }
  function setIdx(i) {
    if (i === state.idx && state.shown === i) return;
    const dir = i > state.idx ? 1 : -1;
    state.idx = i; state.shown = i;
    const c = RC[i];
    cards.forEach((cd, k) => cd.classList.toggle('is-front', k === i));
    countEl.firstChild.textContent = String(i + 1).padStart(2, '0');
    regEl.textContent = c.reg; noteEl.textContent = c.note;
    regEl.dataset.c = REG_COL[c.reg] || 'paper';
    if (!reduced) {
      gsap.fromTo(regEl, { yPercent: 55 * dir, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'back.out(2.2)' });
      gsap.fromTo(noteEl, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.5, ease: 'steps(10)' });
      gsap.fromTo(cards[i].querySelector('.dy-card-f'), { rotationZ: dir * 1.6 }, { rotationZ: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' });
    }
    prevB.disabled = i === 0; nextB.disabled = i === N - 1;
  }
  const roloTick = () => {
    const dlt = state.target - state.cur;
    if (Math.abs(dlt) < 0.0004 && state.shown === state.idx) return;
    state.cur += dlt * (dragging ? 0.35 : 0.16);
    const p = reduced ? state.target : detent(state.cur);
    renderDeck(p);
    const i = clamp(Math.round(state.cur), 0, N - 1);
    if (i !== state.shown) setIdx(i);
  };
  renderDeck(0); setIdx(0);
  gsap.ticker.add(roloTick);

  // ---------- back pocket overlay ----------
  const pocket = buildPocket();
  pocketBtn.addEventListener('click', () => pocket.open());

  // ---------- arrivals ----------
  if (!reduced) arrivals();
  else gsap.set(prints, { opacity: 1 });

  // strings need layout + fonts
  requestAnimationFrame(redrawStrings);
  addEventListener('resize', () => { renderDeck(state.cur); redrawStrings(); });
  ScrollTrigger.addEventListener('refresh', redrawStrings);
  document.fonts?.ready.then(redrawStrings);

  // debug hooks for screenshots
  window.__diary = { go, pocket, state, cards, drawString: redrawStrings };

  // =====================================================================================
  function proofBlock() {
    // testimonials + results are data-driven. empty = nothing renders. never invent them.
    const T = site.testimonials || [], Rs = site.results || [];
    if (!T.length && !Rs.length) return null;
    const box = h('div.dy-proof', {}, mono('receipts'));
    if (Rs.length) box.append(h('ul.dy-results', {}, Rs.map((r) => h('li', {}, h('b', {}, r.k || r.value || ''), h('span', {}, r.v || r.label || '')))));
    if (T.length) box.append(h('ul.dy-quotes', {}, T.map((t) => h('li', {}, h('p', {}, t.q || t.quote || ''), mono(t.who || t.name || '')))));
    return box;
  }

  function arrivals() {
    // title: letters dropped in like rubber stamps
    const w = title.querySelector('.dy-title-w');
    const chars = [...w.textContent].map((ch) => h('span.dy-ch1', {}, ch));
    w.textContent = ''; w.append(...chars);
    const tl = gsap.timeline({ scrollTrigger: { trigger: op, start: 'top 75%', once: true } });
    tl.fromTo(chars, { yPercent: -40, opacity: 0, rotation: () => (rnd() - 0.5) * 20 }, { yPercent: 0, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(2.4)', stagger: 0.06 })
      .fromTo(title.querySelector('.dy-title-the'), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' }, 0.2)
      .fromTo(stamp, { scale: 1.8, opacity: 0, rotation: -14 }, { scale: 1, opacity: 1, rotation: -5, duration: 0.32, ease: 'power4.in' }, 0.45)
      .to(op, { x: 2, duration: 0.04, yoyo: true, repeat: 3, ease: 'none', clearProps: 'x' }, '>-0.02');
    pasteIn(pile.querySelectorAll('.dy-print'), op, 0.12, 0.25);
    gsap.fromTo(sticky, { opacity: 0, rotation: 10, y: -20 }, { opacity: 1, rotation: 4, y: 0, duration: 0.8, ease: 'elastic.out(1, .5)', delay: 1, scrollTrigger: { trigger: op, start: 'top 75%', once: true } });

    spreadEls.forEach((c) => {
      const T = { trigger: c, start: 'top 72%', once: true };
      const hero = c.querySelector('.dy-hero');
      const tl2 = gsap.timeline({ scrollTrigger: T });
      tl2.fromTo(c.querySelector('.dy-h'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'steps(14)' });
      tl2.fromTo(c.querySelector('.dy-angle s'), { '--strike': 0 }, { '--strike': 1, duration: 0.3, ease: 'power2.in' }, 0.5);
      tl2.fromTo(c.querySelectorAll('.dy-note'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.55, ease: 'steps(12)', stagger: 0.22 }, 0.55);
      pasteIn([hero], c, 0, 0.1);
      pasteIn(c.querySelectorAll('.dy-sib, .dy-mini'), c, 0.14, 0.6);
      gsap.fromTo(c.querySelectorAll('.dy-mark'), { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(3)', stagger: 0.12, delay: 0.9, scrollTrigger: T });
      if (c._string) {
        const ps = c._string.querySelectorAll('path');
        gsap.fromTo(ps, { strokeDasharray: '0 4000' }, { strokeDasharray: '4000 0', duration: 1.4, ease: 'power2.inOut', delay: 1, scrollTrigger: T });
      }
    });

    rl.querySelectorAll('.dy-rule').forEach((li) => {
      gsap.timeline({ scrollTrigger: { trigger: li, start: 'top 82%', once: true } })
        .fromTo(li.querySelector('.dy-rule-r span'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.45, ease: 'steps(9)' })
        .fromTo(li.querySelector('.dy-ul path'), { strokeDashoffset: 320 }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, 0.3)
        .fromTo(li.querySelector('.dy-rule-g p'), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, 0.45);
    });
    gsap.fromTo(bigStamp, { scale: 2, opacity: 0, rotation: 4 }, { scale: 1, opacity: 1, rotation: -9, duration: 0.3, ease: 'power4.in', scrollTrigger: { trigger: bigStamp, start: 'top 80%', once: true } });
    gsap.fromTo(log.querySelectorAll('.dy-clients li'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.35, ease: 'steps(8)', stagger: 0.08, scrollTrigger: { trigger: clientList, start: 'top 80%', once: true } });
  }

  function pasteIn(list, trigger, stagger, delay) {
    list = [...list];
    if (!list.length) return;
    gsap.fromTo(list, {
      opacity: 0, scale: 1.14, y: -36, rotation: (i, t) => t._rot + (rnd() - 0.5) * 18,
    }, {
      opacity: 1, scale: 1, y: 0, rotation: (i, t) => t._rot, duration: 0.75, ease: 'back.out(1.5)', stagger, delay,
      scrollTrigger: { trigger, start: 'top 72%', once: true },
      onComplete: redrawStrings,
    });
  }

  function buildPocket() {
    const fmts = ['all', '4:5', '9:16'];
    const niches = ['all', ...new Set(ALL.map((m) => m.niche))];
    const f = { fmt: 'all', niche: 'all' };
    const ov = h('div.p-diary-ov', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'the back pocket: every ad', hidden: '' });
    const count = h('b.dy-ov-count', {}, String(ALL.length));
    const grp = (key, vals) => h('div.dy-ov-grp', { role: 'group', 'aria-label': key === 'fmt' ? 'format' : 'niche' },
      mono(key === 'fmt' ? 'format' : 'niche'),
      ...vals.map((v) => h('button.dy-ov-f', { type: 'button', 'data-k': key, 'data-v': v, 'aria-pressed': v === 'all' ? 'true' : 'false' }, h('span', {}, v), h('i', {}))));
    const closeB = h('button.dy-ov-close', { type: 'button' }, D.pocket.close, ' ✕');
    const head = h('header.dy-ov-head', {},
      h('div.dy-ov-title', {}, h('h3', {}, D.pocket.title), h('p', {}, mono('showing '), count, mono(' of ' + ALL.length))),
      h('div.dy-ov-filters', {}, grp('fmt', fmts), grp('niche', niches)),
      closeB);
    const grid = h('div.dy-ov-grid');
    const tiles = ALL.map((m) => h('button.dy-w', { type: 'button', 'data-id': m.id, 'data-fmt': m.fmt, 'data-niche': m.niche, style: `--rot:${((rnd() - 0.5) * 2.4).toFixed(2)}deg;--ar:${m.w}/${m.h}` },
      h('img', { src: img(m.id, 's'), width: m.w, height: m.h, alt: 'static ad: ' + capFor(m.id), loading: 'lazy', decoding: 'async', draggable: 'false' }),
      h('span.dy-w-l', {}, `${m.id} · ${m.fmt} · ${m.niche}`)));
    grid.append(...tiles);
    const empty = h('p.dy-ov-empty', { hidden: '' }, D.pocket.empty);
    const scroller = h('div.dy-ov-scroll', { 'data-lenis-prevent': '' }, grid, empty);
    ov.append(h('i.dy-ov-stitch', { 'aria-hidden': 'true' }), head, scroller);
    document.body.append(ov);

    // masonry: rows of 4px, each tile spans its real height
    const layout = () => {
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const gap = parseFloat(getComputedStyle(grid).columnGap) || 10;
      const colW = (grid.clientWidth - gap * (cols - 1)) / cols;
      tiles.forEach((t) => { const m = M[t.dataset.id]; t.style.gridRowEnd = 'span ' + Math.ceil((colW * m.h / m.w + gap) / 4); });
    };
    const ro2 = new ResizeObserver(layout); ro2.observe(grid);

    const visible = () => tiles.filter((t) => !t.hidden);
    const counts = () => {
      ov.querySelectorAll('.dy-ov-f').forEach((b) => {
        const k = b.dataset.k, v = b.dataset.v;
        const other = k === 'fmt' ? 'niche' : 'fmt';
        const n = ALL.filter((m) => (v === 'all' || m[k] === v) && (f[other] === 'all' || m[other] === f[other])).length;
        b.querySelector('i').textContent = n;
        b.setAttribute('aria-pressed', String(f[k] === v));
        b.disabled = n === 0 && v !== 'all';
      });
    };
    const apply = (animate) => {
      const state0 = animate && !reduced ? Flip.getState(tiles) : null;
      tiles.forEach((t) => { t.hidden = !((f.fmt === 'all' || t.dataset.fmt === f.fmt) && (f.niche === 'all' || t.dataset.niche === f.niche)); });
      const n = visible().length;
      count.textContent = n; empty.hidden = n > 0;
      counts();
      scroller.scrollTop = 0;
      if (state0) {
        Flip.from(state0, {
          duration: 0.5, ease: 'power3.inOut', absolute: true, stagger: { amount: 0.18 }, targets: visible().slice(0, 60),
          onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.7, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.6)', stagger: 0.01 }),
          onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.8, duration: 0.2 }),
        });
      }
    };
    head.addEventListener('click', (e) => {
      const b = e.target.closest('.dy-ov-f');
      if (!b || b.disabled) return;
      f[b.dataset.k] = b.dataset.v;
      apply(true);
    });
    grid.addEventListener('click', (e) => {
      const t = e.target.closest('.dy-w');
      if (!t) return;
      const vis = visible();
      lightbox.open(lbItems(vis.map((x) => x.dataset.id)), vis.indexOf(t));
    });

    let isOpen = false;
    const lb = document.querySelector('.lb');
    if (lb) new MutationObserver(() => { if (isOpen && !lb.classList.contains('is-open')) lenis.stop(); }).observe(lb, { attributes: true, attributeFilter: ['class'] });
    const open = () => {
      if (isOpen) return;
      isOpen = true;
      ov.hidden = false;
      document.documentElement.classList.add('dy-ov-on');
      lenis.stop();
      layout(); counts();
      if (reduced) { gsap.fromTo(ov, { opacity: 0 }, { opacity: 1, duration: 0.2 }); }
      else {
        gsap.fromTo(ov, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'expo.out' });
        gsap.fromTo(visible().slice(0, 36), { y: () => 260 + rnd() * 200, rotation: () => (rnd() - 0.5) * 30, opacity: 0 },
          { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.3)', stagger: 0.016, delay: 0.12, clearProps: 'transform,opacity' });
      }
      setTimeout(() => closeB.focus(), 50);
    };
    const close = () => {
      if (!isOpen) return;
      isOpen = false;
      const done = () => { ov.hidden = true; document.documentElement.classList.remove('dy-ov-on'); lenis.start(); pocketBtn.focus({ preventScroll: true }); };
      if (reduced) return done();
      gsap.to(ov, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.45, ease: 'expo.in', onComplete: done });
    };
    closeB.onclick = close;
    addEventListener('keydown', (e) => {
      if (!isOpen || e.key !== 'Escape') return;
      if (lb && lb.classList.contains('is-open')) return; // the lightbox closes first
      close();
    }, true);
    apply(false);
    return { open, close, set: (k, v) => { f[k] = v; apply(true); }, el: ov };
  }
}
