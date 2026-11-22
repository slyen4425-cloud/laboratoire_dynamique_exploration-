import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../npc-editor.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../src/actors/npc-editor-v1.js',import.meta.url),'utf8');
const npc=readFileSync(new URL('../src/actors/user-npc-definition-v1.js',import.meta.url),'utf8');

test('NPC merchant presents a direct configuration action but never saves merchandise',()=>{
 assert.match(html,/id="npc-merchant-configure"/);
 assert.match(js,/gensrpg\.exploration\.npc\.merchant\.configure\.v1/);
 assert.match(js,/if\(dirty\)/);
 assert.match(js,/window\.parent\.postMessage/);
 assert.match(js,/window\.location\.origin/);
 assert.match(js,/merchantIdDraft/);
 assert.doesNotMatch(npc,/merchantOffers|purchasePrice|resalePercent|merchantStock/);
});

test('configuration request sends ONLY the saved NPC identity and linked merchant reference',()=>{
 assert.match(js,/npcId:selected\?\.id\?\?null/);
 assert.match(js,/merchantId:merchantIdDraft\|\|null/);
 assert.match(js,/if\(dirty\)/);
 assert.doesNotMatch(js,/merchantOffers\s*:/);
 assert.doesNotMatch(js,/merchantStocks\s*:/);
});
