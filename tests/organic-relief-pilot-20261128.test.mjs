import test from 'node:test';
import assert from 'node:assert/strict';
import {contourAt,chamferLoop,reliefPlan,reliefWallPlan,organicPoint,normalizeReliefSettings,RELIEF_PRESETS,organicReliefPreviewBlockReason,organicReliefSafePatches} from '../prototypes/organic-relief-pilot.mjs';
const t=(rows)=>({width:rows[0].length,height:rows.length,levels:rows.flat()});
test('single continuous contour for connected staircase; no input mutation',()=>{
 const m=t([[0,1,1],[1,1,0],[1,0,0]]),before=JSON.stringify(m);
 const loops=contourAt(m,1);assert.equal(loops.length,1);
 const c=chamferLoop(loops[0]);assert.ok(c.some((p,i)=>{const q=c[(i+1)%c.length];return p[0]!==q[0]&&p[1]!==q[1];}));
 assert.equal(JSON.stringify(m),before);
});
test('diagonal touching islands do not merge',()=>assert.equal(contourAt(t([[1,0],[0,1]]),1).length,2));
test('hole remains a separate contour',()=>assert.equal(contourAt(t([[1,1,1],[1,0,1],[1,1,1]]),1).length,2));
test('zero chamfer reproduces grid and clamps extreme controls',()=>{
 const l=[[0,0],[1,0],[1,1],[0,1]];assert.deepEqual(chamferLoop(l,{amount:0}),[[0,0],[28,0],[28,21],[0,21]]);
 assert.deepEqual(chamferLoop(l,{amount:99}),chamferLoop(l,{amount:.5}));
});
test('height terraces use canonical levels, including 16',()=>{
 const p=reliefPlan(t([[0,4],[16,4]]));assert.deepEqual(p.terraces.map(x=>[x.lower,x.level]),[[0,4],[4,16]]);
});

test('full diagonal removes the micro stair between consecutive 1-cell turns',()=>{
 const m=t([[0,0,0,1],[0,0,1,1],[0,1,1,1],[1,1,1,1]]);
 const [loop]=contourAt(m,1),p=chamferLoop(loop,{amount:.5});
 const diagonal=p.some((a,i)=>{const b=p[(i+1)%p.length];return Math.abs(b[0]-a[0])>=56&&Math.abs(b[1]-a[1])>=42;});
 assert.ok(diagonal,'must collapse multiple adjacent stair turns into one diagonal');
 assert.ok(p.every((a,i)=>{const b=p[(i+1)%p.length];return a[0]!==b[0]||a[1]!==b[1];}));
});
test('chamfer keeps tiny diagonal-touching islands separate',()=>{
 const loops=contourAt(t([[1,0],[0,1]]),1).map(l=>chamferLoop(l,{amount:.5}));
 assert.equal(loops.length,2);assert.ok(loops.every(l=>l.length===4));
});

test('an unrelated height must not create a false horizontal cliff band',()=>{
 const map=t([[0,0,0,0,0],[0,4,4,0,3],[0,4,4,0,0],[0,0,0,0,0]]);
 const p=reliefWallPlan(map);
 const front=p.edges.filter(e=>e.b[0]<e.a[0]&&e.a[0]<90&&e.a[0]>28&&e.a[1]>50);
 assert.ok(front.length>0);
 assert.ok(front.every(e=>e.lower===0&&e.upper===4));
});
test('actual adjoining terrace keeps the correct wall rise',()=>{
 const p=reliefWallPlan(t([[0,0,0],[0,7,0],[0,4,0],[0,0,0]]),{amount:0});
 assert.ok(p.edges.some(e=>e.a[1]===42&&e.b[0]<e.a[0]&&e.lower===4&&e.upper===7));
});
test('natural perturbation is deterministic, bounded and disabled at zero',()=>{
 const a=[40,90],q=organicPoint(a);
 assert.deepEqual(q,organicPoint(a));assert.deepEqual(organicPoint(a,0),a);
 assert.ok(Math.abs(q[0]-a[0])<3&&Math.abs(q[1]-a[1])<3);
});

test('R4 visual controls are independent and clamped, never change terrain',()=>{
 const m=t([[0,4],[0,4]]),before=JSON.stringify(m);
 const base=normalizeReliefSettings(),rear=normalizeReliefSettings({rearWidth:9,rearOpacity:.95});
 assert.equal(rear.rearWidth,9);assert.equal(rear.rearOpacity,.95);
 assert.equal(base.ambient,rear.ambient);assert.equal(base.contrast,rear.contrast);
 assert.equal(normalizeReliefSettings({ambient:5,rearWidth:-4,contrast:NaN}).ambient,1);
 assert.equal(normalizeReliefSettings({rearWidth:-4}).rearWidth,0);
 assert.equal(normalizeReliefSettings({contrast:NaN}).contrast,base.contrast);
 reliefWallPlan(m,rear);assert.equal(JSON.stringify(m),before);
 assert.ok(RELIEF_PRESETS.marked.rearWidth>RELIEF_PRESETS.natural.rearWidth);
 assert.ok(RELIEF_PRESETS.marked.ambient>RELIEF_PRESETS.light.ambient);
});

test('R5 front crest settings are independent from rear crest and lip',()=>{
 const base=normalizeReliefSettings(),front=normalizeReliefSettings({frontWidth:8,frontOpacity:.8});
 assert.equal(front.frontWidth,8);assert.equal(front.frontOpacity,.8);
 for(const k of ['rearWidth','rearOpacity','lip','ambient','contrast'])assert.equal(front[k],base[k]);
 assert.equal(normalizeReliefSettings({frontWidth:99}).frontWidth,10);
 assert.equal(normalizeReliefSettings({frontOpacity:0}).frontOpacity,0);
 assert.equal(normalizeReliefSettings({frontWidth:0}).frontWidth,0);
 assert.ok(RELIEF_PRESETS.marked.frontWidth>RELIEF_PRESETS.natural.frontWidth);
});

test('editor preview falls back rather than erasing unsupported native features',()=>{
 const m=t([[0,0,0],[0,4,0],[0,0,0]]),ok={texture:{width:128},rock:{}};
 assert.equal(organicReliefPreviewBlockReason(m,ok),'');
 assert.match(organicReliefPreviewBlockReason({...m,waterLevels:[1]},ok),/Eau/);
 assert.match(organicReliefPreviewBlockReason(m,{...ok,paintSurface:{routes:[{}]}}),/routes/);
 assert.match(organicReliefPreviewBlockReason(m,{...ok,paintSurface:{zones:[{}]}}),/Textures/);
 assert.match(organicReliefPreviewBlockReason({...m,ramps:[{}]},ok),/Pentes/);
 assert.match(organicReliefPreviewBlockReason(t([[4,0],[0,0]]),ok),/bord/);
 assert.match(organicReliefPreviewBlockReason(m,{...ok,overlays:{road:{visible:true}}}),/Route/);
 assert.match(organicReliefPreviewBlockReason(m,{...ok,cliffMoss:true}),/Mousse/);
});

test('mixed map keeps an isolated hill eligible despite a distant lake and route',()=>{
 const w=36,h=24,levels=Array(w*h).fill(2),waterLevels=Array(w*h).fill(-1);
 for(let y=8;y<=11;y++)for(let x=5;x<=9;x++)levels[y*w+x]=5;
 for(let y=16;y<=18;y++)for(let x=24;x<=27;x++)waterLevels[y*w+x]=4;
 const terrain={width:w,height:h,levels,waterLevels},before=JSON.stringify(terrain);
 const options={paintSurface:{routes:[{points:[{x:700,y:120},{x:860,y:130}],width:20}]}};
 const patches=organicReliefSafePatches(terrain,options);
 assert.equal(patches.length,1);assert.equal(JSON.stringify(terrain),before);
 assert.equal(patches[0].terrain.levels[8*w+5],5);
 assert.equal(patches[0].terrain.levels[0],2);
});
test('mixed map skips hills whose projected pixels meet painted features or water',()=>{
 const w=36,h=24,levels=Array(w*h).fill(2),waterLevels=Array(w*h).fill(-1);
 for(let y=8;y<=11;y++)for(let x=5;x<=9;x++)levels[y*w+x]=5;
 const terrain={width:w,height:h,levels,waterLevels};
 assert.equal(organicReliefSafePatches(terrain,{paintSurface:{zones:[{points:[{x:150,y:180},{x:230,y:210}],width:30}]}}).length,0);
 waterLevels[12*w+7]=4;
 assert.equal(organicReliefSafePatches(terrain).length,0);
});
