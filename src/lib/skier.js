import { Sprite } from 'lib/sprite'
import * as Vec2 from 'lib/vec2'

const discreteDirections = {
  'west': 270,
  'wsWest': 240,
  'sWest': 195,
  'south': 180,
  'sEast': 165,
  'esEast': 120,
  'east': 90
}

const directions = {
  esEast: function (xDiff) { return xDiff > 300 },
  sEast: function (xDiff) { return xDiff > 75 },
  wsWest: function (xDiff) { return xDiff < -300 },
  sWest: function (xDiff) { return xDiff < -75 }
}

const maxSpeed = 1
const crashDuration = 800 // ms
const invincibleAfterCrashDuration = 2000 // ms

// Facing: Left - South - East
export const downDirection = Math.PI / 2
const leftMostDirection = Math.PI
const rightMostDirection = 0
const directionAmplitude = Math.PI

export class Skier extends Sprite {

  constructor(mainCanvas, data) {
    super(data)

    this.cancelableStateTimeout = undefined
    this.cancelableStateInterval = undefined

    this.obstaclesHit = []
    this.pixelsTravelled = 0
    this.hasBeenHit = false
    this.isJumping = false
    this.onHitObstacleCb = function () {}
    this.jumps = 0
    this.collisions = 0
    this.lastCollision = undefined
    this.lastJump = undefined
    this.direction = downDirection
  }

  setNormal() {
    this.hasBeenHit = false
    this.isJumping = false
    if (this.cancelableStateInterval) {
      clearInterval(this.cancelableStateInterval)
    }
  }

  setCrashed() {
    this.hasBeenHit = true
    if (this.cancelableStateInterval) {
      clearInterval(this.cancelableStateInterval)
    }
    window.PlayEGI.motor('negative')
  }

  setJumping() {
    const currentSpeed = this.getSpeed()
    this.isJumping = true
    this.lastJump = Date.now()
    super.setAcceleration({x: 0, y: -1})
    window.PlayEGI.motor('positive')
  }

  getDiscreteDirection() {
    if (this.direction < downDirection - directionAmplitude * 0.40) {
      return 'east'
    } else if (this.direction < downDirection - directionAmplitude * 0.30) {
      return 'esEast'
    } else if (this.direction < downDirection - directionAmplitude * 0.15) {
      return 'sEast'
    } else if (this.direction <= downDirection + directionAmplitude * 0.15) {
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
    this.direction = Math.min(this.direction - directionAmplitude / 6, leftMostDirection)
  }

  turnRight() {
    this.direction = Math.max(this.direction + directionAmplitude / 6, rightMostDirection)
  }

  setMapPositionTarget(x, y) {
    if (this.hasBeenHit) return

    const mapPosition = super.getMapPosition()

    if (Math.abs(mapPosition[0] - x) <= 75) {
      x = mapPosition[0]
    }

    this.setMovingToward = [ x, y ]
  }

  getPixelsTravelledDownMountain() {
    return this.pixelsTravelled
  }

  setDirection(direction) {
    this.direction = direction
  }

  cycle(dt) {
    if (this.isMoving()) {
      this.pixelsTravelled += this.speed * (dt || skiCfg.originalFrameInterval)/skiCfg.originalFrameInterval
    }

    if (this.isJumping) {
      this.setMapPositionTarget(undefined, super.getMapPosition()[1] + this.getSpeed())
    }

    super.cycle(dt)
  }

  move(dt) {
    const r = 0.0001
    this.setAcceleration({
      x: r * Math.cos(this.direction),
      y: r * Math.sin(this.direction)
    })

    if (!this.hasBeenHit) {
      super.move(dt)
    }
  }

  draw(dContext) {
    // Part of monster sprite while being eaten, also don’t show when blinking
    if (!this.isBeingEaten && !this.isBlinking()) {
      const spritePartToUse =
        this.isJumping
          ? 'jumping'
          : (this.hasBeenHit ? 'hit' : this.getDiscreteDirection())

      super.draw(dContext, spritePartToUse)
    }
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

  hits(obs) {
    if (this.obstaclesHit.indexOf(obs.id) !== -1) {
      return false
    }

    if (!obs.occupiesZIndex(super.getMapPosition()[2])) {
      return false
    }

    if (super.hits(obs)) {
      return true
    }

    return false
  }

  getSpeedRatio() {
    return this.getSpeed().y / maxSpeed
  }

  hasHitObstacle(obs) {
    if (!this.isJumping && this.invincibleProgress() === undefined) {
      this.collisions++
      this.lastCollision = Date.now()
      this.setCrashed()
      this.setSpeed(Vec2.zero)

      this.obstaclesHit.push(obs.id)

      this.onHitObstacleCb(obs)

      if (this.cancelableStateTimeout) {
        clearTimeout(this.cancelableStateTimeout)
      }
      this.cancelableStateTimeout = setTimeout(() => {
        this.setNormal()
      }, crashDuration)
    }
  }

  hasHitSnow(obs) {
    if (!this.isJumping && this.invincibleProgress() === undefined) {
      this.obstaclesHit.push(obs.id)
      this.speedY /= 2
    }
  }

  invincibleProgress() {
    const now = Date.now()
    const start = this.lastCollision + crashDuration
    const end = start + invincibleAfterCrashDuration
    const jumpAfterCollision = this.lastJump !== undefined && this.lastJump > this.lastCollision
    if (!jumpAfterCollision && this.lastCollision !== undefined && now >= start && now < end) {
      return (now - start) / (end - start)
    }
  }

  hasHitJump() {
    if (!this.isJumping) {
      this.jumps++
      this.setJumping()

      if (this.cancelableStateTimeout) {
        clearTimeout(this.cancelableStateTimeout)
      }
      this.cancelableStateTimeout = setTimeout(() => this.setNormal(), 1000)
    }
  }

  isEatenBy(monster, whenEaten) {
    this.hasHitObstacle(monster)
    monster.startEating(whenEaten)
    this.obstaclesHit.push(monster.id)
    this.isBeingEaten = true
  }

  setAcceleration(v) {
    if (!this.isJumping) {
      super.setAcceleration(v)
    }
  }
}
