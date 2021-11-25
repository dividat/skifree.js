var SpriteArray = require('./spriteArray');

(function (global) {
  function Game (mainCanvas, player) {
    var staticObjects = new SpriteArray()
    var movingObjects = new SpriteArray()
    var uiElements = new SpriteArray()
    var dContext = mainCanvas.getContext('2d')
    var mouseX = dContext.getCentreOfViewport()
    var mouseY = 0
    var paused = false
    var that = this
    var beforeCycleCallbacks = []
    var afterCycleCallbacks = []
    var runningTime = 0
    var lastStepAt = null

    this.addStaticObject = function (sprite) {
      staticObjects.push(sprite)
    }

    this.addStaticObjects = function (sprites) {
      sprites.forEach(this.addStaticObject.bind(this))
    }

    this.addMovingObject = function (movingObject, movingObjectType) {
      if (movingObjectType) {
        staticObjects.onPush(function (obj) {
          if (obj.data && obj.data.hitBehaviour[movingObjectType]) {
            obj.onHitting(movingObject, obj.data.hitBehaviour[movingObjectType])
          }
        }, true)
      }

      movingObjects.push(movingObject)
    }

    this.addUIElement = function (element) {
      uiElements.push(element)
    }

    this.beforeCycle = function (callback) {
      beforeCycleCallbacks.push(callback)
    }

    this.afterCycle = function (callback) {
      afterCycleCallbacks.push(callback)
    }

    this.setMouseX = function (x) {
      mouseX = x
    }

    this.setMouseY = function (y) {
      mouseY = y
    }

    player.setMapPosition(0, 0)
    player.setMapPositionTarget(0, -10)
    dContext.followSprite(player)

    var intervalNum = 0

    this.cycle = function () {
      beforeCycleCallbacks.each(function (c) {
        c()
      })

      // Clear canvas
      var mouseMapPosition = dContext.canvasPositionToMapPosition([mouseX, mouseY])

      if (!player.isJumping) {
        player.setMapPositionTarget(mouseMapPosition[0], mouseMapPosition[1])
      }

      intervalNum++

      player.cycle()

      movingObjects.cull()
      movingObjects.each(function (movingObject, i) {
        movingObject.cycle(dContext)
      })

      staticObjects.cull()
      staticObjects.each(function (staticObject, i) {
        if (staticObject.cycle) {
          staticObject.cycle()
        }
      })

      uiElements.each(function (uiElement, i) {
        if (uiElement.cycle) {
          uiElement.cycle()
        }
      })

      afterCycleCallbacks.each(function (c) {
        c()
      })
    }

    that.draw = function () {
      // Clear canvas
      mainCanvas.width = mainCanvas.width

      player.draw(dContext)

      player.cycle()

      movingObjects.each(function (movingObject, i) {
        movingObject.draw(dContext)
      })

      staticObjects.each(function (staticObject, i) {
        if (staticObject.draw) {
          staticObject.draw(dContext, 'main')
        }
      })

      uiElements.each(function (uiElement, i) {
        if (uiElement.draw) {
          uiElement.draw(dContext, 'main')
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
      staticObjects = new SpriteArray()
      movingObjects = new SpriteArray()
      mouseX = dContext.getCentreOfViewport()
      mouseY = 0
      player.reset()
      player.setMapPosition(0, 0, 0)
      this.start()
      runningTime = 0
    }.bind(this)

    this.step = function (now) {
      if (paused) return

      var dt = 0
      if (lastStepAt != null) {
        dt = now - lastStepAt
      }
      lastStepAt = now
      runningTime += dt

      this.cycle()
      this.draw()

      requestAnimationFrame(this.step.bind(this))
    }

  }

  global.game = Game
})(this)

if (typeof module !== 'undefined') {
  module.exports = this.game
}
