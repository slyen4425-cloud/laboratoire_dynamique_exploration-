import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Capture image is entirely visible during map startup and zone transitions', () => {
  const html = read('sculpt-lab.html');
  const runtime = read('src/sculpt-lab-main.js');
  assert.match(html, /html\.capture-loading-art #sculpt-play-boot-mask,[\s\S]*?background:#07151d var\(--capture-loading-art\) center center \/ contain no-repeat;/);
  assert.match(runtime, /overlay\.style\.backgroundSize='100% 100%, contain'/);
});

test('Combat loading art preserves the full title while retaining the contrast gradient', () => {
  const html = read('sculpt-lab.html');
  const host = read('src/encounters/immersive-encounter-host-v1.js');
  assert.match(html, /\.combat-overlay__loading--art\s*\{[\s\S]*?background-size:100% 100%,contain;/);
  assert.match(html, /\.combat-overlay__loading--art\s*\{[\s\S]*?background-color:#07151d;/);
  assert.match(host, /loading\.style\.backgroundSize='100% 100%, contain'/);
  assert.match(host, /loading\.style\.backgroundImage='linear-gradient\(/);
});
