import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';
import {writeVerifiedWorldBackupV1} from '../src/storage/world-document-external-backup-v1.js';
import {installWorldExternalBackupPanelV1} from '../src/storage/world-document-external-backup-panel-v1.js';
const world=createBlankWorldBuilderDraft({id:'Monde_alpha'});
const changed={...world,areas:world.areas.map(a=>({...a,label:'Nouvelle carte'}))};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('real physical directory: canonical files survive independent read and restore',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'gensrpg-backup-'));
 try{
  const directory={kind:'directory',queryPermission:async()=> 'granted',async getFileHandle(name,{create=false}={}){
   const path=join(dir,name);
   if(!create){try{await stat(path);}catch(e){if(e.code==='ENOENT')throw Object.assign(Error('absent'),{name:'NotFoundError'});throw e;}}
   return {async createWritable(){let data;return {async write(s){data=s},async close(){await writeFile(path,data,{flag:'wx'})},async abort(){}}},async getFile(){return {text:()=>readFile(path,'utf8')}}};
  }};
  const a=await writeVerifiedWorldBackupV1({directory,document:world});
  const b=await writeVerifiedWorldBackupV1({directory,document:changed});
  assert.notEqual(a.name,b.name);
  assert.equal(await readFile(join(dir,a.name),'utf8'),serializeWorldBuilderDraft(world));
  const restored=importWorldBuilderDocument(await readFile(join(dir,b.name),'utf8'));
  assert.equal(serializeWorldBuilderDraft(restored),serializeWorldBuilderDraft(changed));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('editor opt-in backup: immediate, changed only, permission pause, manual resume and dispose',async()=>{
 const elements=new Map();
 for(const id of ['folder','now','stop','status']){const e=new EventTarget();e.dataset={};elements.set('world-external-backup-'+id,e);}
 let permission='granted',stored=null,sequence=0,snapshot=world;
 const directory={kind:'directory',name:'PC',queryPermission:async()=>permission,requestPermission:async()=>{permission='granted';return permission}};
 const timers=new Map(),written=[];
 const root={document:{getElementById:id=>elements.get(id)},showDirectoryPicker:async()=>directory,
  setTimeout:fn=>{const id=++sequence;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)};
 const fire=async()=>{const [id,fn]=timers.entries().next().value;timers.delete(id);fn();await tick();};
 const click=async id=>{elements.get('world-external-backup-'+id).dispatchEvent(new Event('click'));await tick();};
 const ui=installWorldExternalBackupPanelV1({root,captureDocument:()=>snapshot,
  preference:{load:async()=>stored,remember:async d=>{stored=d},forget:async()=>{stored=null}},
  writeBackup:async({document})=>{written.push(serializeWorldBuilderDraft(document));return {name:'copy-'+written.length+'.world.json'}}});
 await tick();assert.equal(timers.size,0);
 await click('folder');assert.equal(written.length,1);assert.equal(timers.size,1);assert.equal(stored,directory);
 await fire();assert.equal(written.length,1);assert.equal(timers.size,1);
 snapshot=changed;await fire();assert.equal(written.length,2);
 permission='denied';await fire();assert.equal(written.length,2);assert.equal(timers.size,0);
 await click('now');assert.equal(written.length,3);assert.equal(timers.size,1);
 await click('stop');assert.equal(stored,null);assert.equal(timers.size,0);
 ui.dispose();assert.equal(timers.size,0);
});
