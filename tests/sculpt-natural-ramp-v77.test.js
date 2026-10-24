import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,appendSculptTerrainRamp,removeSculptTerrainRampAt,
  sculptTerrainRampProjections,serializeSculptTerrain,importSculptTerrain}
  from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject,serializeSculptPreviewScene,
  importSculptPreviewScene,listSculptPlaceableDefinitions} from '../src/world/sculpt-scene-preview.js';
import {sculptStairCorridor,sculptStairHeightAt} from '../src/core/sculpt-stair-traversal.js';
import {sculptRampVisualMesh,drawSculptRamp} from '../src/render/sculpt-ramp-renderer.js';
import {sculptCameraGameView} from '../src/render/sculpt-camera-projection.js';
import {stepMovement} from '../src/core/movement.js';

const W=18,H=22,CW=28,CH=21;
const pt=(c,row)=>({x:(c+.5)*CW,y:(row+.5)*CH});
const build=levels=>createSculptTerrain({width:W,height:H,
  levels:Array.from({length:W*H},(_,i)=>levels(Math.floor(i/W),i%W))});
const terrace=()=>build(row=>row<8?5:2);
const createRamp=(terrain,{from=pt(8,12),to=pt(8,3),width=84}={})=>
  appendSculptTerrainRamp(terrain,{x:from.x,y:from.y,endX:to.x,endY:to.y,width});
const projections=t=>sculptTerrainRampProjections(t);
const context=t=>({sculptNavigation:{terrain:t,stairs:projections(t),
  bridges:[],cellWidth:CW,cellHeight:CH,projectionRise:18,maxStepUp:0,maxStepDown:0}});
const world=()=>({width:W*CW,height:H*CH,objects:[],obstacles:[]});
const actor=()=>({x:pt(8,13).x,y:pt(8,13).y,radius:5,locomotion:{modes:['ground']}});
const walk=(w,p,t,dy,n=90)=>{const ctx=context(t);for(let i=0;i<n;i++)
  stepMovement(w,p,{x:0,y:dy},.04,{maxSpeed:95},undefined,ctx);};

test('V77 R2 pente = outil du TERRAIN, pas un objet du catalogue; aucun matériau artificiel',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const render=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
  assert.match(html,/data-mode="terrain-ramp"/);
  assert.match(html,/data-mode="terrain-ramp-erase"/);
  assert.doesNotMatch(html,/<option value="ramp">/);
  assert.ok(!listSculptPlaceableDefinitions().some(d=>d.kind==='ramp'));
  assert.match(main,/appendSculptTerrainRamp\(strokeUndo,/);
  assert.match(main,/removeSculptTerrainRampAt\(strokeUndo,/);
  assert.match(main,/sculptTerrainRampProjections\(terrain\)/);
  assert.match(render,/for\(const ramp of sculptTerrainRampProjections\(terrain\)\)/);
  assert.match(render,/tileWidth:w,tileHeight:h,rise,texture,baseColor/);
});

test('V77 R2 pente native appartient aux hauteurs, sérialisation, undo immutable et effacement',()=>{
  const terrain=terrace(),before=serializeSculptTerrain(terrain);
  const next=createRamp(terrain),ramp=projections(next)[0];
  assert.equal(terrain.ramps.length,0);
  assert.equal(next.ramps.length,1);
  assert.equal(ramp.kind,'ramp');
  assert.equal(sculptStairCorridor(next,ramp).bottomLevel,2);
  assert.equal(sculptStairCorridor(next,ramp).topLevel,5);
  assert.equal(sculptStairHeightAt(next,projections(next),ramp.id,
    ramp.transform.x,ramp.transform.y-ramp.baseSize.height/2),3.5);
  assert.equal(serializeSculptTerrain(terrain),before);
  assert.deepEqual(importSculptTerrain(serializeSculptTerrain(next)).ramps,next.ramps);
  assert.equal(removeSculptTerrainRampAt(next,pt(8,9).x,pt(8,9).y).ramps.length,0);
  assert.deepEqual(importSculptTerrain(before).ramps,[],'old JSON retains compatibility');
});

test('V77 R2 montée + descente via collision préexistante; falaise nue bloquante',()=>{
  const native=createRamp(terrace()),w=world(),p=actor();
  walk(w,p,native,-1,90);
  assert.ok(p.y<8*CH,'arrivée sur plateau haut, obtenu y='+p.y);
  assert.equal(p.sculptStairId,null);
  walk(w,p,native,1,90);
  assert.ok(p.y>12*CH,'retour en bas, obtenu y='+p.y);
  const bare=actor();walk(w,bare,terrace(),-1,90);
  assert.ok(bare.y>=8*CH,'falaise toujours bloquée sans pente');
});

test('V77 R2 pentes refusées en eau, sur faible longueur, mauvaises hauteurs et hors carte',()=>{
  const t=terrace(),from=pt(8,12);
  assert.equal(createRamp(t,{to:pt(8,10)}),t);
  assert.equal(createRamp(t,{to:pt(8,14)}),t);
  assert.equal(createRamp(t,{to:{x:from.x,y:-200}}),t);
  const water=Array(W*H).fill(-1);water[3*W+8]=8;
  const wet=createSculptTerrain({width:W,height:H,levels:t.levels,waterLevels:water});
  assert.equal(createRamp(wet),wet);
  assert.equal(createRamp(t,{width:2}),t);
  assert.throws(()=>importSculptTerrain({...JSON.parse(serializeSculptTerrain(t)),
    ramps:[{id:'wrong',x:0,y:0,length:100,width:30,rotationDeg:0}]}));
});

test('V77 R2 deux pentes terrain 2→4→6, montée/descente, export/import scene inchangé',()=>{
  let t=build(row=>row<8?6:row<14?4:2);
  t=createRamp(t,{from:pt(8,17),to:pt(8,11),width:84});
  t=createRamp(t,{from:pt(8,11),to:pt(8,5),width:84});
  assert.equal(t.ramps.length,2);
  assert.deepEqual(projections(t).map(p=>sculptStairCorridor(t,p).bottomLevel),[2,4]);
  assert.deepEqual(projections(t).map(p=>sculptStairCorridor(t,p).topLevel),[4,6]);
  const p={...actor(),y:pt(8,18).y};walk(world(),p,t,-1,165);
  assert.ok(p.y<8*CH,'deux pentes montées, y='+p.y);
  walk(world(),p,t,1,165);assert.ok(p.y>17*CH);
  const saved=importSculptPreviewScene(serializeSculptPreviewScene(t,[]));
  assert.equal(saved.objects.length,0);
  assert.deepEqual(saved.terrain.ramps,t.ramps);
});

test('V77 R2 migration des anciennes pentes V77 Objets dans le relief',()=>{
  const t=terrace();
  const legacy=appendSculptPreviewObject([],{definitionId:'objectdef.ramp.grass.01',
    ...pt(8,12),scaleX:.45,scaleY:1});
  const scene=importSculptPreviewScene(serializeSculptPreviewScene(t,legacy));
  assert.equal(scene.objects.length,0);
  assert.equal(scene.terrain.ramps.length,1);
  assert.ok(sculptStairCorridor(scene.terrain,projections(scene.terrain)[0]));
});

test('V77 R2 texture du sol de base réutilisée, perspective 90 55 35 sans bande hardcodée',()=>{
  const t=createRamp(terrace()),r=projections(t)[0];
  const heights=[];
  for(const degrees of [90,55,35]){
    const mesh=sculptRampVisualMesh(t,r,{view:sculptCameraGameView(degrees)});
    assert.equal(mesh.valid,true);
    heights.push(mesh.samples[0].left.y-mesh.samples.at(-1).left.y);
  }
  assert.ok(heights[0]>heights[1]&&heights[1]>heights[2]);
  const code=readFileSync(new URL('../src/render/sculpt-ramp-renderer.js',import.meta.url),'utf8');
  assert.doesNotMatch(code,/const PALETTE/);
  assert.match(code,/ctx\.fillStyle=pattern\?\?baseColor/);
  // Mock canvas validates that the EXACT supplied terrain pattern wins.
  const fills=[];
  const ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},
    closePath(){},fill(){fills.push(this.fillStyle);},stroke(){},
    createPattern(){return 'native-grass-pattern';}};
  assert.equal(drawSculptRamp(ctx,r,t,{texture:{},baseColor:'#123456'}),true);
  assert.ok(fills.length>0&&fills.every(x=>x==='native-grass-pattern'));
});
