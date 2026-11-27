// Shared editor-only panel. The file is a recovery export, never an active
// database. It deliberately also protects valid dirty work when Web Storage
// is full. No writes to the primary store and no false save acknowledgement.
import {serializeWorldBuilderDraft} from '../builder/world-builder-draft.js';
import {selectWorldBackupDirectoryV1,worldBackupDirectoryPermissionV1,
 requestWorldBackupDirectoryPermissionV1,createWorldBackupDirectoryPreferenceV1,
 writeVerifiedWorldBackupV1} from './world-document-external-backup-v1.js';

export const WORLD_EXTERNAL_BACKUP_INTERVAL_MS=300000;
export function installWorldExternalBackupPanelV1({
 root=globalThis,captureDocument,preference=null,writeBackup=writeVerifiedWorldBackupV1,
 intervalMs=WORLD_EXTERNAL_BACKUP_INTERVAL_MS
}={}){
 if(typeof captureDocument!=='function')throw TypeError('Snapshot WorldDocument officiel requis');
 const doc=root.document,folder=doc.getElementById('world-external-backup-folder'),
  now=doc.getElementById('world-external-backup-now'),stop=doc.getElementById('world-external-backup-stop'),
  status=doc.getElementById('world-external-backup-status');
 if(!folder||!now||!stop||!status)throw Error('Panneau de copies externes manquant');
 const supported=typeof root.showDirectoryPicker==='function';
 let directory=null,timer=null,disposed=false,busy=false,last=null,epoch=0;
 let preferences=preference;
 const message=(text,error=false)=>{
  if(!disposed){status.textContent=text;status.dataset.error=String(error);}
 };
 const update=()=>{
  if(disposed)return;
  folder.disabled=!supported||busy;now.disabled=!directory||busy;stop.disabled=!directory||busy;
 };
 const cancel=()=>{if(timer!==null){root.clearTimeout(timer);timer=null;}};
 function schedule(){
  cancel();
  if(disposed||!directory||busy)return;
  timer=root.setTimeout(()=>{timer=null;void copy(false);},intervalMs);
 }
 async function copy(force){
  if(disposed||!directory||busy)return;
  cancel();busy=true;update();
  let reschedule=false;
  try{
   if(await worldBackupDirectoryPermissionV1(directory)!=='granted')
    throw Error('Dossier à réautoriser. Clique sur Copier maintenant / réautoriser.');
   const snapshot=captureDocument();
   if(!snapshot){reschedule=true;return;}
   const raw=serializeWorldBuilderDraft(snapshot);
   if(!force&&raw===last){reschedule=true;return;}
   message('Écriture de la copie externe…');
   const saved=await writeBackup({directory,document:snapshot});
   last=raw;message('✓ Copie externe vérifiée : '+saved.name);
   reschedule=true;
  }catch(error){message('⚠ Copie externe suspendue : '+(error?.message??error)+' · aucune ancienne copie effacée.',true);}
  finally{busy=false;update();if(reschedule)schedule();}
 }
 async function choose(){
  if(disposed||busy)return;
  cancel();busy=true;update();const current=++epoch;let selected=false;
  try{
   // Picker is called synchronously in the direct click event.
   const chosen=await selectWorldBackupDirectoryV1(root);
   if(disposed||current!==epoch)return;
   if(await worldBackupDirectoryPermissionV1(chosen)!=='granted')
    throw Error('Écriture du dossier non autorisée');
   await preferences.remember(chosen);
   if(disposed||current!==epoch)return;
   directory=chosen;last=null;selected=true;message('Dossier autorisé : '+chosen.name);
  }catch(error){message('Dossier non configuré : '+(error?.message??error),true);}
  finally{busy=false;update();}
  if(!disposed&&current===epoch&&selected)await copy(true);
  else if(!disposed&&current===epoch&&directory)schedule();
 }
 async function manual(){
  if(disposed||!directory||busy)return;
  cancel();busy=true;update();
  try{
   // requestPermission must be initiated by the user gesture, not a timer.
   const permission=await requestWorldBackupDirectoryPermissionV1(directory);
   if(permission!=='granted')throw Error('Autorisation non accordée');
  }catch(error){message(error.message,true);busy=false;update();return;}
  busy=false;update();await copy(true);
 }
 async function disable(){
  if(disposed||busy)return;
  cancel();busy=true;update();++epoch;
  try{
   await preferences.forget();directory=null;last=null;message('Copies externes désactivées · fichiers conservés.');
  }catch(error){message('Désactivation non confirmée : '+error.message,true);}
  finally{busy=false;update();}
 }
 const onChoose=()=>{void choose();},onManual=()=>{void manual();},onStop=()=>{void disable();};
 folder.addEventListener('click',onChoose);now.addEventListener('click',onManual);stop.addEventListener('click',onStop);
 update();
 if(!supported){message('Dossier externe non disponible dans ce navigateur. Utilise Exporter le monde complet.');}
 else{
  preferences??=createWorldBackupDirectoryPreferenceV1({indexedDBFactory:root.indexedDB});
  const current=epoch;
  void (async()=>{
   try{
    const stored=await preferences.load();
    if(disposed||current!==epoch)return;
    if(stored){
     directory=stored;update();
     if(await worldBackupDirectoryPermissionV1(stored)==='granted'){
      if(!disposed&&current===epoch){message('Copies automatiques actives : '+stored.name);schedule();}
     }else if(!disposed&&current===epoch)message('Dossier à réautoriser : '+stored.name,true);
    }
   }catch(error){message('Préférences du dossier indisponibles : '+error.message,true);}
  })();
 }
 return Object.freeze({dispose(){
  disposed=true;++epoch;cancel();
  folder.removeEventListener('click',onChoose);now.removeEventListener('click',onManual);stop.removeEventListener('click',onStop);
 }});
}
