import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createUserNpcDefinitionV1} from '../src/actors/user-npc-definition-v1.js';
import {normalizeWorldActorPlacement} from '../src/actors/world-actor-placement-model.js';

const image=()=>({blob:new Blob(['png'],{type:'image/png'}),width:64,height:64,mimeType:'image/png'});
const ID='npc.user.00000000-0000-4000-8000-000000000099';
test('official trainer, currency, item and merchant links remain scenario refs, not copied catalogs',()=>{
 const base={id:ID,name:'Dresseur',base:image()};
 const trainer=createUserNpcDefinitionV1({...base,role:'trainer-friendly',
  npc:{trainerRoster:[{creatureId:'crea_official_x',level:12},{creatureId:'crea_official_y',level:9}],
   trainerReward:{currency:350,items:[{itemId:'item_herbe',quantity:2}]}}});
 assert.equal(trainer.npc.kind,'trainer');
 assert.equal(trainer.npc.trainerEngagement,'offer');
 assert.deepEqual(trainer.npc.trainerRoster.map(x=>x.level),[12,9]);
 assert.equal(trainer.npc.trainerReward.items[0].itemId,'item_herbe');
 assert.equal('stats' in trainer.npc.trainerRoster[0],false);
 const merchant=createUserNpcDefinitionV1({...base,role:'merchant',
  npc:{merchantId:'shop.official.1'}});
 assert.equal(merchant.npc.kind,'merchant');
 assert.equal(merchant.npc.merchantId,'shop.official.1');
 const placed=normalizeWorldActorPlacement({id:'sculpt-actor-1',actorDefinitionId:ID,x:100,y:200});
 assert.equal('npc' in placed,false);
 assert.equal('trainerReward' in placed,false);
 assert.equal('merchantId' in placed,false);
});
test('dedicated NPC editor choices are read only from official Combat/Capture providers',async()=>{
 const js=await readFile(new URL('../src/actors/npc-editor-v1.js',import.meta.url),'utf8');
 const html=await readFile(new URL('../npc-editor.html',import.meta.url),'utf8');
 for(const id of ['npc-trainer-config','npc-trainer-rows','npc-wild-choice',
  'npc-reward-choice','npc-reward-rows','npc-merchant-choice']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))??[]).length,1,id);
 }
 assert.match(js,/loadCaptureShowcaseEncounterSourceV1\(\)/);
 assert.match(js,/gensrpg\.exploration\.npc\.merchant\.catalog\.request\.v1/);
 assert.match(js,/gensrpg\.capture\.v2\.npc\.merchant\.catalog\.response\.v1/);
 assert.match(js,/gensrpg\.exploration\.npc\.reward\.catalog\.request\.v1/);
 assert.match(js,/gensrpg\.capture\.v2\.npc\.reward\.catalog\.response\.v1/);
 assert.match(js,/event\.origin!==window\.location\.origin/);
 assert.match(js,/event\.source!==window\.parent/);
 assert.match(js,/event\.source===\$\('npc-merchant-frame'\)\.contentWindow/);
 assert.match(js,/data\.requestId===merchantRequestId/);
 assert.match(js,/data\.requestId===rewardRequestId/);
 assert.match(js,/trainerRoster:trainerRosterDraft\.map/);
 assert.match(js,/merchantId:merchantIdDraft/);
 assert.doesNotMatch(js,/manualCreatureId|manualItemId|manualMerchantId|fallbackCatalog/);
});
test('Sculpt embedded workshop relays catalogs to existing Capture parent and saves only actor definition references',async()=>{
 const main=await readFile(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const html=await readFile(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 for(const id of ['actor-npc-workshop','actor-npc-workshop-frame',
  'actor-npc-workshop-open','actor-npc-workshop-close']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))??[]).length,1,id);
 }
 assert.match(main,/function openNpcWorkshop\(id=null\)/);
 assert.match(main,/if\(!npcWorkshop\.open\)npcWorkshop\.showModal\(\)/);
 assert.match(main,/window\.parent\.postMessage\(event\.data,window\.location\.origin\)/);
 assert.match(main,/npcWorkshopPending\.get\(id\)!==event\.data\?\.schema/);
 assert.match(main,/npcWorkshopFrame\.contentWindow\?\.postMessage\(event\.data,window\.location\.origin\)/);
 assert.match(main,/npc:linkedNpc\?null:npcSettingsFromControls\(\)/);
 assert.match(main,/PNJ référencés mais non importés/);
 assert.doesNotMatch(main,/new WorldDocument\(|npcPrivateCaptureCatalog/);
});

test('async Catalog refresh commits the latest user selection, not the value captured before awaits',async()=>{
 const main=await readFile(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const fn=main.split('async function loadCaptureActorCatalog(){')[1]?.split('function renderNpcLibraryGallery(){')[0];
 assert.ok(fn,'must inspect the real canonical Sculpt catalog loader');
 const load=fn.indexOf('const authored=await authoredNpcStore.list()');
 const current=fn.indexOf("const chosen=$('actor-definition').value");
 const replace=fn.indexOf("$('actor-definition').replaceChildren(");
 assert.ok(load>=0&&current>load&&replace>current,
  'selection must be read AFTER async assets load, immediately before DOM commit');
 assert.equal(fn.indexOf("const chosen=$('actor-definition').value"),fn.lastIndexOf("const chosen=$('actor-definition').value"),
  'do not keep an earlier stale snapshot of the selected definition');
 assert.match(fn,/if\(definitions\.some\(def=>def\.id===chosen\)\)\$\('actor-definition'\)\.value=chosen/);
});

test('a nearby unlinked merchant is still interactable; no shop or reference is invented',async()=>{
 const {nearestDialogNpcV1,normalizeMapActorNpcSettingsV1}=await import('../src/actors/map-actor-npc-settings-v1.js');
 const merchant={id:'merchant-placed',x:20,y:20,npc:normalizeMapActorNpcSettingsV1({kind:'merchant',name:'Marchand'})};
 const silentVillager={id:'villager',x:20,y:20,npc:normalizeMapActorNpcSettingsV1({kind:'dialogue'})};
 assert.equal(nearestDialogNpcV1([silentVillager,merchant],{x:20,y:20}),merchant);
 assert.equal(nearestDialogNpcV1([merchant],{x:200,y:200}),null);
 assert.equal(merchant.npc.merchantId,'');
 assert.equal(nearestDialogNpcV1([silentVillager],{x:20,y:20}),null);
 const linked={...merchant,npc:normalizeMapActorNpcSettingsV1({kind:'merchant',merchantId:'shop.official.1'})};
 assert.equal(nearestDialogNpcV1([linked],{x:20,y:20}),linked);
});
