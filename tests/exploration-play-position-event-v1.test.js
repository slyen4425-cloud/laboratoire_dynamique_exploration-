import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {createNewExplorationPlay,createExplorationPlayProgressWriter,readExplorationPlay}
 from '../src/play/exploration-play-session.js';
import {EXPLORATION_PLAY_NAVIGATION_COMMITTED_EVENT_V1,
 emitExplorationPlayNavigationCommittedV1} from '../src/play/exploration-play-events-v1.js';

const world=()=>createBlankWorldBuilderDraft({id:'capture-peer-world',width:36*28,height:24*21});
function storage(){
 const values=new Map();
 return {getItem:key=>values.get(key)??null,
  setItem:(key,value)=>values.set(key,value),size:()=>values.size};
}
class FakeCustomEvent{
 constructor(type,{detail}={}){this.type=type;this.detail=detail;}
}
function host(){
 const events=[];
 return {events,CustomEvent:FakeCustomEvent,
  dispatchEvent:event=>{events.push(event);return true;}};
}
test('event is the exact frozen navigation returned by the only authoritative Exploration writer',()=>{
 const doc=world(),db=storage(),scope={sessionId:'capture-actor-A'};
 createNewExplorationPlay(db,doc,scope);
 const committed=createExplorationPlayProgressWriter(db,doc,scope)({
  currentAreaId:doc.initialAreaId,x:200,y:225
 });
 assert.equal(committed.sessionId,scope.sessionId);
 const before=db.size(),target=host();
 assert.equal(emitExplorationPlayNavigationCommittedV1({
  target,navigation:committed
 }),true);
 assert.equal(target.events.length,1);
 assert.equal(target.events[0].type,EXPLORATION_PLAY_NAVIGATION_COMMITTED_EVENT_V1);
 assert.strictEqual(target.events[0].detail.navigation,committed);
 assert.deepEqual([target.events[0].detail.navigation.x,target.events[0].detail.navigation.y],[200,225]);
 assert.ok(Object.isFrozen(target.events[0].detail));
 assert.equal(db.size(),before);
 assert.equal(readExplorationPlay(db,doc,scope).x,200);
});
test('standalone playing and malformed or uncommitted data never become multiplayer events',()=>{
 const doc=world(),db=storage(),target=host();
 const standalone=createNewExplorationPlay(db,doc);
 assert.equal(emitExplorationPlayNavigationCommittedV1({
  target,navigation:standalone
 }),false);
 const scoped=createNewExplorationPlay(db,doc,{sessionId:'capture-actor-A'});
 assert.equal(emitExplorationPlayNavigationCommittedV1({
  target,navigation:{...scoped,inventory:{gold:10}}
 }),false);
 assert.equal(emitExplorationPlayNavigationCommittedV1({
  target,navigation:{...scoped,x:-999}
 }),false);
 assert.equal(emitExplorationPlayNavigationCommittedV1({
  target,navigation:null
 }),false);
 assert.equal(target.events.length,0);
});
test('real Sculpt play owner notifies only AFTER canonical checkpoint writer succeeds',()=>{
 const path=new URL('../src/sculpt-lab-main.js',import.meta.url);
 const s=readFileSync(path,'utf8');
 assert.match(s,/emitExplorationPlayNavigationCommittedV1/);
 const fn=s.slice(s.indexOf('function persistPlayNavigationCheckpoint()'),s.indexOf('async function installScopedSculptEncounters('));
 const save=fn.indexOf('const committed=playPositionWriter(');
 const emit=fn.indexOf('emitExplorationPlayNavigationCommittedV1(');
 assert.ok(save>=0&&emit>save,'only post-save position may be emitted');
 assert.match(fn,/return true;/);
 assert.ok(!fn.includes('setInterval('));
 assert.ok(!fn.includes('Storage.prototype'));
 assert.ok(!fn.includes('postMessage('));
});
