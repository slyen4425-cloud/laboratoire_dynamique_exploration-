import test from 'node:test';
import assert from 'node:assert/strict';

import { demoWorldDocument } from '../src/world/demo-world.js';
import {
  addSurfacePath,
  createWorldBuilderDraft,
  updateAreaProperties,
  updateSurfacePath,
  updateTerrainFamilyEncounterProfile,
  updateTerrainFamilyElementChance,
  validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';

function draft() {
  return createWorldBuilderDraft(demoWorldDocument);
}

test('Builder edits base terrain family independently from base material', () => {
  const next = updateAreaProperties(
    draft(),
    'forest-exterior',
    {
      baseTerrainFamilyId: 'plain',
      baseMaterialId: 'ground.dirt'
    }
  );

  const surface = next.areas[0].surface;

  assert.equal(surface.baseTerrainFamilyId, 'plain');
  assert.equal(surface.baseMaterialId, 'ground.dirt');
});

test('painted terrain path stores family and material separately', () => {
  const next = addSurfacePath(
    draft(),
    'forest-exterior',
    'terrain',
    {
      terrainFamilyId: 'snow',
      materialId: 'ground.snow',
      width: 180,
      points: [
        { x: 100, y: 100 },
        { x: 400, y: 100 }
      ]
    }
  );

  const zone = next.areas[0].surface.zones.at(-1);

  assert.equal(zone.terrainFamilyId, 'snow');
  assert.equal(zone.materialId, 'ground.snow');
});

test('changing texture does not rewrite an existing terrain family', () => {
  let next = addSurfacePath(
    draft(),
    'forest-exterior',
    'terrain',
    {
      terrainFamilyId: 'mountain',
      materialId: 'ground.dirt',
      points: [
        { x: 100, y: 100 },
        { x: 400, y: 100 }
      ]
    }
  );

  const id = next.areas[0].surface.zones.at(-1).id;

  next = updateSurfacePath(
    next,
    'forest-exterior',
    'terrain',
    id,
    { materialId: 'ground.snow' }
  );

  const zone = next.areas[0].surface.zones.find(
    (item) => item.id === id
  );

  assert.equal(zone.terrainFamilyId, 'mountain');
  assert.equal(zone.materialId, 'ground.snow');
});

test('Builder edits encounter chance and exact element percentages per family', () => {
  let next = updateTerrainFamilyEncounterProfile(
    draft(),
    'forest',
    { encounterChancePercent: 30 }
  );

  next = updateTerrainFamilyElementChance(
    next,
    'forest',
    'nature',
    60
  );
  next = updateTerrainFamilyElementChance(
    next,
    'forest',
    'earth',
    25
  );
  next = updateTerrainFamilyElementChance(
    next,
    'forest',
    'fire',
    15
  );
  next = updateTerrainFamilyElementChance(
    next,
    'forest',
    'water',
    0
  );
  next = updateTerrainFamilyElementChance(
    next,
    'forest',
    'shadow',
    0
  );

  const forest = next.encounterConfig.families.find(
    (entry) => entry.terrainFamilyId === 'forest'
  );

  assert.equal(forest.encounterChancePercent, 30);
  assert.deepEqual(
    forest.elementChances,
    [
      { elementId: 'nature', chancePercent: 60 },
      { elementId: 'earth', chancePercent: 25 },
      { elementId: 'fire', chancePercent: 15 }
    ]
  );

  assert.equal(validateWorldBuilderDraft(next).valid, true);
});

test('active family blocks export when element percentages do not total 100', () => {
  let next = updateTerrainFamilyEncounterProfile(
    draft(),
    'forest',
    { encounterChancePercent: 30 }
  );
  next = updateTerrainFamilyElementChance(
    next,
    'forest',
    'fire',
    50
  );

  const validation = validateWorldBuilderDraft(next);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.errors.includes(
      'encounter-element-total:forest'
    )
  );
});
