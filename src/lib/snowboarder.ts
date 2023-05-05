import * as Random from 'lib/random'
import { Sprite } from 'lib/sprite'
import { config } from 'config'

const directions = {
  sEast: (xDiff: number) => xDiff > 0,
  sWest: (xDiff: number) => xDiff <= 0
}

export class Snowboarder extends Sprite {

  dContext: any

  constructor(data: any, dContext: any) {
    super(data)
    super.setMovingTowardSpeed(config.snowboarder.speed)
    this.dContext = dContext
  }

  getDirection(): string {
    const movingToward = super.getMovingToward()
    const mapPosition = super.getMapPosition()

    if (movingToward !== undefined && movingToward[0] !== undefined && movingToward[1] !== undefined) {
      const xDiff = movingToward[0] - mapPosition[0]
      const yDiff = movingToward[1] - mapPosition[1]

      return directions.sEast(xDiff) ? 'sEast' : 'sWest'
    } else {
      return 'sWest'
    }
  }

  cycle(dt: number) {
    if (Random.between(0, 10) === 1) {
      super.setMapPositionTarget(this.dContext.getRandomlyInTheCentreOfMap())
      super.setMovingTowardSpeed(config.snowboarder.speed + Random.between(-1, 1))
    }

    super.setMapPositionTarget(undefined, this.dContext.getMapBelowViewport() + 600)
    super.cycle(dt)
  }

  draw(dContext: any, spriteFrame: any, zoom: number) {
    return super.draw(dContext, this.getDirection(), zoom)
  }
}
