import { Sprite } from 'lib/sprite'

export class SpriteArray extends Array<Sprite> {
  pushHandlers: Array<(x: Sprite) => void>

  constructor() {
    super()
    this.pushHandlers = []
  }

  onPush(f: (x: Sprite) => void, retroactive: boolean) {
    this.pushHandlers.push(f)

    if (retroactive) {
      this.forEach(f)
    }
  }

  push(...items: Array<Sprite>): number {
    const res = super.push(...items)
    items.forEach(item => this.pushHandlers.forEach(handler => handler(item)))
    return res
  }

  cull() {
    this.forEach((item, i) => {
      // @ts-ignore
      if (item.deleted) {
        return (delete this[i])
      }
    })
  }
}
