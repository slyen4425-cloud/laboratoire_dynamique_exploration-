import {
  defaultTraversalRuleRegistry
} from '../core/surface-traversal.js?rev=surface-traversal-replay-v1';
import {
  stepMovement
} from '../core/movement.js?rev=collision-boundary-worldobject-obstacles-v1';
import {
  createWildCreatureEntity,
  normalizeLivingWorldConfig
} from './living-world-model.js';

export const WILD_WANDER_TARGET_SCHEMA_VERSION = 1;

function hashString(value) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function unit(seed, entityId, wanderIndex, salt) {
  return (
    hashString(
      `${seed}|${entityId}|${wanderIndex}|${salt}`
    ) / 0x100000000
  );
}

function normalizedIndex(value) {
  return Number.isInteger(value) && value >= 0
    ? value
    : 0;
}

function normalizedAttempts(value) {
  if (!Number.isInteger(value)) return 8;
  return Math.max(1, Math.min(64, value));
}

function normalizedSeed(value) {
  if (typeof value === 'string' && value) return value;
  if (Number.isFinite(value)) return String(value);
  return 'wild-wander';
}

export function planWildWanderTarget(
  rawConfig,
  entity,
  {
    seed = 'wild-wander',
    wanderIndex = 0,
    maxAttempts = 8,
    canOccupy = () => true
  } = {}
) {
  if (!entity) return null;

  const config = normalizeLivingWorldConfig(rawConfig);
  const zone = config.spawnZones.find(
    (item) =>
      item.id === entity.homeZoneId &&
      item.areaId === entity.areaId
  );

  if (!zone) return null;

  const index = normalizedIndex(wanderIndex);
  const stableSeed = normalizedSeed(seed);
  const attempts = normalizedAttempts(maxAttempts);
  const accepts =
    typeof canOccupy === 'function'
      ? canOccupy
      : () => true;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const angle =
      unit(
        stableSeed,
        entity.id,
        index,
        `angle:${attempt}`
      ) *
      Math.PI *
      2;
    const radial =
      Math.sqrt(
        unit(
          stableSeed,
          entity.id,
          index,
          `radius:${attempt}`
        )
      ) *
      zone.radius;

    const candidate = Object.freeze({
      schemaVersion: WILD_WANDER_TARGET_SCHEMA_VERSION,
      entityId: entity.id,
      zoneId: zone.id,
      areaId: zone.areaId,
      x: zone.x + Math.cos(angle) * radial,
      y: zone.y + Math.sin(angle) * radial,
      wanderIndex: index
    });

    if (accepts(candidate)) {
      return candidate;
    }
  }

  return null;
}

function actorProbe(definition, entity) {
  if (!definition?.exploration) return null;

  const radius =
    Number.isFinite(definition.exploration.radius) &&
    definition.exploration.radius > 0
      ? definition.exploration.radius
      : 12;

  const locomotion =
    definition.exploration.locomotion &&
    typeof definition.exploration.locomotion === 'object'
      ? definition.exploration.locomotion
      : { modes: ['ground'] };

  return {
    x: entity.x,
    y: entity.y,
    radius,
    locomotion
  };
}

export function advanceWildCreatureTowardTarget(
  entity,
  definition,
  area,
  target,
  dt,
  traversalRegistry = defaultTraversalRuleRegistry,
  collisionContext = {}
) {
  if (
    !entity ||
    !definition ||
    !area ||
    !target ||
    target.areaId && target.areaId !== entity.areaId
  ) {
    return entity;
  }

  const probe = actorProbe(definition, entity);
  if (!probe) return entity;

  const dx = target.x - entity.x;
  const dy = target.y - entity.y;
  const distance = Math.hypot(dx, dy);
  const arrivalRadius = Math.max(4, probe.radius * 0.5);

  if (distance <= arrivalRadius) {
    return createWildCreatureEntity({
      ...entity,
      moving: false
    });
  }

  const maxSpeed =
    Number.isFinite(definition.exploration.maxSpeed) &&
    definition.exploration.maxSpeed > 0
      ? definition.exploration.maxSpeed
      : 70;
  const safeDt =
    Number.isFinite(dt) && dt > 0 ? dt : 0;
  const boundedSpeed =
    safeDt > 0
      ? Math.min(maxSpeed, distance / safeDt)
      : maxSpeed;

  stepMovement(
    area,
    probe,
    { x: dx, y: dy },
    safeDt,
    { maxSpeed: boundedSpeed },
    traversalRegistry,
    collisionContext
  );

  const movedDistance = Math.hypot(
    probe.x - entity.x,
    probe.y - entity.y
  );

  return createWildCreatureEntity({
    ...entity,
    x: probe.x,
    y: probe.y,
    facingX:
      Math.abs(dx) > 0.05
        ? (dx < 0 ? -1 : 1)
        : entity.facingX,
    moving: movedDistance > 1e-6
  });
}
