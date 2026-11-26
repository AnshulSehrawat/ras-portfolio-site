// fixed bits: the small mark top-left, "say hi" top-right, and the care label (the index) on the right edge
import { h, svg } from './util.js';
import { labels } from '../content/cuts.js';

export function makeChrome({ logos, blocks, lenis, hasDesk, site }) {
  const L = logos.grid;
  const markSvg = svg('svg', { viewBox: `0 0 ${L.w} ${L.h}` }, ...L.letters.map((l) => svg('path', { d: l.black })));
  const mark = h('a.chrome-mark', { href: '#top', 'aria-label': 'RA.S, back to the top', onclick: (e) => { e.preventDefault(); lenis.scrollTo(0, { duration: 2.2 }); } }, markSvg);
  const hire = h('a.chrome-hire', {
    href: hasDesk ? '#desk-contact' : `mailto:${site.email}`,
    onclick: (e) => {
      if (!hasDesk) return;
      e.preventDefault();
      const t = document.getElementById('desk-contact') || document.getElementById('desk');
      if (t) lenis.scrollTo(t, { duration: 2.4, offset: -40 });
    },
  }, 'say hi →');

  const items = blocks.filter((b) => !b.startsWith('gate')).map((b) =>
    h('li', {}, h('a', { href: '#' + b, 'data-for': b, onclick: (e) => { e.preventDefault(); close(); lenis.scrollTo('#' + b, { duration: 2.4 }); } },
      h('span', {}, labels[b] || b), h('span', {}, '→'))));
  const panel = h('div.care-panel', {},
    h('h4', {}, 'RA.S'),
    h('p.care-sub', {}, 'rags of thoughts. one of one.'),
    h('ol', {}, items),
    h('div.care-icons', {
      html: `<svg viewBox="0 0 24 24" fill="none" stroke="#15120F" stroke-width="1.4"><path d="M3 7h18l-2 12H5z"/><path d="M3 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><text x="12" y="16" font-size="6" text-anchor="middle" fill="#15120F" stroke="none" font-family="monospace">30</text></svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="#15120F" stroke-width="1.4"><path d="M4 18h16l-2-8H8z"/><path d="M8 10l2-4h6"/><path d="M3 21L21 3"/></svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="#15120F" stroke-width="1.4"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M3 21L21 3"/></svg>`,
    }, h('p', {}, 'wash cold. never iron.', h('br'), 'made in india, by hand.')),
  );
  const tab = h('button.care-tab', { 'aria-label': 'open the index' }, h('b', {}, 'RA.S'), h('span.care-here', {}, 'index'));
  const care = h('nav.care', {}, panel, tab);
  const close = () => care.classList.remove('is-open');
  tab.onclick = () => care.classList.toggle('is-open');
  document.addEventListener('click', (e) => { if (!care.contains(e.target)) close(); });
  document.body.append(mark, hire, care);

  return {
    here(id) {
      const lab = labels[id];
      if (lab) care.querySelector('.care-here').textContent = lab;
      items.forEach((li) => li.firstChild.classList.toggle('is-here', li.firstChild.dataset.for === id));
    },
  };
}
