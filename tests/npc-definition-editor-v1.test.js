import test from 'node:test';
import assert from 'node:assert/strict';
import {createUserNpcDefinitionV1,validateUserNpcDefinitionV1,
 createUserNpcAssetResolverV1,exportUserNpcBundleV1,importUserNpcBundleV1,
 resolvePlacedNpcDefinitionsV1,npcKindForRoleV1,mintUserNpcIdV1
} from '../src/actors/user-npc-definition-v1.js';
import {readFile} from 'node:fs/promises';

const id='npc.user.00000000-0000-4000-8000-000000000001';
const second='npc.user.00000000-0000-4000-8000-000000000002';
const png=(width=96,height=128)=>({blob:new Blob(['bytes'],{type:'image/png'}),
 width,height,mimeType:'image/png'});
const base=()=>({id,name:'Gardien',role:'villager',base:png(),
 createdAt:'2026-11-20T12:00:00.000Z',updatedAt:'2026-11-20T12:00:00.000Z'});

test('NPC definition uses its own ID and visual owner, never embeds position or Capture data',()=>{
 const npc=createUserNpcDefinitionV1(base());
 assert.equal(npc.schema,'gensrpg-exploration-user-npc-v1');
 assert.equal(npc.mapVisual.role,'npc');
 assert.equal(npc.mapVisual.animation.mode,'image');
 assert.equal(npc.npc.kind,'dialogue');
 assert.equal(npc.npc.name,'Gardien');
 assert.equal(npc.assets.length,1);
 assert.equal(validateUserNpcDefinitionV1(npc),npc);
 for(const key of ['x','y','stats','creatures','items','inventory'])assert.equal(key in npc,false);
 assert.throws(()=>createUserNpcDefinitionV1({...base(),id:'PNJ_001'}),/UUID/);
 assert.match(mintUserNpcIdV1({randomUUID:()=>second.split('npc.user.')[1]}),/^npc\.user\./);
});
test('NPC sprite sequences reuse renderer asset schema, shadow, facing and source canvas',()=>{
 const npc=createUserNpcDefinitionV1({...base(),mode:'frames',idle:[png(),png()],
  walk:[png(),png()],framesPerSecond:12,targetHeight:50,
  sourceFacingX:-1,mirrorHorizontal:false,shadow:{enabled:false}});
 assert.deepEqual(npc.mapVisual.animation.walk,[id+'.walk.0',id+'.walk.1']);
 assert.equal(npc.mapVisual.animation.framesPerSecond,12);
 assert.equal(npc.mapVisual.targetHeight,50);
 assert.equal(npc.mapVisual.shadow.enabled,false);
 assert.equal(npc.mapVisual.sourceFacingX,-1);
 assert.equal(npc.assets.length,5);
 assert.throws(()=>createUserNpcDefinitionV1({...base(),mode:'frames',walk:[]}));
 assert.throws(()=>createUserNpcDefinitionV1({...base(),mode:'frames',walk:[png(120,128)]}));
 const dirs=Object.fromEntries(['N','NE','E','SE','S','SW','W','NW'].map(d=>[d,
  [png(),png(),png(),png(),png(),png()]]));
 assert.equal(createUserNpcDefinitionV1({...base(),mode:'directions',directions:dirs}).assets.length,49);
});
test('trainer, merchant and future boss roles only use known canonical interaction types',()=>{
 assert.equal(npcKindForRoleV1('boss'),'dialogue');
 assert.equal(npcKindForRoleV1('adversary'),'dialogue');
 const npc=createUserNpcDefinitionV1({...base(),role:'trainer-aggressive',
  npc:{movement:{mode:'wander',radius:135},dialogue:'Duel !',
   trainerRoster:[{creatureId:'crea_dresseur',level:15}],
   trainerReward:{currency:45,items:[]}}});
 assert.equal(npc.npc.kind,'trainer');
 assert.equal(npc.npc.trainerEngagement,'aggressive');
 assert.equal(npc.npc.trainerRoster[0].creatureId,'crea_dresseur');
 assert.equal(npc.npc.trainerReward.currency,45);
 assert.equal(npc.npc.movement.mode,'wander');
 const merchant=createUserNpcDefinitionV1({...base(),role:'merchant',
  npc:{merchantId:'shop-authority-001'}});
 assert.equal(merchant.npc.kind,'merchant');
 assert.equal(merchant.npc.merchantId,'shop-authority-001');
 assert.throws(()=>createUserNpcDefinitionV1({...base(),role:'INVALID role'}));
});
test('user NPC asset paths are ephemeral URLs revoked after real image loader use',()=>{
 const npc=createUserNpcDefinitionV1({...base(),portrait:png(),mode:'frames',walk:[png()]});
 const created=[],revoked=[];
 const resolver=createUserNpcAssetResolverV1([npc],{urlApi:{
  createObjectURL(){const uri='blob:npc-'+created.length;created.push(uri);return uri;},
  revokeObjectURL(url){revoked.push(url);}
 }});
 assert.equal(resolver.list().length,4);
 assert.equal(resolver.resolve(id+'.base').provenance,'user-local');
 assert.equal(resolver.resolve('hero.user.something'),null);
 resolver.dispose();
 assert.equal(resolver.list().length,0);
 assert.deepEqual(revoked,created);
});
test('NPC bundle exports all actual media and imports without overwriting existing ID',async()=>{
 const original=createUserNpcDefinitionV1({...base(),role:'trainer-friendly',portrait:png(),
  mode:'frames',idle:[png()],walk:[png()],npc:{trainerRoster:[{creatureId:'crea_a',level:5}]}});
 const json=await exportUserNpcBundleV1(original);
 const copy=importUserNpcBundleV1(json,{mintId:()=>second});
 assert.equal(copy.id,second);
 assert.equal(copy.name,original.name);
 assert.equal(copy.npc.trainerRoster[0].creatureId,'crea_a');
 assert.deepEqual(copy.assets.map(a=>a.id),[
  second+'.base',second+'.portrait',second+'.idle.0',second+'.walk.0']);
 assert.equal(copy.assets[0].blob.size,original.assets[0].blob.size);
 assert.throws(()=>importUserNpcBundleV1('{"schema":"bad"}'),/Archive/);
});
test('WorldArea actors keep bare reference and historical per-map NPC records are preserved',()=>{
 const def=createUserNpcDefinitionV1({...base(),npc:{dialogue:'Je garde la ville',
  movement:{mode:'wander',radius:80}}});
 const placed=[{id:'actor-1',actorDefinitionId:id,x:150,y:220,facingX:1},
  {id:'actor-old',actorDefinitionId:id,x:30,y:40,npc:{
   kind:'dialogue',name:'Ancien',dialogue:'Sauvegarde 2026',
   movement:{mode:'static',radius:90}}}];
 const resolved=resolvePlacedNpcDefinitionsV1(placed,actorId=>actorId===id?def:null);
 assert.equal(placed[0].npc,undefined);
 assert.equal(resolved[0].npc.dialogue,'Je garde la ville');
 assert.equal(resolved[0].x,150);
 assert.equal(resolved[1],placed[1]);
 assert.equal(placed[1].npc.dialogue,'Sauvegarde 2026');
 const edited=createUserNpcDefinitionV1({...base(),npc:{dialogue:'Nouvelle fiche'}});
 assert.equal(resolvePlacedNpcDefinitionsV1(placed,()=>edited)[0].npc.dialogue,'Nouvelle fiche');
});
test('editor and visual preview use only native pipelines; no hero store or alternate collision',async()=>{
 const html=await readFile(new URL('../npc-editor.html',import.meta.url),'utf8');
 const js=await readFile(new URL('../src/actors/npc-editor-v1.js',import.meta.url),'utf8');
 assert.match(html,/id="npc-canvas"/);
 assert.match(html,/id="npc-gallery"/);
 assert.match(html,/id="npc-import"/);
 assert.match(js,/createMapActorRenderer/);
 assert.match(js,/createImageAssetLoader/);
 assert.match(js,/createMapActorVisualPreparer/);
 assert.match(js,/createUserNpcStoreV1/);
 assert.doesNotMatch(js,/createUserHeroStoreV1|setInterval\(/);
});
