import * as Random from 'lib/random'
import { Sprite } from 'lib/sprite'
import { config } from 'config'

export const canvas: any = document.getElementById('skifree-canvas')
export const context: any = canvas.getContext('2d')
let canvasCenter: [ number, number ] = [ 0, 0 ]
export let width: number = 0
export let height: number = 0
export let diagonal: number = 0

export function setup() {
  canvas.width = window.innerWidth * window.devicePixelRatio
  canvas.height = window.innerHeight * window.devicePixelRatio

  if (window.devicePixelRatio > 1) {
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
  }

  width = canvas.width
  height = canvas.height
  diagonal = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))

  context.imageSmoothingQuality = 'high'
  context.font = `${diagonal / 100}px sans-serif` // text debug

  canvasCenter = [
    canvas.width * 0.5,
    canvas.height * config.skier.verticalPosRatio
  ]
}

export function getRandomMapPositionAboveViewport(center: [ number, number ]) {
  const xCanvas = getRandomlyInTheCentreOfCanvas()
  const yCanvas = getAboveViewport()
  return canvasPositionToMapPosition(center, [ xCanvas, yCanvas ])
}

export function getRandomSideMapPositionBelowViewport(center: [ number, number ]) {
  const xCanvas = getRandomlyInTheSideOfCanvas()
  const yCanvas = getBelowViewport()
  return canvasPositionToMapPosition(center, [ xCanvas, yCanvas ])
}

export function getRandomMapPositionBelowViewport(center: [ number, number ]) {
  const xCanvas = getRandomlyInTheCentreOfCanvas()
  const yCanvas = getBelowViewport()
  return canvasPositionToMapPosition(center, [ xCanvas, yCanvas ])
}

export function getRandomlyInTheCentreOfMap(center: [ number, number ]) {
  const random = getRandomlyInTheCentreOfCanvas()
  return canvasPositionToMapPosition(center, [ random, 0 ])[0]
}

export function getMapBelowViewport(center: [ number, number ]) {
  const below = getBelowViewport()
  return canvasPositionToMapPosition(center, [ 0, below ])[1]
}

function getRandomlyInTheCentreOfCanvas(): number {
  return Random.int({ min: 0, max: canvas.width })
}

function getAboveViewport(): number {
  return 0 - Math.floor(canvas.height / 4)
}

function getBelowViewport(): number {
  return Math.floor(canvas.height)
}

function getRandomlyInTheSideOfCanvas(): number {
  const side = canvas.width * 0.4
  const random = Random.int({ min: -side, max: side })
  return random < 0 ? canvas.width * 0.1 + random : canvas.width * 0.9 + random
}

export function mapPositionToCanvasPosition(center: [ number, number ], position: [ number, number ]) {
  const mapDifferenceX = center[0] - position[0]
  const mapDifferenceY = center[1] - position[1]
  return [ canvasCenter[0] - mapDifferenceX, canvasCenter[1] - mapDifferenceY ]
}

function canvasPositionToMapPosition(center: [ number, number ], position: [ number, number ]) {
  const mapDifferenceX = canvasCenter[0] - position[0]
  const mapDifferenceY = canvasCenter[1] - position[1]
  return [ center[0] - mapDifferenceX, center[1] - mapDifferenceY ]
}
