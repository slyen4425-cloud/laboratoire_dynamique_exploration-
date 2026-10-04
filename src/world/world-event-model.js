import {
  findWorldArea
} from './world-area-model.js?rev=world-event-contract-v1';
import {
  normalizeWorldTriggerGeometry,
  resolveWorldTriggerPoint
} from './world-trigger-geometry.js?rev=world-event-contract-v1';

export const WORLD_EVENT_SCHEMA_VERSION = 1;

const VALID_ACTIVATIONS = Object.freeze([
  'on-enter',
  'on-interact'
]);

const VALID_REPEAT_POLICIES = Object.freeze([
  'once',
  'repeatable'
]);

function normalizeWorldEventAction(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  if (raw.kind !== 'message') {
    return null;
  }

  const text =
    typeof raw.text === 'string'
      ? raw.text.trim()
      : '';

  if (!text) {
    return null;
  }

  return Object.freeze({
    kind: 'message',
    text
  });
}

function normalizedString(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

export function normalizeWorldEvent(
  raw,
  index = 0
) {
  if (!raw || typeof raw !== 'object') return null;

  const sourceAreaId =
    normalizedString(raw.sourceAreaId);
  const activation =
    VALID_ACTIVATIONS.includes(raw.activation)
      ? raw.activation
      : null;
  const trigger =
    normalizeWorldTriggerGeometry(raw.trigger);
  const action =
    normalizeWorldEventAction(
      raw.action
    );

  if (
    !sourceAreaId ||
    !activation ||
    !trigger ||
    !action
  ) {
    return null;
  }

  const repeatPolicy =
    VALID_REPEAT_POLICIES.includes(
      raw.repeatPolicy
    )
      ? raw.repeatPolicy
      : 'once';

  return Object.freeze({
    schemaVersion: WORLD_EVENT_SCHEMA_VERSION,
    id:
      normalizedString(raw.id) ??
      `world-event-${index + 1}`,
    enabled: raw.enabled !== false,
    sourceAreaId,
    activation,
    trigger,
    action,
    repeatPolicy
  });
}

export function normalizeWorldEvents(
  rawEvents = []
) {
  if (!Array.isArray(rawEvents)) {
    return Object.freeze([]);
  }

  const events = [];
  const seen = new Set();

  rawEvents.forEach((raw, index) => {
    const event =
      normalizeWorldEvent(raw, index);

    if (!event || seen.has(event.id)) {
      return;
    }

    seen.add(event.id);
    events.push(event);
  });

  return Object.freeze(events);
}

export function worldEventReferencesAreValid(
  areas,
  event
) {
  if (!event) return false;

  const area = findWorldArea(
    areas,
    event.sourceAreaId
  );

  if (!area) return false;

  return Boolean(
    resolveWorldTriggerPoint(
      area,
      event.trigger
    )
  );
}
