import {
  normalizeWorldDocument
} from '../world/world-document-model.js?rev=builder-dynamic-return-v1';

export const WORLD_BUILDER_TEST_HANDOFF_VERSION = 1;
export const WORLD_BUILDER_TEST_HANDOFF_KEY =
  'gensrpg.world-builder.test-handoff.v1';

export function createWorldBuilderTestHandoff(document) {
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

  return JSON.stringify({
    schemaVersion: WORLD_BUILDER_TEST_HANDOFF_VERSION,
    document: normalized
  });
}

export function restoreWorldBuilderTestHandoff(payload) {
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

  return document;
}

export function saveWorldBuilderTestHandoff(storage, document) {
  if (!storage || typeof storage.setItem !== 'function') {
    throw new Error('World Builder test handoff storage unavailable');
  }

  const payload = createWorldBuilderTestHandoff(document);
  storage.setItem(WORLD_BUILDER_TEST_HANDOFF_KEY, payload);
  return payload;
}

export function readWorldBuilderTestHandoff(storage) {
  if (!storage || typeof storage.getItem !== 'function') {
    return null;
  }

  return restoreWorldBuilderTestHandoff(
    storage.getItem(WORLD_BUILDER_TEST_HANDOFF_KEY)
  );
}
