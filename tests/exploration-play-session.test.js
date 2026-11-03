import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {
  EXPLORATION_PLAY_NAV_KEY,createNewExplorationPlay,
  readExplorationPlay,saveExplorationPlayPosition,
  createExplorationPlayProgressWriter,explorationPlayNavigationKey,playWorldFingerprint
} from '../src/play/exploration-play-session.js';

const world=()=>createBlankWorldBuilderDraft({id:'aventure-test',width:36*28,height:24*21});
const store=()=>{
 const items=new Map();
 return {getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,v),
   removeItem:k=>items.delete(k),snapshot:()=>new Map(items)};
};

test('New game starts at authoritative initial WorldDocument Spawn, without writing the document',()=>{
 const doc=world(),before=JSON.stringify(doc),storage=store();
 const state=createNewExplorationPlay(storage,doc);
 assert.equal(state.schema,'gensrpg.exploration.play-navigation.v1');
 assert.equal(state.currentAreaId,doc.initialAreaId);
 assert.deepEqual([state.x,state.y],[doc.areas[0].spawns[0].x,doc.areas[0].spawns[0].y]);
 assert.equal(storage.getItem(EXPLORATION_PLAY_NAV_KEY)!==null,true);
 assert.equal(JSON.stringify(doc),before);
 assert.equal(readExplorationPlay(storage,doc).currentAreaId,state.currentAreaId);
});

test('Continue resumes exact real-world coordinates and refuses invalid destinations',()=>{
 const doc=world(),s=store();
 createNewExplorationPlay(s,doc);
 saveExplorationPlayPosition(s,doc,{currentAreaId:doc.initialAreaId,x:300,y:200});
 assert.deepEqual([readExplorationPlay(s,doc).x,readExplorationPlay(s,doc).y],[300,200]);
 assert.throws(()=>saveExplorationPlayPosition(s,doc,{currentAreaId:'fantom',x:300,y:200}),/WorldArea/);
 assert.throws(()=>saveExplorationPlayPosition(s,doc,{currentAreaId:doc.initialAreaId,x:-10,y:1}),/position/i);
});

test('No invisible demo world, no import of wrong save, no partial overwrite on invalid world',()=>{
 const storage=store(),doc=world();
 assert.equal(readExplorationPlay(storage,doc),null);
 assert.throws(()=>createNewExplorationPlay(storage,null),/WorldDocument/);
 assert.equal(storage.getItem(EXPLORATION_PLAY_NAV_KEY),null);
 createNewExplorationPlay(storage,doc);
 const changed={...doc,areas:doc.areas.map(a=>({...a,label:'Changement'}))};
 assert.notEqual(playWorldFingerprint(changed),playWorldFingerprint(doc));
 assert.throws(()=>readExplorationPlay(storage,changed),/modifié/);
 assert.equal(JSON.parse(storage.getItem(EXPLORATION_PLAY_NAV_KEY)).worldId,doc.id);
});

test('Play checkpoint is only navigation progress, never a duplicate WorldDocument or Combat save',()=>{
 const storage=store(),doc=world(),before=JSON.stringify(doc);
 const saved=createNewExplorationPlay(storage,doc);
 assert.deepEqual(Object.keys(saved).sort(),['currentAreaId','schema','version','worldFingerprint','worldId','x','y'].sort());
 assert.equal('areas' in saved,false);
 assert.equal('xp' in saved,false);
 assert.equal('creatures' in saved,false);
 assert.equal(JSON.stringify(doc),before);
 assert.equal(storage.snapshot().size,1);
});

test('GenSRPG session identity isolates real navigational checkpoints, never replacing standalone Jouer',()=>{
 const doc=world(),storage=store(),before=JSON.stringify(doc);
 const legacy=createNewExplorationPlay(storage,doc);
 const a={sessionId:'adventure-a'},b={sessionId:'adventure-b'};
 const first=createNewExplorationPlay(storage,doc,a);
 const second=createNewExplorationPlay(storage,doc,b);
 assert.equal(first.sessionId,'adventure-a');
 assert.equal(second.sessionId,'adventure-b');
 assert.equal(explorationPlayNavigationKey(),EXPLORATION_PLAY_NAV_KEY);
 assert.equal(explorationPlayNavigationKey('adventure-a'),EXPLORATION_PLAY_NAV_KEY+':adventure-a');
 assert.equal(storage.snapshot().size,3);
 saveExplorationPlayPosition(storage,doc,{currentAreaId:doc.initialAreaId,x:220,y:230},a);
 saveExplorationPlayPosition(storage,doc,{currentAreaId:doc.initialAreaId,x:330,y:340},b);
 assert.deepEqual([readExplorationPlay(storage,doc,a).x,readExplorationPlay(storage,doc,a).y],[220,230]);
 assert.deepEqual([readExplorationPlay(storage,doc,b).x,readExplorationPlay(storage,doc,b).y],[330,340]);
 assert.deepEqual(readExplorationPlay(storage,doc),legacy);
 assert.equal(JSON.stringify(doc),before);
});

test('GenSRPG scoped writer preserves the one official WorldDocument and refuses a mismatched session',()=>{
 const doc=world(),storage=store(),a={sessionId:'adventure-A'},b={sessionId:'adventure-B'};
 createNewExplorationPlay(storage,doc,a);
 createNewExplorationPlay(storage,doc,b);
 const write=createExplorationPlayProgressWriter(storage,doc,a);
 write({currentAreaId:doc.initialAreaId,x:151,y:152});
 assert.equal(readExplorationPlay(storage,doc,a).x,151);
 assert.notEqual(readExplorationPlay(storage,doc,b).x,151);
 const aKey=explorationPlayNavigationKey(a.sessionId);
 const bKey=explorationPlayNavigationKey(b.sessionId);
 storage.setItem(bKey,storage.getItem(aKey));
 assert.throws(()=>readExplorationPlay(storage,doc,b),/session/i);
 assert.equal(readExplorationPlay(storage,doc,a).x,151);
});

test('GenSRPG navigation session identifiers are safe and never silently fall back to legacy save',()=>{
 const doc=world(),storage=store();
 createNewExplorationPlay(storage,doc);
 for(const bad of ['', ' ', '../escape', 'with/slash', 'x?mode=1', 'a'.repeat(131), null]){
  assert.throws(()=>explorationPlayNavigationKey(bad),/session/i);
  assert.throws(()=>readExplorationPlay(storage,doc,{sessionId:bad}),/session/i);
 }
 assert.equal(readExplorationPlay(storage,doc,{sessionId:'uninitialized'}),null);
 assert.ok(readExplorationPlay(storage,doc),'standalone save remains intact');
});
