import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const publish=read('.github/workflows/publish-v81-main.yml');
const ci=read('.github/workflows/ci.yml');
const stage=read('scripts/stage-capture-author-showcase.mjs');

test('Explorer publisher only consumes Combat main engine + main author source',()=>{
  assert.match(publish,/author_sha="\$main_sha"/);
  assert.match(publish,/ref: main\n\s+path: combat-source/);
  assert.match(publish,/ref: main\n\s+path: combat-author/);
  assert.doesNotMatch(publish,/ref: 4fd0821545eaa41ce1d3115e56f3574db6273426/);
  assert.match(publish,/git -C combat-author rev-parse HEAD\)" = "\$\(git -C combat-source rev-parse HEAD/);
});

test('CI uses identical main authority, no gh-pages author checkout',()=>{
  assert.match(ci,/ref: main\n\s+path: combat-preview/);
  assert.match(ci,/ref: main\n\s+path: combat-author/);
  assert.doesNotMatch(ci,/ref: 4fd0821545eaa41ce1d3115e56f3574db6273426/);
});

test('author staging refuses mixed main/development sources',()=>{
  assert.match(stage,/if\(authorSha!==engineSha\)throw new Error/);
  assert.match(stage,/author:\{branch:'main',commit:authorSha\}/);
});
