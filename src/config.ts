import * as Vec2 from 'lib/vec2'

export const config = {
  scaling: window.devicePixelRatio,
  originalFrameInterval: 20,
  pixelsPerMeter: (diagonal: number) => 18 * diagonal / 2000,
  duration: 60000,
  wheelchair: false,
  spriteSizeReduction: 0.33, // Should be equal to -resize in Makefile
  zoom: {
    min: 1,
    max: 2,
    convergenceDuration: 1000,
  },
  dropRate: {
    smallTree: 13,
    tallTree: 17,
    jump: 2,
    thickSnow: 2,
    thickerSnow: 2,
    rock: 10,
    npc: {
      snowboarder: 1,
      monster: 0.15,
    },
    side: {
      tallTree: 100,
    },
    skierDirection: {
      any: 5,
    }
  },
  skier: {
    activeSensoRatio: 1 / 3,
    directionAmplitudeRatio: 0.6,
    verticalPosRatio: 0.15,
    lyingDurationAfterCrash: 500,
    invincibilityDuration: 3000,
    inertia: {
      keyboard: 6,
      senso: 0.5,
    }
  },
  jump: {
    // Ensure there is a free area before jumping
    freeAreaOnTop: (jumpHeight: number) => 2 * jumpHeight,
    // Jump length should be at least the screen height, so that we prevent
    // creating objects in landing area once the jump has been taken.
    length: (canvasHeight: number) => canvasHeight * 1.2,
    speed: (canvasDiagonal: number) => canvasDiagonal / 3000,
    landingWidth: 170,
    landingHeight: (canvasHeight: number) => canvasHeight * 2,
  },
  monster: {
    distanceThresholdMeters: 1000,
    eatingDuration: 1600,
    skierSpeedFactor: 1,
    enduranceDuration: {
      min: 10000,
      max: 15000,
      tiredRatio: 0.9,
    },
    speedConvergenceDuration: {
      toAccelerate: 1500,
      toDecelerate: 1500
    }
  },
  snowboarder: {
    minSpeed: 1,
    maxSpeed: 5,
  },
  debug: new URLSearchParams(document.location.search).has('debug'),
}
