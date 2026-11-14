import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');

test('the native Explorer play menu delegates its one menu trigger to Capture with scoped origin',()=>{
 assert.match(src,/\$('play-menu-button'\)\.addEventListener\('click',\(\)=>\{/);
 assert.match(src,/schema:'gensrpg\.exploration\.play\.open-menu\.v1'/);
 assert.match(src,/sessionId:playOptions\.sessionId/);
 assert.match(src,/window\.parent\.postMessage\([\s\S]*?window\.location\.origin\)/);
 assert.doesNotMatch(src,/\$('play-menu-button'\)\.addEventListener\('click',returnToTitle\)/);
});
test('a scoped game keeps one travel indicator, not repeated save or arrival success labels',()=>{
 assert.match(src,/\$('play-location'\)\.hidden=Boolean\(playOptions\)/);
 assert.match(src,/output\.textContent=sculptPlayActive&&playOptions\?'':'Partie enregistrée'/);
 assert.match(src,/feedback\.dataset\.error='false';feedback\.hidden=Boolean\(sculptPlayActive\)/);
 assert.match(src,/feedback\.dataset\.error='true';feedback\.hidden=false/);
});