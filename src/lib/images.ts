export function storeLoaded(key: string, image: HTMLImageElement) {
  if (!this.images) {
    this.images = {}
  }

  this.images[key] = image
}

export function getLoaded(key: string): HTMLImageElement | undefined {
  if (this.images[key]) {
    return this.images[key]
  } else {
    return undefined
  }
}
