(function (global) {
  var sprites = {
    'skier': {
      parts: {
        blank: [ 0, 0, 0, 0 ],
        east: [ 0, 0, 24, 34 ],
        esEast: { frames: 3, fps: 4 },
        sEast: { frames: 3, fps: 7, sizeMultiple: 0.182 },
        south: { frames: 3, fps: 9 },
        sWest: { frames: 3, fps: 7, sizeMultiple: 0.182 },
        wsWest: { frames: 3, fps: 4 },
        west: [ 0, 37, 24, 34 ],
        hit: { frames: 2, fps: 0.8, sizeMultiple: 0.182 },
        jumping: { frames: 3, fps: 7, sizeMultiple: 0.25 },
        somersault1: [ 116, 0, 32, 34 ],
        somersault2: [ 148, 0, 32, 34 ]
      },
      sizeMultiple: 0.2,
      hitBoxes: {
        0: [ 7, 20, 27, 34 ]
      },
      hitBehaviour: {},
      name: 'skier'
    },
    'smallTree': {
      parts: {
        main: [ 0, 28, 30, 34 ]
      },
      sizeMultiple: 0.2,
      hitBoxes: {
        0: [ 0, 18, 30, 34 ]
      },
      hitBehaviour: {},
      name: 'smallTree'
    },
    'tallTree': {
      parts: {
        main: [ 95, 66, 32, 64 ]
      },
      sizeMultiple: 0.2,
      zIndexesOccupied: [0, 1],
      hitBoxes: {
        0: [0, 54, 32, 64],
        1: [0, 10, 32, 54]
      },
      hitBehaviour: {},
      name: 'tallTree'
    },
    'thickSnow': {
      parts: {
        main: [ 143, 53, 43, 10 ]
      },
      sizeMultiple: 0.2,
      hitBehaviour: {},
      name: 'thickSnow'
    },
    'thickerSnow': {
      parts: {
        main: [ 143, 53, 43, 10 ]
      },
      sizeMultiple: 0.2,
      hitBehaviour: {},
      name: 'thickerSnow'
    },
    'rock': {
      parts: {
        main: [ 30, 52, 23, 11 ]
      },
      sizeMultiple: 0.2,
      hitBehaviour: {},
      name: 'rock'
    },
    'monster': {
      parts: {
	sEast: { frames: 11, fps: 7 },
	sWest: { frames: 11, fps: 7 },
        eating1: {},
        eating2: {},
        eating3: {},
        eating4: {},
        eating5: {},
        eating6: {}
      },
      sizeMultiple: 0.2,
      hitBehaviour: {},
      name: 'monster'
    },
    'jump': {
      parts: {
        main: [ 109, 55, 32, 8 ]
      },
      sizeMultiple: 0.2,
      hitBehaviour: {},
      name: 'jump'
    },
    'signStart': {
      parts: {
        main: [ 260, 103, 42, 27 ]
      },
      sizeMultiple: 0.15,
      hitBehaviour: {},
      name: 'signStart'
    },
    'snowboarder': {
      parts: {
        sEast: { frames: 3, fps: 7 },
        sWest: { frames: 3, fps: 7 }
      },
      sizeMultiple: 0.28,
      hitBehaviour: {},
      name: 'snowboarder'
    }
  }

  function monsterHitsTreeBehaviour (monster) {
    monster.deleteOnNextCycle()
  }

  sprites.monster.hitBehaviour.tree = monsterHitsTreeBehaviour

  function treeHitsMonsterBehaviour (tree, monster) {
    monster.deleteOnNextCycle()
  }

  sprites.smallTree.hitBehaviour.monster = treeHitsMonsterBehaviour
  sprites.tallTree.hitBehaviour.monster = treeHitsMonsterBehaviour

  function skierHitsTreeBehaviour (skier, tree) {
    skier.hasHitObstacle(tree)
  }

  function treeHitsSkierBehaviour (tree, skier) {
    skier.hasHitObstacle(tree)
  }

  sprites.smallTree.hitBehaviour.skier = treeHitsSkierBehaviour
  sprites.tallTree.hitBehaviour.skier = treeHitsSkierBehaviour

  function rockHitsSkierBehaviour (rock, skier) {
    skier.hasHitObstacle(rock)
  }

  sprites.rock.hitBehaviour.skier = rockHitsSkierBehaviour

  function skierHitsJumpBehaviour (skier, jump) {
    skier.hasHitJump(jump)
  }

  function jumpHitsSkierBehaviour (jump, skier) {
    skier.hasHitJump(jump)
  }

  sprites.jump.hitBehaviour.skier = jumpHitsSkierBehaviour

// Really not a fan of this behaviour.
/*  function skierHitsThickSnowBehaviour(skier, thickSnow) {
    // Need to implement this properly
    skier.setSpeed(2);
    setTimeout(function() {
      skier.resetSpeed();
    }, 700);
  }

  function thickSnowHitsSkierBehaviour(thickSnow, skier) {
    // Need to implement this properly
    skier.setSpeed(2);
    setTimeout(function() {
      skier.resetSpeed();
    }, 300);
  } */

  // sprites.thickSnow.hitBehaviour.skier = thickSnowHitsSkierBehaviour;

  function snowboarderHitsSkierBehaviour (snowboarder, skier) {
    skier.hasHitObstacle(snowboarder)
  }

  sprites.snowboarder.hitBehaviour.skier = snowboarderHitsSkierBehaviour

  global.spriteInfo = sprites
})(this)

if (typeof module !== 'undefined') {
  module.exports = this.spriteInfo
}
