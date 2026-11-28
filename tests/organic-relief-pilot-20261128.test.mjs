import test from 'node:test';
import assert from 'node:assert/strict';
import {contourAt,chamferLoop,reliefPlan} from '../prototypes/organic-relief-pilot.mjs';
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
