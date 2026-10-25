// "Dream" desktop preview: pastel gradient, draggable tiles, dock, and the same apps/windows as the real site.
import { icon } from "./icons.js";
import { isMobile } from "./wm.js";
import { openApp } from "./apps.js";
import { startCharacter } from "./character.js";
import { previewTheme, prefs, applyCrt, savePrefs } from "./theme.js";
import { startTrail } from "./fx.js";
import { startIntro } from "./intro.js";

previewTheme("dream"); // start in the peach theme without overwriting the saved choice

const $ = (s) => document.querySelector(s);

// [app id, label, icon, tile colour]
const ITEMS = [
  ["about", "About me", "face", "#fff1a0"],
  ["blog", "Blog", "doc", "#bdb4f2"],
  ["notes", "Notes", "folder", "#b5e8d0"],
  ["terminal", "Terminal", "term", "#ffbfa6"],
  ["settings", "Settings", "monitor", "#c5b8ee"],
  ["contact", "Say hi", "mail", "#b0e8dc"],
];

const DOCK_LABEL = { about: "About", blog: "Blog", notes: "Notes", terminal: "Terminal", settings: "Settings" };
const DOCK = ["about", "blog", "notes", "terminal", "settings"].map((id) => ITEMS.find((x) => x[0] === id));

function launch(id) { openApp(id); }

// ---------- desktop tiles (drag to move, double-click to open) ----------
$("#tiles").innerHTML = ITEMS.map(([id, label, ic, c]) => `<button class="tile" data-app="${id}" style="--c:${c}"><div class="art">${icon(ic)}</div><span>${label}</span></button>`).join("");

document.querySelectorAll(".tile").forEach((t) => {
  let dx = 0, dy = 0;
  t.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    document.querySelectorAll(".tile.sel").forEach((x) => x.classList.remove("sel"));
    t.classList.add("sel");
    const sx = e.clientX, sy = e.clientY, ox = dx, oy = dy;
    let moved = 0;
    t.setPointerCapture(e.pointerId);
    const move = (ev) => {
      moved = Math.max(moved, Math.hypot(ev.clientX - sx, ev.clientY - sy));
      if (moved > 5) { t.classList.add("drag"); dx = ox + ev.clientX - sx; dy = oy + ev.clientY - sy; t.style.transform = `translate(${dx}px,${dy}px)`; t.style.zIndex = 5; }
    };
    const up = () => {
      t.removeEventListener("pointermove", move); t.removeEventListener("pointerup", up); t.removeEventListener("pointercancel", up);
      t.classList.remove("drag");
      if (moved <= 5 && (e.pointerType === "touch" || isMobile())) launch(t.dataset.app); // a single tap opens on touch
    };
    t.addEventListener("pointermove", move); t.addEventListener("pointerup", up); t.addEventListener("pointercancel", up);
  });
  t.addEventListener("dblclick", () => launch(t.dataset.app));
  t.addEventListener("keydown", (e) => { if (e.key === "Enter") launch(t.dataset.app); });
});
$("#desktop").addEventListener("pointerdown", (e) => { if (!e.target.closest(".tile")) document.querySelectorAll(".tile.sel").forEach((x) => x.classList.remove("sel")); });

// ---------- top nav + dock ----------
$("#navlinks").innerHTML = ["about", "blog", "notes"].map((id) => `<button data-app="${id}">${id}</button>`).join("");
$("#navlinks").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) launch(b.dataset.app); });

$("#dock").innerHTML = DOCK.map(([id, label, ic, c]) => `<button data-app="${id}" style="--c:${c}" title="${label}"><div class="art">${icon(ic)}</div>${DOCK_LABEL[id]}</button>`).join("");
$("#dock").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.app) launch(b.dataset.app);
});

// ---------- leave a trace: its own corner card with a live preview of the visitor's doodle ----------
const card = $("#traceCard");
$("#tPen").innerHTML = icon("pencil");
function paintPreview() {
  const cv = card.querySelector("canvas"), ctx = cv.getContext("2d");
  ctx.clearRect(0, 0, cv.width, cv.height);
  let saved = "";
  try { saved = localStorage.getItem("shriya.os.trace") || ""; } catch { /* storage blocked */ }
  if (saved) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, cv.width, cv.height);
    img.src = saved;
  } else { // a little invitation until they draw something
    ctx.strokeStyle = "#f0649a"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.setLineDash([2, 9]);
    ctx.beginPath(); ctx.moveTo(30, 82); ctx.bezierCurveTo(60, 20, 90, 110, 120, 52); ctx.bezierCurveTo(140, 22, 170, 40, 190, 70); ctx.stroke();
  }
}
paintPreview();
card.addEventListener("click", () => openApp("trace"));
document.addEventListener("trace-saved", paintPreview);

// effects from the settings window
applyCrt(prefs.crt);
startTrail();
const still = (on) => document.body.classList.toggle("still", !on);
still(prefs.wallpaper);
document.addEventListener("wallpaper", (e) => { prefs.wallpaper = e.detail; savePrefs(); still(e.detail); });

// the mascot starts talking once the doors have opened
startIntro().then(() => startCharacter(openApp));
