export const WORLD_ACTOR_PLACEMENT_SCHEMA_VERSION = 1;

function text(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value))
    ? Number(value)
    : fallback;
}

export function normalizeWorldActorPlacement(
  raw,
  index = 0
) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const actorDefinitionId = text(
    raw.actorDefinitionId
  );

  if (!actorDefinitionId) {
    return null;
  }

  return Object.freeze({
    schemaVersion:
      WORLD_ACTOR_PLACEMENT_SCHEMA_VERSION,
    id:
      text(raw.id) ??
      `actor-${index + 1}`,
    actorDefinitionId,
    x: finite(raw.x, 0),
    y: finite(raw.y, 0),
    facingX:
      Number(raw.facingX) < 0
        ? -1
        : 1
  });
}

export function normalizeWorldActorPlacements(
  rawActors = []
) {
  if (!Array.isArray(rawActors)) {
    return Object.freeze([]);
  }

  const seen = new Set();
  const actors = [];

  rawActors.forEach((raw, index) => {
    const actor =
      normalizeWorldActorPlacement(
        raw,
        index
      );

    if (!actor || seen.has(actor.id)) {
      return;
    }

    seen.add(actor.id);
    actors.push(actor);
  });

  return Object.freeze(actors);
}
