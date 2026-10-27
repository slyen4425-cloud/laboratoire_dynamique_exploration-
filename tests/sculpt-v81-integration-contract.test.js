import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../sculpt-lab-v80.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
test('V81 encounter and terrain controls exist in shipped HTML',()=>{
 for(const id of ['sculpt-settings','encounter-settings','encounter-family','encounter-chance','encounter-elements','surface-family']){
  assert.match(html,new RegExp('id=["\\x27]'+id+'["\\x27]'),id);
 }
});
test('V81 navigation uses distance gate after collision movement and resets on import',()=>{
 const move=js.indexOf('const moved=Math.hypot(navActor.x-previousX');
 const gate=js.indexOf('encounterPacer.advance(moved)');
 assert.ok(move>=0&&gate>move);
 assert.match(js,/surface=imported\.surface;[^\n]*\n\s*encounterPacer\.reset\(\)/);
 assert.match(js,/terrainFamilyId:surfaceFamilySelect\?\.value\?\?surface\.baseTerrainFamilyId/);
});
