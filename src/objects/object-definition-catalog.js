export const OBJECT_DEFINITION_SCHEMA_VERSION = 1;

function frozen(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  for (const child of Object.values(value)) {
    frozen(child);
  }

  return Object.freeze(value);
}

const DEFINITIONS = frozen([
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.wood.rustic_bank.01',
    label: 'Pont bois rustique',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.wood.rustic_bank.01'
    },
    baseSize: {
      length: 170,
      width: 96
    },
    traversal: {
      enabled: true,
      lengthRatio: 0.92,
      widthRatio: 0.82,
      edgeAssistRatio: 0.15,
      traversalRuleId: 'terrain.bridge'
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.stone.medieval_bank.01',
    label: 'Pont pierre médiéval',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.stone.medieval_bank.01'
    },
    baseSize: {
      length: 170,
      width: 96
    },
    traversal: {
      enabled: true,
      lengthRatio: 0.92,
      widthRatio: 0.82,
      edgeAssistRatio: 0.15,
      traversalRuleId: 'terrain.bridge'
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.wood.rope_bank.01',
    label: 'Pont suspendu bois',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.wood.rope_bank.01'
    },
    baseSize: {
      length: 170,
      width: 96
    },
    traversal: {
      enabled: true,
      lengthRatio: 0.92,
      widthRatio: 0.82,
      edgeAssistRatio: 0.15,
      traversalRuleId: 'terrain.bridge'
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.stone.moss_bank.01',
    label: 'Pont pierre moussu',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.stone.moss_bank.01'
    },
    baseSize: {
      length: 170,
      width: 96
    },
    traversal: {
      enabled: true,
      lengthRatio: 0.92,
      widthRatio: 0.82,
      edgeAssistRatio: 0.15,
      traversalRuleId: 'terrain.bridge'
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.house.fantasy_wood_stone.01',
    label: 'Maison bois et pierre',
    kind: 'building',
    visual: {
      assetId: 'object.building.house.fantasy_wood_stone.01'
    },
    baseSize: {
      width: 300,
      height: 300
    },
    footprint: {
      enabled: true,
      widthRatio: 0.78,
      heightRatio: 0.62,
      offsetX: 0,
      offsetY: -0.08
    },
    doorAnchors: [
      {
        id: 'main-door',
        x: 0,
        y: 0.38
      }
    ]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.house.blue_cottage.01',
    label: 'Chaumière au toit bleu',
    kind: 'building',
    visual: { assetId: 'object.building.house.blue_cottage.01' },
    baseSize: { width: 260, height: 240 },
    footprint: { enabled: true, widthRatio: 0.76, heightRatio: 0.68, offsetX: 0, offsetY: 0.02 },
    doorAnchors: [{ id: 'main-door', x: 0, y: 0.46 }]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.house.red_tile.01',
    label: 'Maison au toit rouge',
    kind: 'building',
    visual: { assetId: 'object.building.house.red_tile.01' },
    baseSize: { width: 330, height: 280 },
    footprint: { enabled: true, widthRatio: 0.78, heightRatio: 0.7, offsetX: 0, offsetY: 0.02 },
    doorAnchors: [{ id: 'main-door', x: 0, y: 0.46 }]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.inn.golden_thatch.01',
    label: 'Grande auberge au toit doré',
    kind: 'building',
    visual: { assetId: 'object.building.inn.golden_thatch.01' },
    baseSize: { width: 440, height: 330 },
    footprint: { enabled: true, widthRatio: 0.82, heightRatio: 0.72, offsetX: 0, offsetY: 0.02 },
    doorAnchors: [{ id: 'main-door', x: 0, y: 0.46 }]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.tree.forest.oak.01',
    label: 'Chêne forestier',
    kind: 'tree',
    visual: { assetId: 'object.tree.forest.oak.01' },
    baseSize: { width: 190, height: 190 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.tree.forest.pine.01',
    label: 'Sapin forestier',
    kind: 'tree',
    visual: { assetId: 'object.tree.forest.pine.01' },
    baseSize: { width: 170, height: 210 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.tree.fantasy.ancient_blossom.01',
    label: 'Arbre ancien fleuri',
    kind: 'tree',
    visual: { assetId: 'object.tree.fantasy.ancient_blossom.01' },
    baseSize: { width: 210, height: 200 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.forest.boulder.01',
    label: 'Rochers moussus',
    kind: 'rock',
    visual: { assetId: 'object.rock.forest.boulder.01' },
    baseSize: { width: 170, height: 160 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.forest.spires.01',
    label: 'Aiguilles rocheuses',
    kind: 'rock',
    visual: { assetId: 'object.rock.forest.spires.01' },
    baseSize: { width: 160, height: 190 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.forest.plateau.01',
    label: 'Plateau rocheux',
    kind: 'rock',
    visual: { assetId: 'object.rock.forest.plateau.01' },
    baseSize: { width: 230, height: 150 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.door.fantasy.wood.01',
    label: 'Entrée bois au toit bleu',
    kind: 'door',
    visual: { assetId: 'object.door.fantasy.wood.01' },
    baseSize: { width: 150, height: 140 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.door.fantasy.stone_redroof.01',
    label: 'Entrée pierre au toit rouge',
    kind: 'door',
    visual: { assetId: 'object.door.fantasy.stone_redroof.01' },
    baseSize: { width: 180, height: 155 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.door.fantasy.tavern_golden.01',
    label: 'Entrée auberge au toit doré',
    kind: 'door',
    visual: { assetId: 'object.door.fantasy.tavern_golden.01' },
    baseSize: { width: 220, height: 170 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.stone.simple.01',
    label: 'Escalier pierre simple',
    kind: 'stairs',
    visual: { assetId: 'object.stairs.stone.simple.01' },
    baseSize: { width: 150, height: 120 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.wood.porch.01',
    label: 'Escalier bois',
    kind: 'stairs',
    visual: { assetId: 'object.stairs.wood.porch.01' },
    baseSize: { width: 180, height: 135 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.stone.grand.01',
    label: 'Grand escalier pierre',
    kind: 'stairs',
    visual: { assetId: 'object.stairs.stone.grand.01' },
    baseSize: { width: 230, height: 170 }
  }
]);

export function createObjectDefinitionCatalog(
  definitions = DEFINITIONS
) {
  const entries = Array.isArray(definitions)
    ? definitions
    : [];
  const byId = new Map();

  for (const definition of entries) {
    if (
      !definition ||
      typeof definition.id !== 'string' ||
      !definition.id.trim() ||
      byId.has(definition.id.trim())
    ) {
      continue;
    }

    byId.set(
      definition.id.trim(),
      frozen(structuredClone(definition))
    );
  }

  const list = Object.freeze([...byId.values()]);

  return Object.freeze({
    list() {
      return list;
    },

    get(id) {
      const key =
        typeof id === 'string'
          ? id.trim()
          : '';

      return key
        ? byId.get(key) ?? null
        : null;
    },

    require(id) {
      const definition = this.get(id);

      if (!definition) {
        throw new Error(
          `Unknown WorldObject definition: ${id}`
        );
      }

      return definition;
    }
  });
}

export const objectDefinitionCatalogV1 =
  createObjectDefinitionCatalog();
