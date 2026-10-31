import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');

test('object editor has one native finger-accessible fold control keeping the map visible',()=>{
  assert.equal((html.match(/id="object-palette"/g)??[]).length,1);
  assert.match(html,/<details id="object-palette"[^>]*\bopen\b[^>]*>/);
  assert.match(html,/<summary[^>]*>[^<]*(?:Réglages|Objets)[^<]*<\/summary>/);
  assert.match(html,/#object-palette:not\(\[open\]\)/);
  assert.match(html,/#object-palette:not\(\[open\]\)\s*>\s*:not\(summary\)/);
  assert.match(html, /#object-palette\[hidden\]\{display:none!important\}/);
  assert.match(html,/body\.sculpt-immersive #object-palette/);
});
test('collapsed palette is display-only: placement remains active and controls remain mounted',()=>{
  for(const id of ['object-controls','actor-controls','object-category','object-definition',
    'object-action','object-scale','object-variant','object-undo','object-redo']){
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))??[]).length,1);
  }
  assert.match(script,/\$\('object-palette'\)\.hidden=!objectEditing/);
  assert.match(script,/paletteExpanded:\$\('object-palette'\)\.open/);
  assert.doesNotMatch(script,/objectEditing\s*=\s*!\$\('object-palette'\)\.open/);
});
