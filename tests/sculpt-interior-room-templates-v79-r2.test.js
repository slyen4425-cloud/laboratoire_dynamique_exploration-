import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {applySculptStroke,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {createMaterialRegistry} from '../src/materials/material-registry.js';
import {materialPackV1} from '../src/materials/material-pack-v1.js';
import {SCULPT_SURFACE_MATERIALS,normalizeSculptSurface} from '../src/world/sculpt-surface-paint.js';
import {
 createSculptInteriorArea,updateSculptInterior,createSculptInteriorTemplate,
 normalizeSculptInteriorTemplates,applySculptInteriorTemplate,
 sculptInteriorPortalDocument,serializeSculptInteriors,importSculptInteriors
} from '../src/world/sculpt-interior-area-link.js';

const makeHouses=()=>{
 let objects=appendSculptPreviewObject([],{
   definitionId:'objectdef.building.house.fantasy_wood_stone.01',
   x:280,y:260,scale:.6
 });
 objects=appendSculptPreviewObject(objects,{
   definitionId:'objectdef.building.house.fantasy_wood_stone.01',
   x:420,y:280,scale:.6
 });
 return {objects,buildings:resolveWorldObjectPlacements(objects)};
};

test('V79 R2 uses five original Material Registry floors without a duplicate asset catalog',()=>{
 const actual=SCULPT_SURFACE_MATERIALS.filter(m=>m.id.startsWith('floor.')).map(m=>m.id);
 assert.deepEqual(actual,['floor.wood.house','floor.wood.dark','floor.tile.light',
   'floor.tile.sandstone','floor.concrete.gray']);
 const registry=createMaterialRegistry(materialPackV1);
 for(const id of actual)assert.ok(registry.require(id,'surface').assets.base.startsWith('texture.floor.'));
 const {objects,buildings}=makeHouses();
 const entry=createSculptInteriorArea(buildings[0],objects);
 assert.equal(entry.surface.baseMaterialId,'floor.wood.house');
});

test('V79 R2 copies reusable room content but never overwrites destination WorldArea or Portal links',()=>{
 const {objects,buildings}=makeHouses();
 const entry1=createSculptInteriorArea(buildings[0],objects);
 const entry2=createSculptInteriorArea(buildings[1],objects);
 const changed=updateSculptInterior(entry1,{
   terrain:applySculptStroke(entry1.terrain,{mode:'raise',
     points:[{x:8,y:5}],radius:2,strength:1,target:2}),
   surface:normalizeSculptSurface({...entry1.surface,baseMaterialId:'floor.tile.light'})
 });
 const template=createSculptInteriorTemplate(changed,{id:'interior-template-1',name:'Maison de village'});
 assert.equal(template.area,undefined);
 assert.equal(template.entryPortal,undefined);
 assert.equal(template.exitPortal,undefined);
 assert.equal(template.buildingId,undefined);
 const result=applySculptInteriorTemplate(entry2,template);
 assert.equal(result.area.id,entry2.area.id);
 assert.equal(result.entryPortal.id,entry2.entryPortal.id);
 assert.equal(result.exitPortal.id,entry2.exitPortal.id);
 assert.notEqual(result.entryPortal.id,entry1.entryPortal.id);
 assert.equal(result.surface.baseMaterialId,'floor.tile.light');
 assert.equal(serializeSculptTerrain(result.terrain),serializeSculptTerrain(changed.terrain));
 const doc=sculptInteriorPortalDocument(objects,[entry1,result]);
 assert.equal(doc.areas.length,3);
 assert.equal(doc.portals.length,4);
 const roundtrip=importSculptInteriors(JSON.parse(JSON.stringify(serializeSculptInteriors([entry1,result]))),objects);
 assert.equal(roundtrip[1].exitPortal.id,entry2.exitPortal.id);
 assert.equal(roundtrip[1].surface.baseMaterialId,'floor.tile.light');
});

test('V79 R2 rejects bad and duplicate templates and never imports foreign area/portal IDs',()=>{
 const {objects,buildings}=makeHouses();
 const entry=createSculptInteriorArea(buildings[0],objects);
 const t=createSculptInteriorTemplate(entry,{id:'interior-template-1',name:'Pièce A'});
 assert.equal(normalizeSculptInteriorTemplates([t])[0].name,'Pièce A');
 assert.throws(()=>normalizeSculptInteriorTemplates([t,t]),/dupliqu|invalide/);
 assert.throws(()=>normalizeSculptInteriorTemplates([{...t,entryPortal:entry.entryPortal}]),/invalide/);
 assert.throws(()=>normalizeSculptInteriorTemplates([{...t,area:entry.area}]),/invalide/);
 assert.throws(()=>normalizeSculptInteriorTemplates([{...t,terrain:{...t.terrain,width:64}}]),/incompatibles/);
 assert.throws(()=>normalizeSculptInteriorTemplates(null),/invalide/);
});

test('V79 R2 keeps full-screen exit, texture choice and templates inside the sole floating quickbar',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const quickbar=html.indexOf('class="sculpt-quickbar"');
 const room=html.indexOf('id="interior-area-bar"');
 const canvas=html.indexOf('id="brush-info"');
 assert.ok(quickbar>=0&&room>quickbar&&canvas>room);
 for(const id of ['interior-area-return','interior-floor-base','interior-template-name',
   'interior-template-save','interior-template-select','interior-template-apply'])
   assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(main,/doorway:sculptInteriors.find/);
 assert.match(main,/applySculptInteriorTemplate\(entry,template\)/);
 assert.match(main,/scene\.interiorTemplates=normalizeSculptInteriorTemplates/);
 assert.match(main,/localStorage\.setItem\(SCULPT_INTERIOR_TEMPLATE_STORAGE/);
});
