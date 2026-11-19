import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {drawSculptTerrain,SCULPT_TILE,sculptPaintCellBoundsV1} from '../src/render/sculpt-height-renderer.js';

const src=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
const renderer=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
const initial=()=>createSculptTerrain({width:8,height:8,levels:Array(64).fill(5)});

function recorder(){
 const clipped=[],filled=[],ctx={
  fillStyle:null,strokeStyle:null,lineWidth:1,
  getTransform(){return {a:1.5,b:0,c:0,d:1.5,e:27,f:24};},
  save(){},restore(){},beginPath(){},closePath(){},
  rect(x,y,width,height){this.lastRect={x,y,width,height};},
  clip(){clipped.push(this.lastRect);},
  fillRect(x,y,width,height){filled.push({x,y,width,height,fill:this.fillStyle});},
  createPattern(){return {id:'canonical-ground'};},
  createLinearGradient(){return {addColorStop(){}};},
  fill(){},stroke(){},moveTo(){},lineTo(){},quadraticCurveTo(){},
  bezierCurveTo(){},drawImage(){},translate(){},scale(){}
 };
 return {ctx,clipped,filled};
}

test('raised plateaus preserve the exact authored texture with no tiled altitude wash',()=>{
 const map=initial(),before=JSON.stringify(map);
 const {ctx,clipped,filled}=recorder();
 const output=drawSculptTerrain(ctx,{
  terrain:map,material:{render:{baseColor:'#536247'}},
  texture:{id:'existing-grass'},drawOuterSouthRim:false
 });
 assert.equal(output.worldWidth,8*SCULPT_TILE.width);
 assert.equal(clipped.length,0,'no new clipping or duplicate paint authority');
 const fakeTints=filled.filter(f=>String(f.fill).startsWith('rgba(251,243,206,')||
   String(f.fill).startsWith('rgba(15,35,39,'));
 assert.equal(fakeTints.length,0,'raised terrain must not wash out grass/roads with per-tile overlays');
 const top=sculptPaintCellBoundsV1(ctx,0,-5*SCULPT_TILE.rise,28,21);
 const next=sculptPaintCellBoundsV1(ctx,0,-5*SCULPT_TILE.rise+21,28,21);
 assert.equal(Math.round((top.y+top.height)*1.5+24),
   Math.round(next.y*1.5+24),'canonical WorldSurface cells remain pixel-adjacent');
 assert.equal(JSON.stringify(map),before,'all authored heights remain unchanged');
});

test('equal-height baseline keeps the original unshaded texture path',()=>{
 const {ctx,clipped}=recorder();
 const flat=createSculptTerrain({width:8,height:8,levels:Array(64).fill(2)});
 drawSculptTerrain(ctx,{terrain:flat,material:{render:{baseColor:'#536247'}},
  texture:{id:'existing-grass'},drawOuterSouthRim:false});
 assert.equal(clipped.length,0,'no tint and no new layering on baseline');
});

test('north border trees remain backdrop, SOUTH border trees draw after the player',()=>{
 const start=src.indexOf('function draw(){');
 const end=src.indexOf('function scheduleDraw(',start);
 const draw=end>start?src.slice(start,end):src.slice(start);
 const back=draw.indexOf("drawDecorativeFringeObjects('back')");
 const hero=draw.indexOf('drawNavigationActor();');
 const south=draw.indexOf("drawDecorativeFringeObjects('front')");
 const markers=draw.indexOf('drawSculptWorldPortalMarkers();');
 assert.ok(back>=0&&hero>=0&&south>=0&&markers>=0);
 assert.ok(back<hero&&hero<south&&south<markers,
  'the real player stays behind south trees but in front of northern trees');
 assert.equal((draw.match(/drawDecorativeFringeObjects\('back'\)/g)||[]).length,1);
 assert.equal((draw.match(/drawDecorativeFringeObjects\('front'\)/g)||[]).length,1);
 assert.match(src,/layer==='front'\s*\?o\.transform\.y>=terrain\.height\*SCULPT_TILE\.height:o\.transform\.y<0/);
 assert.match(src,/if\(viewport&&!decorative&&/,
  'the global viewport must not cull chunk-local fringe object coordinates');
});

test('raised roads no longer receive tile-wide translucent rectangles',()=>{
 const first=renderer.indexOf('function drawSculptGroundReliefLighting(');
 const last=renderer.indexOf('export function sculptEastSeamBounds(',first);
 const lighting=renderer.slice(first,last);
 assert.ok(first>0&&last>first);
 assert.doesNotMatch(lighting,/ctx\.fillStyle=info\.tone/);
 assert.doesNotMatch(lighting,/sculptPaintCellBoundsV1\(ctx,x,y,w,h\)/);
 assert.match(lighting,/info\.contactShadows/,'real ledge shadows remain');
 assert.doesNotMatch(lighting,/ctx\.save\(\)|ctx\.clip\(\)/);
 assert.doesNotMatch(lighting,/new WorldSurface|localStorage|setItem/);
 const painter=renderer.slice(renderer.indexOf('function sculptPaintByCell('),
  renderer.indexOf('export function sculptHillTopProfile'));
 assert.match(painter,/sculptPaintCellClipV1\(ctx,x,y,w,h\)/);
 assert.doesNotMatch(painter,/ctx\.rect\(x,y,w\+\.65,h\+\.65\)/);
});
