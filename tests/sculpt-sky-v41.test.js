import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCULPT_SKY_PRESETS,SCULPT_SKY_DEFAULTS,sculptSkyPreset,drawSculptSkyBackdrop}
  from '../src/render/sculpt-sky-backdrop.js';

const mockCanvas=()=>({
  paths:0,rects:0,
  createLinearGradient(){return {addColorStop(){}};},
  beginPath(){this.paths++;},moveTo(){},lineTo(){},closePath(){},
  ellipse(){},arc(){},fill(){},save(){},restore(){},
  fillRect(){this.rects++;}
});

test('V41 morning midday evening night have distinct sky palettes and safe defaults',()=>{
  assert.deepEqual(Object.keys(SCULPT_SKY_PRESETS),['morning','midday','evening','night']);
  assert.equal(SCULPT_SKY_DEFAULTS.time,'midday');
  assert.equal(sculptSkyPreset('missing'),SCULPT_SKY_PRESETS.midday);
  assert.equal(new Set(Object.values(SCULPT_SKY_PRESETS).map(x=>x.zenith)).size,4);
  assert.equal(new Set(Object.values(SCULPT_SKY_PRESETS).map(x=>x.horizon)).size,4);
});

test('V41 night stars only occur at night and respond to the user toggle',()=>{
  for(const time of ['morning','midday','evening']){
    const ctx=mockCanvas(),stats=drawSculptSkyBackdrop(ctx,{width:400,height:260,time});
    assert.equal(stats.starsDrawn,0,time+' should have no stars');
    assert.ok(stats.cloudsDrawn>0);
    assert.ok(ctx.rects>=2);
  }
  const ctx=mockCanvas();
  const night=drawSculptSkyBackdrop(ctx,{width:400,height:260,time:'night'});
  assert.equal(night.starsDrawn,72);
  assert.equal(night.cloudsDrawn,5);
  assert.equal(drawSculptSkyBackdrop(mockCanvas(),{width:400,height:260,time:'night',stars:false}).starsDrawn,0);
  assert.equal(drawSculptSkyBackdrop(mockCanvas(),{width:400,height:260,time:'night',clouds:false,mist:false}).cloudsDrawn,0);
});

test('V41 is scoped to Tester and uses one fixed background cache, no animated timer',()=>{
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.match(main,/if\(navigationTesting\)\{\s*const sky=navigationSkyBackdrop/);
  assert.match(main,/if\(navSkyCache\?\.key===key\)return navSkyCache/);
  assert.match(main,/sky\.image,0,0,width,height/);
  assert.doesNotMatch(main,/setInterval\(/);
  assert.equal((html.match(/id="navigation-sky-time"/g)||[]).length,1);
  assert.equal((html.match(/id="navigation-sky-clouds"/g)||[]).length,1);
  assert.equal((html.match(/id="navigation-sky-mist"/g)||[]).length,1);
  assert.equal((html.match(/id="navigation-sky-stars"/g)||[]).length,1);
  assert.match(html,/rev=sculpt-(?:sky-v41|actor-presentation-v42|continuous-cliff-v53|rounded-hills-v54|bridge-crossing-v55|bridge-polish-v56|bridge-deck-v57|bridge-foot-clean-v58)/);
});
