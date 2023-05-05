import * as Physics from 'lib/physics'
import * as Vec2 from 'lib/vec2'
import * as Senso from 'senso'
import { Sprite } from 'lib/sprite'
import { config } from 'config'

// Facing: Left - South - East
export const downDirection: number = Math.PI / 2
const rightMostDirection: number = Math.PI
const leftMostDirection: number = 0
const directionAmplitude: number = Math.PI

export class Skier extends Sprite {

  pixelsTravelled: number
  collisions: Array<number>
  jumps: Array<number>
  lastEatenTime: number | undefined
  direction: number
  speed: Vec2.Vec2
  remainingDt: number
  elapsedTime: number

  // debug
  confidenceBoost: number

  constructor(mainCanvas: any, data: any) {
    super(data)

    this.pixelsTravelled = 0
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
    const y1 = this.mapPosition[1]
    super.cycle(dt)
    const y2 = this.mapPosition[1]
    this.pixelsTravelled += y2 - y1
  }

  move(dt: number) {
    const pos = {
      x: this.mapPosition[0],
      y: this.mapPosition[1]
    }

    let acceleration
    if (this.isLying() || this.isBeingEaten() || this.isJumping()) {
      acceleration = Vec2.zero
    } else {
      const dirVect = {
        x: Math.cos(this.direction),
        y: Math.sin(this.direction)
      }

      this.confidenceBoost = this.computeConfidenceBoost()
      const directionAcc = Vec2.scale(this.confidenceBoost * Vec2.dot(dirVect, Vec2.down), dirVect)

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
    const initPixelsTravelled = this.pixelsTravelled + 1000
    const initElapsedTime = this.elapsedTime + 10000

    const crashesBoost = this.collisions
      .map(t => 20 * Math.pow(this.elapsedTime - t, -0.5))
      .reduce((a, b) => a + b, 0)

    const jumpBoost = this.jumps
      .map(t => 5 * Math.pow(this.elapsedTime - t, -0.5))
      .reduce((a, b) => a + b, 0)

    let confidenceBoost = Math.max(100 * (initPixelsTravelled + 1000) / (initElapsedTime + 10000), 1)
    confidenceBoost = 0.10 * Math.pow(confidenceBoost, 0.6) / (1 + crashesBoost - jumpBoost)

    return confidenceBoost
  }

  draw(dContext: any, spriteFrame: string, zoom: number) {
    // Part of monster sprite while being eaten, also don’t show when blinking
    if (!this.isBeingEaten() && !this.isBlinking()) {
      const spritePartToUse =
        this.isJumping()
          ? 'jumping'
          : (this.isLying() ? 'hit' : this.getDiscreteDirection())

      super.draw(dContext, spritePartToUse, zoom)

      if (config.debug) {
        dContext.font = '20px sans-serif'
        dContext.fillText(`Confidence boost: ${this.confidenceBoost}`, 15, 170)
      }
    }
  }

  isLying() {
    const lastCollision = this.lastCollision()
    return lastCollision !== undefined && this.elapsedTime - lastCollision < config.skier.lyingDurationAfterCrash
  }

  isJumping() {
    const lastJump = this.lastJump()
    return lastJump !== undefined && this.elapsedTime - lastJump < config.skier.jumpDuration
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

  hasHitJump() {
    if (!this.isJumping()) {
      this.speed = config.skier.jumpSpeed
      this.jumps.push(this.elapsedTime)

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
      const jumpAfterEvent = lastJump !== undefined && lastJump > eventTime
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

  lastJump(): number | undefined {
    if (this.jumps) {
      return this.jumps[this.jumps.length - 1]
    }
  }
}
