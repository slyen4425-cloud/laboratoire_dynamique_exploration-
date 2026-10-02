import {
  normalizeWorldDocument
} from '../world/world-document-model.js?rev=builder-dynamic-return-v1';
import {
  normalizeMapActorVisual
} from '../actors/map-actor-visual-model.js';

export const WORLD_BUILDER_TEST_HANDOFF_VERSION = 1;
export const WORLD_BUILDER_TEST_HANDOFF_KEY =
  'gensrpg.world-builder.test-handoff.v1';

function normalizeActorAsset(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim()
      : null;
  const path =
    typeof raw.path === 'string' && raw.path.trim()
      ? raw.path.trim()
      : null;

  if (!id || !path || !path.startsWith('data:image/')) {
    return null;
  }

  return Object.freeze({
    id,
    kind: 'map-actor-source',
    path,
    label:
      typeof raw.label === 'string' && raw.label.trim()
        ? raw.label.trim()
        : id
  });
}

function normalizeSessionActorVisual(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const visual = normalizeMapActorVisual(raw);
  return visual.assetId ? visual : null;
}

export function createWorldBuilderTestHandoff(
  document,
  {
    actorVisual = null,
    actorAsset = null
  } = {}
) {
  const normalized = normalizeWorldDocument(document);

  if (
    !normalized ||
    !normalized.initialAreaId ||
    !normalized.initialSpawnId ||
    normalized.areas.length === 0
  ) {
    throw new Error(
      'World Builder test handoff requires a valid WorldDocument'
    );
  }

  const normalizedActorVisual =
    normalizeSessionActorVisual(actorVisual);
  const normalizedActorAsset =
    normalizeActorAsset(actorAsset);

  if (
    normalizedActorAsset &&
    normalizedActorVisual?.assetId !== normalizedActorAsset.id
  ) {
    throw new Error(
      'World Builder actor asset must match MapActorVisual assetId'
    );
  }

  return JSON.stringify({
    schemaVersion: WORLD_BUILDER_TEST_HANDOFF_VERSION,
    document: normalized,
    actorVisual: normalizedActorVisual,
    actorAsset: normalizedActorAsset
  });
}

export function restoreWorldBuilderTestSession(payload) {
  if (typeof payload !== 'string' || !payload.trim()) {
    return null;
  }

  let parsed;

  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }

  if (
    parsed?.schemaVersion !== WORLD_BUILDER_TEST_HANDOFF_VERSION ||
    !parsed.document
  ) {
    return null;
  }

  const document = normalizeWorldDocument(parsed.document);

  if (
    !document.initialAreaId ||
    !document.initialSpawnId ||
    document.areas.length === 0
  ) {
    return null;
  }

  const actorVisual =
    normalizeSessionActorVisual(parsed.actorVisual);
  const actorAsset =
    normalizeActorAsset(parsed.actorAsset);

  if (
    actorAsset &&
    actorVisual?.assetId !== actorAsset.id
  ) {
    return null;
  }

  return Object.freeze({
    document,
    actorVisual,
    actorAsset
  });
}

export function restoreWorldBuilderTestHandoff(payload) {
  return restoreWorldBuilderTestSession(payload)?.document ?? null;
}

export function saveWorldBuilderTestHandoff(
  storage,
  document,
  options = {}
) {
  if (!storage || typeof storage.setItem !== 'function') {
    throw new Error('World Builder test handoff storage unavailable');
  }

  const payload = createWorldBuilderTestHandoff(
    document,
    options
  );
  storage.setItem(WORLD_BUILDER_TEST_HANDOFF_KEY, payload);
  return payload;
}

export function readWorldBuilderTestSession(storage) {
  if (!storage || typeof storage.getItem !== 'function') {
    return null;
  }

  return restoreWorldBuilderTestSession(
    storage.getItem(WORLD_BUILDER_TEST_HANDOFF_KEY)
  );
}

export function readWorldBuilderTestHandoff(storage) {
  return readWorldBuilderTestSession(storage)?.document ?? null;
}
