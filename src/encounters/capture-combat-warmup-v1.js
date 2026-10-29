// Network-only warmup of the official packaged Combat resource graph.
// This never mounts Combat, changes its data, or adds another authoring source.
export const CAPTURE_COMBAT_WARMUP_PATHS_V1=Object.freeze([
  'combat-preview/data/capture/showcase/encounter-bundle.v1.json',
  'combat-preview/examples/dom-demo/capture-editor-v2.html',
  'combat-preview/examples/dom-demo/demo.css',
  'combat-preview/examples/dom-demo/capture-editor-v2.css',
  'capture-assets/data/assets/catalog/global-visual-assets.v1.json'
]);
export function createCaptureCombatWarmupV1({
  documentUrl,fetchImpl=globalThis.fetch,
  schedule=callback=>globalThis.setTimeout(callback,0),
  saveData=false
}={}) {
  if(!documentUrl||typeof fetchImpl!=='function'||typeof schedule!=='function')
    throw new TypeError('Combat warmup needs URL, fetch and scheduler');
  const root=new URL('./',documentUrl);
  let started=false;
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
    get started(){return started;}
  });
}
