export const ART_W = 20;
export const ART_H = 20;

function make(fn: (x: number, y: number) => number): number[] {
  const d: number[] = [];
  for (let y = 0; y < ART_H; y++)
    for (let x = 0; x < ART_W; x++)
      d.push(fn(x, y));
  return d;
}

// Level 1 — Banana
// Quadratic Bézier spine: P0=(8,1) → ctrl=(15,10) → P2=(3,18)
// P_y(t) = 1 + 18t − t²  →  t = 9 − √(82 − y)
// P_x(t) = 8 + 14t − 19t²
// Colors: 0=bg, 1=yellow body, 2=bright highlight, 3=orange shadow, 4=brown stem
function level1Art(): number[] {
  return make((x, y) => {
    if (y < 1 || y > 18) return 0;
    const disc = 82 - y;
    if (disc < 0) return 0;
    const t  = 9 - Math.sqrt(disc);
    if (t < 0 || t > 1.02) return 0;
    const tc = Math.max(0, Math.min(1, t));
    const cx = 8 + 14 * tc - 19 * tc * tc;
    const hw = 0.7 + 2.3 * Math.sin(tc * Math.PI);
    const dx = x - cx;
    if (dx < -hw - 0.5 || dx > hw + 0.5) return 0;
    if (tc < 0.09 || tc > 0.91) return 4; // brown stem tips
    const frac = (dx + hw) / (2 * hw); // 0 = left edge, 1 = right edge
    if (frac < 0.20) return 2; // bright highlight (left/outer edge)
    if (frac > 0.78) return 3; // orange shadow (right/inner edge)
    return 1; // yellow body
  });
}

// Level 2 — Fish
function level2Art(): number[] {
  const cx = 9.5, cy = 9.5;
  return make((x, y) => {
    const dx = x - cx, dy = y - cy;
    if ((x - 6) * (x - 6) + (y - 8) * (y - 8) < 2) return 4;
    if (x >= 6 && x <= 12 && y >= 3 && y <= 6 && dy < 0) {
      const finVal = (x - 9) * (x - 9) / 9 + (y - 4.5) * (y - 4.5) / 2.5;
      if (finVal < 1) return 1;
    }
    if (x > 14 && Math.abs(dy) < (x - 14) * 0.6) return 3;
    if ((dx / 7) * (dx / 7) + (dy / 4) * (dy / 4) < 1) return 2;
    if ((dx / 8) * (dx / 8) + (dy / 5) * (dy / 5) < 1) return 1;
    return 0;
  });
}

// Level 3 — Heart
function level3Art(): number[] {
  const cx = 9.5, cy = 8.5;
  return make((x, y) => {
    const nx = (x - cx) / 8;
    const ny = -(y - cy) / 8;
    const hv = (nx*nx + ny*ny - 1)**3 - nx*nx * ny*ny*ny;
    const nxI = nx / 0.75, nyI = ny / 0.75;
    const hvI = (nxI*nxI + nyI*nyI - 1)**3 - nxI*nxI * nyI*nyI*nyI;
    if (hvI <= 0) return 2;
    if (hv  <= 0) return 3;
    return 0;
  });
}

// Level 4 — Clover
function level4Art(): number[] {
  const cx = 9.5, cy = 9.5, r = 4.5;
  const centers: [number, number][] = [[cx-4.5,cy],[cx+4.5,cy],[cx,cy-4.5],[cx,cy+4.5]];
  return make((x, y) => {
    if (x >= 9 && x <= 10 && y >= 15 && y <= 19) return 3;
    const dx = x - cx, dy = y - cy;
    if (dx*dx + dy*dy < 4) return 4;
    let count = 0;
    for (const [ccx, ccy] of centers) {
      const ddx = x - ccx, ddy = y - ccy;
      if (ddx*ddx + ddy*ddy < r*r) count++;
    }
    if (count >= 2) return 2;
    if (count === 1) return 1;
    return 0;
  });
}

// Level 5 — Gem
function level5Art(): number[] {
  const cx = 9.5, cy = 10;
  return make((x, y) => {
    const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
    const outer = dx / 8 + dy / 9;
    const inner = dx / 5 + dy / 6;
    if (outer > 1) return 0;
    if (outer >= 0.9) return 3;
    if (inner < 1) return y < cy ? 4 : 2;
    return y < cy ? 4 : 1;
  });
}

// Level 6 — Spiral
function level6Art(): number[] {
  const cx = 9.5, cy = 9.5;
  return make((x, y) => {
    const dx = x - cx, dy = y - cy;
    const r = Math.sqrt(dx*dx + dy*dy);
    if (r < 3) return 2;
    const theta = Math.atan2(dy, dx);
    const a = 1.5, b = 0.22;
    for (let wrap = 0; wrap <= 3; wrap++) {
      const wt = theta + wrap * 2 * Math.PI;
      if (wt < -0.5) continue;
      if (Math.abs(r - a * Math.exp(b * wt)) < 1.5) return wrap === 0 ? 3 : 1;
    }
    return 0;
  });
}

// Level 7 — Flame
function level7Art(): number[] {
  const cx = 9.5;
  return make((x, y) => {
    const dx = Math.abs(x - cx);
    if (dx < (13 - y) / 4 && y > 8) return 2;
    if (dx < (16 - y) / 3.5 && y > 5) return 2;
    if (dx < (18 - y) / 2.2 && y > 2) return 1;
    if (dx < (20 - y) / 3.8 && y > 0) return 4;
    return 0;
  });
}

// Level 8 — Frog Face
function level8Art(): number[] {
  const cx = 9.5, cy = 10;
  return make((x, y) => {
    const dx = x - cx, dy = y - cy;
    const r = Math.sqrt(dx*dx + dy*dy);
    if ((x-5)*(x-5) + (y-3)*(y-3) < 2.25) return 3;
    if ((x-14)*(x-14) + (y-3)*(y-3) < 2.25) return 3;
    if ((x-5)*(x-5) + (y-3)*(y-3) < 5) return 1;
    if ((x-14)*(x-14) + (y-3)*(y-3) < 5) return 1;
    if ((x-13)*(x-13) + (y-5)*(y-5) < 3) return 2;
    if ((x-8)*(x-8) + (y-9)*(y-9) < 1) return 3;
    if ((x-11)*(x-11) + (y-9)*(y-9) < 1) return 3;
    const adx = Math.abs(dx);
    if (y >= 13 && y <= 15 && adx < 6 && y >= 13 + (adx/6)*(adx/6)*2) return 3;
    if (r < 9) return 1;
    return 0;
  });
}

// Level 9 — Flower
function level9Art(): number[] {
  const cx = 9.5, cy = 9.5;
  return make((x, y) => {
    const dx = x - cx, dy = y - cy;
    const r = Math.sqrt(dx*dx + dy*dy);
    if (r < 3) return 2;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const cos = Math.cos(a), sin = Math.sin(a);
      const pcx = cx + cos * 5, pcy = cy + sin * 5;
      const ddx = x - pcx, ddy = y - pcy;
      const lx = ddx*cos + ddy*sin, ly = -ddx*sin + ddy*cos;
      const pv = (lx/3)*(lx/3) + (ly/2)*(ly/2);
      if (pv < 0.6) return 4;
      if (pv < 0.8) return 3;
      if (pv < 1.0) return 1;
    }
    return 0;
  });
}

// Level 10 — Crescent Moon
function level10Art(): number[] {
  const cx = 9.5, cy = 9.5;
  const stars: [number, number][] = [[16,3],[3,5],[17,14],[2,15],[14,17]];
  return make((x, y) => {
    for (const [sx, sy] of stars) {
      if ((x-sx)*(x-sx) + (y-sy)*(y-sy) < 1.5) return 2;
    }
    const dx = x - cx, dy = y - cy;
    const r = Math.sqrt(dx*dx + dy*dy);
    const subDx = x - (cx - 4), subDy = y - (cy + 1);
    if (subDx*subDx + subDy*subDy < 64) return 0;
    if (r < 8) return r < 6 ? 4 : 1;
    return 0;
  });
}

export function getLevelArt(level: number): number[] {
  const idx = ((level - 1) % 10) + 1;
  switch (idx) {
    case 1:  return level1Art();
    case 2:  return level2Art();
    case 3:  return level3Art();
    case 4:  return level4Art();
    case 5:  return level5Art();
    case 6:  return level6Art();
    case 7:  return level7Art();
    case 8:  return level8Art();
    case 9:  return level9Art();
    case 10: return level10Art();
    default: return level1Art();
  }
}

// Per-level art colors: [background, body, highlight, shadow, accent]
// Each color is a sandy/warm variant suited to sand-art aesthetics.
const LEVEL_ART_COLORS: [string, string, string, string, string][] = [
  ['#c8a07a', '#e8c428', '#f5e070', '#c47810', '#4a1e04'], // 1: banana
  ['#7898b0', '#3a7ac4', '#70b0f0', '#1a4880', '#b0d8f8'], // 2: fish
  ['#b88090', '#d43a7c', '#f870b8', '#8c1a50', '#ffc0e0'], // 3: heart
  ['#809870', '#3a8c3a', '#70f070', '#1a5a1a', '#b0f0b0'], // 4: clover
  ['#8878a8', '#7c3ac4', '#b070f8', '#4a1a8c', '#d8c0f8'], // 5: gem
  ['#78a0a0', '#3ab8a8', '#70f8e8', '#18807a', '#b0f0e8'], // 6: spiral
  ['#a88870', '#c87040', '#f8a870', '#843820', '#f8e0b0'], // 7: flame
  ['#889870', '#a8c038', '#e0f870', '#688018', '#e8f8b0'], // 8: frog
  ['#a07878', '#c43a3a', '#f87070', '#881818', '#f8c0c0'], // 9: flower
  ['#686888', '#3838b8', '#7070f0', '#181878', '#c0c0f8'], // 10: moon
];

export function getLevelArtColors(level: number): [string, string, string, string, string] {
  return LEVEL_ART_COLORS[((level - 1) % 10)];
}
