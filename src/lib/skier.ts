import { Sprite } from 'lib/sprite'
import { Monster } from 'lib/monster'
import * as Physics from 'lib/physics'
import * as Vec2 from 'lib/vec2'
import { config } from 'config'

// Facing: Left - South - East
export const downDirection: number = Math.PI / 2
const rightMostDirection: number = Math.PI
const leftMostDirection: number = 0
const directionAmplitude: number = Math.PI

export class Skier extends Sprite {

  pixelsTravelled: number
  jumps: number
  collisions: Array<number>
  lastEatenTime: number | undefined
  lastJump: number | undefined
  direction: number
  speed: Vec2.Vec2
  remainingDt: number
  elapsedTime: number

  // debug
  confidenceBoost: number

  constructor(mainCanvas: any, data: any) {
    super(data)

    this.pixelsTravelled = 0
    this.jumps = 0
    this.collisions = []
    this.lastJump = undefined
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

      const recentCrashes = this.collisions
        .map(t => 20 * Math.pow(this.elapsedTime - t, -0.5))
        .reduce((a, b) => a + b, 0)

      let confidenceBoost =
        this.elapsedTime === 0 || this.pixelsTravelled === 0
          ? 0.01
          : (this.pixelsTravelled + 1000) / (this.elapsedTime + 10000)
      confidenceBoost = Math.max(confidenceBoost * 100, 1)
      confidenceBoost = 0.10 * Math.pow(confidenceBoost, 0.6) / (1 + recentCrashes)
      this.confidenceBoost = confidenceBoost

      const directionAcc = Vec2.scale(confidenceBoost * Vec2.dot(dirVect, Vec2.down), dirVect)

      const perdendicularSpeed = Vec2.rotate(Math.PI / 2, this.speed)
      const skierOrientationFactor = this.skierDirectionMultiplier()
      const stopAcc = Vec2.scale(
        -1 * skierOrientationFactor * Math.abs(Vec2.dot(perdendicularSpeed, dirVect)),
        this.speed)

      const frictionAcc = Vec2.scale(-1, this.speed)

      acceleration = Vec2.scale(
        0.01,
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

  draw(dContext: any) {
    // Part of monster sprite while being eaten, also don’t show when blinking
    if (!this.isBeingEaten() && !this.isBlinking()) {
      const spritePartToUse =
        this.isJumping()
          ? 'jumping'
          : (this.isLying() ? 'hit' : this.getDiscreteDirection())

      super.draw(dContext, spritePartToUse)

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
    return this.lastJump !== undefined && this.elapsedTime - this.lastJump < config.skier.jumpDuration
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
      this.speed = Vec2.scale(1, Vec2.down)
      this.jumps++
      this.lastJump = this.elapsedTime

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
    const getProgress = (eventTime: number, eventDuration: number) => {
      const jumpAfterEvent = this.lastJump !== undefined && this.lastJump > eventTime
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

  isEatenBy(monster: Monster, whenEaten: () => void) {
    this.lastEatenTime = this.elapsedTime
    this.speed = Vec2.zero
    monster.startEating(whenEaten)

    // @ts-ignore
    window.PlayEGI.motor('negative')
  }

  lastCollision(): number | undefined {
    if (this.collisions.length > 0) {
      return this.collisions[this.collisions.length - 1]
    }
  }
}
