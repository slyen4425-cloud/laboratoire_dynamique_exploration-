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
