import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createImmersiveEncounterHostV1
} from '../src/encounters/immersive-encounter-host-v1.js';
import { saveCombatHandoff, attachCombatResult } from '../src/encounters/combat-handoff-store.js';

const origin='https://example.test';
function storage() {
 const data=new Map();
 return {
  getItem:k=>data.get(k)??null, setItem:(k,v)=>data.set(k,String(v)),
  removeItem:k=>data.delete(k)
 };
}
function fakeDom() {
 const listeners=new Map(), nodes=[];
 const win={location:{origin,href:origin+'/index.html'},addEventListener(type,fn){listeners.set(type,fn);},removeEventListener(type){listeners.delete(type);}};
 const doc={
   fullscreenElement:null,
   documentElement:{requestFullscreen(){doc.fullscreenElement=doc.documentElement;return Promise.resolve();}},
   body:{append(n){nodes.push(n);},removeChild(n){const i=nodes.indexOf(n);if(i>=0)nodes.splice(i,1);}},
   createElement(tag) {
    const node={tagName:tag.toUpperCase(),dataset:{},style:{},children:[],
      setAttribute(n,v){this[n]=v;},append(child){this.children.push(child);},remove(){const i=nodes.indexOf(this);if(i>=0)nodes.splice(i,1);}};
    if(tag==='iframe')node.contentWindow={id:'combat-window'};
    return node;
   }
 };
 return {win,doc,nodes,listeners};
}
const snapshot={
 schema:'capture-encounter-snapshot-v1',version:1,
 encounterId:'e1',source:'terrain-random',
 player:{partyRef:'capture-party-preview'},
 opponents:[{creatureId:'crea_ombre_1'}],
 rules:{rulesetId:'capture.standard.1v1'},
 context:{areaId:'forest-exterior',terrainFamilyId:'forest',elementId:'shadow'},
 returnToken:'r1'
};
function save(storageRef) {
 saveCombatHandoff(storageRef,{snapshot,returnState:{areaId:'forest-exterior',x:45,y:67,returnUrl:origin+'/index.html?combatReturn=1'}});
}
function finish(storageRef) {
 const h=JSON.parse(storageRef.getItem('gensrpg.capture.combat-handoff.v1'));
 const next=attachCombatResult(h,{schema:'capture-combat-result-v1',version:1,encounterId:'e1',returnToken:'r1',outcome:'victory'});
 saveCombatHandoff(storageRef,next);
}
test('same-page immersive host opens actual Combat iframe and rejects forged completion',async()=>{
 const h=fakeDom(),store=storage(),completed=[];save(store);
 const host=createImmersiveEncounterHostV1({
   windowRef:h.win,documentRef:h.doc,storage:store,
   onCompleted: envelope=>{completed.push(envelope);return true;}
 });
 const url=origin+'/combat-preview/examples/dom-demo/exploration-encounter.html';
 assert.equal(host.open({url,snapshot}),true);
 assert.equal(h.nodes.length,1);
 assert.equal(h.nodes[0].children[0].tagName,'IFRAME');
 assert.equal(h.nodes[0].children[0].src,url);
 assert.equal(h.doc.fullscreenElement,h.doc.documentElement);
 const frame=h.nodes[0].children[0].contentWindow;
 const msg={type:'gensrpg.capture.combat-complete.v1',encounterId:'e1',returnToken:'r1'};
 const send=(source,originValue,payload)=>h.listeners.get('message')({source,origin:originValue,data:payload});
 send(frame,origin,msg); // no valid result yet
 assert.equal(completed.length,0);
 finish(store);
 send({},origin,msg);send(frame,'https://attacker.invalid',msg);
 send(frame,origin,{...msg,returnToken:'spoof'});
 assert.equal(completed.length,0);
 send(frame,origin,msg);
 assert.equal(completed.length,1);
 assert.equal(completed[0].returnState.x,45);
 assert.equal(h.nodes.length,0);
 assert.equal(store.getItem('gensrpg.capture.combat-handoff.v1'),null);
 // A new encounter can immediately launch without replacing this document.
 save(store);
 assert.equal(host.open({url,snapshot}),true);
 assert.equal(h.nodes.length,1);
 host.dispose();
 assert.equal(h.nodes.length,0);
});
test('immersion never navigates to a foreign origin or takes over an already running Encounter',()=>{
 const h=fakeDom(),store=storage();save(store);
 const host=createImmersiveEncounterHostV1({windowRef:h.win,documentRef:h.doc,storage:store,onCompleted:()=>true});
 assert.throws(()=>host.open({url:'https://other.invalid/combat-preview/encounter.html',snapshot}),/origin/);
 assert.equal(host.open({url:origin+'/combat-preview/examples/dom-demo/exploration-encounter.html',snapshot}),true);
 assert.equal(host.open({url:origin+'/combat-preview/examples/dom-demo/exploration-encounter.html',snapshot}),false);
 host.dispose();
});

test('real AdventureSession CombatResult stays pending until the GenSRPG Core receipt proves persistence',()=>{
 const h=fakeDom(),store=storage();
 const scoped={...snapshot,player:{partyRef:'adventure-party:session-game-1'}};
 saveCombatHandoff(store,{snapshot:scoped,returnState:{
  areaId:'forest-exterior',x:45,y:67,
  returnUrl:origin+'/index.html?combatReturn=1'
 }});
 const saved=JSON.parse(store.getItem('gensrpg.capture.combat-handoff.v1'));
 const completed=attachCombatResult(saved,{
  schema:'capture-combat-result-v1',version:1,
  encounterId:'e1',returnToken:'r1',outcome:'victory',
  partyState:{activeCreatureId:'crea_ombre_1',hp:70}
 });
 saveCombatHandoff(store,completed);
 const raw=store.getItem('gensrpg.capture.combat-handoff.v1');
 let receipt=true,calls=0;
 const host=createImmersiveEncounterHostV1({
  windowRef:h.win,documentRef:h.doc,storage:store,
  onCompleted(){calls++;return receipt;}
 });
 const url=origin+'/combat-preview/examples/dom-demo/exploration-encounter.html';
 host.open({url,snapshot:scoped});
 const frame=h.nodes[0].children[0].contentWindow;
 const finish=()=>h.listeners.get('message')({source:frame,origin,
  data:{type:'gensrpg.capture.combat-complete.v1',encounterId:'e1',returnToken:'r1'}});
 for(const failedAck of [
  true,undefined,false,Promise.resolve({persisted:true}),
  {persisted:false,session:{sessionId:'session-game-1',processedEncounterKeys:['e1:r1']}},
  {persisted:true,session:{sessionId:'other-game',processedEncounterKeys:['e1:r1']}},
  {persisted:true,session:{sessionId:'session-game-1',processedEncounterKeys:[]}}
 ]){
  receipt=failedAck;
  finish();
  assert.equal(h.nodes.length,1,'unacknowledged battle stays in the iframe');
  assert.equal(store.getItem('gensrpg.capture.combat-handoff.v1'),raw,
   'pending CombatResult must not be consumed without its exact Core commit');
 }
 assert.equal(calls,7);
 receipt={persisted:true,applied:true,
  session:{sessionId:'session-game-1',processedEncounterKeys:['e1:r1']}};
 finish();
 assert.equal(h.nodes.length,0,'only a correlated Core receipt closes the battle');
 assert.equal(store.getItem('gensrpg.capture.combat-handoff.v1'),null);
 assert.equal(calls,8);
 host.dispose();
});

test('a scoped battle waits for the asynchronous Core receipt and handles only one in-flight completion',async()=>{
 const h=fakeDom(),store=storage(),sessionId='session-game-1';
 const scoped={...snapshot,player:{partyRef:'adventure-party:'+sessionId}};
 const saved=saveCombatHandoff(store,{snapshot:scoped,returnState:{
  areaId:'forest-exterior',x:45,y:67,returnUrl:origin+'/index.html?combatReturn=1'
 }},{sessionId});
 saveCombatHandoff(store,attachCombatResult(saved,{
  encounterId:'e1',returnToken:'r1',outcome:'fled'
 }),{sessionId});
 let resolveReceipt,calls=0,acknowledged=0;
 const pending=new Promise(resolve=>{resolveReceipt=resolve;});
 const host=createImmersiveEncounterHostV1({
  windowRef:h.win,documentRef:h.doc,storage:store,sessionId,
  onCompleted(){calls++;return pending;},
  onAcknowledged(){acknowledged++;}
 });
 host.open({url:origin+'/combat-preview/examples/dom-demo/exploration-encounter.html',snapshot:scoped});
 const frame=h.nodes[0].children[0].contentWindow;
 const message={source:frame,origin,data:{type:'gensrpg.capture.combat-complete.v1',encounterId:'e1',returnToken:'r1'}};
 h.listeners.get('message')(message);
 h.listeners.get('message')(message);
 assert.equal(calls,1);
 assert.equal(acknowledged,0);
 assert.equal(h.nodes.length,1);
 resolveReceipt({persisted:true,session:{sessionId,processedEncounterKeys:['e1:r1']}});
 await pending;
 assert.equal(acknowledged,1);
 assert.equal(h.nodes.length,0);
 assert.equal(store.getItem('gensrpg.capture.combat-handoff.v1:'+sessionId),null);
 host.dispose();
});

test('embedded Capture stays fullscreen owner through Combat completion; standalone Tester still can fullscreen',()=>{
 const play=fakeDom(),store=storage();let requestCount=0;
 play.win.frameElement={id:'capture-owned-adventure-play-frame'};
 play.doc.documentElement.requestFullscreen=()=>{requestCount++;return Promise.resolve();};
 const sessionId='session-game-1',scoped={...snapshot,player:{partyRef:'adventure-party:'+sessionId}};
 const saved=saveCombatHandoff(store,{snapshot:scoped,returnState:{
  areaId:'forest-exterior',x:45,y:67,returnUrl:origin+'/index.html?combatReturn=1'
 }},{sessionId});
 saveCombatHandoff(store,attachCombatResult(saved,{
  encounterId:'e1',returnToken:'r1',outcome:'victory'
 }),{sessionId});
 const playHost=createImmersiveEncounterHostV1({
  windowRef:play.win,documentRef:play.doc,storage:store,sessionId,
  onCompleted:()=>({persisted:true,session:{sessionId,processedEncounterKeys:['e1:r1']}})
 });
 const url=origin+'/combat-preview/examples/dom-demo/exploration-encounter.html';
 assert.equal(playHost.open({url,snapshot:scoped}),true);
 assert.equal(play.nodes.length,1,'Combat still uses the official native iframe');
 assert.equal(requestCount,0,'embedded battle must not take fullscreen away from Capture');
 assert.equal(play.doc.fullscreenElement,null,'Capture parent remains sole fullscreen document');
 const frame=play.nodes[0].children[0].contentWindow;
 play.listeners.get('message')({source:frame,origin,data:{
  type:'gensrpg.capture.combat-complete.v1',encounterId:'e1',returnToken:'r1'
 }});
 assert.equal(play.nodes.length,0,'Combat overlay is closed after the official Core receipt');
 assert.equal(requestCount,0,'return to exploration must not trigger a new child fullscreen');
 playHost.dispose();
 const standalone=fakeDom();
 const tester=createImmersiveEncounterHostV1({
  windowRef:standalone.win,documentRef:standalone.doc,storage:storage(),onCompleted:()=>true
 });
 assert.equal(tester.open({url,snapshot}),true);
 assert.equal(standalone.doc.fullscreenElement,standalone.doc.documentElement,
  'standalone Tester preserves its native fullscreen behavior');
 tester.dispose();
});

test('the native embedded combat overlay reports only visibility to its exact Capture parent',()=>{
 const h=fakeDom(),store=storage(),calls=[];
 h.win.frameElement={id:'adventure-play-frame'};
 h.win.parent={postMessage(payload,target){calls.push({payload,target});}};
 const sessionId='adventure-session-1';
 const host=createImmersiveEncounterHostV1({
  windowRef:h.win,documentRef:h.doc,storage:store,sessionId,onCompleted:()=>true
 });
 const url=origin+'/combat-preview/examples/dom-demo/exploration-encounter.html';
 assert.equal(host.open({url,snapshot}),true);
 assert.deepEqual(calls,[{
  payload:{schema:'gensrpg.exploration.combat.visibility.v1',
   sessionId,encounterId:snapshot.encounterId,visible:true},
  target:origin
 }]);
 assert.equal(host.open({url,snapshot}),false,'duplicate opens cannot repeat the signal');
 assert.equal(calls.length,1);
 assert.equal(host.close(),true,'explicitly cancelled battle restores Capture commands');
 assert.deepEqual(calls[1],{
  payload:{schema:'gensrpg.exploration.combat.visibility.v1',
   sessionId,encounterId:snapshot.encounterId,visible:false},
  target:origin
 });
 assert.equal(host.close(),false);
 assert.equal(calls.length,2,'no signal on an already closed overlay');
 host.dispose();
 assert.equal(calls.length,2);
});

test('standalone editor combat never toggles Capture HUD',()=>{
 const h=fakeDom(),calls=[],store=storage();
 h.win.parent={postMessage(payload){calls.push(payload)}};
 const host=createImmersiveEncounterHostV1({
  windowRef:h.win,documentRef:h.doc,storage:store,onCompleted:()=>true
 });
 host.open({url:origin+'/combat-preview/examples/dom-demo/exploration-encounter.html',snapshot});
 host.close();host.dispose();
 assert.equal(calls.length,0);
});
