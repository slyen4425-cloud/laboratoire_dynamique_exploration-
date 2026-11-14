import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MAP_ACTOR_COMPASS_DIRECTIONS_V1} from '../src/actors/map-actor-visual-model.js';
import {createUserHeroDefinitionV1,validateUserHeroDefinitionV1} from '../src/actors/user-hero-definition-v1.js';
import {createMapActorRenderer} from '../src/render/map-actor-renderer.js';

const media=(data='a')=>({blob:new Blob([data],{type:'image/png'}),mimeType:'image/png',width:128,height:160});
const id='hero.user.5a0914d2-0ce6-4cd2-b180-c95b22475fc8';
const allDirections=()=>Object.fromEntries(MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(dir=>[dir,
 Array.from({length:6},(_,i)=>media(dir+i))]));
test('real official-style 49-asset definition can retain its id and edit size, idle bob and six sprites',()=>{
 const original=createUserHeroDefinitionV1({
  id,name:'Héros officiel original',base:media('S0'),mode:'directions',
  directions:allDirections(),targetHeight:58,now:'2026-11-13T11:00:00Z'
 });
 const old=id=>{const a=original.assets.find(a=>a.id===id);assert.ok(a);return a;};
 const updated=Object.fromEntries(MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(dir=>[
  dir,dir==='S'?Array.from({length:6},(_,i)=>media('replaced'+i)):
    original.mapVisual.animation.directions[dir].map(old)
 ]));
 const modified=createUserHeroDefinitionV1({
  id:original.id,name:'Héros personnalisé',base:updated.S[0],
  mode:'directions',directions:updated,framesPerSecond:8,targetHeight:25,
  motion:{...original.mapVisual.motion,idleAmplitude:1.5},
  now:original.createdAt
 });
 assert.equal(validateUserHeroDefinitionV1(modified),modified);
 assert.equal(modified.id,original.id);
 assert.equal(modified.mapVisual.targetHeight,25);
 assert.equal(modified.mapVisual.motion.idleAmplitude,1.5);
 assert.equal(modified.assets.length,49);
 assert.equal(modified.assets.find(x=>x.id===id+'.dir.N.0').blob,
   original.assets.find(x=>x.id===id+'.dir.N.0').blob);
 assert.equal(modified.assets.find(x=>x.id===id+'.base').blob,
   modified.assets.find(x=>x.id===id+'.dir.S.0').blob);
});
test('same native renderer applies user idle bob to compass sprites but never extra walking bob',()=>{
 const hero=createUserHeroDefinitionV1({
  id,name:'Héros de test',base:media(),mode:'directions',
  directions:allDirections(),targetHeight:25,
  motion:{idleAmplitude:1.5,idleFrequency:1,walkAmplitude:5,walkFrequency:4},
  now:'2026-11-13T11:00:00Z'
 });
 const translates=[],ctx={save(){},restore(){},beginPath(){},ellipse(){},fill(){},
  translate(x,y){translates.push([x,y]);},scale(){},drawImage(){}};
 const renderer=createMapActorRenderer({preparedVisuals:{get(){return {
  source:{},aspectRatio:.8,anchor:{x:.5,y:.96}
 }}}});
 const actor={x:100,y:120,directionX:0,directionY:1,mapVisual:hero.mapVisual};
 renderer.draw(ctx,{camera:{x:0,y:0},timeSeconds:.25,actors:[{...actor,moving:false}]});
 assert.ok(translates.at(-1)[1]<120,'idle bob is visible for authored sprite heroes');
 renderer.draw(ctx,{camera:{x:0,y:0},timeSeconds:.25,actors:[{...actor,moving:true}]});
 assert.equal(translates.at(-1)[1],120,'walking sprite animation remains stable');
});
test('native editor shows directional imports and a reversible size-25 preview while retaining a single DB',()=>{
 const html=readFileSync(new URL('../hero-editor.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../src/actors/hero-editor-v1.js',import.meta.url),'utf8');
 assert.match(html,/id="hero-directions-inputs"/);
 assert.match(html,/id="hero-try-25"/);
 assert.match(html,/id="hero-edit-state"/);
 assert.match(js,/directionFrames\(dir,previous\)/);
 assert.match(js,/await store\.put\(record\)/);
 assert.match(js,/const persisted=await store\.get\(record\.id\)/);
 assert.match(js,/MAP_ACTOR_COMPASS_DIRECTIONS_V1\.map\(dir/);
 assert.doesNotMatch(js,/localStorage\.setItem|createObjectStore/);
});
