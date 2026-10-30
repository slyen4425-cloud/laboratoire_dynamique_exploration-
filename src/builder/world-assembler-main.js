import {
  addWorldArea,removeWorldArea,connectWorldAreas,setWorldInitialArea,
  deletePortal,createBlankWorldBuilderDraft,createWorldBuilderDraft,
  serializeWorldBuilderDraft,importWorldBuilderDocument
} from './world-builder-draft.js?rev=preset-travel-encounters-v2';
import {
  saveWorldAssemblerHandoff,readWorldAssemblerHandoff,
  saveWorldAssemblerDraft,readWorldAssemblerDraft
} from './world-assembler-handoff.js';
import {createWorldAreaFromSculptMapPreset} from './sculpt-map-preset-library.js?rev=preset-travel-encounters-v2';
import {listAvailableSculptMapPresets} from './sculpt-builtin-map-presets.js?rev=preset-travel-encounters-v2';
import {worldAreaSizeFromTiles} from './world-area-size-command.js';
import {makePlayableZoneRoute,resolveSculptAreaForEditor} from './sculpt-playable-zone-route.js?rev=preset-travel-encounters-v2';
import {sculptWorldAreaScene} from './sculpt-world-area-link.js';

const byId=id=>document.getElementById(id);
const pretty=id=>String(id??'').replace(/[-_]+/g,' ').replace(/\b\p{L}/gu,c=>c.toUpperCase());
const kindIcon=area=>area.siteKind==='dungeon'?'🗝':area.kind==='interior'?'🏠':'🌲';
const kindName=area=>area.siteKind==='dungeon'?'Donjon / instance':area.kind==='interior'?'Instance / intérieur':'Région extérieure';
const areaLabel=area=>area.label||pretty(area.id);
const svgNS='http://www.w3.org/2000/svg';

function graphLayout(doc){
  // Presentation only. Portal edges come from WorldDocument, and the graph
  // layout is never persisted into an alternative WorldGraph format.
  const depth=new Map();
  const adjacency=new Map(doc.areas.map(a=>[a.id,new Set()]));
  for(const p of doc.portals){
    adjacency.get(p.sourceAreaId)?.add(p.targetAreaId);
    adjacency.get(p.targetAreaId)?.add(p.sourceAreaId);
  }
  const roots=[doc.initialAreaId,...doc.areas.map(a=>a.id)];
  let nextDepth=0;
  for(const root of roots){
    if(depth.has(root)||!adjacency.has(root))continue;
    const queue=[root];depth.set(root,nextDepth);
    for(let i=0;i<queue.length;i++){
      const id=queue[i];
      for(const to of adjacency.get(id)??[]){
        if(depth.has(to))continue;
        depth.set(to,depth.get(id)+1);queue.push(to);
      }
    }
    nextDepth=Math.max(...depth.values())+1;
  }
  const rows=new Map(),positions=new Map();
  for(const area of doc.areas){
    const column=depth.get(area.id)??0;
    const row=rows.get(column)??0;rows.set(column,row+1);
    positions.set(area.id,{x:54+column*244,y:70+row*146});
  }
  const maxX=Math.max(700,...[...positions.values()].map(p=>p.x+240));
  const maxY=Math.max(420,...[...positions.values()].map(p=>p.y+145));
  return {positions,width:maxX,height:maxY};
}
function nodeButton(area,position,doc,selectedId,onClick){
  const el=document.createElement('button');
  el.type='button';el.className='world-node';
  if(area.id===selectedId)el.classList.add('selected');
  el.dataset.areaId=area.id;el.dataset.kind=area.kind;
  el.style.left=position.x+'px';el.style.top=position.y+'px';
  el.setAttribute('aria-label',pretty(area.id)+', '+kindName(area));
  const top=document.createElement('span');top.className='node-top';
  const ico=document.createElement('span');ico.className='node-type';
  ico.textContent=kindIcon(area);top.append(ico);
  if(doc.initialAreaId===area.id){
    const star=document.createElement('span');star.className='start-pill';
    star.textContent='★ Départ';top.append(star);
  }
  const label=document.createElement('strong');label.textContent=areaLabel(area);
  const type=document.createElement('small');type.textContent=kindName(area);
  const count=document.createElement('span');count.className='node-count';
  const n=doc.portals.filter(p=>p.sourceAreaId===area.id).length;
  count.textContent=n+' sortie'+(n>1?'s':'')+' · '+Math.round(area.width)+' × '+Math.round(area.height);
  el.append(top,label,type,count);
  el.addEventListener('click',onClick);
  return el;
}
function lineForPortal(portal,positions){
  const a=positions.get(portal.sourceAreaId),b=positions.get(portal.targetAreaId);
  if(!a||!b)return null;
  const reciprocal=portal.sourceAreaId>portal.targetAreaId;
  const x1=a.x+(a.x<=b.x?205:0),y1=a.y+(reciprocal?67:48);
  const x2=b.x+(a.x<=b.x?0:205),y2=b.y+(reciprocal?67:48);
  const dx=x2-x1,side=dx>=0?1:-1;
  const bezier='M'+x1+' '+y1+' C'+(x1+side*75)+' '+y1+' '+(x2-side*75)+' '+y2+' '+x2+' '+y2;
  const p=document.createElementNS(svgNS,'path');
  p.setAttribute('d',bezier);p.setAttribute('class','graph-edge'+(reciprocal?' return':''));
  p.setAttribute('marker-end','url(#portal-arrow)');
  return p;
}

function installWorldAssembler(){
  const toast=byId('status-toast');
  const listenerCleanups=[];
  const on=(el,event,callback,options)=>{
    el.addEventListener(event,callback,options);
    listenerCleanups.push(()=>el.removeEventListener(event,callback,options));
  };
  // Mobile presentation only: retain the one WorldDocument and the same
  // two existing World Builder panels; never clone the map or inspector.
  const workspace=byId('world-workspace-layout');
  const zonesButton=byId('world-panel-zones');
  const detailsButton=byId('world-panel-details');
  const isLandscapeCompact=()=>window.matchMedia?.(
    '(orientation: landscape) and (max-width: 1250px)')?.matches===true;
  function setWorkspacePanel(panel){
    const next=isLandscapeCompact()&&['zones','details'].includes(panel)?panel:'none';
    workspace.dataset.panel=next;
    zonesButton.setAttribute('aria-expanded',String(next==='zones'));
    detailsButton.setAttribute('aria-expanded',String(next==='details'));
  }
  on(zonesButton,'click',()=>setWorkspacePanel(
    workspace.dataset.panel==='zones'?'none':'zones'));
  on(detailsButton,'click',()=>setWorkspacePanel(
    workspace.dataset.panel==='details'?'none':'details'));
  on(document,'keydown',event=>{
    if(event.key==='Escape')setWorkspacePanel('none');
  });
  on(window,'resize',()=>{if(!isLandscapeCompact())setWorkspacePanel('none');});
  const transfer=new URLSearchParams(window.location.search).get('return')==='1'
    ?readWorldAssemblerHandoff(window.sessionStorage):null;
  let draft=transfer?.document??readWorldAssemblerDraft(window.localStorage)
    ??createBlankWorldBuilderDraft({id:'nouveau-monde',width:36*28,height:24*21});
  let selectedId=transfer?.areaId??draft.initialAreaId;
  let autosaveAvailable=true;
  function status(message,isError=false){
    toast.textContent=message;toast.dataset.error=String(isError);
  }
  function persist(){
    try{
      saveWorldAssemblerDraft(window.localStorage,draft);
      autosaveAvailable=true;
      byId('save-state').textContent='✓ Monde sauvegardé localement';
    }catch(error){
      autosaveAvailable=false;
      byId('save-state').textContent='⚠ Export JSON recommandé';
      status('Stockage local indisponible : '+error.message+' · utilise Exporter',true);
    }
  }
  function getSelected(){
    return draft.areas.find(area=>area.id===selectedId)??draft.areas[0];
  }
  function select(id){
    if(!draft.areas.some(a=>a.id===id))return;
    selectedId=id;render();
    if(isLandscapeCompact())setWorkspacePanel('details');
  }
  function apply(command,success){
    try{
      const next=command();
      // Validate BEFORE replacing or saving the currently editable draft.
      serializeWorldBuilderDraft(next);
      draft=next;
      if(!draft.areas.some(a=>a.id===selectedId))selectedId=draft.initialAreaId;
      persist();render();status(success);
      return true;
    }catch(error){status(error.message,true);return false;}
  }
  function fillSelect(select,areas,current){
    select.replaceChildren(...areas.map(a=>new Option(areaLabel(a),a.id)));
    if(areas.some(a=>a.id===current))select.value=current;
  }
  function renderAreaList(){
    const list=byId('area-list');list.replaceChildren();
    for(const area of draft.areas){
      const button=document.createElement('button');
      button.type='button';
      if(area.id===selectedId)button.classList.add('active');
      const icon=document.createElement('span');icon.className='mini-icon';icon.textContent=kindIcon(area);
      const copy=document.createElement('span');copy.className='mini-copy';
      const title=document.createElement('strong');title.textContent=areaLabel(area);
      const note=document.createElement('small');note.textContent=
        (area.id===draft.initialAreaId?'★ Départ · ':'')+kindName(area);
      copy.append(title,note);button.append(icon,copy);
      button.addEventListener('click',()=>select(area.id));list.append(button);
    }
    byId('world-area-count').textContent=draft.areas.length+' zone'+(draft.areas.length>1?'s':'');
  }
  function renderGraph(){
    const layout=graphLayout(draft);
    const stage=byId('graph-stage'),svg=byId('graph-links'),nodes=byId('graph-nodes');
    stage.style.width=layout.width+'px';stage.style.height=layout.height+'px';
    svg.setAttribute('width',String(layout.width));svg.setAttribute('height',String(layout.height));
    svg.setAttribute('viewBox','0 0 '+layout.width+' '+layout.height);
    svg.replaceChildren();
    const defs=document.createElementNS(svgNS,'defs'),marker=document.createElementNS(svgNS,'marker');
    marker.setAttribute('id','portal-arrow');marker.setAttribute('markerWidth','8');
    marker.setAttribute('markerHeight','8');marker.setAttribute('refX','6');
    marker.setAttribute('refY','3');marker.setAttribute('orient','auto');
    const arrow=document.createElementNS(svgNS,'path');
    arrow.setAttribute('d','M0 0 L6 3 L0 6 Z');arrow.setAttribute('fill','#77bdb0');
    marker.append(arrow);defs.append(marker);svg.append(defs);
    for(const portal of draft.portals){
      const line=lineForPortal(portal,layout.positions);
      if(line)svg.append(line);
    }
    nodes.replaceChildren();
    for(const area of draft.areas){
      const pos=layout.positions.get(area.id);
      if(pos)nodes.append(nodeButton(area,pos,draft,selectedId,()=>select(area.id)));
    }
    byId('world-portal-count').textContent=draft.portals.length+
      ' passage'+(draft.portals.length>1?'s':'');
  }
  function renderInspector(){
    const area=getSelected();if(!area)return;
    byId('selected-name').textContent=areaLabel(area);
    const host=area.kind==='interior'?draft.portals.find(p=>
      p.targetAreaId===area.id&&draft.areas.some(parent=>
        parent.id===p.sourceAreaId&&parent.kind==='exterior')):null;
    const hostArea=host?draft.areas.find(a=>a.id===host.sourceAreaId):null;
    byId('selected-host').textContent=hostArea
      ?'📍 Situé dans : '+areaLabel(hostArea)+' · entrée via Portal'
      :area.kind==='interior'?'Instance indépendante · relie-la à une autre zone pour y entrer.':
        'Cette région peut contenir des donjons, maisons et autres instances.';
    byId('selected-id').textContent='WorldArea · '+area.id;
    byId('selected-icon').textContent=kindIcon(area);
    byId('area-kind-badge').textContent=area.kind==='interior'?'INSTANCE':'RÉGION';
    byId('selected-size').textContent=Math.round(area.width)+' × '+Math.round(area.height);
    byId('selected-links').textContent=String(draft.portals.filter(p=>
      p.sourceAreaId===area.id||p.targetAreaId===area.id).length);
    const starting=area.id===draft.initialAreaId;
    byId('start-area').disabled=starting;
    byId('start-area').textContent=starting?'★ Zone de départ':'☆ Définir comme départ';
    byId('remove-area').disabled=starting||draft.areas.length===1;
    fillSelect(byId('link-from'),draft.areas,area.id);
    const next=draft.areas.find(a=>a.id!==area.id)?.id??area.id;
    const target=byId('link-to').value;
    fillSelect(byId('link-to'),draft.areas,target!==area.id?target:next);
    byId('connect-areas').disabled=draft.areas.length<2;
    const container=byId('selected-portals');container.replaceChildren();
    const lines=draft.portals.filter(p=>p.sourceAreaId===area.id||p.targetAreaId===area.id);
    if(!lines.length){
      const empty=document.createElement('p');empty.className='empty-links';
      empty.textContent='Aucun passage. Relie cette zone à une autre destination.';
      container.append(empty);
    }
    for(const portal of lines){
      const row=document.createElement('div');row.className='portal-row';
      const text=document.createElement('span');text.className='route-text';
      const title=document.createElement('strong');title.textContent=
        portal.sourceAreaId===area.id?'→ '+pretty(portal.targetAreaId):
          '← '+pretty(portal.sourceAreaId);
      const subtitle=document.createElement('small');
      subtitle.textContent='Passage '+(portal.enabled?'actif':'désactivé');
      text.append(title,subtitle);
      const remove=document.createElement('button');remove.type='button';
      remove.textContent='✕';remove.setAttribute('aria-label','Supprimer le passage '+portal.id);
      remove.addEventListener('click',()=>apply(()=>deletePortal(draft,portal.id),'Passage supprimé.'));
      row.append(text,remove);container.append(row);
    }
  }
  function refreshMapPresets(){
    const select=byId('world-map-preset-select'),previous=select.value;
    try{
      const presets=listAvailableSculptMapPresets(window.localStorage);
      select.replaceChildren(new Option('Choisir une carte enregistrée',''),
        ...presets.map(p=>new Option(p.name+' · '+p.scene.terrain.width+' × '+
          p.scene.terrain.height,p.id)));
      if(presets.some(p=>p.id===previous))select.value=previous;
      byId('world-map-preset-create').disabled=!select.value;
      byId('world-map-preset-info').textContent=presets.length
        ?'Chaque préset crée une WorldArea indépendante. Un donjon sera relié à la zone sélectionnée.'
        :'Enregistre une carte dans Exploration 2,5D → « Mes cartes présets » pour pouvoir la placer ici.';
    }catch(error){
      byId('world-map-preset-create').disabled=true;
      byId('world-map-preset-info').textContent='Bibliothèque indisponible : '+error.message;
    }
  }
  function render(){
    if(!draft.areas.some(a=>a.id===selectedId))selectedId=draft.initialAreaId;
    if(document.activeElement!==byId('world-name'))byId('world-name').value=draft.id;
    renderAreaList();renderGraph();renderInspector();refreshMapPresets();
  }
  on(byId('world-map-preset-select'),'change',()=>{
    byId('world-map-preset-create').disabled=!byId('world-map-preset-select').value;
    try{
      const preset=listAvailableSculptMapPresets(window.localStorage)
        .find(p=>p.id===byId('world-map-preset-select').value);
      if(preset&&!byId('world-map-preset-name').value.trim())
        byId('world-map-preset-name').value=preset.name;
    }catch(error){status(error.message,true);}
  });
  on(byId('world-map-preset-create'),'click',()=>{
    try{
      const preset=listAvailableSculptMapPresets(window.localStorage)
        .find(p=>p.id===byId('world-map-preset-select').value);
      if(!preset){status('Choisis d’abord un préset de carte.',true);return;}
      const before=new Set(draft.areas.map(a=>a.id));
      const name=byId('world-map-preset-name').value.trim()||preset.name;
      const kind=byId('world-map-preset-kind').value;
      let hostAreaId=selectedId;
      let asNewStart=false;
      // Never silently connect a fresh playable map to a historical Area
      // which the current 2.5D runtime cannot load.
      try{sculptWorldAreaScene(getSelected());}
      catch{
        if(!window.confirm('La zone sélectionnée ne peut pas se charger en 2,5D. '+
          'Créer ce préset comme nouveau départ jouable, sans modifier ni supprimer l’ancienne zone ?'))return;
        if(kind==='dungeon'){status('Choisis une zone extérieure compatible comme hôte du donjon.',true);return;}
        hostAreaId=null;
        asNewStart=true;
      }
      const ok=apply(()=>{
        let next=createWorldAreaFromSculptMapPreset(draft,preset,{
          name,kind,hostAreaId
        });
        const created=next.areas.find(a=>!before.has(a.id));
        if(asNewStart&&created)next=setWorldInitialArea(next,created.id);
        return next;
      },asNewStart?'Préset créé comme départ 2,5D · ancienne zone préservée.'
        :kind==='dungeon'
        ?'Donjon créé depuis le préset avec passages aller-retour.'
        :'Zone créée et reliée à la zone sélectionnée · passages aller-retour aux bords.');
      if(ok){
        selectedId=draft.areas.find(a=>!before.has(a.id)&&a.kind!=='interior')?.id??selectedId;
        render();
      }
    }catch(error){status(error.message,true);}
  });
  on(byId('world-playable-route'),'click',()=>{
    if(!window.confirm('Raccorder des régions 2,5D, réparer leurs sorties et relier les cartes jouables ? '+
       'Les passages historiques incompatibles seront réparés, sans modifier leurs cartes. '+
       'Si les rencontres de ce monde sont toutes à 0 %, initialiser aussi les profils des présets. '+
       'Les réglages déjà personnalisés seront conservés.'))return;
    let result;
    const ok=apply(()=>{
      result=makePlayableZoneRoute(draft,{selectedAreaId:selectedId,initializeEncounters:true});
      return result.document;
    },'Parcours jouable créé : deux zones compatibles et Portals aller-retour.');
    if(ok&&result){
      selectedId=result.sourceAreaId;
      render();
      status('✓ Parcours actif entre '+pretty(result.sourceAreaId)+' et '+
        pretty(result.targetAreaId)+'. Zone de départ sélectionnée. '+
        (result.retargetedPortalId?'Ancienne sortie réparée. ':'')+
        'Ouvre Carte 2,5D puis Tester.');
    }
  });
  // The normal World Builder is the owner of Area dimensions. Sculpt 2.5D
  // receives exactly the selected WorldArea; no independent map size.
  let areaSizeTouched=false;
  for(const id of ['area-width','area-height'])
    on(byId(id),'input',()=>{areaSizeTouched=true;});
  on(byId('area-add-form'),'submit',event=>{
    event.preventDefault();
    const name=byId('area-name').value.trim();
    if(!name){status('Entre un nom pour la nouvelle zone.',true);return;}
    const before=new Set(draft.areas.map(a=>a.id));
    const kind=byId('area-kind').value;
    const hostId=selectedId;
    const ok=apply(()=>{
      let next=addWorldArea(draft,{name,kind,
        ...worldAreaSizeFromTiles({width:byId('area-width').value,
          height:byId('area-height').value})});
      const added=next.areas.find(a=>!before.has(a.id));
      if(kind==='dungeon'&&added){
        next=connectWorldAreas(next,{
          sourceAreaId:hostId,targetAreaId:added.id,returnPortal:true
        });
      }
      return next;
    },kind==='dungeon'
        ?'Donjon créé dans cette Area · Portal aller/retour ajouté.'
        :'Nouvelle WorldArea ajoutée au monde.');
    if(ok){selectedId=draft.areas.find(x=>!before.has(x.id))?.id??selectedId;
      byId('area-add-form').reset();areaSizeTouched=false;render();}
  });
  on(byId('area-kind'),'change',()=>{
    const kind=byId('area-kind').value;
    byId('dungeon-host-info').hidden=kind!=='dungeon';
    if(!areaSizeTouched){
      byId('area-width').value=kind==='exterior'?'36':'18';
      byId('area-height').value=kind==='exterior'?'24':'14';
    }
  });
  on(byId('connect-form'),'submit',event=>{
    event.preventDefault();
    const source=byId('link-from').value,target=byId('link-to').value;
    if(source===target){status('Choisis deux zones différentes.',true);return;}
    const duplicate=draft.portals.some(p=>p.sourceAreaId===source&&p.targetAreaId===target);
    apply(()=>connectWorldAreas(draft,{sourceAreaId:source,targetAreaId:target,
      returnPortal:byId('link-back').checked}),
      duplicate?'Passage existant conservé.':'Passage ajouté dans WorldDocument.');
  });
  on(byId('start-area'),'click',()=>{
    apply(()=>setWorldInitialArea(draft,selectedId),'Nouveau point de départ enregistré.');
  });
  on(byId('remove-area'),'click',()=>{
    if(!window.confirm('Supprimer la zone '+pretty(selectedId)+' du monde ?'))return;
    apply(()=>removeWorldArea(draft,selectedId),'Zone supprimée.');
  });
  on(byId('world-name'),'change',()=>{
    const name=byId('world-name').value.trim();
    if(!name){byId('world-name').value=draft.id;return;}
    apply(()=>createWorldBuilderDraft({...draft,id:name}),'Nom du monde enregistré.');
  });
  function openAreaEditor(url){
    try{
      let areaToOpen=selectedId;
      if(url.startsWith('./sculpt-lab.html?')){
        // The map panel never opens the unrelated demo and never shrinks a
        // legacy WorldArea. Offer one of this SAME document's valid Areas.
        const resolution=resolveSculptAreaForEditor(draft,selectedId);
        if(!resolution){
          status('Zone non éditable en 2,5D : aucune autre carte compatible n’existe. '+
            'Ajoute une zone 8–80 × 8–64 cases dans Monde ou crée-la depuis un préset. '+
            'La zone historique reste intacte.',true);
          byId('area-name').focus();
          return;
        }
        if(resolution.redirected){
          const from=getSelected();
          const to=draft.areas.find(a=>a.id===resolution.areaId);
          if(!window.confirm('La zone «'+areaLabel(from)+'» ('+Math.round(from.width)+' × '+
              Math.round(from.height)+' unités monde) n’est pas éditable en 2,5D. '+
              'Ouvrir plutôt la carte existante «'+areaLabel(to)+'» ? '+
              'Le monde, son départ et tous ses passages resteront inchangés.')){
            status('Navigation annulée. Sélectionne une carte 2,5D existante ou crée une nouvelle zone.',true);
            return;
          }
          areaToOpen=to.id;
        }
      }
      saveWorldAssemblerHandoff(window.sessionStorage,draft,areaToOpen);
      persist();
      // Selection is an ephemeral UI choice, never a second WorldDocument.
      if(areaToOpen!==selectedId){selectedId=areaToOpen;render();}
      const next=url.startsWith('./sculpt-lab.html?')
        ?url+'&areaId='+encodeURIComponent(areaToOpen):url;
      window.location.assign(next);
    }catch(error){status(error.message,true);}
  }
  const mapPanelUrl='./sculpt-lab.html?worldAssembler=1&portalUi=compact1&marker=visible2&maps=presets3&panels=world1';
  on(byId('edit-sculpt-area'),'click',()=>openAreaEditor(mapPanelUrl));
  on(byId('world-workspace-map'),'click',()=>openAreaEditor(mapPanelUrl));
  on(byId('edit-area'),'click',()=>{
    openAreaEditor('./builder.html?worldAssembler=1');
  });
  on(byId('export-world'),'click',()=>{
    try{
      const json=serializeWorldBuilderDraft(draft);
      const blob=new Blob([json],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=url;
      link.download=(draft.id.replace(/[^a-z0-9-_]+/gi,'-')||'monde')+'.world.json';
      document.body.append(link);link.click();link.remove();
      URL.revokeObjectURL(url);status('Monde complet exporté au format WorldDocument JSON.');
    }catch(error){status(error.message,true);}
  });
  on(byId('import-world'),'change',async event=>{
    const input=event.currentTarget,file=input.files?.[0];
    if(!file)return;
    try{
      const imported=importWorldBuilderDocument(await file.text());
      apply(()=>imported,'Monde importé et validé. Les passages et zones sont conservés.');
      selectedId=draft.initialAreaId;render();
    }catch(error){status('Import refusé : '+error.message,true);}
    finally{input.value='';}
  });
  on(byId('center-world'),'click',()=>{
    byId('graph-scroll').scrollTo({left:0,top:0,behavior:'smooth'});
    status('Plan recentré sur le début du monde.');
  });
  const dialog=byId('reset-dialog');
  on(byId('reset-world'),'click',()=>dialog.showModal());
  on(dialog,'close',()=>{
    if(dialog.returnValue!=='confirm')return;
    apply(()=>createBlankWorldBuilderDraft({id:'nouveau-monde',width:36*28,height:24*21}),
      'Nouveau monde vierge prêt à assembler.');
    selectedId=draft.initialAreaId;render();
  });
  if(transfer){
    persist();status('Carte modifiée : même monde, même WorldArea et mêmes passages.');
  }else status('Choisis une WorldArea puis utilise le panneau Carte pour la modifier.');
  render();
  // Coming from the map panel with "Nouvelle carte de taille libre" only
  // focuses the native Area form: it never starts a standalone map.
  if(new URLSearchParams(window.location.search).get('createArea')==='1'){
    byId('area-name').focus();
    status('Nouvelle carte : choisis un nom, la largeur et la hauteur, puis ajoute-la au monde.');
  }
  // Read-only test probe. UI selection/layout is never another WorldDocument.
  window.__worldAssemblerProbe=()=>Object.freeze({
    worldId:draft.id,areaIds:draft.areas.map(a=>a.id),
    areaKinds:draft.areas.map(a=>a.kind),portalCount:draft.portals.length,
    initialAreaId:draft.initialAreaId,selectedAreaId:selectedId,
    selectedWidth:getSelected()?.width??null,
    graphNodeCount:byId('graph-nodes').childElementCount,
    graphEdgeCount:byId('graph-links').querySelectorAll('.graph-edge').length,
    saved:autosaveAvailable,source:'WorldDocument'
  });
  return {dispose(){
    for(const cleanup of listenerCleanups)cleanup();
    delete window.__worldAssemblerProbe;
  }};
}
const app=installWorldAssembler();
window.addEventListener('pagehide',()=>app.dispose(),{once:true});
