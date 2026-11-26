// No image is ever an empty box.
// Every <img> (now or added later) gets its tiny blurred preview + average tone underneath until the photo is in,
// then the photo sharpens in over it. Lazy images start loading 1600px before they reach the screen (both axes,
// because some patches move sideways), the ones on screen at boot load first, and once the page is idle the rest
// are fetched quietly, nearest first, so a fast scroller still finds them ready.
import { previews } from '../content/previews.js';

const MARGIN = '1600px 1600px 1600px 1600px';
const keyOf = (src) => {
  const m = src && src.match(/media\/(?:(ads|archive|art)\/([a-z]\d+)|gate\/([a-z]+))[-.]/i);
  return m ? (m[2] || 'gate/' + m[3]) : null;
};
const srcOf = (im) => im.getAttribute('src') || im.dataset.src || '';
const done = (im) => im.complete && im.naturalWidth > 0 && !im.dataset.src;

// the tiny preview, softened with a real blur (a 20px image scaled up on its own looks blocky)
const blurred = new Map();
export function previewURL(key) {
  const p = previews[key];
  if (!p) return '';
  if (!blurred.has(key)) {
    const svgTxt = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40' preserveAspectRatio='none'><filter id='b' x='0' y='0' width='1' height='1' color-interpolation-filters='sRGB'><feGaussianBlur stdDeviation='2.2' edgeMode='duplicate'/></filter><image width='40' height='40' preserveAspectRatio='none' href='${p[0]}' filter='url(#b)'/></svg>`;
    blurred.set(key, `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgTxt)}")`);
  }
  return blurred.get(key);
}

function placeholder(im) {
  const key = keyOf(srcOf(im)), p = previews[key];
  if (!p || done(im)) return;
  im.classList.add('ph');
  im.style.backgroundColor = p[1];
  im.style.backgroundImage = previewURL(key);
  // inline, because some patches set the background shorthand on their images
  im.style.backgroundSize = 'cover'; im.style.backgroundPosition = 'center'; im.style.backgroundRepeat = 'no-repeat';
}

function reveal(im) {
  if (!im.classList.contains('ph')) return;
  im.classList.remove('ph');
  // sharpen in, unless the patch already filters this image (greyscale thumbs etc.)
  if (getComputedStyle(im).filter === 'none') {
    im.classList.add('ph-in');
    setTimeout(() => im.classList.remove('ph-in'), 600);
  }
  for (const k of ['backgroundImage', 'backgroundColor', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat']) im.style[k] = '';
}

function start(im) {
  if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); }
  if (im.loading === 'lazy') im.loading = 'eager';
}

// images inside an overflow-clipped box (decks, sideways tracks) never "intersect" until they are inside the clip,
// for native lazy loading too. so the clipping box itself is watched, and when it comes near, all its images start.
const groups = new Map();
const near = new IntersectionObserver((ents) => {
  for (const e of ents) {
    if (!e.isIntersecting) continue;
    if (groups.has(e.target)) { groups.get(e.target).forEach(start); groups.delete(e.target); near.unobserve(e.target); continue; }
    const r = e.boundingClientRect;
    if (r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth) e.target.fetchPriority = 'high'; // on screen now
    start(e.target); near.unobserve(e.target);
  }
}, { rootMargin: MARGIN });

const seen = new WeakSet();
function adopt(im) {
  if (!seen.has(im)) {
    seen.add(im);
    im.addEventListener('load', () => { if (!im.dataset.src) reveal(im); });
    im.addEventListener('error', () => {
      // a dropped request: try once more, and if it still fails keep the preview (alt text hidden) rather than a hole
      if (!im.dataset.retried && !srcOf(im).startsWith('data:')) {
        im.dataset.retried = '1';
        setTimeout(() => { if (im.srcset) im.setAttribute('srcset', im.getAttribute('srcset')); else im.setAttribute('src', im.getAttribute('src')); }, 1500);
      } else if (im.classList.contains('ph')) im.classList.add('ph-err');
    });
  }
  placeholder(im);
  if (done(im)) return;
  if (im.loading === 'lazy' || im.dataset.src) { near.observe(im); pending.add(im); schedule(); }
}

const pending = new Set();
let queued = false;
function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    for (const im of pending) {
      for (let p = im.parentElement; p && !p.classList.contains('patch') && p !== document.body; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        if (p.offsetHeight > innerHeight * 3) break; // a whole chapter is not a "box"; its images are watched one by one
        if (!groups.has(p)) { groups.set(p, new Set()); near.observe(p); }
        groups.get(p).add(im);
      }
    }
    pending.clear();
  });
}

function onScreen(im) {
  const r = im.getBoundingClientRect();
  return r.width > 0 && r.bottom > -200 && r.top < innerHeight + 200 && r.right > -200 && r.left < innerWidth + 200;
}

// after load: fetch whatever is still waiting, nearest to the screen first, a few at a time
function warm() {
  if (navigator.connection?.saveData) return;
  let busy = 0;
  const next = () => {
    const left = [...document.querySelectorAll('img')].filter((im) => !done(im) && (im.loading === 'lazy' || im.dataset.src) && im.getClientRects().length);
    if (!left.length) return;
    const y = innerHeight / 2;
    left.sort((a, b) => Math.abs(a.getBoundingClientRect().top - y) - Math.abs(b.getBoundingClientRect().top - y));
    for (const im of left) {
      if (busy >= 4) break;
      busy++;
      const go = () => { im.removeEventListener('load', go); im.removeEventListener('error', go); busy--; setTimeout(next, 30); };
      im.addEventListener('load', go); im.addEventListener('error', go);
      near.unobserve(im); start(im);
    }
  };
  next();
}

export function watchImages(root = document.body) {
  root.querySelectorAll('img').forEach((im) => {
    adopt(im);
    if (onScreen(im)) { im.fetchPriority = 'high'; start(im); }
  });
  // patches mount after this runs: the mutation observer below adopts their images as they are added
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'attributes') { if (m.target.tagName === 'IMG') { seen.has(m.target) && !done(m.target) && placeholder(m.target); adopt(m.target); } continue; }
      m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.tagName === 'IMG') adopt(n); else n.querySelectorAll?.('img').forEach(adopt);
      });
    }
  }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'data-src'] });
  const idle = () => (window.requestIdleCallback || setTimeout)(warm, { timeout: 3000 });
  if (document.readyState === 'complete') setTimeout(idle, 1200); else addEventListener('load', () => setTimeout(idle, 1200), { once: true });
}

// does this browser show AVIF? (decides the photo format in util.img)
export function avifOK() {
  return new Promise((res) => {
    const t = new Image();
    t.onload = () => res(t.width > 0); t.onerror = () => res(false);
    t.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    setTimeout(() => res(false), 1500);
  });
}
