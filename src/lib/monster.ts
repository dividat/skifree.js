import { Sprite } from 'lib/sprite'
import { config } from 'config'
import * as Canvas from 'canvas'

const eatingSteps = 6

export class Monster extends Sprite {
  eatingStartedAt: undefined | number
  isEating: boolean

  constructor(data: any) {
    super(data)
    const speed = config.monster.speed * Canvas.diagonal / 2000
    this.setMovingTowardSpeed(speed)
  }

  draw(center: [ number, number ], spriteFrame: string, zoom: number) {
    let spritePartToUse

    if (this.eatingStartedAt !== undefined && this.isEating) {
      const progress = (Date.now() - this.eatingStartedAt) / config.monster.eatingDuration
      const eatingStage = Math.min(Math.floor(progress * eatingSteps + 1), eatingSteps)
      spritePartToUse = 'eating' + eatingStage
    } else {
      if (this.movingToward !== undefined && this.movingToward[0] !== undefined && this.movingToward[0] > super.getMapPosition()[0]) {
        spritePartToUse = 'sEast'
      } else {
        spritePartToUse = 'sWest'
      }
    }

    return super.draw(center, spritePartToUse, zoom)
  }

  startEating({ whenDone }: { whenDone: () => void }) {
    this.eatingStartedAt = Date.now()
    this.isEating = true
    setTimeout(() => {
      this.isEating = false
      whenDone()
    }, config.monster.eatingDuration)
  }

  canBeDeleted(center: [ number, number ]): boolean {
    return this.eatingStartedAt !== undefined && super.canBeDeleted(center)
  }
}
