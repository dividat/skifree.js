import * as Random from 'lib/random'
import * as Canvas from 'canvas'
import { Sprite } from 'lib/sprite'
import { config } from 'config'

const directions = {
  sEast: (xDiff: number) => xDiff > 0,
  sWest: (xDiff: number) => xDiff <= 0
}

export class Snowboarder extends Sprite {

  skier: Sprite
  baseSpeed: number

  constructor(skier: Sprite, data: any) {
    super(data)
    this.skier = skier
    this.baseSpeed = Random.between(config.snowboarder.minSpeed, config.snowboarder.maxSpeed)
    super.setMovingTowardSpeed(this.baseSpeed)
  }

  getDirection(): string {
    const movingToward = super.getMovingToward()
    const pos = super.getMapPosition()

    if (movingToward !== undefined && movingToward[0] !== undefined && movingToward[1] !== undefined) {
      const xDiff = movingToward[0] - pos[0]
      const yDiff = movingToward[1] - pos[1]

      return directions.sEast(xDiff) ? 'sEast' : 'sWest'
    } else {
      return 'sWest'
    }
  }

  cycle(dt: number) {
    if (Random.between(0, 10) === 1) {
      super.setMapPositionTarget(Canvas.getRandomlyInTheCentreOfMap(this.skier.pos))
      super.setMovingTowardSpeed(this.baseSpeed + Random.between(-1, 1))
    }

    super.setMapPositionTarget(undefined, Canvas.getMapBelowViewport(this.skier.pos) + 600)
    super.cycle(dt)
  }

  draw(center: [ number, number ], spriteFrame: any, zoom: number) {
    return super.draw(center, this.getDirection(), zoom)
  }

  canBeDeleted(center: [ number, number ]): boolean {
    return false
  }
}
