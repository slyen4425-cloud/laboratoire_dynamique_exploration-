import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSculptBorderPreview,resolveSculptBorderBiome,sculptBorderStyle,
  sculptBorderSeed,drawSculptBorderExtension,drawSculptDistantBorders
} from '../src/render/sculpt-border-scenery-v1.js';

function canvasProbe(){
  const calls=[];
  const ctx={
    save(){calls.push(['save']);},
    restore(){calls.push(['restore']);},
    beginPath(){calls.push(['begin']);},
    closePath(){calls.push(['close']);},
    moveTo(x,y){calls.push(['move',x,y]);},
    lineTo(x,y){calls.push(['line',x,y]);},
    fill(){calls.push(['fill']);},
    stroke(){calls.push(['stroke']);},
    fillRect(x,y,w,h){calls.push(['rect',x,y,w,h]);},
    ellipse(x,y,rx,ry){calls.push(['ellipse',x,y,rx,ry]);}
  };
  return {ctx,calls};
}
const terrain=Object.freeze({width:36,height:24,levels:Object.freeze(Array(36*24).fill(2))});

test('border defaults are independent and do not mutate source',()=>{
  const raw={biome:'snow',sides:{front:{style:'cliffs',density:140,revision:2},
    right:{style:'forest',density:-30},left:{style:'invalid'}}};
  const snap=JSON.stringify(raw);
  const config=normalizeSculptBorderPreview(raw);
  assert.equal(JSON.stringify(raw),snap);
  assert.equal(config.biome,'snow');
  assert.equal(config.sides.front.style,'cliffs');
  assert.equal(config.sides.front.density,100);
  assert.equal(config.sides.right.density,0);
  assert.equal(config.sides.left.style,'auto');
  assert.equal(config.sides.back.density,55);
  assert.notEqual(config.sides.front,config.sides.right);
  assert(Object.isFrozen(config.sides.front));
});
test('biome chosen from author terrain family, with a safe fallback',()=>{
  assert.equal(resolveSculptBorderBiome('auto','snow'),'snow');
  assert.equal(resolveSculptBorderBiome('auto','road'),'plain');
  assert.equal(resolveSculptBorderBiome('forest','snow'),'forest');
  assert.equal(sculptBorderStyle('snow','auto'),'mountains');
  assert.equal(sculptBorderStyle('forest','auto'),'forest');
  assert.equal(sculptBorderStyle('forest','cliffs'),'cliffs');
});
test('render is deterministic for one area and can regenerate each side independently',()=>{
  const config={...normalizeSculptBorderPreview({biome:'forest'})};
  const first=canvasProbe(),second=canvasProbe(),other=canvasProbe();
  assert.deepEqual(drawSculptBorderExtension(first.ctx,{terrain,config,mapKey:'area-A'}),
    {sides:4,features:50}); // density 55% => 15 + 10 + 10 + 15
  drawSculptBorderExtension(second.ctx,{terrain,config,mapKey:'area-A'});
  assert.deepEqual(first.calls,second.calls);
  drawSculptBorderExtension(other.ctx,{terrain,config,mapKey:'area-B'});
  assert.notDeepEqual(first.calls,other.calls);
  assert.notEqual(sculptBorderSeed('area-A'),sculptBorderSeed('area-B'));
  const modified=normalizeSculptBorderPreview({biome:'forest',
    sides:{front:{revision:1}}});
  const regenerated=canvasProbe();
  drawSculptBorderExtension(regenerated.ctx,{terrain,config:modified,mapKey:'area-A'});
  assert.notDeepEqual(first.calls,regenerated.calls);
});
test('disabling scenery never touches the terrain model and paints nothing',()=>{
  const config=normalizeSculptBorderPreview({enabled:false});
  const {ctx,calls}=canvasProbe();
  const terrainBefore=JSON.stringify(terrain);
  assert.deepEqual(drawSculptBorderExtension(ctx,{terrain,config}),{sides:0,features:0});
  drawSculptDistantBorders(ctx,{width:1200,height:800,config});
  assert.deepEqual(calls,[]);
  assert.equal(JSON.stringify(terrain),terrainBefore);
});
test('distant backdrop renders only decorative Canvas paths',()=>{
  const {ctx,calls}=canvasProbe();
  drawSculptDistantBorders(ctx,{width:1200,height:800,
    config:{...normalizeSculptBorderPreview({biome:'snow'}),biome:'snow'},mapKey:'area-snow'});
  assert.equal(calls.filter(x=>x[0]==='fill').length,2);
  assert.equal(calls[0][0],'save');
  assert.equal(calls.at(-1)[0],'restore');
});
