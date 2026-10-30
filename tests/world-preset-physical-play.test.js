import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft,addWorldArea} from '../src/builder/world-builder-draft.js';
import {makePlayableZoneRoute} from '../src/builder/sculpt-playable-zone-route.js';
import {createWorldAreaFromSculptMapPreset} from '../src/builder/sculpt-map-preset-library.js';
import {builtinSculptMapPresets} from '../src/builder/sculpt-builtin-map-presets.js';
import {sculptWorldAreaScene} from '../src/builder/sculpt-world-area-link.js';
import {findTriggeredPortal,applyPortalTransition} from '../src/world/portal-model.js';
import {stepMovement} from '../src/core/movement.js';
import {sculptPreviewCollisionCatalog} from '../src/core/sculpt-preview-object-collisions.js';
import {sculptTerrainRampProjections} from '../src/world/sculpt-height-model.js';
import {createEncounterController} from '../src/encounters/encounter-controller.js';
import {createCaptureCreatureCatalogProvider} from '../src/capture/capture-creature-catalog-provider.js';
import {CAPTURE_CREATURE_CATALOG_PREVIEW_V1} from '../src/capture/capture-creature-catalog-preview-v1.js';

function walkPrefabArea(doc,area,expectEncounter){
 const scene=sculptWorldAreaScene(area);
 const terrain=scene.terrain;
 const world={width:area.width,height:area.height,objects:scene.objects,
   obstacles:[],boundary:area.boundary,walls:area.walls??[]};
 const context={objectCatalog:sculptPreviewCollisionCatalog,sculptNavigation:{
   terrain,cellWidth:28,cellHeight:21,projectionRise:18,maxStepUp:0,maxStepDown:0,
   shoreEntryFraction:.14,bridges:[],stairs:sculptTerrainRampProjections(terrain)
 }};
 const actor={x:area.spawns[0].x,y:area.spawns[0].y,radius:5,
   locomotion:{modes:['ground']},facingX:1,moving:false};
 const exit=doc.portals.find(p=>p.sourceAreaId===area.id&&p.trigger?.kind==='point'&&
    doc.areas.some(t=>t.id===p.targetAreaId&&t.kind==='exterior'));
 assert.ok(exit,'prefab must have an outside exit');
 const catalog=createCaptureCreatureCatalogProvider(CAPTURE_CREATURE_CATALOG_PREVIEW_V1);
 const encounters=createEncounterController({checkDistance:160});
 const inputs=()=>({
   area,player:{currentAreaId:area.id,x:actor.x,y:actor.y},
   encounterConfig:doc.encounterConfig,captureCatalog:catalog,
   playerPartyRef:'capture-party-player-v1',rulesetId:'capture.standard.1v1',random:()=>0
 });
 encounters.step(inputs());let encounter=null;
 const road=area.surface.routes[0].points;
 const targets=[...road.slice(1,-1),exit.trigger];
 for(const target of targets){
   for(let n=0;n<550;n++){
     const dx=target.x-actor.x,dy=target.y-actor.y;
     const dist=Math.hypot(dx,dy);
     if(dist<=12)break;
     const before={x:actor.x,y:actor.y};
     stepMovement(world,actor,{x:dx/dist,y:dy/dist},Math.min(.035,dist/210),
       {maxSpeed:210},undefined,context);
     const actual=Math.hypot(actor.x-before.x,actor.y-before.y);
     assert.ok(actual>0.01,'Collision blocked prefab route before reaching '+target.x+','+target.y+
       ' from '+JSON.stringify(before)+' in '+area.label);
     if(!encounter)encounter=encounters.step(inputs());
     else encounters.step(inputs());
     if(n===549)assert.fail('Cannot walk native prefab road towards exit: '+area.label);
   }
 }
 assert.ok(Math.hypot(actor.x-exit.trigger.x,actor.y-exit.trigger.y)<22,
   'Player cannot reach the actual unchanged Portal in '+area.label);
 if(expectEncounter)assert.ok(encounter?.opponentCreatureId,
   'No Capture encounter from actual collision-checked movement on '+area.label);
 const portal=findTriggeredPortal(doc,area.id,actor);
 assert.ok(portal,'Real avatar has not entered a Portal hitbox: '+area.label);
 const transition=applyPortalTransition(doc,{currentAreaId:area.id,x:actor.x,y:actor.y},portal);
 assert.ok(transition,'Portal transition not possible after physical walking');
 return transition;
}

test('the actual preset forest->snow and snow->forest roads can be walked from Spawn to Portal with a Capture encounter',()=>{
 const start=createBlankWorldBuilderDraft({id:'physical-journey',width:2400,height:1600});
 const first=createWorldAreaFromSculptMapPreset(start,builtinSculptMapPresets()[1],{
   name:'Forêt profonde',hostAreaId:null});
 const forest=first.areas.find(a=>a.label==='Forêt profonde');
 const doc=createWorldAreaFromSculptMapPreset(first,builtinSculptMapPresets()[3],{
   name:'Neige et sapins',hostAreaId:forest.id});
 const snow=doc.areas.find(a=>a.label==='Neige et sapins');
 const arrival=walkPrefabArea(doc,forest,true);
 assert.equal(arrival.currentAreaId,snow.id);
 assert.equal(arrival.x,snow.spawns[0].x);
 const back=walkPrefabArea(doc,snow,true);
 assert.equal(back.currentAreaId,forest.id);
});


test('the reported 3-zone legacy world (2400x1600, Ile blank, Foret preset) truly walks Foret -> Ile -> Foret after explicit repair',()=>{
 const legacy=createBlankWorldBuilderDraft({id:'old-3-zone-world',width:2400,height:1600});
 const islandDoc=addWorldArea(legacy,{name:'Ile',kind:'exterior',width:36*28,height:24*21});
 const forestDoc=createWorldAreaFromSculptMapPreset(islandDoc,builtinSculptMapPresets()[1],{
   name:'Forêt profonde · sentier des anciens',hostAreaId:legacy.initialAreaId
 });
 const forest=forestDoc.areas.find(a=>a.label==='Forêt profonde · sentier des anciens');
 const island=forestDoc.areas.find(a=>a.label==='Ile');
 assert.ok(forest&&island);
 const fixed=makePlayableZoneRoute(forestDoc,{
   selectedAreaId:forest.id,initializeEncounters:true
 }).document;
 assert.equal(fixed.areas.find(a=>a.id===legacy.initialAreaId).width,2400);
 assert.equal(fixed.initialAreaId,forest.id);
 const first=walkPrefabArea(fixed,fixed.areas.find(a=>a.id===forest.id),true);
 assert.equal(first.currentAreaId,island.id);
 const flat=fixed.areas.find(a=>a.id===island.id);
 const scene=sculptWorldAreaScene(flat);
 const gate=fixed.portals.find(p=>p.sourceAreaId===island.id&&p.targetAreaId===forest.id);
 assert.ok(gate,'Blank Island must have a real reciprocal exit to Forest');
 const world={width:flat.width,height:flat.height,objects:scene.objects,
   obstacles:[],boundary:flat.boundary,walls:flat.walls??[]};
 const context={objectCatalog:sculptPreviewCollisionCatalog,sculptNavigation:{
   terrain:scene.terrain,cellWidth:28,cellHeight:21,projectionRise:18,
   maxStepUp:0,maxStepDown:0,shoreEntryFraction:.14,bridges:[],stairs:[]}};
 const actor={x:flat.spawns[0].x,y:flat.spawns[0].y,radius:5,
   locomotion:{modes:['ground']},facingX:1,moving:false};
 let reached=false;
 for(let n=0;n<400;n++){
   const dx=gate.trigger.x-actor.x,dy=gate.trigger.y-actor.y;
   const distance=Math.hypot(dx,dy);
   if(distance<=12){reached=true;break;}
   const prior={x:actor.x,y:actor.y};
   stepMovement(world,actor,{x:dx/distance,y:dy/distance},Math.min(.035,distance/210),
     {maxSpeed:210},undefined,context);
   assert.ok(Math.hypot(actor.x-prior.x,actor.y-prior.y)>.01,
     'Blank Island has a blocked route back to Forest');
 }
 assert.ok(reached,'Island reciprocal exit is not reachable from the actual Spawn');
 const actual=findTriggeredPortal(fixed,island.id,actor);
 assert.equal(actual?.id,gate.id);
 const back=applyPortalTransition(fixed,{
   currentAreaId:island.id,x:actor.x,y:actor.y
 },actual);
 assert.equal(back?.currentAreaId,forest.id);
});
