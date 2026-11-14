import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Characterization of the real Exploration canvas nameplate (no duplicate DOM HUD).
test('play hero name stays above native actor with legible outline and no black box',()=>{
 const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const start=source.indexOf('// Display-only nameplate:');
 const end=source.indexOf('\nfunction navigationSpawn()',start);
 assert.ok(start>=0&&end>start);
 const scoped=source.slice(start,end);
 assert.match(scoped,/if\(sculptPlayHeroDisplayName\)/);
 assert.match(scoped,/sculptCameraProjectBridgeFoot/);
 assert.match(scoped,/ctx\.strokeText\(name/);
 assert.match(scoped,/ctx\.fillText\(name/);
 assert.doesNotMatch(scoped,/ctx\.fillRect\(/);
 assert.doesNotMatch(scoped,/document\.createElement/);
});
