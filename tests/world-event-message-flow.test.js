import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  normalizeWorldEvent
} from '../src/world/world-event-model.js';
import {
  createWorldEventController
} from '../src/world/world-event-controller.js';
import {
  normalizeWorldDocument
} from '../src/world/world-document-model.js';

function worldWithEvents(events) {
  return normalizeWorldDocument({
    id: 'event-message-test',
    areas: [
      {
        id: 'outside',
        width: 800,
        height: 600,
        surface: {
          baseTerrainFamilyId: 'plain',
          baseMaterialId: 'grass.forest'
        },
        spawns: [
          { id: 'start', x: 40, y: 40 }
        ],
        objects: []
      }
    ],
    initialAreaId: 'outside',
    initialSpawnId: 'start',
    events
  });
}

test('WorldEvent message action stores creator text directly in the event contract', () => {
  const event = normalizeWorldEvent({
    id: 'welcome',
    sourceAreaId: 'outside',
    activation: 'on-enter',
    trigger: {
      kind: 'point',
      x: 100,
      y: 100,
      radius: 40
    },
    action: {
      kind: 'message',
      text: 'Bienvenue dans la forêt.'
    },
    repeatPolicy: 'once'
  });

  assert.equal(event.action.kind, 'message');
  assert.equal(
    event.action.text,
    'Bienvenue dans la forêt.'
  );
  assert.equal('eventDefinitionId' in event, false);
});

test('empty message is invalid for the simple message action', () => {
  const event = normalizeWorldEvent({
    sourceAreaId: 'outside',
    activation: 'on-enter',
    trigger: {
      kind: 'point',
      x: 100,
      y: 100,
      radius: 40
    },
    action: {
      kind: 'message',
      text: '   '
    }
  });

  assert.equal(event, null);
});

test('on-enter message fires on entry edge, not every frame while standing inside', () => {
  const world = worldWithEvents([
    {
      id: 'welcome',
      sourceAreaId: 'outside',
      activation: 'on-enter',
      trigger: {
        kind: 'point',
        x: 100,
        y: 100,
        radius: 40
      },
      action: {
        kind: 'message',
        text: 'Bonjour'
      },
      repeatPolicy: 'repeatable'
    }
  ]);

  const controller =
    createWorldEventController(world);

  assert.equal(
    controller.step({
      currentAreaId: 'outside',
      entity: { x: 20, y: 20 }
    }),
    null
  );

  const first = controller.step({
    currentAreaId: 'outside',
    entity: { x: 100, y: 100 }
  });

  assert.equal(first?.eventId, 'welcome');
  assert.equal(first?.action.text, 'Bonjour');

  assert.equal(
    controller.step({
      currentAreaId: 'outside',
      entity: { x: 101, y: 101 }
    }),
    null
  );

  controller.step({
    currentAreaId: 'outside',
    entity: { x: 200, y: 200 }
  });

  assert.equal(
    controller.step({
      currentAreaId: 'outside',
      entity: { x: 100, y: 100 }
    })?.eventId,
    'welcome'
  );
});

test('once event is consumed only in runtime state for the session', () => {
  const world = worldWithEvents([
    {
      id: 'once',
      sourceAreaId: 'outside',
      activation: 'on-enter',
      trigger: {
        kind: 'point',
        x: 100,
        y: 100,
        radius: 40
      },
      action: {
        kind: 'message',
        text: 'Une seule fois'
      },
      repeatPolicy: 'once'
    }
  ]);

  const controller =
    createWorldEventController(world);

  controller.step({
    currentAreaId: 'outside',
    entity: { x: 20, y: 20 }
  });
  assert.equal(
    controller.step({
      currentAreaId: 'outside',
      entity: { x: 100, y: 100 }
    })?.eventId,
    'once'
  );

  controller.step({
    currentAreaId: 'outside',
    entity: { x: 200, y: 200 }
  });

  assert.equal(
    controller.step({
      currentAreaId: 'outside',
      entity: { x: 100, y: 100 }
    }),
    null
  );

  assert.equal(
    JSON.stringify(world).includes('"consumed"'),
    false
  );
});

test('on-interact exposes a nearby action only when player is inside its trigger', () => {
  const world = worldWithEvents([
    {
      id: 'sign',
      sourceAreaId: 'outside',
      activation: 'on-interact',
      trigger: {
        kind: 'point',
        x: 300,
        y: 300,
        radius: 50
      },
      action: {
        kind: 'message',
        text: 'Le panneau indique : Village au nord.'
      },
      repeatPolicy: 'repeatable'
    }
  ]);

  const controller =
    createWorldEventController(world);

  assert.equal(
    controller.peekInteractable({
      currentAreaId: 'outside',
      entity: { x: 100, y: 100 }
    }),
    null
  );

  assert.equal(
    controller.peekInteractable({
      currentAreaId: 'outside',
      entity: { x: 300, y: 300 }
    })?.eventId,
    'sign'
  );

  assert.equal(
    controller.interact({
      currentAreaId: 'outside',
      entity: { x: 300, y: 300 }
    })?.action.text,
    'Le panneau indique : Village au nord.'
  );
});

test('Builder presents creator language and hides eventDefinitionId', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );

  assert.match(html, /Quand ?/);
  assert.match(html, /Où ?/);
  assert.match(html, /Afficher un message/);
  assert.match(html, /id="event-message"/);
  assert.equal(
    html.includes('Event definition ID'),
    false
  );
});

test('runtime page contains message dialog and explicit interaction intent', async () => {
  const html = await readFile(
    new URL('../index.html', import.meta.url),
    'utf8'
  );
  const runtime = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  assert.match(html, /id="world-event-dialog"/);
  assert.match(html, /id="world-event-message"/);
  assert.match(html, /id="world-interact"/);
  assert.match(runtime, /createWorldEventController/);
});
