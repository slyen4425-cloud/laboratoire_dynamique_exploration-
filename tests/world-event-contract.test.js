import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeWorldEvent,
  normalizeWorldEvents,
  worldEventReferencesAreValid
} from '../src/world/world-event-model.js';
import {
  normalizeWorldDocument
} from '../src/world/world-document-model.js';
import {
  addWorldEvent,
  createWorldBuilderDraft,
  deleteWorldEvent,
  deleteWorldObject,
  serializeWorldBuilderDraft,
  updateWorldEvent
} from '../src/builder/world-builder-draft.js';
import { demoWorldDocument } from '../src/world/demo-world.js';

test('WorldEvent v1 normalizes on-enter with shared point trigger', () => {
  const event = normalizeWorldEvent({
    id: 'enter-grove',
    enabled: true,
    sourceAreaId: 'outside',
    activation: 'on-enter',
    trigger: {
      kind: 'point',
      x: 100,
      y: 200,
      radius: 48
    },
    action: { kind: 'message', text: 'Bienvenue' },
    repeatPolicy: 'once',
    consumed: true
  });

  assert.deepEqual(event, {
    schemaVersion: 1,
    id: 'enter-grove',
    enabled: true,
    sourceAreaId: 'outside',
    activation: 'on-enter',
    trigger: {
      kind: 'point',
      x: 100,
      y: 200,
      radius: 48
    },
    action: { kind: 'message', text: 'Bienvenue' },
    repeatPolicy: 'once'
  });
  assert.equal('consumed' in event, false);
});

test('WorldEvent v1 supports on-interact bound to shared object-anchor geometry', () => {
  const event = normalizeWorldEvent({
    id: 'inspect-house-door',
    sourceAreaId: 'outside',
    activation: 'on-interact',
    trigger: {
      kind: 'object-anchor',
      objectId: 'house-1',
      anchorId: 'main-door',
      radius: 42
    },
    action: { kind: 'message', text: 'Inspection' },
    repeatPolicy: 'repeatable'
  });

  assert.equal(event.activation, 'on-interact');
  assert.equal(event.trigger.kind, 'object-anchor');
  assert.equal(event.repeatPolicy, 'repeatable');
});

test('WorldEvent rejects missing actions and invalid activation', () => {
  assert.equal(
    normalizeWorldEvent({
      sourceAreaId: 'outside',
      activation: 'unknown',
      trigger: { kind: 'point', x: 0, y: 0, radius: 20 },
      action: { kind: 'message', text: 'X' }
    }),
    null
  );

  assert.equal(
    normalizeWorldEvent({
      sourceAreaId: 'outside',
      activation: 'on-enter',
      trigger: { kind: 'point', x: 0, y: 0, radius: 20 }
    }),
    null
  );
});

test('WorldEvent reference validation reuses trigger geometry and Area/object authority', () => {
  const document = normalizeWorldDocument({
    areas: [
      {
        id: 'outside',
        width: 800,
        height: 600,
        surface: { baseMaterialId: 'grass.forest' },
        spawns: [{ id: 'start', x: 20, y: 20 }],
        objects: [
          {
            id: 'house-1',
            objectDefinitionId:
              'objectdef.building.house.fantasy_wood_stone.01',
            transform: {
              x: 300,
              y: 300,
              rotationDeg: 0,
              scaleX: 1,
              scaleY: 1
            },
            overrides: {
              traversalSurfaceFeatureIds: []
            }
          }
        ]
      }
    ],
    initialAreaId: 'outside',
    initialSpawnId: 'start',
    events: [
      {
        id: 'valid',
        sourceAreaId: 'outside',
        activation: 'on-interact',
        trigger: {
          kind: 'object-anchor',
          objectId: 'house-1',
          anchorId: 'main-door',
          radius: 40
        },
        action: { kind: 'message', text: 'Inspection' },
        repeatPolicy: 'once'
      },
      {
        id: 'missing-object',
        sourceAreaId: 'outside',
        activation: 'on-interact',
        trigger: {
          kind: 'object-anchor',
          objectId: 'nope',
          anchorId: 'main-door',
          radius: 40
        },
        action: { kind: 'message', text: 'Invalide' },
        repeatPolicy: 'once'
      }
    ]
  });

  assert.equal(document.schemaVersion, 3);
  assert.deepEqual(
    document.events.map((event) => event.id),
    ['valid']
  );
  assert.equal(
    worldEventReferencesAreValid(
      document.areas,
      document.events[0]
    ),
    true
  );
});

test('WorldEvent list rejects duplicate ids', () => {
  const events = normalizeWorldEvents([
    {
      id: 'same',
      sourceAreaId: 'outside',
      activation: 'on-enter',
      trigger: { kind: 'point', x: 10, y: 10, radius: 20 },
      action: { kind: 'message', text: 'A' }
    },
    {
      id: 'same',
      sourceAreaId: 'outside',
      activation: 'on-enter',
      trigger: { kind: 'point', x: 30, y: 30, radius: 20 },
      action: { kind: 'message', text: 'B' }
    }
  ]);

  assert.equal(events.length, 1);
});

test('Builder adds, updates and deletes WorldEvent bindings in the canonical draft', () => {
  let draft = createWorldBuilderDraft(demoWorldDocument);

  draft = addWorldEvent(draft, {
    sourceAreaId: 'forest-exterior',
    activation: 'on-enter',
    trigger: {
      kind: 'point',
      x: 500,
      y: 600,
      radius: 55
    },
    action: { kind: 'message', text: 'Entrée' },
    repeatPolicy: 'once'
  });

  const eventId = draft.events.at(-1).id;

  draft = updateWorldEvent(
    draft,
    eventId,
    (event) => {
      event.activation = 'on-interact';
      event.action = {
        kind: 'message',
        text: 'Interaction'
      };
      event.repeatPolicy = 'repeatable';
    }
  );

  assert.equal(
    draft.events.at(-1).action.text,
    'Interaction'
  );
  assert.equal(
    draft.events.at(-1).repeatPolicy,
    'repeatable'
  );

  const json = serializeWorldBuilderDraft(draft);
  const parsed = JSON.parse(json);
  assert.equal(
    parsed.events.at(-1).activation,
    'on-interact'
  );

  draft = deleteWorldEvent(draft, eventId);
  assert.equal(
    draft.events.some((event) => event.id === eventId),
    false
  );
});

test('Builder draft never stores consumed runtime state inside a WorldEvent definition', () => {
  let draft = createWorldBuilderDraft(demoWorldDocument);

  draft = addWorldEvent(draft, {
    sourceAreaId: 'forest-exterior',
    activation: 'on-enter',
    trigger: {
      kind: 'point',
      x: 500,
      y: 600,
      radius: 55
    },
    action: { kind: 'message', text: 'Une fois' },
    repeatPolicy: 'once',
    consumed: true
  });

  const serialized = JSON.parse(
    serializeWorldBuilderDraft(draft)
  );

  assert.equal(
    'consumed' in serialized.events.at(-1),
    false
  );
});


test('Builder protects a WorldObject referenced by a WorldEvent object-anchor', () => {
  let draft = createWorldBuilderDraft(
    demoWorldDocument
  );

  draft = addWorldEvent(
    draft,
    {
      id: 'house-event',
      sourceAreaId:
        'forest-exterior',
      activation:
        'on-interact',
      trigger: {
        kind: 'object-anchor',
        objectId:
          'forest-house-01',
        anchorId:
          'main-door',
        radius: 40
      },
      eventDefinitionId:
        'eventdef.house.inspect',
      repeatPolicy:
        'repeatable'
    }
  );

  const next =
    deleteWorldObject(
      draft,
      'forest-exterior',
      'forest-house-01'
    );

  assert.equal(
    next.areas
      .find(
        (area) =>
          area.id ===
          'forest-exterior'
      )
      .objects
      .some(
        (object) =>
          object.id ===
          'forest-house-01'
      ),
    true
  );
});

test('WorldEvent message flow uses the dedicated runtime controller and keeps consumed state out of Builder', async () => {
  const { readFile } =
    await import('node:fs/promises');

  const runtime =
    await readFile(
      new URL(
        '../src/main.js',
        import.meta.url
      ),
      'utf8'
    );
  const builder =
    await readFile(
      new URL(
        '../src/builder/world-builder-main.js',
        import.meta.url
      ),
      'utf8'
    );

  assert.match(
    runtime,
    /createWorldEventController/
  );
  assert.equal(
    builder.includes('.consumed'),
    false
  );
});
