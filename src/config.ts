import * as Vec2 from 'lib/vec2'

export const config = {
  scaling: window.devicePixelRatio,
  originalFrameInterval: 20,
  pixelsPerMeter: 18,
  duration: 60000,
  wheelchair: false,
  activeSensoRatio: 1.5 / 3,
  directionAmplitudeRatio: 0.8,
  zoom: {
    min: 1,
    max: 1.8,
    convergenceDuration: 1000,
  },
  dropRate: {
    smallTree: 8,
    tallTree: 8,
    jump: 0.05,
    thickSnow: 1,
    thickerSnow: 1,
    rock: 8,
    side: {
      tallTree: 100,
    },
    skierDirection: {
      any: 3,
    }
  },
  skier: {
    verticalPosRatio: 0.15,
    lyingDurationAfterCrash: 500,
    invincibilityDuration: 3000,
    jump: {
      duration: 1200,
      speed: Vec2.scale(1, Vec2.down),
      landingWidth: 170,
      landingDurationAtJumpingSpeed: 2000,
    },
    inertia: {
      keyboard: 6,
      senso: 1,
    }
  },
  monster: {
    distanceThresholdMeters: 2000,
    eatingDuration: 1500,
    speed: 5,
    dropRate: 0.001,
  },
  snowboarder: {
    minSpeed: 2,
    maxSpeed: 5,
    dropRate: 0.1,
  },
  debug: new URLSearchParams(document.location.search).has('debug'),
}
