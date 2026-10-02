import {
  pointInOrientedRect,
  pointToPathDistance
} from './geometry.js';
import {
  bridgeTraversalRect
} from '../world/world-object-model.js';
import {
  traversalRulePackV1
} from './traversal-rule-pack-v1.js';

const VALID_MODES = Object.freeze(['ground', 'swim', 'fly']);

function normalizedString(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

function normalizeRule(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = normalizedString(raw.id);
  if (!id) return null;

  const rawModes =
    raw.modes && typeof raw.modes === 'object'
      ? raw.modes
      : {};

  const modes = {};

  for (const mode of VALID_MODES) {
    const multiplier = rawModes[mode];

    if (
      Number.isFinite(multiplier) &&
      multiplier > 0 &&
      multiplier <= 10
    ) {
      modes[mode] = multiplier;
    }
  }

  return Object.freeze({
    id,
    modes: Object.freeze(modes)
  });
}

export function createTraversalRuleRegistry(pack = traversalRulePackV1) {
  const rawRules =
    pack && Array.isArray(pack.rules)
      ? pack.rules
      : [];

  const rules = new Map();

  for (const rawRule of rawRules) {
    const rule = normalizeRule(rawRule);
    if (!rule || rules.has(rule.id)) continue;
    rules.set(rule.id, rule);
  }

  return Object.freeze({
    get(id) {
      const key = normalizedString(id);
      return key ? rules.get(key) ?? null : null;
    },

    require(id) {
      const rule = this.get(id);

      if (!rule) {
        throw new Error(`Unknown traversal rule: ${id}`);
      }

      return rule;
    },

    list() {
      return Object.freeze([...rules.values()]);
    }
  });
}

export const defaultTraversalRuleRegistry =
  createTraversalRuleRegistry(traversalRulePackV1);

export function normalizeLocomotionProfile(raw = null) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const requested = Array.isArray(source.modes)
    ? source.modes
    : ['ground'];

  const modes = [];
  const seen = new Set();

  for (const value of requested) {
    const mode = normalizedString(value);

    if (
      !mode ||
      !VALID_MODES.includes(mode) ||
      seen.has(mode)
    ) {
      continue;
    }

    seen.add(mode);
    modes.push(mode);
  }

  if (modes.length === 0) {
    modes.push('ground');
  }

  return Object.freeze({
    modes: Object.freeze(modes)
  });
}

function resolveRuleForActor(rule, actor) {
  const locomotion = normalizeLocomotionProfile(actor?.locomotion);

  let selectedMode = null;
  let selectedMultiplier = 0;

  for (const mode of locomotion.modes) {
    const multiplier = rule?.modes?.[mode];

    if (
      Number.isFinite(multiplier) &&
      multiplier > selectedMultiplier
    ) {
      selectedMode = mode;
      selectedMultiplier = multiplier;
    }
  }

  return Object.freeze({
    passable: selectedMode !== null,
    mode: selectedMode,
    speedMultiplier:
      selectedMode !== null
        ? selectedMultiplier
        : 0
  });
}

export function surfaceFeatureContainsPoint(
  feature,
  x,
  y,
  padding = 0
) {
  if (
    !feature ||
    !Array.isArray(feature.points) ||
    feature.points.length < 2 ||
    !Number.isFinite(feature.width)
  ) {
    return false;
  }

  const safePadding =
    Number.isFinite(padding) && padding > 0
      ? padding
      : 0;

  return (
    pointToPathDistance(
      { x, y },
      feature.points
    ) <= feature.width / 2 + safePadding
  );
}

export function resolveBaseSurfaceFeature(
  world,
  x,
  y,
  padding = 0
) {
  const surface = world?.surface;

  if (!surface) {
    return Object.freeze({
      kind: 'base',
      id: 'surface-base',
      traversalRuleId: 'terrain.ground'
    });
  }

  for (const river of surface.rivers ?? []) {
    if (surfaceFeatureContainsPoint(river, x, y, padding)) {
      return Object.freeze({
        kind: 'river',
        id: river.id,
        traversalRuleId: river.traversalRuleId
      });
    }
  }

  for (const route of surface.routes ?? []) {
    if (surfaceFeatureContainsPoint(route, x, y, 0)) {
      return Object.freeze({
        kind: 'route',
        id: route.id,
        traversalRuleId: route.traversalRuleId
      });
    }
  }

  return Object.freeze({
    kind: 'base',
    id: 'surface-base',
    traversalRuleId:
      surface.baseTraversalRuleId ?? 'terrain.ground'
  });
}

function bridgeOverrideAt(world, feature, x, y) {
  if (!feature || feature.kind === 'base') return null;

  for (const object of Array.isArray(world?.objects) ? world.objects : []) {
    if (
      object.kind !== 'bridge' ||
      object.traversal?.enabled !== true ||
      !object.traversal.overridesSurfaceFeatureIds.includes(feature.id)
    ) {
      continue;
    }

    const corridor = bridgeTraversalRect(object);

    if (corridor && pointInOrientedRect(x, y, corridor)) {
      return Object.freeze({
        kind: 'bridge',
        id: object.id,
        sourceFeatureId: feature.id,
        traversalRuleId:
          object.traversal.traversalRuleId ?? 'terrain.bridge'
      });
    }
  }

  return null;
}

export function resolveSurfaceTraversal(
  world,
  actor,
  x,
  y,
  registry = defaultTraversalRuleRegistry,
  { padding = 0 } = {}
) {
  const baseFeature = resolveBaseSurfaceFeature(
    world,
    x,
    y,
    padding
  );
  const feature =
    bridgeOverrideAt(world, baseFeature, x, y) ??
    baseFeature;
  const rule = registry.require(feature.traversalRuleId);
  const actorResolution = resolveRuleForActor(rule, actor);

  return Object.freeze({
    featureKind: feature.kind,
    featureId: feature.id,
    sourceFeatureId: feature.sourceFeatureId ?? null,
    ruleId: rule.id,
    passable: actorResolution.passable,
    mode: actorResolution.mode,
    speedMultiplier: actorResolution.speedMultiplier
  });
}
