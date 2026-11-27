import test from 'node:test';
import assert from 'node:assert/strict';
import {objectLibraryDisplayPath,buildObjectLibraryTree,listObjectLibraryFolders} from '../src/objects/object-library-taxonomy.js';
import {listSculptPlaceableDefinitions} from '../src/world/sculpt-scene-preview.js';
const defs=listSculptPlaceableDefinitions();
const flat=node=>[...node.definitions,...node.children.flatMap(flat)];
const find=id=>{const d=defs.find(d=>d.id===id);assert.ok(d,id);return d;};
test('hierarchy includes every placeable native definition exactly once without modifying identity',()=>{
 const tree=buildObjectLibraryTree(defs);
 const entries=flat(tree);
 assert.equal(tree.count,defs.length);
 assert.equal(entries.length,defs.length);
 assert.equal(new Set(entries.map(d=>d.id)).size,defs.length);
 for(const d of defs)assert.equal(entries.find(item=>item.id===d.id),d);
});
test('houses, arenas, water, urban decorations and vegetation have nested presentation paths',()=>{
 for(const [id,path] of [
  ['objectdef.building.house.blue_cottage.01',['Maisons','Standard']],
  ['objectdef.building.house.snow_stone_cottage_2p5d.01',['Maisons','Neige']],
  ['objectdef.building.arena.element.feu.01',['Arènes','Élémentaires']],
  ['objectdef.waterfall.front_wide.01',['Décorations','Eau','Cascades / fontaines']],
  ['objectdef.decor.genesis.crate_open.01',['Décorations','Urbain','Caisses / tonneaux']],
  ['objectdef.tree.snow.broadleaf_oak_01',['Végétation','Arbres','Neige']],
  ['objectdef.tree.forest.broadleaf.01',['Végétation','Arbres','Standard']],
  ['objectdef.decor.genesis.bush_green.01',['Végétation','Buissons']],
  ['objectdef.decor.genesis.flower_poppy.01',['Végétation','Fleurs / herbes']]
 ])assert.deepEqual(objectLibraryDisplayPath(find(id)),path);
});
test('search is accent insensitive and personal subfolders are retained',()=>{
 const imported={id:'user.objectdef.decor.a',kind:'decor',label:'Fontaine bleue',library:{categoryId:'decor',folderId:'decor/water/village',folderLabel:'Village ancien',provenance:'user-local'}};
 assert.deepEqual(objectLibraryDisplayPath(imported),['Décorations','Eau','Cascades / fontaines','Village ancien']);
 assert.ok(listObjectLibraryFolders('decor').some(f=>f.id==='decor/water'));
 const found=flat(buildObjectLibraryTree([...defs,imported],'decoration eau'));
 assert.ok(found.includes(imported));
 assert.ok(found.some(d=>d.id.startsWith('objectdef.waterfall.')));
 assert.ok(!found.some(d=>d.id.startsWith('objectdef.tree.')));
});
