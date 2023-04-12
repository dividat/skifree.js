export interface Config {
  zoom: number
  originalFrameInterval: number
  debug: boolean
}

const urlZoom = new URLSearchParams(document.location.search).get('zoom')

export const config = {
  zoom: (urlZoom !== null && parseFloat(urlZoom) || window.devicePixelRatio || 1) * 3,
  originalFrameInterval: 20,
  debug: new URLSearchParams(document.location.search).has('debug')
}
