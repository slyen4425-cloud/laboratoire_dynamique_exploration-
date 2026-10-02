import test from 'node:test';
import assert from 'node:assert/strict';

import { createPortalRenderer } from '../src/render/portal-renderer.js';
import { demoWorldDocument } from '../src/world/demo-world.js';

function fakeContext() {
  const calls = [];
  return {
    calls,
    save(){ calls.push(['save']); },
    restore(){ calls.push(['restore']); },
    translate(x,y){ calls.push(['translate',x,y]); },
    beginPath(){ calls.push(['beginPath']); },
    arc(x,y,r){ calls.push(['arc',x,y,r]); },
    fill(){ calls.push(['fill']); },
    stroke(){ calls.push(['stroke']); },
    moveTo(x,y){ calls.push(['moveTo',x,y]); },
    lineTo(x,y){ calls.push(['lineTo',x,y]); },
    fillText(text,x,y){ calls.push(['fillText',text,x,y]); },
    set fillStyle(value){ calls.push(['fillStyle',value]); },
    set strokeStyle(value){ calls.push(['strokeStyle',value]); },
    set lineWidth(value){ calls.push(['lineWidth',value]); },
    set lineCap(value){ calls.push(['lineCap',value]); },
    set lineJoin(value){ calls.push(['lineJoin',value]); },
    set font(value){ calls.push(['font',value]); },
    set textAlign(value){ calls.push(['textAlign',value]); },
    set textBaseline(value){ calls.push(['textBaseline',value]); }
  };
}

test('Portal renderer displays the exact active Portal trigger position', () => {
  const ctx = fakeContext();
  const renderer = createPortalRenderer();

  renderer.draw(ctx, {
    camera: { x: 100, y: 400 },
    worldDocument: demoWorldDocument,
    currentAreaId: 'house-interior-01'
  });

  assert.deepEqual(
    ctx.calls.find((call) => call[0] === 'translate'),
    ['translate', 260, 110]
  );
  assert.deepEqual(
    ctx.calls.find((call) => call[0] === 'arc'),
    ['arc', 0, 0, 30]
  );
  assert.equal(
    ctx.calls.some(
      (call) => call[0] === 'fillText' && call[1] === 'Sortie'
    ),
    true
  );
});

test('Portal renderer does not display markers from another Area', () => {
  const ctx = fakeContext();
  const renderer = createPortalRenderer();

  renderer.draw(ctx, {
    camera: { x: 0, y: 0 },
    worldDocument: demoWorldDocument,
    currentAreaId: 'forest-exterior'
  });

  assert.equal(
    ctx.calls.some((call) => call[0] === 'fillText'),
    false
  );
});
