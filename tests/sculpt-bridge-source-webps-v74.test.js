import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolveWorldObjectAsset} from '../src/assets/world-object-asset-adapter.js';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {bridgeTraversalRect} from '../src/world/world-object-model.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';

const folder=fileURLToPath(new URL('../assets/exploration/objects/bridges/',import.meta.url));
const variants=['horizontal','vertical','diagonal_left','diagonal_right'];
const defs=objectDefinitionCatalogV1.list().filter(d=>d.kind==='bridge'&&
 d.visual?.assetId?.includes('_2p5d.'));

test('V74 the original 28 cleaned bridge assets are committed as valid lossless WebP and still resolve by 7 × 4 native ids',()=>{
 assert.equal(defs.length,7);
 const names=readdirSync(folder).filter(x=>/_2p5d_.*\.webp$/.test(x)).sort();
 assert.equal(names.length,28);
 const used=[], hashes=new Set();
 for(const definition of defs){
   assert.equal(definition.visual.variants.length,4);
   for(const view of variants){
     const variant=definition.visual.variants.find(v=>v.id===view);
     assert.ok(variant,definition.id+' '+view);
     const asset=resolveWorldObjectAsset(variant.assetId);
     assert.ok(asset?.path?.endsWith('.webp'));
     const filename=asset.path.split('/').at(-1);
     used.push(filename);
     const bytes=readFileSync(folder+'/'+filename);
     assert.ok(bytes.length>500&&bytes.length<300000,
       'WebP source is readable and not excessively large: '+filename);
     assert.equal(bytes.toString('ascii',0,4),'RIFF');
     assert.equal(bytes.toString('ascii',8,12),'WEBP');
     assert.equal(bytes.toString('ascii',12,16),'VP8L',
       'source was lossless WebP encoded after cleanup: '+filename);
     assert.equal(bytes.readUInt32LE(4)+8,bytes.length);
     hashes.add(createHash('sha256').update(bytes).digest('hex'));
     assert.equal(definition.traversal.widthRatio,.35,
       'asset-only lot does not widen approved deck');
   }
 }
 assert.deepEqual(used.sort(),names);
 assert.equal(hashes.size,28,'each directional bridge artwork is retained');
});

test('V74 bridge navigation remains the same V73 canonical 35%-wide corridor',()=>{
 for(const d of defs)for(const v of variants){
   const objects=appendSculptPreviewObject([],{definitionId:d.id,
     x:224,y:168,variantId:v,scaleX:2.1,scaleY:.7});
   const bridge=resolveWorldObjectPlacements(objects)[0],deck=bridgeTraversalRect(bridge);
   assert.ok(Math.abs(deck.length-170*2.1*.92)<.00001);
   assert.ok(Math.abs(deck.width-96*.7*.35)<.00001);
 }
});

test('V74 Sculpt loads original corrected sources once and preserves historic bridge fallback',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 assert.match(main,/const sourceCleaned2p5d=resolved\.kind==='bridge-visual'&&/);
 assert.match(main,/resolved\.path\.includes\('_2p5d_'\)/);
 assert.match(main,/if\(resolved\.kind==='bridge-visual'&&!sourceCleaned2p5d\)/);
 assert.match(main,/prepareSculptBridgeImage\(picture\)/);
 assert.match(main,/resolved\.path\+'\?source-clean-v74'/);
 assert.match(page,/vertical-v73-assets-v74/);
 // No asset-derived gameplay is permitted.
 assert.doesNotMatch(main,/naturalWidth.*bridgeTraversalRect/);
});
