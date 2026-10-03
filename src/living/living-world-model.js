export const LIVING_WORLD_SCHEMA_VERSION = 1;
export const WILD_CREATURE_ENTITY_SCHEMA_VERSION = 1;

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
  return Number.isFinite(value) && value >= min && value <= max
    ? value
    : fallback;
}

function positiveInteger(value, fallback, { max = 100 } = {}) {
  if (!Number.isInteger(value) || value < 1 || value > max) {
    return fallback;
  }
  return value;
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

export function normalizeWildSpawnZone(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = normalizedString(raw.id);
  const areaId = normalizedString(raw.areaId);

  if (!id || !areaId) return null;

  return Object.freeze({
    id,
    areaId,
    kind: 'circle',
    x: finiteNumber(raw.x, 0),
    y: finiteNumber(raw.y, 0),
    radius: finiteNumber(
      raw.radius,
      120,
      { min: 8, max: 10000 }
    ),
    biomeId: normalizedString(raw.biomeId),
    tags: normalizeTags(raw.tags)
  });
}

export function normalizeWildSpawnRule(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = normalizedString(raw.id);
  const zoneId = normalizedString(raw.zoneId);
  const actorDefinitionId = normalizedString(
    raw.actorDefinitionId
  );

  if (!id || !zoneId || !actorDefinitionId) {
    return null;
  }

  return Object.freeze({
    id,
    zoneId,
    actorDefinitionId,
    maxActive: positiveInteger(raw.maxActive, 1),
    weight: finiteNumber(
      raw.weight,
      1,
      { min: 0.001, max: 100000 }
    )
  });
}

export function normalizeLivingWorldConfig(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};

  const zones = [];
  const zoneIds = new Set();

  for (const rawZone of Array.isArray(source.spawnZones)
    ? source.spawnZones
    : []) {
    const zone = normalizeWildSpawnZone(rawZone);
    if (!zone || zoneIds.has(zone.id)) continue;
    zoneIds.add(zone.id);
    zones.push(zone);
  }

  const rules = [];
  const ruleIds = new Set();

  for (const rawRule of Array.isArray(source.spawnRules)
    ? source.spawnRules
    : []) {
    const rule = normalizeWildSpawnRule(rawRule);

    if (
      !rule ||
      ruleIds.has(rule.id) ||
      !zoneIds.has(rule.zoneId)
    ) {
      continue;
    }

    ruleIds.add(rule.id);
    rules.push(rule);
  }

  return Object.freeze({
    schemaVersion: LIVING_WORLD_SCHEMA_VERSION,
    spawnZones: Object.freeze(zones),
    spawnRules: Object.freeze(rules)
  });
}

export function livingWorldReferencesAreValid(
  worldDocument,
  livingWorldConfig
) {
  const config = normalizeLivingWorldConfig(livingWorldConfig);
  const areaIds = new Set(
    Array.isArray(worldDocument?.areas)
      ? worldDocument.areas
          .map((area) => normalizedString(area?.id))
          .filter(Boolean)
      : []
  );

  return config.spawnZones.every(
    (zone) => areaIds.has(zone.areaId)
  );
}

export function createWildCreatureEntity(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};

  const id = normalizedString(source.id);
  const actorDefinitionId = normalizedString(
    source.actorDefinitionId
  );
  const areaId = normalizedString(source.areaId);
  const homeZoneId = normalizedString(source.homeZoneId);

  if (
    !id ||
    !actorDefinitionId ||
    !areaId ||
    !homeZoneId ||
    !Number.isFinite(source.x) ||
    !Number.isFinite(source.y)
  ) {
    return null;
  }

  return Object.freeze({
    schemaVersion: WILD_CREATURE_ENTITY_SCHEMA_VERSION,
    id,
    actorDefinitionId,
    areaId,
    x: source.x,
    y: source.y,
    homeZoneId,
    facingX: source.facingX === -1 ? -1 : 1,
    moving: source.moving === true
  });
}
