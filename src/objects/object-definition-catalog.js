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
