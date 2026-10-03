export const ENCOUNTER_LAYER_SCHEMA_VERSION = 1;

function normalizedString(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

function finiteNumber(
  value,
  fallback,
  { min = -Infinity, max = Infinity } = {}
) {
  if (!Number.isFinite(Number(value))) return fallback;
  return Math.max(min, Math.min(max, Number(value)));
}

function normalizeTags(rawTags) {
  if (!Array.isArray(rawTags)) return Object.freeze([]);

  const seen = new Set();
  const tags = [];

  for (const raw of rawTags) {
    const tag = normalizedString(raw);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }

  return Object.freeze(tags);
}

function normalizePoint(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!Number.isFinite(Number(raw.x)) || !Number.isFinite(Number(raw.y))) {
    return null;
  }

  return Object.freeze({
    x: Number(raw.x),
    y: Number(raw.y)
  });
}

function normalizeEncounterTableEntry(raw, index) {
  if (!raw || typeof raw !== 'object') return null;

  const id =
    normalizedString(raw.id) ??
    `entry-${index + 1}`;
  const actorDefinitionId =
    normalizedString(raw.actorDefinitionId);
  const tags = normalizeTags(raw.tags);

  if (!actorDefinitionId && tags.length === 0) {
    return null;
  }

  return Object.freeze({
    id,
    actorDefinitionId,
    tags,
    weight: finiteNumber(
      raw.weight,
      1,
      { min: 0.001, max: 100000 }
    )
  });
}

export function normalizeEncounterLayer(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;

  const id =
    normalizedString(raw.id) ??
    `encounter-layer-${index + 1}`;

  const points = (Array.isArray(raw.points) ? raw.points : [])
    .map(normalizePoint)
    .filter(Boolean);

  if (points.length < 2) return null;

  const table = [];
  const seenEntryIds = new Set();

  for (const [entryIndex, rawEntry] of (
    Array.isArray(raw.table) ? raw.table : []
  ).entries()) {
    const entry = normalizeEncounterTableEntry(
      rawEntry,
      entryIndex
    );

    if (!entry || seenEntryIds.has(entry.id)) continue;
    seenEntryIds.add(entry.id);
    table.push(entry);
  }

  return Object.freeze({
    schemaVersion: ENCOUNTER_LAYER_SCHEMA_VERSION,
    id,
    label: normalizedString(raw.label) ?? id,
    enabled: raw.enabled !== false,
    priority: Math.trunc(
      finiteNumber(raw.priority, 0, {
        min: -100000,
        max: 100000
      })
    ),
    width: finiteNumber(raw.width, 180, {
      min: 8,
      max: 10000
    }),
    points: Object.freeze(points),
    encounterChancePercent: finiteNumber(
      raw.encounterChancePercent,
      10,
      { min: 0, max: 100 }
    ),
    checkDistance: finiteNumber(
      raw.checkDistance,
      160,
      { min: 1, max: 10000 }
    ),
    table: Object.freeze(table)
  });
}

export function normalizeEncounterLayers(rawLayers = []) {
  if (!Array.isArray(rawLayers)) return Object.freeze([]);

  const layers = [];
  const seen = new Set();

  rawLayers.forEach((raw, index) => {
    const layer = normalizeEncounterLayer(raw, index);
    if (!layer || seen.has(layer.id)) return;
    seen.add(layer.id);
    layers.push(layer);
  });

  return Object.freeze(layers);
}
