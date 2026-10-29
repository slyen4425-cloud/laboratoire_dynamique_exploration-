// This is a read-only projection of Combat's author-managed Showcase.
// Do not seed Encounter from the historical September Monster Capture catalog.
// No local list of creature IDs, skill IDs, image IDs or rarity is authoritative.
function requireId(value,label) {
  if(typeof value!=='string'||!value.trim())throw new TypeError(label+' id missing');
  return value;
}
export function projectCaptureShowcaseEncounterSourceV1(transfers) {
  if(!Array.isArray(transfers)||!transfers.length)
    throw new RangeError('Capture Showcase is empty');
  const ids=new Set();
  const creatures=transfers.map((transfer)=>{
    if(transfer?.schema!=='capture-creature-transfer-v1'||transfer?.version!==1)
      throw new RangeError('Unsupported Capture Showcase creature transfer');
    const draft=transfer.draft;
    const id=requireId(draft?.id,'Creature');
    if(ids.has(id))throw new RangeError('Duplicate creature id: '+id);
    ids.add(id);
    if(!Array.isArray(draft.elements)||!draft.elements.length)
      throw new RangeError('Capture creature '+id+' has no elements');
    if(typeof draft.displayName!=='string'||!draft.displayName.trim())
      throw new RangeError('Capture creature '+id+' has no name');
    const chance=Number(draft.capture?.spawnChance);
    if(!Number.isFinite(chance)||chance<0||chance>100)
      throw new RangeError('Capture creature '+id+' has invalid spawn chance');
    return Object.freeze({
      id,name:draft.displayName,
      elements:Object.freeze([...draft.elements]),
      spawnChance: draft.capture?.capturable === false ? 0 : chance,
      presentation: draft.presentation ?? null
    });
  });
  return Object.freeze({
    schema:'capture-creature-catalog-preview-v1',
    creatures:Object.freeze(creatures)
  });
}
export async function loadCaptureShowcaseEncounterSourceV1({
  importManifest=()=>import(new URL('../../combat-preview/src/catalogs/capture-showcase-creature-presets-v1.js',import.meta.url).href),
  fetchImpl=globalThis.fetch
}={}) {
  const root=new URL('../../combat-preview/',import.meta.url);
  const manifest=await importManifest();
  const paths=manifest.CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1;
  if(!Array.isArray(paths)||!paths.length)
    throw new RangeError('Official Combat Showcase manifest is missing');
  if(typeof fetchImpl!=='function')throw new TypeError('fetchImpl required');
  const transfers=await Promise.all(paths.map(async path=>{
    if(typeof path!=='string'||!/^data\/capture\/showcase\/[\w.-]+\.capture-creature-transfer-v1\.json$/.test(path))
      throw new RangeError('Invalid Combat Showcase manifest path');
    const url=new URL(path,root);
    const response=await fetchImpl(url,{cache:'no-store'});
    if(!response.ok)throw new Error('Capture Showcase missing: '+path+' HTTP '+response.status);
    return response.json();
  }));
  return projectCaptureShowcaseEncounterSourceV1(transfers);
}
