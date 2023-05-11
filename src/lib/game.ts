import * as Vec2 from 'lib/vec2'
import * as Canvas from 'canvas'
import * as Random from 'lib/random'
import { config } from 'config'
import { Skier } from 'lib/skier'
import { Monster } from 'lib/monster'
import { Sprite } from 'lib/sprite'
import { sprites } from 'spriteInfo'
import { Snowboarder } from 'lib/snowboarder'

export function Game (mainCanvas: HTMLCanvasElement, skier: Skier) {
  const afterCycleCallbacks: Array<any> = []

  let objects = new Array<Sprite>()
  let paused = false
  let runningTime = 0
  let lastStepAt: number | undefined = undefined
  let zoom = config.zoom.max

  this.addObject = (sprite: Sprite) => {
    objects.push(sprite)
  }

  this.canAddObject = (sprite: Sprite) => {
    // Determine graphical properties to enable hit check
    if (sprite.data.parts.main !== undefined) {
      sprite.determineNextFrame('main')
    }

    return !objects.some((other: Sprite) => {
      return other.hits({ sprite, forPlacement: true }) || other.hitsLandingArea(sprite)
    })
  }

  this.addObjects = (sprites: Array<Sprite>) => {
    sprites.forEach((sprite: Sprite) => this.addObject(sprite))
  }

  this.afterCycle = (callback: any) => {
    afterCycleCallbacks.push(callback)
  }

  this.cycle = (dt: number) => {
    if (!paused) {
      this.addObjects(createObjects(dt, skier, this.canAddObject))
      randomlySpawnNPC(skier, this.spawnBoarder, config.snowboarder.dropRate)
      if (skier.downhillMetersTravelled() > config.monster.distanceThresholdMeters && !this.hasObject('monster')) {
        randomlySpawnNPC(skier, this.spawnMonster, config.monster.dropRate)
      }
    }

    skier.cycle(dt)

    objects.forEach((object: Sprite, i: number) => {
      if (object.canBeDeleted(skier.pos)) {
        delete objects[i]
      } else {
        object.cycle(dt)
      }
    })

    const targetZoom = Math.max(1, config.zoom.max - skier.confidenceBoost * (config.zoom.max - config.zoom.min))
    zoom = zoom + (targetZoom - zoom) * dt / config.zoom.convergenceDuration

    afterCycleCallbacks.forEach((c: any) => c())
  }

  this.spawnBoarder = () => {
    const newBoarder = new Snowboarder(skier, sprites.snowboarder)

    const [ x, y ] = Random.bool()
      ? Canvas.getRandomMapPositionAboveViewport(skier.pos)
      : Canvas.getRandomMapPositionBelowViewport(skier.pos)
    newBoarder.setMapPosition(x, y)

    const [ tx, ty ] = Canvas.getRandomMapPositionBelowViewport(skier.pos)
    newBoarder.setMapPositionTarget(tx, ty)

    newBoarder.onHitting(skier, sprites.snowboarder.hitBehaviour.skier)
    this.addObject(newBoarder)
  }

  this.spawnMonster = () => {
    const newMonster = new Monster(sprites.monster)
    const randomPosition = Canvas.getRandomMapPositionAboveViewport(skier.pos)
    newMonster.setMapPosition(randomPosition[0], randomPosition[1])
    newMonster.follow(skier)
    newMonster.onHitting(skier, monsterEatsSkier)

    this.addObject(newMonster)
  }

  this.draw = () => {
    Canvas.context.clearRect(0, 0, mainCanvas.width, mainCanvas.height)

    const allObjects = objects.slice() // Clone
    allObjects.push(skier)
    allObjects.sort(sortFromBackToFront)
    allObjects.forEach((object: Sprite) => object.draw(skier.pos, 'main', zoom))
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
    objects = new Array<Sprite>()
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

  this.hasObject = (name: string) => {
    return objects.some((obj: Sprite) => {
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
    const aBottom = a.pos[1] + a.height
    const bBottom = b.pos[1] + b.height
    return aBottom - bBottom
  }
}

function isJumpingSkier(sprite: any) {
  return sprite.data.name === 'skier' && sprite.isJumping()
}

function isSnow(sprite: Sprite) {
  return sprite.data.name === 'thickSnow' || sprite.data.name === 'thickerSnow'
}

const spawnableSprites = [
  { sprite: sprites.smallTree, dropRate: config.dropRate.smallTree },
  { sprite: sprites.tallTree, dropRate: config.dropRate.tallTree },
  { sprite: sprites.thickSnow, dropRate: config.dropRate.thickSnow },
  { sprite: sprites.thickerSnow, dropRate: config.dropRate.thickerSnow },
  { sprite: sprites.rock, dropRate: config.dropRate.rock },
  { sprite: sprites.jump, dropRate: config.dropRate.jump },
]

function createObjects(dt: number, skier: Skier, canAddObject: (sprite: any) => boolean) {
  const dropRateFactor = 150 * skier.speed.y * dt / Canvas.diagonal

  const sideTrees = [ Canvas.getRandomSideMapPositionBelowViewport(skier.pos) ]
    .filter(_ => {
      const random = Random.int({ min: 0, max: 1000 }) + 0.00001
      return random < dropRateFactor * config.dropRate.side.tallTree
    })
    .map(pos => {
      const sprite = new Sprite(sprites.tallTree)
      sprite.setMapPosition(pos[0], pos[1])
      sprite.onHitting(skier, sprites.tallTree.hitBehaviour.skier)
      return sprite
    })

  const skierDirectionObjects = [ undefined ]
    .filter(_ => {
      const random = Random.int({ min: 0, max: 1000 }) + 0.00001
      return skier.speed !== Vec2.zero && random < dropRateFactor * config.dropRate.skierDirection.any
    })
    .map(_ => {
      const sprite = new Sprite(randomObstacle())
      const [ unused, y ] = Canvas.getRandomMapPositionBelowViewport(skier.pos)
      const x = skier.pos[0] + skier.speed.x / skier.speed.y * (y - skier.pos[1])
      sprite.setMapPosition(x, y)
      sprite.onHitting(skier, sprites.tallTree.hitBehaviour.skier)
      return sprite
    })

  const centeredObjects = spawnableSprites
    .filter((spriteInfo: any) => {
      const random = Random.int({ min: 0, max: 1000 }) + 0.00001
      return random < dropRateFactor * spriteInfo.dropRate
    })
    .map((spriteInfo: any) => {
      const sprite = new Sprite(spriteInfo.sprite)

      const [ x, y ] = Canvas.getRandomMapPositionBelowViewport(skier.pos)
      sprite.setMapPosition(x, y)

      if (spriteInfo.sprite.hitBehaviour && spriteInfo.sprite.hitBehaviour.skier) {
        sprite.onHitting(skier, spriteInfo.sprite.hitBehaviour.skier)
      }

      return sprite
    })

  return sideTrees
    .concat(skierDirectionObjects)
    .concat(centeredObjects)
    .filter(sprite => canAddObject(sprite))
}

function randomObstacle() {
  const r =Random.int({ min: 1, max: 3 })
  if (r == 1) {
    return sprites.tallTree
  } else if (r == 2) {
    return sprites.smallTree
  } else {
    return sprites.rock
  }
}

function randomlySpawnNPC(skier: Skier, spawnFunction: () => void, dropRate: number) {
  if (Random.int({ min: 0, max: 1000 }) <= dropRate * skier.speed.y) {
    spawnFunction()
  }
}

function monsterEatsSkier(monster: Monster, skier: Skier) {
  if (monster.eatingStartedAt === undefined) {
    skier.isEaten()
    monster.startEating({
      whenDone: () => {
        monster.stopFollowing()
        const randomPositionAbove = Canvas.getRandomMapPositionAboveViewport(skier.pos)
        monster.setMapPositionTarget(randomPositionAbove[0], randomPositionAbove[1])
      }
    })

    // @ts-ignore
    window.PlayEGI.motor('negative')
  }
}
