import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlankWorldBuilderDraft,addWorldArea,connectWorldAreas,updatePortal,
  serializeWorldBuilderDraft,importWorldBuilderDocument
} from '../src/builder/world-builder-draft.js';
import {markersForSculptWorldArea} from '../src/builder/sculpt-world-portal-markers.js';
import {setSculptWorldPortalLabel} from '../src/builder/sculpt-world-area-link.js';
import {findTriggeredPortal,applyPortalTransition} from '../src/world/portal-model.js';
import {readFileSync} from 'node:fs';

function linkedWorld(){
  let world=createBlankWorldBuilderDraft({id:'monde-test',width:36*28,height:24*21});
  world=addWorldArea(world,{name:'Crypte du vent',kind:'dungeon'});
  world=connectWorldAreas(world,{
    sourceAreaId:world.areas[0].id,targetAreaId:world.areas[1].id,returnPortal:true
  });
  return world;
}
test('markers expose exact exit Portal trigger AND incoming destination Spawn without a second geometry',()=>{
  const world=linkedWorld(),host=world.areas[0],dungeon=world.areas[1];
  const outbound=world.portals.find(p=>p.sourceAreaId===host.id);
  const incoming=world.portals.find(p=>p.targetAreaId===host.id);
  const markers=markersForSculptWorldArea(world,host.id,{selectedPortalId:outbound.id});
  const exit=markers.find(m=>m.kind==='exit'&&m.portalId===outbound.id);
  assert.deepEqual({x:exit.x,y:exit.y,radius:exit.radius},
    {x:outbound.trigger.x,y:outbound.trigger.y,radius:outbound.trigger.radius});
  assert.equal(exit.label,dungeon.label);
  assert.equal(exit.selected,true);
  const arrival=markers.find(m=>m.kind==='arrival'&&m.spawnId===incoming.targetSpawnId);
  assert.deepEqual({x:arrival.x,y:arrival.y},
    {x:host.spawns[0].x,y:host.spawns[0].y});
  assert.equal(markers.filter(m=>m.kind==='arrival').length,1);
  assert.equal(arrival.isInitial,true,'initial Spawn is marked without duplicating the same location');
  const testing=markersForSculptWorldArea(world,host.id,{testing:true});
  assert.equal(testing.some(m=>m.kind==='arrival'||m.kind==='start'),false);
  assert.equal(testing.filter(m=>m.kind==='exit').length,1);
});
test('editing the visible exit label updates only Portal.visual.label and survives JSON roundtrip',()=>{
  let world=linkedWorld(),outbound=world.portals[0];
  const oldTrigger=outbound.trigger;
  world=setSculptWorldPortalLabel(world,outbound.id,'  Entrée de la crypte  ');
  const updated=world.portals.find(p=>p.id===outbound.id);
  assert.equal(updated.visual.label,'Entrée de la crypte');
  assert.deepEqual(updated.trigger,oldTrigger);
  const persisted=importWorldBuilderDocument(serializeWorldBuilderDraft(world));
  assert.equal(markersForSculptWorldArea(persisted,persisted.areas[0].id)
    .find(m=>m.portalId===outbound.id).label,'Entrée de la crypte');
  const crossed=findTriggeredPortal(persisted,persisted.areas[0].id,{
    x:updated.trigger.x,y:updated.trigger.y
  });
  assert.equal(crossed.id,outbound.id);
  assert.equal(applyPortalTransition(persisted,{
    currentAreaId:persisted.areas[0].id
  },crossed).currentAreaId,persisted.areas[1].id);
});
test('several arrivals to the same canonical Spawn paint one marker; hidden/disabled exits do not paint',()=>{
  let world=linkedWorld();
  world=addWorldArea(world,{name:'Colline',kind:'exterior'});
  world=connectWorldAreas(world,{sourceAreaId:world.areas[2].id,
    targetAreaId:world.areas[0].id});
  const host=world.areas[0];
  assert.equal(markersForSculptWorldArea(world,host.id).filter(m=>m.kind==='arrival').length,1);
  const out=world.portals.find(p=>p.sourceAreaId===host.id);
  world=updatePortal(world,out.id,p=>{p.visual.visible=false;});
  assert.equal(markersForSculptWorldArea(world,host.id).filter(m=>m.kind==='exit').length,0);
  assert.equal(findTriggeredPortal(world,host.id,{x:out.trigger.x,y:out.trigger.y})?.id,out.id,
    'presentation must never change Portal collision/transition');
});
test('2.5D editor offers an actual arrival marker and editable Portal label instead of anonymous arrows',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(html,/id="world-area-portal-label"/);
  assert.match(html,/id="world-area-portal-label-save"/);
  assert.match(main,/markersForSculptWorldArea\(/);
  assert.match(main,/setSculptWorldPortalLabel\(/);
  assert.match(main,/SORTIE|sortie/);
  assert.match(main,/ARRIVÉE|arrivée/);
  assert.match(main,/approche.*Entrer|rejoins.*Entrer/i);
});
