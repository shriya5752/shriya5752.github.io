// Chibi pixel portrait: big head, sitting on a cloud, hugging a laptop, legs swinging.
const K = {
  hair: "#2a1a22", hairHi: "#4d3644", skin: "#ecb995", skinSh: "#d29b78", blush: "#f29a8f", white: "#ffffff",
  eye: "#2b1712", eyeLo: "#7a4a38", lips: "#c25868", lipHi: "#e08a92",
  frame: "#1a1030", lens: "#322a66", glint: "#a8a8dc",
  tank: "#211d2c", tankHi: "#3f3950",
  denim: "#7fa6d2", denimLt: "#abc8e9", denimDk: "#4f739e", shoe: "#fbf7f1", sole: "#c5bfd2",
  lap: "#8cc4ea", lapLt: "#c3e5f8", lapDk: "#5d97c2", sticker: "#ff7aa8",
  cloud: "#fbf7ff", cloudSh: "#d8cff0",
};

const r = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;

export function chibi() {
  const cloud = r(5, 39, 26, 5, K.cloud) + r(8, 36, 7, 4, K.cloud) + r(21, 35, 8, 5, K.cloud) + r(3, 41, 30, 2, K.cloud) + r(5, 43, 26, 1, K.cloudSh) + r(12, 37, 3, 1, K.cloudSh);

  const tails = {
    l: r(4, 17, 5, 11, K.hair) + r(5, 19, 1, 5, K.hairHi),
    r: r(27, 17, 5, 11, K.hair) + r(30, 19, 1, 5, K.hairHi),
  };
  const hairBack = r(7, 5, 22, 19, K.hair) + r(6, 8, 24, 15, K.hair);

  const thighs = r(10, 36, 16, 6, K.denim) + r(10, 36, 16, 1, K.denimLt);
  const leg = (x) => r(x, 41, 5, 3, K.denim) + r(x, 44, 5, 2, K.denimLt) + r(x - 1, 46, 6, 3, K.shoe) + r(x - 1, 48, 6, 1, K.sole) + r(x, 47, 1, 1, "#ff7aa8");

  const tank = r(11, 26, 14, 5, K.tank) + r(15, 26, 6, 1, K.skinSh) + r(12, 27, 1, 3, K.tankHi) + r(23, 27, 1, 3, K.tankHi) + r(16, 25, 4, 1, K.skinSh);
  const arms = r(8, 27, 3, 7, K.skin) + r(25, 27, 3, 7, K.skin) + r(8, 27, 1, 7, K.skinSh) + r(27, 27, 1, 7, K.skinSh);

  const laptop = r(10, 30, 16, 9, K.lap) + r(10, 30, 16, 1, K.lapLt) + r(10, 38, 16, 1, K.lapDk) + r(10, 30, 1, 9, K.lapLt) + r(25, 30, 1, 9, K.lapDk)
    + r(15, 33, 2, 1, K.sticker) + r(19, 33, 2, 1, K.sticker) + r(15, 34, 6, 1, K.sticker) + r(16, 35, 4, 1, K.sticker) + r(17, 36, 2, 1, K.sticker);
  const hands = { l: r(9, 36, 3, 2, K.skin), r: r(24, 36, 3, 2, K.skin) };

  // head
  const face = r(9, 10, 18, 13, K.skin) + r(8, 12, 20, 9, K.skin) + r(10, 23, 16, 1, K.skin) + r(12, 24, 12, 1, K.skin);
  const eyes = r(11, 15, 4, 5, K.eye) + r(21, 15, 4, 5, K.eye) + r(12, 18, 2, 2, K.eyeLo) + r(22, 18, 2, 2, K.eyeLo) + r(10, 14, 5, 1, K.eye) + r(21, 14, 5, 1, K.eye) + r(10, 15, 1, 1, K.eye) + r(25, 15, 1, 1, K.eye);
  const pupils = `<g class="pupils">${r(12, 16, 1, 1, K.white)}${r(22, 16, 1, 1, K.white)}${r(13, 18, 1, 1, K.white)}${r(23, 18, 1, 1, K.white)}</g>`;
  const lids = `<g class="lids" style="opacity:0">${r(10, 14, 6, 6, K.skin)}${r(20, 14, 6, 6, K.skin)}${r(11, 18, 4, 1, K.eye)}${r(21, 18, 4, 1, K.eye)}</g>`;
  const brows = r(11, 12, 4, 1, K.hair) + r(21, 12, 4, 1, K.hair);
  const blush = r(9, 20, 3, 1, K.blush) + r(24, 20, 3, 1, K.blush);
  const mouth = r(15, 20, 1, 1, K.lips) + r(16, 21, 4, 1, K.lips) + r(20, 20, 1, 1, K.lips) + r(17, 22, 2, 1, K.lipHi);
  const fringe = r(8, 6, 20, 4, K.hair) + r(8, 10, 5, 3, K.hair) + r(23, 10, 5, 3, K.hair) + r(8, 13, 2, 3, K.hair) + r(26, 13, 2, 3, K.hair) + r(10, 7, 5, 1, K.hairHi);
  const shades = r(9, 2, 8, 3, K.frame) + r(19, 2, 8, 3, K.frame) + r(17, 2, 2, 1, K.frame) + r(8, 2, 1, 1, K.frame) + r(27, 2, 1, 1, K.frame)
    + r(10, 3, 6, 1, K.lens) + r(20, 3, 6, 1, K.lens) + r(10, 3, 1, 1, K.glint) + r(20, 3, 1, 1, K.glint);

  return `<svg class="chibi" viewBox="0 0 36 50" shape-rendering="crispEdges" role="img" aria-label="pixel portrait of shriya sitting on a cloud with a laptop">
    <g class="fig">
      <g class="cloud">${cloud}</g>
      <g class="tailL">${tails.l}</g><g class="tailR">${tails.r}</g>
      <g class="hairBack">${hairBack}</g>
      <g class="legL">${leg(12)}</g><g class="legR">${leg(19)}</g>
      ${thighs}
      ${arms}${tank}
      ${laptop}
      <g class="handL">${hands.l}</g><g class="handR">${hands.r}</g>
      <g class="headg">${face}${eyes}${pupils}${lids}${brows}${blush}${mouth}${fringe}${shades}</g>
    </g>
  </svg>`;
}
