import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {describeWorldAreaSpawnsForEditorV1} from '../src/builder/sculpt-world-spawn-controls-v1.js';
import {createBlankWorldBuilderDraft,addWorldArea,connectWorldAreas}
 from '../src/builder/world-builder-draft.js';
import {findTriggeredPortal,applyPortalTransition} from '../src/world/portal-model.js';
import {createNewExplorationPlay,createExplorationPlayProgressWriter,readExplorationPlay}
 from '../src/play/exploration-play-session.js';
function linked(){
 let w=createBlankWorldBuilderDraft({id:'zone-linked',width:36*28,height:24*21});
 w=addWorldArea(w,{name:'Village',kind:'exterior',width:36*28,height:24*21});
 return connectWorldAreas(w,{sourceAreaId:w.initialAreaId,targetAreaId:w.areas[1].id,returnPortal:true});
}
test('every official Spawn is listed: start, arrival and building-door anchored',()=>{
 const w=linked(),area=w.areas[0];
 const official={...w,areas:[{...area,spawns:[
  {id:'spawn-start',x:80,y:80},
  {id:'spawn-arrival',x:240,y:100},
  {id:'spawn-door',anchor:{kind:'building-door',objectId:'home',anchorId:'front',offset:56}}
 ]},...w.areas.slice(1)],initialSpawnId:'spawn-start'};
 const options=describeWorldAreaSpawnsForEditorV1(official,area.id);
 assert.equal(options.length,3);
 assert.deepEqual(options.map(x=>x.id),['spawn-start','spawn-arrival','spawn-door']);
 assert.equal(options[0].initial,true);
 assert.equal(options[0].editable,true);
 assert.equal(options[2].editable,false,'door anchoring belongs to the building owner');
 assert.equal(options[2].point,null,'a missing original door must not synthesize a coordinate');
});
test('real scoped Play checkpoint can cross a canonical two-way Portal without rewriting the WorldDocument',()=>{
 const world=linked();
 const db=new Map(),storage={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,v)};
 const id='play-portal-test-1',scope={sessionId:id};
 const start=createNewExplorationPlay(storage,world,scope);
 const writer=createExplorationPlayProgressWriter(storage,world,scope);
 const first=world.portals.find(x=>x.sourceAreaId===start.currentAreaId);
 const entered=findTriggeredPortal(world,start.currentAreaId,{x:first.trigger.x,y:first.trigger.y});
 assert.equal(entered.id,first.id);
 const arrived=applyPortalTransition(world,start,entered);
 assert.equal(arrived.currentAreaId,first.targetAreaId);
 const committed=writer(arrived);
 assert.equal(readExplorationPlay(storage,world,scope).currentAreaId,first.targetAreaId);
 const reverse=world.portals.find(x=>x.sourceAreaId===committed.currentAreaId);
 const returned=applyPortalTransition(world,committed,
  findTriggeredPortal(world,committed.currentAreaId,{x:reverse.trigger.x,y:reverse.trigger.y}));
 writer(returned);
 assert.equal(readExplorationPlay(storage,world,scope).currentAreaId,start.currentAreaId);
 assert.equal(world.portals.length,2);
});
test('the 2.5D editor shows all 3 Spawn choices, with anchored door coordinates read-only',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 assert.match(main,/describeWorldAreaSpawnsForEditorV1/);
 assert.match(main,/spawnOption\.editable/);
 assert.match(html,/id="world-area-spawn-info"/);
 assert.match(main,/point de départ|Point de départ/i);
});
