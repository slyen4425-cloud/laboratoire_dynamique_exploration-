// Network-only warmup of the official packaged Combat resource graph.
// This never mounts Combat, changes its data, or adds another authoring source.
export const CAPTURE_COMBAT_WARMUP_PATHS_V1=Object.freeze([
  'combat-preview/data/capture/showcase/encounter-bundle.v1.json',
  'combat-preview/examples/dom-demo/capture-editor-v2.html',
  'combat-preview/examples/dom-demo/demo.css',
  'combat-preview/examples/dom-demo/capture-editor-v2.css',
  'capture-assets/data/assets/catalog/global-visual-assets.v1.json'
]);
// A warmed image is never a substitute for the official visual asset owner.
// Only an existing author-approved front/back reference may be requested.
export function captureEncounterVisualFilesV1({bundle,assetCatalog,party,opponentId,firstPaintOnly=false}) {
  if(!Array.isArray(bundle?.creatureTransfers)||!Array.isArray(assetCatalog?.assets))return [];
  const creatures=new Map(bundle.creatureTransfers.map(x=>[x.draft?.id,x]));
  const assets=new Map(assetCatalog.assets.map(x=>[x.id,x]));
  // Decode actual art for the current pair, including the animation strips
  // that otherwise first appear only after entering the Battle document.
  // All asset IDs still originate from the author Showcase, not a local list.
  function idsFor(creatureId,view) {
    const visual=creatures.get(creatureId)?.draft?.presentation?.visual;
    return [
      visual?.[view]?.assetId,visual?.icon?.assetId,
      ...(firstPaintOnly?[]:[
        visual?.[view==='back'?'movementBack':'movement']?.assetId,
        visual?.[view==='back'?'rangedAttackBack':'rangedAttack']?.assetId
      ])
    ].filter(Boolean);
  }
  const selected=[party?.activeCreatureId,opponentId].map(id=>creatures.get(id)).filter(Boolean);
  const skillById=new Map((bundle.skillTransfers??[]).map(transfer=>[transfer.draft?.id,transfer]));
  const equippedIcons=selected.flatMap(transfer=>(transfer.loadout?.slots??[])
    .map(slot=>skillById.get(slot.skillId)?.draft?.presentation?.visual?.icon?.assetId)
    .filter(Boolean));
  const ids=[
    ...idsFor(party?.activeCreatureId,'back'),
    ...idsFor(opponentId,'front'),
    ...equippedIcons
  ];
  return [...new Set(ids.map(id=>assets.get(id)?.resource?.file).filter(file=>
    typeof file==='string'&&file.startsWith('capture/')&&
    !file.includes('..')&&['webp','png','jpg'].some(ext=>file.toLowerCase().endsWith('.'+ext))))];
}
export function createCaptureCombatWarmupV1({
  documentUrl,fetchImpl=globalThis.fetch,
  schedule=callback=>globalThis.setTimeout(callback,0),
  saveData=false,
  decodeImage=typeof globalThis.Image==='function'
    ? url=>{
      const image=new globalThis.Image();
      image.decoding='async';
      image.src=url.href;
      return image.decode();
    }
    : null
}={}) {
  if(!documentUrl||typeof fetchImpl!=='function'||typeof schedule!=='function')
    throw new TypeError('Combat warmup needs URL, fetch and scheduler');
  const root=new URL('./',documentUrl);
  let started=false;
  const primedCreatures=new Map();
  return Object.freeze({
    start() {
      if(started||saveData)return false;
      started=true;
      schedule(()=>{
        // Low priority and failure-isolated: Battle boot still validates the
        // official source rather than falling back to this speculative fetch.
        for(const path of CAPTURE_COMBAT_WARMUP_PATHS_V1) {
          const url=new URL(path,root);
          try{Promise.resolve(fetchImpl(url,{cache:'force-cache',priority:'low'}))
            .catch(()=>{});}catch{/* speculative load never blocks movement */}
        }
      });
      return true;
    },
    warmCreature(opponentId) {
      if(saveData||typeof opponentId!=='string'||!opponentId)return Promise.resolve([]);
      // Return the pending decode to every caller, including a rapid Battle tap.
      // Do not mistake an in-flight warmup for a completed one.
      if(primedCreatures.has(opponentId))return primedCreatures.get(opponentId);
      const pending=(async()=>{
      try {
        const json=async path=>{
          const response=await fetchImpl(new URL(path,root),{cache:'force-cache',priority:'low'});
          if(!response.ok)throw new Error('Speculative resource not available');
          return response.json();
        };
        const [bundle,assetCatalog,party]=await Promise.all([
          json('combat-preview/data/capture/showcase/encounter-bundle.v1.json'),
          json('capture-assets/data/assets/catalog/global-visual-assets.v1.json'),
          json('combat-preview/examples/dom-demo/party.preview.v1.json')
        ]);
        const files=captureEncounterVisualFilesV1({bundle,assetCatalog,party,opponentId});
        await Promise.allSettled(files.map(file=>{
          const url=new URL('capture-assets/assets/library/'+file,root);
          // Decode into the browser's image cache when supported. HTTP-only
          // fetch prewarm does not prepare WebP decoding for first paint.
          try {
            return Promise.resolve(typeof decodeImage==='function'
              ? decodeImage(url)
              : fetchImpl(url,{cache:'force-cache',priority:'low'}));
          } catch(error) {return Promise.reject(error);}
        }));
        return files;
      }catch{return [];}
      })();
      primedCreatures.set(opponentId,pending);
      return pending;
    },
    get started(){return started;}
  });
}
