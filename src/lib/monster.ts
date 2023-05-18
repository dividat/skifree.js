import * as Canvas from 'canvas'
import * as Convergence from 'lib/convergence'
import * as Vec2 from 'lib/vec2'
import { Skier } from 'lib/skier'
import { Sprite } from 'lib/sprite'
import { config } from 'config'

const eatingSteps = 6

export class Monster extends Sprite {
  eatingStartedAt: undefined | number
  isEating: boolean
  skier: Skier

  constructor(data: any, skier: Skier) {
    super(data)
    this.skier = skier
  }

  cycle(dt: number) {
    this.movingTowardSpeed = Convergence.converge({
      from: this.movingTowardSpeed,
      to: Vec2.length(this.skier.speed) + 3,
      time: config.monster.speedConvergenceDuration,
      dt
    })
    super.cycle(dt)
  }

  draw(center: Vec2.Vec2, spriteFrame: string, zoom: number) {
    let spritePartToUse

    if (this.eatingStartedAt !== undefined && this.isEating) {
      const progress = (Date.now() - this.eatingStartedAt) / config.monster.eatingDuration
      const eatingStage = Math.min(Math.floor(progress * eatingSteps + 1), eatingSteps)
      spritePartToUse = 'eating' + eatingStage
    } else {
      if (this.movingToward !== undefined && this.movingToward.x !== undefined && this.movingToward.x > this.pos.x) {
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

  canBeDeleted(center: Vec2.Vec2): boolean {
    return this.eatingStartedAt !== undefined && super.canBeDeleted(center)
  }
}
