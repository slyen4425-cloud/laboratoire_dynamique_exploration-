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
