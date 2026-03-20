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

/** Player and sparks may walk on LINE(2) or EDGE(4) cells. */
export function isWalkable(grid: Uint8Array, gx: number, gy: number): boolean {
  if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return false;
  const v = grid[gy * GRID_W + gx];
  return v === CELL.LINE || v === CELL.EDGE;
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
