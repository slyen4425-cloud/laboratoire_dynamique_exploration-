import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,applySculptStroke,sculptFaces,serializeSculptTerrain,
 importSculptTerrain} from '../src/world/sculpt-height-model.js';
import {sculptRoundedHillRegions,sculptHillRegionCornerRadius,sculptHillRegionOutline,
 sculptClipRoundedHill} from '../src/render/sculpt-hill-region-contour.js';

const W=12,H=10;
const hill=()=>{
 const levels=Array(W*H).fill(2);
 for(let y=3;y<=6;y++)for(let x=4;x<=7;x++)levels[y*W+x]=5;
 return createSculptTerrain({width:W,height:H,levels});
};
const paint=(map,x=5,y=5,value=150)=>applySculptStroke(map,{
 mode:'cliff-round',rockRoundness:value,radius:.5,points:[{x:x+.5,y:y+.5}]});
const events=()=>{
 const e=[];
 const rec={beginPath(){e.push(['begin'])},moveTo(...v){e.push(['move',...v])},
 lineTo(...v){e.push(['line',...v])},quadraticCurveTo(...v){e.push(['quad',...v])},
 closePath(){e.push(['close'])},clip(...v){e.push(['clip',...v])}};
 return {e,rec};
};
test('V61 a SINGLE touch in interior rounds all sixteen plateau cells, not a tiny tile',()=>{
 const original=hill(),painted=paint(original,5,5),regions=sculptRoundedHillRegions(painted);
 assert.equal(sculptRoundedHillRegions(original).size,0);
 assert.equal(regions.size,16);
 const region=regions.get(5*W+5);
 assert.ok(region);
 assert.equal(region,regions.get(3*W+4));
 assert.equal(region,regions.get(6*W+7));
 assert.equal(region.loops.length,1);
 assert.equal(region.loops[0].length,4,'whole rectangular hill has 4 true corners');
 assert.ok(sculptHillRegionCornerRadius(region)>21,'corners have multi-tile radii');
 assert.equal(painted.levels,original.levels);
 assert.equal(painted.waterLevels,original.waterLevels);
 assert.deepEqual(sculptFaces(painted),sculptFaces(original));
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(painted)),painted);
 assert.equal(sculptRoundedHillRegions(painted),regions,'immutable terrain caches geometry');
});
test('V61 clipped path spans whole hill in world coordinates and is curved',()=>{
 const regions=sculptRoundedHillRegions(paint(hill()));
 const {e,rec}=events(),region=regions.get(5*W+5);
 sculptClipRoundedHill(rec,region,{width:28,height:21,rise:18});
 assert.equal(e.filter(p=>p[0]==='quad').length,4);
 assert.equal(e.filter(p=>p[0]==='close').length,1);
 assert.equal(e.filter(p=>p[0]==='clip').length,1);
 const xs=e.flatMap(([kind,...args])=>kind==='move'||kind==='line'?[args[0]]:kind==='quad'?[args[0],args[2]]:[]);
 assert.ok(Math.max(...xs)-Math.min(...xs)>3*28,'the actual path is wider than three cells');
});
test('V61 concave shoulder and water hole do not create walkable or grass-filled holes',()=>{
 const original=hill(),levels=[...original.levels],waterLevels=[...original.waterLevels];
 // A one-cell lake inside hill should remain outside its dry contour.
 waterLevels[4*W+5]=8;
 // A notch on the southern contour must keep valid outline turns.
 levels[6*W+6]=2;
 const mixed=createSculptTerrain({width:W,height:H,levels,waterLevels});
 const painted=paint(mixed,5,5);
 const region=sculptRoundedHillRegions(painted).get(5*W+5);
 assert.ok(region);
 assert.equal(sculptRoundedHillRegions(painted).has(4*W+5),false);
 assert.equal(sculptRoundedHillRegions(painted).has(6*W+6),false);
 assert.ok(region.loops.some(loop=>loop.some(c=>(c.to-c.from+4)%4===3)),
   'concave turns must be explicitly represented, not filled');
 const {e,rec}=events();sculptHillRegionOutline(rec,region,{width:28,height:21,rise:18});
 assert.ok(e.some(p=>p[0]==='quad'));
});
test('V61 neutral 95 / sharp 0 remain opt-out and unchanged by whole-region mask',()=>{
 const old=hill();
 assert.equal(sculptRoundedHillRegions(old).size,0);
 assert.equal(sculptRoundedHillRegions(paint(old,5,5,95)).size,0);
 assert.equal(sculptRoundedHillRegions(paint(old,5,5,0)).size,0);
});
test('V61 controller makes one tap effective and renderer applies one coherent grass clipping path',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const renderer=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 assert.match(main,/Touche UNE FOIS LE MILIEU/);
 assert.match(main,/\$\('radius'\)\.value='\.5'/);
 assert.match(renderer,/sculptRoundedHillRegions\(terrain\)/);
 assert.match(renderer,/sculptClipRoundedHill\(ctx,roundedHill,tile\)/);
 assert.match(html,/src\/sculpt-lab-main\.js\?rev=sculpt-whole-hill-v61/);
 assert.doesNotMatch(renderer,/levels\[idx\]=/);
});
