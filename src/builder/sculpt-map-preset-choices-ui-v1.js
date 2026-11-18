// One native card picker for the official and local map-preset catalogues.
// The card gallery is the ONE selection owner; no parallel <select> or
// shadow state. Native <details> keeps the two groups independently folded.
// Cards never write to a WorldDocument or publish personal maps as official.
export function renderSculptMapPresetChoicesV1({
  gallery,official=[],personal=[],selectedId=null
}={}){
  if(!gallery)return;
  const groups=[
    {label:'Cartes proposées par l’éditeur',type:'official',presets:official},
    {label:'Mes cartes enregistrées sur cet appareil',type:'personal',presets:personal}
  ];
  const all=[...official,...personal];
  const previous=selectedId===null?(gallery.dataset.selectedId??''):selectedId;
  gallery.dataset.selectedId=all.some(p=>p.id===previous)?previous:'';
  const expanded=new Set([...gallery.querySelectorAll('.map-preset-shelf[open]')]
    .map(item=>item.dataset.source));
  const shelves=[];
  for(const group of groups){
    const shelf=document.createElement('details');
    shelf.className='map-preset-shelf';
    shelf.dataset.source=group.type;
    shelf.setAttribute('aria-label',group.label);
    const containsSelected=group.presets.some(p=>p.id===gallery.dataset.selectedId);
    shelf.open=expanded.has(group.type)||containsSelected;
    const summary=document.createElement('summary');
    summary.className='map-preset-shelf-title';
    summary.textContent=group.label+' · '+group.presets.length;
    const cards=document.createElement('div');
    cards.className='map-preset-card-grid';
    if(!group.presets.length){
      const empty=document.createElement('small');
      empty.className='map-preset-shelf-empty';
      empty.textContent=group.type==='personal'
        ?'Aucune carte personnelle enregistrée ici.':'Aucune carte fournie.';
      cards.append(empty);
    }
    for(const preset of group.presets){
      const card=document.createElement('button');
      card.type='button';card.className='map-preset-card';
      card.dataset.presetId=preset.id;
      card.dataset.source=group.type;
      card.setAttribute('aria-pressed',String(preset.id===gallery.dataset.selectedId));
      card.setAttribute('aria-label',(group.type==='official'
        ?'Carte fournie : ':'Ma création : ')+preset.name);
      const family=preset.scene.surface?.baseTerrainFamilyId;
      const themes={snow:'❄️',forest:'🌲',plain:'🌾',sand:'🏜️',
        mountain:'⛰️',volcano:'🌋',sea:'🌊'};
      const safeFamily=Object.hasOwn(themes,family)?family:'plain';
      card.dataset.family=safeFamily;
      const art=document.createElement('span');
      art.className='map-preset-card-art';
      art.setAttribute('aria-hidden','true');
      art.textContent=themes[safeFamily];
      const badge=document.createElement('small');
      badge.className='map-preset-card-badge';
      badge.textContent=group.type==='official'?'CARTE FOURNIE':'MA CRÉATION';
      const name=document.createElement('strong');
      name.textContent=preset.name;
      const size=document.createElement('small');
      size.textContent=preset.scene.terrain.width+' × '+
        preset.scene.terrain.height+' cases';
      card.append(art,badge,name,size);
      card.addEventListener('click',()=>{
        gallery.dataset.selectedId=preset.id;
        for(const sibling of gallery.querySelectorAll('.map-preset-card'))
          sibling.setAttribute('aria-pressed',
            String(sibling.dataset.presetId===preset.id));
        gallery.dispatchEvent(new Event('change',{bubbles:true}));
      });
      cards.append(card);
    }
    shelf.append(summary,cards);shelves.push(shelf);
  }
  gallery.replaceChildren(...shelves);
}
