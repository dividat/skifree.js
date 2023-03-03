const Sprite = require('./sprite');
(function (global) {
  function Skier (mainCanvas, data) {
    const discreteDirections = {
      'west': 270,
      'wsWest': 240,
      'sWest': 195,
      'south': 180,
      'sEast': 165,
      'esEast': 120,
      'east': 90
    }
    const that = new Sprite(data)
    const sup = {
      draw: that.superior('draw'),
      cycle: that.superior('cycle'),
      getSpeedX: that.superior('getSpeedX'),
      getSpeedY: that.superior('getSpeedY'),
      hits: that.superior('hits'),
      setDirection: that.superior('setDirection')
    }
    const directions = {
      esEast: function (xDiff) { return xDiff > 300 },
      sEast: function (xDiff) { return xDiff > 75 },
      wsWest: function (xDiff) { return xDiff < -300 },
      sWest: function (xDiff) { return xDiff < -75 }
    }

    let cancelableStateTimeout
    let cancelableStateInterval

    const obstaclesHit = []
    const standardSpeed = 15
    const boostMultiplier = 2
    const crashDuration = 800 // ms
    const invincibleAfterCrashDuration = 2000 // ms

    let pixelsTravelled = 0
    let speedX = 0
    let speedY = 0

    that.isMoving = true
    that.hasBeenHit = false
    that.isJumping = false
    that.onHitObstacleCb = function () {}
    that.setSpeed(standardSpeed)

    that.jumps = 0
    that.collisions = 0
    that.lastCollision = undefined
    that.lastJump = undefined

    function setNormal () {
      that.isMoving = true
      that.hasBeenHit = false
      that.isJumping = false
      if (cancelableStateInterval) {
        clearInterval(cancelableStateInterval)
      }
    }

    function setCrashed () {
      that.isMoving = false
      that.hasBeenHit = true
      speedY = 0
      if (cancelableStateInterval) {
        clearInterval(cancelableStateInterval)
      }
      window.PlayEGI.motor('negative')
    }

    function setJumping () {
      const currentSpeed = that.getSpeed()
      that.isMoving = true
      that.isJumping = true
      that.lastJump = Date.now()
      sup.setDirection(180)
      window.PlayEGI.motor('positive')
    }

    function getDiscreteDirection () {
      if (that.direction !== undefined) {
        if (that.direction <= 90) {
          return 'east'
        } else if (that.direction > 90 && that.direction < 150) {
          return 'esEast'
        } else if (that.direction >= 150 && that.direction < 170) {
          return 'sEast'
        } else if (that.direction >= 170 && that.direction < 190) {
          return 'south'
        } else if (that.direction > 190 && that.direction <= 210) {
          return 'sWest'
        } else if (that.direction > 210 && that.direction < 270) {
          return 'wsWest'
        } else {
          return 'west'
        }
      } else {
        const xDiff = that.movingToward[0] - that.mapPosition[0]
        const yDiff = that.movingToward[1] - that.mapPosition[1]
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

    function setDiscreteDirection (d) {
      if (discreteDirections[d]) {
        that.setDirection(discreteDirections[d])
      }

      if (d === 'west' || d === 'east') {
        that.isMoving = false
      } else {
        that.isMoving = true
      }
    }

    function getBeingEatenSprite () {
      return 'blank'
    }

    function getJumpingSprite () {
      return 'jumping'
    }

    that.stop = function () {
      if (that.direction > 180) {
        setDiscreteDirection('west')
      } else {
        setDiscreteDirection('east')
      }
    }

    that.turnEast = function () {
      const discreteDirection = getDiscreteDirection()

      switch (discreteDirection) {
        case 'west':
          setDiscreteDirection('wsWest')
          break
        case 'wsWest':
          setDiscreteDirection('sWest')
          break
        case 'sWest':
          setDiscreteDirection('south')
          break
        case 'south':
          setDiscreteDirection('sEast')
          break
        case 'sEast':
          setDiscreteDirection('esEast')
          break
        case 'esEast':
          setDiscreteDirection('east')
          break
      }
    }

    that.turnWest = function () {
      const discreteDirection = getDiscreteDirection()

      switch (discreteDirection) {
        case 'east':
          setDiscreteDirection('esEast')
          break
        case 'esEast':
          setDiscreteDirection('sEast')
          break
        case 'sEast':
          setDiscreteDirection('south')
          break
        case 'south':
          setDiscreteDirection('sWest')
          break
        case 'sWest':
          setDiscreteDirection('wsWest')
          break
        case 'wsWest':
          setDiscreteDirection('west')
          break
      }
    }

    that.stepWest = function () {
      that.mapPosition[0] -= that.speed * 2
    }

    that.stepEast = function () {
      that.mapPosition[0] += that.speed * 2
    }

    that.setMapPositionTarget = function (x, y) {
      if (that.hasBeenHit) return

      if (Math.abs(that.mapPosition[0] - x) <= 75) {
        x = that.mapPosition[0]
      }

      that.movingToward = [ x, y ]
    }

    that.startMovingIfPossible = function () {
      if (!that.hasBeenHit && !that.isBeingEaten) {
        that.isMoving = true
      }
    }

    that.getPixelsTravelledDownMountain = function () {
      return pixelsTravelled
    }

    that.resetSpeed = function () {
      that.setSpeed(standardSpeed)
    }

    that.cycle = function (dt) {
      that.cycleSpeedX()
      that.cycleSpeedY(dt)

      if (speedX <= 0 && speedY <= 0) {
        that.isMoving = false
      }
      if (that.isMoving) {
        pixelsTravelled += that.speed * (dt || skiCfg.originalFrameInterval)/skiCfg.originalFrameInterval
      }

      if (that.isJumping) {
        that.setMapPositionTarget(undefined, that.mapPosition[1] + that.getSpeed())
      }

      sup.cycle(dt)
    }

    that.draw = function (dContext) {
      // Part of monster sprite while being eaten, also don’t show when blinking
      if (!that.isBeingEaten && !that.isBlinking()) {
        const spritePartToUse = function () {
          if (that.isJumping) {
            return getJumpingSprite()
          } else if (that.hasBeenHit) {
            return 'hit'
          } else {
            return getDiscreteDirection()
          }
        }

        sup.draw(dContext, spritePartToUse())
      }
    }

    that.isBlinking = function () {
      const invincibleProgress = that.invincibleProgress()
      if (invincibleProgress === undefined) {
        return false
      } else if (invincibleProgress < 0.6) {
        return Math.floor(Date.now() / 100) % 2 === 0
      } else {
        return Math.floor(Date.now() / 50) % 2 === 0
      }
    }

    that.hits = function (obs) {
      if (obstaclesHit.indexOf(obs.id) !== -1) {
        return false
      }

      if (!obs.occupiesZIndex(that.mapPosition[2])) {
        return false
      }

      if (sup.hits(obs)) {
        return true
      }

      return false
    }

    that.getStandardSpeed = function () {
      return standardSpeed
    }

    that.getSpeedRatio = function () {
      return speedY / standardSpeed
    }

    that.cycleSpeedX = function () {
      const dir = getDiscreteDirection()

      if (dir === 'esEast' || dir === 'wsWest') {
        speedX = that.getSpeed() * 0.5
      } else if (dir === 'sEast' || dir === 'sWest') {
        speedX = that.getSpeed() * 1
      } else {
        // South
        speedX = that.getSpeed() * 0.2
      }
    }

    that.getSpeedX = function () {
      return speedX
    }

    that.cycleSpeedY = function (dt) {
      if (that.isJumping) {
        speedY = that.getSpeed() + 2
      } else if (!that.hasBeenHit) {
        const dir = getDiscreteDirection()

        let targetSpeedY = 0
        if (dir === 'esEast' || dir === 'wsWest') {
          targetSpeedY = 0.3 * that.getSpeed()
        } else if (dir === 'sEast' || dir === 'sWest') {
          speedX = that.getSpeed() * 0.33
          targetSpeedY = 0.7 * that.getSpeed()
        } else {
          // South
          targetSpeedY = that.getSpeed()
        }

        const convergenceTime = speedY < targetSpeedY ? 2000 : 100
        speedY = speedY + ((targetSpeedY - speedY) / convergenceTime) * dt
      }
    }

    that.getSpeedY = function() {
      return speedY
    }

    that.hasHitObstacle = function (obs) {
      if (!that.isJumping && that.invincibleProgress() === undefined) {
        that.collisions++
        that.lastCollision = Date.now()
        setCrashed()

        obstaclesHit.push(obs.id)

        that.resetSpeed()
        that.onHitObstacleCb(obs)

        if (cancelableStateTimeout) {
          clearTimeout(cancelableStateTimeout)
        }
        cancelableStateTimeout = setTimeout(function () {
          setNormal()
        }, crashDuration)
      }
    }

    that.hasHitSnow = function (obs) {
      if (!that.isJumping && that.invincibleProgress() === undefined) {
        obstaclesHit.push(obs.id)
        speedY /= 2
      }
    }

    that.invincibleProgress = function () {
      const now = Date.now()
      const start = that.lastCollision + crashDuration
      const end = start + invincibleAfterCrashDuration
      const jumpAfterCollision = that.lastJump !== undefined && that.lastJump > that.lastCollision
      if (!jumpAfterCollision && that.lastCollision !== undefined && now >= start && now < end) {
        return (now - start) / (end - start)
      }
    }

    that.hasHitJump = function () {
      if (!that.isJumping) {
        that.jumps++
        setJumping()

        if (cancelableStateTimeout) {
          clearTimeout(cancelableStateTimeout)
        }
        cancelableStateTimeout = setTimeout(function () {
          setNormal()
        }, 1000)
      }
    }

    that.isEatenBy = function (monster, whenEaten) {
      that.hasHitObstacle(monster)
      monster.startEating(whenEaten)
      obstaclesHit.push(monster.id)
      that.isMoving = false
      that.isBeingEaten = true
    }

    that.setHitObstacleCb = function (fn) {
      that.onHitObstacleCb = fn || function () {}
    }

    that.setDirection = function (angle) {
      if (!that.isJumping) {
        sup.setDirection(angle)
      }
    }

    return that
  }

  global.skier = Skier
})(this)

if (typeof module !== 'undefined') {
  module.exports = this.skier
}
