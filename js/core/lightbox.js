// one shared lightbox: lightbox.open([{src, caption}], index)
import { h } from './util.js';

export function makeLightbox(lenis) {
  const img = h('img', { alt: '' });
  const cap = h('figcaption');
  const close = h('button.lb-close', { 'aria-label': 'close' }, 'close ✕');
  const prev = h('button.lb-prev', { 'aria-label': 'previous' }, '←');
  const next = h('button.lb-next', { 'aria-label': 'next' }, '→');
  const root = h('div.lb', { role: 'dialog', 'aria-modal': 'true' }, h('figure', {}, img, cap), close, prev, next);
  document.body.append(root);
  let items = [], i = 0, wasStopped = false;
  const show = () => {
    const it = items[i]; img.src = it.src; img.alt = it.alt || it.caption || '';
    cap.textContent = it.caption || ''; prev.hidden = next.hidden = items.length < 2;
  };
  const api = {
    open(list, at = 0) { items = list; i = at; show(); wasStopped = !!lenis?.isStopped; root.classList.add('is-open'); lenis?.stop(); },
    // put the scroll back the way we found it (an overlay may have stopped it)
    close() { root.classList.remove('is-open'); if (!wasStopped) lenis?.start(); },
  };
  close.onclick = api.close;
  root.addEventListener('click', (e) => { if (e.target === root) api.close(); });
  prev.onclick = () => { i = (i - 1 + items.length) % items.length; show(); };
  next.onclick = () => { i = (i + 1) % items.length; show(); };
  addEventListener('keydown', (e) => {
    if (!root.classList.contains('is-open')) return;
    if (e.key === 'Escape') api.close();
    if (e.key === 'ArrowLeft') prev.onclick();
    if (e.key === 'ArrowRight') next.onclick();
  });
  return api;
}
