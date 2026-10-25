// Themes, saved preferences, and the animated pixel wallpaper.
export const THEMES = {
  violet: { label: "violet", bg: "#140b2e", bg2: "#2a1054", win: "#1b1038", win2: "#261653", ink: "#ece6ff", dim: "#9d8fd0", a: "#8b5cf6", b: "#06b6d4", onbar: "#ffffff", hi: "#ffffff", scan: ".16", vig: ".5", sun1: "#ffd166", sun2: "#ff4f9a" },
  amber: { label: "amber crt", bg: "#140a00", bg2: "#2e1500", win: "#1c1000", win2: "#2b1a00", ink: "#ffe2b0", dim: "#b58a4c", a: "#ffb000", b: "#ff7a1a", onbar: "#1a0f00", hi: "#fff3d6", scan: ".2", vig: ".55", sun1: "#ffe27a", sun2: "#ff6a00" },
  phosphor: { label: "phosphor", bg: "#00100a", bg2: "#002a1a", win: "#021510", win2: "#04241a", ink: "#c8ffd9", dim: "#5fae7f", a: "#39ff88", b: "#00d4aa", onbar: "#00140a", hi: "#ffffff", scan: ".2", vig: ".55", sun1: "#d4ff9a", sun2: "#00c26e" },
  bubblegum: { label: "bubblegum", bg: "#ffd9f0", bg2: "#c9b6ff", win: "#fff6fc", win2: "#f1dcff", ink: "#2a1650", dim: "#7a5fa8", a: "#d63aa0", b: "#3d5bff", onbar: "#ffffff", hi: "#12082b", scan: ".04", vig: ".12", sun1: "#fff07a", sun2: "#ff7ab8" },
};

const KEY = "shriya.os.prefs";
export const prefs = { theme: "violet", crt: true, trail: true, wallpaper: true };

try { Object.assign(prefs, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* storage blocked: defaults are fine */ }
if (!THEMES[prefs.theme]) prefs.theme = "violet";

export function savePrefs() {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

const listeners = [];
export function onTheme(fn) { listeners.push(fn); }

export function applyTheme(name) {
  const t = THEMES[name];
  if (!t) return false;
  prefs.theme = name;
  const root = document.documentElement.style;
  for (const k of ["bg", "bg2", "win", "win2", "ink", "dim", "a", "b", "onbar", "hi", "scan", "vig"]) root.setProperty("--" + k, t[k]);
  document.querySelector('meta[name="theme-color"]').content = t.bg;
  listeners.forEach((fn) => fn(t));
  savePrefs();
  return true;
}

export function applyCrt(on) {
  prefs.crt = on;
  document.body.classList.toggle("crt-on", on);
  savePrefs();
}

// ---------- wallpaper: pixelated synthwave grid ----------
export function startWallpaper() {
  const canvas = document.getElementById("wall");
  const ctx = canvas.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let t = THEMES[prefs.theme];
  let W = 0, H = 0, mx = 0.5, raf = 0;
  const stars = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random() * 0.5, p: Math.random() * 6 }));

  onTheme((nt) => { t = nt; if (!raf) frame(0); });

  function resize() {
    const scale = 3; // low-res canvas, scaled up with pixelated rendering
    W = canvas.width = Math.ceil(innerWidth / scale);
    H = canvas.height = Math.ceil(innerHeight / scale);
    if (!raf) frame(0);
  }
  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth; }, { passive: true });

  function frame(ms) {
    const time = ms / 1000;
    const hz = Math.floor(H * 0.56);
    const vx = W / 2 + (mx - 0.5) * W * 0.12;

    const sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, t.bg); sky.addColorStop(1, t.bg2);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hz);

    for (const s of stars) {
      const tw = reduced ? 1 : 0.5 + 0.5 * Math.sin(time * 2 + s.p);
      ctx.globalAlpha = 0.25 + 0.6 * tw;
      ctx.fillStyle = t.ink;
      ctx.fillRect(Math.floor(s.x * W), Math.floor(s.y * H), 1, 1);
    }
    ctx.globalAlpha = 1;

    // sun with scrolling slits
    const r = Math.floor(Math.min(W, H) * 0.26), cx = Math.floor(vx), cy = hz - Math.floor(r * 0.15);
    const sun = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    sun.addColorStop(0, t.sun1); sun.addColorStop(1, t.sun2);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, hz); ctx.clip();
    ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = t.bg2;
    for (let i = 0; i < 6; i++) {
      const y = cy + r * 0.1 + i * (r * 0.17);
      ctx.fillRect(cx - r, Math.floor(y), r * 2, Math.max(1, Math.floor(1 + i * 0.7)));
    }
    ctx.restore();

    // ground
    ctx.fillStyle = t.bg; ctx.fillRect(0, hz, W, H - hz);
    ctx.strokeStyle = t.a; ctx.lineWidth = 1; ctx.globalAlpha = 0.85;
    const scroll = reduced ? 0 : (time * 0.35) % 1;
    const rows = 14;
    for (let i = 0; i < rows; i++) {
      const p = (i + scroll) / rows;
      const y = Math.floor(hz + p * p * (H - hz)) + 0.5;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let i = -16; i <= 16; i++) {
      ctx.beginPath(); ctx.moveTo(vx + i * 0.6, hz); ctx.lineTo(vx + i * W * 0.14, H); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const fade = ctx.createLinearGradient(0, hz, 0, hz + (H - hz) * 0.25);
    fade.addColorStop(0, t.bg2); fade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fade; ctx.fillRect(0, hz, W, (H - hz) * 0.25);

    raf = 0;
    if (!reduced && prefs.wallpaper && !document.hidden) raf = requestAnimationFrame(frame);
  }

  resize();
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !raf) frame(performance.now()); });
  return {
    setAnimated(on) { prefs.wallpaper = on; savePrefs(); if (on && !raf) frame(performance.now()); },
  };
}
