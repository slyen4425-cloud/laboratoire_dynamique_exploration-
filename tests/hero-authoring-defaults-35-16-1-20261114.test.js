import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_HERO_VISUAL_SETTINGS_V1,MAP_ACTOR_ROLE_DEFAULTS,MAP_ACTOR_COMPASS_DIRECTIONS_V1}
 from '../src/actors/map-actor-visual-model.js';
import {createUserHeroDefinitionV1} from '../src/actors/user-hero-definition-v1.js';
import {normalizeOfficialHeroCatalogV1,installOfficialHeroPresetV1} from '../src/actors/official-hero-presets-v1.js';
import {createMapActorRenderer} from '../src/render/map-actor-renderer.js';

const catalog=JSON.parse(readFileSync(new URL('../assets/exploration/actors/official/catalog.json',import.meta.url),'utf8'));
const media=()=>({blob:new Blob(['PNG'],{type:'image/png'}),mimeType:'image/png',width:128,height:160});
const directions=()=>Object.fromEntries(MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(dir=>[dir,Array.from({length:6},media)]));
const id='hero.user.00000000-0000-4000-8000-000000000001';
test('one hero authoring default is 35 high, 16 FPS and oscillation 1 in both states',()=>{
 assert.deepEqual(DEFAULT_HERO_VISUAL_SETTINGS_V1,{targetHeight:35,framesPerSecond:16,idleAmplitude:1,walkAmplitude:1});
 assert.equal(MAP_ACTOR_ROLE_DEFAULTS.hero.targetHeight,35);
 for(const mode of ['image','frames','directions']){
  const definition=createUserHeroDefinitionV1({id,name:'Héros',base:media(),mode,
   ...(mode==='frames'?{walk:[media()]}:{}),
   ...(mode==='directions'?{directions:directions()}:{}),
   now:'2026-11-14T07:00:00Z'});
  assert.equal(definition.mapVisual.targetHeight,35);
  assert.equal(definition.mapVisual.motion.idleAmplitude,1);
  assert.equal(definition.mapVisual.motion.walkAmplitude,1);
  if(mode!=='image')assert.equal(definition.mapVisual.animation.framesPerSecond,16);
 }
});
test('the 12 official presets install with the new defaults, without editing authored frame PNGs',async()=>{
 const official=normalizeOfficialHeroCatalogV1(catalog);
 assert.equal(official.heroes.length,12);
 assert.ok(official.heroes.every(hero=>hero.fps===16));
 const installed=[];
 const record=await installOfficialHeroPresetV1({hero:official.heroes[0],
  store:{async list(){return []},async put(value){installed.push(value)}},
  fetchAsset:async()=>({ok:true,blob:async()=>new Blob(['PNG'],{type:'image/png'})}),
  baseUrl:'https://example.test/hero-editor.html',
  mintId:()=>id.slice(10),now:()=> '2026-11-14T07:00:00Z'});
 assert.equal(installed.length,1);
 assert.equal(record.mapVisual.targetHeight,35);
 assert.equal(record.mapVisual.animation.framesPerSecond,16);
 assert.equal(record.mapVisual.motion.idleAmplitude,1);
 assert.equal(record.mapVisual.motion.walkAmplitude,1);
 assert.equal(record.assets.length,49);
});
test('same native renderer applies authored oscillation to both idle and walking sprites',()=>{
 const visual=createUserHeroDefinitionV1({id,name:'Hero',base:media(),mode:'directions',
  directions:directions(),now:'2026-11-14T07:00:00Z'}).mapVisual;
 const ys=[];
 const ctx={save(){},restore(){},beginPath(){},ellipse(){},fill(){},translate(_x,y){ys.push(y)},
  scale(){},drawImage(){},set globalAlpha(_){},set fillStyle(_){}};
 const renderer=createMapActorRenderer({preparedVisuals:{get(){return {source:{},aspectRatio:.8,anchor:{x:.5,y:.96}}}}});
 const actor={x:100,y:100,directionX:0,directionY:1,mapVisual:visual};
 renderer.draw(ctx,{camera:{x:0,y:0},timeSeconds:1/(4*visual.motion.idleFrequency),actors:[{...actor,moving:false}]});
 assert.ok(ys.at(-1)<100,'idle oscillation remains enabled');
 renderer.draw(ctx,{camera:{x:0,y:0},timeSeconds:1/(4*visual.motion.walkFrequency),actors:[{...actor,moving:true}]});
 assert.ok(ys.at(-1)<100,'moving sprites also receive user-configured oscillation');
});
test('editor uses new default values rather than legacy hardcoded 58, 37, 8 or 0.55',()=>{
 const html=readFileSync(new URL('../hero-editor.html',import.meta.url),'utf8');
 const script=readFileSync(new URL('../src/actors/hero-editor-v1.js',import.meta.url),'utf8');
 assert.match(html,/id="hero-height"[^>]*value="35"/);
 assert.match(html,/id="hero-fps"[^>]*value="16"/);
 assert.match(html,/id="hero-idle-amplitude"[^>]*value="1"/);
 assert.match(html,/id="hero-walk-amplitude"[^>]*value="1"/);
 assert.match(script,/DEFAULT_HERO_VISUAL_SETTINGS_V1/);
});
