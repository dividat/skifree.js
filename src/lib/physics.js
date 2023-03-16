import * as Vec2 from 'lib/vec2'

// new speed = dt * acceleration + speed
export function newSpeed({ dt, acceleration, speed }) {
  return Vec2.add(Vec2.scale(dt, acceleration), speed)
}


// new pos = acceleration * dt ^ 2 / 2 + speed * dt + pos
export function newPos({ dt, acceleration, speed, pos }) {
  return Vec2.add(
    Vec2.scale(Math.pow(dt, 2) / 2, acceleration),
    Vec2.scale(dt, speed),
    pos
  )
}
