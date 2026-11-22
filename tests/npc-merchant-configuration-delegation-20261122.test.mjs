import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../npc-editor.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../src/actors/npc-editor-v1.js',import.meta.url),'utf8');
const npc=readFileSync(new URL('../src/actors/user-npc-definition-v1.js',import.meta.url),'utf8');

test('merchant is configured INSIDE the existing NPC form with the single Capture editor',()=>{
 for(const id of ['npc-merchant-config','npc-merchant-configure','npc-merchant-inline',
  'npc-merchant-frame','npc-merchant-close'])
  assert.equal(html.split('id="'+id+'"').length-1,1,id);
 assert.match(js,/new URL\('\.\.\/\.\.\/assets\/gensrpg\/capture-v2\/adventure\.html',window\.location\.href\)/);
 assert.match(js,/url\.searchParams\.set\('editor','merchant'\)/);
 assert.match(js,/url\.searchParams\.set\('embed','npc'\)/);
 assert.doesNotMatch(js,/schema:'gensrpg\.exploration\.npc\.merchant\.configure\.v1'/);
 assert.doesNotMatch(npc,/merchantOffers|purchasePrice|resalePercent|merchantStock/);
});

test('Capture save links only merchantId to the saved NPC with nonce/origin/source guards',()=>{
 assert.match(js,/inlineMerchantNonce=crypto\.randomUUID\(\)/);
 assert.match(js,/event\.origin!==window\.location\.origin/);
 assert.match(js,/event\.source===\$\('npc-merchant-frame'\)\.contentWindow/);
 assert.match(js,/data\.nonce!==inlineMerchantNonce/);
 assert.match(js,/data\.npcId!==selected\.id/);
 assert.match(js,/gensrpg\.capture\.v2\.npc\.merchant\.saved\.v1/);
 assert.match(js,/const existing=await store\.get\(npcId\)/);
 assert.match(js,/npc:\{\.\.\.existing\.npc,merchantId:id\}/);
 assert.match(js,/await store\.put\(updated\)/);
 assert.match(js,/check\?\.npc\?\.merchantId!==id/);
 assert.doesNotMatch(js,/merchantOffers\s*:|merchantStocks\s*:|pricePerItem\s*:/);
});
