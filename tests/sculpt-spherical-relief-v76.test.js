import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,appendSculptSphere,removeSculptSphereAt,
  sculptSphereAt,sculptSphereDisplacementAt,serializeSculptTerrain,
  importSculptTerrain,applySculptStroke} from '../src/world/sculpt-height-model.js';
import {sculptNavigationBlockDetail,sculptSphereProjectionBlock} from '../src/core/sculpt-navigation-collision.js';
import {stepMovement} from '../src/core/movement.js';
import {isBlocked} from '../src/core/collision.js';
import {drawSculptSphereMeshes,sculptSphereProjectedPoint,
  sculptSphereReliefLighting,sculptSphereVisualContact,
  sculptSphereRadialRings} from '../src/render/sculpt-sphere-mesh.js';

const tile={width:28,height:21,rise:18};
const base=()=>createSculptTerrain({width:40,height:40});
const x=560,y=420,r=112;
const sphere=(kind='hill')=>appendSculptSphere(base(),{kind,x,y,radius:r,height:3});
const entity=(pos,modes=['ground'])=>({x:pos,y,radius:5,locomotion:{modes}});
const world={width:1120,height:840,objects:[],obstacles:[]};
const config=terrain=>({terrain,cellWidth:28,cellHeight:21,projectionRise:18,
  maxStepUp:0,maxStepDown:0});

test('V76 a single tap creates an ANALYTIC circular hemisphere, not rounded tiles',()=>{
  const original=base(),t=sphere();
  assert.equal(t.spheres.length,1);
  assert.deepEqual(t.levels,original.levels,'existing heightfield untouched');
  assert.deepEqual(t.waterLevels,original.waterLevels);
  assert.equal(t.spheres[0].baseLevel,2);
  assert.equal(sculptSphereDisplacementAt(t,x,y),3);
  assert.equal(sculptSphereDisplacementAt(t,x+r,y),0);
  assert.equal(sculptSphereDisplacementAt(t,x,y+r),0);
  assert.ok(Math.abs(sculptSphereDisplacementAt(t,x+r*.5,y)-
    3*Math.sqrt(.75))<1e-9);
  assert.ok(Math.abs(sculptSphereDisplacementAt(t,x,y+r*.5)-
    sculptSphereDisplacementAt(t,x+r*.5,y))<1e-9,
    'equal world radii have equal height: true circle');
  assert.equal(sculptSphereAt(t,x+r+6,y),null);
  assert.equal(sculptSphereAt(t,x+r+4,y,5)?.kind,'hill',
    'actor radius is accounted for by collision');
});
test('V76 basin is a continuous hemispherical excavation with undo/delete',()=>{
  const t=sphere('basin');
  assert.equal(sculptSphereDisplacementAt(t,x,y),-3);
  assert.ok(sculptSphereDisplacementAt(t,x+r*.8,y)<0);
  assert.equal(sculptSphereDisplacementAt(t,x+r,y),0);
  assert.deepEqual(removeSculptSphereAt(t,x,y).spheres,[]);
  const host=base();
  assert.equal(appendSculptSphere(t,{kind:'hill',x:x+70,y,radius:56,height:2}),t,
    'overlapping spheres must not generate two authorities');
  assert.equal(appendSculptSphere(host,{kind:'hill',x:12,y,radius:112,height:2}),host,
    'full circle must fit inside the world');
});
test('V76 object serialization and reimport preserve the exact canonical sphere',()=>{
  const a=sphere('basin'),json=serializeSculptTerrain(a),b=importSculptTerrain(json);
  assert.deepEqual(b.spheres,a.spheres);
  assert.equal(serializeSculptTerrain(b),json);
  assert.deepEqual(importSculptTerrain(serializeSculptTerrain(base())).spheres,[]);
  const invalid=JSON.parse(json);invalid.spheres[0].radius=-9;
  assert.throws(()=>importSculptTerrain(invalid),/invalide/);
  const oldHeight=appendSculptSphere(base(),{kind:'hill',x,y,radius:84,height:2});
  const changed=applySculptStroke(oldHeight,{points:[{x:x/28,y:y/21}],mode:'raise',radius:1});
  assert.equal(changed.levels[Math.floor(y/21)*40+Math.floor(x/28)],2,
    'grid must not be raised secretly inside a continuous spherical relief');
});
test('V76 walking never enters a hemisphere; flight and flat ground still work',()=>{
  for(const kind of ['hill','basin']){
    const t=sphere(kind),c=config(t),from=x-r-11,to=x-r+11;
    const e=entity(from),reason=sculptNavigationBlockDetail(c,e,to,y);
    assert.equal(reason?.kind,'sphere-wall',kind);
    assert.equal(isBlocked(world,e,to,y,undefined,{sculptNavigation:c}),true);
    stepMovement(world,e,{x:1,y:0},1,{maxSpeed:22},undefined,{sculptNavigation:c});
    assert.equal(e.x,from,'real Engine may not walk into '+kind);
    const fly=entity(from,['fly']);
    assert.equal(sculptNavigationBlockDetail(c,fly,to,y),null);
    stepMovement(world,fly,{x:1,y:0},1,{maxSpeed:22},undefined,{sculptNavigation:c});
    assert.equal(fly.x,to,'flight preserved');
  }
});
test('V76 renderer samples the same true spherical surface without cell-stroke artifacts',()=>{
  const t=sphere(),frames=[];
  const ctx={fillStyle:'',strokeStyle:'',lineWidth:1,
    save(){},restore(){},beginPath(){},moveTo(a,b){frames.push([a,b]);},
    lineTo(){},closePath(){},fill(){},ellipse(){},arc(){},clip(){},stroke(){},
    createPattern(){return null;}};
  assert.equal(drawSculptSphereMeshes(ctx,{terrain:t,tile}),1);
  assert.ok(frames.length>300&&frames.length<2100,
    'R5: analytic projected mesh is bounded, not 1,024+ polygons per redraw');
  assert.equal(drawSculptSphereMeshes(ctx,{terrain:base(),tile}),0);
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.match(html,/data-mode="sphere-hill"/);
  assert.match(html,/data-mode="sphere-basin"/);
  assert.match(html,/sphere-v76/);
});

test('V76 R2 hill and basin project real 1/3/7-level vertical relief, not flat discs',()=>{
  for(const kind of ['hill','basin']){
    for(const height of [1,3,7]){
      const t=appendSculptSphere(base(),{kind,x,y,radius:r,height});
      const f=t.spheres[0],center=sculptSphereProjectedPoint(t,f,0,0,tile);
      const edge=sculptSphereProjectedPoint(t,f,1,0,tile);
      const expected=kind==='hill'?height:
        -height*Math.min(1,r*.68/(7*tile.rise));
      assert.ok(Math.abs((edge.y-center.y)/tile.rise-expected)<1e-8,
        `kind ${kind} amplitude ${height} remains perceptibly proportional`);
      assert.equal(edge.level,2);
      assert.equal(center.level,kind==='hill'?2+height:2-height);
    }
  }
});
test('V76 R2 painter draws visible mineral flanks, contact shadow and a clipped recessed cavity',()=>{
  const draw=kind=>{
    const fills=[],shapes=[],strokes=[];
    const ctx={fillStyle:'',strokeStyle:'',lineWidth:1,
      save(){},restore(){},beginPath(){},moveTo(x,y){shapes.push({x,y});},
      lineTo(){},closePath(){},ellipse(){},arc(){},clip(){strokes.push('clipped');},
      fill(){fills.push(this.fillStyle);},stroke(){strokes.push(this.strokeStyle);},
      createPattern(){return null;}};
    drawSculptSphereMeshes(ctx,{terrain:sphere(kind),tile,baseColor:'#677955',
      rockPaletteColors:['#ded2be','#ad9f88','#776b5b','#3b4146']});
    return {fills,shapes,strokes};
  };
  const hill=draw('hill'),pit=draw('basin');
  assert.ok(hill.fills.includes('rgba(12,24,27,.29)'),'ground contact shadow');
  assert.ok(hill.fills.includes('#ad9f88')||hill.fills.includes('#776b5b')||
    hill.fills.includes('#3b4146'),'mineral height flanks');
  assert.ok(!hill.strokes.includes('clipped'),'hill rises above host perimeter');
  assert.ok(pit.strokes.includes('clipped'),'cavity is carved within circular rim');
  assert.ok(pit.fills.includes('#182b32'),'dark opening below host surface');
  assert.ok(pit.fills.some(s=>String(s).includes('rgba(9,18,32,')),
    'recessed walls are darker than ordinary ground');
  assert.ok(hill.shapes.length>300&&pit.shapes.length>300&&
    hill.shapes.length<2100&&pit.shapes.length<2100,
    'R5: true projected radial surface with fewer compound polygon subpaths');
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(html,/id="height-label"/);
  assert.match(html,/sphere-v76-volume-r2/);
  assert.match(main,/mode==='sphere-basin'\?'Profondeur'/);
});


test('V76 R3 summit radius makes a REAL flat cap / flat cavity floor with unchanged collision footprint',()=>{
  for(const kind of ['hill','basin']){
    const t=appendSculptSphere(base(),{kind,x,y,radius:r,height:5,summitRatio:.6,wallMaterial:'grass'});
    const sign=kind==='hill'?1:-1;
    const f=t.spheres[0];
    assert.equal(f.summitRatio,.6);
    assert.equal(f.wallMaterial,'grass');
    for(const d of [0,.25,.5,.6])
      assert.ok(Math.abs(sculptSphereDisplacementAt(t,x+r*d,y)-sign*5)<1e-8,
        'flat summit/floor extends exactly to the configured radius');
    const d=.8,local=(d-.6)/(1-.6);
    assert.ok(Math.abs(sculptSphereDisplacementAt(t,x+r*d,y)-sign*5*(1-local))<1e-8,
      'flat-topped hills use the frustum slope, not a dome segment');
    assert.equal(sculptSphereAt(t,x+r+6,y),null);
    assert.equal(sculptNavigationBlockDetail(config(t),entity(x-r-11),x-r+11,y)?.kind,'sphere-wall');
    assert.deepEqual(importSculptTerrain(serializeSculptTerrain(t)).spheres,t.spheres);
  }
  const column=appendSculptSphere(base(),{kind:'hill',x,y,radius:r,height:7,summitRatio:.85,wallMaterial:'earth'});
  assert.equal(sculptSphereDisplacementAt(column,x+r*.8,y),7);
  assert.equal(sculptSphereDisplacementAt(column,x+r*.96,y)<7,true);
  const json=JSON.parse(serializeSculptTerrain(column));
  json.spheres[0].summitRatio=1;
  assert.equal(importSculptTerrain(json).spheres[0].summitRatio,1);
  json.spheres[0].summitRatio=1.01;
  assert.throws(()=>importSculptTerrain(json),/invalide/);
  json.spheres[0].summitRatio=.5;json.spheres[0].wallMaterial='glass';
  assert.throws(()=>importSculptTerrain(json),/invalide/);
});

test('V76 R3 old spherical JSON remains readable and material options change flank fill',()=>{
  const old=JSON.parse(serializeSculptTerrain(sphere()));
  delete old.spheres[0].summitRatio;delete old.spheres[0].wallMaterial;
  const legacy=importSculptTerrain(old);
  assert.equal(sculptSphereDisplacementAt(legacy,x+r*.5,y),3*Math.sqrt(.75));
  const colorFor=wallMaterial=>{
    const t=appendSculptSphere(base(),{kind:'hill',x,y,radius:r,height:4,wallMaterial});
    const colors=[];
    const ctx={fillStyle:'',strokeStyle:'',lineWidth:1,
      save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},
      ellipse(){},arc(){},clip(){},fill(){colors.push(this.fillStyle);},stroke(){},
      createPattern(){return null;}};
    drawSculptSphereMeshes(ctx,{terrain:t,tile,baseColor:'#677955',
      rockPaletteColors:['#bea28c','#947c70','#6c6064','#4b4a56']});
    return colors;
  };
  assert.ok(colorFor('rock').includes('#947c70'));
  assert.ok(colorFor('grass').includes('#638c45'));
  assert.ok(colorFor('earth').includes('#94765a'));
  const mesh=readFileSync(new URL('../src/render/sculpt-sphere-mesh.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.ok(!mesh.includes('paintContours(ctx'),'no permanent concentric brush rings on authored relief');
  assert.match(html,/id="sphere-summit-ratio"/);
  assert.match(html,/id="sphere-wall-material"/);
  assert.ok(main.includes("if(selectedMode.startsWith('sphere-'))spherePreviewDismissed=false;"));
  assert.ok(main.includes("summitRatio:Number($(\'sphere-summit-ratio\').value)/100"));
});


test('V76 R4 material uses one continuous gradient frame rather than tile per polygon',()=>{
  const t=appendSculptSphere(base(),{kind:'hill',x,y,radius:r,height:5,
    summitRatio:.75,wallMaterial:'rock'});
  const fills=[],strokes=[],gradients=[];
  const ctx={fillStyle:'',strokeStyle:'',lineWidth:1,save(){},restore(){},
    beginPath(){},moveTo(){},lineTo(){},closePath(){},ellipse(){},clip(){},
    stroke(){strokes.push(this.strokeStyle);},fill(){fills.push(this.fillStyle);},
    createPattern(){throw Error('R4 must NOT stamp rock atlas across polygons');},
    createLinearGradient(){const g={stops:[],addColorStop(t,c){this.stops.push([t,c]);}};
      gradients.push(g);return g;}};
  const fakeRockImage={width:256,height:256};
  assert.equal(drawSculptSphereMeshes(ctx,{terrain:t,tile,
    rockTexture:fakeRockImage,rockPaletteColors:['#a0a0a0','#8c897d','#5d6060','#36393a']}),1);
  assert.ok(gradients.length>=2&&gradients.length<9,
    'only a handful of SHARED gradients for the whole mesh');
  assert.equal(fills.filter(v=>v===gradients[0]).length,2,
    'R6: rear and near wall groups share the same world gradient, not tile fragments');
  assert.equal(strokes.length,0,'no black circle/ring baked into finished terrain');
  const source=readFileSync(new URL('../src/render/sculpt-sphere-mesh.js',import.meta.url),'utf8');
  assert.ok(!source.includes('face.sector%'),'old square procedural patches removed');
  assert.ok(!source.includes('ctx.strokeStyle=sphere.kind'),'old circular rim removed');
});

test('V76 R4 fullscreen palette owns the unique material and summit controls',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const start=html.indexOf('<section class="sculpt-quickbar"');
  const end=html.indexOf('</section>',start);
  const profile=html.indexOf('id="sphere-profile-wrap"');
  assert.ok(start>=0&&profile>start&&profile<end);
  assert.equal(html.split('id="sphere-profile-wrap"').length-1,1,
    'never create a second owner for the same settings');
  assert.ok(html.includes('body.sculpt-immersive.palette-collapsed .sculpt-quickbar'));
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(main,/const hasFootprint=/);
  assert.ok(main.includes('spherePreviewDismissed=false;'));
});


test('V76 R5 real registered material images are painted once across whole curved flank',()=>{
  for(const material of ['grass','earth']){
    const t=appendSculptSphere(base(),{kind:'hill',x,y,radius:r,height:5,wallMaterial:material});
    const image={material},ground={ground:true};
    const applied=[],patternCalls=[];
    const ctx={fillStyle:'',strokeStyle:'',lineWidth:1,
      save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},
      ellipse(){},clip(){},fill(){applied.push(this.fillStyle);},stroke(){},
      createPattern(value){patternCalls.push(value);return {from:value};}};
    drawSculptSphereMeshes(ctx,{terrain:t,tile,texture:ground,
      sphereWallImages:{[material]:image}});
    assert.equal(patternCalls.filter(v=>v===image).length,1,
      'authoritative material image becomes ONE shared world-pattern');
    assert.equal(applied.filter(v=>v?.from===image).length,2,
      'real material draws at most twice: behind and in front of the grassy plateau');
  }
  const sculpt=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.ok(sculpt.includes('loadSphereWallImages()'));
  assert.ok(sculpt.includes('navigationTesting||objectEditing||!drawing'));
  const renderer=readFileSync(new URL('../src/render/sculpt-sphere-mesh.js',import.meta.url),'utf8');
  assert.ok(renderer.includes('sculptCliffHDLayers(rockTexture)'));
  assert.ok(renderer.includes('paintRearBand(ctx,sphere,mesh)'));
});


test('V76 R6 far wall dark crescent stays BEHIND continuous full grassy summit',()=>{
  for(const kind of ['hill','basin']){
    const t=appendSculptSphere(base(),{kind,x,y,radius:r,height:5,
      summitRatio:.75,wallMaterial:'earth'});
    const groundImage={kind:'grass-texture'},earthImage={kind:'earth-texture'};
    const fills=[],paths=[];
    let pathCount=0;
    const ctx={fillStyle:null,strokeStyle:'',lineWidth:1,
      save(){},restore(){},beginPath(){pathCount=0;},moveTo(){pathCount++;},
      lineTo(){},closePath(){},ellipse(){},clip(){},stroke(){},
      fill(){fills.push({style:this.fillStyle,count:pathCount});},
      createPattern(image){return {image};},
      createLinearGradient(){return {gradient:true,addColorStop(){}};}};
    drawSculptSphereMeshes(ctx,{terrain:t,tile,texture:groundImage,
      sphereWallImages:{earth:earthImage}});
    const earth=fills.flatMap((f,i)=>f.style?.image===earthImage?[i]:[]);
    const crown=fills.flatMap((f,i)=>kind==='hill'
      ?(f.style?.image===groundImage?[i]:[])
      :(f.style==='#35483f'?[i]:[]));
    const rearShade=fills.findIndex(f=>f.style===
      (kind==='hill'?'rgba(19,27,29,.24)':'rgba(7,17,29,.35)'));
    assert.equal(earth.length,2,'two seamless rock walls: back and foreground');
    assert.equal(crown.length,2,'base then crown/floor drawn as separate layers');
    assert.ok(earth[0]<rearShade&&rearShade<crown[1]&&crown[1]<earth[1],
      'far wall and shade are below the upper surface; near wall above');
    assert.ok(fills[crown[1]].count>15,'the entire summit/floor surface is filled');
  }
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.ok(main.includes('spherePreviewDismissed=false;'));
  assert.ok(!main.includes('spherePreviewDismissed=true;hoverCell=null;scheduleDraw()'),
    'placing a sphere does not disable next brush preview');
});


test('V76 R7 shading scales with altitude like standard cliffs without mutating geometry',()=>{
  const low=appendSculptSphere(base(),{kind:'hill',x,y,radius:r,height:1});
  const high=appendSculptSphere(base(),{kind:'hill',x,y,radius:r,height:7});
  const a=sculptSphereReliefLighting(low.spheres[0]);
  const b=sculptSphereReliefLighting(high.spheres[0]);
  assert.ok(a.contactOpacity>0&&a.contactOpacity<b.contactOpacity);
  assert.ok(a.rimOpacity<b.rimOpacity&&b.rimOpacity<=.52);
  assert.ok(a.footOpacity<b.footOpacity&&b.footOpacity<=.42);
  assert.equal(a.lightOpacity,.12);
  assert.equal(a.sideOpacity,.19);
  assert.equal(a.topTone,(low.spheres[0].baseLevel+1-2)*.029);
  const basin=appendSculptSphere(base(),{kind:'basin',x,y,radius:r,height:7});
  assert.ok(sculptSphereReliefLighting(basin.spheres[0]).topTone<0);
  assert.deepEqual(low.spheres[0],importSculptTerrain(serializeSculptTerrain(low)).spheres[0]);
});

test('V76 R7 real material persists under vertical/lateral shade and soft outer foot/rim',()=>{
  for(const kind of ['hill','basin']){
    for(const material of ['rock','grass','earth']){
      const t=appendSculptSphere(base(),{kind,x,y,radius:r,height:6,
        summitRatio:.6,wallMaterial:material});
      const gradients=[],fills=[],asset={rock:'HD rock',grass:'forest grass',earth:'forest earth'};
      const chosen={material},grass={top:true};
      const ctx={fillStyle:null,strokeStyle:'',lineWidth:1,
        save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},
        ellipse(){},clip(){},stroke(){throw Error('no black permanent circle')},
        fill(){fills.push(this.fillStyle);},
        createPattern(image){return {image};},
        createLinearGradient(...args){
          const g={args,colors:[],addColorStop(t,c){this.colors.push(c)}};
          gradients.push(g);return g;
        }};
      drawSculptSphereMeshes(ctx,{terrain:t,tile,texture:grass,
        sphereWallImages:{grass:asset,earth:asset},
        rockPaletteColors:['#ded2be','#ad9f88','#776b5b','#3b4146']});
      const shadeStrings=gradients.flatMap(g=>g.colors).join('|');
      assert.ok(shadeStrings.includes('rgba(16,31,34,'),'vertical depth/contact-shadow family');
      assert.ok(shadeStrings.includes('rgba(245,227,197,'),'standard cliff directional highlight');
      assert.ok(gradients.length<9,'gradients are shared at sphere level, not one per cell');
      assert.ok(fills.length<23,'compound path passes prevent 360+ repeated fills');
      assert.ok(fills.includes(kind==='hill'?'rgba(19,27,29,.24)':'rgba(7,17,29,.35)'),
        'the R6 far shadow remains behind the continuous crown');
    }
  }
  const renderer=readFileSync(new URL('../src/render/sculpt-sphere-mesh.js',import.meta.url),'utf8');
  assert.ok(renderer.includes('crownLip'));
  assert.ok(renderer.includes('footFront'));
  assert.ok(renderer.includes('fillLayer(ctx,crown,groundColor)'));
});

test('V76 R8 true visual seam aligns entire grass cap with FIRST ROCK at exact plateau radius',()=>{
  for(const kind of ['hill','basin']){
    for(const ratio of [0,.15,.45,.5,.75,.85]){
      const t=appendSculptSphere(base(),{kind,x,y,radius:r,height:5,
        summitRatio:ratio,wallMaterial:'earth'});
      const f=t.spheres[0],border=sculptSphereVisualContact(f);
      const rings=sculptSphereRadialRings(f);
      assert.equal(border,ratio|| (kind==='hill'?.45:.24));
      assert.equal(rings[0],0);
      assert.equal(rings.at(-1),1);
      assert.ok(rings.length<=12,'R5/R7 performance: at most one additional ring');
      assert.equal(rings.filter(v=>Math.abs(v-border)<1e-9).length,1,
        'exact summit radius is a shared node, never approximated by grid steps');
      const join=rings.findIndex(v=>Math.abs(v-border)<1e-9);
      assert.ok(join>0&&join<rings.length-1);
      for(let i=0;i<rings.length-1;i++){
        const a=rings[i],z=rings[i+1];
        assert.ok(z>a,'no overlapping annuli');
        assert.equal(a>=border-1e-9,i>=join,
          'no wall may start INSIDE the grass or leave a bare edge');
      }
      for(const angle of [0,Math.PI/3,Math.PI,Math.PI*1.5]){
        const grassEdge=sculptSphereProjectedPoint(t,f,rings[join],angle,tile);
        const rockEdge=sculptSphereProjectedPoint(t,f,rings[join],angle,tile);
        assert.deepEqual(grassEdge,rockEdge,
          'grass and mineral wall use exactly the same projected vertices');
      }
      assert.deepEqual(importSculptTerrain(serializeSculptTerrain(t)).spheres,t.spheres);
    }
  }
});
test('V76 R8 compositor paints grass exactly to shared rock seam, never oversized',()=>{
  for(const ratio of [.15,.45,.75,.85]){
    const t=appendSculptSphere(base(),{kind:'hill',x,y,radius:r,height:6,
      summitRatio:ratio,wallMaterial:'earth'});
    const imageGrass={grass:true},imageEarth={earth:true};
    const paints=[];let coords=[];
    const ctx={fillStyle:null,strokeStyle:'',lineWidth:1,
      save(){},restore(){},beginPath(){coords=[];},
      moveTo(x,y){coords.push([x,y]);},lineTo(x,y){coords.push([x,y]);},
      closePath(){},ellipse(){},clip(){},stroke(){throw Error('no permanent dark border')},
      fill(){paints.push({style:this.fillStyle,coords:coords.slice()});},
      createPattern(image){return {image};},
      createLinearGradient(){return {addColorStop(){}};}};
    drawSculptSphereMeshes(ctx,{terrain:t,tile,texture:imageGrass,
      sphereWallImages:{earth:imageEarth}});
    const grassPaints=paints.filter(p=>p.style?.image===imageGrass);
    const rockPaints=paints.filter(p=>p.style?.image===imageEarth);
    assert.equal(grassPaints.length,2,'base surface + grass crown');
    assert.equal(rockPaints.length,2,'back rock and front rock');
    const cap=grassPaints[1];
    const maxCrownX=Math.max(...cap.coords.map(a=>a[0]));
    const edgeX=x+r*ratio;
    assert.ok(Math.abs(maxCrownX-edgeX)<1e-8,
      'top grass stops EXACTLY at the configured summit border '+ratio);
    assert.ok(rockPaints.some(p=>p.coords.some(q=>Math.abs(q[0]-edgeX)<1e-8)),
      'rock wall begins at precisely the same edge as grass '+ratio);
    assert.ok(paints.length<26,'no per-face painting performance regression');
  }
});


test('V76 R9 round dome, truncated cone and 100% round vertical mesa use canonical world elevation',()=>{
  const pure=sphere();
  assert.ok(Math.abs(sculptSphereDisplacementAt(pure,x+r*.5,y)-3*Math.sqrt(.75))<1e-9);
  for(const kind of ['hill','basin'])for(const ratio of [.2,.5,.75,.95,1]){
    const t=appendSculptSphere(base(),{kind,x,y,radius:r,height:6,summitRatio:ratio});
    const sign=kind==='hill'?1:-1,shape=t.spheres[0];
    assert.ok(shape,'canonical sphere shape is accepted up to 100%');
    assert.equal(sculptSphereDisplacementAt(t,x,y),sign*6);
    assert.equal(sculptSphereDisplacementAt(t,x+r*.5*ratio,y),sign*6);
    assert.equal(sculptSphereDisplacementAt(t,x+r,y),0);
    if(ratio<1){
      const midpoint=(ratio+1)/2;
      assert.ok(Math.abs(sculptSphereDisplacementAt(t,x+r*midpoint,y)-sign*3)<1e-9,
        'side is a true straight frustum slope, not a partial circular dome');
    }else{
      assert.equal(sculptSphereDisplacementAt(t,x+r*.999,y),sign*6,
        'vertical cylindrical wall until outer footprint');
      assert.equal(sculptSphereVisualContact(shape),.999);
      assert.ok(sculptSphereRadialRings(shape).includes(.999),
        '100% mesa has an extra inner top vertex and a vertical face');
    }
    assert.deepEqual(importSculptTerrain(serializeSculptTerrain(t)).spheres,t.spheres);
  }
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.match(html,/id="sphere-summit-ratio"[^>]*max="100"/);
});

test('V76 R9 collision authority blocks walking onto visually projected elevated cap from lower northern ground',()=>{
  const actor=(xx,yy,modes=['ground'])=>({x:xx,y:yy,radius:5,
    locomotion:{modes}});
  for(const ratio of [0,.5,.75,1]){
    const t=appendSculptSphere(base(),{kind:'hill',x,y,radius:r,height:7,summitRatio:ratio});
    const conf=config(t);
    const rearY=y-r-55; // World ground, physically OUTSIDE the spherical footprint.
    const closeY=y-r-16; // Still OUTSIDE the footprint, but painted under upper grass.
    const farther=actor(x,rearY);
    const projected=sculptSphereProjectionBlock(t,x,closeY,{projectionRise:18,radius:5});
    assert.equal(projected?.kind,'sphere-projection','upper hill overhang is a real restricted view-zone '+ratio);
    assert.equal(sculptSphereAt(t,x,closeY,5),null,'actual XY footprint is NOT entered');
    assert.equal(sculptNavigationBlockDetail(conf,farther,x,closeY)?.kind,'sphere-projection');
    const blockedMover=actor(x,rearY);
    stepMovement(world,blockedMover,{x:0,y:1},1,{maxSpeed:55},undefined,{sculptNavigation:conf});
    assert.ok(blockedMover.y<closeY,'actual walking cannot advance beneath the raised hill');
    const side=actor(x+r+30,closeY);
    assert.equal(sculptNavigationBlockDetail(conf,side,x+r+35,closeY),null,
      'low ground beside the projected hill remains traversable');
    const fly=actor(x,rearY,['fly']);
    assert.equal(sculptNavigationBlockDetail(conf,fly,x,closeY),null,
      'flight ignores upper hill occlusion');
    // If a saved character is already visually occluded, escape north is legal.
    const stranded=actor(x,closeY);
    assert.equal(sculptNavigationBlockDetail(conf,stranded,x,closeY-3),null);
    assert.equal(sculptNavigationBlockDetail(conf,stranded,x,closeY+3)?.kind,'sphere-projection');
  }
  const flat=base();
  assert.equal(sculptSphereProjectionBlock(flat,x,y,{projectionRise:18,radius:5}),null);
});
