const ELEMENT_LABELS_FR = Object.freeze({
  air: 'Air',
  earth: 'Terre',
  electric: 'Électrique',
  fire: 'Feu',
  ice: 'Glace',
  light: 'Lumière',
  nature: 'Nature / Herbe',
  poison: 'Poison',
  psy: 'Psy',
  shadow: 'Ombre',
  spirit: 'Esprit',
  steel: 'Acier',
  water: 'Eau'
});

function text(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

function finitePercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function uniqueStrings(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(
    values
      .map((value) => text(value))
      .filter(Boolean)
  )];
}

function normalizeRecord(draft) {
  const id = text(draft?.id);
  if (!id) return null;

  return Object.freeze({
    id,
    name:
      text(draft.displayName) ??
      id,
    elements: Object.freeze(
      uniqueStrings(draft.elements)
    ),
    spawnChance: finitePercent(
      draft.capture?.spawnChance
    ),
    presentation:
      draft.presentation &&
      typeof draft.presentation === 'object'
        ? draft.presentation
        : null
  });
}

function recordsFromDatabase(source) {
  if (
    source?.schema !== 'capture-database-v1' ||
    !Array.isArray(source.creatures)
  ) {
    return null;
  }

  return source.creatures
    .map((record) => normalizeRecord(record?.draft))
    .filter(Boolean);
}

function recordsFromPreview(source) {
  if (!Array.isArray(source?.creatures)) return null;

  return source.creatures
    .map((entry) =>
      normalizeRecord({
        id: entry?.id,
        displayName: entry?.name,
        elements: entry?.elements,
        capture: {
          spawnChance: entry?.spawnChance
        },
        presentation: entry?.presentation ?? null
      })
    )
    .filter(Boolean);
}

export function createCaptureCreatureCatalogProvider(source) {
  const records =
    recordsFromDatabase(source) ??
    recordsFromPreview(source);

  if (!records) {
    throw new TypeError(
      'Capture creature catalog source must be CaptureDatabaseV1 or a read-only preview projection'
    );
  }

  const byId = new Map();

  for (const record of records) {
    if (byId.has(record.id)) {
      throw new RangeError(
        `duplicate Capture creature id: ${record.id}`
      );
    }
    byId.set(record.id, record);
  }

  const creatures = Object.freeze(
    [...byId.values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'fr')
    )
  );

  const elementIds = [
    ...new Set(
      creatures.flatMap((creature) => creature.elements)
    )
  ].sort((a, b) => a.localeCompare(b, 'fr'));

  const elements = Object.freeze(
    elementIds.map((id) => Object.freeze({
      id,
      label: ELEMENT_LABELS_FR[id] ?? id
    }))
  );

  return Object.freeze({
    listCreatures() {
      return creatures;
    },

    listElements() {
      return elements;
    },

    resolveCreature(id) {
      const key = text(id);
      return key ? byId.get(key) ?? null : null;
    },

    findByElement(elementId) {
      const key = text(elementId);
      if (!key) return Object.freeze([]);

      return Object.freeze(
        creatures.filter((creature) =>
          creature.elements.includes(key)
        )
      );
    }
  });
}
