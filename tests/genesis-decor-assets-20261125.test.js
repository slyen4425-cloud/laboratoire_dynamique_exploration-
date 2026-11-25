import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {listNativeObjectDefinitions} from '../src/objects/object-definition-catalog.js';
import {resolveWorldObjectAsset} from '../src/assets/world-object-asset-adapter.js';
import {resolveObjectLibraryFolder} from '../src/objects/object-library-taxonomy.js';

test('Genesis decorative assets are unique, native, correctly mapped and match source manifest',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../assets/exploration/objects/manifest.genesis-decor-20261125.json',import.meta.url),'utf8'));
  assert.equal(manifest.sourceCount,77);
  assert.ok(manifest.assets.length>=60);
  assert.equal(manifest.assetCount,manifest.assets.length);
  const defs=listNativeObjectDefinitions();
  const ids=new Set(),paths=new Set(),hashes=new Set();
  for(const rec of manifest.assets){
    assert.ok(!ids.has(rec.assetId));ids.add(rec.assetId);
    assert.ok(!paths.has(rec.file));paths.add(rec.file);
    assert.ok(!hashes.has(rec.sha256));hashes.add(rec.sha256);
    const def=defs.find(d=>d.id===rec.definitionId);
    assert.ok(def,rec.definitionId);
    assert.equal(def.visual.assetId,rec.assetId);
    assert.ok(resolveObjectLibraryFolder(def.library.folderId));
    assert.equal(resolveWorldObjectAsset(rec.assetId)?.path,'./'+rec.file);
    const bytes=readFileSync(new URL('../'+rec.file,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),rec.sha256);
    assert.equal(bytes.toString('ascii',0,4),'RIFF');
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    assert.ok(rec.width<=512&&rec.height<=512);
    if(rec.traversable){assert.equal(def.footprint.enabled,false);assert.equal(def.collision,undefined);}
    else assert.equal(def.collision.role,'obstacle');
  }
  assert.ok(manifest.bytes<12*1024*1024);
});
