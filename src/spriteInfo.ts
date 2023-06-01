import { Sprite } from 'lib/sprite'
import { Skier } from 'lib/skier'

export const spriteInfo: any = {
  'skier': {
    parts: {
      east: {
        hitBoxes: [
          {
            x: 242,
            y: 364,
            width: 341,
            height: 67
          }
        ]
      },
      esEast: {
        frames: 3,
        fps: 4,
        hitBoxes: [
          {
            x: 317,
            y: 316,
            width: 159,
            height: 118
          },
          {
            x: 248,
            y: 335,
            width: 68,
            height: 78
          },
          {
            x: 384,
            y: 382,
            width: 164,
            height: 75
          },
        ]
      },
      sEast: {
        frames: 3,
        fps: 7,
        sizeMultiple: 0.91,
        hitBoxes: [
          {
            x: 191,
            y: 349,
            width: 145,
            height: 45
          },
          {
            x: 234,
            y: 394,
            width: 156,
            height: 96
          },
          {
            x: 289,
            y: 499,
            width: 126,
            height: 56
          }
        ]
      },
      south: {
        frames: 3,
        fps: 9,
        hitBoxes: [
          {
            x: 136,
            y: 250,
            width: 95,
            height: 233
          }
        ]
      },
      sWest: {
        frames: 3,
        fps: 7,
        sizeMultiple: 0.91,
        hitBoxes: [
          {
            x: 150,
            y: 383,
            width: 149,
            height: 129
          },
          {
            x: 225,
            y: 328,
            width: 115,
            height: 89
          },
          {
            x: 117,
            y: 507,
            width: 141,
            height: 38
          }
        ]
      },
      wsWest: {
        frames: 3,
        fps: 4,
        hitBoxes: [
          {
            x: 300,
            y: 335,
            width: 66,
            height: 80
          },
          {
            x: 150,
            y: 313,
            width: 150,
            height: 125
          },
          {
            x: 86,
            y: 378,
            width: 120,
            height: 79
          },
        ]
      },
      west: {
        hitBoxes: [
          {
            x: 56,
            y: 362,
            width: 352,
            height: 67
          }
        ]
      },
      hit: {
        frames: 2,
        fps: 0.8,
        sizeMultiple: 0.91,
        hitBoxes: [
          {
            x: 181,
            y: 293,
            width: 323,
            height: 145
          }
        ]
      },
      jumping: {
        frames: 3,
        fps: 7,
        sizeMultiple: 1.25
      },
    },
    name: 'skier'
  },
  'smallTree': {
    parts: {
      main: {
        hitBoxes: [
          {
            x: 168,
            y: 170,
            width: 25,
            height: 89
          }
        ]
      }
    },
    name: 'smallTree'
  },
  'tallTree': {
    parts: {
      main: {
        hitBoxes: [
          {
            x: 226,
            y: 651,
            width: 121,
            height: 160,
          }
        ]
      }
    },
    name: 'tallTree'
  },
  'thickSnow': {
    parts: {
      main: {}
    },
    name: 'thickSnow'
  },
  'thickerSnow': {
    parts: {
      main: {}
    },
    name: 'thickerSnow'
  },
  'rock': {
    parts: {
      main: {
        hitBoxes: [
          {
            x: 134,
            y: 32,
            width: 319,
            height: 50
          }
        ]
      }
    },
    name: 'rock'
  },
  'monster': {
    parts: {
      sEast: {
        frames: 11,
        fps: 7,
        hitBoxes: [
          {
            x: 167,
            y: 48,
            width: 300,
            height: 486
          }
        ]
      },
      sWest: {
        frames: 11,
        fps: 7,
        hitBoxes: [
          {
            x: 83,
            y: 40,
            width: 305,
            height: 465
          }
        ]
      },
      eating1: {},
      eating2: {},
      eating3: {},
      eating4: {},
      eating5: {},
      eating6: {}
    },
    name: 'monster'
  },
  'jump': {
    parts: {
      main: {
        hitBoxes: [
          {
            x: 166,
            y: 4,
            width: 430,
            height: 205
          },
          {
            x: 118,
            y: 45,
            width: 48,
            height: 175
          },
          {
            x: 72,
            y: 108,
            width: 46,
            height: 119
          },
          {
            x: 72,
            y: 108,
            width: 46,
            height: 119
          },
          {
            x: 597,
            y: 45,
            width: 62,
            height: 171
          },
          {
            x: 658,
            y: 111,
            width: 56,
            height: 103
          }
        ]
      }
    },
    name: 'jump'
  },
  'signStart': {
    parts: {
      main: {}
    },
    sizeMultiple: 0.75,
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
    name: 'cottage'
  },
  'snowboarder': {
    parts: {
      sEast: {
        frames: 3,
        fps: 7,
        hitBoxes: [
          {
            x: 142,
            y: 296,
            width: 81,
            height: 84
          },
          {
            x: 107,
            y: 244,
            width: 119,
            height: 92
          },
          {
            x: 172,
            y: 379,
            width: 79,
            height: 42
          }
        ]
      },
      sWest: {
        frames: 3,
        fps: 7,
        hitBoxes: [
          {
            x: 101,
            y: 298,
            width: 76,
            height: 85
          },
          {
            x: 63,
            y: 373,
            width: 81,
            height: 48
          },
          {
            x: 159,
            y: 249,
            width: 52,
            height: 79
          }
        ]
      }
    },
    sizeMultiple: 1.4,
    name: 'snowboarder'
  }
}
