import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankWorldBuilderDraft,createBuildingInteriorLink,importWorldBuilderDocument,
 serializeWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {createAutomaticPortalTraversalGate,findTriggeredPortal} from '../src/world/portal-model.js';

// The real forest1 terracotta house scaled 90% and rotated 9°.
const building={id:'sculpt-object-141',objectDefinitionId:'objectdef.building.house.terracotta_2p5d.01',
 transform:{x:1507.5834732055664,y:669.8124713897705,rotationDeg:9,scaleX:.9,scaleY:.9},
 overrides:{visualVariantId:'side'}};
function world(){
 let draft=createBlankWorldBuilderDraft({id:'reentry-guard',width:2240,height:1260});
 const exteriorId=draft.areas[0].id;
 draft={...draft,areas:draft.areas.map(area=>area.id===exteriorId?
  {...area,objects:[building]}:area)};
 draft=createBuildingInteriorLink(draft,{sourceAreaId:exteriorId,buildingId:building.id,
  anchorId:'main-door',interiorSize:{width:504,height:294}});
 return {document:importWorldBuilderDocument(serializeWorldBuilderDraft(draft)),exteriorId};
}
test('automatic legacy runtime does not loop if returned inside entrance circle',()=>{
 const {document,exteriorId}=world();
 const enter=document.portals.find(p=>p.sourceAreaId===exteriorId);
 const exit=document.portals.find(p=>p.sourceAreaId===enter.targetAreaId);
 const transition=createAutomaticPortalTraversalGate();
 assert.equal(transition.step(document,{currentAreaId:exteriorId,x:0,y:0}),null);
 const inside={currentAreaId:exit.sourceAreaId,x:exit.trigger.x,y:exit.trigger.y};
 const outside=transition.step(document,inside);
 assert.equal(outside.currentAreaId,exteriorId);
 assert.equal(findTriggeredPortal(document,exteriorId,outside)?.id,enter.id,
  'the return is deliberately beside the physical threshold');
 assert.equal(transition.step(document,outside),null,
  'next frame must not re-enter automatically while stationary at the threshold');
 assert.equal(transition.step(document,outside),null,'no repeated teleport while staying inside the hitbox');
 // Leaving the entrance region rearms the old automatic runtime; approaching again works.
 const away={...outside,x:outside.x+250,y:outside.y+200};
 assert.equal(transition.step(document,away),null);
 // The exact near-door position is the already validated return spawn.
 const reenter=transition.step(document,outside);
 assert.equal(reenter?.currentAreaId,exit.sourceAreaId);
});
test('the 2.5D Sculpt player still explicitly presses its existing traverse button',()=>{
 const sculpt=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(sculpt, /function sculptWorldPortalAtHero\(\)/);
 assert.match(sculpt, /\$\('world-portal-traverse'\)/);
 assert.match(main, /createAutomaticPortalTraversalGate/);
});
