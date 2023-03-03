const Sprite = require('./sprite');

(function (global) {
  function Snowboarder (data) {
    const that = new Sprite(data)
    const sup = {
      draw: that.superior('draw'),
      cycle: that.superior('cycle')
    }
    const directions = {
      sEast: function (xDiff) { return xDiff > 0 },
      sWest: function (xDiff) { return xDiff <= 0 }
    }
    const standardSpeed = 3

    that.setSpeed(standardSpeed)

    function getDirection () {
      const xDiff = that.movingToward[0] - that.mapPosition[0]
      const yDiff = that.movingToward[1] - that.mapPosition[1]

      if (directions.sEast(xDiff)) {
        return 'sEast'
      } else {
        return 'sWest'
      }
    }

    that.cycle = function (dt, dContext) {
      if (Number.random(10) === 1) {
        that.setMapPositionTarget(dContext.getRandomlyInTheCentreOfMap())
        that.setSpeed(standardSpeed + Number.random(-1, 1))
      }

      that.setMapPositionTarget(undefined, dContext.getMapBelowViewport() + 600)

      sup.cycle(dt)
    }

    that.draw = function (dContext) {
      const spritePartToUse = function () {
        return getDirection()
      }

      return sup.draw(dContext, spritePartToUse())
    }

    return that
  }

  global.snowboarder = Snowboarder
})(this)

if (typeof module !== 'undefined') {
  module.exports = this.snowboarder
}
