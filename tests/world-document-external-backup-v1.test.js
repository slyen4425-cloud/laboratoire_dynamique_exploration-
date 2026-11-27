import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';
import {writeVerifiedWorldBackupV1,backupCommittedWorldDocumentV1,selectWorldBackupDirectoryV1,worldBackupDirectoryPermissionV1} from '../src/storage/world-document-external-backup-v1.js';
const world=createBlankWorldBuilderDraft({id:'Monde_alpha'});
const changed={...world,areas:world.areas.map(a=>({...a,label:'Modifiée'}))};
function fakeDirectory(){
 const files=new Map();
 let permission='granted',broken=false,corrupt=false,opens=0;
 return {files,setPermission:p=>{permission=p},breakNext:()=>{broken=true},corruptNext:()=>{corrupt=true},
  get opens(){return opens},kind:'directory',queryPermission:async()=>permission,
  async getFileHandle(name,{create=false}={}){
   opens++;
   if(!files.has(name)){
    if(!create)throw Object.assign(Error('absent'),{name:'NotFoundError'});
    files.set(name,'');
   }
   return {async createWritable(){
     let pending='';
     return {async write(text){if(broken){broken=false;throw Error('disque plein');}pending=text;},
       async close(){files.set(name,corrupt?'bad':pending);corrupt=false;},async abort(){}};
    },async getFile(){return {text:async()=>files.get(name)}}};
  }};
}
const options={now:Date.UTC(2026,10,26,10,0),makeId:()=> '11111111-1111-4111-8111-111111111111'};
test('verified append-only native backups survive loss of source browser store',async()=>{
 const directory=fakeDirectory();
 const a=await writeVerifiedWorldBackupV1({directory,document:world,...options});
 const b=await writeVerifiedWorldBackupV1({directory,document:changed,...options,makeId:()=> '22222222-2222-4222-8222-222222222222'});
 assert.notEqual(a.name,b.name);
 assert.equal(directory.files.get(a.name),serializeWorldBuilderDraft(world));
 assert.equal(serializeWorldBuilderDraft(importWorldBuilderDocument(directory.files.get(b.name))),serializeWorldBuilderDraft(changed));
 assert.equal(a.bytes,new TextEncoder().encode(directory.files.get(a.name)).byteLength);
 await assert.rejects(writeVerifiedWorldBackupV1({directory,document:changed,...options}),/aucun écrasement/);
 assert.equal(directory.files.get(a.name),serializeWorldBuilderDraft(world));
});
test('revoked permission, failed write and corrupted readback never report success',async()=>{
 const directory=fakeDirectory();
 const a=await writeVerifiedWorldBackupV1({directory,document:world,...options});
 const before=directory.opens;
 directory.setPermission('denied');
 await assert.rejects(writeVerifiedWorldBackupV1({directory,document:changed,...options}),/Autorisation/);
 assert.equal(directory.opens,before);
 directory.setPermission('granted');directory.breakNext();
 await assert.rejects(writeVerifiedWorldBackupV1({directory,document:changed,...options,makeId:()=> '33333333-3333-4333-8333-333333333333'}),/non confirmée/);
 directory.corruptNext();
 await assert.rejects(writeVerifiedWorldBackupV1({directory,document:changed,...options,makeId:()=> '44444444-4444-4444-8444-444444444444'}),/incohérente/);
 assert.equal(directory.files.get(a.name),serializeWorldBuilderDraft(world));
});
test('only explicit selection and exact committed revision can create backup',async()=>{
 const directory=fakeDirectory();
 let picked=false;
 assert.equal(await selectWorldBackupDirectoryV1({showDirectoryPicker:async opts=>{picked=opts.mode==='readwrite';return directory}}),directory);
 assert.equal(picked,true);
 await assert.rejects(selectWorldBackupDirectoryV1({}),/non disponible/);
 assert.equal(await worldBackupDirectoryPermissionV1(directory),'granted');
 const store={read:async key=>key==='draft'?{revision:2,document:world}:null};
 await assert.rejects(backupCommittedWorldDocumentV1({store,key:'draft',expectedRevision:1,directory,...options}),/modifiée/);
 assert.equal(directory.files.size,0);
 const result=await backupCommittedWorldDocumentV1({store,key:'draft',expectedRevision:2,directory,...options});
 assert.equal(result.revision,2);assert.equal(directory.files.size,1);
});
