(function (global) {
  global.inputControl = {
    on: function (event, callback) {
      const eventInfo = event.split('.').map(String.prototype.toLowerCase.apply)
    }
  }
})(this)

if (typeof module !== 'undefined') {
  module.exports = this.inputControl
}
