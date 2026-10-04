import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildingDoorAnchorWorld,
  buildingFootprintRect,
  buildingVisualRect
} from '../src/world/world-object-model.js';
import {
  normalizeWorldObjectPlacements,
  resolveWorldObjectPlacement
} from '../src/world/world-object-placement-model.js';
import {
  circleIntersectsOrientedRect,
  isBlocked
} from '../src/core/collision.js';

function makeBuildingPlacement(
  transform = {}
) {
  return normalizeWorldObjectPlacements([
    {
      id: 'house-1',
      objectDefinitionId:
        'objectdef.building.house.fantasy_wood_stone.01',
      transform: {
        x: 300,
        y: 240,
        rotationDeg: 90,
        scaleX: 1.5,
        scaleY: 0.75,
        ...transform
      }
    }
  ])[0];
}

function makeBuilding(
  transform = {}
) {
  return resolveWorldObjectPlacement(
    makeBuildingPlacement(transform)
  );
}

test('Building placement keeps only reference and transform', () => {
  const placement =
    makeBuildingPlacement();

  assert.equal(
    placement.objectDefinitionId,
    'objectdef.building.house.fantasy_wood_stone.01'
  );
  assert.equal(placement.transform.x, 300);
  assert.equal(
    placement.transform.rotationDeg,
    90
  );

  for (const key of [
    'kind',
    'visual',
    'baseSize',
    'footprint',
    'doorAnchors'
  ]) {
    assert.equal(
      key in placement,
      false
    );
  }
});

test('Building door anchors come from definition and follow placement transform', () => {
  const building =
    makeBuilding();
  const anchor =
    buildingDoorAnchorWorld(
      building,
      'main-door'
    );

  // Definition: height 300 * scaleY .75 * anchor .38 = 85.5.
  // +90° rotation moves local +Y to world -X.
  assert.ok(
    Math.abs(anchor.x - 214.5) <
      1e-9
  );
  assert.ok(
    Math.abs(anchor.y - 240) <
      1e-9
  );
});

test('Building footprint derives from definition and placement', () => {
  const building =
    makeBuilding();
  const visual =
    buildingVisualRect(building);
  const footprint =
    buildingFootprintRect(building);

  assert.equal(visual.width, 450);
  assert.equal(visual.height, 225);
  assert.equal(
    footprint.length,
    450 * 0.78
  );
  assert.equal(
    footprint.width,
    225 * 0.62
  );
});

test('Building collision uses resolved logical footprint while WorldArea stores placement', () => {
  const placement =
    makeBuildingPlacement({
      x: 250,
      y: 250,
      rotationDeg: 30,
      scaleX: 1,
      scaleY: 1
    });
  const building =
    resolveWorldObjectPlacement(
      placement
    );
  const world = {
    width: 700,
    height: 700,
    obstacles: [],
    objects: [placement]
  };
  const entity = {
    radius: 18
  };

  const footprint =
    buildingFootprintRect(building);

  assert.equal(
    circleIntersectsOrientedRect(
      250,
      250,
      entity.radius,
      footprint
    ),
    true
  );
  assert.equal(
    isBlocked(
      world,
      entity,
      250,
      250
    ),
    true
  );
  assert.equal(
    isBlocked(
      world,
      entity,
      500,
      500
    ),
    false
  );
});

test('Building definition owns anchors and placement owns no Portal links', () => {
  const placement =
    makeBuildingPlacement();

  assert.equal(
    'doorAnchors' in placement,
    false
  );
  assert.equal(
    'portalRefs' in placement,
    false
  );

  const building =
    resolveWorldObjectPlacement(
      placement
    );
  assert.equal(
    building.doorAnchors[0].id,
    'main-door'
  );
});
