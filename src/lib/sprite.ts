import * as Images from 'lib/images' 
import * as Canvas from 'canvas'
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

export function hitBoxToCanvas(center: [ number, number ], h: HitBox): HitBox {
  const [ left, top ] = Canvas.mapPositionToCanvasPosition(center, [ h.left, h.top ])
  const [ right, bottom ] = Canvas.mapPositionToCanvasPosition(center, [ h.right, h.bottom ])
  return { top, right, bottom, left }
}

export function projectX(zoom: number, x: number): number {
  return (x - Canvas.width / 2) * zoom + Canvas.width / 2
}

export function projectY(zoom: number, y: number): number {
  return y * zoom - config.skier.verticalPosRatio * Canvas.height * (zoom - 1)
}

interface PositionTarget {
  x?: number,
  y?: number,
}

export class Sprite {
  hittableObjects: any
  pos: [ number, number ]
  id: number
  width: number
  height: number
  data: any
  part: any
  trackedSpriteToMoveToward: Sprite | undefined
  movingToward: Array<number | undefined> | undefined
  movingTowardSpeed: number

  constructor(data: any) {
    this.hittableObjects = {}
    this.pos = [0, 0]
    this.id = nextId()
    this.width = 0
    this.height = 0
    this.data = data || { parts: {} }
    this.movingToward = undefined
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
    const box = {
      top: this.pos[1],
      right: this.pos[0] + this.width,
      bottom: this.pos[1] + this.height,
      left: this.pos[0],
    }

    return this.data.name === 'jump'
      ? { ...box, top: box.top - config.jump.freeAreaOnTop(this.height) }
      : box
  }

  getHitBoxes(): Array<HitBox> {
    let part = this.data.parts[this.part]

    if (part && part.hitBoxes) {
      const hitBoxes = part.hitBoxes
      const m = config.spriteSizeReduction * this.getSizeMultiple(part)

      return part.hitBoxes.map((h: any) => ({
        top: this.pos[1] + m * h.y,
        right: this.pos[0] + m * (h.x + h.width),
        bottom: this.pos[1] + m * (h.y + h.height),
        left: this.pos[0] + m * h.x,
      }))
    } else {
      return []
    }
  }

  move(dt: number) {
    if (this.movingToward !== undefined) {
      let pos = {
        x: this.pos[0],
        y: this.pos[1]
      }

      // Assume original magic numbers for speed were created for a typical 2013 resolution
      // Adjust for FPS different than the 50 FPS assumed by original game
      const lagFactor = dt / config.originalFrameInterval
      const factor = lagFactor

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

  determineNextFrame(spriteFrame: string) {
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

    const img = Images.getLoaded(overridePath)

    if (!img || !img.complete || img.height === 0) {
      this.width = 0
      this.height = 0
      return
    }

    const sizeMultiple = this.getSizeMultiple(part)

    this.width = Math.round(img.width * sizeMultiple)
    this.height = Math.round(img.height * sizeMultiple)

    return img
  }

  getSizeMultiple(part: any): number {
    let factor
    if (typeof part.sizeMultiple === 'number') {
      factor = part.sizeMultiple
    } else if (typeof this.data.sizeMultiple === 'number') {
      factor = this.data.sizeMultiple
    } else {
      factor = 1
    }

    return factor * Canvas.diagonal / 16000 / config.spriteSizeReduction
  }

  draw(center: [ number, number ], spriteFrame: string, zoom: number) {
    const img = this.determineNextFrame(spriteFrame)
    if (img == null) return

    const [ canvasX, canvasY ] = Canvas.mapPositionToCanvasPosition(center, this.pos)

    const targetX = projectX(zoom, canvasX)
    const targetY = projectY(zoom, canvasY)
    const targetW = this.width * zoom
    const targetH = this.height * zoom

    Canvas.context.drawImage(
      img,
      0, 0, img.width, img.height,
      targetX, targetY, targetW, targetH)
  }

  setMapPosition(x: number, y: number) {
    this.pos = [x, y]
  }

  getMapPosition() {
    return this.pos
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

  cycle(dt: number) {
    this.checkHittableObjects()

    if (this.trackedSpriteToMoveToward) {
      this.setMapPositionTarget({
        x: this.trackedSpriteToMoveToward.pos[0],
        y: this.trackedSpriteToMoveToward.pos[1]
      })
    }

    this.move(dt)
  }

  setMapPositionTarget({ x, y }: PositionTarget) {
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

  hitsLandingArea(other: Sprite, jumpsTakenIds: Array<number>) {
    const landingHitBox = this.landingHitBox(jumpsTakenIds)

    if (landingHitBox !== undefined && other.data.name !== 'thickSnow' && other.data.name !== 'thickerSnow') {
      return other.getHitBoxes().some(h => collides(h, landingHitBox))
    } else {
      return false
    }
  }

  landingHitBox(jumpsTakenIds: Array<number>): HitBox | undefined {
    if (jumpsTakenIds.includes(this.id)) {
      const jumpingHeight = config.jump.length(Canvas.height)
      const landingHeight = config.jump.landingHeight(Canvas.height)

      return {
        right: this.pos[0] + 2 * this.width,
        left: this.pos[0] - this.width,
        top: this.pos[1] + jumpingHeight - this.height * 5,
        bottom: this.pos[1] + jumpingHeight + landingHeight
      }
    }
  }

  canBeDeleted(center: [ number, number ]): boolean {
    const jumpingHeight = config.jump.length(Canvas.height)
    const landingHeight = config.jump.landingHeight(Canvas.height)

    // Keep jumps a bit more to prevent creating objects in landing areas
    const deletePoint = (this.data.name === 'jump' ? -jumpingHeight - landingHeight : 0) - this.height

    return Canvas.mapPositionToCanvasPosition(center, this.pos)[1] < deletePoint
  }
}
