import {
  defaultTraversalRuleRegistry
} from '../core/surface-traversal.js?rev=surface-traversal-replay-v1';
import {
  isBlocked
} from '../core/collision.js?rev=surface-traversal-replay-v1';
import {
  createWildCreatureEntity,
  normalizeLivingWorldConfig
} from './living-world-model.js';
import {
  planWildSpawnIntent
} from './spawn-planner.js';

function findArea(worldDocument, areaId) {
  return Array.isArray(worldDocument?.areas)
    ? worldDocument.areas.find((area) => area.id === areaId) ?? null
    : null;
}

function actorProbeFromDefinition(definition) {
  if (!definition || typeof definition !== 'object') return null;

  const radius =
    Number.isFinite(definition.exploration?.radius) &&
    definition.exploration.radius > 0
      ? definition.exploration.radius
      : 12;

  const locomotion =
    definition.exploration?.locomotion &&
    typeof definition.exploration.locomotion === 'object'
      ? definition.exploration.locomotion
      : { modes: ['ground'] };

  return Object.freeze({
    radius,
    locomotion
  });
}

export function createInitialWildlife(
  rawConfig,
  {
    worldDocument,
    resolveActorDefinition,
    seed = 'living-world',
    activationCount = 0,
    traversalRegistry = defaultTraversalRuleRegistry,
    collisionCheck = isBlocked
  } = {}
) {
  const config = normalizeLivingWorldConfig(rawConfig);

  if (
    !worldDocument ||
    typeof resolveActorDefinition !== 'function'
  ) {
    return Object.freeze([]);
  }

  const count =
    Number.isInteger(activationCount) && activationCount > 0
      ? Math.min(activationCount, 100)
      : 0;

  const activeCounts = {};
  const entities = [];

  for (
    let activationIndex = 0;
    activationIndex < count;
    activationIndex += 1
  ) {
    const intent = planWildSpawnIntent(config, {
      seed,
      activationIndex,
      activeCounts,
      canSpawn(candidate) {
        const definition = resolveActorDefinition(
          candidate.actorDefinitionId
        );
        const area = findArea(
          worldDocument,
          candidate.areaId
        );
        const probe = actorProbeFromDefinition(definition);

        if (!definition || !area || !probe) {
          return false;
        }

        return !collisionCheck(
          area,
          probe,
          candidate.x,
          candidate.y,
          traversalRegistry
        );
      }
    });

    if (!intent) continue;

    const entity = createWildCreatureEntity({
      id: `wild:${intent.ruleId}:${activationIndex}`,
      actorDefinitionId: intent.actorDefinitionId,
      areaId: intent.areaId,
      x: intent.x,
      y: intent.y,
      homeZoneId: intent.zoneId,
      facingX: 1,
      moving: false
    });

    if (!entity) continue;

    entities.push(entity);
    activeCounts[intent.ruleId] =
      (activeCounts[intent.ruleId] ?? 0) + 1;
  }

  return Object.freeze(entities);
}

export function createWildMapActorView(
  entity,
  resolveActorDefinition
) {
  if (
    !entity ||
    typeof resolveActorDefinition !== 'function'
  ) {
    return null;
  }

  const definition = resolveActorDefinition(
    entity.actorDefinitionId
  );

  if (!definition?.mapVisual) return null;

  return Object.freeze({
    id: entity.id,
    x: entity.x,
    y: entity.y,
    facingX: entity.facingX,
    moving: entity.moving,
    mapVisual: definition.mapVisual
  });
}

export function collectLivingMapActorAssetIds(
  rawConfig,
  resolveActorDefinition
) {
  if (typeof resolveActorDefinition !== 'function') {
    return Object.freeze([]);
  }

  const config = normalizeLivingWorldConfig(rawConfig);
  const seen = new Set();
  const ids = [];

  for (const rule of config.spawnRules) {
    const definition = resolveActorDefinition(
      rule.actorDefinitionId
    );
    const assetId = definition?.mapVisual?.assetId;

    if (
      typeof assetId !== 'string' ||
      !assetId.trim() ||
      seen.has(assetId)
    ) {
      continue;
    }

    seen.add(assetId);
    ids.push(assetId);
  }

  return Object.freeze(ids);
}
