import test from 'node:test';
import assert from 'node:assert/strict';
import {
  projectCaptureShowcaseEncounterSourceV1,
  loadCaptureShowcaseEncounterSourceV1,
  loadCaptureAuthorEncounterBundleV1,
  normalizeCaptureAuthorEncounterBundleV1
} from '../src/capture/capture-showcase-encounter-source-v1.js';
import { createCaptureCreatureCatalogProvider } from '../src/capture/capture-creature-catalog-provider.js';

const grainou = {
  schema:'capture-creature-transfer-v1', version:1,
  draft:{
    id:'crea_nat_1',displayName:'Grainou',elements:['nature','earth'],
    capture:{capturable:true,spawnChance:18},
    presentation:{visual:{front:{assetId:'new-front'},back:{assetId:'new-back'}}}
  },
  loadout:{slots:[{id:'slot-1',skillId:'coupe_feuille'},{id:'slot-2',skillId:'Spore_soporifique'}]}
};
test('RED: canonical Showcase supplies the encounter catalogue, not the 102 historical demo entries', () => {
  const projection=projectCaptureShowcaseEncounterSourceV1([grainou]);
  assert.deepEqual(projection.creatures.map(x=>x.id),['crea_nat_1']);
  assert.equal(projection.creatures[0].spawnChance,18);
  assert.deepEqual(projection.creatures[0].elements,['nature','earth']);
  const provider=createCaptureCreatureCatalogProvider(projection);
  assert.deepEqual(provider.findByElement('nature').map(x=>x.id),['crea_nat_1']);
});
test('new or modified Showcase entries appear without a handwritten Encounter catalogue change', () => {
  const future={...grainou,draft:{...grainou.draft,id:'future-creature',displayName:'Future',elements:['water'],capture:{spawnChance:33,capturable:true}}};
  const projection=projectCaptureShowcaseEncounterSourceV1([grainou,future]);
  assert.deepEqual(projection.creatures.map(x=>x.id),['crea_nat_1','future-creature']);
});
test('invalid, missing, duplicate, or old unconfigured records fail closed', () => {
  assert.throws(()=>projectCaptureShowcaseEncounterSourceV1([grainou,grainou]),/duplicate/i);
  assert.throws(()=>projectCaptureShowcaseEncounterSourceV1([{...grainou,draft:{...grainou.draft,id:''}}]),/id/i);
  assert.throws(()=>projectCaptureShowcaseEncounterSourceV1([]),/empty|vide/i);
});
test('one derived source bundle supplies authored creatures and skills with a single request',async()=>{
  const requests=[];
  const payload={schema:'capture-author-encounter-bundle-v1',version:1,
    authorSha:'author-sha',engineSha:'engine-sha',creatureTransfers:[grainou],
    skillTransfers:[{schema:'capture-skill-transfer-v1',version:1,draft:{id:'Spore_soporifique'}}]};
  const fetchImpl=async url=>{requests.push(url.toString());return {ok:true,json:async()=>payload}};
  const projection=await loadCaptureShowcaseEncounterSourceV1({fetchImpl});
  assert.equal(projection.creatures.length,1);
  assert.equal(requests.length,1,'never fetch an N+1 list of creature skill transfers');
  assert.match(requests[0],/combat-preview\\/data\\/capture\\/showcase\\/encounter-bundle.v1.json/);
  const bundle=await loadCaptureAuthorEncounterBundleV1({fetchImpl});
  assert.equal(bundle.skillTransfers[0].draft.id,'Spore_soporifique');
  assert.equal(requests.length,2);
});
test('missing, incomplete or duplicate author bundle fails closed instead of using September',()=>{
  assert.throws(()=>normalizeCaptureAuthorEncounterBundleV1(null),/invalid/i);
  assert.throws(()=>normalizeCaptureAuthorEncounterBundleV1({schema:'capture-author-encounter-bundle-v1',version:1,creatureTransfers:[],skillTransfers:[]}),/invalid/i);
  assert.throws(()=>normalizeCaptureAuthorEncounterBundleV1({schema:'capture-author-encounter-bundle-v1',version:1,
    creatureTransfers:[grainou,grainou],skillTransfers:[{draft:{id:'spore'}}]}),/duplicate/i);
});
