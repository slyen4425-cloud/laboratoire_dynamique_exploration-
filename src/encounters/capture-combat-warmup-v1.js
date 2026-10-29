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
export function captureEncounterVisualFilesV1({bundle,assetCatalog,party,opponentId}) {
  if(!Array.isArray(bundle?.creatureTransfers)||!Array.isArray(assetCatalog?.assets))return [];
  const creatures=new Map(bundle.creatureTransfers.map(x=>[x.draft?.id,x]));
  const assets=new Map(assetCatalog.assets.map(x=>[x.id,x]));
  const ids=[
    creatures.get(party?.activeCreatureId)?.draft?.presentation?.visual?.back?.assetId,
    creatures.get(opponentId)?.draft?.presentation?.visual?.front?.assetId
  ].filter(Boolean);
  return [...new Set(ids.map(id=>assets.get(id)?.resource?.file).filter(file=>
    typeof file==='string'&&file.startsWith('capture/')&&
    !file.includes('..')&&['webp','png','jpg'].some(ext=>file.toLowerCase().endsWith('.'+ext))))];
}
export function createCaptureCombatWarmupV1({
  documentUrl,fetchImpl=globalThis.fetch,
  schedule=callback=>globalThis.setTimeout(callback,0),
  saveData=false
}={}) {
  if(!documentUrl||typeof fetchImpl!=='function'||typeof schedule!=='function')
    throw new TypeError('Combat warmup needs URL, fetch and scheduler');
  const root=new URL('./',documentUrl);
  let started=false;
  const primedCreatures=new Set();
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
    async warmCreature(opponentId) {
      if(saveData||typeof opponentId!=='string'||!opponentId||primedCreatures.has(opponentId))return [];
      primedCreatures.add(opponentId);
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
        for(const file of files){
          const url=new URL('capture-assets/assets/library/'+file,root);
          try{Promise.resolve(fetchImpl(url,{cache:'force-cache',priority:'low'})).catch(()=>{});}
          catch{/* official Battle owner still validates assets */}
        }
        return files;
      }catch{return [];}
    },
    get started(){return started;}
  });
}
