import test from 'node:test';
import assert from 'node:assert/strict';
import {createBlankWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {openWorldDocumentEditorSessionV1} from '../src/storage/world-document-editor-session-v1.js';
const key='gensrpg.world-assembler.document.v1';
const world=createBlankWorldBuilderDraft({id:'Monde_alpha'});
const changed=label=>({...world,areas:world.areas.map(a=>({...a,label}))});
function fakeStore(){
 let row={key,revision:1,document:world};
 const pending=[];
 return {pending,read:async()=>row,commit(entries){
  const entry=entries[0];return new Promise((resolve,reject)=>pending.push({entry,resolve:()=>{
   if(entry.expectedRevision!==row.revision){reject(Error('Conflit de révision'));return;}
   row={key,revision:row.revision+1,document:entry.document};resolve([row]);
  },reject}));
 },bump:()=>{row={...row,revision:row.revision+1}}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('edits during async transaction are not acknowledged until latest commit',async()=>{
 const store=fakeStore(),commits=[],states=[];
 const session=await openWorldDocumentEditorSessionV1({store,key,debounceMs:60000,onState:s=>states.push(s),onCommitted:r=>commits.push(r.revision)});
 session.edit(changed('A'));
 assert.equal(session.state().dirty,true);
 const flushing=session.flush();
 await tick();
 session.edit(changed('B'));
 assert.throws(()=>session.dispose(),/flush obligatoire/);
 assert.equal(store.pending[0].entry.expectedRevision,1);
 store.pending[0].resolve();await tick();
 assert.equal(session.state().dirty,true);
 assert.equal(store.pending[1].entry.expectedRevision,2);
 store.pending[1].resolve();await flushing;
 assert.equal(session.state().dirty,false);
 assert.equal(session.state().revision,3);
 assert.equal(session.read().areas[0].label,'B');
 assert.deepEqual(commits,[2,3]);
 session.dispose();
});
test('failed or concurrent save keeps dirty document and never overwrites newer revision',async()=>{
 const store=fakeStore();const session=await openWorldDocumentEditorSessionV1({store,key,debounceMs:60000});
 session.edit(changed('Non perdue'));
 let flushing=session.flush();await tick();
 store.pending[0].reject(Error('QuotaExceededError'));
 await assert.rejects(flushing,/QuotaExceededError/);
 assert.equal(session.state().dirty,true);assert.equal(session.state().revision,1);
 assert.equal(session.read().areas[0].label,'Non perdue');
 store.bump();flushing=session.retry();await tick();store.pending[1].resolve();
 await assert.rejects(flushing,/Conflit/);
 assert.equal(session.state().dirty,true);
 assert.equal(session.state().revision,1);
 assert.throws(()=>session.dispose(),/flush obligatoire/);
});
test('external backup failure is separate from durable primary acknowledgement',async()=>{
 const store=fakeStore(),errors=[];
 const session=await openWorldDocumentEditorSessionV1({store,key,debounceMs:60000,
  onCommitted:async()=>{throw Error('Dossier externe non autorisé')},onBackupError:e=>errors.push(e.message)});
 session.edit(changed('Sauvegardée'));
 const flushing=session.flush();await tick();store.pending[0].resolve();await flushing;await tick();
 assert.equal(session.state().dirty,false);assert.equal(session.state().error,null);
 assert.deepEqual(errors,['Dossier externe non autorisé']);
 session.dispose();
});
