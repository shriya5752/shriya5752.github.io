// Themes and saved preferences. The "auto" theme follows the sky: violet at night, bubblegum by day.
import { nightness, skyHour } from "./sky.js";

export const AUTO = "auto";
export const THEMES = {
  dream: { label: "dream", bg: "#ffc9a8", bg2: "#ffb4cb", win: "#fff8fb", win2: "#ffe3ee", ink: "#3b2f4f", dim: "#8a7a9e", a: "#f0649a", b: "#6b5bd2", onbar: "#3b2f4f", hi: "#2a1f3a", scan: ".04", vig: ".1", sun1: "#fff07a", sun2: "#ff7ab8", edge: "#3b2f4f", g1: "#ffb4cb", g2: "#ffc7ab", g3: "#f7c6c6", g4: "#c9b2f0", glass: "rgba(255,255,255,.6)", dots: "rgba(59,47,79,.2)", hshadow: "rgba(255,255,255,.55)", spark: "#14101c" },
  violet: { label: "violet", bg: "#140b2e", bg2: "#2a1054", win: "#1b1038", win2: "#261653", ink: "#ece6ff", dim: "#9d8fd0", a: "#8b5cf6", b: "#06b6d4", onbar: "#ffffff", hi: "#ffffff", scan: ".16", vig: ".5", sun1: "#ffd166", sun2: "#ff4f9a", edge: "#0d0720", g1: "#2a1054", g2: "#1f1245", g3: "#2c1560", g4: "#0f0a26", glass: "rgba(27,16,56,.72)", dots: "rgba(255,255,255,.07)", hshadow: "rgba(0,0,0,.45)", spark: "#ece6ff" },
  amber: { label: "amber crt", bg: "#140a00", bg2: "#2e1500", win: "#1c1000", win2: "#2b1a00", ink: "#ffe2b0", dim: "#b58a4c", a: "#ffb000", b: "#ff7a1a", onbar: "#1a0f00", hi: "#fff3d6", scan: ".2", vig: ".55", sun1: "#ffe27a", sun2: "#ff6a00", edge: "#0e0600", g1: "#4a2300", g2: "#2b1a00", g3: "#3d1d00", g4: "#140a00", glass: "rgba(43,26,0,.72)", dots: "rgba(255,176,0,.08)", hshadow: "rgba(0,0,0,.5)", spark: "#ffe2b0" },
  phosphor: { label: "phosphor", bg: "#00100a", bg2: "#002a1a", win: "#021510", win2: "#04241a", ink: "#c8ffd9", dim: "#5fae7f", a: "#39ff88", b: "#00d4aa", onbar: "#00140a", hi: "#ffffff", scan: ".2", vig: ".55", sun1: "#d4ff9a", sun2: "#00c26e", edge: "#000a05", g1: "#00331f", g2: "#021510", g3: "#003a24", g4: "#00100a", glass: "rgba(4,36,26,.72)", dots: "rgba(57,255,136,.08)", hshadow: "rgba(0,0,0,.5)", spark: "#c8ffd9" },
  bubblegum: { label: "bubblegum", bg: "#ffd9f0", bg2: "#c9b6ff", win: "#fff6fc", win2: "#f1dcff", ink: "#2a1650", dim: "#7a5fa8", a: "#d63aa0", b: "#3d5bff", onbar: "#ffffff", hi: "#12082b", scan: ".04", vig: ".12", sun1: "#fff07a", sun2: "#ff7ab8", edge: "#2a1650", g1: "#ffd9f0", g2: "#f6d8ff", g3: "#ffc9e6", g4: "#c9b6ff", glass: "rgba(255,255,255,.6)", dots: "rgba(42,22,80,.15)", hshadow: "rgba(255,255,255,.6)", spark: "#14101c" },
};

const KEY = "shriya.os.prefs";
export const prefs = { theme: AUTO, crt: false, trail: true, wallpaper: true };

try { Object.assign(prefs, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* storage blocked: defaults are fine */ }
if (prefs.theme !== AUTO && !THEMES[prefs.theme]) prefs.theme = AUTO;

export function savePrefs() {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

const listeners = [];
export function onTheme(fn) { listeners.push(fn); }

const resolve = (name) => (name === AUTO ? (nightness(skyHour()) > 0.5 ? "violet" : "dream") : name);

function paint(key) {
  const t = THEMES[key];
  const root = document.documentElement.style;
  for (const k of ["bg", "bg2", "win", "win2", "ink", "dim", "a", "b", "onbar", "hi", "scan", "vig", "edge", "g1", "g2", "g3", "g4", "glass", "dots", "hshadow", "spark"]) root.setProperty("--" + k, t[k]);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = t.bg;
  listeners.forEach((fn) => fn(t));
}

export function applyTheme(name) {
  if (name !== AUTO && !THEMES[name]) return false;
  prefs.theme = name;
  paint(resolve(name));
  savePrefs();
  return true;
}

// paint a theme without saving it (used by preview pages)
export function previewTheme(name) { prefs.theme = name; paint(resolve(name)); }

// re-check now and then so "auto" flips with the sky
export function refreshTheme() { if (prefs.theme === AUTO) paint(resolve(AUTO)); }
setInterval(refreshTheme, 30000);

export function applyCrt(on) {
  prefs.crt = on;
  document.body.classList.toggle("crt-on", on);
  savePrefs();
}
