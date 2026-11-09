import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
const start=source.indexOf('async function traverseSculptWorldPortal(){');
const end=source.indexOf('function persistPlayNavigationCheckpoint(){',start);
const transition=source.slice(start,end);

test('play portal validates the destination before leaving its current world area',()=>{
 assert.ok(start>=0&&end>start,'original single owner Portal traversal must exist');
 assert.match(transition,/validatedTargetScene=sculptWorldAreaScene\(target\)/,
  'destination must be validated before unmount');
 assert.match(transition,/applyPortalTransition\(document/,
  'native Portal/Spawn transition remains authoritative');
});
test('the native play transition reuses the scene projection instead of rebuilding it twice',()=>{
 assert.match(source,/function mountWorldSculptArea\(areaId,validatedScene=null\)/,
  'a prevalidated scene can be reused by the native zone mount');
 assert.match(source,/const scene=validatedScene\?\?sculptWorldAreaScene\(area\)/,
  'regular builder and standalone mounts preserve original scene validation');
 assert.match(transition,
  /const destinationScene=sculptPlayActive&&transition\.currentAreaId===target\.id\s*\?validatedTargetScene/,
  'play mode may reuse only an explicitly validated matching destination');
 assert.match(transition,
  /:sculptWorldAreaScene\(document\.areas\.find\(a=>a\.id===transition\.currentAreaId\)\)/,
  'repair/authoring mode must revalidate a possibly changed document');
 assert.match(transition,/mountWorldSculptArea\(transition\.currentAreaId,destinationScene\)/,
  'the mount must consume the exact once-validated scene');
});
test('the same collision, spawn, checkpoint, loading veil and paint gates remain in use',()=>{
 for(const required of [
  'applyPortalTransition(', 'isBlocked(navigationWorld()', 'setNavigationTesting(false)',
  'setNavigationTesting(true)', 'playPositionWriter(', 'persistPlayNavigationCheckpoint()',
  'overlay.hidden=false', 'overlay.hidden=true',
  'requestAnimationFrame(()=>requestAnimationFrame(resolve))'
 ])assert.ok(source.includes(required),required+' must remain');
 assert.doesNotMatch(transition,/localStorage\.clear|new\s+WorldDocument|setTimeout\([^)]*,\s*\d{4}/,
  'this optimization cannot replace, reset or delay saved gameplay state');
});
