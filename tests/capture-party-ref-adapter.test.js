import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  resolveActiveCapturePartyRefV1
} from '../src/capture/capture-party-ref-adapter-v1.js';
import {
  CAPTURE_SESSION_PREVIEW_V1
} from '../src/capture/capture-session-preview-v1.js';

test('Capture party ref adapter exposes only the opaque active party reference', () => {
  assert.equal(
    resolveActiveCapturePartyRefV1(
      CAPTURE_SESSION_PREVIEW_V1
    ),
    'capture-party-player-v1'
  );

  assert.deepEqual(
    Object.keys(CAPTURE_SESSION_PREVIEW_V1),
    ['activePartyRef']
  );
});

test('Capture party ref adapter rejects a missing party reference', () => {
  assert.throws(
    () =>
      resolveActiveCapturePartyRefV1({}),
    /activePartyRef/
  );
});

test('Exploration bootstrap transports partyRef without owning player creature data', async () => {
  const main = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  assert.match(
    main,
    /resolveActiveCapturePartyRefV1/
  );
  assert.match(
    main,
    /playerPartyRef:\s*activeCapturePartyRef/
  );
  assert.doesNotMatch(
    main,
    /capture-party-preview/
  );
  assert.doesNotMatch(
    main,
    /crea-loup|crea_mossback/
  );
});
