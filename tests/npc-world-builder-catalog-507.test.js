import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createUserNpcDefinitionV1,resolvePlacedNpcDefinitionsV1} from '../src/actors/user-npc-definition-v1.js';
import {appendSculptPreviewActor,serializeSculptPreviewScene,importSculptPreviewScene,
 createBlankSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {createPlacedMapActorView} from '../src/actors/placed-map-actor-view.js';
import {normalizeWorldActorPlacements} from '../src/actors/world-actor-placement-model.js';

const id='npc.user.00000000-0000-4000-8000-000000000011';
const img=()=>({blob:new Blob(['pixels'],{type:'image/png'}),width:96,height:128,mimeType:'image/png'});
const npc=()=>createUserNpcDefinitionV1({id,name:'Vendeur des bois',role:'merchant',base:img(),
 npc:{movement:{mode:'static',radius:90},merchantId:'merchant.official.1',dialogue:'Bienvenue !'}});
test('one canonical reusable NPC definition yields two placed references, without copied media, role or stock',()=>{
 const def=npc();
 let actors=appendSculptPreviewActor([],{definitionId:id,x:110,y:160,npc:null});
 actors=appendSculptPreviewActor(actors,{definitionId:id,x:210,y:270,npc:null});
 assert.equal(actors.length,2);
 assert.notEqual(actors[0].id,actors[1].id);
 assert.equal(actors[0].actorDefinitionId,id);
 assert.equal(actors[1].actorDefinitionId,id);
 for(const actor of actors){
  assert.equal('npc' in actor,false);
  assert.equal('assets' in actor,false);
  assert.equal('mapVisual' in actor,false);
 }
 const resolve=key=>key===id?def:null;
 const projections=resolvePlacedNpcDefinitionsV1(actors,resolve);
 assert.equal(projections[0].npc.merchantId,def.npc.merchantId);
 assert.equal(projections[1].npc.merchantId,def.npc.merchantId);
 const drawn=projections.map(p=>createPlacedMapActorView(p,resolve));
 assert.equal(drawn.length,2);
 assert.equal(drawn[0].mapVisual,def.mapVisual);
 assert.equal(drawn[1].mapVisual,def.mapVisual);
 assert.equal(drawn[0].x,110);assert.equal(drawn[1].y,270);
 const updated=createUserNpcDefinitionV1({id,name:'Vendeur des bois',role:'merchant',
  base:img(),targetHeight:88,npc:{merchantId:'merchant.official.1'}});
 assert.equal(actors[0].actorDefinitionId,updated.id);
 assert.equal(createPlacedMapActorView(actors[0],()=>updated).mapVisual.targetHeight,88);
 assert.equal(createPlacedMapActorView(actors[1],()=>updated).mapVisual.targetHeight,88);
});
test('historical NPC settings remain authoritative and valid, including trainer roster',()=>{
 const before=normalizeWorldActorPlacements([{id:'old-npc',actorDefinitionId:id,
  x:99,y:199,npc:{kind:'trainer',name:'Ancien',movement:{mode:'wander',radius:110},
   dialogue:'Défi',trainerEngagement:'aggressive',
   trainerRoster:[{creatureId:'crea_ancien',level:12}]}}]);
 const after=resolvePlacedNpcDefinitionsV1(before,()=>npc());
 assert.equal(after[0],before[0]);
 assert.equal(after[0].npc.kind,'trainer');
 assert.equal(after[0].npc.movement.mode,'wander');
 assert.equal(after[0].npc.trainerRoster[0].creatureId,'crea_ancien');
});
test('sculpt UI and placement path use NPC library, preserve historical author dialog and no second physics',async()=>{
 const html=await readFile(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const js=await readFile(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(html,/id="actor-npc-gallery"/);
 assert.match(html,/id="actor-npc-filter"/);
 assert.match(html,/id="actor-npc-library-open"/);
 assert.match(html,/href="\.\/npc-editor\.html"/);
 assert.match(js,/createUserNpcStoreV1/);
 assert.match(js,/createUserNpcAssetResolverV1/);
 assert.match(js,/captureActorRenderer=createMapActorRenderer/);
 assert.match(js,/npcFrameReferences\(record\)/);
 assert.match(js,/npc:linkedNpc\?null:npcSettingsFromControls\(\)/);
 assert.match(js,/if\(!linkedNpc\)\{/);
 assert.match(js,/actors:npcActorsWithDefinitions\(\),elapsedSeconds:npcWanderElapsed/);
 assert.match(js,/resolvePlacedNpcDefinitionsV1\(placedActors,/);
 assert.match(js,/if\(found&&!found\.actorDefinitionId\.startsWith\('npc\.user\.'\)\)/);
 assert.doesNotMatch(js,/npcPlacementDb|createNpcCollisionWorld|createNpcCombatEngine/);
});
