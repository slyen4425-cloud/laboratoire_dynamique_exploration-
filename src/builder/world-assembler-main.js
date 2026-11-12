import {
  addWorldArea,removeWorldArea,connectWorldAreas,setWorldInitialArea,
  deletePortal,createBlankWorldBuilderDraft,createWorldBuilderDraft,
  initializeWorldPresetEncounters,setAreaEncounterLevelRange,setAreaEncounterWildStatProfile,
  setWorldCombatArena,createBuildingInteriorLink,
  setWorldAssemblerNodePosition,resetWorldAssemblerNodePositions,
  serializeWorldBuilderDraft,importWorldBuilderDocument
} from './world-builder-draft.js?rev=preset-travel-encounters-v2';
import {
  saveWorldAssemblerHandoff,readWorldAssemblerHandoff,
  saveWorldAssemblerDraft,readWorldAssemblerDraft
} from './world-assembler-handoff.js';
import {createWorldAreaFromSculptMapPreset} from './sculpt-map-preset-library.js?rev=author-maps-three-v1';
import {listAvailableSculptMapPresets} from './sculpt-builtin-map-presets.js?rev=author-maps-three-v1';
import {worldAreaSizeFromTiles} from './world-area-size-command.js';
import {createExplorationWorldDocumentLibraryV1} from './exploration-world-document-library-v1.js';
import {encounterConfigNeedsExplicitInitialization} from './preset-encounter-defaults.js';
import {DEFAULT_WORLD_ENCOUNTER_STAT_PROFILE_V1} from '../encounters/wild-stat-profile-contract-v1.js';
import {makePlayableZoneRoute,resolveSculptAreaForEditor} from './sculpt-playable-zone-route.js?rev=preset-travel-encounters-v2';
import {sculptWorldAreaScene,SCULPT_WORLD_TILE} from './sculpt-world-area-link.js';
import {SCULPT_INTERIOR_SIZE} from '../world/sculpt-interior-area-link.js';
import {objectDefinitionCatalogV1} from '../objects/object-definition-catalog.js?rev=collision-boundary-worldobject-obstacles-v1';

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
  // Optional authoring-only positions travel with this SAME WorldDocument.
  // The Portal graph, movement and map coordinates are never changed.
  for(const area of doc.areas){
    const authored=doc.authoringLayout?.positions?.[area.id];
    if(authored)positions.set(area.id,{x:authored.x,y:authored.y});
  }
  const maxX=Math.max(700,...[...positions.values()].map(p=>p.x+240));
  const maxY=Math.max(420,...[...positions.values()].map(p=>p.y+145));
  return {positions,width:maxX,height:maxY};
}
function nodeButton(area,position,doc,selectedId,onClick,onPointerDown,onKeyDown){
  const el=document.createElement('button');
  el.type='button';el.className='world-node';
  if(area.id===selectedId)el.classList.add('selected');
  el.dataset.areaId=area.id;el.dataset.kind=area.kind;
  el.style.left=position.x+'px';el.style.top=position.y+'px';
  el.setAttribute('aria-label',areaLabel(area)+', '+kindName(area)+'. Déplacer au doigt, à la souris ou avec Alt + flèches.');
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
  el.addEventListener('click',()=>{
    if(el.dataset.justDragged==='true'){delete el.dataset.justDragged;return;}
    onClick();
  });
  el.addEventListener('pointerdown',onPointerDown);
  el.addEventListener('keydown',onKeyDown);
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
  const transfer=new URLSearchParams(window.location.search).get('return')==='1'
    ?readWorldAssemblerHandoff(window.sessionStorage):null;
  let draft=transfer?.document??readWorldAssemblerDraft(window.localStorage)
    ??createBlankWorldBuilderDraft({id:'nouveau-monde',width:36*28,height:24*21});
  let selectedId=transfer?.areaId??draft.initialAreaId;
  let autosaveAvailable=true;
  let linksShown=true;
  let requestedInteriorHostId=null;
  const areaDialog=byId('area-details-dialog');
  const arenaPanel = byId('area-combat-arenas');
  let arenaOptions = null;
  let loadingArenaOptions = false;
  const library=createExplorationWorldDocumentLibraryV1({storage:window.localStorage});
  function refreshWorldLibrary(){
    const picker=byId('world-library-select');
    const selected=picker.value;
    const worlds=library.list();
    picker.replaceChildren(...(worlds.length?worlds.map(w=>
      new Option(w.id+' · '+w.areaCount+' zone(s)',w.id))
      :[new Option('Aucun monde enregistré','')]));
    if(worlds.some(w=>w.id===selected))picker.value=selected;
    else if(worlds.some(w=>w.id===draft.id))picker.value=draft.id;
    picker.disabled=!worlds.length;
    byId('world-library-open').disabled=!worlds.length;
  }
  function libraryStatus(message,error=false){
    const out=byId('world-library-status');
    out.textContent=message;out.dataset.error=String(error);
  }
  function archiveCurrentWorld(){
    try{return library.save(draft);}
    catch(error){
      if(!/existe déjà/.test(error.message))throw error;
      if(!window.confirm('Ce monde est déjà archivé. Remplacer sa version enregistrée par les modifications actuelles ?'))return null;
      return library.save(draft,{replace:true});
    }
  }
  on(byId('world-area-encounter-levels'),'submit',event=>{
    event.preventDefault();
    const minLevel=Number(byId('area-encounter-min-level').value);
    const maxLevel=Number(byId('area-encounter-max-level').value);
    const area=getSelected();
    apply(()=>setAreaEncounterLevelRange(draft,area.id,{minLevel,maxLevel}),
      'Zone '+areaLabel(area)+' : niveau sauvage aléatoire de '+minLevel+' à '+maxLevel+'.');
  });
  on(byId('world-area-wild-stat-profile'),'submit',event=>{
     event.preventDefault();
     const area=getSelected();
     const profile={
       pointsPerLevel:Number(byId('wild-points-per-level').value),
       healthMinimumPct:Number(byId('wild-health-minimum').value),
       defenseMinimumPct:Number(byId('wild-defense-minimum').value),
       speedMinimumPct:Number(byId('wild-speed-minimum').value),
       specialtyMultiplier:Number(byId('wild-specialty-multiplier').value)
     };
     if(area.encounters?.minLevel===undefined)
       return status('Configure d’abord les niveaux minimum et maximum de la zone.',true);
     apply(()=>setAreaEncounterWildStatProfile(draft,area.id,profile),
       'Profil sauvage de '+areaLabel(area)+' enregistré dans le WorldDocument.');
   });
   on(byId('world-encounters-initialize'),'click',()=>{
    if(!encounterConfigNeedsExplicitInitialization(draft.encounterConfig)){
      libraryStatus('Rencontres déjà configurées : paramètres conservés.');
      return;
    }
    if(!window.confirm('Les rencontres de ce monde sont à 0 %. Initialiser les probabilités par terrain et les éléments depuis les profils officiels ? Tu pourras ensuite tout modifier dans l’éditeur.'))return;
    const ok=apply(()=>initializeWorldPresetEncounters(draft),
      'Rencontres du monde initialisées avec les profils officiels, sans valeur cachée.');
    if(ok)libraryStatus('✓ Rencontres activées dans le WorldDocument. Enregistre ton monde dans Mes mondes avant de changer de carte.');
  });
  on(byId('world-library-save'),'click',()=>{
    try{
      const saved=archiveCurrentWorld();
      if(!saved){libraryStatus('Sauvegarde annulée : monde archivé conservé.');return;}
      refreshWorldLibrary();
      libraryStatus('✓ Monde '+saved.id+' enregistré dans Mes mondes.');
    }catch(error){libraryStatus(error.message,true);}
  });
  on(byId('world-library-open'),'click',()=>{
    const id=byId('world-library-select').value;
    if(!id){libraryStatus('Choisis un monde enregistré.',true);return;}
    try{
      const opened=library.activate(id);
      draft=opened;selectedId=draft.initialAreaId;
      persist();render();refreshWorldLibrary();
      libraryStatus('✓ Monde '+opened.id+' chargé sans supprimer les autres.');
    }catch(error){libraryStatus(error.message,true);}
  });
  function status(message,isError=false){
    toast.textContent=message;toast.dataset.error=String(isError);
    // This is feedback, never another settings panel or second WorldDocument.
    const modalStatus=byId('area-editor-feedback');
    modalStatus.textContent=message;
    modalStatus.dataset.error=String(isError);
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
  on(byId('world-play-open'),'click',event=>{
    persist();
    if(!autosaveAvailable){
      event.preventDefault();
      status('Monde non sauvegardé : exporte ton travail avant de jouer.',true);
    }
  });
  function getSelected(){
    return draft.areas.find(area=>area.id===selectedId)??draft.areas[0];
  }
  function select(id){
    if(!draft.areas.some(a=>a.id===id))return;
    if(id!==selectedId){
      requestedInteriorHostId=null;
      byId('area-content-filter').value='all';
      byId('combat-arena-building').value='';
    }
    selectedId=id;render();
  }
  // One actual native dialog owns ALL existing Area controls.
  function openAreaDetails(id){
    if(!draft.areas.some(a=>a.id===id))return;
    select(id);
    if(!areaDialog.open)areaDialog.showModal();
  }
  on(byId('open-selected-area'),'click',()=>openAreaDetails(selectedId));
  on(byId('new-world-area'),'click',()=>{
    openAreaDetails(selectedId);
    requestedInteriorHostId=null;
    byId('area-creation-details').open=true;
    byId('area-kind').value='exterior';
    byId('area-kind').dispatchEvent(new Event('change'));
    byId('area-name').focus();
  });
  on(byId('close-area-editor'),'click',()=>areaDialog.close());
  on(areaDialog,'close',()=>{
    requestedInteriorHostId=null;
    byId('area-creation-details').open=false;
  });
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
      button.addEventListener('click',()=>openAreaDetails(area.id));list.append(button);
    }
    byId('world-area-count').textContent=draft.areas.length+' zone'+(draft.areas.length>1?'s':'');
  }
  function startGraphNodeDrag(event,area,node,origin){
    if(event.pointerType==='mouse'&&event.button!==0)return;
    if(typeof node.setPointerCapture!=='function')return;
    const pointerId=event.pointerId,beginX=event.clientX,beginY=event.clientY;
    let moved=false,current=origin;
    const shift=next=>{
      current={
        x:Math.max(16,Math.min(12000,Math.round(origin.x+next.clientX-beginX))),
        y:Math.max(16,Math.min(12000,Math.round(origin.y+next.clientY-beginY)))
      };
      node.style.left=current.x+'px';node.style.top=current.y+'px';
    };
    const onMove=next=>{
      if(next.pointerId!==pointerId)return;
      if(!moved&&Math.hypot(next.clientX-beginX,next.clientY-beginY)<7)return;
      moved=true;next.preventDefault();node.dataset.dragging='true';shift(next);
    };
    const clean=()=>{
      node.removeEventListener('pointermove',onMove);
      node.removeEventListener('pointerup',onUp);
      node.removeEventListener('pointercancel',onCancel);
      if(node.hasPointerCapture?.(pointerId))node.releasePointerCapture(pointerId);
    };
    const onUp=next=>{
      if(next.pointerId!==pointerId)return;
      clean();
      delete node.dataset.dragging;
      if(!moved)return;
      node.dataset.justDragged='true';
      selectedId=area.id;
      apply(()=>setWorldAssemblerNodePosition(draft,area.id,current),
        'Position de '+areaLabel(area)+' enregistrée dans le monde · passages inchangés.');
    };
    const onCancel=next=>{
      if(next.pointerId!==pointerId)return;
      clean();renderGraph();
    };
    node.addEventListener('pointermove',onMove);
    node.addEventListener('pointerup',onUp);
    node.addEventListener('pointercancel',onCancel);
    node.setPointerCapture(pointerId);
  }
  function moveGraphNodeByKeyboard(event,area,origin){
    if(!event.altKey)return;
    const shift={ArrowLeft:[-24,0],ArrowRight:[24,0],
      ArrowUp:[0,-24],ArrowDown:[0,24]}[event.key];
    if(!shift)return;
    event.preventDefault();
    selectedId=area.id;
    apply(()=>setWorldAssemblerNodePosition(draft,area.id,{
      x:Math.max(16,Math.min(12000,origin.x+shift[0])),
      y:Math.max(16,Math.min(12000,origin.y+shift[1]))
    }), 'Disposition de '+areaLabel(area)+' enregistrée.');
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
    if(linksShown)for(const portal of draft.portals){
      const line=lineForPortal(portal,layout.positions);
      if(line)svg.append(line);
    }
    nodes.replaceChildren();
    for(const area of draft.areas){
      const pos=layout.positions.get(area.id);
      if(pos)nodes.append(nodeButton(area,pos,draft,selectedId,
        ()=>openAreaDetails(area.id),
        event=>startGraphNodeDrag(event,area,event.currentTarget,pos),
        event=>moveGraphNodeByKeyboard(event,area,pos)));
    }
    byId('world-portal-count').textContent=draft.portals.length+
      ' passage'+(draft.portals.length>1?'s':'');
  }
  function renderAreaContents(area){
    // UI-only inventory: every object comes from WorldArea.objects; every
    // connected instance comes from WorldDocument.portals. Filters NEVER write.
    const panel=byId('selected-contents');
    panel.replaceChildren();
    const filter=byId('area-content-filter').value;
    let visible=0;
    const placed=area.objects??[];
    const buildings=placed.map(item=>({
      placement:item,definition:objectDefinitionCatalogV1.get(item.objectDefinitionId)
    })).filter(item=>item.definition?.kind==='building');
    const interiors=new Map();
    for(const portal of draft.portals){
      if(portal.sourceAreaId!==area.id)continue;
      const target=draft.areas.find(a=>a.id===portal.targetAreaId);
      if(target?.kind==='interior'&&target.id!==area.id)interiors.set(target.id,target);
    }
    const addRow=(category,symbol,title,subtitle,onOpen)=>{
      if(filter!=='all'&&filter!==category)return;
      visible++;
      const row=document.createElement('div');row.className='area-content-entry';
      row.dataset.category=category;
      const icon=document.createElement('span');icon.className='content-icon';icon.textContent=symbol;
      const info=document.createElement('span');info.className='content-text';
      const name=document.createElement('strong');name.textContent=title;
      const note=document.createElement('small');note.textContent=subtitle;
      info.append(name,note);row.append(icon,info);
      if(onOpen){
        const button=document.createElement('button');button.type='button';
        button.textContent=(category==='interior'||category==='dungeon')
          ?'Gérer':'Carte 2,5D';
        button.addEventListener('click',onOpen);
        row.append(button);
      }
      panel.append(row);
    };
    for(const {placement,definition} of buildings){
      const arena=definition.library?.folderId?.includes('/arenas/');
      addRow(arena?'arena':'building',arena?'🏟':'🏠',
        definition.label??placement.objectDefinitionId,
        'Objet de cette carte · '+placement.id,
        ()=>openAreaEditor(mapPanelUrl));
    }
    for(const inside of interiors.values()){
      const dungeon=inside.siteKind==='dungeon';
      addRow(dungeon?'dungeon':'interior',dungeon?'🗝':'🚪',
        areaLabel(inside),kindName(inside)+' · Portal existant',
        ()=>openAreaDetails(inside.id));
    }
    const other=placed.length-buildings.length;
    if(other>0)addRow('other','🌿',other+' autres objets',
      'Décors, obstacles et éléments de la carte · ouvre Carte 2,5D',
      ()=>openAreaEditor(mapPanelUrl));
    if(!visible){
      const empty=document.createElement('p');empty.className='empty-links';
      empty.textContent=filter==='all'
        ?'Aucun bâtiment ou intérieur dans cette zone. Place des objets depuis la carte 2,5D.'
        :'Aucun élément dans cette catégorie. Les autres éléments sont conservés.';
      panel.append(empty);
    }
    byId('selected-content-count').textContent=
      (placed.length+interiors.size)+' élément'+(placed.length+interiors.size>1?'s':'');
  }
  on(byId('area-content-filter'),'change',()=>renderAreaContents(getSelected()));
  function renderAreaEvents(area){
    // Read-only inventory from the SAME WorldDocument events.
    // Event creation and trigger editing stay in the native map editor.
    const events=(draft.events??[]).filter(event=>event.sourceAreaId===area.id);
    const host=byId('selected-events');host.replaceChildren();
    const names={
      'on-enter':'Entrée dans une zone',
      'on-portal-enter':'Arrivée par passage',
      'on-interact':'Interaction'
    };
    for(const event of events){
      const row=document.createElement('div');row.className='area-content-entry';
      const icon=document.createElement('span');icon.className='content-icon';
      icon.textContent='🎬';
      const meta=document.createElement('span');meta.className='content-text';
      const title=document.createElement('strong');
      title.textContent=names[event.activation]??'Événement';
      const detail=document.createElement('small');
      detail.textContent=(event.enabled?'Actif':'Désactivé')+' · '+
        (event.action?.text??event.id).slice(0,100);
      meta.append(title,detail);
      row.append(icon,meta);
      // Events remain visible but cannot reopen the retired 2D editor.
      host.append(row);
    }
    if(!events.length){
      const empty=document.createElement('p');empty.className='empty-links';
      empty.textContent='Aucun événement dans cette zone.';
      host.append(empty);
    }
    byId('selected-event-count').textContent=String(events.length);
  }
  function renderArenaSelect(id, selected, inherited) {
    const select = byId(id);
    const options = arenaOptions ?? [];
    select.replaceChildren(new Option(inherited, ''), ...options.map(arena => new Option(arena.label, arena.id)));
    if (selected && !options.some(arena => arena.id === selected)) {
      const unavailable = new Option('Décor enregistré indisponible', selected);
      unavailable.disabled = true;
      select.add(unavailable);
    }
    select.value = selected ?? '';
    select.disabled = !options.length;
  }
  function selectedArenaBuilding(area = getSelected()) {
    return area.objects.find(object => object.id === byId('combat-arena-building').value);
  }
  function renderBuildingArena(area = getSelected()) {
    const building = selectedArenaBuilding(area);
    renderArenaSelect('building-combat-arena', building?.overrides?.combatArenaId, 'Hériter de la zone');
    byId('building-combat-arena').disabled ||= !building;
    byId('create-combat-arena-interior').hidden = !building || draft.portals.some(portal =>
      portal.sourceAreaId === area.id && portal.trigger.kind === 'object-anchor' &&
      portal.trigger.objectId === building.id);
  }
  function renderCombatArenas(area) {
    renderArenaSelect('world-combat-arena', draft.defaultCombatArenaId, 'Selon le terrain');
    renderArenaSelect('area-combat-arena', area.encounters.combatArenaId,
      area.kind === 'interior' ? 'Hériter du bâtiment ou de la zone' : 'Hériter du monde');
    const buildings = area.kind === 'exterior' ? area.objects.map(placement => ({
      placement, definition: objectDefinitionCatalogV1.get(placement.objectDefinitionId)
    })).filter(({definition}) => definition?.kind === 'building' && definition.doorAnchors?.length) : [];
    const picker = byId('combat-arena-building');
    const previous = picker.value;
    picker.replaceChildren(...buildings.map(({placement, definition}, index) =>
      new Option(`${definition.label} · ${index + 1}`, placement.id)));
    if (buildings.some(({placement}) => placement.id === previous)) picker.value = previous;
    byId('building-combat-arenas').hidden = !buildings.length;
    renderBuildingArena(area);
  }
  on(arenaPanel, 'toggle', async () => {
    if (!arenaPanel.open || arenaOptions || loadingArenaOptions) return;
    loadingArenaOptions = true;
    const output = byId('combat-arena-catalog-status');
    output.textContent = 'Chargement du catalogue du Labo Combat…';
    try {
      const {demoPresentationAssets} = await import('../../combat-preview/examples/dom-demo/demo-assets.js');
      arenaOptions = demoPresentationAssets.arenaOptions();
      renderCombatArenas(getSelected());
      output.textContent = '';
    } catch {
      output.textContent = 'Catalogue du Labo Combat indisponible. Recharge le World Builder pour réessayer.';
    } finally {
      loadingArenaOptions = false;
    }
  });
  on(byId('combat-arena-building'), 'change', () => renderBuildingArena());
  for (const [id, scope] of [
    ['world-combat-arena', () => ({})],
    ['area-combat-arena', () => ({areaId:selectedId})],
    ['building-combat-arena', () => ({areaId:selectedId, buildingId:selectedArenaBuilding()?.id})]
  ]) {
    on(byId(id), 'change', event => {
      const arenaId = event.target.value;
      if (event.target.disabled || (arenaId && !arenaOptions?.some(arena => arena.id === arenaId))) return;
      apply(() => setWorldCombatArena(draft, {...scope(), arenaId}), 'Décor de combat enregistré.');
    });
  }
  on(byId('create-combat-arena-interior'), 'click', () => {
    const building = selectedArenaBuilding();
    const anchor = objectDefinitionCatalogV1.get(building?.objectDefinitionId)?.doorAnchors?.[0];
    if (!anchor) return;
    apply(() => createBuildingInteriorLink(draft, {
      sourceAreaId:selectedId, buildingId:building.id, anchorId:anchor.id,
      interiorSize:{width:SCULPT_INTERIOR_SIZE.width * SCULPT_WORLD_TILE.width,
        height:SCULPT_INTERIOR_SIZE.height * SCULPT_WORLD_TILE.height}
    }), 'Intérieur relié à la porte du bâtiment.');
  });
  function renderInspector(){
    const area=getSelected();if(!area)return;
    byId('selected-name').textContent=areaLabel(area);
    const host=area.kind==='interior'?draft.portals.find(p=>
      p.targetAreaId===area.id&&p.sourceAreaId!==area.id&&
      draft.areas.some(other=>other.id===p.sourceAreaId)):null;
    const hostArea=host?draft.areas.find(a=>a.id===host.sourceAreaId):null;
    byId('selected-host').textContent=hostArea
      ?'🔗 Reliée à : '+areaLabel(hostArea)+' · Portal existant'
      :area.kind==='interior'?'Instance sans passage entrant : relie-la pour y accéder.':
        'Cette région peut contenir des donjons, maisons et autres instances.';
    // Only real Portal edges authorize zone-to-zone navigation.
    const neighborIds=[...new Set(draft.portals.flatMap(portal=>
      portal.sourceAreaId===area.id?[portal.targetAreaId]:
      portal.targetAreaId===area.id?[portal.sourceAreaId]:[]
    ))].filter(id=>id!==area.id&&draft.areas.some(a=>a.id===id));
    const neighborPicker=byId('selected-neighbor-area');
    const previous=neighborPicker.value;
    neighborPicker.replaceChildren(...(neighborIds.length
      ?neighborIds.map(id=>new Option(areaLabel(draft.areas.find(a=>a.id===id)),id))
      :[new Option('Aucune zone reliée','')]));
    if(neighborIds.includes(previous))neighborPicker.value=previous;
    neighborPicker.disabled=!neighborIds.length;
    byId('open-neighbor-area').disabled=!neighborIds.length;
    byId('selected-id').textContent='WorldArea · '+area.id;
    byId('selected-icon').textContent=kindIcon(area);
    byId('area-kind-badge').textContent=area.kind==='interior'?'INSTANCE':'RÉGION';
    byId('selected-size').textContent=Math.round(area.width)+' × '+Math.round(area.height);
    renderAreaContents(area);
    renderAreaEvents(area);
    renderCombatArenas(area);
    byId('area-encounter-min-level').value=String(area.encounters?.minLevel??1);
    byId('area-encounter-max-level').value=String(area.encounters?.maxLevel??5);
    const wildProfile=area.encounters?.wildStatProfile??DEFAULT_WORLD_ENCOUNTER_STAT_PROFILE_V1;
     for(const [id,value] of Object.entries({
       'wild-points-per-level':wildProfile.pointsPerLevel,
       'wild-health-minimum':wildProfile.healthMinimumPct,
       'wild-defense-minimum':wildProfile.defenseMinimumPct,
       'wild-speed-minimum':wildProfile.speedMinimumPct,
       'wild-specialty-multiplier':wildProfile.specialtyMultiplier
     }))byId(id).value=String(value);
     byId('area-wild-stat-profile-status').textContent=area.encounters?.wildStatProfile
       ?'✓ Profil sauvegardé pour cette zone.':'Profil par défaut : 20 points/niveau, minimum 15 % PV/Défense/Vitesse.';
     byId('area-encounter-levels-status').textContent=
      area.encounters?.minLevel===undefined
        ?'Aucune plage personnalisée enregistrée pour cette zone.'
        :'Niveaux '+area.encounters.minLevel+' à '+area.encounters.maxLevel+
         ' · tirage uniforme après déclenchement de rencontre.';
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
      remove.addEventListener('click',()=>{
        if(!window.confirm('Supprimer ce passage existant ? Les cartes et les autres passages seront conservés.'))return;
        apply(()=>deletePortal(draft,portal.id),'Passage supprimé.');
      });
      const linkedId=portal.sourceAreaId===area.id?portal.targetAreaId:portal.sourceAreaId;
      const open=document.createElement('button');open.type='button';
      open.className='portal-open-area';open.textContent='Voir zone';
      open.setAttribute('aria-label','Ouvrir la zone '+pretty(linkedId));
      open.addEventListener('click',()=>openAreaDetails(linkedId));
      row.append(text,open,remove);container.append(row);
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
    const dormant=encounterConfigNeedsExplicitInitialization(draft.encounterConfig);
    byId('world-encounters-status').textContent=dormant
      ?'⚠ Rencontres à 0 % : aucune créature sauvage ne peut apparaître sur cette carte tant que tu ne les configures pas.'
      :'✓ Rencontres configurées dans ce monde ; les apparitions dépendent des chances et du Bestiaire officiel.';
    byId('world-encounters-initialize').hidden=!dormant;
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
    const hostId=requestedInteriorHostId??selectedId;
    const shouldLinkInterior=kind==='interior'&&requestedInteriorHostId===hostId;
    const ok=apply(()=>{
      let next=addWorldArea(draft,{name,kind,
        ...worldAreaSizeFromTiles({width:byId('area-width').value,
          height:byId('area-height').value})});
      const added=next.areas.find(a=>!before.has(a.id));
      if((kind==='dungeon'||shouldLinkInterior)&&added){
        next=connectWorldAreas(next,{
          sourceAreaId:hostId,targetAreaId:added.id,returnPortal:true
        });
      }
      return next;
    },(kind==='dungeon'||shouldLinkInterior)
        ?'Instance créée dans cette Area · Portals aller/retour ajoutés.'
        :'Nouvelle WorldArea ajoutée au monde.');
    if(ok){requestedInteriorHostId=null;
      selectedId=draft.areas.find(x=>!before.has(x.id))?.id??selectedId;
      byId('area-add-form').reset();areaSizeTouched=false;
      byId('area-creation-details').open=false;render();}
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
      if(!url.startsWith('./sculpt-lab.html?'))throw Error('Ancien éditeur 2D retiré : seule la carte 2,5D officielle est disponible.');
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
  on(byId('open-neighbor-area'),'click',()=>{
    const target=byId('selected-neighbor-area').value;
    if(target)openAreaDetails(target);
  });
  on(byId('place-area-object'),'click',()=>openAreaEditor(mapPanelUrl));
  on(byId('create-area-instance'),'click',()=>{
    requestedInteriorHostId=selectedId;
    byId('area-creation-details').open=true;
    byId('area-kind').value='interior';
    byId('area-kind').dispatchEvent(new Event('change'));
    byId('area-name').value='';
    byId('area-name').focus();
    byId('area-add-form').scrollIntoView({behavior:'smooth',block:'center'});
    status('Intérieur de '+areaLabel(getSelected())+
      ' : donne un nom et valide. L’aller-retour sera créé dans le WorldDocument.');
  });
  on(byId('toggle-graph-links'),'click',()=>{
    linksShown=!linksShown;
    byId('toggle-graph-links').setAttribute('aria-pressed',String(linksShown));
    byId('toggle-graph-links').textContent=linksShown?'⇄ Masquer les flèches':'⇄ Afficher les passages';
    renderGraph();
    status(linksShown?'Passages visibles sur le plan.':'Flèches masquées sur le plan ; vrais Portals conservés.');
  });
  on(byId('reset-graph-layout'),'click',()=>{
    if(!draft.authoringLayout)return status('Les zones utilisent déjà la disposition automatique.');
    if(!window.confirm('Réorganiser automatiquement les icônes ? Les cartes, bâtiments et passages resteront inchangés.'))return;
    apply(()=>resetWorldAssemblerNodePositions(draft),'Disposition automatique rétablie · monde inchangé.');
  });
  const structureToggle=byId('toggle-world-structure');
  const structurePanel=byId('world-structure-panel');
  const workspace=structurePanel.closest('.workspace');
  const setStructureOpen=open=>{
    workspace.classList.toggle('structure-open',open);
    structureToggle.setAttribute('aria-expanded',String(open));
  };
  on(structureToggle,'click',()=>setStructureOpen(!workspace.classList.contains('structure-open')));
  on(document,'keydown',event=>{
    if(event.key==='Escape'&&workspace.classList.contains('structure-open'))
      setStructureOpen(false);
  });
  on(byId('graph-scroll'),'pointerdown',()=>{
    if(workspace.classList.contains('structure-open'))setStructureOpen(false);
  });
  on(byId('area-list'),'click',()=>setStructureOpen(false));
    on(byId('edit-sculpt-area'),'click',()=>openAreaEditor(mapPanelUrl));
  on(byId('world-workspace-map'),'click',()=>openAreaEditor(mapPanelUrl));
  on(byId('edit-area'),'click',()=>openAreaEditor(mapPanelUrl));
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
    try{
      const archived=archiveCurrentWorld();
      if(!archived){libraryStatus('Nouveau monde annulé : modifications du monde actif conservées.');return;}
      apply(()=>createBlankWorldBuilderDraft({
        id:'nouveau-monde-'+crypto.randomUUID().slice(0,8),
        width:36*28,height:24*21
      }), 'Nouveau monde vierge prêt à assembler. L’ancien est archivé.');
      selectedId=draft.initialAreaId;render();refreshWorldLibrary();
    }catch(error){libraryStatus(error.message,true);}
  });
  if(transfer){
    persist();status('Carte modifiée : même monde, même WorldArea et mêmes passages.');
  }else status('Choisis une WorldArea puis utilise le panneau Carte pour la modifier.');
  render();
  try{refreshWorldLibrary();}
  catch(error){libraryStatus(error.message,true);}
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
    areaEditorOpen:areaDialog.open,
    selectedEventCount:(draft.events??[]).filter(e=>e.sourceAreaId===selectedId).length,
    saved:autosaveAvailable,source:'WorldDocument'
  });
  return {dispose(){
    for(const cleanup of listenerCleanups)cleanup();
    delete window.__worldAssemblerProbe;
  }};
}
const app=installWorldAssembler();
window.addEventListener('pagehide',()=>app.dispose(),{once:true});
