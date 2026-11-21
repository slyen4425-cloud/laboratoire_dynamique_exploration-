import test from 'node:test';
import assert from 'node:assert/strict';
import {filterNpcVisualEntriesV1,npcVisualHeroStyleV1}
 from '../src/actors/npc-visual-library-v1.js';
import {createCaptureActorLibraryProviderV1}
 from '../src/capture/capture-actor-preview-loader-v1.js';

test('search and categories filter only official projected entries',()=>{
 const creatures=[
  {name:'Loup volcanique',tags:['Feu','Ombre']},
  {name:'Tortue glacée',tags:['Glace']},
  {name:'Loup des bois',tags:['Nature']}
 ];
 assert.deepEqual(filterNpcVisualEntriesV1(creatures,{search:'loup',category:'Nature'})
  .map(x=>x.name),['Loup des bois']);
 assert.equal(filterNpcVisualEntriesV1(creatures,{category:'Feu'})[0].name,'Loup volcanique');
 assert.equal(filterNpcVisualEntriesV1(creatures,{search:'inexistant'}).length,0);
 assert.deepEqual(filterNpcVisualEntriesV1(creatures),creatures);
});
test('hero style filters use published name, without inventing player gender',()=>{
 assert.equal(npcVisualHeroStyleV1('Heros bleu'),'Homme');
 assert.equal(npcVisualHeroStyleV1('Heroine rose casquette'),'Femme');
 assert.equal(npcVisualHeroStyleV1('Voyageur personnalisé'),'Créations personnelles');
});
test('full creature gallery uses original Combat transfer IDs and the canonical global media catalog',async()=>{
 const bundle={schema:'capture-author-encounter-bundle-v1',version:1,
  creatureTransfers:[{schema:'capture-creature-transfer-v1',version:1,
   draft:{id:'crea-loup',displayName:'Loup volcanique',
    presentation:{visual:{front:{assetId:'pack:capture:loup-front'}}}}}],
  skillTransfers:[{draft:{id:'skill-test'}}]};
 const globalCatalog={assets:[{id:'pack:capture:loup-front',
  resource:{file:'capture/creatures/loup/runtime/front.webp'}}]};
 const urls=[];
 const provider=await createCaptureActorLibraryProviderV1({
  fetchImpl:async url=>{
   urls.push(String(url));
   return {ok:true,json:async()=>String(url).includes('encounter-bundle')?bundle:globalCatalog};
  }
 });
 const wolf=provider.resolveDefinition('capture:creature:crea-loup');
 assert.equal(wolf.displayName,'Loup volcanique');
 assert.match(provider.resolveAsset(wolf.mapVisual.assetId).path,
  /capture-assets\/assets\/library\/capture\/creatures\/loup\/runtime\/front\.webp$/);
 assert.equal(urls.length,2);
 assert.equal(provider.listDefinitions().length,1);
});
