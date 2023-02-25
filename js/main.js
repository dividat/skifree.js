// Global dependencies which return no modules
require('./lib/canvasRenderingContext2DExtensions')
require('./lib/extenders')
require('./lib/plugins')

// Game Objects
var SpriteArray = require('./lib/spriteArray')
var Monster = require('./lib/monster')
var Sprite = require('./lib/sprite')
var Snowboarder = require('./lib/snowboarder')
var Skier = require('./lib/skier')
var Game = require('./lib/game')

// Local variables for starting the game
var mainCanvas = document.getElementById('skifree-canvas')
var dContext = mainCanvas.getContext('2d')
var global = this
var infoBoxControls = 'Use the mouse or WASD to control the player'
var sprites = require('./spriteInfo')
var imageSources = []
;(function () {
  for (var key in sprites) {
      for (var partKey in sprites[key].parts) {
          // Skip monkey patching debris
          if (partKey === 'superior') continue

          var part = sprites[key].parts[partKey]

          if (part.frames > 0) {
              for (var i = 1; i <= part.frames; i++) {
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

var pixelsPerMetre = 18
var distanceTravelledInMetres = 0
var monsterDistanceThreshold = 2000
var loseLifeOnObstacleHit = false
var dropRates = {smallTree: 4, tallTree: 4, jump: 0.7, thickSnow: 1, thickerSnow: 0.5, rock: 2}

var balanceFactor = 0.33
var settings = {
  duration: 60000,
  wheelchair: false
}

function loadImages (sources, next) {
  var loaded = 0
  var images = {}

  var indicator = document.getElementById('loading-indicator')
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
    var im = new Image()
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
    monster.setSpeed(skier.getSpeed())
    monster.stopFollowing()
    var randomPositionAbove = dContext.getRandomMapPositionAboveViewport()
    monster.setMapPositionTarget(randomPositionAbove[0], randomPositionAbove[1])
    // Delete some time after it moved off screen
    setTimeout(function () { monster.deleteOnNextCycle() }, 5000)
  })
}

function startNeverEndingGame (images) {
  var player
  var startSign
  var cottage
  var game

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
    var rateModifier = Math.max(800 - mainCanvas.width, 0)
    if (Number.random(1000 + rateModifier) <= dropRate * player.getSpeedRatio()) {
      spawnFunction()
    }
  }

  function spawnMonster () {
    var newMonster = new Monster(sprites.monster)
    var randomPosition = dContext.getRandomMapPositionAboveViewport()
    newMonster.setMapPosition(randomPosition[0], randomPosition[1])
    newMonster.follow(player)
    newMonster.setSpeed(player.getStandardSpeed())
    newMonster.onHitting(player, monsterHitsSkierBehaviour)

    game.addMovingObject(newMonster, 'monster')
  }

  function spawnBoarder () {
    var newBoarder = new Snowboarder(sprites.snowboarder)
    var randomPositionAbove = dContext.getRandomMapPositionAboveViewport()
    var randomPositionBelow = dContext.getRandomMapPositionBelowViewport()
    newBoarder.setMapPosition(randomPositionAbove[0], randomPositionAbove[1])
    newBoarder.setMapPositionTarget(randomPositionBelow[0], randomPositionBelow[1])
    newBoarder.onHitting(player, sprites.snowboarder.hitBehaviour.skier)

    game.addMovingObject(newBoarder)
  }

  player = new Skier(mainCanvas, sprites.skier)
  player.setMapPosition(0, 0)
  player.setMapPositionTarget(0, -10)

  game = new Game(mainCanvas, player)

  player.determineNextFrame(dContext, 'east')
  startSign = new Sprite(sprites.signStart)
  game.addStaticObject(startSign)
  startSign.setMapPosition(-0.4 * player.width, -0.1 * player.height)

  cottage = new Sprite(sprites.cottage)
  game.addStaticObject(cottage)
  cottage.setMapPosition(0.7 * player.width, -1.2 * player.height)

  dContext.followSprite(player)

  game.beforeCycle(function () {
    var newObjects = []
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
      game.addStaticObjects(newObjects, true)

      randomlySpawnNPC(spawnBoarder, 0.1)
      distanceTravelledInMetres = parseFloat(player.getPixelsTravelledDownMountain() / pixelsPerMetre).toFixed(1)

      if (distanceTravelledInMetres > monsterDistanceThreshold) {
        randomlySpawnNPC(spawnMonster, 0.001)
      }

    }
  })

  var haveSeenSensoState = false
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

        var timer = window.PlayEGIHelpers.timer(document.body)
        game.afterCycle(function () {
          var elapsed = game.getRunningTime()
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
        var x = linearInterpolX(signal.state) * (settings.wheelchair ? 3 : 1)
        var canvasX = x * balanceFactor * mainCanvas.width + mainCanvas.width / 2
        game.setMouseX(canvasX)
        game.setMouseY(mainCanvas.height)
        player.resetDirection()
        player.startMovingIfPossible()
        break

      default:
        break
    }
  })

  player.isMoving = false
  player.setDirection(270)
}

// return linear interpolation of x on f, as relative coordinates (centered on 0)
var directions = ['center', 'up', 'right', 'down', 'left']
function linearInterpolX (state) {
  var totalForce = directions.reduce(function (sum, d) { return state[d].f + sum }, 0)
  // Avoid brownian skiing when plate empty
  if (totalForce < 0.05) return 0

  var fusedX = directions.reduce(function (sum, d) { return state[d].f/totalForce * state[d].x + sum }, 0)

  return (fusedX - 1.5)
}

function setupCanvas () {
  var dpr = window.devicePixelRatio || 1

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
