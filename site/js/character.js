// The desktop mascot: a chibi pixel portrait on a cloud. Follows the cursor, blinks, talks, hops.
import { chibi } from "./chibi.js";
import { reduced as isReduced } from "./motion.js";

const IDLE = [
  "hi! i'm shriya.",
  "never wish to be defined easily.",
  "psst... try the terminal.",
  "the notes are free. take them.",
  "typing something very important...",
  "do NOT type sudo in the terminal.",
  "the terminal has secrets. just saying.",
];
const OPENED = {
  blog: "ooh, my blog!",
  notes: "semester notes! you'll thank me.",
  about: "that's me. hi again.",
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

  // greet quickly, then tease the terminal's secrets a few seconds later
  setTimeout(() => speak(IDLE[0], 2600), 700);

  const SECRETS = ["matrix", "sudo", "rm"];
  const found = new Set();
  const TEASE = {
    matrix: "psst... type matrix in the terminal. trust me.",
    sudo: "whatever you do, don't type sudo in the terminal.",
    rm: "i dare you: sudo rm -rf /",
  };
  const REACT = {
    matrix: "you found it. wake up, shriya.",
    sudo: "i told you not to. (nobody was hurt)",
    rm: "...why would you do that. it's fine, it's a static site.",
    theme: "ooh, redecorating.",
    neofetch: "that's my whole system. impressive, right?",
  };
  let lastTease = -1, lastSpoke = 0, hintTimer = 0;
  const say_ = (text) => { lastSpoke = Date.now(); speak(text, 4800); };

  // the next secret she hasn't revealed yet, cycling so she never repeats herself
  function tease() {
    for (let k = 1; k <= SECRETS.length; k++) {
      const s = SECRETS[(lastTease + k) % SECRETS.length];
      if (!found.has(s)) { lastTease = SECRETS.indexOf(s); return TEASE[s]; }
    }
    return null; // they found them all
  }

  // first hint about 3 seconds after the terminal opens
  setTimeout(() => { if (document.querySelector(".term") && !found.size) { const t = tease(); if (t) say_(t); } }, 3500);

  // react ~3 seconds after the visitor runs a command
  document.addEventListener("term-command", (e) => {
    const cmd = String(e.detail || "").toLowerCase();
    if (SECRETS.includes(cmd)) found.add(cmd);
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      if (!document.querySelector(".term")) return; // terminal was closed
      if (REACT[cmd]) return say_(REACT[cmd]);
      if (Date.now() - lastSpoke < 6000) return;    // don't talk over herself
      const t = tease();
      if (t) say_(t);
    }, 3000);
  });
  return { speak };
}
