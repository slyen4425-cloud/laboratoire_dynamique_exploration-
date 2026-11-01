import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {builtinSculptMapPresets} from '../src/builder/sculpt-builtin-map-presets.js';
import {createWorldAreaFromSculptMapPreset,mapEdgePoint} from '../src/builder/sculpt-map-preset-library.js';
import {sculptWorldAreaScene} from '../src/builder/sculpt-world-area-link.js';
import {findTriggeredPortal,applyPortalTransition,portalReferencesAreValid}
  from '../src/world/portal-model.js';
import {makePlayableZoneRoute} from '../src/builder/sculpt-playable-zone-route.js';

const presets=builtinSculptMapPresets();
function assertDirectionalPair(doc,a,b){
 const exit=mapEdgePoint(sculptWorldAreaScene(a),'exit');
 const entry=mapEdgePoint(sculptWorldAreaScene(b),'entry');
 const forward=doc.portals.find(p=>p.sourceAreaId===a.id&&p.targetAreaId===b.id);
 const back=doc.portals.find(p=>p.sourceAreaId===b.id&&p.targetAreaId===a.id);
 assert.ok(forward&&back,'unique canonical reciprocal Portals');
 assert.equal(forward.trigger.x,exit.x,'A outbound lives at A road exit');
 assert.equal(forward.trigger.y,exit.y);
 assert.equal(back.trigger.x,entry.x,'B return lives at B road entry');
 assert.equal(back.trigger.y,entry.y);
 assert.ok(portalReferencesAreValid(doc.areas,forward));
 assert.ok(portalReferencesAreValid(doc.areas,back));
 const intoB=applyPortalTransition(doc,{currentAreaId:a.id,x:exit.x,y:exit.y},forward);
 assert.equal(intoB.currentAreaId,b.id);
 assert.ok(intoB.x>entry.x+back.trigger.radius+3,
   'arrival B must be beyond return Portal and cannot auto-bounce');
 assert.ok(!findTriggeredPortal(doc,b.id,intoB),
   'landing in B may not immediately trigger another zone transition');
 const backFromEntry=findTriggeredPortal(doc,b.id,entry);
 assert.equal(backFromEntry?.id,back.id,'only entry of B returns to A');
 const intoA=applyPortalTransition(doc,{currentAreaId:b.id,x:entry.x,y:entry.y},back);
 assert.equal(intoA.currentAreaId,a.id);
 assert.ok(intoA.x<exit.x-forward.trigger.radius-3,
   'return to A must be behind its exit');
 assert.ok(!findTriggeredPortal(doc,a.id,intoA),'no bounce on return to A');
 const bExit=mapEdgePoint(sculptWorldAreaScene(b),'exit');
 assert.notEqual(findTriggeredPortal(doc,b.id,bExit)?.id,back.id,
   'B exit must NEVER take player back to A');
}
test('2 zones: A exit -> B entry; B entry -> A exit, never B exit -> A',()=>{
 const blank=createBlankWorldBuilderDraft({id:'two-way-road',width:1008,height:504});
 const one=createWorldAreaFromSculptMapPreset(blank,presets[0],{name:'Zone A'});
 const a=one.areas.find(x=>x.label==='Zone A');
 const world=createWorldAreaFromSculptMapPreset(one,presets[3],{name:'Zone B',hostAreaId:a.id});
 const b=world.areas.find(x=>x.label==='Zone B');
 assertDirectionalPair(world,a,b);
});
test('3 zones: A exit -> B entry; B exit -> C entry; returns at each entry',()=>{
 const blank=createBlankWorldBuilderDraft({id:'three-way-road',width:1008,height:504});
 const one=createWorldAreaFromSculptMapPreset(blank,presets[0],{name:'Zone A'});
 const a=one.areas.find(x=>x.label==='Zone A');
 const two=createWorldAreaFromSculptMapPreset(one,presets[3],{name:'Zone B',hostAreaId:a.id});
 const b=two.areas.find(x=>x.label==='Zone B');
 const three=createWorldAreaFromSculptMapPreset(two,presets[5],{name:'Zone C',hostAreaId:b.id});
 const c=three.areas.find(x=>x.label==='Zone C');
 assertDirectionalPair(three,a,b);assertDirectionalPair(three,b,c);
});
test('explicit repair of old worlds relocates reverse gate to B entry without mutating saved geometry',()=>{
 const blank=createBlankWorldBuilderDraft({id:'repair',width:1008,height:504});
 const first=createWorldAreaFromSculptMapPreset(blank,presets[1],{name:'Zone A'});
 const a=first.areas.find(x=>x.label==='Zone A');
 const second=createWorldAreaFromSculptMapPreset(first,presets[4],{name:'Zone B',hostAreaId:a.id});
 const b=second.areas.find(x=>x.label==='Zone B');
 const repaired=makePlayableZoneRoute(second,{selectedAreaId:a.id}).document;
 assertDirectionalPair(repaired,a,b);
});
