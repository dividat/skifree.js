import * as Vec2 from 'lib/vec2'
import * as Canvas from 'canvas'
import * as Random from 'lib/random'
import * as Convergence from 'lib/convergence'
import { config } from 'config'
import { Skier } from 'lib/skier'
import { Monster } from 'lib/monster'
import { Sprite, hitBoxToCanvas, projectX, projectY } from 'lib/sprite'
import { spriteInfo } from 'spriteInfo'
import { Snowboarder } from 'lib/snowboarder'

export function Game (mainCanvas: HTMLCanvasElement, skier: Skier) {
  const afterCycleCallbacks: Array<any> = []

  let sprites = new Array<Sprite>()
  let paused = false
  let runningTime = 0
  let lastStepAt: number | undefined = undefined
  let zoom = config.zoom.max

  this.addObject = (sprite: Sprite) => {
    sprites.push(sprite)
  }

  this.canAddObject = (candidate: Sprite) => {
    // Determine graphical properties to enable hit check
    if (candidate.data.parts.main !== undefined) {
      candidate.determineNextFrame('main')
    }

    return !sprites.some((existing: Sprite) => {
      if (existing.hits({ sprite: candidate, forPlacement: true })) {
        return true
      } else {
        const jumpsTakenIds = skier.jumps.map(j => j.spriteId)
        return existing.hitsLandingArea(candidate, jumpsTakenIds)
      }
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
      this.addObjects(createObjects(sprites, dt, skier, this.canAddObject))
      randomlySpawnNPC(skier, this.spawnBoarder, config.snowboarder.dropRate)
      if (skier.downhillMetersTravelled() > config.monster.distanceThresholdMeters && !this.hasObject('monster')) {
        randomlySpawnNPC(skier, this.spawnMonster, config.monster.dropRate)
      }
    }

    skier.cycle(dt)

    sprites.forEach((sprite: Sprite, i: number) => {
      if (sprite.canBeDeleted(skier.pos)) {
        delete sprites[i]
      } else {
        sprite.cycle(dt)
      }
    })

    // Check collisions
    sprites.forEach((sprite: Sprite) => {
      if (skier.hits({ sprite, forPlacement: false })) {
        switch (sprite.data.name) {
          case 'smallTree': 
          case 'tallTree':
          case 'rock':
          case 'snowboarder':
            skier.hasHitObstacle(sprite)
            break
          case 'monster':
            monsterEatsSkier(sprite as Monster, skier)
            break
          case 'jump':
            skier.hasHitJump(sprite)
            break
          default:
            break
        }
      }
    })

    zoom = Convergence.converge({
      from: zoom,
      to: Math.max(1, config.zoom.max - skier.confidenceBoost * (config.zoom.max - config.zoom.min)),
      time: config.zoom.convergenceDuration,
      dt
    })

    afterCycleCallbacks.forEach((c: any) => c())
  }

  this.spawnBoarder = () => {
    const newBoarder = new Snowboarder(skier, spriteInfo.snowboarder)

    const { x, y } = Random.bool()
      ? Canvas.getRandomMapPositionAboveViewport(skier.pos)
      : Canvas.getRandomMapPositionBelowViewport(skier.pos)
    newBoarder.pos = { x, y }

    newBoarder.movingToward = Canvas.getRandomMapPositionBelowViewport(skier.pos)

    this.addObject(newBoarder)
  }

  this.spawnMonster = () => {
    const newMonster = new Monster(spriteInfo.monster, skier)
    const randomPosition = Canvas.getRandomMapPositionAboveViewport(skier.pos)
    newMonster.pos = randomPosition
    newMonster.follow(skier)

    this.addObject(newMonster)
  }

  this.draw = () => {
    Canvas.context.clearRect(0, 0, mainCanvas.width, mainCanvas.height)

    const allSprites = sprites.slice() // Clone
    allSprites.push(skier)
    allSprites.sort(sortFromBackToFront)
    allSprites.forEach((object: Sprite) => object.draw(skier.pos, 'main', zoom))

    if (config.debug) {
      this.drawDebug(allSprites)
    }
  }

  this.drawDebug = (allSprites: Array<Sprite>) => {
    Canvas.context.fillText(`confidence boost: ${skier.confidenceBoost.toFixed(2)}`, Canvas.width * 0.02, Canvas.height * 0.20)
    Canvas.context.fillText(`speed: ${Vec2.length(skier.speed).toFixed(2)}`, Canvas.width * 0.02, Canvas.height * 0.22)
    Canvas.context.fillText(`zoom: ${zoom.toFixed(2)}`, Canvas.width * 0.02, Canvas.height * 0.24)
    Canvas.context.fillText(`distance travelled: ${skier.downhillMetersTravelled().toFixed(2)}`, Canvas.width * 0.02, Canvas.height * 0.26)

    allSprites.forEach(sprite => {
      // Hitbox
      sprite.getHitBoxes().forEach(h => {
        const ch = hitBoxToCanvas(skier.pos, h)
        Canvas.context.beginPath()
        Canvas.context.strokeStyle = 'red'
        Canvas.context.rect(
          projectX(zoom, ch.left),
          projectY(zoom, ch.bottom),
          (ch.right - ch.left) * zoom,
          (ch.top - ch.bottom) * zoom)
        Canvas.context.stroke()
      })

      // Landing area
      const jumpsTakenIds = skier.jumps.map(j => j.spriteId)
      let lhb = sprite.landingHitBox(jumpsTakenIds)
      if (lhb !== undefined) {
        lhb = hitBoxToCanvas(skier.pos, lhb)
        Canvas.context.beginPath()
        Canvas.context.strokeStyle = 'green'
        Canvas.context.rect(
          projectX(zoom, lhb.left),
          projectY(zoom, lhb.bottom),
          (lhb.right - lhb.left) * zoom,
          (lhb.top - lhb.bottom) * zoom)
        Canvas.context.stroke()
      }
    })
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
    sprites = new Array<Sprite>()
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
    return sprites.some((obj: Sprite) => {
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
    const aBottom = a.pos.y + a.height
    const bBottom = b.pos.y + b.height
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
  { sprite: spriteInfo.smallTree, dropRate: config.dropRate.smallTree },
  { sprite: spriteInfo.tallTree, dropRate: config.dropRate.tallTree },
  { sprite: spriteInfo.thickSnow, dropRate: config.dropRate.thickSnow },
  { sprite: spriteInfo.thickerSnow, dropRate: config.dropRate.thickerSnow },
  { sprite: spriteInfo.rock, dropRate: config.dropRate.rock },
  { sprite: spriteInfo.jump, dropRate: config.dropRate.jump },
]

function createObjects(sprites: Array<Sprite>, dt: number, skier: Skier, canAddObject: (sprite: any) => boolean) {
  const dropRateFactor = 150 * skier.speed.y * dt / Canvas.diagonal

  const sideTrees = [ Canvas.getRandomSideMapPositionBelowViewport(skier.pos) ]
    .filter(_ => {
      const random = Random.int({ min: 0, max: 1000 }) + 0.00001
      return random < dropRateFactor * config.dropRate.side.tallTree
    })
    .map(pos => {
      const sprite = new Sprite(spriteInfo.tallTree)
      sprite.pos = pos
      return sprite
    })

  const skierDirectionObjects = [ undefined ]
    .filter(_ => {
      const random = Random.int({ min: 0, max: 1000 }) + 0.00001
      return skier.speed !== Vec2.zero && random < dropRateFactor * config.dropRate.skierDirection.any
    })
    .map(_ => {
      const sprite = new Sprite(randomObstacle())
      const { y } = Canvas.getRandomMapPositionBelowViewport(skier.pos)
      const x = skier.pos.x + skier.speed.x / skier.speed.y * (y - skier.pos.y)
      sprite.pos = { x, y }
      return sprite
    })

  const centeredObjects = spawnableSprites
    .filter((spriteInfo: any) => {
      const random = Random.int({ min: 0, max: 1000 }) + 0.00001
      return random < dropRateFactor * spriteInfo.dropRate
    })
    .map((spriteInfo: any) => {
      const sprite = new Sprite(spriteInfo.sprite)
      sprite.pos = Canvas.getRandomMapPositionBelowViewport(skier.pos)
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
    return spriteInfo.tallTree
  } else if (r == 2) {
    return spriteInfo.smallTree
  } else {
    return spriteInfo.rock
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
        monster.movingToward = randomPositionAbove
        monster.movingTowardSpeed /= 2
      }
    })

    // @ts-ignore
    window.PlayEGI.motor('negative')
  }
}
