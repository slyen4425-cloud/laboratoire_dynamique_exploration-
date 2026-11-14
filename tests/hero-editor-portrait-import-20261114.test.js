import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createUserHeroDefinitionV1,validateUserHeroDefinitionV1}
 from '../src/actors/user-hero-definition-v1.js';
import {MAP_ACTOR_COMPASS_DIRECTIONS_V1} from '../src/actors/map-actor-visual-model.js';

const id='hero.user.12345678-1234-4123-8123-123456789abc';
const png=(width,height)=>({blob:new Blob(['PNG'],{type:'image/png'}),
 mimeType:'image/png',width,height});
const directions=Object.fromEntries(MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(dir=>[
 dir,Array.from({length:6},()=>png(128,160))
]));

test('8 directional frames keep their canvas while the illustrated portrait is independent',()=>{
 const hero=createUserHeroDefinitionV1({id,name:'Héroïne',mode:'directions',
  base:directions.S[0],directions,portrait:png(640,960),
  now:'2026-11-14T15:00:00.000Z'});
 assert.equal(hero.assets.length,50);
 assert.equal(hero.assets.find(x=>x.id===id+'.portrait').width,640);
 assert.equal(hero.mapVisual.animation.directions.N.length,6);
 assert.equal(hero.mapVisual.assetId,id+'.base');
 assert.equal(validateUserHeroDefinitionV1(hero),hero);
 const invalid={...hero,assets:[...hero.assets,{...hero.assets[0],id:id+'.arbitrary'}]};
 assert.throws(()=>validateUserHeroDefinitionV1(invalid),/complete and exact/);
});

test('legacy image and directional heroes without portrait remain valid',()=>{
 const hero=createUserHeroDefinitionV1({id,name:'Ancien héros',
  base:png(128,160),mode:'directions',directions,
  now:'2026-11-14T15:00:00.000Z'});
 assert.equal(hero.assets.length,49);
 assert.equal(validateUserHeroDefinitionV1(hero),hero);
});

test('the sprite imports are folded and fiche illustration stays accessible independently',()=>{
 const html=readFileSync(new URL('../hero-editor.html',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../src/actors/hero-editor-v1.js',import.meta.url),'utf8');
 assert.match(html,/<details id="hero-sprite-settings"/);
 assert.match(html,/id="hero-portrait" type="file"/);
 assert.match(html,/id="hero-directions-inputs"/);
 assert.match(editor,/portrait=await uploaded\(\$\('hero-portrait'\)/);
 assert.match(editor,/refreshPortraitPreview\(\)/);
});
