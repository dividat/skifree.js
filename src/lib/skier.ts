import * as Physics from 'lib/physics'
import * as Vec2 from 'lib/vec2'
import * as Senso from 'senso'
import * as Canvas from 'canvas'
import { Sprite } from 'lib/sprite'
import { config } from 'config'

// Facing: Left - South - East
export const downDirection: number = Math.PI / 2
const rightMostDirection: number = Math.PI
const leftMostDirection: number = 0
const directionAmplitude: number = Math.PI

interface Jump {
  spriteId: number,
  time: number,
  y: number,
}

export class Skier extends Sprite {

  downhillPixelsTravelled: number
  collisions: Array<number>
  jumps: Array<Jump>
  lastEatenTime: number | undefined
  direction: number
  speed: Vec2.Vec2
  remainingDt: number
  elapsedTime: number

  // debug
  confidenceBoost: number

  constructor(mainCanvas: any, data: any) {
    super(data)

    this.downhillPixelsTravelled = 0
    this.collisions = []
    this.jumps = []
    this.direction = leftMostDirection
    this.speed = Vec2.zero
    this.remainingDt = 0
    this.elapsedTime = 0
    this.confidenceBoost = 0
  }

  getDiscreteDirection(): string {
    if (this.direction < downDirection - directionAmplitude * 0.40) {
      return 'east'
    } else if (this.direction < downDirection - directionAmplitude * 0.25) {
      return 'esEast'
    } else if (this.direction < downDirection - directionAmplitude * 0.08) {
      return 'sEast'
    } else if (this.direction <= downDirection + directionAmplitude * 0.08) {
      return 'south'
    } else if (this.direction <= downDirection + directionAmplitude * 0.25) {
      return 'sWest'
    } else if (this.direction <= downDirection + directionAmplitude * 0.40) {
      return 'wsWest'
    } else {
      return 'west'
    }
  }

  skierDirectionMultiplier(): number {
    const d = this.getDiscreteDirection()
    if (d === 'south') {
      return 0
    } else if (d === 'sWest' || d === 'sEast') {
      return 0.4
    } else if (d === 'esWest' || d === 'wsEast') {
      return 0.8
    } else {
      return 1
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
    const y1 = this.pos[1]
    super.cycle(dt)
    const y2 = this.pos[1]
    this.downhillPixelsTravelled += y2 - y1
  }

  move(dt: number) {
    const pos = {
      x: this.pos[0],
      y: this.pos[1]
    }

    let acceleration
    if (this.isLying() || this.isBeingEaten() || this.isJumping()) {
      acceleration = Vec2.zero
    } else {

      const dirVect =
        this.getDiscreteDirection() === 'south'
          ? { x: 0, y: 1 } // Force going straight to the bottom if sprite is “south”
          : {
            x: Math.cos(this.direction),
            y: Math.sin(this.direction)
          }

      this.confidenceBoost = this.computeConfidenceBoost()
      const diagonalFactor = Canvas.diagonal / 3000
      const directionAcc = Vec2.scale(
        this.confidenceBoost * diagonalFactor * Vec2.dot(dirVect, Vec2.down),
        dirVect)

      const perdendicularSpeed = Vec2.rotate(Math.PI / 2, this.speed)
      const skierOrientationFactor = this.skierDirectionMultiplier()
      const stopAcc = Vec2.scale(
        -1 * skierOrientationFactor * Math.abs(Vec2.dot(perdendicularSpeed, dirVect)),
        this.speed)

      const frictionAcc = Vec2.scale(-1, this.speed)

      const inertia = Senso.hasBeenSeen()
        ? config.skier.inertia.senso
        : config.skier.inertia.keyboard

      acceleration = Vec2.scale(
        0.01 / inertia,
        Vec2.add(directionAcc, stopAcc, frictionAcc))
    }

    const res = Physics.moveWithChunks({
      dt: dt + this.remainingDt,
      acceleration,
      speed: this.speed,
      pos
    })

    this.speed = res.speed
    this.setMapPosition(res.pos.x, res.pos.y)
    this.remainingDt = res.remainingDt
    this.elapsedTime += dt
  }

  computeConfidenceBoost() {
    // Default as if some distance and some time would have happened
    // Otherwire, it can accelerate too quickly.
    const diagonalFactor = 2000 / Canvas.diagonal
    const initDownhillDistance = this.downhillPixelsTravelled * diagonalFactor
    const initElapsedTime = this.elapsedTime + 15000

    const crashesBoost = this.collisions
      .map(t => 20 * Math.pow(this.elapsedTime - t, -0.5))
      .reduce((a, b) => a + b, 0)

    const jumpBoost = this.jumps
      .map(jump => 5 * Math.pow(this.elapsedTime - jump.time, -0.5))
      .reduce((a, b) => a + b, 0)

    let confidenceBoost = Math.max(100 * (initDownhillDistance + 1000) / (initElapsedTime + 10000), 1)
    confidenceBoost = 0.10 * Math.pow(confidenceBoost, 0.6) / (1 + crashesBoost - jumpBoost)

    return confidenceBoost
  }

  draw(center: [ number, number ], spriteFrame: string, zoom: number) {
    // Part of monster sprite while being eaten, also don’t show when blinking
    if (!this.isBeingEaten() && !this.isBlinking()) {
      const spritePartToUse =
        this.isJumping()
          ? 'jumping'
          : (this.isLying() ? 'hit' : this.getDiscreteDirection())

      super.draw(center, spritePartToUse, zoom)
    }
  }

  isLying() {
    const lastCollision = this.lastCollision()
    return lastCollision !== undefined && this.elapsedTime - lastCollision < config.skier.lyingDurationAfterCrash
  }

  isJumping() {
    const lastJump = this.lastJump()
    return lastJump !== undefined && this.pos[1] - lastJump.y < config.skier.jump.height(Canvas.height)
  }

  isBeingEaten() {
    return this.lastEatenTime !== undefined && this.elapsedTime - this.lastEatenTime < config.monster.eatingDuration
  }

  isBlinking() {
    const invincibilityProgress = this.invincibilityProgress()
    if (invincibilityProgress === 0 || invincibilityProgress === undefined) {
      return false
    } else if (invincibilityProgress < 0.6) {
      return Math.floor(this.elapsedTime / 100) % 2 === 0
    } else {
      return Math.floor(this.elapsedTime / 50) % 2 === 0
    }
  }

  hasHitObstacle(obs: Sprite) {
    if (this.isHittable()) {
      this.speed = Vec2.zero
      this.collisions.push(this.elapsedTime)

      // @ts-ignore
      window.PlayEGI.motor('negative')
    }
  }

  hasHitJump(jump: Sprite) {
    if (!this.isJumping()) {
      this.speed = Vec2.scale(config.skier.jump.speed(Canvas.diagonal), Vec2.down),
      this.jumps.push({ time: this.elapsedTime, spriteId: jump.id, y: jump.pos[1] })

      // @ts-ignore
      window.PlayEGI.motor('positive')
    }
  }

  isHittable(): boolean {
    return !this.isJumping() && this.invincibilityProgress() === undefined
  }

  // After being hit, the skier is invincible.
  // - undefined: the skier is not invincible
  // - 0: the skier is lying or being eaten
  // - number: the skier is invincible with this progress ratio
  invincibilityProgress(): number | undefined {
    const lastJump = this.lastJump()
    const getProgress = (eventTime: number, eventDuration: number) => {
      const jumpAfterEvent = lastJump !== undefined && lastJump.time > eventTime
      if (!jumpAfterEvent) {
        const now = this.elapsedTime
        const start = eventTime + eventDuration
        const end = start + config.skier.invincibilityDuration
        if (now < start) {
          return 0
        } else if (now >= start && now < end) {
          return (now - start) / (end - start)
        }
      }
    }

    const lastCollision = this.lastCollision()
    const collisionProgress = lastCollision === undefined
      ? undefined
      : getProgress(lastCollision, config.skier.lyingDurationAfterCrash)
    const eatingProgress = this.lastEatenTime === undefined
      ? undefined
      : getProgress(this.lastEatenTime, config.monster.eatingDuration)

    return collisionProgress !== undefined
      ? collisionProgress
      : eatingProgress
  }

  isEaten() {
    this.lastEatenTime = this.elapsedTime
    this.speed = Vec2.zero
  }

  lastCollision(): number | undefined {
    if (this.collisions) {
      return this.collisions[this.collisions.length - 1]
    }
  }

  lastJump(): Jump | undefined {
    if (this.jumps) {
      return this.jumps[this.jumps.length - 1]
    }
  }

  downhillMetersTravelled(): number {
    return this.downhillPixelsTravelled / config.pixelsPerMeter(Canvas.diagonal)
  }
}
