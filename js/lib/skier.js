import { Sprite } from 'lib/sprite'

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

const standardSpeed = 15
const crashDuration = 800 // ms
const invincibleAfterCrashDuration = 2000 // ms

export class Skier extends Sprite {

  constructor(mainCanvas, data) {
    super(data)

    this.cancelableStateTimeout = undefined
    this.cancelableStateInterval = undefined

    this.obstaclesHit = []

    this.pixelsTravelled = 0
    this.speedX = 0
    this.speedY = 0

    this.isMoving = true
    this.hasBeenHit = false
    this.isJumping = false
    this.onHitObstacleCb = function () {}
    this.setSpeed(standardSpeed)

    this.jumps = 0
    this.collisions = 0
    this.lastCollision = undefined
    this.lastJump = undefined
  }

  setNormal() {
    this.isMoving = true
    this.hasBeenHit = false
    this.isJumping = false
    if (this.cancelableStateInterval) {
      clearInterval(this.cancelableStateInterval)
    }
  }

  setCrashed() {
    this.isMoving = false
    this.hasBeenHit = true
    this.speedY = 0
    if (this.cancelableStateInterval) {
      clearInterval(this.cancelableStateInterval)
    }
    window.PlayEGI.motor('negative')
  }

  setJumping() {
    const currentSpeed = this.getSpeed()
    this.isMoving = true
    this.isJumping = true
    this.lastJump = Date.now()
    super.setDirection(180)
    window.PlayEGI.motor('positive')
  }

  getDiscreteDirection() {
    if (this.direction !== undefined) {
      if (this.direction <= 90) {
        return 'east'
      } else if (this.direction > 90 && this.direction < 150) {
        return 'esEast'
      } else if (this.direction >= 150 && this.direction < 170) {
        return 'sEast'
      } else if (this.direction >= 170 && this.direction < 190) {
        return 'south'
      } else if (this.direction > 190 && this.direction <= 210) {
        return 'sWest'
      } else if (this.direction > 210 && this.direction < 270) {
        return 'wsWest'
      } else {
        return 'west'
      }
    } else {
      const mapPosition = super.getMapPosition()
      const movingToward = super.getMovingToward()
      const xDiff = movingToward[0] - mapPosition[0]
      const yDiff = movingToward[1] - mapPosition[1]
      if (yDiff <= 0) {
        if (xDiff > 0) {
          return 'east'
        } else {
          return 'west'
        }
      }

      if (directions.esEast(xDiff)) {
        return 'esEast'
      } else if (directions.sEast(xDiff)) {
        return 'sEast'
      } else if (directions.wsWest(xDiff)) {
        return 'wsWest'
      } else if (directions.sWest(xDiff)) {
        return 'sWest'
      } else {
        return 'south'
      }
    }
  }

  setDiscreteDirection (d) {
    if (discreteDirections[d]) {
      this.setDirection(discreteDirections[d])
    }

    if (d === 'west' || d === 'east') {
      this.isMoving = false
    } else {
      this.isMoving = true
    }
  }

  stop() {
    if (this.direction > 180) {
      this.setDiscreteDirection('west')
    } else {
      this.setDiscreteDirection('east')
    }
  }

  turnEast() {
    const discreteDirection = this.getDiscreteDirection()

    switch (discreteDirection) {
      case 'west':
        this.setDiscreteDirection('wsWest')
        break
      case 'wsWest':
        this.setDiscreteDirection('sWest')
        break
      case 'sWest':
        this.setDiscreteDirection('south')
        break
      case 'south':
        this.setDiscreteDirection('sEast')
        break
      case 'sEast':
        this.setDiscreteDirection('esEast')
        break
      case 'esEast':
        this.setDiscreteDirection('east')
        break
    }
  }

  turnWest() {
    const discreteDirection = this.getDiscreteDirection()

    switch (discreteDirection) {
      case 'east':
        this.setDiscreteDirection('esEast')
        break
      case 'esEast':
        this.setDiscreteDirection('sEast')
        break
      case 'sEast':
        this.setDiscreteDirection('south')
        break
      case 'south':
        this.setDiscreteDirection('sWest')
        break
      case 'sWest':
        this.setDiscreteDirection('wsWest')
        break
      case 'wsWest':
        this.setDiscreteDirection('west')
        break
    }
  }

  stepWest() {
    super.getMapPosition()[0] -= this.speed * 2
  }

  stepEast() {
    super.getMapPosition()[0] += this.speed * 2
  }

  setMapPositionTarget(x, y) {
    if (this.hasBeenHit) return

    const mapPosition = super.getMapPosition()

    if (Math.abs(mapPosition[0] - x) <= 75) {
      x = mapPosition[0]
    }

    this.setMovingToward = [ x, y ]
  }

  startMovingIfPossible() {
    if (!this.hasBeenHit && !this.isBeingEaten) {
      this.isMoving = true
    }
  }

  getPixelsTravelledDownMountain() {
    return this.pixelsTravelled
  }

  resetSpeed() {
    this.setSpeed(standardSpeed)
  }

  cycle(dt) {
    this.cycleSpeedX()
    this.cycleSpeedY(dt)

    if (this.speedX <= 0 && this.speedY <= 0) {
      this.isMoving = false
    }
    if (this.isMoving) {
      this.pixelsTravelled += this.speed * (dt || skiCfg.originalFrameInterval)/skiCfg.originalFrameInterval
    }

    if (this.isJumping) {
      this.setMapPositionTarget(undefined, super.getMapPosition()[1] + this.getSpeed())
    }

    super.cycle(dt)
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

  getStandardSpeed() {
    return standardSpeed
  }

  getSpeedRatio() {
    return this.speedY / standardSpeed
  }

  cycleSpeedX() {
    const dir = this.getDiscreteDirection()

    if (dir === 'esEast' || dir === 'wsWest') {
      this.speedX = this.getSpeed() * 0.5
    } else if (dir === 'sEast' || dir === 'sWest') {
      this.speedX = this.getSpeed() * 1
    } else {
      // South
      this.speedX = this.getSpeed() * 0.2
    }
  }

  getSpeedX() {
    return this.speedX
  }

  cycleSpeedY(dt) {
    if (this.isJumping) {
      this.speedY = this.getSpeed() + 2
    } else if (!this.hasBeenHit) {
      const dir = this.getDiscreteDirection()

      let targetSpeedY = 0
      if (dir === 'esEast' || dir === 'wsWest') {
        targetSpeedY = 0.3 * this.getSpeed()
      } else if (dir === 'sEast' || dir === 'sWest') {
        this.speedX = this.getSpeed() * 0.33
        targetSpeedY = 0.7 * this.getSpeed()
      } else {
        // South
        targetSpeedY = this.getSpeed()
      }

      const convergenceTime = this.speedY < targetSpeedY ? 2000 : 100
      this.speedY = this.speedY + ((targetSpeedY - this.speedY) / convergenceTime) * dt
    }
  }

  getSpeedY() {
    return this.speedY
  }

  hasHitObstacle(obs) {
    if (!this.isJumping && this.invincibleProgress() === undefined) {
      this.collisions++
      this.lastCollision = Date.now()
      this.setCrashed()

      this.obstaclesHit.push(obs.id)

      this.resetSpeed()
      this.onHitObstacleCb(obs)

      if (this.cancelableStateTimeout) {
        clearTimeout(this.cancelableStateTimeout)
      }
      this.cancelableStateTimeout = setTimeout(() => this.setNormal(), crashDuration)
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
    this.isMoving = false
    this.isBeingEaten = true
  }

  setHitObstacleCb(fn) {
    this.onHitObstacleCb = fn || function () {}
  }

  setDirection(angle) {
    if (!this.isJumping) {
      super.setDirection(angle)
    }
  }
}
