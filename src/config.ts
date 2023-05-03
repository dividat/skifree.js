const urlScaling = new URLSearchParams(document.location.search).get('zoom')

export const config = {
  scaling: (urlScaling !== null && parseFloat(urlScaling) || window.devicePixelRatio || 1) * 2,
  originalFrameInterval: 20,
  pixelsPerMeter: 18,
  duration: 60000,
  wheelchair: false,
  monsterDistanceThresholdMeters: 2000,
  activeSensoRatio: 1.5 / 3,
  directionAmplitudeRatio: 0.8,
  dropRate: {
    smallTree: 8,
    tallTree: 13,
    jump: 1,
    thickSnow: 1,
    thickerSnow: 1,
    rock: 8,
    snowboarder: 0.1,
    monster: 0.001,
  },
  skier: {
    lyingDurationAfterCrash: 500,
    invincibilityDuration: 3000,
    jumpDuration: 1200,
  },
  monster: {
    eatingDuration: 1500,
    speed: 4,
  },
  snowboarder: {
    speed: 3,
  },
  debug: new URLSearchParams(document.location.search).has('debug'),
}
