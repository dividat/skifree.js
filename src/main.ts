import * as Images from 'lib/images' 
import * as Senso from 'senso'
import * as Canvas from 'canvas' 
import { config } from 'config'
import { Game } from 'lib/game'
import { Skier, downDirection } from 'lib/skier'
import { Sprite } from 'lib/sprite'
import { spriteInfo } from 'spriteInfo'

const imageSources: Array<string> = []

for (const key in spriteInfo) {
    for (const partKey in spriteInfo[key].parts) {
        // Skip monkey patching debris
        if (partKey === 'superior') continue

        const part = spriteInfo[key].parts[partKey]

        if (part.frames > 0) {
            for (let i = 1; i <= part.frames; i++) {
                imageSources.push("sprites/" + key + "-" + partKey + i + ".png")
            }
  } else {
            imageSources.push("sprites/" + key + "-" + partKey + ".png")
  }
    }
}

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
    Images.storeLoaded(src, im)
  })
}

function startNeverEndingGame(images: Array<any>) {
  let skier: Skier
  let game: any

  const detectEnd = () => {
    if (!game.isPaused()) {
      // @ts-ignore
      window.PlayEGI.finish({
        duration: { type: 'Duration', value: config.duration },
        downhillDistance: { type: 'RawInt', value: Math.round(skier.downhillMetersTravelled()) },
        jumps: { type: 'RawInt', value: skier.jumps.length },
        collisions: { type: 'RawInt', value: skier.collisions.length },
      })
    }
  }

  function addStartingObject(sprite: any, x: number, y: number) {
    let object = new Sprite(sprite)
    object.setMapPosition(x * skier.width, y * skier.height)
    game.addObject(object)
  }

  skier = new Skier(Canvas.canvas, spriteInfo.skier)
  skier.setMapPosition(0, 0)

  // @ts-ignore
  game = new Game(Canvas.canvas, skier)

  skier.determineNextFrame('east')

  addStartingObject(spriteInfo.signStart, -0.4, -0.1)
  addStartingObject(spriteInfo.cottage, 0.7, -1.2)
  addStartingObject(spriteInfo.tallTree, 3, 4)
  addStartingObject(spriteInfo.rock, -4, 2)
  addStartingObject(spriteInfo.thickSnow, -3, 7)

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
    const ratio = (1 - config.skier.directionAmplitudeRatio) / 2 + config.skier.directionAmplitudeRatio * centerWithAmplitude({ x: fusedX })
    return (1 - ratio) * Math.PI
  }
}

// Return [0; 1] centered with the given amplitude
function centerWithAmplitude({ x }: any) {
  const sensoWidth = 3
  const centered = x - sensoWidth / 2
  const amplitude = sensoWidth * config.skier.activeSensoRatio
  const halfAmplitude = amplitude / 2
  const ratio = (clamp(-halfAmplitude, centered, halfAmplitude) + halfAmplitude) / amplitude
  return ratio
}

function clamp(min: number, x: number, max: number) {
  return Math.max(min, Math.min(max, x))
}

loadImages(imageSources, startNeverEndingGame)
