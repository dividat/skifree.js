var Sprite = require('./sprite');

(function (global) {
  function Monster (data) {
    var that = new Sprite(data)
    var super_draw = that.superior('draw')
    var eatingStage = 0
    var standardSpeed = 6

    that.isEating = false
    that.isFull = false
    that.setSpeed(standardSpeed)

    that.draw = function (dContext) {
      var spritePartToUse = function () {
        if (that.isEating) {
          return 'eating' + eatingStage
        }

        return that.movingToward[0] > that.mapPosition[0] ? 'sEast' : 'sWest'
      }

      return super_draw(dContext, spritePartToUse())
    }

    function startEating (whenDone) {
      eatingStage += 1
      that.isEating = true
      that.isMoving = false
      if (eatingStage <= 6) {
        setTimeout(function () {
          startEating(whenDone)
        }, 300)
      } else {
        eatingStage = 0
        that.isEating = false
        that.isMoving = true
        whenDone()
      }
    }

    that.startEating = startEating

    return that
  }

  global.monster = Monster
})(this)

if (typeof module !== 'undefined') {
  module.exports = this.monster
}
