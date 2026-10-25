// The desktop mascot: a chibi pixel portrait on a cloud. Follows the cursor, blinks, talks, hops.
import { chibi } from "./chibi.js";
import { reduced as isReduced } from "./motion.js";

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
  const reduced = isReduced();
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  let timer = 0, n = 0;

  function speak(text, ms = 3600) {
    say.textContent = text;
    say.hidden = false;
    say.classList.remove("pop"); void say.offsetWidth; say.classList.add("pop");
    clearTimeout(timer);
    timer = setTimeout(() => { say.hidden = true; }, ms);
    el.classList.remove("hop"); void el.offsetWidth; el.classList.add("hop");
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
  }

  el.addEventListener("click", () => { n = (n + 1) % IDLE.length; speak(IDLE[n]); });
  el.addEventListener("dblclick", () => openApp("about"));
  document.addEventListener("app-open", (e) => { if (OPENED[e.detail]) speak(OPENED[e.detail], 2800); });

  setTimeout(() => speak(IDLE[0], 4200), reduced ? 300 : 1800);
  return { speak };
}
