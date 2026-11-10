import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeWorldActorPlacement} from '../src/actors/world-actor-placement-model.js';
import {normalizeWorldArea} from '../src/world/world-area-model.js';
import {normalizeMapActorNpcSettingsV1,normalizeNpcTrainerRosterV1,nearestDialogNpcV1} from '../src/actors/map-actor-npc-settings-v1.js';
import {appendSculptPreviewActor,updateSculptPreviewActor,
 serializeSculptPreviewScene,importSculptPreviewScene,
 createBlankSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
function settings(overrides={}){
 return {kind:'dialogue',name:'Lina',movement:{mode:'static',radius:90},
  dialogue:'Bonjour !\nBienvenue au village.',questId:'',trainerTeamId:'',merchantId:'',
  ...overrides};
}
test('legacy placements remain byte-shape compatible and NPC metadata is optional',()=>{
 const original={id:'old',actorDefinitionId:'capture:creature:crea-loup',
  x:21,y:42,facingX:1};
 assert.equal('npc' in normalizeWorldActorPlacement(original),false);
 const npc=normalizeWorldActorPlacement({...original,npc:settings()});
 assert.equal(npc.npc.kind,'dialogue');
 assert.equal(npc.npc.movement.mode,'static');
 assert.equal(npc.actorDefinitionId,original.actorDefinitionId);
 assert.equal('assetId' in npc,false);
 assert.equal('team' in npc,false);
});
test('NPC roles, future external references and movement policy validate strictly',()=>{
 for(const kind of ['dialogue','quest','trainer','wild','merchant']){
  const npc=normalizeMapActorNpcSettingsV1(settings({kind,
   movement:{mode:'wander',radius:120},
   questId:'quest.1',trainerTeamId:'team.2',merchantId:'shop.3'}));
  assert.equal(npc.kind,kind);
  assert.equal(npc.movement.radius,120);
  assert.equal(npc.trainerTeamId,'team.2');
 }
 assert.throws(()=>normalizeMapActorNpcSettingsV1(settings({kind:'invalid'})));
 assert.throws(()=>normalizeMapActorNpcSettingsV1(settings({
  movement:{mode:'teleport',radius:120}})));
 assert.throws(()=>normalizeMapActorNpcSettingsV1(settings({
  movement:{mode:'wander',radius:99999}})));
 assert.throws(()=>normalizeMapActorNpcSettingsV1(settings({dialogue:'x'.repeat(2001)})));
});
test('Sculpt placement, edit, save/load and canonical WorldArea retain exactly one NPC instance',()=>{
 const scene=createBlankSculptPreviewScene({width:10,height:10});
 const a=appendSculptPreviewActor(scene.actors,{definitionId:'exploration:npc:generic-v1',
  x:96,y:84,npc:settings()});
 const b=updateSculptPreviewActor(a,a[0].id,{npc:settings({
  kind:'quest',questId:'quest.village.01',dialogue:'Trouve la clé.'})});
 const loaded=importSculptPreviewScene(serializeSculptPreviewScene(
  scene.terrain,scene.objects,scene.surface,b));
 assert.equal(loaded.actors.length,1);
 assert.equal(loaded.actors[0].npc.questId,'quest.village.01');
 const area=normalizeWorldArea({id:'map-1',width:280,height:210,
  actors:loaded.actors});
 assert.equal(area.actors[0].npc.dialogue,'Trouve la clé.');
 assert.equal(area.actors[0].actorDefinitionId,'exploration:npc:generic-v1');
});
test('Dialogue trigger chooses only nearest valid authored NPC and respects range',()=>{
 const actors=[
  normalizeWorldActorPlacement({id:'one',actorDefinitionId:'actor.1',x:20,y:20,npc:settings()}),
  normalizeWorldActorPlacement({id:'two',actorDefinitionId:'actor.2',x:40,y:20,npc:settings({dialogue:'Plus près'})}),
  normalizeWorldActorPlacement({id:'blank',actorDefinitionId:'actor.3',x:40,y:20})
 ];
 assert.equal(nearestDialogNpcV1(actors,{x:37,y:20})?.id,'two');
 assert.equal(nearestDialogNpcV1(actors,{x:900,y:900}),null);
});
test('Native Sculpt editor wires NPC inputs and gameplay dialogue, not a second world model',async()=>{
 const html=await readFile(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const main=await readFile(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 for(const id of ['actor-npc-kind','actor-npc-name','actor-npc-movement',
  'actor-npc-dialogue','npc-team-creature','npc-team-level','npc-team-add',
  'npc-team-list','npc-team-copy-source','npc-wild-creature','npc-wild-level',
  'npc-catalog-status','npc-talk','npc-dialogue-overlay','npc-dialogue-next']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 for(const legacyManualId of ['actor-npc-quest','actor-npc-team','actor-npc-merchant'])
  assert.doesNotMatch(html,new RegExp('id="'+legacyManualId+'"'));
 assert.match(main,/loadCaptureShowcaseEncounterSourceV1/);
 assert.match(main,/npcApplyAuthoringPatch/);
 assert.match(main,/npcSettingsFromControls/);
 assert.match(main,/nearestDialogNpcV1/);
 assert.match(main,/updateSculptPreviewActor/);
 assert.match(main,/actorCommit/);
 assert.doesNotMatch(main,/new WorldDocument\(/);
});

test('NPC trainer roster remains a single instance-scoped, validated Combat reference list',()=>{
 const roster=[{creatureId:'crea_nat_1',level:10},{creatureId:'crea_ailevent',level:18}];
 const trainer=normalizeMapActorNpcSettingsV1(settings({kind:'trainer',trainerRoster:roster}));
 assert.deepEqual(trainer.trainerRoster,roster);
 assert.ok(Object.isFrozen(trainer.trainerRoster));
 assert.equal('hp' in trainer.trainerRoster[0],false);
 assert.throws(()=>normalizeNpcTrainerRosterV1(Array.from({length:7},
  ()=>({creatureId:'crea_nat_1',level:10}))));
 assert.throws(()=>normalizeNpcTrainerRosterV1([{creatureId:'crea_nat_1',level:0}]));
 assert.throws(()=>normalizeNpcTrainerRosterV1([{creatureId:'<script>',level:10}]));
 assert.throws(()=>normalizeNpcTrainerRosterV1([{creatureId:'crea_nat_1',level:10.2}]));
});
test('Visual wild selection and trainer order survive native Sculpt scene and WorldArea round-trip',()=>{
 const roster=[{creatureId:'crea_ailevent',level:12},{creatureId:'crea_nat_1',level:8}];
 const source=createBlankSculptPreviewScene({width:10,height:10});
 const first=appendSculptPreviewActor(source.actors,{
  definitionId:'exploration:npc:generic-v1',x:28,y:21,
  npc:settings({kind:'trainer',trainerRoster:roster})});
 const second=appendSculptPreviewActor(first,{
  definitionId:'capture:creature:crea-loup',x:84,y:42,
  npc:settings({kind:'wild',wildCreature:{creatureId:'crea_loup',level:17}})});
 const loaded=importSculptPreviewScene(serializeSculptPreviewScene(
  source.terrain,source.objects,source.surface,second));
 const area=normalizeWorldArea({id:'area',width:280,height:210,actors:loaded.actors});
 assert.deepEqual(area.actors[0].npc.trainerRoster,roster);
 assert.equal(area.actors[1].npc.wildCreature.level,17);
 assert.equal(area.actors[1].npc.wildCreature.creatureId,'crea_loup');
 assert.equal('trainerRoster' in normalizeMapActorNpcSettingsV1(settings()),false);
});
