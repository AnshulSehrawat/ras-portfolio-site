// boot: picks the cut (all / ecom / art), mounts each block in order, sews the seams.
import { site } from './content/site.js';
import { cuts } from './content/cuts.js';
import { media } from './content/media.js';
import { logos } from './content/logos.js';
import { h, svg, img, tornClip, stitchPath, isTouch, reduced, mobile } from './core/util.js';
import { makeCursor } from './core/cursor.js';
import { makeLightbox } from './core/lightbox.js';
import { makeChrome } from './core/chrome.js';

const { gsap, ScrollTrigger, Draggable, InertiaPlugin, SplitText, Flip, Lenis } = window;
gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin, SplitText, Flip);

const params = new URLSearchParams(location.search);
const cutName = params.get('cut') || document.body.dataset.cut || 'all';
let blocks = cuts[cutName] || cuts.all;
const only = params.get('only');
const quiet = params.has('quiet');
const nextSet = new Set((params.get('next') || '').split(',').filter(Boolean)); // screenshots: no loader, no cursor

// lenis drives the scroll, gsap's ticker drives lenis
const lenis = new Lenis({ lerp: reduced() ? 1 : 0.1, smoothWheel: true, wheelMultiplier: 0.95 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
window.__lenis = lenis;

const cursor = quiet ? { set() {}, hide() {}, show() {} } : makeCursor();
const lightbox = makeLightbox(lenis);
const ctx = { site, media, logos, gsap, ScrollTrigger, Draggable, SplitText, Flip, lenis, lightbox, cursor, img, cut: cutName, blocks, isTouch: isTouch(), reduced: reduced(), mobile: mobile() };

const root = document.getElementById('site');
const worldsInCut = blocks.filter((b) => site.worlds[b]);
ctx.worldsInCut = worldsInCut;

function idFor(b, i) {
  if (b.startsWith('gate:')) return 'gate-' + i;
  return b;
}

const SEAM_COLORS = ['#E5331F', '#15120F', '#2443F0', '#F2EDE1'];

async function boot() {
  const list = only ? blocks.filter((b, i) => b === only || idFor(b, i) === only || (only === 'gate' && b.startsWith('gate'))).slice(0, 1) : blocks;
  let gateN = 0;
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    const isGate = b.startsWith('gate:');
    const name = isGate ? 'gate' : b;
    const el = h(`section.patch.p-${name}`, { id: idFor(b, blocks.indexOf(b)), 'data-block': b });
    root.append(el);
    if (i > 0) {
      el.dataset.torn = '';
      el.style.setProperty('--torn', tornClip(i * 31 + 7));
      const seam = h('div.seam', { 'aria-hidden': 'true' });
      const s = svg('svg', { viewBox: `0 0 ${innerWidth} 40`, preserveAspectRatio: 'none' });
      const p = svg('path', { d: stitchPath(innerWidth, 26, i * 13 + 3), stroke: SEAM_COLORS[i % SEAM_COLORS.length], 'stroke-dasharray': '11 8' });
      // the stitch is sewn left to right as the seam scrolls in: a clip rect grows, a needle rides the tip
      const cid = 'seamclip' + i;
      const rect = svg('rect', { x: -20, y: -20, width: 0, height: 80 });
      s.append(svg('defs', {}, svg('clipPath', { id: cid }, rect)));
      p.setAttribute('clip-path', `url(#${cid})`);
      const needle = svg('path', { class: 'seam-needle', d: 'M0 0 L-26 -9 Q-29 -10 -28 -7 Z' });
      s.append(p, needle); seam.append(s); el.append(seam);
      seamDraw(rect, needle, el, s);
    }
    try {
      // staging: ?next=desk,digital loads sections/<name>.next.js + css/<name>.next.css instead (live site untouched)
      const isNext = nextSet.has(name);
      if (isNext) {
        document.querySelector(`link[href="css/${name}.css"]`)?.remove();
        if (!document.querySelector(`link[href="css/${name}.next.css"]`)) document.head.append(h('link', { rel: 'stylesheet', href: `css/${name}.next.css` }));
      }
      const mod = await import(`./sections/${name}${isNext ? '.next' : ''}.js`);
      const opts = isGate ? parseGate(b, gateN++) : {};
      await mod.mount(el, { ...ctx, opts });
      // seam thread: pick a colour that shows on this patch
      const seamPath = el.querySelector(':scope > .seam path');
      if (seamPath) {
        const dark = isDark(getComputedStyle(el).backgroundColor);
        seamPath.setAttribute('stroke', (dark ? ['#F2EDE1', '#FFD43B', '#E5331F'] : ['#E5331F', '#15120F', '#2443F0'])[i % 3]);
      }
    } catch (err) {
      console.error('block failed', b, err);
      el.append(h('p', { style: { padding: '40px', font: '16px monospace' } }, `[${b}] didn't load: ${err.message}`));
    }
  }
  chrome = makeChrome({ logos, blocks, lenis, hasDesk: blocks.includes('desk'), site });
  // thread colour + care label follow the patch in the middle of the screen
  document.querySelectorAll('.patch').forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 50%', end: 'bottom 50%',
      onToggle: (st) => {
        if (!st.isActive) return;
        const c = getComputedStyle(el).getPropertyValue('--thread').trim();
        if (c) cursor.set(c);
        chrome.here(el.id.startsWith('gate') ? '' : el.id);
        // the small mark goes light on dark patches
        const forced = getComputedStyle(el).getPropertyValue('--chrome').trim();
        document.documentElement.style.setProperty('--chrome-c', forced || (isDark(getComputedStyle(el).backgroundColor) ? '#F2EDE1' : '#15120F'));
      },
    });
  });
  await document.fonts.ready;
  ScrollTrigger.refresh();
  if (location.hash) { const t = document.querySelector(location.hash); if (t) lenis.scrollTo(t, { immediate: true }); }
  const loader = document.querySelector('.loader');
  setTimeout(() => loader?.classList.add('is-done'), quiet ? 0 : 500);
  addEventListener('load', () => ScrollTrigger.refresh());
}

let chrome;
function isDark(rgb) {
  const m = rgb.match(/[\d.]+/g);
  if (!m || (m[3] !== undefined && +m[3] < .1)) return false;
  const [r, g, b] = m.map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
}
function parseGate(b, n) {
  const [, mark, target] = b.match(/^gate:(\w+)>(\w+)$/);
  return { mark, target, n };
}

function seamDraw(rect, needle, el, s) {
  const W = innerWidth + 40;
  if (reduced()) { rect.setAttribute('width', W + 40); needle.style.display = 'none'; return; }
  const o = { p: 0 };
  gsap.to(o, {
    p: 1, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top 100%', end: 'top 35%', scrub: .5 },
    onUpdate: () => {
      const x = o.p * W;
      rect.setAttribute('width', x + 20);
      needle.setAttribute('transform', `translate(${x - 10} 26) rotate(${Math.sin(x / 30) * 8})`);
      needle.style.opacity = o.p > 0.01 && o.p < 0.99 ? 1 : 0;
    },
  });
}

boot();
