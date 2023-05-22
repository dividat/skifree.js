import * as Vec2 from 'lib/vec2'

export const config = {
  scaling: window.devicePixelRatio,
  originalFrameInterval: 20,
  pixelsPerMeter: (diagonal: number) => 18 * diagonal / 2000,
  duration: 60000,
  sensitivity: 1,
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
    // Part of the Senso considered for the movement, from the center of the
    // Senso. 1/3 would mean the maximum amplitude can be reached on the center
    // plate.
    activeSensoRatio: 1.5 / 3, 

    // Max reachable amplitude when lying at the max of the amplitude on the
    // Senso. We discard extremities because it slow down the movement of the
    // skier too much, even if it gives more control.
    directionAmplitudeRatio: 0.6, 

    // Vertical position of the skier on the screen, from 0 (top) to 1 (bottom).
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
    dropRate: 0.001,
    speedConvergenceDuration: 2000,
  },
  snowboarder: {
    minSpeed: 2,
    maxSpeed: 5,
    dropRate: 0.1,
  },
  debug: new URLSearchParams(document.location.search).has('debug'),
}
