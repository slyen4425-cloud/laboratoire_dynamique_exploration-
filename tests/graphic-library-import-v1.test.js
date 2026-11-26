import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createGraphicLibraryImporter} from '../src/assets/graphic-library-import-v1.js';
import {createUserMaterialRecord} from '../src/materials/user-material-library.js';
const store=()=>{const records=new Map();return {records,list:async()=>[...records.values()],get:async id=>records.get(id),add:async r=>{if(records.has(r.id))throw Object.assign(Error('exists'),{name:'ConstraintError'});records.set(r.id,r);}};};
const prepared=(content='image')=>{const blob=new Blob([content],{type:'image/png'});return {blob,mimeType:blob.type,bytes:blob.size,width:32,height:32,sourceName:'frame.png'};};
const material={type:'material',kind:'surface',label:'Herbe',terrainFamilyId:'plain'};
test('reuse original IDs, preserve labels, save each technical type in the existing owner',async()=>{
 const m=store(),o=store(),i=createGraphicLibraryImporter({materialStore:m,objectStore:o,subtle:webcrypto.subtle});
 const a=await i.save(prepared(),material),b=await i.save(prepared(),{...material,label:'Copie'});
 assert.equal(a.reused,false);assert.equal(b.reused,true);assert.equal(a.record.id,b.record.id);assert.equal(b.record.label,'Herbe');assert.equal(m.records.size,1);
 const c=await i.save(prepared(),{type:'object',folderId:'decor/water',label:'Fontaine',collisionRole:'passable'});
 assert.equal(c.record.folderId,'decor/water');assert.equal(o.records.size,1);
});
test('legacy IDs and simultaneous import are protected; invalid input and quota do not overwrite',async()=>{
 const m=store(),o=store(),i=createGraphicLibraryImporter({materialStore:m,objectStore:o,subtle:webcrypto.subtle});
 const old=createUserMaterialRecord({...prepared(),...material,idToken:'legacy-id'});await m.add(old);
 assert.equal((await i.save(prepared(),material)).record.id,old.id);
 const results=await Promise.all([i.save(prepared('another'),material),i.save(prepared('another'),material)]);
 assert.equal(results[0].record.id,results[1].record.id);assert.equal(results.filter(r=>!r.reused).length,1);
 await assert.rejects(i.save({...prepared(),bytes:999},material),/incohérentes/);
 await assert.rejects(i.save(prepared(),{type:'object',folderId:'bridges/general',label:'Pont'}),/non pris en charge/);
 m.add=async()=>{throw Object.assign(Error('quota'),{name:'QuotaExceededError'});};
 await assert.rejects(i.save(prepared('new'),material),/quota/);assert.equal(m.records.size,2);
});
