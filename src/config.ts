import * as Vec2 from 'lib/vec2'

export const config = {
  scaling: window.devicePixelRatio,
  originalFrameInterval: 20,
  pixelsPerMeter: (diagonal: number) => diagonal / 250,
  duration: 60000,
  sensitivity: 1,
  spriteSizeReduction: 0.33, // Should be equal to -resize in Makefile
  zoom: {
    min: 1,
    max: 2,
    convergenceDuration: 1000,
  },
  dropRate: {
    smallTree: 12,
    tallTree: 16,
    jump: 2,
    thickSnow: 2,
    thickerSnow: 2,
    rock: 8,
    npc: {
      snowboarder: 0.5,
      monster: 0.06,
    },
    side: {
      tallTree: 100,
    },
    skierDirection: {
      any: 5,
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
    landingWidth: (jumpWidth: number) => jumpWidth * 3,
    landingHeight: (canvasHeight: number) => canvasHeight * 2,
  },
  monster: {
    spawnAfterMetersTravelled: 1000,
    eatingDuration: 1600,
    minSpeed: (canvasDiagonal: number) => canvasDiagonal / 30000,
    enduranceDuration: {
      min: 10000,
      max: 15000,
      tiredRatio: 0.7,
    },
    speedConvergenceDuration: {
      toAccelerate: 2000,
      toDecelerate: 1000
    }
  },
  snowboarder: {
    spawnAfterMetersTravelled: 250,
    minSpeed: 1,
    maxSpeed: 5,
  },
  debug: new URLSearchParams(document.location.search).has('debug'),
}
