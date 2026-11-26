// Native editor session for the IndexedDB WorldDocument owner. No legacy
// storage fallback and no active integration until all consumers migrate.
// Dirty state is only an ephemeral working copy, never a second persisted owner.
import {serializeWorldBuilderDraft,importWorldBuilderDocument} from '../builder/world-builder-draft.js';

export async function openWorldDocumentEditorSessionV1({
 store,key,initialDocument=null,debounceMs=600,
 setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id),
 onState=()=>{},onCommitted=()=>{},onBackupError=()=>{}
}={}){
 if(!store?.read||!store?.commit||typeof key!=='string'||
  !Number.isFinite(debounceMs)||debounceMs<0)
  throw TypeError('Session WorldDocument officielle requise');
 const existing=await store.read(key);
 const initial=existing?.document??initialDocument;
 if(!initial)throw Error('WorldDocument absent : création explicite requise');
 let committed=existing?serializeWorldBuilderDraft(existing.document):null;
 let revision=existing?.revision??null;
 let latest=serializeWorldBuilderDraft(initial);
 let timer=null,active=null,disposed=false,dirty=latest!==committed;
 let error=null;
 const state=()=>Object.freeze({revision,dirty,saving:Boolean(active),error});
 const notify=()=>{try{onState(state());}catch{}};
 const stopTimer=()=>{if(timer!==null){clearTimer(timer);timer=null;}};
 function schedule(){
  stopTimer();
  if(disposed||!dirty||active||error)return;
  timer=setTimer(()=>{timer=null;void flush().catch(()=>{});},debounceMs);
 }
 function edit(document){
  if(disposed)throw Error('Session WorldDocument fermée');
  latest=serializeWorldBuilderDraft(document);
  dirty=latest!==committed;
  // Conflicts and write failures remain visible until explicit retry/reload.
  notify();schedule();
 }
 function flush(){
  if(disposed)return Promise.reject(Error('Session WorldDocument fermée'));
  stopTimer();
  if(active)return active;
  if(!dirty)return Promise.resolve(state());
  error=null;
  // Serialize operations. Each revision is checked against the same durable
  // authority. An edit arriving during a transaction remains dirty until its
  // OWN transaction completes; the UI never acknowledges it prematurely.
  active=(async()=>{
   while(latest!==committed){
    const raw=latest;
    const document=importWorldBuilderDocument(raw);
    const [saved]=await store.commit([{key,document,expectedRevision:revision}]);
    if(!saved||saved.key!==key||serializeWorldBuilderDraft(saved.document)!==raw||
       !Number.isSafeInteger(saved.revision))
     throw Error('Commit WorldDocument non confirmé');
    revision=saved.revision;committed=raw;dirty=latest!==committed;
    // External copies are consequences of committed revisions, not a second
    // writer or a condition for acknowledging the primary transaction.
    try{
     Promise.resolve(onCommitted(Object.freeze({key,revision,document:saved.document})))
      .catch(e=>{try{onBackupError(e);}catch{}});
    }catch(e){try{onBackupError(e);}catch{}}
    notify();
   }
  })().catch(e=>{error=e?.message??String(e);dirty=latest!==committed;throw e;})
    .finally(()=>{active=null;dirty=latest!==committed;notify();if(dirty&&!error)schedule();});
  notify();
  return active.then(()=>state());
 }
 function dispose(){
  if(active||dirty)throw Error('Sauvegarde non terminée : flush obligatoire avant fermeture');
  stopTimer();disposed=true;
 }
 notify();
 return Object.freeze({
  read:()=>importWorldBuilderDocument(latest),state,edit,flush,dispose,
  // Explicit retry retains the pending validated document; a revision
  // conflict requires re-opening/reconciling instead of forcing overwrite.
  retry:flush
 });
}
