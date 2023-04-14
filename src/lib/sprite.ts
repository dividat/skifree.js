import * as Random from 'lib/random'
import * as Physics from 'lib/physics'
import * as Vec2 from 'lib/vec2'
import { config } from 'config'
import GUID from 'lib/guid'

export class Sprite {
  hasHittableObjects: boolean
  hittableObjects: any
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
    this.mapPosition = [0, 0]
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
  }

  getHitBox() {
    let offsets = undefined
    if (this.data.parts[this.part] && this.data.parts[this.part].offsets) {
      offsets = this.data.parts[this.part].offsets
    }
    return {
      top: this.canvasY + (offsets ? offsets[0] * this.height : 0),
      right: this.canvasX + (1 - (offsets ? offsets[1] : 0)) * this.width,
      bottom: this.canvasY + (1 - (offsets ? offsets[2] : 0)) * this.height,
      left: this.canvasX + (offsets ? offsets[3] * this.width : 0)
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
      const hitbox = this.getHitBox()
      dContext.beginPath()
      dContext.strokeStyle = 'red'
      dContext.rect(hitbox.left, hitbox.bottom, hitbox.right - hitbox.left, hitbox.top - hitbox.bottom)
      dContext.stroke()
    }
  }

  setMapPosition(x: number, y: number) {
    this.mapPosition = [x, y]
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

  hits(other: Sprite) {
    const h1 = this.getHitBox()
    const h2 = other.getHitBox()

    return !(
      h1.left > h2.right ||
      h1.right < h2.left ||
      h1.top > h2.bottom ||
      h1.bottom < h2.top
    )
  }

  hitsLandingArea(other: Sprite) {
    if (this.data.name === 'jump' && other.data.name !== 'thickSnow' && other.data.name !== 'thickerSnow') {
      // Obtained experimentally by increasing object drop rates
      const sideWidth = 150
      const jumpingH = 1200
      const landingH = 500

      const h1 = this.getHitBox()
      const h2 = other.getHitBox()

      return !(
        h2.left > (h1.right + sideWidth) ||
        h2.right < (h1.left - sideWidth) ||
        h2.top > (h1.bottom + jumpingH + landingH) ||
        h2.bottom < (h1.top + jumpingH)
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
