/**
 * grid.ts — Pure grid-query helpers shared by all game systems.
 */

import { CELL, GRID_H, GRID_W } from '../constants';
import type { Dimensions, Point } from '../types';

/** Convert a world-space point to its nearest grid cell. */
export function getGridPos(p: Point, dims: Dimensions): { x: number; y: number } {
  return {
    x: Math.round((p.x / dims.fieldWidth)  * (GRID_W - 1)),
    y: Math.round((p.y / dims.fieldHeight) * (GRID_H - 1)),
  };
}

/** Convert a grid cell back to a world-space centre point. */
export function gridToWorld(
  gx: number,
  gy: number,
  dims: Dimensions,
): { x: number; y: number } {
  return {
    x: (gx / (GRID_W - 1)) * dims.fieldWidth,
    y: (gy / (GRID_H - 1)) * dims.fieldHeight,
  };
}

/** Returns true when cell (ex, ey) is an EDGE cell that directly borders EMPTY. */
function edgeBordersEmpty(grid: Uint8Array, ex: number, ey: number): boolean {
  if (ex < 0 || ex >= GRID_W || ey < 0 || ey >= GRID_H) return false;
  if (grid[ey * GRID_W + ex] !== CELL.EDGE) return false;
  if (ex > 0        && grid[ ey      * GRID_W + (ex - 1)] === CELL.EMPTY) return true;
  if (ex < GRID_W-1 && grid[ ey      * GRID_W + (ex + 1)] === CELL.EMPTY) return true;
  if (ey > 0        && grid[(ey - 1) * GRID_W +  ex     ] === CELL.EMPTY) return true;
  if (ey < GRID_H-1 && grid[(ey + 1) * GRID_W +  ex     ] === CELL.EMPTY) return true;
  return false;
}

/**
 * A cell is traversable only when it is on the active exterior perimeter.
 *
 * LINE(2): must have at least one direct 4-connected EMPTY neighbour.
 *   Interior seams (flanked on all sides by FILLED/LINE/EDGE) return false.
 *
 * EDGE(4): same 1-hop rule, PLUS a 2-hop fallback for corner cells.
 *   Grid corners sit at the junction of two walls — their direct neighbours are
 *   all other EDGE cells, never EMPTY.  The fallback accepts a corner when at
 *   least one adjacent EDGE cell itself borders EMPTY, keeping the perimeter
 *   loop connected.  Once territory is captured up to the wall, even the 2-hop
 *   check fails and the wall segment is correctly excluded.
 */
export function isWalkable(grid: Uint8Array, gx: number, gy: number): boolean {
  if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return false;
  const v = grid[gy * GRID_W + gx];
  if (v !== CELL.EDGE && v !== CELL.LINE) return false;

  // 1-hop: direct EMPTY neighbour
  if (gx > 0        && grid[ gy      * GRID_W + (gx - 1)] === CELL.EMPTY) return true;
  if (gx < GRID_W-1 && grid[ gy      * GRID_W + (gx + 1)] === CELL.EMPTY) return true;
  if (gy > 0        && grid[(gy - 1) * GRID_W +  gx     ] === CELL.EMPTY) return true;
  if (gy < GRID_H-1 && grid[(gy + 1) * GRID_W +  gx     ] === CELL.EMPTY) return true;

  // 2-hop (EDGE only): adjacent EDGE cell borders EMPTY — handles corners
  if (v === CELL.EDGE) {
    if (edgeBordersEmpty(grid, gx - 1, gy)) return true;
    if (edgeBordersEmpty(grid, gx + 1, gy)) return true;
    if (edgeBordersEmpty(grid, gx, gy - 1)) return true;
    if (edgeBordersEmpty(grid, gx, gy + 1)) return true;
  }

  return false;
}

/** Returns true when (gx, gy) is an active trail cell (NEWLINE). */
export function isTrailCell(grid: Uint8Array, gx: number, gy: number): boolean {
  if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return false;
  return grid[gy * GRID_W + gx] === CELL.NEWLINE;
}

/** Returns true when (gx, gy) is captured territory (FILLED). */
export function isFilled(grid: Uint8Array, gx: number, gy: number): boolean {
  if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return false;
  return grid[gy * GRID_W + gx] === CELL.FILLED;
}

/** Returns true when (gx, gy) is uncaptured void (EMPTY). */
export function isEmptyCell(grid: Uint8Array, gx: number, gy: number): boolean {
  if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return false;
  return grid[gy * GRID_W + gx] === CELL.EMPTY;
}
