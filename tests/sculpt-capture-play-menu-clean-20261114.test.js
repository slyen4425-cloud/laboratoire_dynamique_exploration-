import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');

test('the native Explorer menu delegates its single scoped request to Capture',()=>{
 assert.ok(src.includes("$('play-menu-button').addEventListener('click',()=>{"));
 assert.ok(src.includes("schema:'gensrpg.exploration.play.open-menu.v1'"));
 assert.ok(src.includes('sessionId:playOptions.sessionId'));
 assert.ok(src.includes('window.location.origin'));
 assert.equal(src.includes("$('play-menu-button').addEventListener('click',returnToTitle)"),false);
});
test('Capture play keeps one Portal indicator and preserves all error messages',()=>{
 assert.ok(src.includes("$('play-location').hidden=Boolean(playOptions)"));
 assert.ok(src.includes("output.textContent=sculptPlayActive&&playOptions?'':'Partie enregistrée'"));
 assert.ok(src.includes("feedback.dataset.error='false';feedback.hidden=Boolean(sculptPlayActive)"));
 assert.ok(src.includes("feedback.dataset.error='true';feedback.hidden=false"));
});
