(function (global) {
  var GUID = require('./guid')
  function Sprite (data) {
    var hasHittableObjects = false
    var hittableObjects = {}
    var zIndexesOccupied = [ 0 ]
    var that = this
    var trackedSpriteToMoveToward
    that.direction = undefined
    that.mapPosition = [0, 0, 0]
    that.id = GUID()
    that.canvasX = 0
    that.canvasY = 0
    that.canvasZ = 0
    that.height = 0
    that.speed = 0
    that.data = data || { parts: {} }
    that.movingToward = [ 0, 0 ]
    that.metresDownTheMountain = 0
    that.movingWithConviction = false
    that.deleted = false
    that.isStatic = false
    that.isMoving = true

    if (!that.data.parts) {
      that.data.parts = {}
    }

    if (data && data.id) {
      that.id = data.id
    }

    if (data && data.zIndexesOccupied) {
      zIndexesOccupied = data.zIndexesOccupied
    }

    function incrementX (amount) {
      that.canvasX += amount.toNumber()
    }

    function incrementY (amount) {
      that.canvasY += amount.toNumber()
    }

    function getHitBox (forZIndex) {
      if (that.data.hitBoxes) {
        if (data.hitBoxes[forZIndex]) {
          return data.hitBoxes[forZIndex]
        }
      }
    }

    function roundHalf (num) {
      num = Math.round(num * 2) / 2
      return num
    }

    function move () {
      if (!that.isMoving) {
        return
      }

      var currentX = that.mapPosition[0]
      var currentY = that.mapPosition[1]

      if (typeof that.direction !== 'undefined') {
        // For this we need to modify the that.direction so it relates to the horizontal
        var d = that.direction - 90
        if (d < 0) d = 360 + d
        currentX += roundHalf(that.speed * Math.cos(d * (Math.PI / 180)))
        currentY += roundHalf(that.speed * Math.sin(d * (Math.PI / 180)))
      } else {
        if (typeof that.movingToward[0] !== 'undefined') {
          if (currentX > that.movingToward[0]) {
            currentX -= Math.min(that.getSpeedX(), Math.abs(currentX - that.movingToward[0]))
          } else if (currentX < that.movingToward[0]) {
            currentX += Math.min(that.getSpeedX(), Math.abs(currentX - that.movingToward[0]))
          }
        }

        if (typeof that.movingToward[1] !== 'undefined') {
          if (currentY > that.movingToward[1]) {
            currentY -= Math.min(that.getSpeedY(), Math.abs(currentY - that.movingToward[1]))
          } else if (currentY < that.movingToward[1]) {
            currentY += Math.min(that.getSpeedY(), Math.abs(currentY - that.movingToward[1]))
          }
        }
      }

      that.setMapPosition(currentX, currentY)
    }

    this.draw = function (dCtx, spriteFrame) {
      var part = that.data.parts[spriteFrame]
      var overridePath = "sprites/" + that.data.name + "-" + spriteFrame + ".png"

      var frames = part.frames
      var fps = part.fps

      if (typeof frames === 'number' && typeof fps === 'number') {
        var deltaT = Math.floor(1000 / fps)
        var frame = Math.floor(Date.now() / deltaT) % frames + 1
        overridePath = "sprites/" + that.data.name + "-" + spriteFrame + frame + ".png"
      }

      var img = dCtx.getLoadedImage(overridePath)

      if (!img || !img.complete || img.naturalHeight === 0) { console.log(that.data.name, spriteFrame); return }

      var spriteZoom = 1
      if (typeof that.data.sizeMultiple === 'number') {
        var spriteZoom = part.sizeMultiple || that.data.sizeMultiple
      }
      var fr = [0, 0, img.width, img.height]
      that.width = fr[2] * spriteZoom * zoom
      that.height = fr[3] * spriteZoom * zoom

      var newCanvasPosition = dCtx.mapPositionToCanvasPosition(that.mapPosition)
      that.setCanvasPosition(newCanvasPosition[0], newCanvasPosition[1])

      dCtx.drawImage(img, fr[0], fr[1], fr[2], fr[3], that.canvasX, that.canvasY, that.width, that.height)
    }

    this.setMapPosition = function (x, y, z) {
      if (typeof x === 'undefined') {
        x = that.mapPosition[0]
      }
      if (typeof y === 'undefined') {
        y = that.mapPosition[1]
      }
      if (typeof z === 'undefined') {
        z = that.mapPosition[2]
      } else {
        that.zIndexesOccupied = [ z ]
      }
      that.mapPosition = [x, y, z]
    }

    this.setCanvasPosition = function (cx, cy) {
      if (cx) {
        if (Object.isString(cx) && (cx.first() === '+' || cx.first() === '-')) incrementX(cx)
        else that.canvasX = cx
      }

      if (cy) {
        if (Object.isString(cy) && (cy.first() === '+' || cy.first() === '-')) incrementY(cy)
        else that.canvasY = cy
      }
    }

    this.getCanvasPositionX = function () {
      return that.canvasX
    }

    this.getCanvasPositionY = function () {
      return that.canvasY
    }

    this.getLeftHitBoxEdge = function (zIndex) {
      zIndex = zIndex || 0
      var lhbe = this.getCanvasPositionX()
      if (getHitBox(zIndex)) {
        lhbe += getHitBox(zIndex)[0]
      }
      return lhbe
    }

    this.getTopHitBoxEdge = function (zIndex) {
      zIndex = zIndex || 0
      var thbe = this.getCanvasPositionY()
      if (getHitBox(zIndex)) {
        thbe += getHitBox(zIndex)[1]
      }
      return thbe
    }

    this.getRightHitBoxEdge = function (zIndex) {
      zIndex = zIndex || 0

      if (getHitBox(zIndex)) {
        return that.canvasX + getHitBox(zIndex)[2]
      }

      return that.canvasX + that.width
    }

    this.getBottomHitBoxEdge = function (zIndex) {
      zIndex = zIndex || 0

      if (getHitBox(zIndex)) {
        return that.canvasY + getHitBox(zIndex)[3]
      }

      return that.canvasY + that.height
    }

    this.getPositionInFrontOf = function () {
      return [that.canvasX, that.canvasY + that.height]
    }

    this.setSpeed = function (s) {
      that.speed = s
      that.speedX = s
      that.speedY = s
    }

    this.incrementSpeedBy = function (s) {
      that.speed += s
    }

    that.getSpeed = function getSpeed () {
      return that.speed
    }

    that.getSpeedX = function () {
      return that.speed
    }

    that.getSpeedY = function () {
      return that.speed
    }

    this.setHeight = function (h) {
      that.height = h
    }

    this.setWidth = function (w) {
      that.width = w
    }

    that.getMovingTowardOpposite = function () {
      if (!that.isMoving) {
        return [0, 0]
      }

      var dx = (that.movingToward[0] - that.mapPosition[0])
      var dy = (that.movingToward[1] - that.mapPosition[1])

      var oppositeX = (Math.abs(dx) > 75 ? 0 - dx : 0)
      var oppositeY = -dy

      return [ oppositeX, oppositeY ]
    }

    this.checkHittableObjects = function () {
      Object.keys(hittableObjects, function (k, objectData) {
        if (objectData.object.deleted) {
          delete hittableObjects[k]
        } else {
          if (objectData.object.hits(that)) {
            objectData.callbacks.each(function (callback) {
              callback(that, objectData.object)
            })
          }
        }
      })
    }

    this.checkOffScreen = function () {
      if (that.isStatic && that.isAboveOnCanvas(0)) {
        that.deleted = true
      }
    }

    this.cycle = function () {
      that.checkOffScreen()
      if (hasHittableObjects) that.checkHittableObjects()

      if (trackedSpriteToMoveToward) {
        that.setMapPositionTarget(trackedSpriteToMoveToward.mapPosition[0], trackedSpriteToMoveToward.mapPosition[1], true)
      }

      move()
    }

    this.setMapPositionTarget = function (x, y, override) {
      if (override) {
        that.movingWithConviction = false
      }

      if (!that.movingWithConviction) {
        if (typeof x === 'undefined') {
          x = that.movingToward[0]
        }

        if (typeof y === 'undefined') {
          y = that.movingToward[1]
        }

        that.movingToward = [ x, y ]

        that.movingWithConviction = false
      }

      // that.resetDirection();
    }

    this.setDirection = function (angle) {
      if (angle >= 360) {
        angle = 360 - angle
      }
      that.direction = angle
      that.movingToward = undefined
    }

    this.resetDirection = function () {
      that.direction = undefined
    }

    this.setMapPositionTargetWithConviction = function (cx, cy) {
      that.setMapPositionTarget(cx, cy)
      that.movingWithConviction = true
      // that.resetDirection();
    }

    this.follow = function (sprite) {
      trackedSpriteToMoveToward = sprite
      // that.resetDirection();
    }

    this.stopFollowing = function () {
      trackedSpriteToMoveToward = false
    }

    this.onHitting = function (objectToHit, callback) {
      if (hittableObjects[objectToHit.id]) {
        return hittableObjects[objectToHit.id].callbacks.push(callback)
      }

      hittableObjects[objectToHit.id] = {
        object: objectToHit,
        callbacks: [ callback ]
      }

      hasHittableObjects = true    
    }

    this.deleteOnNextCycle = function () {
      that.deleted = true
    }

    this.occupiesZIndex = function (z) {
      return zIndexesOccupied.indexOf(z) >= 0
    }

    this.hits = function (other) {
      var thatZ = that.mapPosition[2]
      var otherZ = other.mapPosition[2]

      return (
        that.getLeftHitBoxEdge(thatZ) <= other.getRightHitBoxEdge(otherZ) &&
        that.getRightHitBoxEdge(thatZ) >= other.getLeftHitBoxEdge(otherZ) &&
        that.getTopHitBoxEdge(thatZ) <= other.getBottomHitBoxEdge(otherZ) &&
        that.getBottomHitBoxEdge(thatZ) >= other.getTopHitBoxEdge(otherZ)
      )
    }

    this.isAboveOnCanvas = function (cy) {
      return (that.canvasY + that.height) < cy
    }

    this.isBelowOnCanvas = function (cy) {
      return (that.canvasY) > cy
    }

    return that
  }

  Sprite.createObjects = function createObjects (spriteInfoArray, opts) {
    if (!Array.isArray(spriteInfoArray)) spriteInfoArray = [ spriteInfoArray ]
    opts = Object.merge(opts, {
      rateModifier: 0,
      dropRate: 1,
      position: [0, 0],
      isStatic: false
    }, false, false)

    function createOne (spriteInfo) {
      var position = opts.position
      if (Number.random(100 + opts.rateModifier) <= spriteInfo.dropRate) {
        var sprite = new Sprite(spriteInfo.sprite)
        sprite.setSpeed(0)

        if (Object.isFunction(position)) {
          position = position()
        }

        sprite.setMapPosition(position[0], position[1])

        sprite.isStatic = opts.isStatic

        if (spriteInfo.sprite.hitBehaviour && spriteInfo.sprite.hitBehaviour.skier && opts.player) {
          sprite.onHitting(opts.player, spriteInfo.sprite.hitBehaviour.skier)
        }

        return sprite
      }
    }

    var objects = spriteInfoArray.map(createOne).remove(undefined)

    return objects
  }

  global.sprite = Sprite
})(this)

if (typeof module !== 'undefined') {
  module.exports = this.sprite
}
