import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planObjectShoreContacts} from '../src/render/object-shore-contact.js';
import {createWorldObjectRenderer} from '../src/render/world-object-renderer.js';
import {resolveWorldObjectPlacement} from '../src/world/world-object-placement-model.js';
import {createMaterialRegistry} from '../src/materials/material-registry.js';
import {materialPackV1} from '../src/materials/material-pack-v1.js';
import {reliefCanyonPilotDocument} from '../src/world/relief-canyon-pilot-world.js';
import {demoWorldDocument} from '../src/world/demo-world.js';
import {createWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';
const area=reliefCanyonPilotDocument.areas[0];
const registry=createMaterialRegistry(materialPackV1);
const left=area.objects.find(p=>p.id==='upper-cliff-left');
const resolved=resolveWorldObjectPlacement(left);
const plan=(object,surface=area.surface,materialRegistry=registry)=>
 planObjectShoreContacts({object,surface,materialRegistry});

test('contact follows editable WorldObject transform; no separate collision/shore geometry',()=>{
 const snapshot=JSON.stringify(area);
 const near=plan(resolved);
 assert.ok(near.length>0&&near.length<=5);
 assert.ok(near.every(p=>p.materialId==='water.canyon_turquoise'));
 const moved=resolveWorldObjectPlacement({...left,transform:{...left.transform,x:left.transform.x+65}});
 assert.notDeepEqual(plan(moved).map(p=>p.x),near.map(p=>p.x));
 const scaled=resolveWorldObjectPlacement({...left,transform:{...left.transform,scaleX:1.3}});
 assert.notDeepEqual(plan(scaled).map(p=>p.x),near.map(p=>p.x));
 const rotated=resolveWorldObjectPlacement({...left,transform:{...left.transform,rotationDeg:13}});
 assert.ok(plan(rotated).every(p=>Math.abs(p.angle-13*Math.PI/180)<1e-6));
 const far=resolveWorldObjectPlacement({...left,transform:{...left.transform,y:100}});
 assert.equal(plan(far).length,0);
 assert.equal(plan(resolved,{...area.surface,rivers:[]}).length,0);
 assert.equal(plan(resolved,demoWorldDocument.areas[0].surface).length,0);
 const draft=createWorldBuilderDraft(reliefCanyonPilotDocument);
 const loaded=importWorldBuilderDocument(serializeWorldBuilderDraft(draft));
 assert.deepEqual(loaded.areas[0].objects,area.objects);
 assert.equal(JSON.stringify(area),snapshot);
});

test('water type controls thematic contact colors and other objects remain clean',()=>{
 const base=registry.require('water.canyon_turquoise','water');
 const other={...base,render:{...base.render,shoreContact:{
    shadowColor:'#772c18',highlightColor:'#ffc73b',opacity:.25
 }}};
 const materials={resolve:id=>id===base.id?other:registry.resolve(id)};
 const changed=plan(resolved,area.surface,materials);
 assert.ok(changed.length>0);
 assert.ok(changed.every(p=>p.shadowColor==='#772c18'&&p.highlightColor==='#ffc73b'));
 const plain={...resolved,visual:{assetId:resolved.visual.assetId}};
 assert.deepEqual(plan(plain),[]);
});

test('same WorldObject Renderer draws the contacts and never draws them off-river',()=>{
 let strokes=0,images=0;
 const ctx={
   save(){},restore(){},translate(){},rotate(){},beginPath(){},moveTo(){},
   quadraticCurveTo(){},stroke(){strokes++;},drawImage(){images++;}
 };
 const renderer=createWorldObjectRenderer({
   imageLoader:{get:()=>({width:768,height:384})},
   resolveVisualAsset:()=>({render:{widthScale:1,heightScale:1}})
 });
 const opts={camera:{x:0,y:0},viewport:{width:2400,height:1560},
  objects:[left],surface:area.surface,materialRegistry:registry};
 renderer.draw(ctx,opts);
 assert.equal(images,1);
 assert.ok(strokes>0,'visual intersection draws contacts');
 strokes=0;
 renderer.draw(ctx,{...opts,surface:{...area.surface,rivers:[]}});
 assert.equal(strokes,0);
});

test('three enriched cliff assets remain separate transparent SVG files with stable footprints',()=>{
 for(const f of ['cliff_grassy_edge_01.svg','cliff_broken_ledge_02.svg','cliff_corner_01.svg']){
   const svg=readFileSync(new URL('../assets/exploration/objects/relief/'+f,import.meta.url),'utf8');
   assert.match(svg,/viewBox="0 0 (?:768 384|420 405)"/);
   assert.match(svg,/v7-rock-face/);
   assert.doesNotMatch(svg,/<image\b|data:image/);
 }
});
