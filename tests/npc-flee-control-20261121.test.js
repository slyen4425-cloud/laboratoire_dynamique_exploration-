import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeMapActorNpcSettingsV1} from '../src/actors/map-actor-npc-settings-v1.js';
import {createCaptureEncounterSnapshot} from '../src/encounters/capture-encounter-contract.js';
import {createCombatHandoffEnvelope,saveCombatHandoff,readCombatHandoff}
 from '../src/encounters/combat-handoff-store.js';
import {createUserNpcDefinitionV1,exportUserNpcBundleV1,importUserNpcBundleV1}
 from '../src/actors/user-npc-definition-v1.js';

const npc=(allowFlee)=>({kind:'trainer',name:'Gardien',movement:{mode:'static',radius:90},
 trainerRoster:[{creatureId:'crea-loup',level:20}],...(allowFlee===undefined?{}:{allowFlee})});
const image=()=>({blob:new Blob(['PNG-data'],{type:'image/png'}),
 mimeType:'image/png',width:64,height:64});
function snapshot(value){
 return createCaptureEncounterSnapshot({
  encounterId:'e1',source:'npc-trainer',playerPartyRef:'adventure-party:x',
  trainerActorId:'actor1',opponents:[{creatureId:'crea-loup',level:20}],
  rulesetId:'capture.standard.1v1',areaId:'forest',
  terrainFamilyId:'grass',elementId:'fire',returnToken:'tok1',
  ...(value===undefined?{}:{fleeAllowed:value})
 });
}
const returnState={areaId:'forest',x:12,y:20,returnUrl:'https://example.test/adventure'};
test('case Fuite : ancienne définition toujours autorisée, nouveau réglage true/false strict',()=>{
 const old=normalizeMapActorNpcSettingsV1(npc(undefined));
 const yes=normalizeMapActorNpcSettingsV1(npc(true));
 const no=normalizeMapActorNpcSettingsV1(npc(false));
 assert.equal(Object.hasOwn(old,'allowFlee'),false);
 assert.equal(yes.allowFlee,true);
 assert.equal(no.allowFlee,false);
 for(const invalid of [null,0,'false',1])assert.throws(
  ()=>normalizeMapActorNpcSettingsV1(npc(invalid)),/allowFlee/);
});
test('l autorisation traverse un seul Snapshot et son journal, sans altérer le vieux schéma',()=>{
 const old=snapshot();
 const blocked=snapshot(false);
 assert.equal(Object.hasOwn(old.context,'fleeAllowed'),false);
 assert.equal(blocked.context.fleeAllowed,false);
 assert.equal(snapshot(true).context.fleeAllowed,true);
 assert.throws(()=>snapshot('false'),/fleeAllowed/);
 const historic=createCombatHandoffEnvelope({snapshot:old,returnState});
 const saved=createCombatHandoffEnvelope({snapshot:blocked,returnState});
 assert.equal('fleeAllowed' in historic.snapshot.context,false);
 assert.equal(saved.snapshot.context.fleeAllowed,false);
 const entries=new Map();
 const storage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v),
  removeItem:k=>entries.delete(k)};
 saveCombatHandoff(storage,saved);
 assert.equal(readCombatHandoff(storage).snapshot.context.fleeAllowed,false);
});
test('le PNG et sa règle de fuite survivent au partage JSON sous nouveau UUID',async()=>{
 const id='npc.user.00000000-0000-4000-8000-000000000077';
 const record=createUserNpcDefinitionV1({
  id,name:'Gardien',role:'trainer-aggressive',base:image(),npc:npc(false)
 });
 const json=await exportUserNpcBundleV1(record);
 const imported=importUserNpcBundleV1(json,{mintId:()=>
  'npc.user.00000000-0000-4000-8000-000000000078'});
 assert.equal(imported.npc.allowFlee,false);
 assert.equal(imported.npc.trainerRoster.length,1);
 assert.equal(imported.assets.length,record.assets.length);
 assert.notEqual(imported.id,record.id);
});
test('un seul mécanisme Combat : vrai bouton Fuir inactif et résultat illégal refusé',()=>{
 const editor=readFileSync(new URL('../npc-editor.html',import.meta.url),'utf8');
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../src/actors/npc-editor-v1.js',import.meta.url),'utf8');
 const game=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const combat=readFileSync(new URL('../integration/combat-bridge/exploration-encounter.js',import.meta.url),'utf8');
 assert.equal((editor.match(/id="npc-allow-flee"/g)??[]).length,1);
 assert.equal((html.match(/id="npc-trainer-allow-flee"/g)??[]).length,1);
 assert.match(js,/allowFlee:\$\('npc-allow-flee'\)\.checked/);
 assert.match(game,/fleeAllowed:false/);
 assert.match(combat,/fleeButton\.hidden=!fleeAllowed/);
 assert.match(combat,/outcome==='fled'&&handoff\.snapshot\.context\?\.fleeAllowed===false/);
});
