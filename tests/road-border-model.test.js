import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWorldSurface} from '../src/world/surface-model.js';
import {createSculptSurface,appendSculptSurfaceStroke,eraseSculptSurfaceStroke,editSculptRoute,normalizeSculptSurface} from '../src/world/sculpt-surface-paint.js';
import {routeKnotsFromPoints} from '../src/world/road-edit-geometry-v1.js';
import {roadBorderField,roadBorderTextureAt,roadBorderSourceProfile,roadBorderSourceAlpha} from '../src/render/road-border-renderer-v1.js';

const route={id:'route-a',width:50,materialId:'road.dirt',terrainFamilyId:'road',
  traversalRuleId:'terrain.road',points:[{x:20,y:30},{x:80,y:40}]};
const style={assetId:'road-border.bordure_naturelle',width:8,scale:1,offset:0,spacing:2,opacity:.8};

test('legacy route stays identical and has no border field',()=>{
  const actual=normalizeWorldSurface({routes:[route]}).routes[0];
  assert.deepEqual(actual,route);
  assert.equal('border' in actual,false);
});
test('two independent sides survive JSON export/import without changing route geometry',()=>{
  const input={...route,border:{enabled:true,left:style,right:{...style,assetId:'road-border.bordure_beton'}}};
  const surface=normalizeWorldSurface({routes:[input]});
  assert.deepEqual(surface.routes[0],input);
  assert.deepEqual(normalizeWorldSurface(JSON.parse(JSON.stringify(surface))),surface);
  assert.ok(Object.isFrozen(surface.routes[0].border.left));
});
test('disabled route keeps selected style, absent side stays absent',()=>{
  const input={...route,border:{enabled:false,left:style}};
  assert.deepEqual(normalizeWorldSurface({routes:[input]}).routes[0],input);
});
test('invalid asset references fail closed and visual settings stay bounded',()=>{
  const input={...route,border:{enabled:true,left:{...style,assetId:'../../outside'},right:{...style,width:-3,opacity:99,scale:0}}};
  const result=normalizeWorldSurface({routes:[input]}).routes[0].border;
  assert.equal(result.left,undefined);
  assert.equal(result.right.width,1);
  assert.equal(result.right.opacity,1);
  assert.equal(result.right.scale,.1);
  assert.equal(normalizeWorldSurface({routes:[{...route,border:{enabled:true,left:{assetId:'https://invalid.example'}}}]}).routes[0].border,undefined);
});
test('zones and rivers do not acquire route border settings',()=>{
  const stroke={...route,border:{enabled:true,left:style}};
  const surface=normalizeWorldSurface({zones:[stroke],rivers:[stroke]});
  assert.equal('border' in surface.zones[0],false);
  assert.equal('border' in surface.rivers[0],false);
});

const straight=()=>appendSculptSurfaceStroke(createSculptSurface(),{materialId:'road.dirt',points:[{x:10,y:100},{x:290,y:100}],width:24,border:{enabled:true,left:style,right:style}});
test('drag eraser cuts a local road section and preserves the other pieces',()=>{
  const before=straight(),after=eraseSculptSurfaceStroke(before,{points:[{x:150,y:90},{x:150,y:110}],width:24,kind:'routes'});
  assert.equal(after.routes.length,2);assert.equal(after.routes[0].id,before.routes[0].id);
  assert.notEqual(after.routes[0].id,after.routes[1].id);
  assert.deepEqual(after.routes[1].border,before.routes[0].border);
  assert.equal(after.routes[1].terrainFamilyId,'road');
  assert.ok(Math.abs(after.routes[0].points.at(-1).x-126)<1e-6);
  assert.ok(Math.abs(after.routes[1].points[0].x-174)<1e-6);
  assert.deepEqual(normalizeSculptSurface(JSON.parse(JSON.stringify(after))),after);
});
test('curve handles determine canonical sampled points with bounded map coordinates',()=>{
  const before=straight(),knots=routeKnotsFromPoints([{x:5,y:10},{x:90,y:75},{x:95,y:10}],{width:100,height:100});
  const after=editSculptRoute(before,before.routes[0].id,{knots});
  assert.ok(after.routes[0].points.length>3);
  assert.ok(after.routes[0].points.every(p=>p.x>=0&&p.y>=0&&p.x<100&&p.y<100));
  assert.deepEqual(normalizeSculptSurface(JSON.parse(JSON.stringify(after))),after);
});
test('the two true visual edges follow the road and suppress crossing interiors',()=>{
  const before=straight(),field=roadBorderField(before.routes);
  for(const y of [88,112])assert.ok(roadBorderTextureAt(field,100,y).length===1);
  assert.equal(roadBorderTextureAt(field,100,100).length,0);
  const off=editSculptRoute(before,before.routes[0].id,{border:{enabled:false,left:style}});
  assert.equal(roadBorderTextureAt(roadBorderField(off.routes),100,88).length,0);
  const crossing=appendSculptSurfaceStroke(before,{materialId:'road.dirt',width:28,points:[{x:150,y:20},{x:150,y:180}]});
  const result=roadBorderField(crossing.routes);
  for(let x=137;x<=163;x++)assert.equal(roadBorderTextureAt(result,x,88).length,0);
  assert.equal(roadBorderTextureAt(result,130,88).length,1);
});
const thickStyle={...style,assetId:'road-border.bordure_bois',width:28,scale:1.5,offset:-5,opacity:1};
const bent=()=>({...straight().routes[0],width:84,points:[{x:50,y:120},{x:135,y:103},{x:170,y:105},{x:177,y:111},{x:180,y:119},{x:190,y:126},{x:209,y:140},{x:235,y:168},{x:270,y:220}],border:{enabled:true,left:thickStyle,right:thickStyle}});
const dseg=(x,y,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);};
const distanceToRoute=(r,x,y)=>Math.min(...r.points.slice(1).map((p,i)=>dseg(x,y,r.points[i],p)));
test('true union contour remains on the swept road even with short, tight turns',()=>{
  const turn=bent(),entry=roadBorderField([turn]).entries[0];
  assert.ok(entry.guides.length>100);
  for(const g of entry.guides){
    const x=(g.a.x+g.b.x)/2,y=(g.a.y+g.b.y)/2;
    assert.ok(Math.abs(distanceToRoute(turn,x,y)-42)<1.5,'contour must lie on actual stroke');
  }
  assert.ok(entry.guides.some(g=>g.side===-1&&!g.cap)&&entry.guides.some(g=>g.side===1&&!g.cap));
});
test('contour UV stations advance on shared endpoints, not on independent stamps',()=>{
  const guides=roadBorderField([bent()]).entries[0].guides;
  for(let i=1;i<guides.length;i++){
    const a=guides[i-1],b=guides[i];
    if(b.start===0)continue;
    assert.ok(Math.hypot(a.b.x-b.a.x,a.b.y-b.a.y)<1e-6);
    assert.ok(Math.abs(b.start-a.start-a.span)<1e-6);
  }
});
test('thick wood at screenshot settings cannot produce spikes beyond the border envelope',()=>{
  const turn=bent(),field=roadBorderField([turn]);let visible=0;
  for(let y=45;y<290;y+=2)for(let x=0;x<340;x+=2){
    const mappings=roadBorderTextureAt(field,x,y);
    assert.ok(mappings.length<=1,'one mapped texture per route pixel');
    for(const m of mappings){
      if(roadBorderSourceAlpha(m.profile,m.v)<=0)continue;visible++;
      assert.ok(m.v>=0&&m.v<=1&&m.u>=0&&m.u<1);
      assert.ok(distanceToRoute(turn,x,y)<=42+8,'no outward triangle or stain');
      assert.ok(Math.abs(m.signed-m.center)<=m.thick+1e-6);
    }
  }
  assert.ok(visible>500,'both curved strips remain populated');
});
test('straight wood anchoring moves the actual log row inside the road edge',()=>{
  const r={...straight().routes[0],width:84,border:{enabled:true,left:thickStyle,right:thickStyle}},field=roadBorderField([r]);
  const sample=roadBorderTextureAt(field,150,100-42+8)[0];
  assert.ok(sample&&Math.abs(sample.v-sample.profile.anchor)<.05);
  assert.ok(sample.signed<0&&sample.center===-8);
});
test('square brush contour uses the real swept axis-aligned footprint',()=>{
  const r={...straight().routes[0],brushShape:'square',points:[{x:60,y:60},{x:140,y:140}]},field=roadBorderField([r]);
  const e=field.entries[0];assert.ok(e.guides.length>50);
  // At the centre of this diagonal, the boundary is 12*sqrt(2) away.
  assert.ok(roadBorderTextureAt(field,88,112).length>0);
  assert.equal(roadBorderTextureAt(field,100,100).length,0);
});
test('alpha cleanup preserves wood core, removes its detached top stripe and ground fringe',()=>{
  const wood=roadBorderSourceProfile('road-border.bordure_bois');
  assert.equal(roadBorderSourceAlpha(wood,25/128),0);
  assert.equal(roadBorderSourceAlpha(wood,56/128),1);
  assert.equal(roadBorderSourceAlpha(wood,95/128),0);
  for(const name of ['naturelle','cailloux','pierre_taillee','beton','neige']){
    const profile=roadBorderSourceProfile('road-border.bordure_'+name);
    assert.equal(roadBorderSourceAlpha(profile,profile.anchor),1);
    assert.equal(roadBorderSourceAlpha(profile,100/128),0);
  }
});
