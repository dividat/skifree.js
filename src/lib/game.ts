import { Skier } from 'lib/skier'
import { Sprite } from 'lib/sprite'
import { SpriteArray } from 'lib/spriteArray'

export function Game (mainCanvas: any, skier: Skier) {
  const dContext: any = mainCanvas.getContext('2d')
  const beforeCycleCallbacks: Array<any> = []
  const afterCycleCallbacks: Array<any> = []

  let objects: SpriteArray = new SpriteArray()
  let paused: boolean = false
  let runningTime: number = 0
  let lastStepAt: number | undefined = undefined

  this.addObject = ({ sprite, shouldAvoidCollisions, type }: any) => {
    // Determine graphical properties to enable hit check
    if (sprite.data.parts.main !== undefined) {
      sprite.determineNextFrame(dContext, 'main')
    }

    if (type !== undefined) {
      objects.onPush(obj => {
        if (obj.data && obj.data.hitBehaviour[type]) {
          obj.onHitting(sprite, obj.data.hitBehaviour[type])
        }
      }, true)
    }

    if (!shouldAvoidCollisions || this.canAddObject(sprite)) {
      objects.push(sprite)
    }
  }

  this.canAddObject = (sprite: Sprite) => {
    return !objects.some((other: any) => {
      const b = other.hitsLandingArea(sprite)
      return other.hits(sprite) || other.hitsLandingArea(sprite)
    })
  }

  this.addObjects = (sprites: any, shouldAvoidCollisions: boolean) => {
    sprites.forEach((sprite: Sprite) =>
      this.addObject({ sprite, shouldAvoidCollisions })
    )
  }

  this.beforeCycle = (callback: any) => {
    beforeCycleCallbacks.push(callback)
  }

  this.afterCycle = (callback: any) => {
    afterCycleCallbacks.push(callback)
  }

  dContext.followSprite(skier)

  this.cycle = (dt: number) => {
    beforeCycleCallbacks.forEach((c: any) => c())

    skier.cycle(dt)

    objects.cull()
    objects.forEach((object: any) => {
      if (object.cycle) {
        object.cycle(dt)
      }
    })

    afterCycleCallbacks.forEach((c: any) => c())
  }

  this.draw = () => {
    dContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height)

    const allObjects = objects.slice() // Clone
    allObjects.push(skier)
    allObjects.sort(sortFromBackToFront)
    allObjects.forEach((object: Sprite) => object.draw(dContext, 'main'))
  }

  this.start = () => {
    this.step()
  }

  this.pause = () => {
    paused = true
    lastStepAt = undefined
  }

  this.resume = () => {
    paused = false
    this.step()
  }

  this.isPaused = () => {
    return paused
  }

  this.getRunningTime = () => {
    return runningTime
  }

  this.reset = () => {
    paused = false
    objects = new SpriteArray()
    // skier.reset()
    this.start()
    runningTime = 0
  }

  this.step = (now: number) => {
    if (paused) return

    let dt = 0
    if (lastStepAt !== undefined) {
      dt = now - lastStepAt
    }
    lastStepAt = now
    runningTime += dt

    this.cycle(dt)
    this.draw()

    requestAnimationFrame(this.step.bind(this))
  }

  this.hasObject = (name: any) => {
    return objects.some((obj: any) => {
      return obj.data.name === name
    })
  }
}

function sortFromBackToFront(a: Sprite, b: Sprite): number {
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
}

function isJumpingSkier(sprite: any) {
  return sprite.data.name === 'skier' && sprite.isJumping
}

function isSnow(sprite: Sprite) {
  return sprite.data.name === 'thickSnow' || sprite.data.name === 'thickerSnow'
}
