import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,applySculptStroke} from '../src/world/sculpt-height-model.js';
import {sculptRoundedHillRegions} from '../src/render/sculpt-hill-region-contour.js';
import {sculptAltitudeVisualState} from '../src/render/sculpt-altitude-visual.js';
import {sculptRoundedHillRockPattern,drawSculptRoundedHillGrassLip}
  from '../src/render/sculpt-height-renderer.js';

test('R13 corners reuse HD artwork by palette, one world-anchored pattern per plateau raster',()=>{
  const tiles=[];
  const document={createElement(){
    return {width:0,height:0,getContext(){return {drawImage(...args){tiles.push(args)}}}};
  }};
  const hd={complete:true,naturalWidth:512,naturalHeight:256,ownerDocument:document};
  const calls=[],ctx={createPattern(img,mode){
    calls.push({img,mode});return {image:img,mode};
  }};
  const warm=sculptRoundedHillRockPattern(ctx,hd,'warm');
  const slate=sculptRoundedHillRockPattern(ctx,hd,'slate');
  assert.equal(warm.mode,'repeat');
  assert.equal(slate.mode,'repeat');
  assert.notEqual(warm.image,slate.image,'rock palette selects actual HD artwork');
  assert.equal(tiles.length,2,'the original HD adapter extracts two layers once');
  assert.equal(calls.length,2,'only one pattern per terrain render and palette');
  assert.equal(sculptRoundedHillRockPattern(ctx,null,'warm'),null);
});

test('R13 rounded region paints one continuous grass rim, no per-tile rectangles',()=>{
  const W=12,H=10,levels=Array(W*H).fill(2);
  for(let y=3;y<=6;y++)for(let x=4;x<=7;x++)levels[y*W+x]=5;
  const base=createSculptTerrain({width:W,height:H,levels});
  const terrain=applySculptStroke(base,{mode:'cliff-round',rockRoundness:150,
    radius:.5,points:[{x:5.5,y:5.5}]});
  const regions=sculptRoundedHillRegions(terrain);
  assert.equal(regions.size,16);
  const calls=[];
  const ctx={save(){calls.push('save')},restore(){calls.push('restore')},
    beginPath(){calls.push('beginPath')},moveTo(){},lineTo(){},
    quadraticCurveTo(){calls.push('curve')},closePath(){},
    clip(){calls.push('clip')},stroke(){calls.push('stroke')},
    fillRect(){throw Error('R13 lip must never stamp a tile rectangle')}};
  const painted=drawSculptRoundedHillGrassLip(ctx,regions,{width:28,height:21,rise:18},
    '#grass','green');
  assert.equal(painted,1,'the 16 cells belong to a single shaded contour');
  assert.equal(calls.filter(c=>c==='stroke').length,2,'one shadow and one grass contact edge');
  assert.equal(calls.filter(c=>c==='clip').length,1);
  assert.equal(calls.filter(c=>c==='curve').length,8,'both paths share four original convex curves');
  assert.deepEqual(terrain.levels,base.levels,'visual fill does not mutate the heightmap');
  assert.deepEqual(terrain.waterLevels,base.waterLevels);
});

test('R13 stronger hero perspective is monotone, sprite-only and bounded',()=>{
  const values=Array.from({length:8},(_,i)=>sculptAltitudeVisualState(i));
  assert.equal(values[2].heroScale,1);
  assert.equal(values[7].heroScale,1.19);
  assert.equal(values[0].heroScale,.924);
  for(let i=1;i<=7;i++)
    assert.ok(values[i].heroScale>values[i-1].heroScale,'no dead perspective level '+i);
  assert.ok(sculptAltitudeVisualState(-5).heroScale>=.75);
  assert.ok(sculptAltitudeVisualState(20).heroScale<=1.24);
  const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(source,/visualScale:sculptAltitudeVisualState\(navVisualLevel\?\?navHeight\(\)\)\.heroScale/);
  // Navigation and Collision World remain the already accepted R12 versions.
  const renderer=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
  assert.match(renderer,/if\(!roundedHill\)/);
  assert.match(renderer,/drawSculptRoundedHillGrassLip\(ctx,roundedHillRegions,tile,pattern,baseColor\)/);
});
