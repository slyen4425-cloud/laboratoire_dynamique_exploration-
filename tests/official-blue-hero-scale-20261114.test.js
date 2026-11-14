import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeOfficialHeroCatalogV1,installOfficialHeroPresetV1} from '../src/actors/official-hero-presets-v1.js';
import {DEFAULT_HERO_VISUAL_SETTINGS_V1} from '../src/actors/map-actor-visual-model.js';
const catalog=normalizeOfficialHeroCatalogV1(JSON.parse(readFileSync(new URL('../assets/exploration/actors/official/catalog.json',import.meta.url))));
const fakeImage=new Blob([Uint8Array.of(137,80,78,71,10,20,30)],{type:'image/png'});
const net=async()=>({ok:true,blob:async()=>fakeImage});
test('only official blue hero is reduced; the other eleven keep their common scale',()=>{
 assert.equal(catalog.heroes[0].id,'hero.official.01_heros_bleu');
 assert.equal(catalog.heroes[0].targetHeight,30);
 assert.equal(catalog.heroes.filter(h=>h.targetHeight!==undefined).length,1);
 assert.equal(DEFAULT_HERO_VISUAL_SETTINGS_V1.targetHeight,35);
});
test('new blue hero installs smaller, reselecting unmodified existing hero repairs scale without duplicate',async()=>{
 let recorded=null,writes=0;
 const store={async list(){return recorded?[recorded]:[];},async put(r){recorded=r;writes++}};
 const a=await installOfficialHeroPresetV1({hero:catalog.heroes[0],store,fetchAsset:net,
  baseUrl:'https://game.example/',mintId:()=> '12345678-1234-4123-8123-123456789012',now:()=>new Date().toISOString()});
 assert.equal(a.mapVisual.targetHeight,30);
 // Simulate a previously installed, untouched official blue preset.
 recorded={...a,mapVisual:{...a.mapVisual,targetHeight:35}};
 const b=await installOfficialHeroPresetV1({hero:catalog.heroes[0],store,fetchAsset:net,
  baseUrl:'https://game.example/',mintId:()=>{throw new Error('must reuse original id')}});
 assert.equal(b.id,a.id);
 assert.equal(b.mapVisual.targetHeight,30);
 assert.equal(writes,2,'only one in-place repair');
});
