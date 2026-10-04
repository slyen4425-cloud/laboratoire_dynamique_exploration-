import test from 'node:test';
import assert from 'node:assert/strict';

import {
  demoWorldDocument
} from '../src/world/demo-world.js';
import {
  addSurfacePath,
  addTerrainFamilyDefinition,
  createWorldBuilderDraft,
  deleteTerrainFamilyDefinition,
  importWorldBuilderDocument,
  serializeWorldBuilderDraft,
  updateAreaProperties,
  updateSurfacePath,
  updateTerrainFamilyDefinition,
  updateTerrainFamilyEncounterProfile,
  updateTerrainFamilyElementChance,
  validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';

function draft() {
  return createWorldBuilderDraft(
    demoWorldDocument
  );
}

test('Builder edits base terrain family independently from base material', () => {
  const next = updateAreaProperties(
    draft(),
    'forest-exterior',
    {
      baseTerrainFamilyId: 'plain',
      baseMaterialId:
        'ground.dirt'
    }
  );

  const surface =
    next.areas[0].surface;

  assert.equal(
    surface.baseTerrainFamilyId,
    'plain'
  );
  assert.equal(
    surface.baseMaterialId,
    'ground.dirt'
  );
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

  const zone =
    next.areas[0].surface.zones.at(-1);

  assert.equal(
    zone.terrainFamilyId,
    'snow'
  );
  assert.equal(
    zone.materialId,
    'ground.snow'
  );
});

test('changing texture does not rewrite an existing terrain family', () => {
  let next = addSurfacePath(
    draft(),
    'forest-exterior',
    'terrain',
    {
      terrainFamilyId:
        'mountain',
      materialId:
        'ground.dirt',
      points: [
        { x: 100, y: 100 },
        { x: 400, y: 100 }
      ]
    }
  );

  const id =
    next.areas[0]
      .surface.zones.at(-1).id;

  next = updateSurfacePath(
    next,
    'forest-exterior',
    'terrain',
    id,
    {
      materialId: 'ground.snow'
    }
  );

  const zone =
    next.areas[0]
      .surface.zones.find(
        (item) => item.id === id
      );

  assert.equal(
    zone.terrainFamilyId,
    'mountain'
  );
  assert.equal(
    zone.materialId,
    'ground.snow'
  );
});

test('Builder edits encounter chance and exact element percentages per family', () => {
  let next =
    updateTerrainFamilyEncounterProfile(
      draft(),
      'forest',
      {
        encounterChancePercent: 30
      }
    );

  next =
    updateTerrainFamilyElementChance(
      next,
      'forest',
      'nature',
      60
    );
  next =
    updateTerrainFamilyElementChance(
      next,
      'forest',
      'earth',
      25
    );
  next =
    updateTerrainFamilyElementChance(
      next,
      'forest',
      'fire',
      15
    );

  const forest =
    next.encounterConfig.families.find(
      (entry) =>
        entry.terrainFamilyId ===
        'forest'
    );

  assert.equal(
    forest.encounterChancePercent,
    30
  );
  assert.deepEqual(
    forest.elementChances,
    [
      {
        elementId: 'nature',
        chancePercent: 60
      },
      {
        elementId: 'earth',
        chancePercent: 25
      },
      {
        elementId: 'fire',
        chancePercent: 15
      }
    ]
  );

  assert.equal(
    validateWorldBuilderDraft(next)
      .valid,
    true
  );
});

test('active family blocks export when element percentages do not total 100', () => {
  let next =
    updateTerrainFamilyEncounterProfile(
      draft(),
      'forest',
      {
        encounterChancePercent: 30
      }
    );

  next =
    updateTerrainFamilyElementChance(
      next,
      'forest',
      'fire',
      50
    );

  const validation =
    validateWorldBuilderDraft(next);

  assert.equal(
    validation.valid,
    false
  );
  assert.ok(
    validation.errors.includes(
      'encounter-element-total:forest'
    )
  );
});

test('route and river terrain families are editable independently from geometry and texture kind', () => {
  let next = addSurfacePath(
    draft(),
    'forest-exterior',
    'route',
    {
      terrainFamilyId:
        'volcano',
      materialId:
        'road.dirt',
      points: [
        { x: 10, y: 10 },
        { x: 200, y: 10 }
      ]
    }
  );

  next = addSurfacePath(
    next,
    'forest-exterior',
    'river',
    {
      terrainFamilyId:
        'forest',
      materialId:
        'water.forest_stream',
      points: [
        { x: 10, y: 50 },
        { x: 200, y: 50 }
      ]
    }
  );

  const area = next.areas[0];

  assert.equal(
    area.surface.routes.at(-1)
      .terrainFamilyId,
    'volcano'
  );
  assert.equal(
    area.surface.rivers.at(-1)
      .terrainFamilyId,
    'forest'
  );

  const routeId =
    area.surface.routes.at(-1).id;
  const riverId =
    area.surface.rivers.at(-1).id;

  next = updateSurfacePath(
    next,
    'forest-exterior',
    'route',
    routeId,
    {
      terrainFamilyId: 'snow'
    }
  );
  next = updateSurfacePath(
    next,
    'forest-exterior',
    'river',
    riverId,
    {
      terrainFamilyId: 'plain'
    }
  );

  assert.equal(
    next.areas[0].surface.routes
      .find(
        (item) =>
          item.id === routeId
      ).terrainFamilyId,
    'snow'
  );
  assert.equal(
    next.areas[0].surface.rivers
      .find(
        (item) =>
          item.id === riverId
      ).terrainFamilyId,
    'plain'
  );
});

test('Builder can add and rename a custom terrain family with a safe encounter profile', () => {
  let next = addTerrainFamilyDefinition(
    draft(),
    {
      id: 'swamp',
      label: 'Marais'
    }
  );

  assert.ok(
    next.terrainFamilies.some(
      (family) =>
        family.id === 'swamp' &&
        family.label === 'Marais'
    )
  );
  assert.deepEqual(
    next.encounterConfig.families
      .find(
        (profile) =>
          profile.terrainFamilyId ===
          'swamp'
      ),
    {
      terrainFamilyId: 'swamp',
      encounterChancePercent: 0,
      elementChances: []
    }
  );

  next =
    updateTerrainFamilyDefinition(
      next,
      'swamp',
      {
        label: 'Marais sombre'
      }
    );

  assert.equal(
    next.terrainFamilies.find(
      (family) =>
        family.id === 'swamp'
    ).label,
    'Marais sombre'
  );
});

test('deleting a terrain family is protected while it is used and allowed when unused', () => {
  let next = addTerrainFamilyDefinition(
    draft(),
    {
      id: 'swamp',
      label: 'Marais'
    }
  );

  next = updateAreaProperties(
    next,
    'forest-exterior',
    {
      baseTerrainFamilyId:
        'swamp'
    }
  );

  const protectedDelete =
    deleteTerrainFamilyDefinition(
      next,
      'swamp'
    );

  assert.ok(
    protectedDelete.terrainFamilies
      .some(
        (family) =>
          family.id === 'swamp'
      )
  );

  let unused =
    addTerrainFamilyDefinition(
      draft(),
      {
        id: 'crystal',
        label: 'Cristal'
      }
    );

  unused =
    deleteTerrainFamilyDefinition(
      unused,
      'crystal'
    );

  assert.equal(
    unused.terrainFamilies.some(
      (family) =>
        family.id === 'crystal'
    ),
    false
  );
  assert.equal(
    unused.encounterConfig.families
      .some(
        (profile) =>
          profile.terrainFamilyId ===
          'crystal'
      ),
    false
  );
});

test('custom terrain family and encounter config survive Builder export/import', () => {
  let next = addTerrainFamilyDefinition(
    draft(),
    {
      id: 'swamp',
      label: 'Marais'
    }
  );

  next = addSurfacePath(
    next,
    'forest-exterior',
    'terrain',
    {
      terrainFamilyId:
        'swamp',
      materialId:
        'grass.forest',
      width: 240,
      points: [
        { x: 200, y: 200 },
        { x: 500, y: 240 }
      ]
    }
  );

  next =
    updateTerrainFamilyEncounterProfile(
      next,
      'swamp',
      {
        encounterChancePercent: 31
      }
    );

  next =
    updateTerrainFamilyElementChance(
      next,
      'swamp',
      'water',
      100
    );

  const json =
    serializeWorldBuilderDraft(next);
  const imported =
    importWorldBuilderDocument(json);

  assert.equal(
    imported.terrainFamilies.find(
      (family) =>
        family.id === 'swamp'
    ).label,
    'Marais'
  );
  assert.equal(
    imported.areas[0]
      .surface.zones.at(-1)
      .terrainFamilyId,
    'swamp'
  );
  assert.equal(
    imported.encounterConfig.families
      .find(
        (entry) =>
          entry.terrainFamilyId ===
          'swamp'
      ).encounterChancePercent,
    31
  );
  assert.equal(
    validateWorldBuilderDraft(
      imported
    ).valid,
    true
  );
});
