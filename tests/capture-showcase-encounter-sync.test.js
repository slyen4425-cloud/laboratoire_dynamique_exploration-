import test from 'node:test';
import assert from 'node:assert/strict';
import {
  projectCaptureShowcaseEncounterSourceV1,
  loadCaptureShowcaseEncounterSourceV1
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
test('loader reads exact file list from official Combat module and the same-origin Combat directory',async()=>{
  const requests=[];
  const projection=await loadCaptureShowcaseEncounterSourceV1({
    importManifest:async()=>({CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1:['data/capture/showcase/crea_nat_1.capture-creature-transfer-v1.json']}),
    fetchImpl:async url=>{requests.push(url.toString());return {ok:true,json:async()=>grainou}}
  });
  assert.equal(projection.creatures.length,1);
  assert.match(requests[0],/combat-preview\/data\/capture\/showcase\/crea_nat_1/);
});
