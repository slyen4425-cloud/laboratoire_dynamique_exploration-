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
// Validate one build-produced transfer projection. A bad/missing bundle fails
// closed: no September catalogue or hidden alternative creature authority.
export function normalizeCaptureAuthorEncounterBundleV1(raw) {
  if(raw?.schema!=='capture-author-encounter-bundle-v1'||raw.version!==1||
     !Array.isArray(raw.creatureTransfers)||!raw.creatureTransfers.length||
     !Array.isArray(raw.skillTransfers)||!raw.skillTransfers.length)
    throw new RangeError('Official Combat encounter bundle invalid or missing');
  if(new Set(raw.creatureTransfers.map(x=>x.draft?.id)).size!==raw.creatureTransfers.length||
     new Set(raw.skillTransfers.map(x=>x.draft?.id)).size!==raw.skillTransfers.length)
    throw new RangeError('Official Combat encounter bundle contains duplicate IDs');
  return raw;
}
export async function loadCaptureAuthorEncounterBundleV1({fetchImpl=globalThis.fetch}={}) {
  if(typeof fetchImpl!=='function')throw new TypeError('fetchImpl required');
  const url=new URL('../../combat-preview/data/capture/showcase/encounter-bundle.v1.json',import.meta.url);
  const response=await fetchImpl(url,{cache:'force-cache'});
  if(!response.ok)throw new Error('Official Combat encounter bundle unavailable: HTTP '+response.status);
  return normalizeCaptureAuthorEncounterBundleV1(await response.json());
}
export async function loadCaptureShowcaseEncounterSourceV1(options={}) {
  const bundle=await loadCaptureAuthorEncounterBundleV1(options);
  return projectCaptureShowcaseEncounterSourceV1(bundle.creatureTransfers);
}
