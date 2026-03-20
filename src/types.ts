export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  pos: Point;
  vel: Point;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface FloatingText {
  pos: Point;
  text: string;
  life: number;
  maxLife: number;
}

export interface Dimensions {
  width: number;
  height: number;
  fieldWidth: number;
  fieldHeight: number;
  offsetX: number;
  offsetY: number;
}

export enum Direction {
  NONE,
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

/** A spark enemy that patrols the field border (LINE/EDGE cells) */
export interface SparkState {
  pos: Point;       // world-space position (for smooth rendering)
  gx: number;       // current grid cell x
  gy: number;       // current grid cell y
  dir: Point;       // cardinal unit direction vector
  type: 'chaser' | 'random';
  /** True while traversing captured territory to reach the active border */
  migrating: boolean;
  /** Ghost target grid cell (only valid when migrating) */
  targetGX: number;
  targetGY: number;
}
