import { GRID_W, GRID_H } from './constants';
import type { Dimensions, Particle, FloatingText, Point } from './types';

export interface RenderState {
  grid: Uint8Array;
  historyStack: Path2D[];
  trailParticles: Particle[];
  trail: Point[];
  invalidLoop: Point[];
  isTrailing: boolean;
  isOnSafe: boolean;
  spiderPos: Point;
  particles: Particle[];
  floatingTexts: FloatingText[];
  captureFlash: number;
  damageFlash: number;
  qixPos: Point;
  sparks: Point[];
  sparksEnabled: boolean;
  bossEnabled: boolean;
  fuseProgress: number; // 0 = none, 0–1 = how far along trail fuse has burned
  animationTime: number;
  bucketAngle: number;
  captureWaveMask: Uint8Array | null;
  captureWaveProgress: number;
}

function hashFloat(a: number, b: number): number {
  let h = (a * 374761393 + b * 1103515245) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}

const patCanvas = document.createElement('canvas');
patCanvas.width = 32; patCanvas.height = 32;
const patCtx = patCanvas.getContext('2d')!;
patCtx.fillStyle = '#C89040';
patCtx.fillRect(0, 0, 32, 32);
for (let gy = 0; gy < 32; gy++) {
  for (let gx = 0; gx < 32; gx++) {
    const v = hashFloat(gx * 31 + 7, gy * 17 + 3);
    if (v < 0.3) {
      patCtx.fillStyle = `rgba(0,0,0,${(0.05 + v * 0.35).toFixed(2)})`;
      patCtx.fillRect(gx, gy, 1, 1);
    } else if (v > 0.75) {
      patCtx.fillStyle = `rgba(255,220,120,${((v - 0.75) * 0.7).toFixed(2)})`;
      patCtx.fillRect(gx, gy, 1, 1);
    }
  }
}
let sandPattern: CanvasPattern | null = null;

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  dims: Dimensions,
  state: RenderState,
) {
  const {
    grid, historyStack, trailParticles, trail, invalidLoop, isTrailing, isOnSafe, spiderPos,
    particles, floatingTexts, captureFlash, damageFlash,
    qixPos, sparks, sparksEnabled, bossEnabled, fuseProgress, animationTime,
    bucketAngle, captureWaveMask, captureWaveProgress,
  } = state;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Black void field background
  ctx.fillStyle = '#000000';
  ctx.fillRect(dims.offsetX, dims.offsetY, dims.fieldWidth, dims.fieldHeight);

  // Damage flash / screen shake
  if (damageFlash > 0) {
    const shakeX = (Math.random() - 0.5) * 10;
    const shakeY = (Math.random() - 0.5) * 10;
    ctx.translate(shakeX, shakeY);
    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 0, ${damageFlash * 0.3})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // Wooden borders
  const borderThickness = 12;
  ctx.save();
  ctx.fillStyle = '#4a3728';
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.fillRect(dims.offsetX - borderThickness, dims.offsetY - borderThickness, dims.fieldWidth + borderThickness * 2, borderThickness);
  ctx.fillRect(dims.offsetX - borderThickness, dims.offsetY + dims.fieldHeight, dims.fieldWidth + borderThickness * 2, borderThickness);
  ctx.fillRect(dims.offsetX - borderThickness, dims.offsetY, borderThickness, dims.fieldHeight);
  ctx.fillRect(dims.offsetX + dims.fieldWidth, dims.offsetY, borderThickness, dims.fieldHeight);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(dims.offsetX, dims.offsetY - borderThickness + 3 + i * 3);
    ctx.lineTo(dims.offsetX + dims.fieldWidth, dims.offsetY - borderThickness + 3 + i * 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dims.offsetX, dims.offsetY + dims.fieldHeight + 3 + i * 3);
    ctx.lineTo(dims.offsetX + dims.fieldWidth, dims.offsetY + dims.fieldHeight + 3 + i * 3);
    ctx.stroke();
  }
  ctx.restore();

  // Sand territory — captured cells rendered with textured sand blocks
  const cellW = dims.fieldWidth / (GRID_W - 1);
  const cellH = dims.fieldHeight / (GRID_H - 1);
  if (!sandPattern) sandPattern = ctx.createPattern(patCanvas, 'repeat')!;
  
  ctx.save();
  ctx.fillStyle = sandPattern;
  historyStack.forEach((path, i) => {
    ctx.save();
    ctx.translate(dims.offsetX, dims.offsetY);
    if (i === historyStack.length - 1 && captureWaveProgress < 1) {
      // Animated pour for the latest capture
      ctx.clip(path);
      const maxRadius = Math.max(dims.fieldWidth, dims.fieldHeight) * 1.5;
      const currentRadius = maxRadius * captureWaveProgress;
      ctx.beginPath();
      ctx.arc(spiderPos.x, spiderPos.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fill(path);
    }
    ctx.restore();
  });
  ctx.restore();

  // Legacy seams — historical borders now inside captured territory, drawn as faint lines
  ctx.save();
  ctx.strokeStyle = 'rgba(180, 120, 40, 0.55)';
  ctx.lineWidth = 3.75;
  ctx.shadowBlur = 4;
  ctx.shadowColor = 'rgba(200, 140, 60, 0.4)';
  historyStack.forEach(path => {
    ctx.save();
    ctx.translate(dims.offsetX, dims.offsetY);
    ctx.stroke(path);
    ctx.restore();
  });
  ctx.restore();

  // Territory border lines — draw a bright edge wherever captured meets uncaptured
  ctx.save();
  ctx.strokeStyle = 'rgba(245, 190, 80, 0.9)';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 6;
  ctx.shadowColor = 'rgba(245, 160, 50, 0.7)';
  ctx.beginPath();
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (grid[y * GRID_W + x] !== 1) continue;
      const rx = dims.offsetX + x * cellW;
      const ry = dims.offsetY + y * cellH;
      // Right edge: neighbor to the right is uncaptured
      if (x + 1 < GRID_W && grid[y * GRID_W + (x + 1)] !== 1) {
        ctx.moveTo(rx + cellW, ry);
        ctx.lineTo(rx + cellW, ry + cellH);
      }
      // Bottom edge: neighbor below is uncaptured
      if (y + 1 < GRID_H && grid[(y + 1) * GRID_W + x] !== 1) {
        ctx.moveTo(rx, ry + cellH);
        ctx.lineTo(rx + cellW, ry + cellH);
      }
      // Left edge: neighbor to the left is uncaptured
      if (x - 1 >= 0 && grid[y * GRID_W + (x - 1)] !== 1) {
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx, ry + cellH);
      }
      // Top edge: neighbor above is uncaptured
      if (y - 1 >= 0 && grid[(y - 1) * GRID_W + x] !== 1) {
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + cellW, ry);
      }
    }
  }
  ctx.stroke();
  ctx.restore();

  // Current trail — sandy grain dots
  if (isTrailing && trail.length > 1 && trailParticles.length > 0) {
    ctx.save();
    trailParticles.forEach(p => {
      const px = dims.offsetX + p.pos.x;
      const py = dims.offsetY + p.pos.y;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Fuse: burning dot running from trail start toward player
    if (fuseProgress > 0 && trail.length > 1) {
      const fuseIdx = Math.min(
        Math.floor(fuseProgress * (trail.length - 1)),
        trail.length - 1,
      );
      const fp = trail[fuseIdx];
      const fx = dims.offsetX + fp.x;
      const fy = dims.offsetY + fp.y;
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff4500';
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(fx, fy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff4500';
      ctx.beginPath();
      ctx.arc(fx, fy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Invalid loop (self-intersection highlight)
  if (invalidLoop.length > 1) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.9)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 0, 0, 0.7)';
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(dims.offsetX + invalidLoop[0].x, dims.offsetY + invalidLoop[0].y);
    for (let i = 1; i < invalidLoop.length; i++) {
      ctx.lineTo(dims.offsetX + invalidLoop[i].x, dims.offsetY + invalidLoop[i].y);
    }
    ctx.lineTo(dims.offsetX + invalidLoop[0].x, dims.offsetY + invalidLoop[0].y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Qix
  if (bossEnabled) { const qx = dims.offsetX + qixPos.x;
  const qy = dims.offsetY + qixPos.y;
  const t = animationTime / 1000;
  ctx.save();
  ctx.shadowBlur = 25;
  ctx.shadowColor = 'rgba(255, 0, 255, 0.9)';
  const qixColors = ['#ff00ff', '#ff4400', '#ffff00', '#00ffff', '#ff00aa', '#aa00ff'];
  for (let i = 0; i < 6; i++) {
    const angle = t * 1.8 + (i * Math.PI / 3);
    const len = 18 + Math.sin(t * 2.5 + i * 1.3) * 7;
    ctx.strokeStyle = qixColors[i];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(qx, qy);
    ctx.lineTo(qx + Math.cos(angle) * len, qy + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();
  } // end bossEnabled

  if (damageFlash > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Success flash
  if (captureFlash > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(200, 140, 50, ${captureFlash * 0.4})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // Particles
  particles.forEach(p => {
    const px = dims.offsetX + p.pos.x;
    const py = dims.offsetY + p.pos.y;
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Floating texts
  floatingTexts.forEach(ft => {
    const tx = dims.offsetX + ft.pos.x;
    const ty = dims.offsetY + ft.pos.y;
    ctx.save();
    ctx.globalAlpha = ft.life / ft.maxLife;
    ctx.fillStyle = '#F5C86E';
    ctx.font = 'bold 20px Inter';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fillText(ft.text, tx, ty);
    ctx.restore();
  });

  // Sparks
  if (sparksEnabled) for (let si = 0; si < sparks.length; si++) {
    const sp = sparks[si];
    const sx = dims.offsetX + sp.x;
    const sy = dims.offsetY + sp.y;
    const phase = animationTime / 80 + si * Math.PI;
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#ffdd00';
    // Outer glow ring
    ctx.strokeStyle = `rgba(255, 220, 0, ${0.6 + 0.4 * Math.sin(phase)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 7 + Math.sin(phase * 1.3) * 2, 0, Math.PI * 2);
    ctx.stroke();
    // Core
    ctx.fillStyle = '#fff8c0';
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
    // Electric crackle lines
    ctx.strokeStyle = '#ffdd00';
    ctx.lineWidth = 1;
    for (let j = 0; j < 4; j++) {
      const angle = phase + j * (Math.PI / 2);
      const r1 = 5, r2 = 9 + Math.sin(phase * 2 + j) * 3;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(angle) * r1, sy + Math.sin(angle) * r1);
      ctx.lineTo(sx + Math.cos(angle) * r2, sy + Math.sin(angle) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Bucket (player) — top-down view, rotated toward movement direction
  const drawX = dims.offsetX + spiderPos.x;
  const drawY = dims.offsetY + spiderPos.y;

  // Safe-zone amber ring (drawn before rotation transform)
  if (isOnSafe) {
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#F5B840';
    ctx.strokeStyle = 'rgba(245,184,64,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(drawX, drawY, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(drawX, drawY);
  ctx.rotate(bucketAngle);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(2, 2, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bucket rim/body
  ctx.fillStyle = '#7C4A1E';
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sand inside
  ctx.fillStyle = '#E8A840';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sand highlights
  ctx.fillStyle = 'rgba(255,230,140,0.55)';
  ctx.beginPath(); ctx.arc(-3, -2, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,210,100,0.4)';
  ctx.beginPath(); ctx.arc(2, 1, 1.5, 0, Math.PI * 2); ctx.fill();

  // Handle arc at leading edge
  ctx.strokeStyle = '#4A2A0E';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, -1, 9, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();

  ctx.restore();
}
