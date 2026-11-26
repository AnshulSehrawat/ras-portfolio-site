// the needle cursor and the running-stitch thread it drags behind it
import { h, isTouch, reduced } from './util.js';

export function makeCursor() {
  const api = { color: '#E5331F', set(c) { api.color = c; }, hot() {}, hide() {}, show() {} };
  if (isTouch() || reduced()) return api;

  document.documentElement.classList.add('has-needle');
  const cv = h('canvas.thread-canvas');
  const needle = h('div.needle', {
    html: `<svg viewBox="0 0 34 34"><defs><linearGradient id="ndl" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#b9b9b9"/><stop offset="1" stop-color="#6d6d6d"/></linearGradient></defs>
      <path d="M2 2 L29 25.5 Q31.5 28.5 28.5 30.5 Q26 31.5 24.5 29 Z" fill="url(#ndl)" stroke="#15120F" stroke-width="1.1" stroke-linejoin="round"/>
      <ellipse cx="27.2" cy="27.6" rx="1.1" ry="2.3" transform="rotate(-48 27.2 27.6)" fill="#15120F"/></svg>`,
  });
  document.body.append(cv, needle);
  const ctx = cv.getContext('2d');
  let W, H, dpr;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size(); addEventListener('resize', size);

  const pts = [];
  let x = -100, y = -100, tx = -100, ty = -100, hidden = false, dash = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY;
    const hot = e.target.closest('a,button,[data-hot],input,label,[draggable="true"]');
    needle.classList.toggle('is-hot', !!hot);
  }, { passive: true });
  document.addEventListener('pointerleave', () => needle.classList.add('is-gone'));
  document.addEventListener('pointerenter', () => needle.classList.remove('is-gone'));

  api.hide = () => { hidden = true; needle.classList.add('is-gone'); };
  api.show = () => { hidden = false; needle.classList.remove('is-gone'); };

  const LIFE = 950;
  function frame(t) {
    x += (tx - x) * 0.55; y += (ty - y) * 0.55;
    needle.style.transform = `translate(${x}px, ${y}px)`;
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(last.x - x, last.y - y) > 3) pts.push({ x, y, t });
    while (pts.length && t - pts[0].t > LIFE) pts.shift();
    ctx.clearRect(0, 0, W, H);
    if (!hidden && pts.length > 2) {
      // thread: slack curve through the points, drawn as a running stitch
      for (const pass of [0, 1]) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x + pass, pts[0].y + 1.5 * (1 - pass));
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y + (pass ? 0 : 1.5), mx, my + (pass ? 0 : 1.5));
        }
        ctx.lineTo(x + 24, y + 24);
        ctx.setLineDash([9, 7]);
        ctx.lineDashOffset = dash;
        ctx.lineCap = 'round';
        ctx.lineWidth = pass ? 2.6 : 2.6;
        ctx.strokeStyle = pass ? api.color : 'rgba(0,0,0,.22)';
        ctx.stroke();
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return api;
}
