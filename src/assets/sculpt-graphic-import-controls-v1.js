import {graphicImportMarkup,createGraphicImportControls} from './graphic-import-controls-v1.js';
import {createGraphicLibraryImporter,graphicImportObjectFolders} from './graphic-library-import-v1.js';
import {createGraphicLibraryBackup,GRAPHIC_LIBRARY_BACKUP_MAX_BYTES,GRAPHIC_LIBRARY_LAYOUT_MAX_BYTES} from './graphic-library-backup-v1.js';
export function mountSculptGraphicImport({root,terrainFamilies=()=>[],importer=createGraphicLibraryImporter(),backup=createGraphicLibraryBackup(),onLibraryChanged=async()=>{},onLayoutRestored=async()=>{}}={}){
 if(!root)return null;
 root.innerHTML='<label>Utilisation <select data-import-type><option value="object">Objet / décor</option><option value="material">Texture</option></select></label>'+
 '<label>Nom <input data-import-label maxlength="100" required></label>'+
 '<div data-import-object><label>Dossier technique <select data-import-folder></select></label><label>Collision <select data-import-collision><option value="">Selon le type</option><option value="passable">Franchissable</option><option value="obstacle">Obstacle</option></select></label></div>'+
 '<div data-import-material hidden><label>Usage <select data-import-kind><option value="surface">Terrain</option><option value="path">Chemin</option><option value="water">Eau</option></select></label><label data-import-family-wrap>Famille <select data-import-family></select></label></div>'+
 '<p>Import local dans la bibliothèque existante. Pose d’objets et peinture de textures statiques ou animées dans Sculpt et les cartes extérieures World Builder. Restaure la bibliothèque locale avant de jouer sur un autre appareil.</p><div data-import-form></div>'+
 '<details><summary>Sauvegarder / restaurer mes ressources</summary><p>Images, animations et classement personnels, sans les cartes. Restauration additive sans écrasement (64 Mio d’images maximum).</p><button type="button" data-import-backup-export>Exporter mes ressources</button><label>Restaurer un fichier <input type="file" accept=".json,application/json" data-import-backup-file></label><output data-import-backup-status role="status" aria-live="polite"></output></details>';
 const $=key=>root.querySelector('[data-import-'+key+']');
 const opt=(value,text)=>{const o=document.createElement('option');o.value=value;o.textContent=text;return o;};
 $('folder').replaceChildren(...graphicImportObjectFolders().map(f=>opt(f.id,f.label)));$('folder').value='decor/general';
 function update(){
  $('object').hidden=$('type').value!=='object';$('material').hidden=$('type').value!=='material';$('family-wrap').hidden=$('kind').value!=='surface';
  const selected=$('family').value;
  $('family').replaceChildren(opt('','Famille par défaut'),...terrainFamilies().map(f=>opt(f.id,f.label??f.id)));
  if([...$('family').options].some(o=>o.value===selected))$('family').value=selected;
 }
 $('type').addEventListener('change',update);$('kind').addEventListener('change',update);
 root.closest('details')?.addEventListener('toggle',update);
 $('form').innerHTML=graphicImportMarkup();update();
 const exportButton=$('backup-export'),restoreInput=$('backup-file'),backupStatus=$('backup-status');
 let backupBusy=false;
 async function backupAction(action){
  if(backupBusy)return;backupBusy=true;exportButton.disabled=true;restoreInput.disabled=true;
  try{await action();}catch(error){backupStatus.textContent=error.message;}
  finally{backupBusy=false;exportButton.disabled=false;restoreInput.disabled=false;restoreInput.value='';}
 }
 exportButton.addEventListener('click',()=>backupAction(async()=>{
  const data=await backup.export(),blob=new Blob([JSON.stringify(data)],{type:'application/json'}),url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='gensrpg-bibliotheque-graphique.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  backupStatus.textContent=data.assets.length+' ressource(s) exportées.';
 }));
 restoreInput.addEventListener('change',()=>backupAction(async()=>{
  const file=restoreInput.files?.[0];if(!file)return;
  if(file.size>Math.ceil(GRAPHIC_LIBRARY_BACKUP_MAX_BYTES*4/3)+2048*4096+GRAPHIC_LIBRARY_LAYOUT_MAX_BYTES)throw Error('Fichier trop volumineux.');
  const result=await backup.restore(await file.text());await onLayoutRestored();await onLibraryChanged();backupStatus.textContent=result.added+' ajout(s), '+result.reused+' déjà présentes ; aucun écrasement.';
 }));
 return createGraphicImportControls({root:$('form'),onImport:async prepared=>{
  const label=$('label').value.trim();if(!label)throw Error('Donne un nom à la ressource.');
  const r=await importer.save(prepared,{type:$('type').value,label,folderId:$('folder').value,collisionRole:$('collision').value,kind:$('kind').value,terrainFamilyId:$('family').value||null});
  await onLibraryChanged();
  return r.reused?'Ressource déjà présente : '+r.record.label+' (ID conservé).':'Ressource enregistrée : '+r.record.label;
 }});
}
