export interface Vec2 {
  x: number
  y: number
}

export const zero: Vec2 = {
  x: 0,
  y: 0
}

export const right: Vec2 = {
  x: 1,
  y: 0
}

export const down: Vec2 = {
  x: 0,
  y: 1
}

export const up: Vec2 = {
  x: 0,
  y: -1
}

export function length({ x, y }: Vec2): number {
  return Math.sqrt(x * x + y * y)
}

export function scale(k: number, { x, y }: Vec2): Vec2 {
  return {
    x: k * x,
    y: k * y
  }
}

export function unit(v: Vec2): Vec2 {
  const l = length(v)
  return l === 0
    ? v
    : scale(1 / l, v)
}

export function add(...vs: Array<Vec2>): Vec2 {
  return {
    x: vs.reduce((acc, v) => acc + v.x, 0),
    y: vs.reduce((acc, v) => acc + v.y, 0)
  }
}

export function sub(v1: Vec2, v2: Vec2): Vec2 {
  return {
    x: v1.x - v2.x,
    y: v1.y - v2.y
  }
}

export function dot(...vs: Array<Vec2>): number {
  return vs.reduce((acc, v) => acc * v.x, 1) + vs.reduce((acc, v) => acc * v.y, 1)
}

export function rotate(angle: number, { x, y }: Vec2): Vec2 {
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle)
  }
}

export function applyOnLength(f: (x: number) => number, v: Vec2): Vec2 {
  return scale(f(length(v)), unit(v))
}
