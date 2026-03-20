/**
 * qix.ts — QIX erratic Verlet-based wandering movement.
 *
 * Replaces simple axis-bounce with a wander angle that's perturbed each frame
 * via Verlet integration, giving the classic erratic QIX movement.
 * Bounces off field edges and captured territory (non-EMPTY cells).
 */

import { QIX_RADIUS, QIX_WANDER_JITTER, SPIDER_RADIUS } from '../constants';
import type { Dimensions } from '../types';
import { getGridPos, isEmptyCell, isTrailCell } from './grid';
import type { GameState } from './GameState';

export function tickQix(
  state: GameState,
  dt: number,
  dims: Dimensions,
  onDeath: () => void,
): void {
  const QIX_SPEED = dims.fieldWidth * 0.25;

  // ── Wander angle perturbation ────────────────────────────────────────────
  state.qixAngle += (Math.random() * 2 - 1) * QIX_WANDER_JITTER;

  // ── Verlet: derive velocity from position history ────────────────────────
  let velX = state.qixPos.x - state.qixLastPos.x;
  let velY = state.qixPos.y - state.qixLastPos.y;

  // Blend wander direction into velocity
  const wanderBlend = 0.15;
  velX += Math.cos(state.qixAngle) * wanderBlend;
  velY += Math.sin(state.qixAngle) * wanderBlend;

  // Normalize to constant speed
  const spd = Math.hypot(velX, velY);
  if (spd > 0) {
    const step = QIX_SPEED * dt;
    velX = (velX / spd) * step;
    velY = (velY / spd) * step;
  }

  let nextX = state.qixPos.x + velX;
  let nextY = state.qixPos.y + velY;

  // ── Bounce off field edges and non-EMPTY territory ───────────────────────
  const gpX = getGridPos({ x: nextX, y: state.qixPos.y }, dims);
  const gpY = getGridPos({ x: state.qixPos.x, y: nextY }, dims);

  const hitX = nextX < 0 || nextX > dims.fieldWidth  || !isEmptyCell(state.grid, gpX.x, gpX.y);
  const hitY = nextY < 0 || nextY > dims.fieldHeight || !isEmptyCell(state.grid, gpY.x, gpY.y);

  if (hitX) {
    velX = -velX;
    nextX = state.qixPos.x + velX;
    state.qixAngle = Math.PI - state.qixAngle;
  }
  if (hitY) {
    velY = -velY;
    nextY = state.qixPos.y + velY;
    state.qixAngle = -state.qixAngle;
  }

  // Corner correction: if still stuck, reverse completely
  const finalGP = getGridPos({ x: nextX, y: nextY }, dims);
  if (!isEmptyCell(state.grid, finalGP.x, finalGP.y)) {
    velX = -velX;
    velY = -velY;
    nextX = state.qixPos.x + velX;
    nextY = state.qixPos.y + velY;
    state.qixAngle += Math.PI;
  }

  // Clamp to field bounds
  nextX = Math.max(0, Math.min(dims.fieldWidth,  nextX));
  nextY = Math.max(0, Math.min(dims.fieldHeight, nextY));

  // ── Update Verlet history ────────────────────────────────────────────────
  state.qixLastPos = { ...state.qixPos };
  state.qixPos     = { x: nextX, y: nextY };
  // Keep qixVel in sync for any legacy reads
  state.qixVel     = { x: velX, y: velY };

  // ── Collision detection ──────────────────────────────────────────────────
  if (state.playerDrawing) {
    // Sample 8 points around QIX at QIX_RADIUS to detect NEWLINE trail cells
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const checkPos = {
        x: state.qixPos.x + Math.cos(angle) * QIX_RADIUS,
        y: state.qixPos.y + Math.sin(angle) * QIX_RADIUS,
      };
      const gp = getGridPos(checkPos, dims);
      if (isTrailCell(state.grid, gp.x, gp.y)) {
        onDeath();
        return;
      }
    }

    // Direct spider collision
    if (Math.hypot(state.spiderPos.x - state.qixPos.x, state.spiderPos.y - state.qixPos.y) < QIX_RADIUS + SPIDER_RADIUS) {
      onDeath();
    }
  }
}
