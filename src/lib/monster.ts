import { Sprite } from 'lib/sprite'
import { config } from 'config'

const eatingSteps = 6

export class Monster extends Sprite {
  eatingStartedAt: undefined | number
  isEating: boolean

  constructor(data: any) {
    super(data)
    this.setMovingTowardSpeed(config.monster.speed)
  }

  draw(dContext: any, spriteFrame: string, zoom: number) {
    let spritePartToUse

    if (this.eatingStartedAt !== undefined && this.isEating) {
      const progress = (Date.now() - this.eatingStartedAt) / config.monster.eatingDuration
      const eatingStage = Math.min(Math.floor(progress * eatingSteps + 1), eatingSteps)
      spritePartToUse = 'eating' + eatingStage
    } else {
      const movingToward = super.getMovingToward()
      if (movingToward !== undefined && movingToward[0] !== undefined && movingToward[0] > super.getMapPosition()[0]) {
        spritePartToUse = 'sEast'
      } else {
        spritePartToUse = 'sWest'
      }
    }

    return super.draw(dContext, spritePartToUse, zoom)
  }

  startEating({ whenDone }: { whenDone: () => void }) {
    this.eatingStartedAt = Date.now()
    this.isEating = true
    setTimeout(() => {
      this.isEating = false
      whenDone()
    }, config.monster.eatingDuration)
  }
}
