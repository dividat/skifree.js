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
    this.baseSpeed = Random.int({ min: config.snowboarder.minSpeed, max: config.snowboarder.maxSpeed }) * Canvas.diagonal / 2000
    super.setMovingTowardSpeed(this.baseSpeed)
  }

  getDirection(): string {
    const pos = super.getMapPosition()

    if (this.movingToward !== undefined && this.movingToward[0] !== undefined && this.movingToward[1] !== undefined) {
      const xDiff = this.movingToward[0] - pos[0]
      const yDiff = this.movingToward[1] - pos[1]

      return directions.sEast(xDiff) ? 'sEast' : 'sWest'
    } else {
      return 'sWest'
    }
  }

  cycle(dt: number) {
    if (Random.int({ min: 0, max: 10 }) === 1) {
      super.setMapPositionTarget({
        x: Canvas.getRandomlyInTheCentreOfMap(this.skier.pos)
      })
      super.setMovingTowardSpeed(this.baseSpeed + Random.int({ min: -1, max: 1 }))
    }

    super.setMapPositionTarget({
      y: Canvas.getMapBelowViewport(this.pos) + 600
    })
    super.cycle(dt)
  }

  draw(center: [ number, number ], spriteFrame: any, zoom: number) {
    return super.draw(center, this.getDirection(), zoom)
  }

  canBeDeleted(center: [ number, number ]): boolean {
    return false
  }
}
