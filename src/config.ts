import * as Vec2 from 'lib/vec2'

export const config = {
  scaling: window.devicePixelRatio,
  originalFrameInterval: 20,
  pixelsPerMeter: (diagonal: number) => 18 * diagonal / 2000,
  duration: 60000,
  wheelchair: false,
  zoom: {
    min: 1,
    max: 1.8,
    convergenceDuration: 1000,
  },
  dropRate: {
    smallTree: 80,
    tallTree: 80,
    jump: 1,
    thickSnow: 10,
    thickerSnow: 10,
    rock: 80,
    side: {
      tallTree: 1000,
    },
    skierDirection: {
      any: 30,
    }
  },
  skier: {
    activeSensoRatio: 1.5 / 3,
    directionAmplitudeRatio: 0.6,
    verticalPosRatio: 0.15,
    lyingDurationAfterCrash: 500,
    invincibilityDuration: 3000,
    jump: {
      duration: 1200,
      speedFactor: (1 / 3000),
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
