import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {builtinSculptMapPresets} from '../src/builder/sculpt-builtin-map-presets.js';
import {createWorldAreaFromSculptMapPreset} from '../src/builder/sculpt-map-preset-library.js';
import {makePlayableZoneRoute} from '../src/builder/sculpt-playable-zone-route.js';
import {findTriggeredPortal,applyPortalTransition} from '../src/world/portal-model.js';
import {sculptWorldAreaScene} from '../src/builder/sculpt-world-area-link.js';

const presets=builtinSculptMapPresets();
test('explicit repair reconnects the existing blocked preview exit without resizing 2400 x 1600 legacy zone',()=>{
 const initial=createBlankWorldBuilderDraft({id:'legacy',width:2400,height:1600});
 const map=createWorldAreaFromSculptMapPreset(initial,presets[0],{hostAreaId:initial.initialAreaId,name:'Forêt'});
 const forest=map.areas[1],old=map.portals.find(p=>p.sourceAreaId===forest.id&&p.targetAreaId===initial.initialAreaId);
 assert.ok(old);
 const repaired=makePlayableZoneRoute(map,{selectedAreaId:forest.id,preset:presets[3]});
 const doc=repaired.document;
 assert.equal(doc.areas.find(a=>a.id===initial.initialAreaId).width,2400);
 assert.equal(doc.areas.find(a=>a.id===initial.initialAreaId).height,1600);
 assert.equal(doc.initialAreaId,forest.id);
 const next=doc.areas.find(a=>a.id===repaired.targetAreaId);
 assert.equal(sculptWorldAreaScene(next).terrain.width,36);
 const gate=doc.portals.find(p=>p.id===old.id);
 assert.equal(gate.targetAreaId,next.id);
 const hit=findTriggeredPortal(doc,forest.id,gate.trigger);
 assert.equal(hit?.id,old.id);
 const transition=applyPortalTransition(doc,{currentAreaId:forest.id,x:gate.trigger.x,y:gate.trigger.y},hit);
 assert.equal(transition.currentAreaId,next.id);
 const back=doc.portals.find(p=>p.sourceAreaId===next.id&&p.targetAreaId===forest.id);
 assert.ok(back);
 assert.equal(applyPortalTransition(doc,{currentAreaId:next.id,x:back.trigger.x,y:back.trigger.y},back)?.currentAreaId,forest.id);
 assert.ok(serializeWorldBuilderDraft(doc));
});

test('on an old world without playable Areas, explicit route creates two fresh compatible maps and preserves original',()=>{
 const original=createBlankWorldBuilderDraft({id:'old-world',width:2400,height:1600});
 const result=makePlayableZoneRoute(original,{selectedAreaId:original.initialAreaId});
 const doc=result.document;
 assert.equal(doc.areas.length>=3,true);
 assert.equal(doc.areas[0].width,2400);
 assert.equal(doc.initialAreaId,result.sourceAreaId);
 assert.notEqual(doc.initialAreaId,original.initialAreaId);
 const a=doc.areas.find(x=>x.id===result.sourceAreaId);
 const b=doc.areas.find(x=>x.id===result.targetAreaId);
 assert.ok(sculptWorldAreaScene(a));assert.ok(sculptWorldAreaScene(b));
 assert.ok(doc.portals.some(p=>p.sourceAreaId===a.id&&p.targetAreaId===b.id));
 assert.ok(doc.portals.some(p=>p.sourceAreaId===b.id&&p.targetAreaId===a.id));
});

test('an imported existing playable map can become the real host for new prefabs without a legacy portal',()=>{
 const initial=createBlankWorldBuilderDraft({id:'legacy',width:2400,height:1600});
 const first=createWorldAreaFromSculptMapPreset(initial,presets[0],{name:'Forêt'});
 const forest=first.areas.find(a=>a.id!==initial.initialAreaId);
 const next=createWorldAreaFromSculptMapPreset(first,presets[3],{name:'Neige',hostAreaId:forest.id});
 const snow=next.areas.find(a=>a.label==='Neige');
 assert.ok(snow);
 assert.ok(next.portals.find(p=>p.sourceAreaId===forest.id&&p.targetAreaId===snow.id));
 assert.ok(next.portals.find(p=>p.sourceAreaId===snow.id&&p.targetAreaId===forest.id));
});
