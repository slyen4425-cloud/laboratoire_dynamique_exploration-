import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {createCaptureUniverseDatabaseStoreV1} from '../combat-preview/src/contracts/capture-universe-database-store-v1.js';
import {createBlankWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {saveWorldAssemblerDraft} from '../src/builder/world-assembler-handoff.js';
import {createExplorationUniverseWorkspaceStorageV1} from '../src/storage/exploration-universe-workspace-storage-v1.js';
import {saveCombatHandoff} from '../src/encounters/combat-handoff-store.js';
import {adventurePlayingPartyStorageKeyV1,ADVENTURE_PLAYING_PARTY_SCHEMA_V1} from '../src/encounters/adventure-playing-party-v1.js';
import {adventurePublishedEncounterStorageKeyV1,ADVENTURE_PUBLISHED_ENCOUNTER_SCHEMA_V1} from '../src/encounters/adventure-published-encounters-v1.js';

export async function createUniverseEncounterBrowserFixture(snapshot){
 const data=new URL('../combat-preview/data/capture/',import.meta.url);
 const read=async path=>JSON.parse(await readFile(new URL(path,data),'utf8'));
 const [release,statRegistry,progressionRules]=await Promise.all([
  read('showcase/encounter-bundle.v1.json'),read('monster-capture-stat-registry.v1.json'),
  read('monster-capture-progression-rules.v1.json')]);
 const speciesId='crea_selachombre';
 const {draft,statValues,loadout}=release.creatureTransfers.find(item=>item.draft.id===speciesId);
 const name='Sélachombre des marais';
 draft.displayName=name;
 statValues.values.health+=25;
 const expectedHp=statValues.values.health*statRegistry.stats.find(s=>s.id==='health').maxHpPerPoint;
 const universeId='unv_'+randomUUID(),sessionId=randomUUID();
 const items=new Map(),session=new Map();
 const local={getItem:key=>items.get(key)??null,setItem:(key,value)=>items.set(key,value),
  get length(){return items.size;},key:i=>[...items.keys()][i]??null};
 createCaptureUniverseDatabaseStoreV1({storage:local}).create(universeId,{
  schema:'capture-database-v1',version:1,metadata:{},statRegistry,progressionRules,
  creatures:[{draft,statValues,loadout}],
  skills:release.skillTransfers.map(item=>item.draft).filter(skill=>draft.skillIds.includes(skill.id))});
 const world=createBlankWorldBuilderDraft({id:'world-'+randomUUID(),width:1008,height:504});
 saveWorldAssemblerDraft(createExplorationUniverseWorkspaceStorageV1(local,universeId),world);
 const scope={sessionId,worldId:world.id,combatSha:release.engineSha,version:1};
 const partyRef='adventure-party:'+sessionId,areaId=world.initialAreaId;
 session.set(adventurePublishedEncounterStorageKeyV1(sessionId),JSON.stringify({
  ...scope,schema:ADVENTURE_PUBLISHED_ENCOUNTER_SCHEMA_V1,allowedCreatureIds:[speciesId]}));
 session.set(adventurePlayingPartyStorageKeyV1(sessionId),JSON.stringify({
  ...scope,schema:ADVENTURE_PLAYING_PARTY_SCHEMA_V1,partyRef,
  active:{instanceId:randomUUID(),speciesId,level:1,hp:expectedHp}}));
 function browserSeed(origin){
  const url=new URL('sculpt-lab.html',origin);
  url.searchParams.set('universe',universeId);url.searchParams.set('adventureSession',sessionId);
  saveCombatHandoff(local,{snapshot:{...snapshot,player:{partyRef},
   opponents:[{creatureId:speciesId,level:1}],context:{...snapshot.context,areaId}},
   returnState:{areaId,x:62,y:18,returnUrl:url.href}}, {sessionId});
  return 'for(const [k,v] of '+JSON.stringify([...items])+')localStorage.setItem(k,v);'+
         'for(const [k,v] of '+JSON.stringify([...session])+')sessionStorage.setItem(k,v);';
 }
 return {sessionId,speciesId,name,expectedHp,browserSeed};
}
