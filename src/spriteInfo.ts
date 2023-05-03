import { Sprite } from 'lib/sprite'
import { Skier } from 'lib/skier'

export const sprites: any = {
  'skier': {
    parts: {
      east: {
        hitBox: {
          x: 198,
          y: 366,
          width: 402,
          height: 57
        }
      },
      esEast: {
        frames: 3,
        fps: 4,
        hitBox: {
          x: 240,
          y: 348,
          width: 338,
          height: 80
        }
      },
      sEast: {
        frames: 3,
        fps: 7,
        sizeMultiple: 0.182,
        hitBox: {
          x: 209,
          y: 322,
          width: 219,
          height: 221
        }
      },
      south: {
        frames: 3,
        fps: 9,
        hitBox: {
          x: 115,
          y: 178,
          width: 148,
          height: 394
        }
      },
      sWest: {
        frames: 3,
        fps: 7,
        sizeMultiple: 0.182,
        hitBox: {
          x: 117,
          y: 313,
          width: 242,
          height: 246
        }
      },
      wsWest: {
        frames: 3,
        fps: 4,
        hitBox: {
          x: 55,
          y: 345,
          width: 343,
          height: 103
        }
      },
      west: {
        hitBox: {
          x: 40,
          y: 365,
          width: 409,
          height: 61
        }
      },
      hit: {
        frames: 2,
        fps: 0.8,
        sizeMultiple: 0.182
      },
      jumping: {
        frames: 3,
        fps: 7,
        sizeMultiple: 0.25
      },
    },
    sizeMultiple: 0.2,
    name: 'skier'
  },
  'smallTree': {
    parts: {
      main: {
        hitBox: {
          x: 168,
          y: 170,
          width: 25,
          height: 89
        }
      }
    },
    sizeMultiple: 0.2,
    hitBehaviour: {
      skier: (tree: Sprite, skier: Skier) => skier.hasHitObstacle(tree)
    },
    name: 'smallTree'
  },
  'tallTree': {
    parts: {
      main: {
        hitBox: {
          x: 137,
          y: 661,
          width: 327,
          height: 130,
        }
      }
    },
    sizeMultiple: 0.2,
    hitBehaviour: {
      skier: (tree: Sprite, skier: Skier) => skier.hasHitObstacle(tree)
    },
    name: 'tallTree'
  },
  'thickSnow': {
    parts: {
      main: {}
    },
    sizeMultiple: 0.2,
    name: 'thickSnow'
  },
  'thickerSnow': {
    parts: {
      main: {}
    },
    sizeMultiple: 0.2,
    name: 'thickerSnow'
  },
  'rock': {
    parts: {
      main: {
        hitBox: {
          x: 134,
          y: 32,
          width: 319,
          height: 50
        }
      }
    },
    sizeMultiple: 0.2,
    hitBehaviour: {
      skier: (rock: Sprite, skier: Skier) => skier.hasHitObstacle(rock)
    },
    name: 'rock'
  },
  'monster': {
    parts: {
      sEast: {
        frames: 11,
        fps: 7,
        hitBox: {
          x: 167,
          y: 48,
          width: 300,
          height: 486
        }
      },
      sWest: {
        frames: 11,
        fps: 7,
        hitBox: {
          x: 83,
          y: 40,
          width: 305,
          height: 465
        }
      },
      eating1: {},
      eating2: {},
      eating3: {},
      eating4: {},
      eating5: {},
      eating6: {}
    },
    sizeMultiple: 0.2,
    name: 'monster'
  },
  'jump': {
    parts: {
      main: {
        hitBox: {
          x: 166,
          y: 4,
          width: 430,
          height: 205
        }
      }
    },
    sizeMultiple: 0.2,
    hitBehaviour: {
      skier: (jump: Sprite, skier: Skier) => skier.hasHitJump()
    },
    name: 'jump'
  },
  'signStart': {
    parts: {
      main: {}
    },
    sizeMultiple: 0.15,
    name: 'signStart'
  },
  'cottage': {
    parts: {
      main: {
        frames: 12,
        fps: 4,
        delay: 3000
      }
    },
    sizeMultiple: 0.2,
    name: 'cottage'
  },
  'snowboarder': {
    parts: {
      sEast: {
        frames: 3,
        fps: 7,
        hitBox: {
          x: 142,
          y: 296,
          width: 81,
          height: 84
        }
      },
      sWest: {
        frames: 3,
        fps: 7,
        hitBox: {
          x: 101,
          y: 298,
          width: 76,
          height: 85
        }
      }
    },
    sizeMultiple: 0.28,
    hitBehaviour: {
      skier: (snowboarder: Sprite, skier: Skier) => skier.hasHitObstacle(snowboarder)
    },
    name: 'snowboarder'
  }
}
