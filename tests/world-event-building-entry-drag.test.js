import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  normalizeWorldEvent,
  worldEventReferencesAreValid
} from '../src/world/world-event-model.js';
import {
  createWorldEventController
} from '../src/world/world-event-controller.js';

const AREAS = Object.freeze([
  { id: 'outside', width: 800, height: 600, surface: { baseMaterialId: 'grass.forest' }, spawns: [] },
  { id: 'house-interior-01', width: 600, height: 400, surface: { baseMaterialId: 'floor.wood.house' }, spawns: [] }
]);

const PORTALS = Object.freeze([
  {
    id: 'portal-house-enter',
    enabled: true,
    sourceAreaId: 'outside',
    trigger: { kind: 'point', x: 100, y: 100, radius: 20 },
    targetAreaId: 'house-interior-01',
    targetSpawnId: 'entry',
    visual: { visible: false, marker: 'portal', label: null }
  }
]);

test('WorldEvent can bind specifically to entering through one Portal', () => {
  const event = normalizeWorldEvent({
    id: 'enter-house-1',
    sourceAreaId: 'house-interior-01',
    activation: 'on-portal-enter',
    portalId: 'portal-house-enter',
    action: {
      kind: 'message',
      text: 'Vous entrez dans la maison numéro 1.'
    },
    repeatPolicy: 'repeatable'
  });

  assert.deepEqual(event, {
    schemaVersion: 1,
    id: 'enter-house-1',
    enabled: true,
    sourceAreaId: 'house-interior-01',
    activation: 'on-portal-enter',
    portalId: 'portal-house-enter',
    action: {
      kind: 'message',
      text: 'Vous entrez dans la maison numéro 1.'
    },
    repeatPolicy: 'repeatable'
  });

  assert.equal('trigger' in event, false);
  assert.equal(
    worldEventReferencesAreValid(
      AREAS,
      event,
      PORTALS
    ),
    true
  );
});

test('Portal-enter event requires a real Portal targeting the configured Area', () => {
  const event = normalizeWorldEvent({
    id: 'bad-house',
    sourceAreaId: 'outside',
    activation: 'on-portal-enter',
    portalId: 'portal-house-enter',
    action: {
      kind: 'message',
      text: 'Wrong target'
    }
  });

  assert.equal(
    worldEventReferencesAreValid(
      AREAS,
      event,
      PORTALS
    ),
    false
  );
});

test('Event Controller fires building-entry message from Portal transition fact only once per transition edge', () => {
  const event = normalizeWorldEvent({
    id: 'enter-house-1',
    sourceAreaId: 'house-interior-01',
    activation: 'on-portal-enter',
    portalId: 'portal-house-enter',
    action: {
      kind: 'message',
      text: 'Bienvenue dans la maison.'
    },
    repeatPolicy: 'repeatable'
  });

  const controller = createWorldEventController({
    areas: AREAS,
    portals: PORTALS,
    events: [event]
  });

  assert.equal(
    controller.step({
      currentAreaId: 'outside',
      viaPortalId: null,
      entity: { x: 0, y: 0 }
    }),
    null
  );

  assert.equal(
    controller.step({
      currentAreaId: 'house-interior-01',
      viaPortalId: 'portal-house-enter',
      entity: { x: 0, y: 0 }
    })?.eventId,
    'enter-house-1'
  );

  assert.equal(
    controller.step({
      currentAreaId: 'house-interior-01',
      viaPortalId: 'portal-house-enter',
      entity: { x: 20, y: 20 }
    }),
    null
  );

  controller.step({
    currentAreaId: 'outside',
    viaPortalId: 'portal-house-exit',
    entity: { x: 0, y: 0 }
  });

  assert.equal(
    controller.step({
      currentAreaId: 'house-interior-01',
      viaPortalId: 'portal-house-enter',
      entity: { x: 0, y: 0 }
    })?.eventId,
    'enter-house-1'
  );
});

test('Builder explains building entry and exposes a place selector instead of a trigger circle', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );

  assert.match(
    html,
    /Entrer dans un lieu ou bâtiment/
  );
  assert.match(
    html,
    /id="event-portal"/
  );
});

test('Builder supports direct drag of selected free event circle', async () => {
  const source = await readFile(
    new URL(
      '../src/builder/world-builder-main.js',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(
    source,
    /drag-event-trigger/
  );
  assert.match(
    source,
    /event\.trigger\?\.kind === 'point'/
  );
  assert.match(
    source,
    /nextEvent\.trigger\.x/
  );
  assert.match(
    source,
    /nextEvent\.trigger\.y/
  );
});
