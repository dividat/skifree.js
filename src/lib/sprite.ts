import * as Images from 'lib/images' 
import * as Canvas from 'canvas'
import * as Vec2 from 'lib/vec2'
import * as Physics from 'lib/physics'
import { config } from 'config'
import { nextId } from 'lib/id'

interface HitBox {
  top: number
  right: number
  bottom: number
  left: number
}

export function collides(h1: HitBox, h2: HitBox): boolean {
  return !(
    h1.left > h2.right ||
    h1.right < h2.left ||
    h1.top > h2.bottom ||
    h1.bottom < h2.top
  )
}

export function hitBoxToCanvas(center: Vec2.Vec2, h: HitBox): HitBox {
  const topLeft = Canvas.mapPositionToCanvasPosition(center, { x: h.left, y: h.top })
  const bottomRight = Canvas.mapPositionToCanvasPosition(center, { x: h.right, y: h.bottom })

  return {
    top: topLeft.y,
    right: bottomRight.x,
    bottom: bottomRight.y,
    left: topLeft.x
  }
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
  pos: Vec2.Vec2
  id: number
  width: number
  height: number
  data: any
  part: any
  trackedSpriteToMoveToward: Sprite | undefined
  movingToward?: Vec2.Vec2
  movingTowardSpeed: number

  constructor(data: any) {
    this.pos = Vec2.zero,
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
      top: this.pos.y,
      right: this.pos.x + this.width,
      bottom: this.pos.y + this.height,
      left: this.pos.x,
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
        top: this.pos.y + m * h.y,
        right: this.pos.x + m * (h.x + h.width),
        bottom: this.pos.y + m * (h.y + h.height),
        left: this.pos.x + m * h.x,
      }))
    } else {
      return []
    }
  }

  move(time: number, dt: number) {
    if (this.movingToward !== undefined) {
      const speed = Vec2.scale(this.movingTowardSpeed, Vec2.unit(Vec2.sub(this.movingToward, this.pos)))
      this.pos = Physics.newPos({ dt, acceleration: Vec2.zero, speed, pos: this.pos })
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

    return factor * Canvas.diagonal / 18000 / config.spriteSizeReduction
  }

  draw(time: number, center: Vec2.Vec2, spriteFrame: string, zoom: number) {
    const img = this.determineNextFrame(spriteFrame)
    if (img == null) return

    const canvasPos = Canvas.mapPositionToCanvasPosition(center, this.pos)

    const targetX = projectX(zoom, canvasPos.x)
    const targetY = projectY(zoom, canvasPos.y)
    const targetW = this.width * zoom
    const targetH = this.height * zoom

    Canvas.context.drawImage(
      img,
      0, 0, img.width, img.height,
      targetX, targetY, targetW, targetH)
  }

  cycle(time: number, dt: number) {
    if (this.trackedSpriteToMoveToward !== undefined) {
      this.movingToward = this.trackedSpriteToMoveToward.pos
    }

    this.move(time, dt)
  }

  follow(sprite: Sprite) {
    this.trackedSpriteToMoveToward = sprite
  }

  stopFollowing() {
    this.trackedSpriteToMoveToward = undefined
    this.movingToward = undefined
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
      const landingWidth = config.jump.landingWidth(this.width)
      const landingHeight = config.jump.landingHeight(Canvas.height)
      const middleX = this.pos.x + this.width / 2

      return {
        right: middleX + landingWidth / 2,
        left: middleX - landingWidth / 2,
        top: this.pos.y + jumpingHeight - this.height * 5,
        bottom: this.pos.y + jumpingHeight + landingHeight
      }
    }
  }

  canBeDeleted(center: Vec2.Vec2): boolean {
    const jumpingHeight = config.jump.length(Canvas.height)
    const landingHeight = config.jump.landingHeight(Canvas.height)

    // Keep jumps a bit more to prevent creating objects in landing areas
    const deletePoint = (this.data.name === 'jump' ? -jumpingHeight - landingHeight : 0) - this.height

    return Canvas.mapPositionToCanvasPosition(center, this.pos).y < deletePoint
  }
}
