import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {normalizeMapActorVisual,MAP_ACTOR_COMPASS_DIRECTIONS_V1} from '../src/actors/map-actor-visual-model.js';
import {mapActorCompassDirectionV1,createMapActorRenderer} from '../src/render/map-actor-renderer.js';
import {normalizeOfficialHeroCatalogV1,installOfficialHeroPresetV1} from '../src/actors/official-hero-presets-v1.js';
import {validateUserHeroDefinitionV1} from '../src/actors/user-hero-definition-v1.js';

const catalog=JSON.parse(readFileSync(new URL('../assets/exploration/actors/official/catalog.json',import.meta.url),'utf8'));
test('the only official hero library contains twelve models, eight directions, six PNG frames each',()=>{
 const registry=normalizeOfficialHeroCatalogV1(catalog);
 assert.equal(registry.heroes.length,12);
 let count=0;const ids=new Set(),paths=new Set();
 for(const hero of registry.heroes){
   assert.ok(!ids.has(hero.id));ids.add(hero.id);
   for(const dir of MAP_ACTOR_COMPASS_DIRECTIONS_V1){
     assert.equal(hero.directions[dir].length,6);
     for(const path of hero.directions[dir]){
       assert.ok(!paths.has(path),'single source for '+path);paths.add(path);
       assert.ok(existsSync(new URL('../'+path,import.meta.url)),'missing '+path);
       const file=readFileSync(new URL('../'+path,import.meta.url));
       assert.equal(file.subarray(1,4).toString(),'PNG');
       assert.equal(file.readUInt32BE(16),128);
       assert.equal(file.readUInt32BE(20),160);
       count++;
     }
   }
   assert.ok(existsSync(new URL('../'+hero.thumbnail,import.meta.url)));
   assert.ok(existsSync(new URL('../'+hero.back,import.meta.url)));
 }
 assert.equal(count,576);
 assert.equal(paths.size,576);
});
test('renderer chooses real compass direction based on world movement, never mirrors an authored direction',()=>{
 const names=[['N',0,-1],['NE',1,-1],['E',1,0],['SE',1,1],
   ['S',0,1],['SW',-1,1],['W',-1,0],['NW',-1,-1]];
 for(const [expected,x,y] of names)
   assert.equal(mapActorCompassDirectionV1({directionX:x,directionY:y}),expected);
 const registry=normalizeOfficialHeroCatalogV1(catalog);
 const visual=normalizeMapActorVisual({assetId:'sample.base',role:'hero',
   animation:{mode:'directions',framesPerSecond:8,
      directions:Object.fromEntries(MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(dir=>[
        dir,registry.heroes[0].directions[dir].map((_,i)=>dir+'.'+i)]))}});
 const requested=[];
 const renderer=createMapActorRenderer({preparedVisuals:{get(id){requested.push(id);return {
   source:{},aspectRatio:.8,anchor:{x:.5,y:.96}
 }}}});
 const ctx={save(){},restore(){},beginPath(){},ellipse(){},fill(){},
   translate(){},scale(){},drawImage(){},set globalAlpha(_){},set fillStyle(_){}};
 for(const [dir,x,y] of names){
   renderer.draw(ctx,{camera:{x:0,y:0},timeSeconds:.375,actors:[{
     mapVisual:visual,x:0,y:0,moving:true,facingX:x<0?-1:1,
     directionX:x,directionY:y
   }]});
   assert.equal(requested.at(-1),dir+'.3');
 }
 assert.equal(visual.animation.mode,'directions');
});
test('choosing a preset uses automatically minted user ID and the ONE existing UserHeroStore',async()=>{
 const registry=normalizeOfficialHeroCatalogV1(catalog),hero=registry.heroes[3];
 const persisted=[];
 const encoded=new Blob([Uint8Array.of(137,80,78,71,1,2,3)],{type:'image/png'});
 const record=await installOfficialHeroPresetV1({
   hero,store:{async put(item){persisted.push(item)}},
   mintId:()=> '5a0914d2-0ce6-4cd2-b180-c95b22475fc8',
   now:()=> '2026-11-13T14:00:00Z',
   baseUrl:'https://game.example/hero-editor.html',
   fetchAsset:async()=>({ok:true,blob:async()=>encoded})
 });
 assert.equal(persisted.length,1);
 assert.equal(record.id,'hero.user.5a0914d2-0ce6-4cd2-b180-c95b22475fc8');
 assert.equal(record.mapVisual.animation.mode,'directions');
 assert.equal(record.assets.length,49);
 assert.equal(record.mapVisual.animation.directions.N.length,6);
 assert.equal(validateUserHeroDefinitionV1(record),record);
});
