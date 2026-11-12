import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 normalizeNpcTrainerRewardV1,normalizeMapActorNpcSettingsV1
} from '../src/actors/map-actor-npc-settings-v1.js';
import {createCaptureEncounterSnapshot} from '../src/encounters/capture-encounter-contract.js';
import {createBlankSculptPreviewScene,appendSculptPreviewActor,
 serializeSculptPreviewScene,importSculptPreviewScene}
 from '../src/world/sculpt-scene-preview.js';
import {normalizeWorldArea} from '../src/world/world-area-model.js';

const reward={currency:35,items:[{itemId:'gem-forest',quantity:2}]};
const trainer={kind:'trainer',name:'Gardienne',movement:{mode:'static',radius:90},
 dialogue:'Un duel ?',trainerRoster:[{creatureId:'crea_nat_1',level:8}],
 trainerEngagement:'offer',trainerReward:reward};
const snapshot=(trainerReward)=>createCaptureEncounterSnapshot({
 encounterId:'encounter-trainer',source:'npc-trainer',
 playerPartyRef:'adventure-party:game',trainerActorId:'trainer-1',
 opponents:trainer.trainerRoster,rulesetId:'capture.standard.1v1',
 areaId:'forest-1',terrainFamilyId:'grass',elementId:'nature',
 returnToken:'return-trainer',
 ...(trainerReward===undefined?{}:{trainerReward})
});

test('a trainer reward consists only of money and official item REFERENCES',()=>{
 const value=normalizeNpcTrainerRewardV1(reward);
 assert.deepEqual(value,reward);
 assert.ok(Object.isFrozen(value)&&Object.isFrozen(value.items));
 assert.ok(Object.isFrozen(value.items[0]));
 assert.equal('wallet' in value,false);
 assert.equal('inventory' in value,false);
 assert.throws(()=>normalizeNpcTrainerRewardV1({...reward,currency:-1}),/reward/i);
 assert.throws(()=>normalizeNpcTrainerRewardV1({...reward,currency:2.4}),/reward/i);
 assert.throws(()=>normalizeNpcTrainerRewardV1({...reward,items:[reward.items[0],reward.items[0]]}),/reward/i);
 assert.throws(()=>normalizeNpcTrainerRewardV1({...reward,items:[{itemId:'gem-forest',quantity:0}]}),/reward/i);
 assert.throws(()=>normalizeNpcTrainerRewardV1({...reward,items:[{itemId:'<script>',quantity:1}]}),/reward/i);
 assert.throws(()=>normalizeNpcTrainerRewardV1({...reward,items:[{itemId:'gem-forest',quantity:1,price:4}]}),/reward/i);
});

test('old NPC and old encounter remain byte-shape compatible without rewards',()=>{
const legacy={...trainer};delete legacy.trainerReward;
 const old=normalizeMapActorNpcSettingsV1(legacy);
 assert.equal('trainerReward' in old,false);
 assert.equal('trainerReward' in snapshot(),false);
 assert.equal('trainerReward' in snapshot().context,false);
});

test('the single NPC in Sculpt WorldArea retains rewards through export and official snapshot',()=>{
 const first=createBlankSculptPreviewScene({width:10,height:10});
 const actors=appendSculptPreviewActor(first.actors,{
  definitionId:'exploration:npc:generic-v1',x:96,y:84,npc:trainer
 });
 const imported=importSculptPreviewScene(serializeSculptPreviewScene(
  first.terrain,first.objects,first.surface,actors));
 const area=normalizeWorldArea({id:'forest-1',width:280,height:210,actors:imported.actors});
 assert.equal(area.actors.length,1);
 assert.deepEqual(area.actors[0].npc.trainerReward,reward);
 const real=snapshot(area.actors[0].npc.trainerReward);
 assert.deepEqual(real.context.trainerReward,reward);
 assert.equal(real.context.trainerActorId,'trainer-1');
 assert.equal(real.opponents[0].level,8);
 assert.throws(()=>snapshot({currency:20,items:[{itemId:'bad/id',quantity:1}]}),/reward/i);
});

test('NPC editor only selects objects from the read-only Capture catalog and uses the same dialog',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 for(const id of ['npc-trainer-reward-editor','npc-reward-currency','npc-reward-list',
  'npc-reward-item','npc-reward-quantity','npc-reward-add',
  'npc-reward-reload','npc-reward-status']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))??[]).length,1,id);
 }
 assert.match(js,/gensrpg.exploration.npc.reward.catalog.request.v1/);
 assert.match(js,/gensrpg.capture.v2.npc.reward.catalog.response.v1/);
 assert.match(js,/event.origin!==window.location.origin\|\|event.source!==window.parent/);
 assert.match(js,/requestId:npcRewardRequestId/);
 assert.match(js,/actor.npc.trainerReward\?\{trainerReward:actor.npc.trainerReward\}:\{\}/);
 assert.match(js,/npcApplyAuthoringPatch\(\{trainerReward:/);
 assert.doesNotMatch(html,/id="npc-reward-manual-id"/);
 assert.equal((html.match(/id="actor-npc-settings"/g)??[]).length,1);
});
