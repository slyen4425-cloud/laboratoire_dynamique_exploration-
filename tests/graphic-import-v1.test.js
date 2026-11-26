import test from 'node:test';
import assert from 'node:assert/strict';
import {graphicAnimationFromGrid,planGraphicFrameAtlas,normalizeGraphicAnimation} from '../src/assets/graphic-animation-v1.js';
import {prepareGraphicImport} from '../src/assets/graphic-import-v1.js';
test('sprite sheet grid and atlas planner keep stable frame coordinates and strict limits',()=>{
 assert.deepEqual(graphicAnimationFromGrid({width:504,height:378,columns:3,rows:3,fps:8}),{frames:9,columns:3,frameWidth:168,frameHeight:126,fps:8});
 assert.throws(()=>graphicAnimationFromGrid({width:505,height:378,columns:3,rows:3}),/invalide/);
 assert.throws(()=>graphicAnimationFromGrid({width:504,height:378,columns:3,rows:3,frames:3}),/grille/);
 assert.throws(()=>planGraphicFrameAtlas(4096,4096,2),/volumineuse/);
 assert.throws(()=>normalizeGraphicAnimation({frames:2,columns:2,frameWidth:16,frameHeight:16,fps:0},32,16),/invalide/);
 const p=planGraphicFrameAtlas(64,64,6);assert.equal(p.animation.frames,6);assert.equal(p.width,192);assert.equal(p.height,128);
});
const png=()=>new Blob(['frame'],{type:'image/png'});
test('static and sheet preserve original blob; multiple images are assembled with released bitmaps',async()=>{
 const blob=png(),closed=[],drawn=[],decode=async file=>({width:32,height:32,close:()=>closed.push(file)});
 const canvas={getContext:()=>({drawImage:(...a)=>drawn.push(a.slice(1))}),toBlob:cb=>cb(png())};
 const deps={decode,makeCanvas:()=>canvas};
 const a=await prepareGraphicImport({files:[blob]},deps);assert.equal(a.blob,blob);assert.equal(a.animation,null);
 const sheet=await prepareGraphicImport({files:[blob],mode:'sheet',columns:2,rows:2},deps);
 assert.equal(sheet.animation.frames,4);
 const b=await prepareGraphicImport({files:[blob,png(),png()],mode:'frames',fps:6},deps);
 assert.equal(b.animation.frames,3);assert.equal(b.animation.fps,6);
 assert.equal(drawn.length,3);assert.equal(closed.length,5);
});
test('mismatched image sizes fail before a record is returned',async()=>{
 const a=png(),b=png();let closed=0;
 const decode=async f=>({width:f===a?32:64,height:32,close:()=>closed++});
 await assert.rejects(prepareGraphicImport({files:[a,b],mode:'frames'},{decode,makeCanvas:()=>({getContext:()=>({drawImage(){}})})}),/mêmes dimensions/);
 assert.equal(closed,2);
});
