import {graphicImportMarkup,createGraphicImportControls} from './graphic-import-controls-v1.js';
import {createGraphicLibraryImporter,graphicImportObjectFolders} from './graphic-library-import-v1.js';
export function mountSculptGraphicImport({root,terrainFamilies=()=>[],importer=createGraphicLibraryImporter()}={}){
 if(!root)return null;
 root.innerHTML='<label>Utilisation <select data-import-type><option value="object">Objet / décor</option><option value="material">Texture</option></select></label>'+
 '<label>Nom <input data-import-label maxlength="100" required></label>'+
 '<div data-import-object><label>Dossier technique <select data-import-folder></select></label><label>Collision <select data-import-collision><option value="">Selon le type</option><option value="passable">Franchissable</option><option value="obstacle">Obstacle</option></select></label></div>'+
 '<div data-import-material hidden><label>Usage <select data-import-kind><option value="surface">Terrain</option><option value="path">Chemin</option><option value="water">Eau</option></select></label><label data-import-family-wrap>Famille <select data-import-family></select></label></div>'+
 '<p>Import local dans la bibliothèque existante. Pose et peinture 2,5D restent en cours de raccordement.</p><div data-import-form></div>';
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
 return createGraphicImportControls({root:$('form'),onImport:async prepared=>{
  const label=$('label').value.trim();if(!label)throw Error('Donne un nom à la ressource.');
  const r=await importer.save(prepared,{type:$('type').value,label,folderId:$('folder').value,collisionRole:$('collision').value,kind:$('kind').value,terrainFamilyId:$('family').value||null});
  return r.reused?'Ressource déjà présente : '+r.record.label+' (ID conservé).':'Ressource enregistrée : '+r.record.label;
 }});
}
