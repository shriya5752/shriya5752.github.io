import { chibi } from "./chibi.js";
import { THEMES } from "./theme.js";

const cv = document.getElementById("sky");
const ctx = cv.getContext("2d");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s) => document.querySelector(s);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- colour helpers ----------
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], t))).join(",")})`; };
const rgbMix = (a, b, t) => { const p = (c) => (c.startsWith("#") ? hex(c) : c.match(/\d+/g).map(Number)); const x = p(a), y = p(b); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], t))).join(",")})`; };

// [hour, top, horizon]
const SKY = [
  [0, "#0b0a2a", "#1d1450"], [5, "#2b1b5e", "#ff8fa3"], [7, "#7ec8f0", "#ffe9c9"], [12, "#4aa8f0", "#bfe6ff"],
  [17, "#5b8de0", "#ffcf9a"], [19, "#4a2a7a", "#ff7a6e"], [21, "#1a1245", "#3a2a7a"], [24, "#0b0a2a", "#1d1450"],
];
function skyAt(h) {
  for (let i = 0; i < SKY.length - 1; i++) {
    const [h0, t0, b0] = SKY[i], [h1, t1, b1] = SKY[i + 1];
    if (h >= h0 && h <= h1) { const t = (h - h0) / (h1 - h0); return [rgbMix(t0, t1, t), rgbMix(b0, b1, t)]; }
  }
  return [SKY[0][1], SKY[0][2]];
}
const nightness = (h) => (h < 5 ? 1 : h < 7 ? 1 - (h - 5) / 2 : h < 19 ? 0 : h < 21 ? (h - 19) / 2 : 1);

// ---------- state ----------
let W = 0, H = 0, variant = "day", hour = 0, auto = true, raf = 0;
const rnd = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
let stars = [], city = [], clouds = [];

function seedScene() {
  const r = rnd(7);
  stars = Array.from({ length: 70 }, () => ({ x: r(), y: r() * 0.55, p: r() * 6 }));
  clouds = Array.from({ length: 6 }, (_, i) => ({ x: r(), y: 0.12 + r() * 0.3, s: 0.7 + r() * 0.8, v: 0.004 + r() * 0.008, i }));
  const c = rnd(21);
  city = []; let x = 0;
  while (x < 400) { const w = 6 + Math.floor(c() * 9), h = 0.08 + c() * 0.2; city.push({ x, w, h, seed: Math.floor(c() * 1000) }); x += w + 1; }
}

function resize() {
  const s = 3;
  W = cv.width = Math.ceil(innerWidth / s); H = cv.height = Math.ceil(innerHeight / s);
}

// ---------- shared pieces ----------
const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

function drawSky(top, bottom, hz) {
  const g = ctx.createLinearGradient(0, 0, 0, hz);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz + 1);
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

function drawCloud(cx, cy, s, c1, c2) {
  const u = Math.max(2, Math.round(H * 0.012 * s));
  const rows = [[2, 4], [1, 7], [0, 10], [1, 8]];
  rows.forEach(([off, n], i) => { px(cx + off * u, cy + i * u, n * u, u, c1); });
  px(cx + 1 * u, cy + 4 * u, 8 * u, Math.ceil(u / 2), c2);
}

function drawClouds(t, bottom, night) {
  const c1 = rgbMix("#ffffff", "#6a5aa8", night * 0.85), c2 = rgbMix("#dbe6f5", "#3b2f78", night * 0.85);
  for (const c of clouds) {
    const x = ((c.x + (reduced ? 0 : t * c.v)) % 1.3) - 0.15;
    drawCloud(x * W, c.y * H, c.s, c1, c2);
  }
}

function ridge(hz, amp, freq, phase, color, base) {
  ctx.fillStyle = color;
  for (let x = 0; x < W; x++) {
    const y = hz - base + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.45;
    ctx.fillRect(x, Math.round(y), 1, H - Math.round(y));
  }
}

// ---------- A: day cycle with a new sun ----------
function pixelSun(cx, cy, r, t) {
  // dithered halo
  for (let y = -r * 2; y <= r * 2; y += 2) for (let x = -r * 2; x <= r * 2; x += 2) {
    const d = Math.hypot(x, y);
    if (d > r * 1.15 && d < r * 1.7 && ((x + y) / 2) % 4 === 0) px(cx + x, cy + y, 2, 2, "rgba(255,216,74,.55)");
  }
  // rotating rays
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (reduced ? 0 : t * 0.15);
    const len = i % 2 ? r * 0.55 : r * 0.9;
    for (let k = r * 1.35; k < r * 1.35 + len; k += 2) px(cx + Math.cos(a) * k, cy + Math.sin(a) * k, 2, 2, i % 2 ? "#ffb02e" : "#ffd84a");
  }
  // body
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    px(cx - w, cy + y, w * 2, 1, y > r * 0.3 ? "#ffb02e" : y > -r * 0.3 ? "#ffcb3d" : "#ffe27a");
  }
  // little kawaii face
  px(cx - r * 0.38, cy - 1, 2, 3, "#7a3b12"); px(cx + r * 0.38 - 2, cy - 1, 2, 3, "#7a3b12");
  px(cx - 3, cy + r * 0.3, 6, 1, "#7a3b12"); px(cx - 4, cy + r * 0.3 - 1, 1, 1, "#7a3b12"); px(cx + 3, cy + r * 0.3 - 1, 1, 1, "#7a3b12");
  px(cx - r * 0.62, cy + r * 0.2, 4, 2, "rgba(255,120,120,.6)"); px(cx + r * 0.62 - 4, cy + r * 0.2, 4, 2, "rgba(255,120,120,.6)");
}

function crescent(cx, cy, r) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx + r * 0.55, cy - r * 0.12, r * 0.92, 0, Math.PI * 2); ctx.clip("evenodd");
  ctx.fillStyle = "#fff3c4"; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
  px(cx - r * 0.7, cy + r * 0.15, 3, 3, "#e8d89a"); px(cx - r * 0.45, cy - r * 0.35, 2, 2, "#e8d89a");
}

function sceneDay(t) {
  const hz = Math.floor(H * 0.68);
  const [top, bottom] = skyAt(hour);
  const night = nightness(hour);
  drawSky(top, bottom, hz);
  drawStars(t, night);
  // sun by day, moon by night, riding an arc
  const r = Math.round(H * 0.085);
  if (hour >= 6 && hour <= 18) {
    const p = (hour - 6) / 12;
    pixelSun(Math.round(W * (0.1 + 0.8 * p)), Math.round(hz - Math.sin(Math.PI * p) * H * 0.5 - r * 0.3), r, t);
  } else {
    const hh = hour < 6 ? hour + 24 : hour, p = clamp((hh - 18) / 12, 0, 1);
    crescent(Math.round(W * (0.1 + 0.8 * p)), Math.round(hz - Math.sin(Math.PI * p) * H * 0.48), Math.round(r * 0.8));
  }
  drawClouds(t, bottom, night);
  ridge(hz, 5, 0.045, 1, rgbMix(bottom, "#6a5aa8", 0.55), H * 0.1);
  ridge(hz, 7, 0.03, 4, rgbMix(bottom, "#3a2f7a", 0.7), H * 0.0);
  ridge(hz, 3, 0.08, 2, rgbMix(bottom, "#241a58", 0.82), -H * 0.08);
  // meadow strip with tiny flowers
  px(0, H - Math.round(H * 0.18), W, H, rgbMix(bottom, "#1d1650", 0.88));
  for (let x = 4; x < W; x += 11) px(x, H - Math.round(H * 0.17) + ((x * 7) % 9), 1, 2, ["#ff9ac1", "#ffe27a", "#bde0ff"][x % 3]);
}

// ---------- B: ringed planet ----------
function scenePlanet(t) {
  hour = 23;
  const hz = Math.floor(H * 0.72);
  drawSky("#0a0826", "#2a1862", hz);
  drawStars(t, 1);
  const cx = Math.round(W * 0.72), cy = Math.round(H * 0.3), r = Math.round(H * 0.17);
  const ring = (front) => {
    for (let a = 0; a < Math.PI * 2; a += 0.012) {
      const isFront = Math.sin(a) > 0;
      if (isFront !== front) continue;
      const rx = Math.cos(a) * r * 1.9, ry = Math.sin(a) * r * 0.42, rot = -0.35;
      const x = cx + rx * Math.cos(rot) - ry * Math.sin(rot), y = cy + rx * Math.sin(rot) + ry * Math.cos(rot);
      px(x, y, 2, 2, "#f6d6ff"); px(x, y + 2, 2, 1, "#c8a2f0");
    }
  };
  ring(false);
  const bands = ["#ffb58a", "#ff9aa2", "#ffd0a0", "#e87fa6", "#ffc4a6"];
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    px(cx - w, cy + y, w * 2, 1, bands[Math.abs(Math.floor((y + r) / 4 + Math.sin(y * 0.3) * 0.6)) % bands.length]);
  }
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = "rgba(20,0,60,.38)"; ctx.beginPath(); ctx.arc(cx + r * 0.5, cy + r * 0.35, r * 1.05, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ring(true);
  // moon circling
  const ma = (reduced ? 0.6 : t * 0.25);
  px(cx + Math.cos(ma) * r * 2.4, cy + Math.sin(ma) * r * 0.7 - r * 0.5, 7, 7, "#e6e0ff"); px(cx + Math.cos(ma) * r * 2.4 + 4, cy + Math.sin(ma) * r * 0.7 - r * 0.5 + 3, 3, 4, "#b5a8e8");
  // shooting star
  const cyc = (t % 7) / 7;
  if (!reduced && cyc < 0.14) { const p = cyc / 0.14; for (let k = 0; k < 14; k++) px(W * (0.5 - p * 0.4) + k * 1.6, H * (0.08 + p * 0.3) - k * 0.8, 2, 1, `rgba(255,255,255,${1 - k / 14})`); }
  drawClouds(t, "#2a1862", 1);
  ridge(hz, 6, 0.03, 2, "#4a2f8a", H * 0.05);
  ridge(hz, 5, 0.022, 5, "#33206d", -H * 0.02);
  ridge(hz, 4, 0.05, 1, "#1d1250", -H * 0.1);
}

// ---------- C: moon & skyline ----------
function sceneCity(t) {
  hour = 22;
  const hz = Math.floor(H * 0.74);
  drawSky("#0b0a2a", "#3b2a7e", hz);
  drawStars(t, 1);
  crescent(Math.round(W * 0.5), Math.round(H * 0.25), Math.round(H * 0.15));
  drawClouds(t, "#3b2a7e", 1);
  const scale = Math.max(1, W / 280);
  city.forEach((b) => {
    const x = Math.round(b.x * scale), w = Math.round(b.w * scale), h = Math.round(b.h * H);
    if (x > W) return;
    px(x, hz - h, w, h + (H - hz), "#16113a");
    px(x, hz - h, w, 1, "#2a2060");
    for (let wy = hz - h + 4; wy < hz - 2; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) {
      const on = ((b.seed + wx * 7 + wy * 13) % 10) > 4, flick = reduced ? 0 : Math.sin(t * 0.5 + wx * 0.3 + wy) > 0.97;
      if (on !== flick) px(wx, wy, 2, 2, "#ffd86b");
    }
  });
  px(0, hz, W, H - hz, "#0e0a2c");
  // glowing street line
  px(0, hz + 6, W, 1, "#ff7ac0"); px(0, hz + 7, W, 1, "rgba(255,122,192,.35)");
}

// ---------- time-of-day theme for the mock window ----------
function applyMock() {
  const t = THEMES[nightness(hour) > 0.5 ? "violet" : "bubblegum"];
  const root = document.documentElement.style;
  for (const k of ["win", "win2", "ink", "dim", "a", "b", "onbar"]) root.setProperty("--" + k, t[k]);
  $("#mockLabel").textContent = nightness(hour) > 0.5 ? "night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
}

// ---------- loop ----------
function fmt(h) { const hh = Math.floor(h), mm = Math.floor((h - hh) * 60); return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0"); }

function frame(ms) {
  const t = ms / 1000;
  if (auto) { const d = new Date(); hour = d.getHours() + d.getMinutes() / 60; $("#hour").value = hour; }
  $("#hourOut").textContent = fmt(hour);
  ctx.globalAlpha = 1;
  if (variant === "day") sceneDay(t); else if (variant === "planet") scenePlanet(t); else sceneCity(t);
  applyMock();
  raf = !reduced && !document.hidden ? requestAnimationFrame(frame) : 0;
}
function kick() { if (!raf) raf = requestAnimationFrame(frame); }

// ---------- character ----------
const hero = $("#hero");
hero.innerHTML = chibi();
const lines = ["hi! i'm shriya.", "overthinking, but make it cute.", "never wish to be defined easily.", "typing something... very important.", "click me again :)"];
let li = 0, sayT = 0;
const heart = `<svg viewBox="0 0 7 6" shape-rendering="crispEdges"><path fill="#ff5c8a" d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z"/></svg>`;

function mote() {
  const m = document.createElement("div");
  m.className = "mote"; m.innerHTML = heart;
  const r = hero.getBoundingClientRect();
  m.style.left = r.left + r.width * (0.3 + Math.random() * 0.4) + "px";
  m.style.top = r.top + r.height * 0.15 + "px";
  m.style.setProperty("--dx", (Math.random() * 40 - 20) + "px");
  document.body.appendChild(m);
  setTimeout(() => m.remove(), 2500);
}
function speak(text) {
  hero.querySelector(".say")?.remove();
  const s = document.createElement("div"); s.className = "say"; s.textContent = text; hero.appendChild(s);
  clearTimeout(sayT); sayT = setTimeout(() => s.remove(), 3200);
  hero.classList.remove("hop"); void hero.offsetWidth; hero.classList.add("hop");
  for (let i = 0; i < 4; i++) setTimeout(mote, i * 120);
}
hero.addEventListener("click", () => { li = (li + 1) % lines.length; speak(lines[li]); });
if (!reduced) setInterval(mote, 4200);
setTimeout(() => speak(lines[0]), 900);

addEventListener("pointermove", (e) => {
  const r = hero.getBoundingClientRect();
  const dx = clamp((e.clientX - (r.left + r.width / 2)) / 320, -1, 1), dy = clamp((e.clientY - (r.top + r.height * 0.3)) / 260, -1, 1);
  const head = hero.querySelector(".headg"), pu = hero.querySelector(".pupils");
  if (head) head.setAttribute("transform", `translate(${Math.round(dx)} ${dy > 0.7 ? 1 : 0})`);
  if (pu) pu.setAttribute("transform", `translate(${Math.round(dx)} ${Math.round(dy)})`);
}, { passive: true });
(function blink() {
  setTimeout(() => {
    const l = hero.querySelector(".lids");
    if (l) { l.style.opacity = 1; setTimeout(() => { l.style.opacity = 0; }, 130); }
    blink();
  }, 2200 + Math.random() * 2800);
})();

// ---------- controls ----------
$("#variants").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  variant = b.dataset.v;
  document.querySelectorAll("#variants button").forEach((x) => x.classList.toggle("on", x === b));
  $("#timeRow").style.display = variant === "day" ? "flex" : "none";
  if (variant !== "day") { auto = false; }
  kick();
});
$("#hour").addEventListener("input", (e) => { auto = false; hour = parseFloat(e.target.value); kick(); });
$("#now").addEventListener("click", () => { auto = true; kick(); });

seedScene(); resize();
addEventListener("resize", () => { resize(); kick(); });
document.addEventListener("visibilitychange", kick);
kick();
