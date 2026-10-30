import test from 'node:test';
import assert from 'node:assert/strict';
import { createSculptSurface, appendSculptSurfaceStroke } from '../src/world/sculpt-surface-paint.js';
import { createSculptTerrain } from '../src/world/sculpt-height-model.js';
import { serializeSculptPreviewScene, importSculptPreviewScene } from '../src/world/sculpt-scene-preview.js';
import { resolveTerrainFamilyAtPoint } from '../src/encounters/terrain-family-resolver.js';

const points = [{ x: 20, y: 20 }, { x: 160, y: 20 }];

test('sculpt paint writes explicit semantic family regardless of selected visual texture', () => {
  for (const materialId of ['ground.snow', 'ground.sand', 'ground.mountain_rock']) {
    const surface = appendSculptSurfaceStroke(createSculptSurface(), {
      materialId, terrainFamilyId: 'forest', points, width: 60
    });
    assert.equal(surface.zones[0].terrainFamilyId, 'forest');
    assert.equal(resolveTerrainFamilyAtPoint(surface, 80, 20).terrainFamilyId, 'forest');
  }
});

test('one material may represent different gameplay terrain families', () => {
  const snow = appendSculptSurfaceStroke(createSculptSurface(), {
    materialId: 'ground.snow', terrainFamilyId: 'snow', points, width: 50
  });
  const volcano = appendSculptSurfaceStroke(createSculptSurface(), {
    materialId: 'ground.snow', terrainFamilyId: 'volcano', points, width: 50
  });
  assert.equal(snow.zones[0].materialId, volcano.zones[0].materialId);
  assert.equal(snow.zones[0].terrainFamilyId, 'snow');
  assert.equal(volcano.zones[0].terrainFamilyId, 'volcano');
});

test('base family survives sculpt scene export without any painted strokes', () => {
  const terrain = createSculptTerrain({width: 12,height: 12});
  const surface = { ...createSculptSurface(), baseTerrainFamilyId: 'mountain' };
  const roundtrip = importSculptPreviewScene(serializeSculptPreviewScene(terrain, [], surface));
  assert.equal(roundtrip.surface.baseTerrainFamilyId, 'mountain');
  assert.equal(roundtrip.surface.zones.length, 0);
  assert.equal(resolveTerrainFamilyAtPoint(roundtrip.surface, 90, 90).terrainFamilyId, 'mountain');
});
