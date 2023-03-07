import { SpriteArray } from 'lib/spriteArray'

export function Game (mainCanvas, player) {
  let objects = new SpriteArray()
  const dContext = mainCanvas.getContext('2d')
  let paused = false
  const that = this
  const beforeCycleCallbacks = []
  const afterCycleCallbacks = []
  let runningTime = 0
  let lastStepAt = null

  this.addObject = function({ sprite, shouldAvoidCollisions, type }) {
    // Determine graphical properties to enable hit check
    if (sprite.data.parts.main !== undefined) {
      sprite.determineNextFrame(dContext, 'main')
    }

    if (type !== undefined) {
      objects.onPush(function (obj) {
        if (obj.data && obj.data.hitBehaviour[type]) {
          obj.onHitting(sprite, obj.data.hitBehaviour[type])
        }
      }, true)
    }

    if (!shouldAvoidCollisions || that.canAddObject(sprite)) {
      objects.push(sprite)
    }
  }

  this.canAddObject = function (sprite) {
    return !objects.some(function (other) {
      const b = other.hitsLandingArea(sprite)
      return other.hits(sprite) || other.hitsLandingArea(sprite)
    })
  }

  this.addObjects = function (sprites, shouldAvoidCollisions) {
    sprites.forEach(function (sprite) {
      that.addObject({
        sprite: sprite,
        shouldAvoidCollisions: shouldAvoidCollisions
      })
    })
  }

  this.beforeCycle = function (callback) {
    beforeCycleCallbacks.push(callback)
  }

  this.afterCycle = function (callback) {
    afterCycleCallbacks.push(callback)
  }

  dContext.followSprite(player)

  this.cycle = function (dt) {
    beforeCycleCallbacks.forEach(function (c) {
      c()
    })

    player.cycle(dt)

    objects.cull()
    objects.forEach(function (object) {
      if (object.cycle) {
        object.cycle(dt, dContext)
      }
    })

    afterCycleCallbacks.forEach(function (c) {
      c()
    })
  }

  that.draw = function () {
    dContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height)

    const allObjects = objects.slice() // Clone
    allObjects.push(player)
    allObjects.sort(function (a, b) {
      if (isJumpingSkier(a)) {
        return 1
      } else if (isJumpingSkier(b)) {
        return -1
      } else if (isSnow(a)) {
        return -1
      } else if (isSnow(b)) {
        return 1
      } else {
        const aBottom = a.getBottomHitBoxEdge(a.mapPosition[2])
        const bBottom = b.getBottomHitBoxEdge(b.mapPosition[2])
        return aBottom - bBottom
      }
    })

    allObjects.forEach(function (object) {
      if (object.draw) {
        object.draw(dContext, 'main')
      }
    })
  }

  this.start = function () {
    this.step()
  }

  this.pause = function () {
    paused = true
    lastStepAt = null
  }

  this.resume = function () {
    paused = false
    this.step()
  }

  this.isPaused = function () {
    return paused
  }

  this.getRunningTime = function () {
    return runningTime
  }

  this.reset = function () {
    paused = false
    objects = new SpriteArray()
    player.reset()
    this.start()
    runningTime = 0
  }.bind(this)

  this.step = function (now) {
    if (paused) return

    let dt = 0
    if (lastStepAt != null) {
      dt = now - lastStepAt
    }
    lastStepAt = now
    runningTime += dt

    this.cycle(dt)
    this.draw()

    requestAnimationFrame(this.step.bind(this))
  }

  this.hasObject = function (name) {
    return objects.some(function(obj) {
      return obj.data.name === name
    })
  }
}

function isJumpingSkier (sprite) {
  return sprite.data.name === 'skier' && sprite.isJumping
}

function isSnow (sprite) {
  return sprite.data.name === 'thickSnow' || sprite.data.name === 'thickerSnow'
}
