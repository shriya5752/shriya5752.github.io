// The desktop mascot: a chibi pixel portrait on a cloud. Follows the cursor, blinks, talks, hops.
import { chibi } from "./chibi.js";

const IDLE = [
  "hi! i'm shriya.",
  "overthinking, but make it cute.",
  "never wish to be defined easily.",
  "psst... try the terminal.",
  "the notes are free. take them.",
  "typing something very important...",
];
const OPENED = {
  blog: "ooh, my blog!",
  notes: "semester notes! you'll thank me.",
  about: "that's me. hi again.",
  terminal: "a person of culture, i see.",
  settings: "go on, redecorate.",
};
const HEART = `<svg viewBox="0 0 7 6" shape-rendering="crispEdges"><path fill="#ff5c8a" d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z"/></svg>`;

export function startCharacter(openApp) {
  const desktop = document.getElementById("desktop");
  const el = document.createElement("div");
  el.className = "me";
  el.innerHTML = `<div class="say" hidden></div>${chibi()}`;
  desktop.insertBefore(el, document.getElementById("windows"));

  const say = el.querySelector(".say");
  const head = el.querySelector(".headg");
  const pupils = el.querySelector(".pupils");
  const lids = el.querySelector(".lids");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  let timer = 0, n = 0;

  function hearts(count) {
    if (reduced) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const m = document.createElement("div");
        m.className = "mote";
        m.innerHTML = HEART;
        m.style.left = r.left + r.width * (0.3 + Math.random() * 0.4) + "px";
        m.style.top = r.top + r.height * 0.15 + "px";
        m.style.setProperty("--dx", Math.round(Math.random() * 40 - 20) + "px");
        document.body.appendChild(m);
        setTimeout(() => m.remove(), 2500);
      }, i * 120);
    }
  }

  function speak(text, ms = 3600, withHearts = true) {
    say.textContent = text;
    say.hidden = false;
    say.classList.remove("pop"); void say.offsetWidth; say.classList.add("pop");
    clearTimeout(timer);
    timer = setTimeout(() => { say.hidden = true; }, ms);
    el.classList.remove("hop"); void el.offsetWidth; el.classList.add("hop");
    if (withHearts) hearts(3);
  }

  addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const dx = clamp((e.clientX - (r.left + r.width / 2)) / 360, -1, 1);
    const dy = clamp((e.clientY - (r.top + r.height * 0.3)) / 300, -1, 1);
    head.setAttribute("transform", `translate(${Math.round(dx)} ${dy > 0.7 ? 1 : 0})`);
    pupils.setAttribute("transform", `translate(${Math.round(dx)} ${Math.round(dy)})`);
  }, { passive: true });

  if (!reduced) {
    (function blink() {
      setTimeout(() => {
        lids.style.opacity = 1;
        setTimeout(() => { lids.style.opacity = 0; blink(); }, 130);
      }, 2200 + Math.random() * 2800);
    })();
    setInterval(() => hearts(1), 9000);
  }

  el.addEventListener("click", () => { n = (n + 1) % IDLE.length; speak(IDLE[n]); });
  el.addEventListener("dblclick", () => openApp("about"));
  document.addEventListener("app-open", (e) => { if (OPENED[e.detail]) speak(OPENED[e.detail], 2800, false); });

  setTimeout(() => speak(IDLE[0], 4200), reduced ? 300 : 1800);
  return { speak };
}
