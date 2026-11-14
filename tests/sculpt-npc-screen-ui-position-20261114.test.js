import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sculptNpcScreenUiPositionV1} from '../src/render/sculpt-npc-screen-ui-position-v1.js';

const camera={pan:{x:-120,y:-100},zoom:2,canvasRect:{left:14,top:30},
 viewportWidth:932,viewportHeight:430};
test('NPC speech panel follows projected actor instead of HUD bottom right',()=>{
 const a=sculptNpcScreenUiPositionV1({...camera,projected:{x:220,y:190},
  boxWidth:300,boxHeight:150});
 const b=sculptNpcScreenUiPositionV1({...camera,projected:{x:290,y:190},
  boxWidth:300,boxHeight:150});
 assert.ok(b.left>a.left,'moving NPC should move speech bubble');
 assert.ok(a.top>=8&&a.top+150<=430-8);
 assert.ok(a.left>=8&&a.left+300<=932-8);
});
test('landscape smartphone positions remain visible near all four edges',()=>{
 for(const projected of [{x:-200,y:-200},{x:900,y:-300},
  {x:-200,y:800},{x:2000,y:800}]){
  const p=sculptNpcScreenUiPositionV1({...camera,projected,
   boxWidth:390,boxHeight:230,aboveGap:20});
  assert.ok(p.left>=8&&p.left+p.width<=924);
  assert.ok(p.top>=8&&p.top+p.height<=422);
 }
});
test('NPC UI reuses existing camera, dialogue state, and close/duel buttons',()=>{
 const src=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 assert.match(src,/const projected=sculptCameraProject\(view,actor\.x,/);
 assert.match(src,/sculptNpcScreenUiPositionV1\(/);
 assert.match(src,/npcDialogueAnchor=npc/);
 assert.match(src,/placeNpcScreenUi\(npc,\$\('npc-talk'\)\)/);
 assert.match(src,/placeActiveNpcDialog\(\);updateNpcInteraction\(\)/);
 assert.match(html,/\.npc-dialogue-panel\{position:fixed/);
 assert.doesNotMatch(html,/#npc-dialogue-overlay:not\(\[hidden\]\)\{[^}]*place-items:end center/);
 for(const id of ['npc-dialogue-next','npc-dialogue-close','npc-dialogue-trade'])
  assert.ok(html.includes('id="'+id+'"'));
});
