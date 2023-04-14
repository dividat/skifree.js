import { Sprite } from 'lib/sprite'
import { Monster, eatingDuration } from 'lib/monster'
import * as Physics from 'lib/physics'
import * as Vec2 from 'lib/vec2'
import { config } from 'config'

const maxSpeed: number = 1
const crashDuration: number = 800 // ms
const invincibleDuration: number = 2000 // ms
const jumpDuration: number = 1200 // ms

// Facing: Left - South - East
export const downDirection: number = Math.PI / 2
const rightMostDirection: number = Math.PI
const leftMostDirection: number = 0
const directionAmplitude: number = Math.PI

export class Skier extends Sprite {

  obstaclesHit: Array<any>
  pixelsTravelled: number
  isJumping: boolean
  jumps: number
  collisions: number
  lastCollisionTime: number | undefined
  lastEatenTime: number | undefined
  lastJump: number | undefined
  direction: number
  speed: Vec2.Vec2

  constructor(mainCanvas: any, data: any) {
    super(data)

    this.obstaclesHit = []
    this.pixelsTravelled = 0
    this.isJumping = false
    this.jumps = 0
    this.collisions = 0
    this.lastCollisionTime = undefined
    this.lastJump = undefined
    this.direction = leftMostDirection
    this.speed = Vec2.zero
  }

  getDiscreteDirection() {
    if (this.direction < downDirection - directionAmplitude * 0.40) {
      return 'east'
    } else if (this.direction < downDirection - directionAmplitude * 0.30) {
      return 'esEast'
    } else if (this.direction < downDirection - directionAmplitude * 0.10) {
      return 'sEast'
    } else if (this.direction <= downDirection + directionAmplitude * 0.10) {
      return 'south'
    } else if (this.direction <= downDirection + directionAmplitude * 0.30) {
      return 'sWest'
    } else if (this.direction <= downDirection + directionAmplitude * 0.40) {
      return 'wsWest'
    } else {
      return 'west'
    }
  }

  turnLeft() {
    this.direction = Math.max(this.direction - directionAmplitude / 6, leftMostDirection)
  }

  turnRight() {
    this.direction = Math.min(this.direction + directionAmplitude / 6, rightMostDirection)
  }

  setDirection(direction: number) {
    this.direction = direction
  }

  cycle(dt: number) {
    const [x1, y1] = [this.mapPosition[0], this.mapPosition[1]]
    super.cycle(dt)
    const [x2, y2] = [this.mapPosition[0], this.mapPosition[1]]
    this.pixelsTravelled += Vec2.length({ x: Math.abs(x2 - x1), y: Math.abs(y2 - y1) })
  }

  move(dt: number) {
    const { acceleration, speed } = this.getAccelerationAndSpeed(dt)
    this.speed = speed
    super.move(dt, acceleration, speed)
  }

  getAccelerationAndSpeed(dt: number) {
    let acceleration

    const dirVect = {
      x: Math.cos(this.direction),
      y: Math.sin(this.direction)
    }
    const downVect = { x: 0, y: 1 }

    if (this.isLying() || this.isBeingEaten()) {
      acceleration = Vec2.zero
    } else if (this.isJumping) {

      const directionAcc = Vec2.scale(15 * Vec2.dot(dirVect, downVect), dirVect)
      const frictionAcc = Vec2.scale(-10, this.speed)

      acceleration = Vec2.scale(
        0.00001 * dt,
        Vec2.add(frictionAcc, directionAcc))
    } else {
      const perdendicularSpeed = Vec2.rotate(Math.PI / 2, this.speed)

      const stopAcc = Vec2.scale(
        -50 * Math.abs(Vec2.dot(perdendicularSpeed, dirVect)),
        this.speed)

      const frictionAcc = Vec2.scale(-10, this.speed)
      const directionAcc = Vec2.scale(10 * Vec2.dot(dirVect, downVect), dirVect)

      acceleration = Vec2.scale(
        0.00001 * dt,
        Vec2.add(stopAcc, frictionAcc, directionAcc))
    }

    const speed = Physics.newSpeed({
      dt,
      acceleration,
      speed: this.speed
    })

    if (speed.y <= 0) {
      speed.y = 0
      acceleration.y = 0
      speed.x = 0
    }

    if (this.isJumping) {
      speed.x = 0
      speed.y = Math.max(0.5, speed.y)
    }

    return { acceleration, speed }
  }

  draw(dContext: any) {
    // Part of monster sprite while being eaten, also don’t show when blinking
    if (!this.isBeingEaten() && !this.isBlinking()) {
      const spritePartToUse =
        this.isJumping
          ? 'jumping'
          : (this.isLying() ? 'hit' : this.getDiscreteDirection())

      super.draw(dContext, spritePartToUse)
    }
  }

  isLying() {
    return this.lastCollisionTime !== undefined && Date.now() - this.lastCollisionTime < crashDuration
  }

  isBeingEaten() {
    return this.lastEatenTime !== undefined && Date.now() - this.lastEatenTime < eatingDuration
  }

  isBlinking() {
    const invincibleProgress = this.invincibleProgress()
    if (invincibleProgress === undefined) {
      return false
    } else if (invincibleProgress < 0.6) {
      return Math.floor(Date.now() / 100) % 2 === 0
    } else {
      return Math.floor(Date.now() / 50) % 2 === 0
    }
  }

  hits({ sprite, useHitBox }: { sprite: Sprite, useHitBox: boolean }): boolean {
    if (this.obstaclesHit.indexOf(sprite.id) !== -1) {
      return false
    } else if (super.hits({ sprite, useHitBox })) {
      return true
    } else {
      return false
    }
  }

  getSpeedRatio() {
    return this.speed.y / maxSpeed
  }

  hasHitObstacle(obs: Sprite) {
    if (!this.isJumping && this.invincibleProgress() === undefined) {
      this.collisions++
      this.lastCollisionTime = Date.now()
      this.speed = Vec2.zero
      this.obstaclesHit.push(obs.id)

      // @ts-ignore
      window.PlayEGI.motor('negative')
    }
  }

  hasHitSnow(obs: Sprite) {
    if (!this.isJumping && this.invincibleProgress() === undefined) {
      this.obstaclesHit.push(obs.id)
      this.speed = Vec2.scale(0.5, this.speed)
    }
  }

  invincibleProgress(): number | undefined {
    const getProgress = (eventTime: number | undefined, eventDuration: number) => {
      if (eventTime !== undefined) {
        const jumpAfterEvent = this.lastJump !== undefined && this.lastJump > eventTime
        if (!jumpAfterEvent) {
          const now = Date.now()
          const start = eventTime + eventDuration
          const end = start + invincibleDuration
          if (now >= start && now < end) {
            return (now - start) / (end - start)
          }
        }
      }
    }

    return getProgress(this.lastCollisionTime, crashDuration) || getProgress(this.lastEatenTime, eatingDuration)
  }

  hasHitJump() {
    if (!this.isJumping) {
      this.jumps++
      this.isJumping = true
      this.lastJump = Date.now()

      setTimeout(() => this.isJumping = false, jumpDuration)

      // @ts-ignore
      window.PlayEGI.motor('positive')
    }
  }

  isEatenBy(monster: Monster, whenEaten: () => void) {
    this.lastEatenTime = Date.now()
    this.speed = Vec2.zero
    this.obstaclesHit.push(monster.id)
    monster.startEating(whenEaten)

    // @ts-ignore
    window.PlayEGI.motor('negative')
  }
}
