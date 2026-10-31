import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeWorldObjectPlacements,resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {worldObjectObstacleRect,buildingDoorAnchorWorld} from '../src/world/world-object-model.js';
import {sculptPreviewCollisionCatalog} from '../src/core/sculpt-preview-object-collisions.js';
import {createBlankWorldBuilderDraft,createBuildingInteriorLink,serializeWorldBuilderDraft,importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';
import {findTriggeredPortal,resolvePortalTriggerPoint} from '../src/world/portal-model.js';
import {sculptInteriorTransition,createSculptInteriorArea,applySculptInteriorTemplate,createSculptInteriorTemplate,updateSculptInterior} from '../src/world/sculpt-interior-area-link.js';
import {isBlocked} from '../src/core/collision.js';
import {normalizeSculptSurface} from '../src/world/sculpt-surface-paint.js';

// Exact placements and scales of the author's two houses; no user map is published.
const houses=[
 {id:'sculpt-object-129',objectDefinitionId:'objectdef.building.house.fantasy_wood_stone.01',
  transform:{x:780.4896850585938,y:550.927080154419,rotationDeg:0,scaleX:.85,scaleY:.85}},
 {id:'sculpt-object-141',objectDefinitionId:'objectdef.building.house.terracotta_2p5d.01',
  transform:{x:1507.5834732055664,y:669.8124713897705,rotationDeg:9,scaleX:.9,scaleY:.9},
  overrides:{visualVariantId:'side'}}
];
const placements=normalizeWorldObjectPlacements(houses);
const resolved=resolveWorldObjectPlacements(placements);
const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');

test('3/4 and classic houses use one authoritative scaled/rotated Collision World footprint in Sculpt and WorldArea',()=>{
 const sculpt=resolveWorldObjectPlacements(placements,sculptPreviewCollisionCatalog);
 for(let i=0;i<2;i++){
  assert.deepEqual(worldObjectObstacleRect(sculpt[i]),worldObjectObstacleRect(resolved[i]),
   'Sculpt must not substitute an obsolete invisible smaller collision footprint');
 }
});
test('generated forest1 doors are reachable from an approach 42 units in front of the real threshold',()=>{
 let draft=createBlankWorldBuilderDraft({id:'forest1-doors',width:80*28,height:60*21});
 const id=draft.areas[0].id;
 draft={...draft,areas:draft.areas.map(a=>a.id===id?{...a,objects:placements}:a)};
 for(const house of houses)draft=createBuildingInteriorLink(draft,{sourceAreaId:id,buildingId:house.id});
 const document=importWorldBuilderDocument(serializeWorldBuilderDraft(draft));
 const area=document.areas.find(a=>a.id===id);
 for(const house of houses){
  const portal=document.portals.find(p=>p.sourceAreaId===id&&p.trigger.objectId===house.id);
  assert.ok(portal,house.id+' must have an independent linked room');
  assert.ok(portal.trigger.radius>=52,'canonical house approach must not require standing on an exact pixel');
  const center=resolvePortalTriggerPoint(document.areas,portal);
  const building=resolved.find(b=>b.id===house.id);
  const door=buildingDoorAnchorWorld(building,'main-door');
  assert.equal(center.x,door.x);assert.equal(center.y,door.y);
  // A real player can walk to this part of the threshold on the 80×60 terrain.
  const ahead={x:center.x,y:center.y+42};
  assert.equal(isBlocked(area,{radius:5},ahead.x,ahead.y),false,
   house.id+' front approach must be traversable');
  assert.equal(findTriggeredPortal(document,id,ahead)?.id,portal.id,
   house.id+' entrance must become available before the hero touches the visual wall');
 }
 assert.equal(new Set(document.portals.filter(p=>p.sourceAreaId===id&&p.trigger.kind==='object-anchor')
  .map(p=>p.targetAreaId)).size,2,'not one interior shared by both houses');
});
test('generated WorldDocument existing 32-radius entrances migrate to 52 without changing manually configured gates',()=>{
 let draft=createBlankWorldBuilderDraft({id:'legacy-radius',width:80*28,height:60*21});
 const id=draft.areas[0].id;
 draft={...draft,areas:draft.areas.map(a=>a.id===id?{...a,objects:placements}:a)};
 draft=createBuildingInteriorLink(draft,{sourceAreaId:id,buildingId:houses[0].id});
 const raw=JSON.parse(serializeWorldBuilderDraft(draft));
 const entry=raw.portals.find(p=>p.sourceAreaId===id&&p.trigger.objectId===houses[0].id);
 entry.trigger.radius=32;
 const migrated=importWorldBuilderDocument(JSON.stringify(raw));
 assert.equal(migrated.portals.find(p=>p.id===entry.id).trigger.radius,52);
 const custom=structuredClone(raw);
 custom.portals.find(p=>p.id===entry.id).id='my-authored-entrance';
 assert.equal(importWorldBuilderDocument(JSON.stringify(custom)).portals
  .find(p=>p.id==='my-authored-entrance').trigger.radius,32);
});
test('individual interior templates never become a shared live house state',()=>{
 const a=createSculptInteriorArea(resolved[0],placements);
 const b=createSculptInteriorArea(resolved[1],placements);
 assert.ok(a&&b);
 assert.notEqual(a.area.id,b.area.id);
 const dark=updateSculptInterior(a,{surface:normalizeSculptSurface({
   ...a.surface,baseMaterialId:'floor.wood.dark'})});
 const template=createSculptInteriorTemplate(dark,{id:'interior-template-1',name:'Chambre A'});
 const decorated=applySculptInteriorTemplate(b,template);
 assert.equal(decorated.surface.baseMaterialId,'floor.wood.dark');
 assert.equal(a.surface.baseMaterialId,'floor.wood.house');
 assert.equal(sculptInteriorTransition(placements,[a,decorated],'sculpt-exterior',
  buildingDoorAnchorWorld(resolved[0],'main-door')).currentAreaId,a.area.id);
 assert.equal(sculptInteriorTransition(placements,[a,decorated],'sculpt-exterior',
  buildingDoorAnchorWorld(resolved[1],'main-door')).currentAreaId,decorated.area.id);
 // Existing linked interiors must be opened, not silently overwritten by a
 // still-selected template from the previously edited house.
 assert.doesNotMatch(source,/else if\s*\(wanted\)\s*\{[\s\S]{0,300}?applySculptInteriorTemplate\(entry,wanted\)/);
 assert.match(source,/houseSelect\.value\s*=\s*''/);
 assert.match(html,/Chaque maison[^<]+(?:propre|indépendant)/);
});
