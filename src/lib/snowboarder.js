import * as Random from 'lib/random'
import { Sprite } from 'lib/sprite'

const standardSpeed = 3

const directions = {
  sEast: function (xDiff) { return xDiff > 0 },
  sWest: function (xDiff) { return xDiff <= 0 }
}

export class Snowboarder extends Sprite {

  constructor(data) {
    super(data)
    super.setMovingTowardSpeed(standardSpeed)
  }

  getDirection() {
    const movingToward = super.getMovingToward()
    const mapPosition = super.getMapPosition()
    const xDiff = movingToward[0] - mapPosition[0]
    const yDiff = movingToward[1] - mapPosition[1]

    return directions.sEast(xDiff)
      ? 'sEast'
      : 'sWest'
  }

  cycle(dt, dContext) {
    if (Random.between(0, 10) === 1) {
      super.setMapPositionTarget(dContext.getRandomlyInTheCentreOfMap())
      super.setMovingTowardSpeed(standardSpeed + Random.between(-1, 1))
    }

    super.setMapPositionTarget(undefined, dContext.getMapBelowViewport() + 600)
    super.cycle(dt)
  }

  draw(dContext) {
    return super.draw(dContext, this.getDirection())
  }
}
