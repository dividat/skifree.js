import * as Vec2 from 'lib/vec2'

interface ChunkedSpeedParams {
  dt: number
  acceleration: Vec2.Vec2
  speed: Vec2.Vec2
  pos: Vec2.Vec2
}

interface ChunkedSpeedResult {
  remainingDt: number
  speed: Vec2.Vec2
  pos: Vec2.Vec2
}

// Maximum FPS are 60, we have dt = 16 ms. Using chunks of 0.5 ms, the
// imprecision is at most 0.25 ms, which is 1.6 %. But remaining dt will kept
// to be used in the next iteration.
const unitDt = 0.5

// Compute new speed using chunks to prevent having a speed boost if dt is very
// big, after a GC operation for example.
export function moveWithChunks({ dt, acceleration, speed, pos }: ChunkedSpeedParams): ChunkedSpeedResult {

  // Number of steps using unitDt to approach dt
  const steps = Math.floor((dt) / unitDt)

  for (let i = 0; i < steps; i++) {
    speed = newSpeed({ dt: unitDt, acceleration, speed })
    pos = newPos({
      dt: unitDt,
      acceleration,
      speed,
      pos
    })
  }

  return {
    remainingDt: dt - steps * unitDt,
    speed,
    pos
  }
}

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
