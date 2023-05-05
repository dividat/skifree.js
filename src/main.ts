import 'lib/canvasRenderingContext2DExtensions'
import * as Random from 'lib/random'
import * as Vec2 from 'lib/vec2'
import * as Senso from 'senso'
import { config } from 'config'
import { Game } from 'lib/game'
import { Monster } from 'lib/monster'
import { Skier, downDirection } from 'lib/skier'
import { Snowboarder } from 'lib/snowboarder'
import { Sprite } from 'lib/sprite'
import { sprites } from 'spriteInfo'

const mainCanvas: any = document.getElementById('skifree-canvas')
const dContext: any = mainCanvas.getContext('2d')
const infoBoxControls: string = 'Use the mouse or WASD to control the skier'
const imageSources: Array<string> = []
;(function () {
  for (const key in sprites) {
      for (const partKey in sprites[key].parts) {
          // Skip monkey patching debris
          if (partKey === 'superior') continue

          const part = sprites[key].parts[partKey]

          if (part.frames > 0) {
              for (let i = 1; i <= part.frames; i++) {
                  imageSources.push("sprites/" + key + "-" + partKey + i + ".png")
              }
	  } else {
              imageSources.push("sprites/" + key + "-" + partKey + ".png")
	  }
      }
  }
})()

function loadImages(sources: Array<string>, next: any) {
  let loaded = 0
  const images = {}

  const indicator: any = document.getElementById('loading-indicator')
  if (indicator !== null) {
    indicator.max = sources.length
  }

  const finish = () => {
    loaded += 1
    if (indicator !== null) {
      indicator.value = loaded
    }

    if (loaded === sources.length) {
      const loader = document.getElementById('loader')
      if (loader !== null) {
        loader.classList.add('done')
      }
      next(images)
    }
  }

  sources.forEach((src: string) => {
    const im = new Image()
    im.onload = finish
    im.onerror = finish
    im.src = src
    dContext.storeLoadedImage(src, im)
  })
}

function monsterEatsSkier(monster: Monster, skier: Skier) {
  if (monster.eatingStartedAt === undefined) {
    skier.isEaten()
    monster.startEating({
      whenDone: () => {
        monster.stopFollowing()
        const randomPositionAbove = dContext.getRandomMapPositionAboveViewport()
        monster.setMapPositionTarget(randomPositionAbove[0], randomPositionAbove[1])
        // Delete some time after it moved off screen
        setTimeout(() => monster.deleteOnNextCycle(), 5000)
      }
    })

    // @ts-ignore
    window.PlayEGI.motor('negative')
  }
}

function startNeverEndingGame(images: Array<any>) {
  let skier: Skier
  let startSign: Sprite
  let cottage: Sprite
  let game: any

  const detectEnd = () => {
    if (!game.isPaused()) {
      // @ts-ignore
      window.PlayEGI.finish({
        duration: { type: 'Duration', value: config.duration },
        distance: { type: 'RawInt', value: Math.round(skier.pixelsTravelled / config.pixelsPerMeter) },
        jumps: { type: 'RawInt', value: skier.jumps.length },
        collisions: { type: 'RawInt', value: skier.collisions.length },
      })
    }
  }

  function randomlySpawnNPC(spawnFunction: () => void, dropRate: number) {
    const rateModifier = Math.max(800 - mainCanvas.width / window.devicePixelRatio, 0)
    if (Random.between(0, 1000 + rateModifier) <= dropRate * skier.speed.y) {
      spawnFunction()
    }
  }

  function spawnMonster () {
    const newMonster = new Monster(sprites.monster)
    const randomPosition = dContext.getRandomMapPositionAboveViewport()
    newMonster.setMapPosition(randomPosition[0], randomPosition[1])
    newMonster.follow(skier)
    newMonster.onHitting(skier, monsterEatsSkier)

    game.addObject(newMonster)
  }

  function spawnBoarder () {
    const newBoarder = new Snowboarder(sprites.snowboarder, dContext)
    const randomPositionAbove = dContext.getRandomMapPositionAboveViewport()
    const randomPositionBelow = dContext.getRandomMapPositionBelowViewport()
    newBoarder.setMapPosition(randomPositionAbove[0], randomPositionAbove[1])
    newBoarder.setMapPositionTarget(randomPositionBelow[0], randomPositionBelow[1])
    newBoarder.onHitting(skier, sprites.snowboarder.hitBehaviour.skier)

    game.addObject(newBoarder)
  }

  skier = new Skier(mainCanvas, sprites.skier)
  skier.setMapPosition(0, 0)
  skier.setMapPositionTarget(0, -10)

  // @ts-ignore
  game = new Game(mainCanvas, skier)

  skier.determineNextFrame(dContext, 'east')
  startSign = new Sprite(sprites.signStart)
  game.addObject(startSign)
  startSign.setMapPosition(-0.4 * skier.width, -0.1 * skier.height)

  cottage = new Sprite(sprites.cottage)
  game.addObject(cottage)
  cottage.setMapPosition(0.7 * skier.width, -1.2 * skier.height)

  dContext.followSprite(skier)

  game.beforeCycle(() => {
    if (!game.isPaused()) {
      game.addObjects(createObjects(skier, game.canAddObject))
      randomlySpawnNPC(spawnBoarder, config.snowboarder.dropRate)
      if (skier.pixelsTravelled / config.pixelsPerMeter > config.monster.distanceThresholdMeters && !game.hasObject('monster')) {
        randomlySpawnNPC(spawnMonster, config.monster.dropRate)
      }
    }
  })

  // @ts-ignore
  window.PlayEGI.onSignal((signal: any) => {
    switch (signal.type) {
      case 'Hello':
        // @ts-ignore
        window.PlayEGI.ready()

        if (signal.settings) {
          if (signal.settings.duration && signal.settings.duration.value) {
            config.duration = signal.settings.duration.value
          }
          if (signal.settings.wheelchair && signal.settings.wheelchair.value) {
            config.wheelchair = signal.settings.wheelchair.value
          }
        }

        // @ts-ignore
        const timer = window.PlayEGIHelpers.timer(document.body)
        game.afterCycle(() => {
          const elapsed = game.getRunningTime()
          if (elapsed >= config.duration) {
            detectEnd()
          }
          timer.setPercent(elapsed / config.duration)
        })
        break

      case 'Suspend':
        game.pause()
        break

      case 'Resume':
        game.resume()

        // @ts-ignore
        window.PlayEGI.led({
          channel: 2, // center
          symbol: 2, // plus
          mode: 1, // on
          color: { r: 1, g: 1, b: 1 }, // white
          brightness: 50, // default
        })
        break

      case 'Ping':
      // @ts-ignore
        window.PlayEGI.pong()
        break

      case 'Step':
        // Ignore steps when controlled by continuous signal
        if (Senso.hasBeenSeen()) return
        switch (signal.direction) {
          case 'Left':
            skier.turnRight()
            break

          case 'Right':
            skier.turnLeft()
            break

          case 'Down':
            skier.setDirection(downDirection)
            break
        }
        break

      case 'SensoState':
        Senso.setHasBeenSeen()
        skier.setDirection(linearInterpolX(signal.state) * (config.wheelchair ? 3 : 1))
        break

      default:
        break
    }
  })
}

// Linear interpolation of x on f, as relative coordinates [-1; 1]
const directions = ['center', 'up', 'right', 'down', 'left']
function linearInterpolX(state: any) {
  const totalForce = directions.reduce((sum, d) => state[d].f + sum, 0)

  // Avoid brownian skiing when plate is empty
  if (totalForce < 0.01) {
    return 0
  } else {
    const fusedX = directions.reduce((sum, d) => state[d].f / totalForce * state[d].x + sum, 0)
    const ratio = (1 - config.directionAmplitudeRatio) / 2 + config.directionAmplitudeRatio * centerWithAmplitude({ x: fusedX })
    return (1 - ratio) * Math.PI
  }
}

// Return [0; 1] centered with the given amplitude
function centerWithAmplitude({ x }: any) {
  const sensoWidth = 3
  const centered = x - sensoWidth / 2
  const amplitude = sensoWidth * config.activeSensoRatio
  const halfAmplitude = amplitude / 2
  const ratio = (clamp(-halfAmplitude, centered, halfAmplitude) + halfAmplitude) / amplitude
  return ratio
}

function clamp(min: number, x: number, max: number) {
  return Math.max(min, Math.min(max, x))
}

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1

  mainCanvas.width = window.innerWidth * dpr
  mainCanvas.height = window.innerHeight * dpr

  mainCanvas.style.width = window.innerWidth + 'px'
  mainCanvas.style.height = window.innerHeight + 'px'

  dContext.imageSmoothingQuality = 'high'
}
window.addEventListener('resize', setupCanvas, false)
setupCanvas()

loadImages(imageSources, startNeverEndingGame)

const spawnableSprites = [
  { sprite: sprites.smallTree, dropRate: config.dropRate.smallTree },
  { sprite: sprites.tallTree, dropRate: config.dropRate.tallTree },
  { sprite: sprites.jump, dropRate: config.dropRate.jump },
  { sprite: sprites.thickSnow, dropRate: config.dropRate.thickSnow },
  { sprite: sprites.thickerSnow, dropRate: config.dropRate.thickerSnow },
  { sprite: sprites.rock, dropRate: config.dropRate.rock }
]

function createObjects(skier: Skier, canAddObject: (sprite: any) => boolean) {
  const rateModifier = Math.max(800 - mainCanvas.width / window.devicePixelRatio, 0)

  const sideTrees = [ dContext.getRandomSideMapPositionBelowViewport() ]
    .filter(_ => {
      const random = Random.between(0, 100) + rateModifier + 0.001
      return random < config.dropRate.side.tallTree * skier.speed.y
    })
    .map(pos => {
      const sprite = new Sprite(sprites.tallTree)
      sprite.setMapPosition(pos[0], pos[1])
      sprite.isStatic = true
      sprite.onHitting(skier, sprites.tallTree.hitBehaviour.skier)
      return sprite
    })

  const skierDirectionObjects = [ undefined ]
    .filter(_ => {
      const random = Random.between(0, 100) + rateModifier + 0.001
      return skier.speed !== Vec2.zero && random < config.dropRate.skierDirection.any * skier.speed.y
    })
    .map(_ => {
      const sprite = new Sprite(randomObstacle())
      const [ unused, y ] = dContext.getRandomMapPositionBelowViewport()
      const x = skier.mapPosition[0] + skier.speed.x / skier.speed.y * (y - skier.mapPosition[1])
      sprite.setMapPosition(x, y)
      sprite.isStatic = true
      sprite.onHitting(skier, sprites.tallTree.hitBehaviour.skier)
      return sprite
    })

  const centeredObjects = spawnableSprites
    .filter((spriteInfo: any) => {
      const random = Random.between(0, 100) + rateModifier + 0.001
      return random < spriteInfo.dropRate * skier.speed.y
    })
    .map((spriteInfo: any) => {
      const sprite = new Sprite(spriteInfo.sprite)

      const [ x, y ] = dContext.getRandomMapPositionBelowViewport()
      sprite.setMapPosition(x, y)

      sprite.isStatic = true

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
  const r =Random.between(1, 3)
  if (r == 1) {
    return sprites.tallTree
  } else if (r == 2) {
    return sprites.smallTree
  } else {
    return sprites.rock
  }
}
