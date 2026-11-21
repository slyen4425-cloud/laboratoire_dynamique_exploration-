import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeNpcCombatInstanceTransportV1}
 from '../src/actors/npc-combat-instance-transport-v1.js';
import {normalizeNpcTrainerRosterV1}
 from '../src/actors/map-actor-npc-settings-v1.js';
import {createCaptureEncounterSnapshot}
 from '../src/encounters/capture-encounter-contract.js';
import {createCombatHandoffEnvelope}
 from '../src/encounters/combat-handoff-store.js';
import {createUserNpcDefinitionV1,exportUserNpcBundleV1,importUserNpcBundleV1}
 from '../src/actors/user-npc-definition-v1.js';
import {projectNpcCombatAuthoringCatalogV1}
 from '../src/actors/npc-combat-authoring-catalog-v1.js';

const instance={schema:'capture-npc-opponent-instance-v1',
 displayName:'Gardien de la forêt',statAllocations:{health:50,fire:5},
 skillIds:['claw','fireball']};
const roster=[{creatureId:'crea-loup',level:12,npcInstance:instance}];
const basic=()=>({blob:new Blob(['mock png'],{type:'image/png'}),mimeType:'image/png',width:64,height:64});
const ID='npc.user.00000000-0000-4000-8000-000000000046';
test('un loup PNJ garde son identité officielle, son niveau et ses seuls réglages d instance',()=>{
 const normalized=normalizeNpcTrainerRosterV1(roster);
 assert.equal(normalized[0].creatureId,'crea-loup');
 assert.equal(normalized[0].level,12);
 assert.deepEqual(normalized[0].npcInstance,instance);
 assert.ok(Object.isFrozen(normalized[0].npcInstance));
 assert.equal('visual' in normalized[0],false);
 const historical=normalizeNpcTrainerRosterV1([{creatureId:'crea-loup',level:12}]);
 assert.deepEqual(historical,[{creatureId:'crea-loup',level:12}]);
});
test('schéma PNJ fail-closed : stats invalides, attributs étrangers, compétences répétées',()=>{
 for(const broken of [{...instance,statAllocations:{health:-5}},
  {...instance,skillIds:['claw','claw']},{...instance,creatureId:'fake'},
  {...instance,statAllocations:{health:1.5}},
  {...instance,skillIds:['invalid/evil']}])
  assert.throws(()=>normalizeNpcCombatInstanceTransportV1(broken));
});
test('la même instance traversera le vrai snapshot et handoff sans modifier les sauvegardes anciennes',()=>{
 const snapshot=createCaptureEncounterSnapshot({
  encounterId:'trainer-2',source:'npc-trainer',playerPartyRef:'adventure-party:party1',
  trainerActorId:'actor-2',opponents:roster,
  rulesetId:'capture.standard.1v1',areaId:'forest',terrainFamilyId:'grass',
  elementId:'fire',returnToken:'return-2'
 });
 assert.deepEqual(snapshot.opponents[0].npcInstance,instance);
 const envelope=createCombatHandoffEnvelope({snapshot,returnState:{
  areaId:'forest',x:50,y:60,returnUrl:'https://example.test/adventure'
 }});
 assert.deepEqual(envelope.snapshot.opponents[0].npcInstance,instance);
 const old=createCaptureEncounterSnapshot({
  encounterId:'trainer-legacy',source:'npc-trainer',playerPartyRef:'adventure-party:party1',
  trainerActorId:'actor-1',opponents:[{creatureId:'crea-loup',level:12}],
  rulesetId:'capture.standard.1v1',areaId:'forest',terrainFamilyId:'grass',
  elementId:'fire',returnToken:'return-old'
 });
 assert.equal('npcInstance' in old.opponents[0],false);
});
test('le PNJ utilisateur sauvegarde nom, image, réglages de combat et récompenses sans duplication',async()=>{
 const definition=createUserNpcDefinitionV1({id:ID,name:'Dresseur de la forêt',
  base:basic(),role:'trainer-friendly',
  npc:{trainerRoster:roster,trainerReward:{currency:100,items:[]}}});
 assert.deepEqual(definition.npc.trainerRoster[0].npcInstance,instance);
 assert.equal(definition.npc.trainerReward.currency,100);
 const exported=await exportUserNpcBundleV1(definition);
 const imported=importUserNpcBundleV1(exported,{
  mintId:()=> 'npc.user.00000000-0000-4000-8000-000000000047'
 });
 assert.deepEqual(imported.npc.trainerRoster[0].npcInstance,instance);
 assert.equal(imported.npc.trainerReward.currency,100);
 assert.notEqual(imported.id,definition.id);
});
test('catalogue PNJ reprend noms et niveaux de compétences depuis le seul bundle Combat',()=>{
 const bundle={schema:'capture-author-encounter-bundle-v1',version:1,
  creatureTransfers:[{draft:{id:'crea-loup',displayName:'Loup volcanique'},
   statValues:{values:{health:150,fire:10}},
   loadout:{slots:[{id:'slot-1',skillId:'claw'},{id:'slot-2',skillId:'fireball'}]}}],
  skillTransfers:[{draft:{id:'claw',definition:{name:'Griffe'}}},
    {draft:{id:'fireball',definition:{name:'Boule de feu'}}}]};
 const source=projectNpcCombatAuthoringCatalogV1(bundle);
 const wolf=source.get('crea-loup');
 assert.equal(wolf.stats.find(s=>s.id==='health').base,150);
 assert.equal(wolf.stats.find(s=>s.id==='fire').base,10);
 assert.deepEqual(wolf.skills.map(s=>s.name),['Griffe','Boule de feu']);
});
test('le bridge conserve l instance du premier adversaire en Tester ET en Aventure',()=>{
 const js=readFileSync(new URL('../integration/combat-bridge/exploration-native-source-v1.js',import.meta.url),'utf8');
 assert.match(js,/member\.npcInstance/);
 assert.match(js,/opponent:rivals\[0\],opponentReserve/);
 assert.match(js,/opponent:\{\.\.\.rivals\[0\],level:/);
 const ui=readFileSync(new URL('../npc-editor.html',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../src/actors/npc-editor-v1.js',import.meta.url),'utf8');
 assert.match(ui,/id="npc-combat-catalog-status"/);
 assert.match(editor,/renderNpcCombatInstanceEditor\(index,slot\)/);
 assert.match(editor,/trainerRoster:trainerRosterDraft\.map/);
});
