import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft,createWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {createSculptWorldPersistenceV1,installSculptWorldAutosaveV1} from '../src/storage/sculpt-world-persistence-v1.js';
const base=createBlankWorldBuilderDraft({id:'world-auto-test'});
const change=label=>createWorldBuilderDraft({...base,areas:base.areas.map(a=>({...a,label}))});
function timers(){let next=0;const pending=new Map();return {pending,setTimeout(fn){const id=++next;pending.set(id,fn);return id;},clearTimeout(id){pending.delete(id);}};}
test('durable autosave uses same owner, keeps dirty after errors and excludes play',async()=>{
 const root=timers(),states=[];let doc=change('Relief'),fail=true,playing=false,count=0;
 const persistence=createSculptWorldPersistenceV1({initialDocument:base,commit:async(value,expected)=>{
  assert.equal(expected,base);assert.equal(value,doc);count++;if(fail)throw Error('quota');
 }});
 const auto=installSculptWorldAutosaveV1({persistence,root,capture:()=>doc,canSave:()=>!playing,onState:s=>states.push(s)});
 auto.schedule();assert.equal(auto.pending,true);assert.equal(root.pending.size,2);
 playing=true;assert.equal(await auto.flush(),false);assert.equal(count,0);
 playing=false;assert.equal(await auto.flush(),false);assert.equal(auto.pending,true);assert.equal(persistence.confirmed,base);
 fail=false;assert.equal(await auto.flush(),true);assert.equal(auto.pending,false);assert.equal(persistence.confirmed,doc);
 auto.schedule();assert.equal(await auto.flush(),true);assert.equal(count,2);
 assert.deepEqual(states,['pending','error','saved','pending','saved']);
 auto.dispose();assert.equal(root.pending.size,0);
});
test('durable autosave and an explicit transition serialize writes without fallback',async()=>{
 const root=timers();let release;const first=change('A'),second=change('B'),seen=[];
 const persistence=createSculptWorldPersistenceV1({initialDocument:base,commit:async(value,expected)=>{
  seen.push([value,expected]);if(value===first)await new Promise(ok=>release=ok);
 }});
 const auto=installSculptWorldAutosaveV1({persistence,root,capture:()=>first});
 auto.schedule();const saving=auto.flush();await Promise.resolve();
 const moving=persistence.transition(async save=>{await save(second);});
 assert.equal(persistence.transitioning,true);
 release();await saving;await moving;
 assert.deepEqual(seen,[[first,base],[second,first]]);
 assert.equal(persistence.confirmed,second);assert.equal(persistence.flushOnUnload(second),false);
 auto.dispose();
});
