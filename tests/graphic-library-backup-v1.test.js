import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createGraphicLibraryBackup} from '../src/assets/graphic-library-backup-v1.js';
import {createUserWorldObjectRecord} from '../src/objects/user-object-library.js';
import {createUserMaterialRecord} from '../src/materials/user-material-library.js';
const blob=new Blob(['image-fixture'],{type:'image/png'});
const common={blob,mimeType:blob.type,bytes:blob.size,width:32,height:32,createdAt:'2026-11-26T00:00:00.000Z'};
const object=createUserWorldObjectRecord({...common,idToken:'existing-legacy',kind:'decor',label:'Cascade',categoryId:'decor',folderId:'decor/general',animation:{frames:2,columns:2,frameWidth:16,frameHeight:32,fps:8}});
const material=createUserMaterialRecord({...common,idToken:'existing-texture',kind:'surface',label:'Herbe',terrainFamilyId:'forest'});
function store(records=[]){
 const map=new Map(records.map(r=>[r.id,r]));return {map,list:async()=>[...map.values()],get:async id=>map.get(id),add:async r=>{if(map.has(r.id))throw Object.assign(Error('existing'),{name:'ConstraintError'});map.set(r.id,r);}};
}
const backup=(o,m)=>createGraphicLibraryBackup({objectStore:o,materialStore:m,layoutStore:null,subtle:webcrypto.subtle,checkImage:async()=>{}});
test('portable archive retains legacy IDs, animation, family and exact bytes; repeated restore is safe',async()=>{
 const archive=await backup(store([object]),store([material])).export();
 const o=store(),m=store(),dest=backup(o,m);
 assert.deepEqual(await dest.restore(JSON.stringify(archive)),{added:2,reused:0});
 assert.deepEqual(await dest.restore(archive),{added:0,reused:2});
 const got=o.map.get(object.id);assert.equal(got.definitionId,object.definitionId);assert.deepEqual(got.animation,object.animation);
 assert.equal(await got.blob.text(),await object.blob.text());assert.equal(m.map.get(material.id).terrainFamilyId,'forest');
});
test('tampering or conflicting local identity refuses entire archive before writes',async()=>{
 const archive=await backup(store([object]),store([material])).export();
 const o=store(),m=store(),dest=backup(o,m);
 const bad=structuredClone(archive);bad.assets[1].sha256='0'.repeat(64);
 await assert.rejects(dest.restore(bad),/Empreinte/);assert.equal(o.map.size,0);
 m.map.set(material.id,{...material,label:'Local edited label'});
 await assert.rejects(dest.restore(archive),/Conflit local/);assert.equal(o.map.size,0);
 assert.equal(m.map.get(material.id).label,'Local edited label');
});
test('failed image decoding preflights all entries and adds nothing',async()=>{
 const archive=await backup(store([object]),store([material])).export();
 const o=store(),m=store();let seen=0;
 const dest=createGraphicLibraryBackup({objectStore:o,materialStore:m,layoutStore:null,subtle:webcrypto.subtle,checkImage:async()=>{if(++seen===2)throw Error('Decode error');}});
 await assert.rejects(dest.restore(archive),/Decode error/);assert.equal(o.map.size+m.map.size,0);
});
test('partial storage failure is additive and can be resumed',async()=>{
 const archive=await backup(store([object]),store([material])).export();
 const o=store(),m=store();const add=m.add;m.add=async()=>{throw Error('QuotaExceededError');};
 await assert.rejects(backup(o,m).restore(archive),/1 ajout/);assert.equal(o.map.size,1);assert.equal(m.map.size,0);
 m.add=add;assert.deepEqual(await backup(o,m).restore(archive),{added:1,reused:1});
});

const layout=(categories=[],assignments={})=>({version:1,categories,assignments});
const root={id:'category.root',label:'Maisons',parentId:null};
const child={id:'category.snow',label:'Neige',parentId:root.id};
function layoutStore(initial=layout()){
 let current={revision:0,layout:initial};return {load:async()=>current,save:async(next,expected)=>{if(expected!==current.revision)throw Error('Concurrent layout');current={revision:expected+1,layout:next};return current;}};
}
const withLayout=(o,m,l)=>createGraphicLibraryBackup({objectStore:o,materialStore:m,layoutStore:l,subtle:webcrypto.subtle,checkImage:async()=>{}});
test('portable archive restores category hierarchy and stable definition assignments without changing local order',async()=>{
 const source=layoutStore(layout([root,child],{[object.definitionId]:child.id}));
 const archive=await withLayout(store([object]),store(),source).export();
 const local={id:'category.local',label:'Décors',parentId:null};
 const target=layoutStore(layout([local])),o=store(),dest=withLayout(o,store(),target);
 await dest.restore(JSON.stringify(archive));
 const state=await target.load();
 assert.deepEqual(state.layout.categories,[local,root,child]);
 assert.equal(state.layout.assignments[object.definitionId],child.id);
 await dest.restore(archive);assert.equal((await target.load()).revision,1);
 assert.equal(o.map.get(object.id).definitionId,object.definitionId);
});
test('conflicting or cyclic layout refuses entire archive before assets are written',async()=>{
 const archive=await withLayout(store([object]),store(),layoutStore(layout([root,child]))).export();
 const o=store(),target=layoutStore(layout([{...root,label:'Autre nom'}]));
 await assert.rejects(withLayout(o,store(),target).restore(archive),/Conflit de catégorie/);
 assert.equal(o.map.size,0);
 const bad=structuredClone(archive);bad.layout.categories[0].parentId=child.id;
 await assert.rejects(withLayout(o,store(),layoutStore()).restore(bad),/Hiérarchie/);
 assert.equal(o.map.size,0);
});
test('old backup without layout leaves existing personal categories untouched',async()=>{
 const archive=await backup(store([object]),store()).export();
 const target=layoutStore(layout([root]));
 await withLayout(store(),store(),target).restore(archive);
 assert.equal((await target.load()).revision,0);
 assert.deepEqual((await target.load()).layout.categories,[root]);
});
test('concurrent layout update never overwrites local changes and restore can resume',async()=>{
 const archive=await withLayout(store([object]),store(),layoutStore(layout([root]))).export();
 const target=layoutStore(),o=store(),dest=withLayout(o,store(),target),save=target.save;
 target.save=async(next,expected)=>{await save(layout([{id:'category.local',label:'Local',parentId:null}]),expected);return save(next,expected);};
 await assert.rejects(dest.restore(archive),/Concurrent layout/);
 assert.equal(o.map.size,1);assert.equal((await target.load()).layout.categories[0].label,'Local');
 target.save=save;await dest.restore(archive);
 assert.deepEqual((await target.load()).layout.categories.map(c=>c.id),['category.local',root.id]);
});
