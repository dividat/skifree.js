let seen = false

export function setHasBeenSeen() {
  seen = true
}

export function hasBeenSeen(): boolean {
  return seen
}
