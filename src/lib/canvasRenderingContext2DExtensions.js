import * as Random from 'lib/random'

CanvasRenderingContext2D.prototype.storeLoadedImage = function (key, image) {
  if (!this.images) {
    this.images = {}
  }

  this.images[key] = image
}

CanvasRenderingContext2D.prototype.getLoadedImage = function (key) {
  if (this.images[key]) {
    return this.images[key]
  }
}

CanvasRenderingContext2D.prototype.followSprite = function (sprite) {
  this.centralSprite = sprite
}

CanvasRenderingContext2D.prototype.getCentralPosition = function () {
  return {
    map: this.centralSprite.mapPosition,
    canvas: [ Math.round(this.canvas.width * 0.5), Math.round(this.canvas.height * 0.15), 0]
  }
}

CanvasRenderingContext2D.prototype.mapPositionToCanvasPosition = function (position) {
  const central = this.getCentralPosition()
  const centralMapPosition = central.map
  const centralCanvasPosition = central.canvas
  const mapDifferenceX = centralMapPosition[0] - position[0]
  const mapDifferenceY = centralMapPosition[1] - position[1]
  return [ centralCanvasPosition[0] - mapDifferenceX, centralCanvasPosition[1] - mapDifferenceY ]
}

CanvasRenderingContext2D.prototype.canvasPositionToMapPosition = function (position) {
  const central = this.getCentralPosition()
  const centralMapPosition = central.map
  const centralCanvasPosition = central.canvas
  const mapDifferenceX = centralCanvasPosition[0] - position[0]
  const mapDifferenceY = centralCanvasPosition[1] - position[1]
  return [ centralMapPosition[0] - mapDifferenceX, centralMapPosition[1] - mapDifferenceY ]
}

CanvasRenderingContext2D.prototype.getCentreOfViewport = function () {
  return Math.floor(this.canvas.width / 2)
}

// Y-pos canvas functions
CanvasRenderingContext2D.prototype.getMiddleOfViewport = function () {
  return Math.floor(this.canvas.height / 2)
}

CanvasRenderingContext2D.prototype.getBelowViewport = function () {
  return Math.floor(this.canvas.height)
}

CanvasRenderingContext2D.prototype.getMapBelowViewport = function () {
  const below = this.getBelowViewport()
  return this.canvasPositionToMapPosition([ 0, below ])[1]
}

CanvasRenderingContext2D.prototype.getRandomlyInTheCentreOfCanvas = function () {
  return Random.between(0, this.canvas.width)
}

CanvasRenderingContext2D.prototype.getRandomlyInTheSideOfCanvas = function () {
  const side = this.canvas.width * 0.4
  const random = Random.between(-side, side)
  return random < 0 ? this.canvas.width * 0.1 + random : this.canvas.width * 0.9 + random
}

CanvasRenderingContext2D.prototype.getRandomlyInTheCentreOfMap = function () {
  const random = this.getRandomlyInTheCentreOfCanvas()
  return this.canvasPositionToMapPosition([ random, 0 ])[0]
}

CanvasRenderingContext2D.prototype.getRandomMapPositionBelowViewport = function () {
  const xCanvas = this.getRandomlyInTheCentreOfCanvas()
  const yCanvas = this.getBelowViewport()
  return this.canvasPositionToMapPosition([ xCanvas, yCanvas ])
}

CanvasRenderingContext2D.prototype.getRandomSideMapPositionBelowViewport = function () {
  const xCanvas = this.getRandomlyInTheSideOfCanvas()
  const yCanvas = this.getBelowViewport()
  return this.canvasPositionToMapPosition([ xCanvas, yCanvas ])
}

CanvasRenderingContext2D.prototype.getRandomMapPositionAboveViewport = function () {
  const xCanvas = this.getRandomlyInTheCentreOfCanvas()
  const yCanvas = this.getAboveViewport()
  return this.canvasPositionToMapPosition([ xCanvas, yCanvas ])
}

CanvasRenderingContext2D.prototype.getAboveViewport = function () {
  return 0 - Math.floor(this.canvas.height / 4)
}
