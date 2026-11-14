import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeOfficialHeroCatalogV1,installOfficialHeroPresetV1}
 from '../src/actors/official-hero-presets-v1.js';

const catalog=normalizeOfficialHeroCatalogV1(JSON.parse(
 readFileSync(new URL('../assets/exploration/actors/official/catalog.json',import.meta.url),'utf8')));

test('second tap on the exact official model reuses the same user hero ID without a new write',async()=>{
 const saved=[];let writes=0,downloads=0;
 const store={
   async list(){return [...saved];},
   async put(record){saved.push(record);writes++;}
 };
 const bytes=new Blob([Uint8Array.of(137,80,78,71,55,1,2)],{type:'image/png'});
 const fetchAsset=async()=>{downloads++;return{ok:true,blob:async()=>bytes};};
 const hero=catalog.heroes[4];
 const first=await installOfficialHeroPresetV1({
   hero,store,baseUrl:'https://example.test/',fetchAsset,
   mintId:()=> '5a0914d2-0ce6-4cd2-b180-c95b22475fc8',
   now:()=> '2026-11-14T01:00:00.000Z'
 });
 const second=await installOfficialHeroPresetV1({
   hero,store,baseUrl:'https://example.test/',fetchAsset,
   mintId:()=>{throw Error('Duplicate ID should never be minted');}
 });
 assert.equal(first.id,second.id);
 assert.equal(writes,1);
 assert.equal(saved.length,1);
 assert.equal(second.assets.length,49);
 assert.equal(downloads,49,'only one thumbnail-equivalent PNG check for repeat tap');
});
test('editor explicitly exposes saved hero count and one-at-a-time deletion, never auto-deletes duplicates',()=>{
 const html=readFileSync(new URL('../hero-editor.html',import.meta.url),'utf8');
 const code=readFileSync(new URL('../src/actors/hero-editor-v1.js',import.meta.url),'utf8');
 assert.match(html,/id="hero-library-count"/);
 assert.match(html,/Supprimer ce héros sélectionné/);
 assert.match(code,/nom\(s\) répété\(s\) à vérifier/);
 assert.match(code,/records\.at\(-1\)\?\.id/);
 assert.match(code,/await store\.delete\(selected\.id\)/);
 assert.doesNotMatch(code,/for\s*\([^)]*records[^)]*\)\s*await store\.delete/);
});

test('legacy 58px/8FPS installed model is reused, never overwritten by new defaults',async()=>{
 const saved=[];let writes=0;
 const store={async list(){return saved},async put(record){saved.push(record);writes++}};
 const blob=new Blob([Uint8Array.of(137,80,78,71,55,1,2)],{type:'image/png'});
 const args={hero:catalog.heroes[0],store,baseUrl:'https://example.test/',
  fetchAsset:async()=>({ok:true,blob:async()=>blob}),
  mintId:()=> '5a0914d2-0ce6-4cd2-b180-c95b22475fc8'};
 const modern=await installOfficialHeroPresetV1(args);
 const legacy=Object.freeze({...modern,mapVisual:Object.freeze({...modern.mapVisual,
   targetHeight:58,animation:Object.freeze({...modern.mapVisual.animation,framesPerSecond:8})})});
 saved[0]=legacy; // mock an existing historical saved definition, not a runtime migration
 const found=await installOfficialHeroPresetV1({...args,mintId:()=>{throw Error('Duplicate installation')}});
 assert.equal(found,legacy);
 assert.equal(found.mapVisual.targetHeight,58);
 assert.equal(found.mapVisual.animation.framesPerSecond,8);
 assert.equal(writes,1,'customized/legacy record is untouched');
});
