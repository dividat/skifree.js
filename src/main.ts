import 'lib/canvasRenderingContext2DExtensions'
import * as Random from 'lib/random'
import { Game } from 'lib/game'
import { Monster } from 'lib/monster'
import { Skier, downDirection } from 'lib/skier'
import { Snowboarder } from 'lib/snowboarder'
import { Sprite } from 'lib/sprite'
import { sprites } from 'spriteInfo'

// Settings

const pixelsPerMeter: number = 18
const monsterDistanceThreshold: number = 2000 // meters
const snowboarderDropRate = 0.1
const monsterDropRate = 0.001

const spawnableSprites = [
  { sprite: sprites.smallTree, dropRate: 10 },
  { sprite: sprites.tallTree, dropRate: 30 },
  { sprite: sprites.jump, dropRate: 1 },
  { sprite: sprites.thickSnow, dropRate: 1 },
  { sprite: sprites.thickerSnow, dropRate: 1 },
  { sprite: sprites.rock, dropRate: 5 }
]

let settings = {
  duration: 60000,
  wheelchair: false
}

// Local variables for starting the game

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
  skier.isEatenBy(monster, () => {
    monster.stopFollowing()
    const randomPositionAbove = dContext.getRandomMapPositionAboveViewport()
    monster.setMapPositionTarget(randomPositionAbove[0], randomPositionAbove[1])
    // Delete some time after it moved off screen
    setTimeout(() => monster.deleteOnNextCycle(), 5000)
  })
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
        duration: { type: 'Duration', value: settings.duration },
        distance: { type: 'RawInt', value: Math.round(skier.pixelsTravelled / pixelsPerMeter) },
        jumps: { type: 'RawInt', value: skier.jumps },
        collisions: { type: 'RawInt', value: skier.collisions },
      })
    }
  }

  function randomlySpawnNPC(spawnFunction: () => void, dropRate: number) {
    const rateModifier = Math.max(800 - mainCanvas.width / window.devicePixelRatio, 0)
    if (Random.between(0, 1000 + rateModifier) <= dropRate * skier.getSpeedRatio()) {
      spawnFunction()
    }
  }

  function spawnMonster () {
    const monsterSpeed = 5
    const newMonster = new Monster(sprites.monster, monsterSpeed)
    const randomPosition = dContext.getRandomMapPositionAboveViewport()
    newMonster.setMapPosition(randomPosition[0], randomPosition[1])
    newMonster.follow(skier)
    newMonster.onHitting(skier, monsterEatsSkier)

    game.addObject({
      sprite: newMonster,
      type: 'monster'
    })
  }

  function spawnBoarder () {
    const newBoarder = new Snowboarder(sprites.snowboarder, dContext)
    const randomPositionAbove = dContext.getRandomMapPositionAboveViewport()
    const randomPositionBelow = dContext.getRandomMapPositionBelowViewport()
    newBoarder.setMapPosition(randomPositionAbove[0], randomPositionAbove[1])
    newBoarder.setMapPositionTarget(randomPositionBelow[0], randomPositionBelow[1])
    newBoarder.onHitting(skier, sprites.snowboarder.hitBehaviour.skier)

    game.addObject({ sprite: newBoarder, allowCollisions: true })
  }

  skier = new Skier(mainCanvas, sprites.skier)
  skier.setMapPosition(0, 0)
  skier.setMapPositionTarget(0, -10)

  // @ts-ignore
  game = new Game(mainCanvas, skier)

  skier.determineNextFrame(dContext, 'east')
  startSign = new Sprite(sprites.signStart)
  game.addObject({ sprite: startSign, allowCollisions: true })
  startSign.setMapPosition(-0.4 * skier.width, -0.1 * skier.height)

  cottage = new Sprite(sprites.cottage)
  game.addObject({ sprite: cottage, allowCollisions: true })
  cottage.setMapPosition(0.7 * skier.width, -1.2 * skier.height)

  dContext.followSprite(skier)

  game.beforeCycle(() => {
    if (!game.isPaused()) {
      game.addObjects({ sprites: createObjects(skier), allowCollisions: false })
      randomlySpawnNPC(spawnBoarder, snowboarderDropRate)
      if (skier.pixelsTravelled / pixelsPerMeter > monsterDistanceThreshold && !game.hasObject('monster')) {
        randomlySpawnNPC(spawnMonster, monsterDropRate)
      }
    }
  })

  let haveSeenSensoState = false

  // @ts-ignore
  window.PlayEGI.onSignal((signal: any) => {
    switch (signal.type) {
      case 'Hello':
        // @ts-ignore
        window.PlayEGI.ready()

        if (signal.settings) {
          settings = {
            duration: (signal.settings.duration && signal.settings.duration.value) || settings.duration,
            wheelchair: (signal.settings.wheelchair && signal.settings.wheelchair.value) || settings.wheelchair
          }
        }

        // @ts-ignore
        const timer = window.PlayEGIHelpers.timer(document.body)
        game.afterCycle(() => {
          const elapsed = game.getRunningTime()
          if (elapsed >= settings.duration) {
            detectEnd()
          }
          timer.setPercent(elapsed / settings.duration)
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
        if (haveSeenSensoState) return
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
        haveSeenSensoState = true
        skier.setDirection(linearInterpolX(signal.state) * (settings.wheelchair ? 3 : 1))
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

  // Avoid brownian skiing when plate empty
  if (totalForce < 0.01) {
    return 0
  } else {
    const fusedX = directions.reduce((sum, d) => state[d].f / totalForce * state[d].x + sum, 0)
    return (1 - centerWithAmplitude({ activeRatio: 1 / 3, x: fusedX })) * Math.PI
  }
}

// Return [0; 1] centered with the given amplitude
function centerWithAmplitude({ activeRatio, x }: any) {
  const sensoWidth = 3
  const centered = x - sensoWidth / 2
  const amplitude = sensoWidth * activeRatio
  const halfAmplitude = amplitude / 2
  return (clamp(-halfAmplitude, centered, halfAmplitude) + halfAmplitude) / amplitude
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

function createObjects(skier: Skier) {
  const rateModifier = Math.max(800 - mainCanvas.width / window.devicePixelRatio, 0)
  const speedRatio = skier.getSpeedRatio()

  return spawnableSprites
    .filter((spriteInfo: any) => {
      const random = Random.between(0, 100) + rateModifier + 0.001
      return random < spriteInfo.dropRate * speedRatio
    })
    .map((spriteInfo: any) => {
      const sprite = new Sprite(spriteInfo.sprite)

      const position = dContext.getRandomMapPositionBelowViewport()
      sprite.setMapPosition(position[0], position[1])

      sprite.isStatic = true

      if (spriteInfo.sprite.hitBehaviour && spriteInfo.sprite.hitBehaviour.skier) {
        sprite.onHitting(skier, spriteInfo.sprite.hitBehaviour.skier)
      }

      return sprite
    })
}
