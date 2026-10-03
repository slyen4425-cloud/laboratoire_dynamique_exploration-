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

function uniqueStrings(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(
    values
      .map((value) => text(value))
      .filter(Boolean)
  )];
}

function fromCaptureDatabase(database) {
  if (
    database?.schema !== 'capture-database-v1' ||
    !Array.isArray(database.creatures)
  ) {
    return null;
  }

  return database.creatures
    .map((record) => record?.draft)
    .filter((draft) => draft && typeof draft === 'object')
    .map((draft) => ({
      id: text(draft.id),
      name: text(draft.displayName) ?? text(draft.id),
      elements: uniqueStrings(draft.elements),
      presentation:
        draft.presentation && typeof draft.presentation === 'object'
          ? draft.presentation
          : null
    }))
    .filter((entry) => entry.id);
}

function fromPreviewProjection(source) {
  if (!Array.isArray(source?.creatures)) return null;

  return source.creatures
    .map((entry) => ({
      id: text(entry?.id),
      name:
        text(entry?.name) ??
        text(entry?.displayName) ??
        text(entry?.id),
      elements: uniqueStrings(
        entry?.elements ?? entry?.elementTypes
      ),
      presentation:
        entry?.presentation &&
        typeof entry.presentation === 'object'
          ? entry.presentation
          : null
    }))
    .filter((entry) => entry.id);
}

function freezeCreature(entry) {
  return Object.freeze({
    id: entry.id,
    name: entry.name,
    elements: Object.freeze([...entry.elements]),
    presentation: entry.presentation
  });
}

export function createCaptureCreatureCatalogProvider(source) {
  const records =
    fromCaptureDatabase(source) ??
    fromPreviewProjection(source);

  if (!records) {
    throw new TypeError(
      'Capture creature catalog source must be CaptureDatabaseV1 or a read-only preview projection'
    );
  }

  const byId = new Map();

  for (const raw of records) {
    if (byId.has(raw.id)) {
      throw new RangeError(
        `duplicate Capture creature id: ${raw.id}`
      );
    }
    byId.set(raw.id, freezeCreature(raw));
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

    resolveCreature(creatureId) {
      const id = text(creatureId);
      return id ? byId.get(id) ?? null : null;
    },

    findByElement(elementId) {
      const id = text(elementId);
      if (!id) return Object.freeze([]);

      return Object.freeze(
        creatures.filter(
          (creature) => creature.elements.includes(id)
        )
      );
    }
  });
}
