// Global dependencies which return no modules
require('./lib/canvasRenderingContext2DExtensions')
require('./lib/extenders')
require('./lib/plugins')

// Game Objects
const SpriteArray = require('./lib/spriteArray')
const Monster = require('./lib/monster')
const Sprite = require('./lib/sprite')
const Snowboarder = require('./lib/snowboarder')
const Skier = require('./lib/skier')
const Game = require('./lib/game')

// Local variables for starting the game
const mainCanvas = document.getElementById('skifree-canvas')
const dContext = mainCanvas.getContext('2d')
const global = this
const infoBoxControls = 'Use the mouse or WASD to control the player'
const sprites = require('./spriteInfo')
const imageSources = []
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

// Set global configuration
window.skiCfg = {
  zoom: (parseFloat(new URLSearchParams(document.location.search).get("zoom")) || window.devicePixelRatio || 1) * 3,
  originalFrameInterval: 20,
  debug: new URLSearchParams(document.location.search).has("debug")
}

const pixelsPerMetre = 18
let distanceTravelledInMetres = 0
const monsterDistanceThreshold = 2000
const loseLifeOnObstacleHit = false
const dropRates = {
  smallTree: 7,
  tallTree: 8,
  jump: 1,
  thickSnow: 1.5,
  thickerSnow: 1,
  rock: 3
}

const balanceFactor = 0.33
let settings = {
  duration: 60000,
  wheelchair: false
}

function loadImages (sources, next) {
  let loaded = 0
  const images = {}

  const indicator = document.getElementById('loading-indicator')
  indicator.max = sources.length

  function finish () {
    loaded += 1
    indicator.value = loaded

    if (loaded === sources.length) {
      document.getElementById('loader').classList.add('done')
      next(images)
    }
  }

  sources.each(function (src) {
    const im = new Image()
    im.onload = finish
    im.onerror = finish
    im.src = src
    dContext.storeLoadedImage(src, im)
  })
}

function monsterHitsSkierBehaviour (monster, skier) {
  skier.isEatenBy(monster, function () {
    monster.isFull = true
    monster.isEating = false
    skier.isBeingEaten = false
    monster.stopFollowing()
    const randomPositionAbove = dContext.getRandomMapPositionAboveViewport()
    monster.setMapPositionTarget(randomPositionAbove[0], randomPositionAbove[1])
    // Delete some time after it moved off screen
    setTimeout(function () { monster.deleteOnNextCycle() }, 5000)
  })
}

function startNeverEndingGame (images) {
  let player
  let startSign
  let cottage
  let game

  function detectEnd () {
    if (!game.isPaused()) {
      game.pause()
      game.cycle()
      window.PlayEGI.finish({
        duration: { type: 'Duration', value: settings.duration },
        distance: { type: 'RawInt', value: parseInt(distanceTravelledInMetres) },
        jumps: { type: 'RawInt', value: player.jumps },
        collisions: { type: 'RawInt', value: player.collisions },
      })
    }
  }

  function randomlySpawnNPC (spawnFunction, dropRate) {
    const rateModifier = Math.max(800 - mainCanvas.width, 0)
    if (Number.random(1000 + rateModifier) <= dropRate * player.getSpeedRatio()) {
      spawnFunction()
    }
  }

  function spawnMonster () {
    const newMonster = new Monster(sprites.monster, player.getStandardSpeed() * 0.4)
    const randomPosition = dContext.getRandomMapPositionAboveViewport()
    newMonster.setMapPosition(randomPosition[0], randomPosition[1])
    newMonster.follow(player)
    newMonster.onHitting(player, monsterHitsSkierBehaviour)

    game.addObject({
      sprite: newMonster,
      type: 'monster'
    })
  }

  function spawnBoarder () {
    const newBoarder = new Snowboarder(sprites.snowboarder)
    const randomPositionAbove = dContext.getRandomMapPositionAboveViewport()
    const randomPositionBelow = dContext.getRandomMapPositionBelowViewport()
    newBoarder.setMapPosition(randomPositionAbove[0], randomPositionAbove[1])
    newBoarder.setMapPositionTarget(randomPositionBelow[0], randomPositionBelow[1])
    newBoarder.onHitting(player, sprites.snowboarder.hitBehaviour.skier)

    game.addObject({ sprite: newBoarder })
  }

  player = new Skier(mainCanvas, sprites.skier)
  player.setMapPosition(0, 0)
  player.setMapPositionTarget(0, -10)

  game = new Game(mainCanvas, player)

  player.determineNextFrame(dContext, 'east')
  startSign = new Sprite(sprites.signStart)
  game.addObject({ sprite: startSign })
  startSign.setMapPosition(-0.4 * player.width, -0.1 * player.height)

  cottage = new Sprite(sprites.cottage)
  game.addObject({ sprite: cottage })
  cottage.setMapPosition(0.7 * player.width, -1.2 * player.height)

  dContext.followSprite(player)

  game.beforeCycle(function () {
    let newObjects = []
    if (player.isMoving) {
      newObjects = Sprite.createObjects([
        { sprite: sprites.smallTree, dropRate: dropRates.smallTree },
        { sprite: sprites.tallTree, dropRate: dropRates.tallTree },
        { sprite: sprites.jump, dropRate: dropRates.jump },
        { sprite: sprites.thickSnow, dropRate: dropRates.thickSnow },
        { sprite: sprites.thickerSnow, dropRate: dropRates.thickerSnow },
        { sprite: sprites.rock, dropRate: dropRates.rock }
      ], {
        rateModifier: Math.max(800 - mainCanvas.width, 0),
        position: function () {
          return dContext.getRandomMapPositionBelowViewport()
        },
        isStatic: true,
        player: player
      })
    }
    if (!game.isPaused()) {
      game.addObjects(newObjects, true)

      randomlySpawnNPC(spawnBoarder, 0.1)
      distanceTravelledInMetres = parseFloat(player.getPixelsTravelledDownMountain() / pixelsPerMetre).toFixed(1)

      if (distanceTravelledInMetres > monsterDistanceThreshold && !game.hasObject('monster')) {
        randomlySpawnNPC(spawnMonster, 0.001)
      }
    }
  })

  let haveSeenSensoState = false
  window.PlayEGI.onSignal(function (signal) {
    switch (signal.type) {
      case 'Hello':
        window.PlayEGI.ready()

        if (signal.settings) {
          settings = {
            duration: (signal.settings.duration && signal.settings.duration.value) || settings.duration,
            wheelchair: (signal.settings.wheelchair && signal.settings.wheelchair.value) || settings.wheelchair
          }
        }

        const timer = window.PlayEGIHelpers.timer(document.body)
        game.afterCycle(function () {
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
        window.PlayEGI.led({
          channel: 2, // center
          symbol: 2, // plus
          mode: 1, // on
          color: { r: 1, g: 1, b: 1 }, // white
          brightness: 50, // default
        })
        break

      case 'Ping':
        window.PlayEGI.pong()
        break

      case 'Step':
        // Ignore steps when controlled by continuous signal
        if (haveSeenSensoState) return
        switch (signal.direction) {
          case 'Up':
            player.stop()
            break

          case 'Left':
            player.turnWest()
            break

          case 'Right':
            player.turnEast()
            break

          case 'Down':
            player.setDirection(180)
            player.startMovingIfPossible()
            break
        }
        break

      case 'SensoState':
        haveSeenSensoState = true
        const x = linearInterpolX(signal.state) * (settings.wheelchair ? 3 : 1)
        const amplitude = 100
        const direction = (1 - x) * amplitude + 90 + (180 - amplitude) / 2
        player.setDirection(direction)
        player.startMovingIfPossible()
        break

      default:
        break
    }
  })

  player.isMoving = false
  player.setDirection(270)
}

// Linear interpolation of x on f, as relative coordinates [0; 1]
const directions = ['center', 'up', 'right', 'down', 'left']
function linearInterpolX (state) {
  const totalForce = directions.reduce(
    function (sum, d) {
      return state[d].f + sum
    },
    0)

  // Avoid brownian skiing when plate empty
  if (totalForce < 0.01) return 0.5

  const fusedX = directions.reduce(
    function (sum, d) {
      return state[d].f / totalForce * state[d].x + sum
    },
    0)

  return centerWithAmplitude(3, 1, fusedX)
}

// Return [0; 1] centered with the given amplitude
function centerWithAmplitude (width, amplitude, x) {
  const centered = x - width / 2
  const halfAmplitude = amplitude / 2
  return (clamp(-halfAmplitude, centered, halfAmplitude) + halfAmplitude) / amplitude
}

function clamp (min, x, max) {
  return Math.max(min, Math.min(max, x))
}

function setupCanvas () {
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

this.exports = window
