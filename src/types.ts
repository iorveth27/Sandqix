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
