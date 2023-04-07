import { Sprite } from 'lib/sprite'

export const eatingDuration = 1500
const eatingSteps = 6

export class Monster extends Sprite {
  eatingStartedAt: undefined | number

  constructor(data: any, speed: number) {
    super(data)
    this.setMovingTowardSpeed(speed)
  }

  draw(dContext: any) {
    let spritePartToUse

    if (this.eatingStartedAt !== undefined) {
      const progress = (Date.now() - this.eatingStartedAt) / eatingDuration
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

    return super.draw(dContext, spritePartToUse)
  }

  startEating(whenDone: () => void) {
    this.eatingStartedAt = Date.now()
    setTimeout(() => {
      this.eatingStartedAt = undefined
      whenDone()
    }, eatingDuration)
  }
}
