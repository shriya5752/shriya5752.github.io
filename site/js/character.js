// Pixel-art "me": follows the cursor with head and eyes, blinks, and talks.
const C = {
  hair: "#1c1219", hairHi: "#3d2b38", skin: "#e0ab84", skinSh: "#c68d66", blush: "#ea8f84", lips: "#b4505a", lipHi: "#d1737a",
  white: "#f7f2ec", pupil: "#2a1410", frame: "#12082b", lens: "#2a2358", glint: "#8a8ab8", gold: "#fbbf24",
  tank: "#1d1a26", tankHi: "#3a3548", belt: "#25252e", buckle: "#c9cdd6",
  denim: "#7ea4cf", denimLt: "#a6c3e4", denimDk: "#4f739e", denimSh: "#3c5a82", shoe: "#f7f2ec", sole: "#b9b4c4", heart: "#d93a4f",
};

const rect = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;

function art() {
  // shoulder-length hair behind the neck and shoulders
  const hairBack = rect(6, 18, 18, 8, C.hair) + rect(5, 21, 20, 6, C.hair);

  // baggy jeans: hips, two wide legs with a gap, rolled cuffs, sneakers
  let jeans = rect(8, 39, 15, 6, C.denim) + rect(8, 45, 7, 10, C.denim) + rect(16, 45, 7, 10, C.denim);
  jeans += rect(15, 39, 1, 6, C.denimDk) + rect(9, 40, 2, 4, C.denimLt) + rect(19, 40, 2, 4, C.denimLt);
  jeans += rect(8, 45, 1, 10, C.denimDk) + rect(22, 45, 1, 10, C.denimDk) + rect(12, 46, 1, 6, C.denimLt) + rect(19, 46, 1, 6, C.denimLt);
  jeans += rect(8, 52, 7, 3, C.denimLt) + rect(16, 52, 7, 3, C.denimLt) + rect(8, 52, 7, 1, C.denimDk) + rect(16, 52, 7, 1, C.denimDk);
  jeans += rect(7, 55, 8, 3, C.shoe) + rect(16, 55, 8, 3, C.shoe) + rect(7, 57, 8, 1, C.sole) + rect(16, 57, 8, 1, C.sole)
    + rect(10, 56, 1, 1, C.heart) + rect(19, 56, 1, 1, C.heart);
  const belt = rect(8, 37, 15, 2, C.belt) + rect(14, 37, 3, 2, C.buckle) + rect(15, 38, 1, 1, C.belt);

  // black tank top with a scooped neckline
  const tank = rect(8, 29, 14, 9, C.tank) + rect(9, 27, 3, 3, C.tank) + rect(19, 27, 3, 3, C.tank) + rect(12, 29, 7, 1, C.tank)
    + rect(10, 31, 1, 6, C.tankHi) + rect(20, 31, 1, 6, C.tankHi) + rect(8, 36, 14, 1, C.tankHi);
  const skinChest = rect(12, 27, 7, 2, C.skinSh) + rect(13, 29, 5, 1, C.skinSh);
  const necklace = rect(12, 28, 1, 1, C.gold) + rect(13, 29, 1, 1, C.gold) + rect(14, 30, 3, 1, C.gold) + rect(17, 29, 1, 1, C.gold) + rect(18, 28, 1, 1, C.gold);

  // bare arms; the right one also has a waving pose
  const armL = rect(5, 27, 3, 16, C.skin) + rect(5, 28, 1, 15, C.skinSh) + rect(5, 43, 3, 3, C.skin);
  const armR = rect(22, 27, 3, 16, C.skin) + rect(24, 28, 1, 15, C.skinSh) + rect(22, 43, 3, 3, C.skin);
  const armUp = rect(23, 20, 3, 10, C.skin) + rect(25, 20, 1, 10, C.skinSh) + rect(23, 16, 3, 4, C.skin);

  // head (moves with the cursor)
  const hairCap = rect(7, 4, 16, 3, C.hair) + rect(6, 6, 18, 3, C.hair) + rect(6, 9, 3, 18, C.hair) + rect(21, 9, 3, 18, C.hair) + rect(9, 5, 4, 1, C.hairHi);
  const face = rect(8, 9, 14, 12, C.skin) + rect(9, 21, 12, 2, C.skin) + rect(11, 23, 8, 1, C.skin) + rect(13, 24, 4, 3, C.skinSh);
  const fringe = rect(8, 6, 14, 3, C.hair) + rect(8, 9, 4, 1, C.hair) + rect(18, 9, 4, 1, C.hair) + rect(8, 10, 2, 1, C.hair) + rect(20, 10, 2, 1, C.hair) + rect(14, 7, 2, 2, C.hair);
  const eyes = rect(10, 15, 4, 3, C.white) + rect(17, 15, 4, 3, C.white) + rect(10, 15, 4, 1, "#e6ded6") + rect(17, 15, 4, 1, "#e6ded6");
  const pupils = `<g class="pupils">${rect(11, 15, 2, 3, C.pupil)}${rect(18, 15, 2, 3, C.pupil)}${rect(11, 15, 1, 1, "#fff")}${rect(18, 15, 1, 1, "#fff")}</g>`;
  const lids = `<g class="lids" style="opacity:0">${rect(10, 15, 4, 3, C.skin)}${rect(17, 15, 4, 3, C.skin)}${rect(10, 17, 4, 1, C.pupil)}${rect(17, 17, 4, 1, C.pupil)}</g>`;
  const brows = rect(10, 13, 4, 1, C.hair) + rect(17, 13, 4, 1, C.hair);
  const nose = rect(14, 19, 2, 1, C.skinSh);
  const blush = rect(9, 19, 2, 1, C.blush) + rect(20, 19, 2, 1, C.blush);
  const smile = rect(12, 20, 1, 1, C.lips) + rect(13, 21, 4, 1, C.lips) + rect(17, 20, 1, 1, C.lips) + rect(14, 22, 2, 1, C.lipHi);
  const shades = rect(8, 2, 6, 3, C.frame) + rect(16, 2, 6, 3, C.frame) + rect(14, 2, 2, 1, C.frame) + rect(7, 2, 1, 1, C.frame) + rect(22, 2, 1, 1, C.frame)
    + rect(9, 3, 4, 1, C.lens) + rect(17, 3, 4, 1, C.lens) + rect(9, 3, 1, 1, C.glint) + rect(17, 3, 1, 1, C.glint);

  // hair ends resting on the shoulders (in front)
  const strands = "";

  return `<svg viewBox="0 0 30 58" shape-rendering="crispEdges" role="img" aria-label="pixel portrait of shriya">
    <g class="back">${hairBack}</g>
    <g class="legs">${jeans}</g>
    <g class="dress">${tank}${skinChest}${necklace}${belt}</g>
    <g class="arm-l">${armL}</g>
    <g class="arm-r">${armR}</g>
    <g class="arm-up">${armUp}</g>
    <g class="headg">${hairCap}${face}${eyes}${pupils}${lids}${brows}${nose}${blush}${smile}${fringe}${shades}</g>
    <g class="strands">${strands}</g>
  </svg>`;
}

const IDLE = [
  "hi! i'm shriya.",
  "never wish to be defined easily.",
  "psst... try the terminal.",
  "the notes are free. take them.",
  "organized chaos, documented.",
  "click me again, i dare you.",
];
const OPENED = {
  blog: "ooh, my writing!",
  notes: "semester notes! you'll thank me.",
  about: "that's me. hi again.",
  terminal: "a person of culture, i see.",
  settings: "go on, redecorate.",
};

export function startCharacter(openApp) {
  const desktop = document.getElementById("desktop");
  const el = document.createElement("div");
  el.className = "me";
  el.innerHTML = `<div class="say" hidden></div>${art()}`;
  desktop.insertBefore(el, document.getElementById("windows"));

  const say = el.querySelector(".say");
  const head = el.querySelector(".headg");
  const pupils = el.querySelector(".pupils");
  const lids = el.querySelector(".lids");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timer = 0, n = 0, busy = false;

  function speak(text, ms = 3600) {
    say.textContent = text;
    say.hidden = false;
    say.classList.remove("pop"); void say.offsetWidth; say.classList.add("pop");
    el.classList.add("waving");
    setTimeout(() => el.classList.remove("waving"), 1400);
    clearTimeout(timer);
    timer = setTimeout(() => { say.hidden = true; }, ms);
  }

  addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 360));
    const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.4)) / 300));
    head.setAttribute("transform", `translate(${Math.round(dx)} ${dy > 0.6 ? 1 : 0})`);
    pupils.setAttribute("transform", `translate(${Math.round(dx * 1.2)} ${Math.round(dy * 0.6)})`);
  }, { passive: true });

  if (!reduced) {
    (function blink() {
      setTimeout(() => {
        lids.style.opacity = 1;
        setTimeout(() => { lids.style.opacity = 0; blink(); }, 140);
      }, 2200 + Math.random() * 3000);
    })();
  }

  el.addEventListener("click", () => { n = (n + 1) % IDLE.length; speak(IDLE[n]); });
  el.addEventListener("dblclick", () => openApp("about"));
  document.addEventListener("app-open", (e) => { if (OPENED[e.detail]) speak(OPENED[e.detail], 2800); });

  // say hello shortly after the desktop appears
  setTimeout(() => { if (!busy) speak(IDLE[0], 4200); }, reduced ? 300 : 1800);
  return { speak };
}
