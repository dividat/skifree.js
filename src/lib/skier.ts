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

  // debug
  confidenceBoost: number

  constructor(mainCanvas: any, data: any) {
    super(data)

    this.downhillPixelsTravelled = 0
    this.collisions = []
    this.jumps = []
    this.direction = leftMostDirection
    this.pos = Vec2.zero
    this.speed = Vec2.zero
    this.remainingDt = 0
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

  turnLeft(): void {
    this.direction = Math.max(this.direction - directionAmplitude / 6, leftMostDirection)
  }

  turnRight(): void {
    this.direction = Math.min(this.direction + directionAmplitude / 6, rightMostDirection)
  }

  setDirection(direction: number): void {
    this.direction = direction
  }

  cycle(time: number, dt: number): void {
    const y1 = this.pos.y
    super.cycle(time, dt)
    const y2 = this.pos.y
    this.downhillPixelsTravelled += y2 - y1
  }

  move(time: number, dt: number): void {
    const pos = {
      x: this.pos.x,
      y: this.pos.y
    }

    let acceleration
    if (this.isLying(time) || this.isBeingEaten(time) || this.isJumping()) {
      acceleration = Vec2.zero
    } else {

      const dirVect =
        this.getDiscreteDirection() === 'south'
          ? { x: 0, y: 1 } // Force going straight to the bottom if sprite is “south”
          : {
            x: Math.cos(this.direction),
            y: Math.sin(this.direction)
          }

      this.confidenceBoost = this.computeConfidenceBoost(time)
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
    this.pos = res.pos
    this.remainingDt = res.remainingDt
  }

  // Default as if some distance and some time would have happened
  // Otherwise, it can accelerate too quickly.
  computeConfidenceBoost(time: number): number {
    const crashesBoost = this.collisions
      .map(t => 20 * Math.pow(time - t, -0.5))
      .reduce((a, b) => a + b, 0)

    const jumpBoost = this.jumps
      .map(jump => 5 * Math.pow(time - jump.time, -0.5))
      .reduce((a, b) => a + b, 0)

    const diagonalFactor = 2000 / Canvas.diagonal
    let confidenceBoost = Math.max(100 * (this.downhillPixelsTravelled * diagonalFactor + 1000) / (time + 25000), 1)
    confidenceBoost = 0.10 * Math.pow(confidenceBoost, 0.6) / (1 + crashesBoost - jumpBoost)

    return confidenceBoost
  }

  draw(time: number, center: Vec2.Vec2, spriteFrame: string, zoom: number): void {
    // Part of monster sprite while being eaten, also don’t show when blinking
    if (!this.isBeingEaten(time) && !this.isBlinking(time)) {
      const spritePartToUse =
        this.isJumping()
          ? 'jumping'
          : (this.isLying(time) ? 'hit' : this.getDiscreteDirection())

      super.draw(time, center, spritePartToUse, zoom)
    }
  }

  isLying(time: number): boolean {
    const lastCollision = this.lastCollision()
    return lastCollision !== undefined && time - lastCollision < config.skier.lyingDurationAfterCrash
  }

  isJumping(): boolean {
    const lastJump = this.lastJump()
    return lastJump !== undefined && this.pos.y - lastJump.y <= config.jump.length(Canvas.height)
  }

  isBeingEaten(time: number): boolean {
    return this.lastEatenTime !== undefined && time - this.lastEatenTime < config.monster.eatingDuration
  }

  isBlinking(time: number): boolean {
    const invincibilityProgress = this.invincibilityProgress(time)
    if (invincibilityProgress === 0 || invincibilityProgress === undefined) {
      return false
    } else if (invincibilityProgress < 0.6) {
      return Math.floor(time / 100) % 2 === 0
    } else {
      return Math.floor(time / 50) % 2 === 0
    }
  }

  hitObstacle(time: number, obs: Sprite): void {
    if (this.isHittable(time)) {
      this.speed = Vec2.zero
      this.collisions.push(time)

      // @ts-ignore
      window.PlayEGI.motor('negative')
    }
  }

  hitJump(time: number, jump: Sprite): void {
    if (!this.isJumping()) {
      this.speed = Vec2.scale(config.jump.speed(Canvas.diagonal), Vec2.down),
      this.jumps.push({ time, spriteId: jump.id, y: jump.pos.y })

      // @ts-ignore
      window.PlayEGI.motor('positive')
    }
  }

  isHittable(time: number): boolean {
    return !this.isJumping() && this.invincibilityProgress(time) === undefined
  }

  // After being hit, the skier is invincible.
  // - undefined: the skier is not invincible
  // - 0: the skier is lying or being eaten
  // - number: the skier is invincible with this progress ratio
  invincibilityProgress(time: number): number | undefined {
    const lastJump = this.lastJump()
    const getProgress = (eventTime: number, eventDuration: number) => {
      const jumpAfterEvent = lastJump !== undefined && lastJump.time > eventTime
      if (!jumpAfterEvent) {
        const now = time
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

  setEaten(time: number): void {
    this.lastEatenTime = time
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
