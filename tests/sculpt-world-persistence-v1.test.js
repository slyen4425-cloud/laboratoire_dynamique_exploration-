import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft,createWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {createSculptWorldPersistenceV1} from '../src/storage/sculpt-world-persistence-v1.js';
const doc=createBlankWorldBuilderDraft({id:'world-sculpt-test'});
const changed=label=>createWorldBuilderDraft({...doc,areas:doc.areas.map(a=>({...a,label}))});
test('Sculpt waits for owner commit; overlapping navigation and unload cannot overwrite',async()=>{
 let release,arrived=false;
 const gate=new Promise(resolve=>{release=resolve;});
 const next=changed('Salle modifiée');
 const session=createSculptWorldPersistenceV1({initialDocument:doc,commit:async(value,expected)=>{
  assert.equal(value,next);assert.equal(expected,doc);await gate;
 },commitOnUnload:()=>assert.fail('Unloading during pending commit')});
 const moving=session.transition(async save=>{await save(next);arrived=true;});
 await Promise.resolve();
 assert.equal(session.busy,true);assert.equal(arrived,false);
 assert.equal(session.flushOnUnload(next),false);
 await assert.rejects(session.transition(()=>{}),/déjà en cours/);
 release();await moving;
 assert.equal(arrived,true);assert.equal(session.confirmed,next);
 assert.equal(session.busy,false);
});
test('failed write does not mount destination or advance expected document',async()=>{
 const next=changed('Nouvelle salle');let attempts=0;
 const session=createSculptWorldPersistenceV1({initialDocument:doc,commit:async(value,expected)=>{
  assert.equal(expected,doc);assert.equal(value,next);
  if(++attempts===1)throw Error('QuotaExceededError');
 }});
 let arrived=false;
 await assert.rejects(session.transition(async save=>{await save(next);arrived=true;}),/Quota/);
 assert.equal(arrived,false);assert.equal(session.confirmed,doc);
 await session.transition(async save=>{await save(next);arrived=true;});
 assert.equal(arrived,true);assert.equal(session.confirmed,next);
 assert.equal(session.flushOnUnload(next),false);
});
test('legacy unload only uses same owner and leaves prior version on error',()=>{
 const next=changed('Terrain');let attempts=0;
 const session=createSculptWorldPersistenceV1({initialDocument:doc,commit:async()=>{},
  commitOnUnload:(value,expected)=>{assert.equal(expected,doc);assert.equal(value,next);if(++attempts===1)throw Error('quota');}});
 assert.throws(()=>session.flushOnUnload(next),/quota/);assert.equal(session.confirmed,doc);
 assert.equal(session.flushOnUnload(next),true);assert.equal(session.confirmed,next);
 assert.equal(session.flushOnUnload(next),true);assert.equal(attempts,2);
});
