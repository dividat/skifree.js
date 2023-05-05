import * as Vec2 from 'lib/vec2'
import { config } from 'config'
import { Skier } from 'lib/skier'
import { Sprite } from 'lib/sprite'
import { SpriteArray } from 'lib/spriteArray'

export function Game (mainCanvas: any, skier: Skier) {
  const dContext: any = mainCanvas.getContext('2d')
  const beforeCycleCallbacks: Array<any> = []
  const afterCycleCallbacks: Array<any> = []

  let objects = new SpriteArray()
  let paused = false
  let runningTime = 0
  let lastStepAt: number | undefined = undefined
  let zoom = config.zoom.max

  this.addObject = (sprite: any) => {
    objects.push(sprite)
  }

  this.canAddObject = (sprite: Sprite) => {
    // Determine graphical properties to enable hit check
    if (sprite.data.parts.main !== undefined) {
      sprite.determineNextFrame(dContext, 'main')
    }

    return !objects.some((other: any) => {
      return other.hits({ sprite, forPlacement: true }) || other.hitsLandingArea(sprite)
    })
  }

  this.addObjects = (sprites: Array<any>) => {
    sprites.forEach((sprite: Sprite) => this.addObject(sprite))
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

    const targetZoom = Math.max(1, config.zoom.max - skier.confidenceBoost * (config.zoom.max - config.zoom.min))
    zoom = zoom + (targetZoom - zoom) * dt / config.zoom.convergenceDuration

    afterCycleCallbacks.forEach((c: any) => c())
  }

  this.draw = () => {
    dContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height)

    const allObjects = objects.slice() // Clone
    allObjects.push(skier)
    allObjects.sort(sortFromBackToFront)
    allObjects.forEach((object: Sprite) => object.draw(dContext, 'main', zoom))
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
    const aBottom = a.canvasY + a.height
    const bBottom = b.canvasY + b.height
    return aBottom - bBottom
  }
}

function isJumpingSkier(sprite: any) {
  return sprite.data.name === 'skier' && sprite.isJumping()
}

function isSnow(sprite: Sprite) {
  return sprite.data.name === 'thickSnow' || sprite.data.name === 'thickerSnow'
}
