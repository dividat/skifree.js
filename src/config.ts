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
    smallTree: 130,
    tallTree: 170,
    jump: 20,
    thickSnow: 20,
    thickerSnow: 20,
    rock: 100,
    side: {
      tallTree: 1000,
    },
    skierDirection: {
      any: 50,
    }
  },
  skier: {
    activeSensoRatio: 1.5 / 3,
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
