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

  pixelsTravelled: number
  isJumping: boolean
  jumps: number
  collisions: number
  lastCollisionTime: number | undefined
  lastEatenTime: number | undefined
  lastJump: number | undefined
  direction: number
  speed: Vec2.Vec2
  remainingDt: number

  constructor(mainCanvas: any, data: any) {
    super(data)

    this.pixelsTravelled = 0
    this.isJumping = false
    this.jumps = 0
    this.collisions = 0
    this.lastCollisionTime = undefined
    this.lastJump = undefined
    this.direction = leftMostDirection
    this.speed = Vec2.zero
    this.remainingDt = 0
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
    const downVect = { x: 0, y: 1 }

    let pos = {
      x: this.mapPosition[0],
      y: this.mapPosition[1]
    }

    if (this.isLying() || this.isBeingEaten()) {
      this.speed = Vec2.zero
    } else if (this.isJumping) {
      this.speed = Vec2.scale(0.07 * dt, downVect)

      pos = Physics.newPos({
        dt,
        acceleration: Vec2.zero,
        speed: this.speed,
        pos
      })

      this.setMapPosition(pos.x, pos.y)
    } else {
      const dirVect = {
        x: Math.cos(this.direction),
        y: Math.sin(this.direction)
      }

      const perdendicularSpeed = Vec2.rotate(Math.PI / 2, this.speed)

      const stopAcc = Vec2.scale(
        -50 * Math.abs(Vec2.dot(perdendicularSpeed, dirVect)),
        this.speed)

      const frictionAcc = Vec2.scale(-10, this.speed)
      const directionAcc = Vec2.scale(10 * Vec2.dot(dirVect, downVect), dirVect)

      const acceleration = Vec2.scale(
        0.00001 * dt,
        Vec2.add(stopAcc, frictionAcc, directionAcc))

      let res = Physics.moveWithChunks({
        dt: dt + this.remainingDt,
        acceleration,
        speed: this.speed,
        pos,
      })

      this.speed = res.speed
      this.setMapPosition(res.pos.x, res.pos.y)
      this.remainingDt = res.remainingDt
    }
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
    if (invincibleProgress === 0 || invincibleProgress === undefined) {
      return false
    } else if (invincibleProgress < 0.6) {
      return Math.floor(Date.now() / 100) % 2 === 0
    } else {
      return Math.floor(Date.now() / 50) % 2 === 0
    }
  }

  hits({ sprite, forPlacement }: { sprite: Sprite, forPlacement: boolean }): boolean {
    return this.isHittable() && super.hits({ sprite, forPlacement })
  }

  getSpeedRatio() {
    return this.speed.y / maxSpeed
  }

  hasHitObstacle(obs: Sprite) {
    if (this.isHittable()) {
      console.log('has hit', obs)
      this.collisions++
      this.lastCollisionTime = Date.now()

      // @ts-ignore
      window.PlayEGI.motor('negative')
    }
  }

  hasHitSnow(obs: Sprite) {
    if (this.isHittable()) {
      this.speed = Vec2.scale(0.9, this.speed)
    }
  }

  isHittable(): boolean {
    return !this.isJumping && this.invincibleProgress() === undefined
  }

  // After being hit, the skier is invincible.
  // - undefined: the skier is not invincible
  // - 0: the skier is lying or being eaten
  // - number: the skier is invincible with this progress ratio
  invincibleProgress(): number | undefined {
    const getProgress = (eventTime: number | undefined, eventDuration: number) => {
      if (eventTime !== undefined) {
        const jumpAfterEvent = this.lastJump !== undefined && this.lastJump > eventTime
        if (!jumpAfterEvent) {
          const now = Date.now()
          const start = eventTime + eventDuration
          const end = start + invincibleDuration
          if (now < start) {
            return 0
          } else if (now >= start && now < end) {
            return (now - start) / (end - start)
          }
        }
      }
    }

    const collisionProgress = getProgress(this.lastCollisionTime, crashDuration)
    const eatingProgress = getProgress(this.lastEatenTime, eatingDuration)

    return collisionProgress !== undefined
      ? collisionProgress
      : eatingProgress
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
    monster.startEating(whenEaten)

    // @ts-ignore
    window.PlayEGI.motor('negative')
  }
}
