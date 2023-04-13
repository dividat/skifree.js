import * as Random from 'lib/random'
import * as Physics from 'lib/physics'
import * as Vec2 from 'lib/vec2'
import { config } from 'config'
import GUID from 'lib/guid'

export class Sprite {
  hasHittableObjects: boolean
  hittableObjects: any
  zIndexesOccupied: Array<number>
  trackedSpriteToMoveToward: Sprite | undefined
  mapPosition: Array<number>
  id: string
  canvasX: number
  canvasY: number
  width: number
  height: number
  data: any
  movingToward: Array<number | undefined> | undefined
  metresDownTheMountain: number
  movingWithConviction: boolean
  deleted: boolean
  isStatic: boolean
  part: any
  movingTowardSpeed: number

  constructor(data: any) {
    this.hasHittableObjects = false
    this.hittableObjects = {}
    this.zIndexesOccupied = [ 0 ]
    this.mapPosition = [0, 0, 0]
    this.id = GUID()
    this.canvasX = 0
    this.canvasY = 0
    this.width = 0
    this.height = 0
    this.data = data || { parts: {} }
    this.movingToward = undefined
    this.metresDownTheMountain = 0
    this.movingWithConviction = false
    this.deleted = false
    this.isStatic = false
    this.part = null
    this.movingTowardSpeed = 0

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

  getHitBox(forZIndex: number) {
    if (this.data.hitBoxes) {
      if (this.data.hitBoxes[forZIndex]) {
        return this.data.hitBoxes[forZIndex]
      }
    }
    if (this.data.parts[this.part] && this.data.parts[this.part].offsets) {
      return this.data.parts[this.part].offsets
    }
  }

  move(dt: number, acceleration?: Vec2.Vec2, speed?: Vec2.Vec2) {
    let pos = {
      x: this.mapPosition[0],
      y: this.mapPosition[1]
    }

    // Assume original magic numbers for speed were created for a typical 2013 resolution
    const heightFactor = window.devicePixelRatio * window.innerHeight/800
    // Adjust for FPS different than the 50 FPS assumed by original game
    const lagFactor = (dt || config.originalFrameInterval) / config.originalFrameInterval
    const factor = heightFactor * lagFactor

    if (acceleration !== undefined && speed !== undefined) {
      pos = Physics.newPos({
        dt,
        acceleration,
        speed,
        pos
      })
    } else if (this.movingToward !== undefined) {
      if (this.movingToward[0] !== undefined) {
        if (pos.x > this.movingToward[0]) {
          pos.x -= Math.min(this.movingTowardSpeed * factor, Math.abs(pos.x - this.movingToward[0]))
        } else if (pos.x < this.movingToward[0]) {
          pos.x += Math.min(this.movingTowardSpeed * factor, Math.abs(pos.x - this.movingToward[0]))
        }
      }

      if (this.movingToward[1] !== undefined) {
        if (pos.y > this.movingToward[1]) {
          pos.y -= Math.min(this.movingTowardSpeed * factor, Math.abs(pos.y - this.movingToward[1]))
        } else if (pos.y < this.movingToward[1]) {
          pos.y += Math.min(this.movingTowardSpeed * factor, Math.abs(pos.y - this.movingToward[1]))
        }
      }
    }

    this.setMapPosition(pos.x, pos.y)
  }

  determineNextFrame(dContext: any, spriteFrame: string) {
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

    const img = dContext.getLoadedImage(overridePath)

    if (!img || !img.complete || img.naturalHeight === 0) {
      this.width = 0
      this.height = 0
      return
    }

    let spriteZoom = 1
    if (typeof this.data.sizeMultiple === 'number') {
      spriteZoom = part.sizeMultiple || this.data.sizeMultiple
    }

    const targetWidth = Math.round(img.naturalWidth * spriteZoom * config.zoom)
    const targetHeight = Math.round(img.naturalHeight * spriteZoom * config.zoom)

    this.width = targetWidth
    this.height = targetHeight

    const newCanvasPosition = dContext.mapPositionToCanvasPosition(this.mapPosition)
    this.setCanvasPosition(newCanvasPosition[0], newCanvasPosition[1])

    return img
  }

  draw(dContext: any, spriteFrame: string) {
    const img = this.determineNextFrame(dContext, spriteFrame)
    if (img == null) return

    dContext.drawImage(img, 0, 0, img.width, img.height, this.canvasX, this.canvasY, this.width, this.height)

    if (config.debug) {
      const top = this.getTopHitBoxEdge()
      const bottom = this.getBottomHitBoxEdge()
      const left = this.getLeftHitBoxEdge()
      const right = this.getRightHitBoxEdge()
      dContext.beginPath()
      dContext.strokeStyle = 'red'
      dContext.rect(left, bottom, right - left, top - bottom)
      dContext.stroke()
    }
  }

  setMapPosition(x: number, y: number, z?: number) {
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

  setCanvasPosition(cx: number, cy: number) {
    this.canvasX = cx
    this.canvasY = cy
  }

  getCanvasPositionX() {
    return this.canvasX
  }

  getCanvasPositionY() {
    return this.canvasY
  }

  getLeftHitBoxEdge() {
    const zIndex = this.mapPosition[2]
    let lhbe = this.getCanvasPositionX()
    if (this.getHitBox(zIndex)) {
      lhbe += this.getHitBox(zIndex)[3] * this.width
    }
    return lhbe
  }

  getTopHitBoxEdge() {
    const zIndex = this.mapPosition[2]
    let thbe = this.getCanvasPositionY()
    if (this.getHitBox(zIndex)) {
      thbe += this.getHitBox(zIndex)[0] * this.height
    }
    return thbe
  }

  getRightHitBoxEdge() {
    const zIndex = this.mapPosition[2]
    if (this.getHitBox(zIndex)) {
      return this.canvasX + (1 - this.getHitBox(zIndex)[1]) * this.width
    }
    return this.canvasX + this.width
  }

  getBottomHitBoxEdge() {
    const zIndex = this.mapPosition[2]
    if (this.getHitBox(zIndex)) {
      return this.canvasY + (1 - this.getHitBox(zIndex)[2]) * this.height
    }
    return this.canvasY + this.height
  }

  getPositionInFrontOf() {
    return [this.canvasX, this.canvasY + this.height]
  }

  setScalarSpeed(s: number) {
    this.movingTowardSpeed = s
  }

  setHeight(h: number) {
    this.height = h
  }

  setWidth(w: number) {
    this.width = w
  }

  getMapPosition() {
    return this.mapPosition
  }

  setMovingToward(movingToward: Array<number>) {
    this.movingToward = movingToward
  }

  setMovingTowardSpeed(movingTowardSpeed: number) {
    this.movingTowardSpeed = movingTowardSpeed
  }

  getMovingToward() {
    return this.movingToward
  }

  checkHittableObjects() {
    Object.entries(this.hittableObjects).forEach(([ k, objectData ]: any) => {
      if (objectData.object.deleted) {
        delete this.hittableObjects[k]
      } else {
        if (objectData.object.hits(this)) {
          objectData.callbacks.forEach((callback: any) =>
            callback(this, objectData.object)
          )
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

  cycle(dt: number) {
    this.checkOffScreen()
    if (this.hasHittableObjects) {
      this.checkHittableObjects()
    }

    if (this.trackedSpriteToMoveToward) {
      this.setMapPositionTarget(this.trackedSpriteToMoveToward.mapPosition[0], this.trackedSpriteToMoveToward.mapPosition[1], true)
    }

    this.move(dt)
  }

  setMapPositionTarget(x?: number, y?: number, override?: boolean) {
    if (override) {
      this.movingWithConviction = false
    }

    if (!this.movingWithConviction) {
      if (x === undefined && this.movingToward !== undefined) {
        x = this.movingToward[0]
      }

      if (y === undefined && this.movingToward !== undefined) {
        y = this.movingToward[1]
      }

      this.movingToward = [ x, y ]

      this.movingWithConviction = false
    }
  }

  setMapPositionTargetWithConviction(cx: number, cy: number) {
    this.setMapPositionTarget(cx, cy)
    this.movingWithConviction = true
  }

  follow(sprite: Sprite) {
    this.trackedSpriteToMoveToward = sprite
  }

  stopFollowing() {
    this.trackedSpriteToMoveToward = undefined
  }

  onHitting(objectToHit: any, callback: any) {
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

  occupiesZIndex(z: number) {
    return this.zIndexesOccupied.indexOf(z) >= 0
  }

  hits(other: Sprite) {
    return !(
      this.getLeftHitBoxEdge() > other.getRightHitBoxEdge() ||
      this.getRightHitBoxEdge() < other.getLeftHitBoxEdge() ||
      this.getTopHitBoxEdge() > other.getBottomHitBoxEdge() ||
      this.getBottomHitBoxEdge() < other.getTopHitBoxEdge()
    )
  }

  hitsLandingArea(other: Sprite) {
    if (this.data.name === 'jump' && other.data.name !== 'thickSnow' && other.data.name !== 'thickerSnow') {
      // Obtained experimentally by increasing object drop rates
      const sideWidth = 150
      const jumpingH = 1200
      const landingH = 500

      return !(
        other.getLeftHitBoxEdge() > (this.getRightHitBoxEdge() + sideWidth) ||
        other.getRightHitBoxEdge() < (this.getLeftHitBoxEdge() - sideWidth) ||
        other.getTopHitBoxEdge() > (this.getBottomHitBoxEdge() + jumpingH + landingH) ||
        other.getBottomHitBoxEdge() < (this.getTopHitBoxEdge() + jumpingH)
      )
    } else {
      return false
    }
  }

  isAboveOnCanvas(cy: number) {
    return (this.canvasY + this.height) < cy
  }

  isBelowOnCanvas(cy: number) {
    return (this.canvasY) > cy
  }

  isPassable() {
    return Boolean(this.data.isPassable)
  }
}

export function createObjects (spriteInfoArray: any, opts: any) {
  if (!Array.isArray(spriteInfoArray)) spriteInfoArray = [ spriteInfoArray ]

  opts = {
    rateModifier: 0,
    dropRate: 1,
    position: [0, 0],
    isStatic: false,
    ...opts
  }

  const objects = spriteInfoArray
    .map((spriteInfo: any) => createObject(spriteInfo, opts))
    .filter((s: any) => s !== undefined)

  return objects
}

function createObject (spriteInfo: any, opts: any) {
  let position = opts.position

  const random = Random.between(0, 100) + opts.rateModifier

  if (random <= spriteInfo.dropRate * opts.skier.getSpeedRatio()) {
    const sprite = new Sprite(spriteInfo.sprite)

    if (typeof position === 'function') {
      position = position()
    }

    sprite.setMapPosition(position[0], position[1])

    sprite.isStatic = opts.isStatic

    if (spriteInfo.sprite.hitBehaviour && spriteInfo.sprite.hitBehaviour.skier && opts.skier) {
      sprite.onHitting(opts.skier, spriteInfo.sprite.hitBehaviour.skier)
    }

    return sprite
  }
}
