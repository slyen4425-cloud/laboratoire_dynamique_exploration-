import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeObjectLibraryLayout,addObjectLibraryCategory,editObjectLibraryCategory,reorderObjectLibraryCategory,assignObjectLibraryCategory,removeObjectLibraryCategory,objectLibraryCategoryPath} from '../src/objects/object-library-layout-v1.js';
test('personal category ids survive rename, moving, and resource reassignment',()=>{
 let l=normalizeObjectLibraryLayout();
 l=addObjectLibraryCategory(l,{name:'Mon village',makeId:()=> 'village'});
 l=addObjectLibraryCategory(l,{name:'Neige',parentId:'category.village',makeId:()=> 'snow'});
 l=assignObjectLibraryCategory(l,'objectdef.building.house.blue_cottage.01','category.snow');
 l=editObjectLibraryCategory(l,'category.village',{name:'Village nordique'});
 assert.deepEqual(objectLibraryCategoryPath(l,'category.snow').map(c=>c.label),['Village nordique','Neige']);
 assert.equal(l.assignments['objectdef.building.house.blue_cottage.01'],'category.snow');
 assert.throws(()=>removeObjectLibraryCategory(l,'category.snow'),/Déplace/);
 assert.throws(()=>editObjectLibraryCategory(l,'category.village',{parentId:'category.snow'}),/Hiérarchie/);
 l=assignObjectLibraryCategory(l,'objectdef.building.house.blue_cottage.01',null);
 l=removeObjectLibraryCategory(l,'category.snow');
 assert.equal(l.categories.length,1);
});
test('same names in distinct parents allowed; duplicates and cycles fail closed',()=>{
 let l=addObjectLibraryCategory(undefined,{name:'A',makeId:()=> 'a'});
 l=addObjectLibraryCategory(l,{name:'B',makeId:()=> 'b'});
 assert.throws(()=>addObjectLibraryCategory(l,{name:' a ',makeId:()=> 'duplicate'}),/existe/);
 l=reorderObjectLibraryCategory(l,'category.b',-1);
 assert.deepEqual(l.categories.map(c=>c.id),['category.b','category.a']);
 assert.throws(()=>assignObjectLibraryCategory(l,'native.object','category.missing'),/Rattachement/);
 assert.equal(normalizeObjectLibraryLayout(JSON.parse(JSON.stringify(l))).categories.length,2);
});

import {buildObjectLibraryTree} from '../src/objects/object-library-taxonomy.js';
test('tree renders empty categories, preserves personal order, and moves resources without duplication',()=>{
 let l=addObjectLibraryCategory(undefined,{name:'Maisons',makeId:()=> 'personal-houses'});
 l=addObjectLibraryCategory(l,{name:'Neige',parentId:'category.personal-houses',makeId:()=> 'personal-snow'});
 const def={id:'objectdef.building.house.blue_cottage.01',kind:'building',label:'Maison bleue',library:{folderId:'buildings/houses/temperate',categoryId:'buildings'}};
 let tree=buildObjectLibraryTree([def],'',l);
 assert.equal(tree.children.filter(c=>c.label==='Maisons').length,2);
 assert.equal(tree.children.find(c=>c.personal).children[0].count,0);
 l=assignObjectLibraryCategory(l,def.id,'category.personal-snow');
 tree=buildObjectLibraryTree([def],'',l);
 assert.equal(tree.count,1);
 assert.equal(tree.children[0].children[0].definitions[0],def);
 assert.equal(buildObjectLibraryTree([def],'neige bleue',l).count,1);
});
