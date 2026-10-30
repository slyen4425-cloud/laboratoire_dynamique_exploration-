import test from 'node:test';
import assert from 'node:assert/strict';
import {builtinSculptMapPresets} from '../src/builder/sculpt-builtin-map-presets.js';
import {importSculptPreviewScene,SCULPT_OBJECT_LIMIT} from '../src/world/sculpt-scene-preview.js';
import {sculptWaterAt} from '../src/world/sculpt-height-model.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {bridgeTraversalRect} from '../src/world/world-object-model.js';
import {sculptBridgeBankHeights} from '../src/core/sculpt-navigation-collision.js';
import {stepMovement} from '../src/core/movement.js';
import {sculptPreviewCollisionCatalog} from '../src/core/sculpt-preview-object-collisions.js';
import {sculptTerrainRampProjections} from '../src/world/sculpt-height-model.js';
import {createBlankWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {createWorldAreaFromSculptMapPreset} from '../src/builder/sculpt-map-preset-library.js';
import {resolvePortalTriggerPoint,findTriggeredPortal} from '../src/world/portal-model.js';

test('the eight villages and wilderness presets contain an actual varied 2.5D landscape, not isolated props',()=>{
 const presets=builtinSculptMapPresets();
 assert.equal(presets.length,8,'preserve saved preset IDs and user workflows');
 let houses=0,bridges=0,falls=0,wet=0,interiors=0;
 for(const [i,preset] of presets.entries()){
   const scene=importSculptPreviewScene(preset.scene);
   assert.ok(scene.objects.length<=SCULPT_OBJECT_LIMIT);
   const grouped={houses:[],bridges:[],falls:[]};
   for(const obj of scene.objects){
     if(obj.objectDefinitionId.startsWith('objectdef.building.'))grouped.houses.push(obj);
     if(obj.objectDefinitionId.startsWith('objectdef.bridge.'))grouped.bridges.push(obj);
     if(obj.objectDefinitionId.startsWith('objectdef.waterfall.'))grouped.falls.push(obj);
     const cx=Math.floor(obj.transform.x/28),cy=Math.floor(obj.transform.y/21);
     if(sculptWaterAt(scene.terrain,cx,cy)>0){
       assert.ok(obj.objectDefinitionId.startsWith('objectdef.bridge.')||
         obj.objectDefinitionId.startsWith('objectdef.waterfall.'),
         'only an authored crossing or water effect may be on water');
     }
   }
   for(const bridge of resolveWorldObjectPlacements(grouped.bridges)){
     const deck=bridgeTraversalRect(bridge);
     assert.ok(deck,'real physical bridge deck required');
     assert.ok(sculptBridgeBankHeights(scene.terrain,deck,
       {cellWidth:28,cellHeight:21}),
       preset.name+' bridge must have traversable shores on both sides');
     assert.ok(sculptWaterAt(scene.terrain,
       Math.floor(bridge.transform.x/28),Math.floor(bridge.transform.y/21))>0,
       preset.name+' bridge should cross authored water rather than dry ground');
   }
   const hasWater=scene.terrain.waterLevels.some((n,j)=>n>scene.terrain.levels[j]);
   wet+=Number(hasWater);
   houses+=grouped.houses.length;
   bridges+=grouped.bridges.length;
   falls+=grouped.falls.length;
   assert.ok(grouped.houses.length>=(i===1||i===7?1:3),
     preset.name+' should feel populated');
   assert.ok(scene.surface.routes.length>=1,preset.name+' needs a real path');
   const host=createBlankWorldBuilderDraft({id:'rich-'+i,width:1008,height:504});
   const doc=createWorldAreaFromSculptMapPreset(host,preset,{hostAreaId:host.initialAreaId});
   const area=doc.areas[1];
   const inside=doc.portals.filter(portal=>portal.sourceAreaId===area.id&&
     portal.trigger?.kind==='object-anchor');
   assert.equal(inside.length,grouped.houses.length,
     preset.name+' every actual house must have a separate returnable interior');
   interiors+=inside.length;
 }
 assert.ok(houses>=26,'multiple villages and hamlets, not one house per map');
 assert.ok(bridges>=5,'real bridge object assets on varied water layouts');
 assert.ok(falls>=4,'waterfalls must exist in actual scene objects');
 assert.ok(wet>=6,'lakes, ponds and streams in multiple biomes');
 assert.equal(interiors,houses);
});

test('every enriched main road remains physically walkable from the genuine Spawn to the actual Portal',()=>{
 for(const preset of builtinSculptMapPresets()){
   const host=createBlankWorldBuilderDraft({id:'path-'+preset.id,width:1008,height:504});
   const doc=createWorldAreaFromSculptMapPreset(host,preset,{
     hostAreaId:host.initialAreaId});
   const area=doc.areas[1];
   const scene=importSculptPreviewScene(preset.scene);
   const bridgeObjects=resolveWorldObjectPlacements(scene.objects).filter(x=>
     x.definition?.kind==='bridge'||x.objectDefinition?.kind==='bridge'||
     x.objectDefinitionId?.startsWith('objectdef.bridge.'));
   const world={width:area.width,height:area.height,objects:scene.objects,
     obstacles:[],boundary:area.boundary,walls:area.walls??[]};
   const context={objectCatalog:sculptPreviewCollisionCatalog,
     sculptNavigation:{terrain:scene.terrain,cellWidth:28,cellHeight:21,
       projectionRise:18,maxStepUp:0,maxStepDown:0,shoreEntryFraction:.14,
       bridges:bridgeObjects,stairs:sculptTerrainRampProjections(scene.terrain)}};
   const actor={x:area.spawns[0].x,y:area.spawns[0].y,radius:5,
     locomotion:{modes:['ground']},facingX:1,moving:false};
   const exit=doc.portals.find(p=>p.sourceAreaId===area.id&&
     p.trigger?.kind==='point'&&p.targetAreaId===host.initialAreaId);
   assert.ok(exit,preset.name+' outbound Portal exists');
   const targets=[...scene.surface.routes[0].points.slice(1,-1),exit.trigger];
   for(const target of targets){
     let reached=false;
     for(let n=0;n<550;n++){
       const dx=target.x-actor.x,dy=target.y-actor.y,d=Math.hypot(dx,dy);
       if(d<=12){reached=true;break;}
       const previous={x:actor.x,y:actor.y};
       stepMovement(world,actor,{x:dx/d,y:dy/d},Math.min(.035,d/210),
         {maxSpeed:210},undefined,context);
       assert.ok(Math.hypot(actor.x-previous.x,actor.y-previous.y)>.01,
         preset.name+' blocked by a new landscape object or wet ground at '+JSON.stringify(previous));
     }
     assert.ok(reached,preset.name+' cannot reach a canonical route waypoint');
   }
 }
});


test('all 38 independent house doors remain reachable from a real dry outdoor approach',()=>{
 let doors=0;
 for(const [index,preset] of builtinSculptMapPresets().entries()){
   const base=createBlankWorldBuilderDraft({id:'doors-'+index,width:1008,height:504});
   const doc=createWorldAreaFromSculptMapPreset(base,preset,{
     hostAreaId:base.initialAreaId});
   const area=doc.areas[1],scene=importSculptPreviewScene(preset.scene);
   const world={width:area.width,height:area.height,objects:scene.objects,
     obstacles:[],boundary:area.boundary,walls:area.walls??[]};
   const context={objectCatalog:sculptPreviewCollisionCatalog,
     sculptNavigation:{terrain:scene.terrain,cellWidth:28,cellHeight:21,
       projectionRise:18,maxStepUp:0,maxStepDown:0,shoreEntryFraction:.14,
       bridges:[],stairs:sculptTerrainRampProjections(scene.terrain)}};
   for(const portal of doc.portals.filter(p=>p.sourceAreaId===area.id&&
     p.trigger?.kind==='object-anchor')){
     doors++;
     const p=resolvePortalTriggerPoint(doc.areas,portal);
     assert.ok(p,preset.name+' has a valid front door');
     assert.ok(p.x>=45&&p.y>=45&&p.x<=area.width-45&&p.y<=area.height-45,
       preset.name+' door must not touch an inaccessible map edge: '+JSON.stringify(p));
     const offsets=[[0,65],[0,-65],[65,0],[-65,0],[45,45],[-45,45]];
     let entered=false;
     for(const [ox,oy] of offsets){
       const start={x:p.x+ox,y:p.y+oy};
       if(start.x<20||start.y<20||start.x>area.width-20||start.y>area.height-20)continue;
       if(sculptWaterAt(scene.terrain,Math.floor(start.x/28),
         Math.floor(start.y/21))>0)continue;
       const actor={...start,radius:5,locomotion:{modes:['ground']},
         facingX:1,moving:false};
       for(let n=0;n<110;n++){
         if(findTriggeredPortal(doc,area.id,actor)?.id===portal.id){entered=true;break;}
         const dx=p.x-actor.x,dy=p.y-actor.y,d=Math.hypot(dx,dy);
         if(d<1)break;
         const prev={x:actor.x,y:actor.y};
         stepMovement(world,actor,{x:dx/d,y:dy/d},Math.min(.035,d/210),
           {maxSpeed:210},undefined,context);
         if(Math.hypot(actor.x-prev.x,actor.y-prev.y)<.01)break;
       }
       if(entered)break;
     }
     assert.ok(entered,preset.name+' has an unusable real door at '+JSON.stringify(p));
   }
 }
 assert.equal(doors,38);
});
