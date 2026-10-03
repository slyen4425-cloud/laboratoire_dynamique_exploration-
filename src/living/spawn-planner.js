import {
  normalizeLivingWorldConfig
} from './living-world-model.js';

export const WILD_SPAWN_INTENT_SCHEMA_VERSION = 1;

function activeCountFor(ruleId, activeCounts) {
  if (activeCounts instanceof Map) {
    const value = activeCounts.get(ruleId);
    return Number.isFinite(value) && value > 0
      ? Math.floor(value)
      : 0;
  }

  const value =
    activeCounts &&
    typeof activeCounts === 'object'
      ? activeCounts[ruleId]
      : 0;

  return Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function normalizedUnitValue(value) {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1 - Number.EPSILON;
  return value;
}

export function selectWeightedSpawnRule(
  rules,
  {
    activeCounts = {},
    unitValue = 0
  } = {}
) {
  const eligible = (Array.isArray(rules) ? rules : [])
    .filter((rule) =>
      rule &&
      Number.isFinite(rule.weight) &&
      rule.weight > 0 &&
      Number.isFinite(rule.maxActive) &&
      activeCountFor(rule.id, activeCounts) < rule.maxActive
    );

  if (eligible.length === 0) return null;

  const totalWeight = eligible.reduce(
    (sum, rule) => sum + rule.weight,
    0
  );

  let target =
    normalizedUnitValue(unitValue) * totalWeight;

  for (const rule of eligible) {
    if (target < rule.weight) {
      return rule;
    }
    target -= rule.weight;
  }

  return eligible.at(-1) ?? null;
}

function hashString(value) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function deterministicUnit(seed, activationIndex, salt) {
  const key =
    `${seed}|${activationIndex}|${salt}`;
  return hashString(key) / 0x100000000;
}

function normalizedActivationIndex(value) {
  return Number.isInteger(value) && value >= 0
    ? value
    : 0;
}

function normalizedAttempts(value) {
  if (!Number.isInteger(value)) return 8;
  return Math.max(1, Math.min(64, value));
}

function normalizedSeed(value) {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (Number.isFinite(value)) {
    return String(value);
  }

  return 'living-world';
}

export function planWildSpawnIntent(
  rawConfig,
  {
    seed = 'living-world',
    activationIndex = 0,
    activeCounts = {},
    maxAttempts = 8,
    canSpawn = () => true
  } = {}
) {
  const config = normalizeLivingWorldConfig(rawConfig);
  const index = normalizedActivationIndex(activationIndex);
  const stableSeed = normalizedSeed(seed);

  const rule = selectWeightedSpawnRule(
    config.spawnRules,
    {
      activeCounts,
      unitValue: deterministicUnit(
        stableSeed,
        index,
        'rule'
      )
    }
  );

  if (!rule) return null;

  const zone = config.spawnZones.find(
    (item) => item.id === rule.zoneId
  );

  if (!zone) return null;

  const attempts = normalizedAttempts(maxAttempts);
  const accepts =
    typeof canSpawn === 'function'
      ? canSpawn
      : () => true;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const angle =
      deterministicUnit(
        stableSeed,
        index,
        `${rule.id}:angle:${attempt}`
      ) *
      Math.PI *
      2;

    const radialUnit = deterministicUnit(
      stableSeed,
      index,
      `${rule.id}:radius:${attempt}`
    );

    const distance =
      Math.sqrt(radialUnit) * zone.radius;

    const x =
      zone.x + Math.cos(angle) * distance;
    const y =
      zone.y + Math.sin(angle) * distance;

    const candidate = Object.freeze({
      ruleId: rule.id,
      zoneId: zone.id,
      actorDefinitionId: rule.actorDefinitionId,
      areaId: zone.areaId,
      x,
      y,
      activationIndex: index
    });

    if (!accepts(candidate)) continue;

    return Object.freeze({
      schemaVersion: WILD_SPAWN_INTENT_SCHEMA_VERSION,
      ...candidate
    });
  }

  return null;
}
