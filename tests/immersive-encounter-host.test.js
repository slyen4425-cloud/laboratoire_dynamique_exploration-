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
