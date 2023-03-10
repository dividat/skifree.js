export interface Vec2 {
  x: number
  y: number
}

export const zero: Vec2 = {
  x: 0,
  y: 0
}

export function scale(k: number, v: Vec2): Vec2 {
  return {
    x: v.x * k,
    y: v.y * k
  }
}

export function add(...vs: Array<Vec2>): Vec2 {
  return {
    x: vs.reduce((acc, v) => acc + v.x, 0),
    y: vs.reduce((acc, v) => acc + v.y, 0)
  }
}
