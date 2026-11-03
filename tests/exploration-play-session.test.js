import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft,addWorldArea} from '../src/builder/world-builder-draft.js';
import {
  EXPLORATION_PLAY_NAV_KEY,createNewExplorationPlay,
  readExplorationPlay,saveExplorationPlayPosition,
  playWorldFingerprint
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
 const changed={...doc,areas:doc.areas.map(a=>({...a,label:'Changement'})};
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
