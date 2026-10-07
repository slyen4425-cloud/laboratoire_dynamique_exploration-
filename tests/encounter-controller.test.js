import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createEncounterController
} from '../src/encounters/encounter-controller.js';
import {
  createCaptureCreatureCatalogProvider
} from '../src/capture/capture-creature-catalog-provider.js';
import {
  normalizeTerrainFamilyEncounterConfig
} from '../src/encounters/terrain-family-encounter-config.js';
import { normalizeWorldSurface } from '../src/world/surface-model.js';

function catalog() {
  return createCaptureCreatureCatalogProvider({
    schema: 'capture-database-v1',
    version: 1,
    creatures: [
      {
        draft: {
          id: 'crea_fire',
          displayName: 'Feu',
          elements: ['fire'],
          capture: { spawnChance: 100 },
          presentation: null
        }
      }
    ]
  });
}

function encounterConfig(forestChance = 100, roadChance = 0) {
  return normalizeTerrainFamilyEncounterConfig({
    families: [
      {
        terrainFamilyId: 'forest',
        encounterChancePercent: forestChance,
        elementChances: [
          { elementId: 'fire', chancePercent: 100 }
        ]
      },
      {
        terrainFamilyId: 'road',
        encounterChancePercent: roadChance,
        elementChances:
          roadChance > 0
            ? [{ elementId: 'fire', chancePercent: 100 }]
            : []
      }
    ]
  });
}

function area() {
  return {
    id: 'forest-exterior',
    surface: normalizeWorldSurface({
      baseTerrainFamilyId: 'forest',
      baseMaterialId: 'grass.forest',
      routes: [
        {
          id: 'road',
          terrainFamilyId: 'road',
          materialId: 'road.dirt',
          traversalRuleId: 'terrain.road',
          width: 80,
          points: [
            { x: 0, y: 200 },
            { x: 800, y: 200 }
          ]
        }
      ]
    })
  };
}

function step(controller, {
  x,
  y,
  areaId = 'forest-exterior',
  config = encounterConfig(),
  random = () => 0
}) {
  return controller.step({
    area: area(),
    player: {
      currentAreaId: areaId,
      x,
      y
    },
    encounterConfig: config,
    captureCatalog: catalog(),
    playerPartyRef: 'capture-party-preview',
    rulesetId: 'capture.standard.1v1',
    random
  });
}

test('Encounter Controller never rolls while player is stationary', () => {
  let randomCalls = 0;
  const controller = createEncounterController({
    checkDistance: 100
  });

  step(controller, {
    x: 100,
    y: 100,
    random: () => {
      randomCalls += 1;
      return 0;
    }
  });

  for (let index = 0; index < 20; index += 1) {
    const intent = step(controller, {
      x: 100,
      y: 100,
      random: () => {
        randomCalls += 1;
        return 0;
      }
    });
    assert.equal(intent, null);
  }

  assert.equal(randomCalls, 0);
});

test('Encounter Controller checks once after configured travelled distance', () => {
  const controller = createEncounterController({
    checkDistance: 100
  });

  assert.equal(step(controller, { x: 100, y: 100 }), null);
  assert.equal(step(controller, { x: 150, y: 100 }), null);

  const intent = step(controller, { x: 205, y: 100 });

  assert.equal(intent.source, 'terrain-random');
  assert.equal(intent.areaId, 'forest-exterior');
  assert.equal(intent.terrainFamilyId, 'forest');
  assert.equal(intent.elementId, 'fire');
  assert.equal(intent.opponentCreatureId, 'crea_fire');
  assert.equal(intent.playerPartyRef, 'capture-party-preview');
  assert.equal(intent.rulesetId, 'capture.standard.1v1');
  assert.match(intent.encounterId, /^encounter-/);
  assert.match(intent.returnToken, /^return-/);
});

test('safe road family at 0 percent never creates an encounter', () => {
  const controller = createEncounterController({
    checkDistance: 50
  });

  assert.equal(step(controller, { x: 100, y: 200 }), null);
  assert.equal(step(controller, { x: 160, y: 200 }), null);
  assert.equal(step(controller, { x: 220, y: 200 }), null);
});

test('changing Area resets distance instead of treating Portal transition as travel', () => {
  const controller = createEncounterController({
    checkDistance: 100
  });

  assert.equal(step(controller, { x: 100, y: 100 }), null);
  assert.equal(step(controller, { x: 170, y: 100 }), null);

  const result = step(controller, {
    x: 9000,
    y: 9000,
    areaId: 'house-interior-01'
  });

  assert.equal(result, null);
});

test('controller locks while an encounter is active and releases only matching id', () => {
  const controller = createEncounterController({
    checkDistance: 50
  });

  step(controller, { x: 100, y: 100 });
  const intent = step(controller, { x: 160, y: 100 });
  assert.ok(intent);

  assert.equal(step(controller, { x: 260, y: 100 }), null);
  assert.equal(controller.release('wrong-id'), false);
  assert.equal(step(controller, { x: 360, y: 100 }), null);
  assert.equal(controller.release(intent.encounterId), true);

  // first point after release becomes the new movement anchor
  assert.equal(step(controller, { x: 460, y: 100 }), null);
  const next = step(controller, { x: 520, y: 100 });
  assert.ok(next);
  assert.notEqual(next.encounterId, intent.encounterId);
});


test('interior Area with random encounters disabled never rolls terrain-random', () => {
  let randomCalls = 0;
  const controller = createEncounterController({
    checkDistance: 100
  });
  const interior = {
    ...area(),
    id: 'house-interior-01',
    kind: 'interior',
    encounters: {
      randomEnabled: false
    }
  };
  const args = {
    area: interior,
    encounterConfig: encounterConfig(),
    captureCatalog: catalog(),
    playerPartyRef: 'capture-party-preview',
    rulesetId: 'capture.standard.1v1',
    random: () => {
      randomCalls += 1;
      return 0;
    }
  };

  assert.equal(controller.step({
    ...args,
    player: {
      currentAreaId: interior.id,
      x: 100,
      y: 100
    }
  }), null);

  assert.equal(controller.step({
    ...args,
    player: {
      currentAreaId: interior.id,
      x: 260,
      y: 100
    }
  }), null);

  assert.equal(randomCalls, 0);
});

test('Area change into disabled interior resets distance anchor without carrying exterior travel', () => {
  const controller = createEncounterController({
    checkDistance: 100
  });
  const exterior = {
    ...area(),
    kind: 'exterior',
    encounters: {
      randomEnabled: true
    }
  };
  const interior = {
    ...area(),
    id: 'house-interior-01',
    kind: 'interior',
    encounters: {
      randomEnabled: false
    }
  };
  let randomCalls = 0;
  const common = {
    encounterConfig: encounterConfig(),
    captureCatalog: catalog(),
    playerPartyRef: 'capture-party-preview',
    rulesetId: 'capture.standard.1v1',
    random: () => {
      randomCalls += 1;
      return 0;
    }
  };

  assert.equal(controller.step({
    ...common,
    area: exterior,
    player: {
      currentAreaId: exterior.id,
      x: 100,
      y: 100
    }
  }), null);
  assert.equal(controller.step({
    ...common,
    area: exterior,
    player: {
      currentAreaId: exterior.id,
      x: 170,
      y: 100
    }
  }), null);

  assert.equal(controller.step({
    ...common,
    area: interior,
    player: {
      currentAreaId: interior.id,
      x: 360,
      y: 390
    }
  }), null);

  assert.equal(controller.step({
    ...common,
    area: interior,
    player: {
      currentAreaId: interior.id,
      x: 520,
      y: 390
    }
  }), null);

  assert.equal(randomCalls, 0);
});

test('leaving disabled interior restores normal exterior terrain-random checks', () => {
  const controller = createEncounterController({
    checkDistance: 100
  });
  const exterior = {
    ...area(),
    kind: 'exterior',
    encounters: {
      randomEnabled: true
    }
  };
  const interior = {
    ...area(),
    id: 'house-interior-01',
    kind: 'interior',
    encounters: {
      randomEnabled: false
    }
  };
  const common = {
    encounterConfig: encounterConfig(),
    captureCatalog: catalog(),
    playerPartyRef: 'capture-party-preview',
    rulesetId: 'capture.standard.1v1',
    random: () => 0
  };

  assert.equal(controller.step({
    ...common,
    area: interior,
    player: {
      currentAreaId: interior.id,
      x: 360,
      y: 390
    }
  }), null);
  assert.equal(controller.step({
    ...common,
    area: interior,
    player: {
      currentAreaId: interior.id,
      x: 410,
      y: 390
    }
  }), null);

  assert.equal(controller.step({
    ...common,
    area: exterior,
    player: {
      currentAreaId: exterior.id,
      x: 820,
      y: 1100
    }
  }), null);

  const intent = controller.step({
    ...common,
    area: exterior,
    player: {
      currentAreaId: exterior.id,
      x: 930,
      y: 1100
    }
  });

  assert.equal(intent?.source, 'terrain-random');
  assert.equal(intent?.areaId, exterior.id);
});


test('explicit interior randomEnabled override can produce terrain-random', () => {
  const controller = createEncounterController({
    checkDistance: 100
  });
  const dangerousInterior = {
    ...area(),
    id: 'dangerous-cave',
    kind: 'interior',
    encounters: {
      randomEnabled: true
    }
  };
  const common = {
    area: dangerousInterior,
    encounterConfig: encounterConfig(),
    captureCatalog: catalog(),
    playerPartyRef: 'capture-party-preview',
    rulesetId: 'capture.standard.1v1',
    random: () => 0
  };

  assert.equal(controller.step({
    ...common,
    player: {
      currentAreaId: dangerousInterior.id,
      x: 100,
      y: 100
    }
  }), null);

  const intent = controller.step({
    ...common,
    player: {
      currentAreaId: dangerousInterior.id,
      x: 210,
      y: 100
    }
  });

  assert.equal(intent?.source, 'terrain-random');
  assert.equal(intent?.areaId, dangerousInterior.id);
});
