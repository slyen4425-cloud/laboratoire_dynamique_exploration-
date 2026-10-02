export const MAP_ACTOR_VISUAL_SCHEMA_VERSION = 1;

export const MAP_ACTOR_ROLE_DEFAULTS = Object.freeze({
  hero: Object.freeze({ targetHeight: 78 }),
  npc: Object.freeze({ targetHeight: 72 }),
  creature: Object.freeze({ targetHeight: 84 })
});

function finiteNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  return Number.isFinite(value) && value >= min && value <= max
    ? value
    : fallback;
}

function normalizeRole(value) {
  return value === 'npc' || value === 'creature'
    ? value
    : 'hero';
}

export function normalizeMapActorVisual(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const role = normalizeRole(source.role);
  const defaults = MAP_ACTOR_ROLE_DEFAULTS[role];

  return Object.freeze({
    schemaVersion: MAP_ACTOR_VISUAL_SCHEMA_VERSION,
    assetId:
      typeof source.assetId === 'string' && source.assetId.trim()
        ? source.assetId.trim()
        : null,
    role,
    targetHeight: finiteNumber(
      source.targetHeight,
      defaults.targetHeight,
      { min: 24, max: 240 }
    ),
    mirrorHorizontal: source.mirrorHorizontal !== false,
    anchorOverride: Object.freeze({
      x: finiteNumber(source.anchorX, null, { min: 0, max: 1 }),
      y: finiteNumber(source.anchorY, null, { min: 0, max: 1 })
    }),
    shadow: Object.freeze({
      enabled: source.shadow?.enabled !== false,
      widthRatio: finiteNumber(
        source.shadow?.widthRatio,
        0.58,
        { min: 0.1, max: 1.5 }
      ),
      heightRatio: finiteNumber(
        source.shadow?.heightRatio,
        0.16,
        { min: 0.05, max: 0.6 }
      ),
      opacity: finiteNumber(
        source.shadow?.opacity,
        0.24,
        { min: 0, max: 0.8 }
      )
    }),
    motion: Object.freeze({
      idleAmplitude: finiteNumber(
        source.motion?.idleAmplitude,
        1.2,
        { min: 0, max: 8 }
      ),
      walkAmplitude: finiteNumber(
        source.motion?.walkAmplitude,
        3.2,
        { min: 0, max: 12 }
      ),
      idleFrequency: finiteNumber(
        source.motion?.idleFrequency,
        1.25,
        { min: 0.1, max: 8 }
      ),
      walkFrequency: finiteNumber(
        source.motion?.walkFrequency,
        5.4,
        { min: 0.5, max: 16 }
      )
    })
  });
}
