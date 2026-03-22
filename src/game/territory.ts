/**
 * territory.ts — fillCapturedArea: outer-border flood fill.
 *
 * Algorithm:
 *  1. Bresenham-stamp any trail gaps as NEWLINE.
 *  2. BFS to enumerate all connected EMPTY components.
 *  3. The largest component is the "outside" open field; all others are enclosed → FILLED.
 *  4. NEWLINE → LINE.
 *  5. Rescue trapped QIX; set up ghost traversal for isolated sparks.
 */

import { CELL, GRID_H, GRID_W } from '../constants';
import { type Dimensions } from '../types';
import { getGridPos, gridToWorld, isWalkable } from './grid';
import type { GameState } from './GameState';

const DIRS4 = [[-1,0],[1,0],[0,-1],[0,1]] as [number,number][];

export function fillCapturedArea(state: GameState, dims: Dimensions): number {
  const { grid, trail, particles, floatingTexts } = state;

  // ── 1. Bresenham-stamp trail gaps as NEWLINE ─────────────────────────────
  for (let ti = 1; ti < trail.length; ti++) {
    const p0 = getGridPos(trail[ti - 1], dims);
    const p1 = getGridPos(trail[ti],     dims);
    let x = p0.x, y = p0.y;
    const dx = Math.abs(p1.x - p0.x), sx = p0.x < p1.x ? 1 : -1;
    const dy = -Math.abs(p1.y - p0.y), sy = p0.y < p1.y ? 1 : -1;
    let err = dx + dy;
    while (true) {
      if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) {
        if (grid[y * GRID_W + x] === CELL.EMPTY) grid[y * GRID_W + x] = CELL.NEWLINE;
      }
      if (x === p1.x && y === p1.y) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      else          { err += dx; y += sy; }
    }
  }

  // ── 2. Find all connected EMPTY components ───────────────────────────────
  // After stamping NEWLINE, the open field may be split into multiple regions.
  // The largest is always the "outside" (main open field); everything smaller
  // is enclosed by the trail and should be captured. This approach is
  // direction-agnostic and handles all corner shapes correctly.
  const compId = new Int32Array(GRID_W * GRID_H).fill(-1);
  const components: number[][] = [];

  for (let start = 0; start < GRID_W * GRID_H; start++) {
    if (grid[start] !== CELL.EMPTY || compId[start] >= 0) continue;
    const cid = components.length;
    const comp: number[] = [];
    const q = [start];
    compId[start] = cid;
    while (q.length > 0) {
      const idx = q.shift()!;
      comp.push(idx);
      const qx = idx % GRID_W, qy = (idx / GRID_W) | 0;
      for (const [ddx, ddy] of DIRS4) {
        const nx = qx + ddx, ny = qy + ddy;
        if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
        const ni = ny * GRID_W + nx;
        if (grid[ni] !== CELL.EMPTY || compId[ni] >= 0) continue;
        compId[ni] = cid;
        q.push(ni);
      }
    }
    components.push(comp);
  }

  // ── 3. Identify the "outside" component via border-adjacency ──────────────
  // The outside is the EMPTY component touching the inner perimeter (cells at
  // row 1 / row GRID_H-2 / col 1 / col GRID_W-2). These cells are provably
  // not enclosed because the EDGE border surrounds the entire field and the
  // trail can only enclose interior regions. Using border-adjacency instead of
  // "largest component" fixes cases where the player encloses a region larger
  // than the remaining open field on their first move.
  const bailOut = () => {
    for (let i = 0; i < GRID_W * GRID_H; i++) {
      if (grid[i] === CELL.NEWLINE) grid[i] = CELL.EMPTY;
    }
    state.trail          = [];
    state.invalidLoop    = [];
    state.playerOnBorder = true;
    state.playerDrawing  = false;
    state.fuseTimer      = 0;
    state.trailParticles = [];
  };

  if (components.length <= 1) { bailOut(); return 0; }

  let outsideCid = -1;
  // Top inner row
  for (let x = 1; x < GRID_W - 1 && outsideCid < 0; x++) {
    const idx = GRID_W + x;
    if (compId[idx] >= 0) outsideCid = compId[idx];
  }
  // Bottom inner row
  for (let x = 1; x < GRID_W - 1 && outsideCid < 0; x++) {
    const idx = (GRID_H - 2) * GRID_W + x;
    if (compId[idx] >= 0) outsideCid = compId[idx];
  }
  // Left inner column
  for (let y = 1; y < GRID_H - 1 && outsideCid < 0; y++) {
    const idx = y * GRID_W + 1;
    if (compId[idx] >= 0) outsideCid = compId[idx];
  }
  // Right inner column
  for (let y = 1; y < GRID_H - 1 && outsideCid < 0; y++) {
    const idx = y * GRID_W + (GRID_W - 2);
    if (compId[idx] >= 0) outsideCid = compId[idx];
  }

  // Couldn't identify outside — trail didn't actually enclose anything
  if (outsideCid < 0) { bailOut(); return 0; }

  const toFill: number[] = [];
  for (let i = 0; i < components.length; i++) {
    if (i !== outsideCid) toFill.push(...components[i]);
  }

  // ── 5. Apply fill ─────────────────────────────────────────────────────────
  for (const idx of toFill) {
    grid[idx] = CELL.FILLED;
  }

  // ── 6. Convert NEWLINE → LINE ────────────────────────────────────────────
  for (let i = 0; i < GRID_W * GRID_H; i++) {
    if (grid[i] === CELL.NEWLINE) grid[i] = CELL.LINE;
  }

  // ── 7. Ghost-edge traversal: sparks isolated by the new capture ──────────
  const playerGP = getGridPos(state.spiderPos, dims);
  for (const spark of state.sparks) {
    if (spark.migrating) continue; // already in ghost mode
    if (isWalkable(grid, spark.gx, spark.gy)) continue; // still on active border — fine
    // Spark is stranded: BFS through non-EMPTY cells to find all reachable walkable
    // cells, then send it to the one farthest from the player (avoids instant death).
    const bv  = new Uint8Array(GRID_W * GRID_H);
    const bq: [number, number][] = [[spark.gx, spark.gy]];
    bv[spark.gy * GRID_W + spark.gx] = 1;
    let bestGX = -1, bestGY = -1, bestDist = -1;
    while (bq.length > 0) {
      const [bx, by] = bq.shift()!;
      for (const [ddx, ddy] of DIRS4) {
        const nx = bx + ddx, ny = by + ddy;
        if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
        if (bv[ny * GRID_W + nx]) continue;
        bv[ny * GRID_W + nx] = 1;
        if (isWalkable(grid, nx, ny)) {
          const d = Math.abs(nx - playerGP.x) + Math.abs(ny - playerGP.y);
          if (d > bestDist) { bestDist = d; bestGX = nx; bestGY = ny; }
        }
        if (grid[ny * GRID_W + nx] !== CELL.EMPTY) bq.push([nx, ny]);
      }
    }
    if (bestGX >= 0) {
      spark.migrating = true;
      spark.targetGX  = bestGX;
      spark.targetGY  = bestGY;
    }
  }

  // ── 8. Handle QIX entities trapped in non-EMPTY territory ────────────────
  for (const entity of state.qixEntities) {
    const qixGP = getGridPos(entity.pos, dims);
    if (!isEmptyCell(grid, qixGP.x, qixGP.y)) {
      const qbfs = new Uint8Array(GRID_W * GRID_H);
      const qqueue: [number, number][] = [[qixGP.x, qixGP.y]];
      qbfs[qixGP.y * GRID_W + qixGP.x] = 1;
      let rescued = false;
      while (qqueue.length > 0 && !rescued) {
        const [qx, qy] = qqueue.shift()!;
        for (const [ddx, ddy] of DIRS4) {
          const nx = qx + ddx, ny = qy + ddy;
          if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
          if (qbfs[ny * GRID_W + nx]) continue;
          qbfs[ny * GRID_W + nx] = 1;
          if (isEmptyCell(grid, nx, ny)) {
            entity.pos     = gridToWorld(nx, ny, dims);
            entity.lastPos = { ...entity.pos };
            rescued = true;
            break;
          }
          qqueue.push([nx, ny]);
        }
      }
    }
  }

  // ── 9. Count captured cells, emit effects, reset drawing state ───────────
  let filledCount = 0;
  for (let i = 0; i < GRID_W * GRID_H; i++) {
    if (grid[i] === CELL.FILLED || grid[i] === CELL.LINE) filledCount++;
  }
  const newPercent       = Math.floor((filledCount / (GRID_W * GRID_H)) * 100);
  const capturedThisTime = newPercent - state.capturedPercent;

  if (capturedThisTime > 0) {
    state.captureFlash        = 0.6;
    state.captureWaveProgress = 0;

    trail.forEach((p, idx) => {
      if (idx % 2 === 0) {
        for (let i = 0; i < 2; i++) {
          const rc = Math.random();
          particles.push({
            pos:  { ...p },
            vel:  { x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 120 },
            color: rc > 0.6 ? '#E8A840' : rc > 0.3 ? '#C87A30' : '#F5D080',
            life: 0.4 + Math.random() * 0.6,
            maxLife: 1,
            size: 1.5 + Math.random() * 3,
          });
        }
      }
    });

    // Score floating text is pushed by App.tsx (which knows the exponential formula)
  }

  state.capturedPercent = newPercent;
  if (capturedThisTime > 0) state.gridVersion++;
  state.trail           = [];
  state.invalidLoop     = [];
  state.playerOnBorder  = true;
  state.playerDrawing   = false;
  state.fuseTimer       = 0;
  state.trailParticles  = [];

  return capturedThisTime;
}
