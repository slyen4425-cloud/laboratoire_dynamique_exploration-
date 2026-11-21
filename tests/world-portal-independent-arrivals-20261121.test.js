import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createBlankWorldBuilderDraft,addWorldArea,connectWorldAreas,
 updatePortal,ensureWorldPortalIndependentArrivalV1,
 serializeWorldBuilderDraft,importWorldBuilderDocument,validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';
import {applyPortalTransition,portalReferencesAreValid}
 from '../src/world/portal-model.js';
import {placeSculptWorldSpawn} from '../src/builder/sculpt-world-area-link.js';
import {describeWorldAreaIncomingPortalsForEditorV1}
 from '../src/builder/sculpt-world-spawn-controls-v1.js';
import {markersForSculptWorldArea} from '../src/builder/sculpt-world-portal-markers.js';

function threeAreas(){
 let doc=createBlankWorldBuilderDraft({id:'lacs-et-montagne',width:36*28,height:24*21});
 doc=addWorldArea(doc,{name:'Lac 02',kind:'exterior',width:36*28,height:24*21});
 doc=addWorldArea(doc,{name:'Montagne',kind:'exterior',width:36*28,height:24*21});
 return {doc,lac01:doc.areas[0].id,lac02:doc.areas[1].id,montagne:doc.areas[2].id};
}
function through(doc,from,to){
 const p=doc.portals.find(p=>p.sourceAreaId===from&&p.targetAreaId===to);
 assert.ok(p,'real Portal expected '+from+' → '+to);
 assert.equal(portalReferencesAreValid(doc.areas,p),true);
 return p;
}
function coord(doc,portal){
 const state=applyPortalTransition(doc,{currentAreaId:portal.sourceAreaId,x:1,y:1},portal);
 assert.ok(state,'must use native Portal transition');
 return {areaId:state.currentAreaId,x:state.x,y:state.y,portalId:state.viaPortalId};
}

test('Lac01 → Lac02 south; Lac02 → Montagne north; Montagne → Lac02 north',()=>{
 let {doc,lac01,lac02,montagne}=threeAreas();
 doc=connectWorldAreas(doc,{sourceAreaId:lac01,targetAreaId:lac02,
  returnPortal:true,sourceExitPoint:{x:500,y:32},
  returnArrivalPoint:{x:500,y:90}});
 const lakeFrom01=through(doc,lac01,lac02);
 const lakeTo01=through(doc,lac02,lac01);
 const southId=lakeFrom01.targetSpawnId;
 // The author drags the Lac01 arrival to the south of Lac02 using the
 // existing native Spawn edit command, without moving Lac02's other Spawns.
 doc=placeSculptWorldSpawn(doc,lac02,southId,{x:500,y:430});
 assert.deepEqual(coord(doc,through(doc,lac01,lac02)),
  {areaId:lac02,x:500,y:430,portalId:lakeFrom01.id});
 assert.notEqual(southId,doc.areas.find(a=>a.id===lac02).spawns[0].id);
 const northExit={x:480,y:36},northArrival={x:480,y:88};
 doc=connectWorldAreas(doc,{sourceAreaId:lac02,targetAreaId:montagne,
  returnPortal:true,sourceExitPoint:northExit,returnArrivalPoint:northArrival});
 const fromMountain=through(doc,montagne,lac02);
 const toMountain=through(doc,lac02,montagne);
 assert.notEqual(fromMountain.targetSpawnId,lakeFrom01.targetSpawnId,
  'return from Mountain must not reuse the Lac01 arrival');
 assert.equal(toMountain.trigger.x,480);
 assert.equal(toMountain.trigger.y,36);
 assert.deepEqual(coord(doc,fromMountain),{areaId:lac02,x:480,y:88,
  portalId:fromMountain.id},'Mountain return must land by the north exit');
 assert.equal(coord(doc,lakeFrom01).areaId,lac02);
 assert.equal(coord(doc,lakeTo01).areaId,lac01);
 assert.equal(coord(doc,toMountain).areaId,montagne);
 const inbound=describeWorldAreaIncomingPortalsForEditorV1(doc,lac02);
 assert.deepEqual(inbound.map(x=>x.label).sort(),['Depuis Montagne','Depuis '+(doc.areas[0].label??doc.areas[0].id)].sort());
 assert.equal(inbound.length,2);
 assert.ok(inbound.every(x=>x.editable&&!x.shared));
 assert.equal(markersForSculptWorldArea(doc,lac02).filter(x=>x.kind==='arrival').length,2);
 const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(doc));
 assert.deepEqual(coord(restored,through(restored,montagne,lac02)),
  coord(doc,fromMountain),'arrival survives save/export/import');
});

test('un passage créé depuis le plan Monde génère aussi ses propres arrivées sans entrée manuelle X/Y',()=>{
 const {doc:seed,lac01,lac02,montagne}=threeAreas();
 let doc=connectWorldAreas(seed,{sourceAreaId:lac01,targetAreaId:lac02,returnPortal:true});
 doc=connectWorldAreas(doc,{sourceAreaId:montagne,targetAreaId:lac02,returnPortal:true});
 assert.notEqual(through(doc,lac01,lac02).targetSpawnId,
  through(doc,montagne,lac02).targetSpawnId);
 const before=doc.areas.map(a=>a.spawns.map(s=>s.id).join(',')).join('|');
 const repeated=connectWorldAreas(doc,{sourceAreaId:lac01,targetAreaId:lac02,returnPortal:true});
 assert.equal(repeated.portals.length,doc.portals.length);
 assert.equal(repeated.areas.map(a=>a.spawns.map(s=>s.id).join(',')).join('|'),before,
  'repeat cannot generate extra arrivals');
 assert.equal(validateWorldBuilderDraft(doc).valid,true);
});

test('legacy two incoming Portals sharing one Spawn are NOT silently migrated',()=>{
 const {doc:seed,lac01,lac02,montagne}=threeAreas();
 let doc=connectWorldAreas(seed,{sourceAreaId:lac01,targetAreaId:lac02,returnPortal:true});
 // Simulate a legacy user world: another Portals existed and targeted the
 // same old Spawn, exactly the reported Lac01/Montagne issue.
 doc=connectWorldAreas(doc,{sourceAreaId:montagne,targetAreaId:lac02,returnPortal:false});
 const first=through(doc,lac01,lac02),second=through(doc,montagne,lac02);
 const initial=doc.initialSpawnId;
 doc=updatePortal(doc,second.id,p=>{p.targetSpawnId=first.targetSpawnId;});
 const before=importWorldBuilderDocument(serializeWorldBuilderDraft(doc));
 const entries=describeWorldAreaIncomingPortalsForEditorV1(before,lac02);
 assert.equal(entries.length,2,'all incoming portals displayed even with one shared marker');
 assert.equal(entries.every(e=>e.shared),true);
 assert.equal(markersForSculptWorldArea(before,lac02).filter(e=>e.kind==='arrival').length,1);
 assert.equal(before.portals.find(p=>p.id===second.id).targetSpawnId,first.targetSpawnId);
 const repaired=ensureWorldPortalIndependentArrivalV1(before,second.id);
 const fixedSecond=through(repaired,montagne,lac02);
 assert.notEqual(fixedSecond.targetSpawnId,first.targetSpawnId);
 assert.equal(through(repaired,lac01,lac02).targetSpawnId,first.targetSpawnId,
  'previous Lac01 arrival does not move');
 assert.equal(repaired.initialSpawnId,initial);
 assert.equal(ensureWorldPortalIndependentArrivalV1(repaired,second.id).areas
  .find(a=>a.id===lac02).spawns.length,
  repaired.areas.find(a=>a.id===lac02).spawns.length,'repair idempotent');
 const roundtrip=importWorldBuilderDocument(serializeWorldBuilderDraft(repaired));
 assert.equal(through(roundtrip,montagne,lac02).targetSpawnId,fixedSecond.targetSpawnId);
});

test('starting-world spawn is never changed when repairing an arrival',()=>{
 const {doc:seed,lac01,lac02}=threeAreas();
 const doc=connectWorldAreas(seed,{sourceAreaId:lac02,targetAreaId:lac01,
  returnPortal:false});
 const p=through(doc,lac02,lac01),worldStart=doc.initialSpawnId;
 const repaired=ensureWorldPortalIndependentArrivalV1(doc,p.id);
 assert.equal(repaired.initialSpawnId,worldStart);
 assert.notEqual(through(repaired,lac02,lac01).targetSpawnId,worldStart);
 assert.equal(coord(repaired,through(repaired,lac02,lac01)).areaId,lac01);
});
test('editor uses the same native portaling and a foldable per-source arrival picker',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const sculpt=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(html,/<details id="object-waypoint-arrivals"/);
 for(const id of ['object-waypoint-arrival-select','object-waypoint-arrival-place'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(sculpt,/describeWorldAreaIncomingPortalsForEditorV1/);
 assert.match(sculpt,/ensureWorldPortalIndependentArrivalV1/);
 assert.match(sculpt,/returnArrivalPoint:suggestedSculptReturnArrivalPoint\(position\)/);
 assert.match(sculpt,/sculptWorldPortalPlacement='spawn'/);
 assert.doesNotMatch(sculpt,/arrivalSpawnPositionsByWorld/);
});
