import * as Vec2 from 'lib/vec2'

// new speed = dt * acc + speed
export function newSpeed({ dt, acc, speed }) {
  return Vec2.add(Vec2.scale(dt, acc), speed)
}


// new pos = acc * dt ^ 2 / 2 + speed * dt + pos
export function newPos({ dt, acc, speed, pos }) {
  return Vec2.add(
    Vec2.scale(Math.pow(dt, 2) / 2, acc),
    Vec2.scale(dt, speed),
    pos
  )
}
