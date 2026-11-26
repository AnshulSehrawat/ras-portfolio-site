# Procedural paper textures (no stock, no AI): python3 tools/build_textures.py
# Writes media/tex/*.webp, all tileable.
import numpy as np
from PIL import Image, ImageFilter
from pathlib import Path
OUT = Path(__file__).resolve().parent.parent / "media/tex"; OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)

def tile_noise(n, scale):
    # tileable noise: band-limited random spectrum (an inverse fft is periodic, so it tiles)
    f = np.fft.fftfreq(n)[:, None] ** 2 + np.fft.fftfreq(n)[None, :] ** 2
    f = np.sqrt(f) * n
    amp = np.exp(-((f - scale) ** 2) / (2 * (scale * .6 + .5) ** 2))
    ph = rng.random((n, n)) * 2 * np.pi
    a = np.real(np.fft.ifft2(amp * np.exp(1j * ph)))
    a -= a.min(); a /= a.max()
    return a.astype(np.float32)

def fbm(n, octaves=((4, .5), (8, .25), (16, .13), (64, .07), (256, .05))):
    a = np.zeros((n, n), np.float32)
    for s, w in octaves: a += tile_noise(n, s) * w
    a -= a.min(); a /= a.max(); return a

def fibers(n, count=2600, length=26):
    im = Image.new("L", (n, n), 0); px = im.load()
    for _ in range(count):
        x, y = rng.integers(0, n, 2); ang = rng.random() * np.pi; L = rng.integers(6, length)
        for t in range(L):
            xx = int(x + np.cos(ang) * t) % n; yy = int(y + np.sin(ang) * t) % n
            px[xx, yy] = min(255, px[xx, yy] + 60)
    return np.asarray(im.filter(ImageFilter.GaussianBlur(.6)), np.float32) / 255

def tint(a, base, dark, light=None):
    base = np.array(base, np.float32); dark = np.array(dark, np.float32)
    rgb = base[None, None, :] * (1 - a[..., None]) + dark[None, None, :] * a[..., None]
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))

N = 1024
# cream paper: soft blotches + fibers
a = fbm(N) * .55 + fibers(N) * .45
tint(a * .32, (243, 238, 226), (205, 193, 168)).save(OUT / "paper.webp", quality=82)
# white paper (diary pages)
tint(fbm(N) * .18 + fibers(N, 1600) * .25, (252, 250, 244), (210, 202, 186)).save(OUT / "page.webp", quality=82)
# red paper / card
a = fbm(N) * .6 + fibers(N, 1800) * .4
tint(a * .45, (232, 54, 33), (150, 24, 14)).save(OUT / "red.webp", quality=82)
# cobalt painted desktop (scuffed)
a = fbm(N, ((3, .5), (9, .3), (40, .12), (200, .08)))
tint(a * .5, (40, 70, 240), (14, 28, 150)).save(OUT / "blue.webp", quality=82)
# crumple: ridges from abs of noise
r = np.abs(fbm(N, ((5, .5), (11, .3), (23, .2))) - .5) * 2
r = 1 - r ** .35
tint(r * .35 + fibers(N, 1200) * .2, (244, 239, 228), (170, 160, 140)).save(OUT / "crumple.webp", quality=80)
print(sorted(p.name for p in OUT.iterdir()))
