import * as Random from 'lib/random'
import * as Vec2 from 'lib/vec2'
import { Sprite } from 'lib/sprite'
import { config } from 'config'

export let width = window.innerWidth * config.scaling
export let height = window.innerHeight * config.scaling
export let diagonal = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))

export const canvas: any = document.getElementById('skifree-canvas')
canvas.width = width
canvas.height = height

if (config.scaling > 1) {
  canvas.style.width = `${window.innerWidth}px`
  canvas.style.height = `${window.innerHeight}px`
}

export const context: any = canvas.getContext('2d')
context.imageSmoothingQuality = 'high'
context.font = `${diagonal / 130}px sans-serif` // text debug

let canvasCenter = {
  x: width * 0.5,
  y: height * config.skier.verticalPosRatio
}

export function getRandomMapPositionAboveViewport(center: Vec2.Vec2) {
  return canvasPositionToMapPosition(
    center,
    { x: getRandomlyInTheCentreOfCanvas(),
      y: getAboveViewport(),
    }
  )
}

export function getRandomSideMapPositionBelowViewport(center: Vec2.Vec2) {
  return canvasPositionToMapPosition(
    center,
    { x: getRandomlyInTheSideOfCanvas(),
      y: getBelowViewport(),
    }
  )
}

export function getRandomMapPositionBelowViewport(center: Vec2.Vec2): Vec2.Vec2 {
  return canvasPositionToMapPosition(
    center,
    { x: getRandomlyInTheCentreOfCanvas(),
      y: getBelowViewport(),
    }
  )
}

export function getRandomlyInTheCentreOfMap(center: Vec2.Vec2): number {
  return canvasPositionToMapPosition(
    center,
    { x: getRandomlyInTheCentreOfCanvas(),
      y: 0
    }
  ).x
}

export function getMapBelowViewport(center: Vec2.Vec2): number {
  const below = getBelowViewport()
  return canvasPositionToMapPosition(
    center,
    { x: 0,
      y: getBelowViewport()
    }
  ).y
}

function getRandomlyInTheCentreOfCanvas(): number {
  return Random.int({ min: 0, max: canvas.width })
}

function getAboveViewport(): number {
  return 0 - canvas.height / 4
}

function getBelowViewport(): number {
  return Math.floor(canvas.height)
}

function getRandomlyInTheSideOfCanvas(): number {
  const side = canvas.width * 0.4
  const random = Random.int({ min: -side, max: side })
  return random < 0 ? canvas.width * 0.1 + random : canvas.width * 0.9 + random
}

export function mapPositionToCanvasPosition(center: Vec2.Vec2, position: Vec2.Vec2): Vec2.Vec2 {
  const mapDifferenceX = center.x - position.x
  const mapDifferenceY = center.y - position.y

  return {
    x: canvasCenter.x - mapDifferenceX,
    y: canvasCenter.y - mapDifferenceY
  }
}

export function canvasPositionToMapPosition(center: Vec2.Vec2, position: Vec2.Vec2): Vec2.Vec2 {
  const mapDifferenceX = canvasCenter.x - position.x
  const mapDifferenceY = canvasCenter.y - position.y

  return {
    x: center.x - mapDifferenceX,
    y: center.y - mapDifferenceY
  }
}
