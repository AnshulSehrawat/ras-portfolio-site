// small helpers shared by every patch
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);

// seeded random so a patch looks the same on every load
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// h('div.card#x', {style:..., onclick:...}, ...children)
export function h(tag, attrs = {}, ...kids) {
  const [, name = 'div', rest = ''] = tag.match(/^([a-z0-9-]*)(.*)$/i);
  const el = document.createElement(name || 'div');
  rest.replace(/([.#])([^.#]+)/g, (_, t, v) => (t === '.' ? el.classList.add(...v.trim().split(/\s+/)) : (el.id = v.trim())));
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'style' && typeof v === 'object') for (const [sk, sv] of Object.entries(v)) sk.startsWith('--') ? el.style.setProperty(sk, sv) : (el.style[sk] = sv);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(k));
  return el;
}

export function svg(tag, attrs = {}, ...kids) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  for (const k of kids.flat()) if (k) el.append(k);
  return el;
}

// image url for a media id: img('b01') -> media/ads/b01.webp, img('a12','s') -> small
export function img(id, size = '') {
  const dir = id[0] === 'b' ? 'ads' : id[0] === 'x' ? 'archive' : 'art';
  return `media/${dir}/${id}${size ? '-' + size : ''}.webp`;
}

export const isTouch = () => matchMedia('(pointer: coarse)').matches;
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const mobile = () => innerWidth < 760;

// rough polygon for a torn top edge, as a css clip-path
export function tornClip(seed, depth = 14, steps = 48) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i <= steps; i++) pts.push(`${((i / steps) * 100).toFixed(2)}% ${(r() * depth).toFixed(1)}px`);
  return `polygon(${pts.join(',')}, 100% 100%, 0 100%)`;
}

// a running stitch path across a width, a little wobbly
export function stitchPath(w, y, seed, wob = 3) {
  const r = rng(seed);
  let d = `M -10 ${y}`;
  for (let x = 0; x <= w + 40; x += 40) d += ` Q ${x - 20} ${y + (r() - .5) * wob * 2} ${x} ${y + (r() - .5) * wob}`;
  return d;
}
