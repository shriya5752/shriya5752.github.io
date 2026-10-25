// Wallpaper: a pixel sky that follows the real time of day.
// A smiling sun crosses the sky by day, a crescent moon takes over at night.
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const lerp = (a, b, t) => a + (b - a) * t;

let override = null; // set by the terminal's `sky` command
export const currentHour = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
export const skyHour = () => (override === null ? currentHour() : override);
export const nightness = (h) => (h < 5 ? 1 : h < 7 ? 1 - (h - 5) / 2 : h < 19 ? 0 : h < 21 ? (h - 19) / 2 : 1);

// ---------- colours ----------
const parse = (c) => (c.startsWith("#") ? [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) : c.match(/\d+/g).map(Number));
const mix = (a, b, t) => { const x = parse(a), y = parse(b); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], t))).join(",")})`; };

// [hour, top, horizon]
const SKY = [
  [0, "#0b0a2a", "#1d1450"], [5, "#2b1b5e", "#ff8fa3"], [7, "#7ec8f0", "#ffe9c9"], [12, "#4aa8f0", "#bfe6ff"],
  [17, "#5b8de0", "#ffcf9a"], [19, "#4a2a7a", "#ff7a6e"], [21, "#1a1245", "#3a2a7a"], [24, "#0b0a2a", "#1d1450"],
];
function skyAt(h) {
  for (let i = 0; i < SKY.length - 1; i++) {
    const [h0, t0, b0] = SKY[i], [h1, t1, b1] = SKY[i + 1];
    if (h >= h0 && h <= h1) { const t = (h - h0) / (h1 - h0); return [mix(t0, t1, t), mix(b0, b1, t)]; }
  }
  return [SKY[0][1], SKY[0][2]];
}

const rnd = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

export function startSky(canvas, { animated = true } = {}) {
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, mx = 0.5, raf = 0, anim = animated, timer = 0;
  const r = rnd(7);
  const stars = Array.from({ length: 70 }, () => ({ x: r(), y: r() * 0.55, p: r() * 6 }));
  const clouds = Array.from({ length: 6 }, () => ({ x: r(), y: 0.1 + r() * 0.32, s: 0.7 + r() * 0.8, v: 0.004 + r() * 0.008 }));

  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

  function resize() {
    const scale = 3; // low-res canvas scaled up with pixelated rendering
    W = canvas.width = Math.ceil(innerWidth / scale);
    H = canvas.height = Math.ceil(innerHeight / scale);
    draw(performance.now());
  }

  function drawStars(t, a) {
    if (a <= 0.02) return;
    for (const s of stars) {
      const tw = reduced ? 1 : 0.5 + 0.5 * Math.sin(t * 2 + s.p);
      ctx.globalAlpha = a * (0.3 + 0.7 * tw);
      px(s.x * W, s.y * H, 1, 1, "#ffffff");
      if (s.p > 5.2) { px(s.x * W - 1, s.y * H, 3, 1, "#ffffff"); px(s.x * W, s.y * H - 1, 1, 3, "#ffffff"); }
    }
    ctx.globalAlpha = 1;
  }

  function cloud(cx, cy, s, c1, c2) {
    const u = Math.max(2, Math.round(H * 0.012 * s));
    [[2, 4], [1, 7], [0, 10], [1, 8]].forEach(([off, n], i) => px(cx + off * u, cy + i * u, n * u, u, c1));
    px(cx + u, cy + 4 * u, 8 * u, Math.ceil(u / 2), c2);
  }

  function sun(cx, cy, rad, t) {
    for (let y = -rad * 2; y <= rad * 2; y += 2) for (let x = -rad * 2; x <= rad * 2; x += 2) {
      const d = Math.hypot(x, y);
      if (d > rad * 1.15 && d < rad * 1.7 && ((x + y) / 2) % 4 === 0) px(cx + x, cy + y, 2, 2, "rgba(255,216,74,.55)");
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + (reduced ? 0 : t * 0.15), len = i % 2 ? rad * 0.55 : rad * 0.9;
      for (let k = rad * 1.35; k < rad * 1.35 + len; k += 2) px(cx + Math.cos(a) * k, cy + Math.sin(a) * k, 2, 2, i % 2 ? "#ffb02e" : "#ffd84a");
    }
    for (let y = -rad; y <= rad; y++) {
      const w = Math.floor(Math.sqrt(rad * rad - y * y));
      px(cx - w, cy + y, w * 2, 1, y > rad * 0.3 ? "#ffb02e" : y > -rad * 0.3 ? "#ffcb3d" : "#ffe27a");
    }
    px(cx - rad * 0.38, cy - 1, 2, 3, "#7a3b12"); px(cx + rad * 0.38 - 2, cy - 1, 2, 3, "#7a3b12");
    px(cx - 3, cy + rad * 0.3, 6, 1, "#7a3b12"); px(cx - 4, cy + rad * 0.3 - 1, 1, 1, "#7a3b12"); px(cx + 3, cy + rad * 0.3 - 1, 1, 1, "#7a3b12");
    px(cx - rad * 0.62, cy + rad * 0.2, 4, 2, "rgba(255,120,120,.6)"); px(cx + rad * 0.62 - 4, cy + rad * 0.2, 4, 2, "rgba(255,120,120,.6)");
  }

  function crescent(cx, cy, rad) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx + rad * 0.55, cy - rad * 0.12, rad * 0.92, 0, Math.PI * 2); ctx.clip("evenodd");
    ctx.fillStyle = "#fff3c4"; ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    ctx.restore();
    px(cx - rad * 0.7, cy + rad * 0.15, 3, 3, "#e8d89a"); px(cx - rad * 0.45, cy - rad * 0.35, 2, 2, "#e8d89a");
  }

  function ridge(hz, amp, freq, phase, color, base) {
    ctx.fillStyle = color;
    for (let x = 0; x < W; x++) {
      const y = Math.round(hz - base + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.45);
      ctx.fillRect(x, y, 1, H - y);
    }
  }

  function draw(ms) {
    const t = ms / 1000, hour = skyHour(), night = nightness(hour), hz = Math.floor(H * 0.68);
    const [top, bottom] = skyAt(hour);
    const g = ctx.createLinearGradient(0, 0, 0, hz);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz + 1);
    drawStars(t, night);

    const rad = Math.round(H * 0.085);
    if (hour >= 6 && hour <= 18) {
      const p = (hour - 6) / 12;
      sun(Math.round(W * (0.1 + 0.8 * p)), Math.round(hz - Math.sin(Math.PI * p) * H * 0.5 - rad * 0.3), rad, t);
    } else {
      const hh = hour < 6 ? hour + 24 : hour, p = clamp((hh - 18) / 12, 0, 1);
      crescent(Math.round(W * (0.1 + 0.8 * p)), Math.round(hz - Math.sin(Math.PI * p) * H * 0.48), Math.round(rad * 0.8));
    }

    const c1 = mix("#ffffff", "#6a5aa8", night * 0.85), c2 = mix("#dbe6f5", "#3b2f78", night * 0.85);
    for (const c of clouds) cloud((((c.x + (reduced ? 0 : t * c.v)) % 1.3) - 0.15) * W, c.y * H, c.s, c1, c2);

    const par = (mx - 0.5) * 0.25; // hills shift slightly with the cursor
    ridge(hz, 5, 0.045, 1 + par * 0.6, mix(bottom, "#6a5aa8", 0.55), H * 0.1);
    ridge(hz, 7, 0.03, 4 + par, mix(bottom, "#3a2f7a", 0.7), 0);
    ridge(hz, 3, 0.08, 2 + par * 1.6, mix(bottom, "#241a58", 0.82), -H * 0.08);
    px(0, H - Math.round(H * 0.18), W, H, mix(bottom, "#1d1650", 0.88));
    for (let x = 4; x < W; x += 11) px(x, H - Math.round(H * 0.17) + ((x * 7) % 9), 1, 2, ["#ff9ac1", "#ffe27a", "#bde0ff"][x % 3]);
  }

  function loop(ms) {
    draw(ms);
    raf = anim && !reduced && !document.hidden ? requestAnimationFrame(loop) : 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }

  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth; }, { passive: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
  timer = setInterval(() => { if (!raf) draw(performance.now()); }, 60000); // keep a still sky current
  resize();
  kick();

  return {
    setAnimated(on) { anim = on; if (on) kick(); },
    setHour(h) { override = h; if (!raf) draw(performance.now()); },
  };
}
