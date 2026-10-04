export const DEFAULT_TERRAIN_FAMILY_DEFINITIONS =
  Object.freeze([
    Object.freeze({ id: 'plain', label: 'Plaine' }),
    Object.freeze({ id: 'forest', label: 'Forêt' }),
    Object.freeze({ id: 'sea', label: 'Mer' }),
    Object.freeze({ id: 'mountain', label: 'Montagne' }),
    Object.freeze({ id: 'volcano', label: 'Volcan' }),
    Object.freeze({ id: 'snow', label: 'Neige' }),
    Object.freeze({ id: 'road', label: 'Route' }),
    Object.freeze({ id: 'sand', label: 'Sable' })
  ]);

export const TERRAIN_FAMILY_IDS = Object.freeze(
  DEFAULT_TERRAIN_FAMILY_DEFINITIONS.map(
    (definition) => definition.id
  )
);

function text(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

export function normalizeTerrainFamilyDefinitions(
  rawDefinitions
) {
  const source =
    Array.isArray(rawDefinitions) &&
    rawDefinitions.length > 0
      ? rawDefinitions
      : DEFAULT_TERRAIN_FAMILY_DEFINITIONS;

  const seen = new Set();
  const result = [];

  for (const raw of source) {
    const id = text(raw?.id);
    const label = text(raw?.label);

    if (!id || !label || seen.has(id)) {
      continue;
    }

    seen.add(id);
    result.push(
      Object.freeze({
        id,
        label
      })
    );
  }

  if (result.length === 0) {
    return Object.freeze(
      [...DEFAULT_TERRAIN_FAMILY_DEFINITIONS]
    );
  }

  return Object.freeze(result);
}

export function createTerrainFamilyRegistry(
  rawDefinitions =
    DEFAULT_TERRAIN_FAMILY_DEFINITIONS
) {
  const definitions =
    normalizeTerrainFamilyDefinitions(
      rawDefinitions
    );
  const byId = new Map(
    definitions.map(
      (definition) => [
        definition.id,
        definition
      ]
    )
  );

  return Object.freeze({
    list() {
      return Object.freeze(
        [...definitions]
      );
    },

    get(id) {
      return typeof id === 'string'
        ? byId.get(id.trim()) ?? null
        : null;
    },

    require(id) {
      const definition = this.get(id);
      if (!definition) {
        throw new Error(
          `Unknown terrain family: ${id}`
        );
      }
      return definition;
    }
  });
}

export const terrainFamilyRegistry =
  createTerrainFamilyRegistry();
