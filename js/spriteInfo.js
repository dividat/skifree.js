(function (global) {
  var sprites = {
    'skier': {
      parts: {
        blank: [ 0, 0, 0, 0 ],
        east: { offsets: [ 0.1, 0.125, 0.15, 0.45 ] },
        esEast: { frames: 3, fps: 4, offsets: [ 0.5, 0.2, 0.15, 0.5 ] },
        sEast: { frames: 3, fps: 7, sizeMultiple: 0.182, offsets: [ 0.4, 0.2, 0.15, 0.45] },
        south: { frames: 3, fps: 9, offsets: [ 0.15, 0.3, 0.15, 0.2 ] },
        sWest: { frames: 3, fps: 7, sizeMultiple: 0.182, offsets: [ 0.4, 0.45, 0.15, 0.2 ] },
        wsWest: { frames: 3, fps: 4, offsets: [ 0.5, 0.5, 0.15, 0.2 ] },
        west: { offsets: [ 0.1, 0.45, 0.15, 0.125 ] },
        hit: { frames: 2, fps: 0.8, sizeMultiple: 0.182 },
        jumping: { frames: 3, fps: 7, sizeMultiple: 0.25, offsets: [ 0.25, 0.4, 0.3, 0.4 ] },
      },
      sizeMultiple: 0.2,
      hitBehaviour: {},
      name: 'skier'
    },
    'smallTree': {
      parts: {
        main: { offsets: [ 0.2, 0.3, 0.1, 0.35 ] }
      },
      sizeMultiple: 0.2,
      hitBehaviour: {},
      name: 'smallTree'
    },
    'tallTree': {
      parts: {
        main: { offsets: [ 0.25, 0.2, 0.1, 0.2 ] }
      },
      sizeMultiple: 0.2,
      hitBehaviour: {},
      name: 'tallTree'
    },
    'thickSnow': {
      parts: {
        main: [ 143, 53, 43, 10 ]
      },
      sizeMultiple: 0.2,
      hitBehaviour: {},
      isPassable: true,
      name: 'thickSnow'
    },
    'thickerSnow': {
      parts: {
        main: [ 143, 53, 43, 10 ]
      },
      sizeMultiple: 0.2,
      hitBehaviour: {},
      isPassable: true,
      name: 'thickerSnow'
    },
    'rock': {
      parts: {
        main: { offsets: [ 0, 0, 0, 0.3 ] }
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
        main: { offsets: [ 0, 0.25, 0.6, 0.2 ] }
      },
      sizeMultiple: 0.2,
      hitBehaviour: {},
      isPassable: true,
      name: 'jump'
    },
    'signStart': {
      parts: {
        main: [ 260, 103, 42, 27 ]
      },
      sizeMultiple: 0.15,
      hitBehaviour: {},
      isPassable: true,
      name: 'signStart'
    },
    'cottage': {
      parts: {
        main: { frames: 12, fps: 4, delay: 3000 }
      },
      sizeMultiple: 0.2,
      hitBehaviour: {},
      isPassable: true,
      name: 'cottage'
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
