import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  SCULPT_CLIFF_HD_V49,resolveSculptCliffHDUrl,sculptCliffHDReady,sculptCliffHDLayers
} from '../src/render/sculpt-cliff-hd.js';
test('V49 committed original-resolution cliff material has exact SHA/size/RIFF and HD rectangles',()=>{
  const img=readFileSync(new URL('../assets/sculpt/cliff-base-hd-v49.webp',import.meta.url));
  const manifest=JSON.parse(readFileSync(new URL('../assets/sculpt/cliff-base-hd-v49.manifest.json',import.meta.url),'utf8'));
  assert.equal(img.toString('ascii',0,4),'RIFF');
  assert.equal(img.toString('ascii',8,12),'WEBP');
  assert.equal(img.readUInt32LE(4)+8,img.length,'RIFF size must be exact');
  assert.equal(img.length,manifest.bytes,'the GitHub binary bytes must match the manifest');
  assert.equal(createHash('sha256').update(img).digest('hex'),manifest.sha256);
  assert.equal(manifest.width,512);assert.equal(manifest.height,256);
  assert.deepEqual(manifest.layers,SCULPT_CLIFF_HD_V49.layers);
  assert.ok(manifest.baseResolution>=256,'V49 must never upscale the legacy 96px source');
  assert.ok(resolveSculptCliffHDUrl().endsWith('/assets/sculpt/cliff-base-hd-v49.webp'));
});
test('V49 image adapter refuses missing or wrong-resolution data and does not create a second collision authority',()=>{
  assert.equal(sculptCliffHDReady(null),false);
  assert.equal(sculptCliffHDReady({complete:true,naturalWidth:192,naturalHeight:160}),false);
  assert.equal(sculptCliffHDReady({complete:false,naturalWidth:512,naturalHeight:256}),false);
  assert.equal(sculptCliffHDReady({complete:true,naturalWidth:512,naturalHeight:256}),true);
  assert.equal(sculptCliffHDLayers({complete:true,naturalWidth:192,naturalHeight:160}),null);
});
