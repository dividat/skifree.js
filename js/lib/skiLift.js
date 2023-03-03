const Sprite = require('./sprite')

function SkiLift (data) {
  const that = new Sprite(data)
  const super_draw = that.superior('draw')
  const super_cycle = that.superior('cycle')
  const standardSpeed = 6
  that.setSpeed(standardSpeed)

  that.draw = function (dContext) {
    return super_draw(dContext, 'main')
  }

  that.cycle = function () {
    return super_cycle.apply(arguments)
  }

  return that
}

if (typeof module !== 'undefined') {
  module.exports = SkiLift
}
