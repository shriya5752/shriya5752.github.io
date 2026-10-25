// Minimal window manager: drag, resize, minimize, maximize, focus, taskbar buttons.
const layer = document.getElementById("windows");
const tasks = document.getElementById("tasks");
const wins = new Map();
let zTop = 10;
let cascade = 0;

export const isMobile = () => matchMedia("(max-width: 720px)").matches;

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

export function getWindow(id) { return wins.get(id); }

export function openWindow(id, def) {
  const existing = wins.get(id);
  if (existing) {
    if (existing.el.classList.contains("is-min")) restore(existing);
    focus(existing);
    return existing;
  }

  const area = layer.getBoundingClientRect();
  const w = Math.min(def.w || 640, area.width - 20);
  const h = Math.min(def.h || 440, area.height - 20);
  const off = (cascade++ % 6) * 28;
  const left = clamp((area.width - w) / 2 + off - 70, 8, Math.max(8, area.width - w - 8));
  const top = clamp((area.height - h) / 2 + off - 60, 8, Math.max(8, area.height - h - 8));

  const el = document.createElement("section");
  el.className = "win";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", def.title);
  el.style.cssText = `left:${left}px;top:${top}px;width:${w}px;height:${h}px`;
  el.innerHTML = `
    <header class="bar">
      <span class="ico">${def.icon}</span><span class="ttl"></span>
      <div class="ctl">
        <button class="min" aria-label="Minimize">_</button>
        <button class="max" aria-label="Maximize">&#9633;</button>
        <button class="cls" aria-label="Close">&times;</button>
      </div>
    </header>
    <div class="body"></div>
    <i class="grip"></i>`;
  el.querySelector(".ttl").textContent = def.title;
  layer.appendChild(el);

  const btn = document.createElement("button");
  btn.className = "task";
  btn.setAttribute("role", "tab");
  btn.innerHTML = `${def.icon}<span></span>`;
  btn.querySelector("span").textContent = def.title;
  tasks.appendChild(btn);

  const win = { id, el, body: el.querySelector(".body"), btn, def, prev: null, api: null };
  wins.set(id, win);

  el.addEventListener("pointerdown", () => focus(win), true);
  el.querySelector(".min").onclick = () => minimize(win);
  el.querySelector(".max").onclick = () => toggleMax(win);
  el.querySelector(".cls").onclick = () => closeWindow(id);
  el.querySelector(".bar").addEventListener("dblclick", (e) => {
    if (!e.target.closest(".ctl")) toggleMax(win);
  });
  btn.onclick = () => {
    if (el.classList.contains("is-min")) { restore(win); focus(win); }
    else if (el.classList.contains("active")) minimize(win);
    else focus(win);
  };

  enableDrag(win);
  enableResize(win);
  win.api = def.render(win.body, win) || null;
  focus(win);
  return win;
}

export function focus(win) {
  if (!win) return;
  wins.forEach((w) => {
    const on = w === win;
    w.el.classList.toggle("active", on);
    w.btn.classList.toggle("active", on);
    w.btn.setAttribute("aria-selected", on);
  });
  win.el.style.zIndex = ++zTop;
}

function minimize(win) {
  win.el.classList.add("is-min");
  win.el.classList.remove("active");
  win.btn.classList.remove("active");
  const next = [...wins.values()]
    .filter((w) => w !== win && !w.el.classList.contains("is-min"))
    .sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
  if (next) focus(next);
}

function restore(win) { win.el.classList.remove("is-min"); }

function toggleMax(win) { win.el.classList.toggle("max"); }

export function closeWindow(id) {
  const win = wins.get(id);
  if (!win) return;
  wins.delete(id);
  win.el.classList.add("closing");
  win.btn.remove();
  if (win.def.onClose) win.def.onClose();
  setTimeout(() => win.el.remove(), 160);
  const next = [...wins.values()]
    .filter((w) => !w.el.classList.contains("is-min"))
    .sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
  if (next) focus(next);
}

function enableDrag(win) {
  const bar = win.el.querySelector(".bar");
  bar.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".ctl") || isMobile() || win.el.classList.contains("max") || e.button > 0) return;
    const area = layer.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const ox = win.el.offsetLeft, oy = win.el.offsetTop;
    try { bar.setPointerCapture(e.pointerId); } catch { /* pointer already gone: dragging still works */ }
    const move = (ev) => {
      win.el.style.left = clamp(ox + ev.clientX - sx, 120 - win.el.offsetWidth, area.width - 120) + "px";
      win.el.style.top = clamp(oy + ev.clientY - sy, 0, area.height - 34) + "px";
    };
    const up = () => { bar.removeEventListener("pointermove", move); bar.removeEventListener("pointerup", up); bar.removeEventListener("pointercancel", up); };
    bar.addEventListener("pointermove", move);
    bar.addEventListener("pointerup", up);
    bar.addEventListener("pointercancel", up);
  });
}

function enableResize(win) {
  const grip = win.el.querySelector(".grip");
  grip.addEventListener("pointerdown", (e) => {
    if (isMobile() || e.button > 0) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, ow = win.el.offsetWidth, oh = win.el.offsetHeight;
    try { grip.setPointerCapture(e.pointerId); } catch { /* pointer already gone: dragging still works */ }
    const move = (ev) => {
      win.el.style.width = Math.max(280, ow + ev.clientX - sx) + "px";
      win.el.style.height = Math.max(180, oh + ev.clientY - sy) + "px";
    };
    const up = () => { grip.removeEventListener("pointermove", move); grip.removeEventListener("pointerup", up); grip.removeEventListener("pointercancel", up); };
    grip.addEventListener("pointermove", move);
    grip.addEventListener("pointerup", up);
    grip.addEventListener("pointercancel", up);
  });
}
