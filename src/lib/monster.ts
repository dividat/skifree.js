import * as Canvas from 'canvas'
import * as Convergence from 'lib/convergence'
import * as Vec2 from 'lib/vec2'
import * as Random from 'lib/random'
import { Skier } from 'lib/skier'
import { Sprite, collides } from 'lib/sprite'
import { config } from 'config'

const eatingSteps = 6

export class Monster extends Sprite {
  eatingStartedAt: undefined | number
  isEating: boolean
  skier: Skier
  createdAt: number
  enduranceDuration: number
  hasSeenSkierJumping: boolean

  constructor(time: number, data: any, skier: Skier) {
    super(data)
    this.skier = skier
    this.createdAt = time
    this.enduranceDuration = Random.int({ min: config.monster.enduranceDuration.min, max: config.monster.enduranceDuration.max })
    this.hasSeenSkierJumping = false
  }

  cycle(time: number, dt: number) {
    const monsterLife = time - this.createdAt

    const isFollowing = (
      this.eatingStartedAt === undefined
      && this.trackedSpriteToMoveToward !== undefined)

    if (isFollowing) {
      if (!this.hasSeenSkierJumping && this.skier.isJumping()) {
        // Prepare to go away
        this.hasSeenSkierJumping = true
        this.enduranceDuration = monsterLife / config.monster.enduranceDuration.tiredRatio
      }

      if (monsterLife >= this.enduranceDuration) {
        this.stopFollowing()
        this.moveAbove()
      } else {
        const canvasPos = Canvas.mapPositionToCanvasPosition(this.skier.pos, { x: 0, y: this.pos.y - this.height * 0.8 })
        const isPartlyAboveScreen = canvasPos.y < 0

        const isTired = monsterLife >= config.monster.enduranceDuration.tiredRatio * this.enduranceDuration

        // Prevent the monster to lag on top of the screen
        const aboveScreenSpeedBoost = isPartlyAboveScreen && !isTired
          ? 1 + 3 * Math.abs(canvasPos.y) / Canvas.height
          : 1

        // Make the monster to decelerate before going away
        const endOfEnduranceSpeedBoost = isTired
          ? 0.5
          : 1

        const skierSpeed = Vec2.length(this.skier.speed)

        const convergenceTime = isPartlyAboveScreen && !isTired
          ? 0
          : (this.movingTowardSpeed < skierSpeed 
            ? config.monster.speedConvergenceDuration.toAccelerate 
            : config.monster.speedConvergenceDuration.toDecelerate)

        const targetSpeed = Math.max(
          skierSpeed * aboveScreenSpeedBoost * endOfEnduranceSpeedBoost,
          config.monster.minSpeed(Canvas.diagonal))

        this.movingTowardSpeed = Convergence.converge({
          from: this.movingTowardSpeed,
          to: targetSpeed,
          time: convergenceTime,
          dt
        })
      }
    }

    super.cycle(time, dt)
  }

  moveAbove() {
    this.movingToward = Canvas.getRandomMapPositionAboveViewport(this.skier.pos)
  }

  draw(time: number, center: Vec2.Vec2, spriteFrame: string, zoom: number) {
    let spritePartToUse

    // When the monster is waiting for the skier to finish lying before eating
    // him, it causes the monster to go left and right rapidly, then it switch
    // between sEast and sWest. We override this behavior by fixing a direction.
    if (this.eatingStartedAt === undefined && collides(this.getImageBox(), this.skier.getImageBox())) {
      spritePartToUse = 'sEast'
    } else if (this.eatingStartedAt !== undefined && this.isEating) {
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

    return super.draw(time, center, spritePartToUse, zoom)
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
    return this.trackedSpriteToMoveToward === undefined && super.canBeDeleted(center)
  }
}
