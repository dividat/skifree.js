import * as Vec2 from 'lib/vec2'

interface SpeedParams {
  dt: number
  acceleration: Vec2.Vec2
  speed: Vec2.Vec2
}

// new speed = dt * acceleration + speed
export function newSpeed({ dt, acceleration, speed }: SpeedParams): Vec2.Vec2 {
  return Vec2.add(Vec2.scale(dt, acceleration), speed)
}

interface PosParams {
  dt: number
  acceleration: Vec2.Vec2
  speed: Vec2.Vec2
  pos: Vec2.Vec2
}

// new pos = acceleration * dt ^ 2 / 2 + speed * dt + pos
export function newPos({ dt, acceleration, speed, pos }: PosParams): Vec2.Vec2 {
  return Vec2.add(
    Vec2.scale(Math.pow(dt, 2) / 2, acceleration),
    Vec2.scale(dt, speed),
    pos
  )
}
