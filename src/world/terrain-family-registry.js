export const TERRAIN_FAMILY_IDS = Object.freeze([
  'plain',
  'forest',
  'sea',
  'mountain',
  'volcano',
  'snow',
  'road',
  'sand'
]);

const DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'plain',
    label: 'Plaine',
    materialKind: 'surface',
    materialIds: Object.freeze(['ground.dirt'])
  }),
  Object.freeze({
    id: 'forest',
    label: 'Forêt',
    materialKind: 'surface',
    materialIds: Object.freeze(['grass.forest'])
  }),
  Object.freeze({
    id: 'sea',
    label: 'Mer',
    materialKind: 'water',
    materialIds: Object.freeze(['water.forest_stream'])
  }),
  Object.freeze({
    id: 'mountain',
    label: 'Montagne',
    materialKind: 'surface',
    materialIds: Object.freeze(['ground.dirt'])
  }),
  Object.freeze({
    id: 'volcano',
    label: 'Volcan',
    materialKind: 'surface',
    materialIds: Object.freeze(['ground.dirt'])
  }),
  Object.freeze({
    id: 'snow',
    label: 'Neige',
    materialKind: 'surface',
    materialIds: Object.freeze(['ground.snow'])
  }),
  Object.freeze({
    id: 'road',
    label: 'Route',
    materialKind: 'path',
    materialIds: Object.freeze(['road.dirt'])
  }),
  Object.freeze({
    id: 'sand',
    label: 'Sable',
    materialKind: 'surface',
    materialIds: Object.freeze(['ground.sand'])
  })
]);

export function createTerrainFamilyRegistry() {
  const byId = new Map(
    DEFINITIONS.map((definition) => [definition.id, definition])
  );

  return Object.freeze({
    list() {
      return Object.freeze([...DEFINITIONS]);
    },

    get(id) {
      return typeof id === 'string'
        ? byId.get(id.trim()) ?? null
        : null;
    },

    require(id) {
      const definition = this.get(id);
      if (!definition) {
        throw new Error(`Unknown terrain family: ${id}`);
      }
      return definition;
    }
  });
}

export const terrainFamilyRegistry =
  createTerrainFamilyRegistry();
