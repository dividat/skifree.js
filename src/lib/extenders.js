// Extends function so that new-able objects can be given new methods easily
Function.prototype.method = function (name, func) {
  this.prototype[name] = func
  return this
}

// Will return the original method of an object when inheriting from another
Object.method('superior', function (name) {
  const method = this[name]
  return () => method.apply(this, arguments)
})
