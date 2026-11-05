import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

test('approved animated assets have unique IDs and exact archived source bytes', async () => {
  const manifest=JSON.parse(await readFile('assets/exploration/objects/animated/manifest.v1.json','utf8'));
  assert.equal(manifest.schemaVersion,1);
  assert.equal(manifest.animations.length,6);
  assert.equal(new Set(manifest.animations.map(item=>item.id)).size,6);
  for(const entry of manifest.animations){
    assert.equal(entry.frameCount,12);
    assert.deepEqual(entry.frameSize,[512,512]);
    const raw=await readFile(entry.sourceArchive);
    assert.equal(raw.length,entry.bytes);
    assert.equal(createHash('sha256').update(raw).digest('hex'),entry.sha256);
    assert.equal(raw.subarray(0,4).toString('hex'),'504b0304');
  }
});
test('all 72 original frames in the archives have PNG RGBA headers', () => {
  const stdout=execFileSync('python3',['scripts/materialize-wind-animations.py'],{encoding:'utf8'});
  assert.match(stdout,/PASS: 6 approved ZIPs, 72 source RGBA frames/);
});


test('all 72 materialized frames and 6 runtime sprite sheets exist and have correct formats', async () => {
  const manifest=JSON.parse(await readFile('assets/exploration/objects/animated/manifest.v1.json','utf8'));
  let count=0;
  for (const entry of manifest.animations) {
    assert.equal(entry.runtimeAtlas.animation.columns,4);
    assert.equal(entry.runtimeAtlas.animation.rows,3);
    assert.equal(entry.runtimeAtlas.animation.frames,12);
    const sheet=await readFile(entry.runtimeAtlas.path);
    assert.equal(sheet.subarray(0,4).toString('ascii'),'RIFF');
    assert.equal(sheet.subarray(8,12).toString('ascii'),'WEBP');
    assert.equal(sheet.readUInt32LE(4)+8,sheet.length);
    for(let i=0;i<12;i++){
      const png=await readFile(entry.framesDir+'/frame_'+String(i).padStart(2,'0')+'.png');
      assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
      assert.equal(png.subarray(12,16).toString('ascii'),'IHDR');
      assert.equal(png.readUInt32BE(16),512);
      assert.equal(png.readUInt32BE(20),512);
      assert.equal(png[25],6);
      count++;
    }
  }
  assert.equal(count,72);
});
