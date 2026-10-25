// Tiny pixel-art icons: each is a grid of characters mapped to colors.
const PAL = {
  o: "#12082b", y: "#fbbf24", Y: "#d99a0b", w: "#f8f5ff", b: "#8b5cf6", c: "#06b6d4",
  d: "#0b0618", g: "#4ade80", p: "#ff4f9a", r: "#ff4f6d",
};

const ART = {
  folder: [
    "............",
    ".ooooo......",
    ".oyyyyoooooo",
    ".oyyyyyyyyyo",
    ".oyyyyyyyyyo",
    ".oyyyyyyyyyo",
    ".oyyyyyyyyyo",
    ".oYYYYYYYYYo",
    ".ooooooooooo",
    "............",
  ],
  doc: [
    "............",
    "..oooooooo..",
    "..owwwwwwo..",
    "..owbbbbwo..",
    "..owwwwwwo..",
    "..owbbbbwo..",
    "..owwwwwwo..",
    "..owbbwwwo..",
    "..owwwwwwo..",
    "..oooooooo..",
    "............",
  ],
  term: [
    "............",
    ".oooooooooo.",
    ".oddddddddo.",
    ".odgddddddo.",
    ".oddgdddddo.",
    ".odgddddddo.",
    ".oddddgggdo.",
    ".oddddddddo.",
    ".oooooooooo.",
    "....oooo....",
    "...oooooo...",
  ],
  face: [
    "....oooo....",
    "..oyyyyyyo..",
    ".oyyyyyyyyo.",
    ".oyyoyyoyyo.",
    ".oyyoyyoyyo.",
    ".oyyyyyyyyo.",
    ".oyoyyyyoyo.",
    ".oyyoooooyo.",
    ".oyyyyyyyyo.",
    "..oyyyyyyo..",
    "....oooo....",
  ],
  monitor: [
    "............",
    ".oooooooooo.",
    ".obbbbbbbbo.",
    ".obccccccbo.",
    ".obccccccbo.",
    ".obccccccbo.",
    ".obbbbbbbbo.",
    ".oooooooooo.",
    "....oooo....",
    "...oooooo...",
  ],
  mail: [
    "............",
    ".oooooooooo.",
    ".owwwwwwwwo.",
    ".oowwwwwwoo.",
    ".owowwwwowo.",
    ".owwoooowwo.",
    ".owwwwwwwwo.",
    ".oooooooooo.",
    "............",
  ],
  pencil: [
    "........oo..",
    ".......ooyo.",
    "......ooyyo.",
    ".....ooyyo..",
    "....ooyyo...",
    "...ooyyo....",
    "..ooyyo.....",
    ".opoyo......",
    ".oppo.......",
    ".ooo........",
    "............",
  ],
  power: [
    "....oooo....",
    "..oorrrroo..",
    ".orrr..rrro.",
    ".orr.oo.rro.",
    ".orr.oo.rro.",
    ".orr.oo.rro.",
    ".orrr..rrro.",
    "..oorrrroo..",
    "....oooo....",
  ],
};

export function icon(name) {
  const rows = ART[name];
  const w = Math.max(...rows.map((r) => r.length));
  let rects = "";
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== ".") rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${PAL[ch]}"/>`;
    });
  });
  return `<svg viewBox="0 0 ${w} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}
