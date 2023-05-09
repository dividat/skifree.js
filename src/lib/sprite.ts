import * as Random from 'lib/random'
import * as Physics from 'lib/physics'
import * as Vec2 from 'lib/vec2'
import { config } from 'config'
import { nextId } from 'lib/id'

interface HitBox {
  top: number
  right: number
  bottom: number
  left: number
}

function collides(h1: HitBox, h2: HitBox): boolean {
  return !(
    h1.left > h2.right ||
    h1.right < h2.left ||
    h1.top > h2.bottom ||
    h1.bottom < h2.top
  )
}

const jumpingHeight = Physics.newPos({
  dt: config.skier.jump.duration,
  acceleration: Vec2.zero,
  speed: config.skier.jump.speed,
  pos: Vec2.zero
}).y

const landingHeight = Physics.newPos({
  dt: config.skier.jump.landingDurationAtJumpingSpeed,
  acceleration: Vec2.zero,
  speed: config.skier.jump.speed,
  pos: Vec2.zero
}).y

export class Sprite {
  hittableObjects: any
  trackedSpriteToMoveToward: Sprite | undefined
  mapPosition: Array<number>
  id: number
  canvasX: number
  canvasY: number
  width: number
  height: number
  data: any
  movingToward: Array<number | undefined> | undefined
  metresDownTheMountain: number
  deleted: boolean
  isStatic: boolean
  part: any
  movingTowardSpeed: number

  constructor(data: any) {
    this.hittableObjects = {}
    this.mapPosition = [0, 0]
    this.id = nextId()
    this.canvasX = 0
    this.canvasY = 0
    this.width = 0
    this.height = 0
    this.data = data || { parts: {} }
    this.movingToward = undefined
    this.metresDownTheMountain = 0
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

  contextualHitBoxes(other: Sprite, forPlacement: boolean): Array<HitBox> {
    const groupableSprites = [ 'smallTree', 'tallTree', 'rock' ]

    if (!forPlacement || groupableSprites.includes(this.data.name) && this.data.name === other.data.name) {
      return this.getHitBoxes()
    } else {
      return [ this.getImageBox() ]
    }
  }

  getImageBox(): HitBox {
    return {
      top: this.canvasY - 100,
      right: this.canvasX + this.width + 100,
      bottom: this.canvasY + this.height + 100,
      left: this.canvasX - 100,
    }
  }

  getHitBoxes(): Array<HitBox> {
    let part = this.data.parts[this.part]

    if (part && part.hitBoxes) {
      const hitBoxes = part.hitBoxes
      const spriteReducedSizeFactor = 1 / 3
      const m = this.getSizeMultiple(part) * config.scaling * spriteReducedSizeFactor

      return part.hitBoxes.map((h: any) => ({
        top: this.canvasY + m * h.y,
        right: this.canvasX + m * (h.x + h.width),
        bottom: this.canvasY + m * (h.y + h.height),
        left: this.canvasX + m * h.x
      }))
    } else {
      return []
    }
  }

  move(dt: number) {
    if (this.movingToward !== undefined) {
      let pos = {
        x: this.mapPosition[0],
        y: this.mapPosition[1]
      }

      // Assume original magic numbers for speed were created for a typical 2013 resolution
      const heightFactor = window.devicePixelRatio * window.innerHeight/800
      // Adjust for FPS different than the 50 FPS assumed by original game
      const lagFactor = (dt || config.originalFrameInterval) / config.originalFrameInterval
      const factor = heightFactor * lagFactor

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

      this.setMapPosition(pos.x, pos.y)
    }
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

    const sizeMultiple = this.getSizeMultiple(part)
    const targetWidth = Math.round(img.naturalWidth * sizeMultiple * config.scaling)
    const targetHeight = Math.round(img.naturalHeight * sizeMultiple * config.scaling)

    this.width = targetWidth
    this.height = targetHeight

    const newCanvasPosition = dContext.mapPositionToCanvasPosition(this.mapPosition)
    this.setCanvasPosition(newCanvasPosition[0], newCanvasPosition[1])

    return img
  }

  getSizeMultiple(part: any): number {
    if (typeof part.sizeMultiple === 'number') {
      return part.sizeMultiple
    } else if (typeof this.data.sizeMultiple === 'number') {
      return this.data.sizeMultiple
    } else {
      return 1
    }
  }

  draw(dContext: any, spriteFrame: string, zoom: number) {
    const img = this.determineNextFrame(dContext, spriteFrame)
    if (img == null) return

    const canvasW = dContext.canvas.width
    const canvasH = dContext.canvas.height

    const fx = (x: number): number => (x - canvasW / 2) * zoom + canvasW / 2
    const fy = (y: number): number => y * zoom - config.skier.verticalPosRatio * canvasH * (zoom - 1)


    const targetX = fx(this.canvasX)
    const targetY = fy(this.canvasY)
    const targetW = this.width * zoom
    const targetH = this.height * zoom

    dContext.drawImage(
      img,
      0, 0, img.width, img.height,
      targetX, targetY, targetW, targetH)

    if (config.debug) {
      // Hitbox
      this.getHitBoxes().forEach(h => {
        dContext.beginPath()
        dContext.strokeStyle = 'red'
        dContext.rect(fx(h.left), fy(h.bottom), (h.right - h.left) * zoom, (h.top - h.bottom) * zoom)
        dContext.stroke()
      })

      // Landing area
      const lhb = this.landingHitBox()
      if (lhb !== undefined) {
        dContext.beginPath()
        dContext.strokeStyle = 'green'
        dContext.rect(fx(lhb.left), fy(lhb.bottom), (lhb.right - lhb.left) * zoom, (lhb.top - lhb.bottom) * zoom)
        dContext.stroke()
      }
    }
  }

  setMapPosition(x: number, y: number) {
    this.mapPosition = [x, y]
  }

  setCanvasPosition(cx: number, cy: number) {
    this.canvasX = cx
    this.canvasY = cy
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
        if (objectData.object.hits({ sprite: this, forPlacement: false })) {
          objectData.callbacks.forEach((callback: any) =>
            callback(this, objectData.object)
          )
        }
      }
    })
  }

  checkOffScreen() {
    // Keep jumps a bit more to prevent creating objects in landing areas
    const deletePoint = this.data.name === 'jump' ? -jumpingHeight - landingHeight : 0

    if (this.isStatic && this.isAboveOnCanvas(deletePoint)) {
      this.deleted = true
    }
  }

  cycle(dt: number) {
    this.checkOffScreen()
    this.checkHittableObjects()

    if (this.trackedSpriteToMoveToward) {
      this.setMapPositionTarget(this.trackedSpriteToMoveToward.mapPosition[0], this.trackedSpriteToMoveToward.mapPosition[1], true)
    }

    this.move(dt)
  }

  setMapPositionTarget(x?: number, y?: number, override?: boolean) {
    if (x === undefined && this.movingToward !== undefined) {
      x = this.movingToward[0]
    }

    if (y === undefined && this.movingToward !== undefined) {
      y = this.movingToward[1]
    }

    this.movingToward = [ x, y ]
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
  }

  deleteOnNextCycle() {
    this.deleted = true
  }

  hits({ sprite, forPlacement }: { sprite: Sprite, forPlacement: boolean }) {
    const h1 = this.getImageBox()
    const h2 = sprite.getImageBox()

    // Check first by looking at images box before looking at precise collision using multiple hitboxes
    if (collides(h1, h2)) {
      const h1s = this.contextualHitBoxes(sprite, forPlacement)
      const h2s = sprite.contextualHitBoxes(this, forPlacement)
      return h1s.some(h1 => h2s.some(h2 => collides(h1, h2)))
    }
  }

  hitsLandingArea(other: Sprite) {
    const landingHitBox = this.landingHitBox()

    if (landingHitBox !== undefined && other.data.name !== 'thickSnow' && other.data.name !== 'thickerSnow') {
      return other.getHitBoxes().some(h => collides(h, landingHitBox))
    } else {
      return false
    }
  }

  landingHitBox(): HitBox | undefined {
    if (this.data.name === 'jump') {
      return {
        right: this.canvasX + 2 * this.width,
        left: this.canvasX - this.width,
        top: this.canvasY + jumpingHeight,
        bottom: this.canvasY + jumpingHeight + landingHeight
      }
    }
  }

  isAboveOnCanvas(cy: number) {
    return (this.canvasY + this.height) < cy
  }
}
