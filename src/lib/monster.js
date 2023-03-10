import { Sprite } from 'lib/sprite'

export class Monster extends Sprite {

  constructor(data, speed) {
    super(data)
    this.eatingStage = 0

    this.isEating = false
    this.isFull = false
    this.setMovingTowardSpeed(speed)
  }

  draw(dContext) {
    const spritePartToUse =
      this.isEating
        ? 'eating' + this.eatingStage
        : (super.getMovingToward()[0] > super.getMapPosition()[0] ? 'sEast' : 'sWest')

    return super.draw(dContext, spritePartToUse)
  }

  startEating(whenDone) {
    this.eatingStage += 1
    this.isEating = true
    if (this.eatingStage <= 6) {
      setTimeout(() => this.startEating(whenDone), 300)
    } else {
      this.eatingStage = 0
      this.isEating = false
      whenDone()
    }
  }
}
