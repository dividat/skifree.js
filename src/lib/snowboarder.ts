import * as Random from 'lib/random'
import * as Canvas from 'canvas'
import * as Vec2 from 'lib/vec2'
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
    this.baseSpeed = Random.int({ min: config.snowboarder.minSpeed, max: config.snowboarder.maxSpeed }) * Canvas.diagonal / 30000
    super.movingTowardSpeed = this.baseSpeed
  }

  getDirection(): string {
    if (this.movingToward !== undefined && this.movingToward.x !== undefined && this.movingToward.y !== undefined) {
      const xDiff = this.movingToward.x - this.pos.x
      const yDiff = this.movingToward.y - this.pos.y

      return directions.sEast(xDiff) ? 'sEast' : 'sWest'
    } else {
      return 'sWest'
    }
  }

  cycle(time: number, dt: number) {
    this.movingToward = {
      x: (Random.int({ min: 0, max: 10 }) === 1 ? Canvas.getRandomlyInTheCentreOfMap(this.skier.pos) : (this.movingToward && this.movingToward.x || 0)),
      y: Canvas.getMapBelowViewport(this.pos) + 600
    }

    super.cycle(time, dt)
  }

  draw(time: number, center: Vec2.Vec2, spriteFrame: any, zoom: number) {
    return super.draw(time, center, this.getDirection(), zoom)
  }

  canBeDeleted(center: Vec2.Vec2): boolean {
    return false
  }
}
