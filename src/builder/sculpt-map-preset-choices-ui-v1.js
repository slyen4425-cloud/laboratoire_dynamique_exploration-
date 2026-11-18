// Display-only author/player split for the ONE existing Sculpt map-preset
// library. No new storage, map IDs, WorldArea model or publication authority.
// Bundled source-controlled snapshots are candidate showcase content. Personal
// cards come from this browser's pre-existing local preset library.
function heading(label,count){
  const h=document.createElement('strong');
  h.className='map-preset-shelf-title';
  h.textContent=label+' · '+count;
  return h;
}
export function renderSculptMapPresetChoicesV1({
  select,gallery,official=[],personal=[],selectedId=''
}={}){
  if(!select||!gallery)return;
  const placeholder=new Option('Choisir une carte','');
  const groups=[
    {label:'Cartes fournies · vitrine du projet',type:'official',presets:official},
    {label:'Mes créations · sur cet appareil',type:'personal',presets:personal}
  ];
  const options=[placeholder],shelves=[];
  for(const group of groups){
    const optgroup=document.createElement('optgroup');
    optgroup.label=group.label;
    const shelf=document.createElement('section');
    shelf.className='map-preset-shelf';
    shelf.dataset.source=group.type;
    shelf.setAttribute('aria-label',group.label);
    shelf.append(heading(group.label,group.presets.length));
    const cards=document.createElement('div');
    cards.className='map-preset-card-grid';
    if(group.presets.length===0){
      const empty=document.createElement('small');
      empty.className='map-preset-shelf-empty';
      empty.textContent=group.type==='personal'
        ?'Aucune carte personnelle enregistrée ici.'
        :'Aucune carte fournie.';
      cards.append(empty);
    }
    for(const preset of group.presets){
      const option=new Option(preset.name+' · '+preset.scene.terrain.width+
        ' × '+preset.scene.terrain.height,preset.id);
      optgroup.append(option);
      const card=document.createElement('button');
      card.type='button';card.className='map-preset-card';
      card.dataset.presetId=preset.id;
      card.dataset.source=group.type;
      card.setAttribute('aria-pressed',String(preset.id===selectedId));
      card.setAttribute('aria-label',(group.type==='official'
        ?'Carte fournie : ':'Ma création : ')+preset.name);
      const name=document.createElement('strong');
      name.textContent=preset.name;
      const size=document.createElement('small');
      size.textContent=preset.scene.terrain.width+' × '+
        preset.scene.terrain.height+' cases';
      card.append(name,size);
      card.addEventListener('click',()=>{
        select.value=preset.id;
        select.dispatchEvent(new Event('change',{bubbles:true}));
      });
      cards.append(card);
    }
    options.push(optgroup);shelf.append(cards);shelves.push(shelf);
  }
  select.replaceChildren(...options);
  if([...official,...personal].some(p=>p.id===selectedId))
    select.value=selectedId;
  gallery.replaceChildren(...shelves);
}
