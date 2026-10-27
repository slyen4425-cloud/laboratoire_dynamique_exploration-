import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlankWorldBuilderDraft, addWorldArea, removeWorldArea,
  connectWorldAreas, setWorldInitialArea, deletePortal,
  serializeWorldBuilderDraft, importWorldBuilderDocument
} from '../src/builder/world-builder-draft.js';
import {portalReferencesAreValid, applyPortalTransition} from '../src/world/portal-model.js';
import {
  saveWorldAssemblerHandoff, readWorldAssemblerHandoff,
  saveWorldAssemblerDraft, readWorldAssemblerDraft
} from '../src/builder/world-assembler-handoff.js';

const start=()=>createBlankWorldBuilderDraft({id:'mon-univers'});
const mem=()=>{const data=new Map();return {data,
  getItem:key=>data.get(key)??null,
  setItem:(key,value)=>data.set(key,String(value)),
  removeItem:key=>data.delete(key)};};

test('one WorldDocument draft can grow an exterior region and an interior instance',()=>{
  let d=start();
  d=addWorldArea(d,{name:'Forêt des brumes',kind:'exterior',width:1200,height:900});
  d=addWorldArea(d,{name:'Crypte ancienne',kind:'interior',width:640,height:480});
  assert.equal(d.areas.length,3);
  assert.equal(new Set(d.areas.map(x=>x.id)).size,3);
  assert.equal(d.areas[1].kind,'exterior');
  assert.equal(d.areas[2].kind,'interior');
  assert.equal(d.areas[1].encounters.randomEnabled,true);
  assert.equal(d.areas[2].encounters.randomEnabled,false);
  assert.ok(d.areas.every(x=>x.spawns.length>0));
  assert.equal(d.initialAreaId,'area-principale');
  assert.equal(importWorldBuilderDocument(serializeWorldBuilderDraft(d)).areas.length,3);
});
test('same display name creates distinct IDs without user typing an ID',()=>{
  let d=start();
  d=addWorldArea(d,{name:'La forêt',kind:'exterior'});
  d=addWorldArea(d,{name:'La forêt',kind:'exterior'});
  assert.notEqual(d.areas[1].id,d.areas[2].id);
});
test('World graph links are real Portals and work with runtime transition owner',()=>{
  let d=addWorldArea(start(),{name:'Arène',kind:'interior'});
  const source=d.areas[0],target=d.areas[1];
  d=connectWorldAreas(d,{sourceAreaId:source.id,targetAreaId:target.id,returnPortal:true});
  assert.equal(d.portals.length,2);
  assert.ok(d.portals.every(p=>portalReferencesAreValid(d.areas,p)));
  const entry=d.portals.find(p=>p.sourceAreaId===source.id);
  assert.equal(entry.targetAreaId,target.id);
  assert.equal(entry.targetSpawnId,target.spawns[0].id);
  assert.equal(applyPortalTransition(d,{currentAreaId:source.id,x:12,y:13},entry).currentAreaId,target.id);
  assert.equal(connectWorldAreas(d,{sourceAreaId:source.id,targetAreaId:target.id}).portals.length,2);
  assert.equal(deletePortal(d,entry.id).portals.length,1);
  assert.equal(serializeWorldBuilderDraft(d).includes(target.id),true);
});
test('removing linked, initial, or event-referenced Area is protected',()=>{
  let d=addWorldArea(start(),{name:'Cave',kind:'interior'});
  const cave=d.areas[1].id;
  d=connectWorldAreas(d,{sourceAreaId:d.initialAreaId,targetAreaId:cave});
  assert.throws(()=>removeWorldArea(d,cave),/passage|Portal|liée/i);
  assert.throws(()=>removeWorldArea(d,d.initialAreaId),/départ|initiale/i);
  const other=addWorldArea(d,{name:'Bibliothèque',kind:'interior'});
  assert.equal(removeWorldArea(other,other.areas[2].id).areas.length,2);
});
test('setting another starting area keeps its real spawn and is exportable',()=>{
  let d=addWorldArea(start(),{name:'Ville',kind:'exterior'});
  d=setWorldInitialArea(d,d.areas[1].id);
  assert.equal(d.initialAreaId,d.areas[1].id);
  assert.equal(d.initialSpawnId,d.areas[1].spawns[0].id);
  const roundtrip=importWorldBuilderDocument(serializeWorldBuilderDraft(d));
  assert.equal(roundtrip.initialAreaId,d.initialAreaId);
});
test('handoff to existing detailed editor uses a versioned WorldDocument only',()=>{
  let d=addWorldArea(start(),{name:'Village',kind:'exterior'});
  const storage=mem(),selected=d.areas[1].id;
  saveWorldAssemblerHandoff(storage,d,selected);
  const restored=readWorldAssemblerHandoff(storage);
  assert.equal(restored.areaId,selected);
  assert.equal(restored.document.areas.length,2);
  assert.equal(readWorldAssemblerHandoff(storage),null,'single-use transfer');
  saveWorldAssemblerDraft(storage,restored.document);
  assert.equal(readWorldAssemblerDraft(storage).areas.length,2);
});
test('invalid imported data never overwrites the existing WorldDocument',()=>{
  const storage=mem(),d=start();
  saveWorldAssemblerDraft(storage,d);
  storage.setItem('gensrpg.world-assembler.handoff.v1','{"schemaVersion":1,"document":{"areas":[]}}');
  assert.equal(readWorldAssemblerHandoff(storage),null);
  assert.equal(readWorldAssemblerDraft(storage).initialAreaId,d.initialAreaId);
});
