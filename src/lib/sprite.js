import * as Random from 'lib/random'
import GUID from 'lib/guid'

export class Sprite {

  constructor(data) {
    this.hasHittableObjects = false
    this.hittableObjects = {}
    this.zIndexesOccupied = [ 0 ]
    this.trackedSpriteToMoveToward
    this.direction = undefined
    this.mapPosition = [0, 0, 0]
    this.id = GUID()
    this.canvasX = 0
    this.canvasY = 0
    this.canvasZ = 0
    this.height = 0
    this.speed = 0
    this.data = data || { parts: {} }
    this.movingToward = [ 0, 0 ]
    this.metresDownTheMountain = 0
    this.movingWithConviction = false
    this.deleted = false
    this.isStatic = false
    this.isMoving = true
    this.part = null

    if (!this.data.parts) {
      this.data.parts = {}
    }

    if (data && data.id) {
      this.id = data.id
    }

    if (data && data.zIndexesOccupied) {
      this.zIndexesOccupied = data.zIndexesOccupied
    }
  }

  getHitBox(forZIndex) {
    if (this.data.hitBoxes) {
      if (data.hitBoxes[forZIndex]) {
        return data.hitBoxes[forZIndex]
      }
    }
    if (this.data.parts[this.part] && this.data.parts[this.part].offsets) {
      return this.data.parts[this.part].offsets
    }
  }

  move(dt) {
    if (!this.isMoving) {
      return
    }

    let currentX = this.mapPosition[0]
    let currentY = this.mapPosition[1]

    // Assume original magic numbers for speed were created for a typical 2013 resolution
    const heightFactor = window.devicePixelRatio * window.innerHeight/800
    // Adjust for FPS different than the 50 FPS assumed by original game
    const lagFactor = (dt || skiCfg.originalFrameInterval)/skiCfg.originalFrameInterval
    const factor = heightFactor * lagFactor

    if (typeof this.direction !== 'undefined') {
      // For this we need to modify the this.direction so it relates to the horizontal
      let d = this.direction - 90
      if (d < 0) d = 360 + d
      currentX += this.getSpeedX() * Math.cos(d * (Math.PI / 180)) * factor
      currentY += this.getSpeedY() * Math.sin(d * Math.PI / 180) * factor
    } else {
      if (typeof this.movingToward[0] !== 'undefined') {
        if (currentX > this.movingToward[0]) {
          currentX -= Math.min(this.getSpeedX() * factor, Math.abs(currentX - this.movingToward[0]))
        } else if (currentX < this.movingToward[0]) {
          currentX += Math.min(this.getSpeedX() * factor, Math.abs(currentX - this.movingToward[0]))
        }
      }

      if (typeof this.movingToward[1] !== 'undefined') {
        if (currentY > this.movingToward[1]) {
          currentY -= Math.min(this.getSpeedY() * factor, Math.abs(currentY - this.movingToward[1]))
        } else if (currentY < this.movingToward[1]) {
          currentY += Math.min(this.getSpeedY() * factor, Math.abs(currentY - this.movingToward[1]))
        }
      }
    }

    this.setMapPosition(currentX, currentY)
  }

  determineNextFrame(dCtx, spriteFrame) {
    this.part = spriteFrame

    const part = this.data.parts[spriteFrame]
    let overridePath = "sprites/" + this.data.name + "-" + spriteFrame + ".png"

    const frames = part.frames
    const fps = part.fps

    if (typeof frames === 'number' && typeof fps === 'number') {
      const deltaT = Math.floor(1000 / fps)
const firstFrameRepetitions = part.delay > 0 ? Math.floor(part.delay / deltaT) : 1

      const frame = Math.max(0, Math.floor(Date.now() / deltaT) % (frames + firstFrameRepetitions) - firstFrameRepetitions) + 1

      overridePath = "sprites/" + this.data.name + "-" + spriteFrame + frame + ".png"
    }

    const img = dCtx.getLoadedImage(overridePath)

    if (!img || !img.complete || img.naturalHeight === 0) {
      this.width = 0
      this.height = 0
      return
    }

    let spriteZoom = 1
    if (typeof this.data.sizeMultiple === 'number') {
      spriteZoom = part.sizeMultiple || this.data.sizeMultiple
    }

    const targetWidth = Math.round(img.naturalWidth * spriteZoom * skiCfg.zoom)
    const targetHeight = Math.round(img.naturalHeight * spriteZoom * skiCfg.zoom)

    this.width = targetWidth
    this.height = targetHeight

    const newCanvasPosition = dCtx.mapPositionToCanvasPosition(this.mapPosition)
    this.setCanvasPosition(newCanvasPosition[0], newCanvasPosition[1])

    return img
  }

  draw(dCtx, spriteFrame) {
    const img = this.determineNextFrame(dCtx, spriteFrame)
    if (img == null) return

    const fr = [0, 0, img.width, img.height]

    dCtx.drawImage(img, fr[0], fr[1], fr[2], fr[3], this.canvasX, this.canvasY, this.width, this.height)

    if (skiCfg.debug) {
      const thbe = this.getTopHitBoxEdge(this.mapPosition[2])
      const bhbe = this.getBottomHitBoxEdge(this.mapPosition[2])
      const lhbe = this.getLeftHitBoxEdge(this.mapPosition[2])
      const rhbe = this.getRightHitBoxEdge(this.mapPosition[2])
      dCtx.moveTo(lhbe, thbe)
      dCtx.lineTo(rhbe, thbe)
      dCtx.lineTo(rhbe, bhbe)
      dCtx.lineTo(lhbe, bhbe)
      dCtx.lineTo(lhbe, thbe)
      dCtx.strokeStyle = 'red'
      dCtx.stroke()
    }
  }

  setMapPosition(x, y, z) {
    if (typeof x === 'undefined') {
      x = this.mapPosition[0]
    }
    if (typeof y === 'undefined') {
      y = this.mapPosition[1]
    }
    if (typeof z === 'undefined') {
      z = this.mapPosition[2]
    } else {
      this.zIndexesOccupied = [ z ]
    }
    this.mapPosition = [x, y, z]
  }

  setCanvasPosition(cx, cy) {
    this.canvasX = cx
    this.canvasY = cy
  }

  getCanvasPositionX() {
    return this.canvasX
  }

  getCanvasPositionY() {
    return this.canvasY
  }

  getLeftHitBoxEdge(zIndex) {
    zIndex = zIndex || 0
    let lhbe = this.getCanvasPositionX()
    if (this.getHitBox(zIndex)) {
      lhbe += this.getHitBox(zIndex)[3] * this.width
    }
    return lhbe
  }

  getTopHitBoxEdge(zIndex) {
    zIndex = zIndex || 0
    let thbe = this.getCanvasPositionY()
    if (this.getHitBox(zIndex)) {
      thbe += this.getHitBox(zIndex)[0] * this.height
    }
    return thbe
  }

  getRightHitBoxEdge(zIndex) {
    zIndex = zIndex || 0

    if (this.getHitBox(zIndex)) {
      return this.canvasX + (1 - this.getHitBox(zIndex)[1]) * this.width
    }

    return this.canvasX + this.width
  }

  getBottomHitBoxEdge(zIndex) {
    zIndex = zIndex || 0

    if (this.getHitBox(zIndex)) {
      return this.canvasY + (1 - this.getHitBox(zIndex)[2]) * this.height
    }

    return this.canvasY + this.height
  }

  getPositionInFrontOf() {
    return [this.canvasX, this.canvasY + this.height]
  }

  setSpeed(s) {
    this.speed = s
    this.speedX = s
    this.speedY = s
  }

  incrementSpeedBy(s) {
    this.speed += s
  }

  getSpeedgetSpeed () {
    return this.speed
  }

  getSpeed() {
    return this.speed
  }

  getSpeedX() {
    return this.speed
  }

  getSpeedY() {
    return this.speed
  }

  setHeight(h) {
    this.height = h
  }

  setWidth(w) {
    this.width = w
  }

  getMapPosition() {
    return this.mapPosition
  }

  setMovingToward(movingToward) {
    this.movingToward = movingToward
  }

  getMovingToward() {
    return this.movingToward
  }

  getMovingTowardOpposite() {
    if (!this.isMoving) {
      return [0, 0]
    }

    const dx = (this.movingToward[0] - this.mapPosition[0])
    const dy = (this.movingToward[1] - this.mapPosition[1])

    const oppositeX = (Math.abs(dx) > 75 ? 0 - dx : 0)
    const oppositeY = -dy

    return [ oppositeX, oppositeY ]
  }

  checkHittableObjects() {
    const that = this

    Object.entries(that.hittableObjects).forEach(([ k, objectData ]) => {
      if (objectData.object.deleted) {
        delete that.hittableObjects[k]
      } else {
        if (objectData.object.hits(that)) {
          objectData.callbacks.forEach(function (callback) {
            callback(that, objectData.object)
          })
        }
      }
    })
  }

  checkOffScreen() {
    // Keep jumps a bit more to prevent creating objects in landing areas
    const deletePoint = this.data.name === 'jump' ? -2000 : 0

    if (this.isStatic && this.isAboveOnCanvas(deletePoint)) {
      this.deleted = true
    }
  }

  cycle(dt) {
    this.checkOffScreen()
    if (this.hasHittableObjects) {
      this.checkHittableObjects()
    }

    if (this.trackedSpriteToMoveToward) {
      this.setMapPositionTarget(this.trackedSpriteToMoveToward.mapPosition[0], this.trackedSpriteToMoveToward.mapPosition[1], true)
    }

    this.move(dt)
  }

  setMapPositionTarget(x, y, override) {
    if (override) {
      this.movingWithConviction = false
    }

    if (!this.movingWithConviction) {
      if (typeof x === 'undefined') {
        x = this.movingToward[0]
      }

      if (typeof y === 'undefined') {
        y = this.movingToward[1]
      }

      this.movingToward = [ x, y ]

      this.movingWithConviction = false
    }

    // this.resetDirection();
  }

  setDirection(angle) {
    if (angle >= 360) {
      angle = 360 - angle
    }
    this.direction = angle
    this.movingToward = undefined
  }

  resetDirection() {
    this.direction = undefined
  }

  setMapPositionTargetWithConviction(cx, cy) {
    this.setMapPositionTarget(cx, cy)
    this.movingWithConviction = true
    // this.resetDirection();
  }

  follow(sprite) {
    this.trackedSpriteToMoveToward = sprite
    // this.resetDirection();
  }

  stopFollowing() {
    this.trackedSpriteToMoveToward = false
  }

  onHitting(objectToHit, callback) {
    if (this.hittableObjects[objectToHit.id]) {
      return this.hittableObjects[objectToHit.id].callbacks.push(callback)
    }

    this.hittableObjects[objectToHit.id] = {
      object: objectToHit,
      callbacks: [ callback ]
    }

    this.hasHittableObjects = true    
  }

  deleteOnNextCycle() {
    this.deleted = true
  }

  occupiesZIndex(z) {
    return this.zIndexesOccupied.indexOf(z) >= 0
  }

  hits(other) {
    const thisZ = this.mapPosition[2]
    const otherZ = other.mapPosition[2]

    return !(
      this.getLeftHitBoxEdge(thisZ) > other.getRightHitBoxEdge(otherZ) ||
      this.getRightHitBoxEdge(thisZ) < other.getLeftHitBoxEdge(otherZ) ||
      this.getTopHitBoxEdge(thisZ) > other.getBottomHitBoxEdge(otherZ) ||
      this.getBottomHitBoxEdge(thisZ) < other.getTopHitBoxEdge(otherZ)
    )
  }

  hitsLandingArea(other) {
    if (this.data.name === 'jump' && other.data.name !== 'thickSnow' && other.data.name !== 'thickerSnow') {
      // Obtained experimentally by increasing object drop rates
      const sideWidth = 150
      const jumpingH = 1200
      const landingH = 500

      const jumpZ = this.mapPosition[2]
      const hittableZ = other.mapPosition[2]

      return !(
        other.getLeftHitBoxEdge(hittableZ) > (this.getRightHitBoxEdge(jumpZ) + sideWidth) ||
        other.getRightHitBoxEdge(hittableZ) < (this.getLeftHitBoxEdge(jumpZ) - sideWidth) ||
        other.getTopHitBoxEdge(hittableZ) > (this.getBottomHitBoxEdge(jumpZ) + jumpingH + landingH) ||
        other.getBottomHitBoxEdge(hittableZ) < (this.getTopHitBoxEdge(jumpZ) + jumpingH)
      )
    } else {
      return false
    }
  }

  isAboveOnCanvas(cy) {
    return (this.canvasY + this.height) < cy
  }

  isBelowOnCanvas(cy) {
    return (this.canvasY) > cy
  }

  isPassable() {
    return Boolean(this.data.isPassable)
  }
}

export function createObjects (spriteInfoArray, opts) {
  if (!Array.isArray(spriteInfoArray)) spriteInfoArray = [ spriteInfoArray ]

  opts = { 
    rateModifier: 0,
    dropRate: 1,
    position: [0, 0],
    isStatic: false,
    ...opts
  }

  const objects = spriteInfoArray
    .map(spriteInfo => createObject(spriteInfo, opts))
    .filter(s => s !== undefined)

  return objects
}

function createObject (spriteInfo, opts) {
  let position = opts.position

  const random = Random.between(1, 100) + opts.rateModifier

  if (random <= spriteInfo.dropRate * opts.player.getSpeedRatio()) {
    const sprite = new Sprite(spriteInfo.sprite)
    sprite.setSpeed(0)

    if (typeof position === 'function') {
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
