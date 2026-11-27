import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorldAuthoringAccessV1} from '../src/storage/world-document-authoring-access-v1.js';
import {createBlankWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {WORLD_ASSEMBLER_HANDOFF_KEY as handoffKey} from '../src/builder/world-assembler-handoff.js';

function memoryStorage(){
 const map=new Map();
 return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)};
}
function setup(){
 const document=createBlankWorldBuilderDraft({id:'Monde_alpha'});
 const areaId=document.areas[0].id,sessionStorage=memoryStorage();
 const payload=revision=>JSON.stringify({schemaVersion:2,worldId:document.id,areaId,revision});
 let resolveRead;
 const store={read:()=>new Promise(resolve=>{resolveRead=resolve;})};
 const access=createWorldAuthoringAccessV1({storage:memoryStorage(),sessionStorage,owner:{},store});
 return {access,document,areaId,sessionStorage,payload,finishRead:async revision=>{
  await Promise.resolve();resolveRead({document,revision});
 }};
}
test('an older durable handoff reader cannot consume a newer navigation reference',async()=>{
 const {access,sessionStorage,payload,finishRead}=setup();
 sessionStorage.setItem(handoffKey,payload(1));
 const pending=access.readHandoff();
 sessionStorage.setItem(handoffKey,payload(2));
 await finishRead(1);
 await assert.rejects(pending,/nouveau transfert conservé/);
 assert.equal(sessionStorage.getItem(handoffKey),payload(2));
});
test('an older durable handoff writer cannot overwrite a newer navigation reference',async()=>{
 const {access,document,areaId,sessionStorage,payload,finishRead}=setup();
 const pending=access.writeHandoff(document,areaId);
 sessionStorage.setItem(handoffKey,payload(2));
 await finishRead(1);
 await assert.rejects(pending,/aucun transfert écrasé/);
 assert.equal(sessionStorage.getItem(handoffKey),payload(2));
});
test('an unchanged durable handoff still writes and is consumed exactly once',async()=>{
 const {access,document,areaId,sessionStorage,payload,finishRead}=setup();
 const writing=access.writeHandoff(document,areaId);
 await finishRead(1);await writing;
 assert.equal(sessionStorage.getItem(handoffKey),payload(1));
 const reading=access.readHandoff();await finishRead(1);
 assert.equal((await reading).areaId,areaId);
 assert.equal(sessionStorage.getItem(handoffKey),null);
 assert.equal(await access.readHandoff(),null);
});

// A durable Capture bridge delegates every explicit project command through
// one native transaction; it never invokes the legacy storage.
test('universe provisioning and archive commands are routed through one durable owner',async()=>{
 const calls=[],result={id:'world-test1234'};
 const native=Object.fromEntries(['list','load','createBlank','addBlank','copy','save','activate'].map(name=>[name,(...args)=>{calls.push([name,...args]);return result;}]));
 let transactions=0;
 const forbidden=new Proxy({}, {get(){throw Error('Legacy storage accessed');}});
 const access=createWorldAuthoringAccessV1({storage:forbidden,sessionStorage:memoryStorage(),owner:{async run(command){transactions++;return command({projects:native});}},store:{}});
 const id='unv_test1234',target='unv_other1234',options={width:2400,height:1600};
 await access.projects.list(id);
 await access.projects.createBlank(id,options);
 await access.projects.load(id,result.id);
 await access.projects.addBlank(id,options);
 await access.projects.copy({fromWorldId:result.id,toProjectId:target,confirmed:true});
 await access.projects.save(id,result);
 await access.projects.activate(id,result.id);
 assert.equal(transactions,7);
 assert.deepEqual(calls,[['list',id],['createBlank',id,options],['load',id,result.id],['addBlank',id,options],['copy',{fromWorldId:result.id,toProjectId:target,confirmed:true}],['save',id,result],['activate',id,result.id]]);
 const scoped=createWorldAuthoringAccessV1({storage:forbidden,sessionStorage:memoryStorage(),universeId:id,owner:{run(){throw Error('unused');}},store:{}});
 assert.equal(scoped.projects,undefined);
});
