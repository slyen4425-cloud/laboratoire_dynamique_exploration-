import test from 'node:test';
import assert from 'node:assert/strict';
import {sculptRockDetailPlan} from '../src/render/sculpt-rock-detail.js';
import {SCULPT_ROCK_PALETTES} from '../src/render/sculpt-height-renderer.js';

test('V45 mineral cliff facets are bounded, deterministic and vary per world face',()=>{
  const options={width:238,height:72,seed:155};
  const a=sculptRockDetailPlan(options),b=sculptRockDetailPlan(options);
  const c=sculptRockDetailPlan({...options,seed:156});
  assert.deepEqual(a,b);
  assert.notDeepEqual(a,c,'adjacent cliff runs must have different veining');
  assert.ok(a.facets.length>=10&&a.facets.length<=58*7);
  assert.ok(a.fractures.length>0&&a.fractures.length<=a.facets.length);
  assert.ok(a.facets.some(x=>x.shade>.60)&&a.facets.some(x=>x.shade<.4));
  for(const facet of a.facets){
    assert.equal(facet.points.length,6);
    for(const p of facet.points){assert.ok(p.every(Number.isFinite));}
  }
  const thin=sculptRockDetailPlan({width:3,height:5,seed:12});
  assert.ok(thin.facets.length<=1);
  const noSize=sculptRockDetailPlan({width:0,height:4});
  assert.equal(noSize.facets.length,0);
});
test('V45 preserve four old palettes while adding granite and ochre',()=>{
  for(const p of ['warm','slate','sandstone','dark','granite','ochre']){
    assert.equal(SCULPT_ROCK_PALETTES[p].length,4);
    assert.ok(SCULPT_ROCK_PALETTES[p].every(c=>/^#[0-9a-f]{6}$/i.test(c)));
  }
});
