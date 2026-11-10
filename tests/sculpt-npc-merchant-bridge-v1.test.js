import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeMapActorNpcSettingsV1,nearestDialogNpcV1}
 from '../src/actors/map-actor-npc-settings-v1.js';
import {normalizeWorldActorPlacement} from '../src/actors/world-actor-placement-model.js';
const npc=(kind,merchantId,dialogue='')=>({kind,name:'Marchand',
 movement:{mode:'static',radius:90},dialogue,merchantId,
 questId:'',trainerTeamId:''});
const actor=(id,x,settings)=>normalizeWorldActorPlacement({
 id,actorDefinitionId:'exploration:npc:generic-v1',x,y:10,npc:settings
});
test('merchant with a canonical reference is interactable inside native proximity, even without dialogue',()=>{
 const placed=[actor('far',200,npc('merchant','merchant-old')),
  actor('near',30,npc('merchant','merchant-a')),
  actor('no-shop',9,npc('merchant',''))];
 assert.equal(nearestDialogNpcV1(placed,{x:32,y:10},65)?.id,'near');
 assert.equal(nearestDialogNpcV1(placed,{x:500,y:500},65),null);
 assert.equal(nearestDialogNpcV1([actor('dialogue',10,npc('dialogue','','Bonjour'))],{x:10,y:10})?.id,
  'dialogue','original dialogue interaction remains functional');
 assert.equal(nearestDialogNpcV1([actor('empty',10,npc('merchant',''))],{x:10,y:10}),null);
});
test('authored merchant link survives native actor normalization without a second shop',()=>{
 const item=actor('shop',42,npc('merchant','merchant-abc'));
 assert.equal(normalizeMapActorNpcSettingsV1(item.npc).merchantId,'merchant-abc');
 assert.equal(Object.hasOwn(item.npc,'stock'),false);
 assert.equal(Object.hasOwn(item.npc,'wallet'),false);
 assert.equal(Object.hasOwn(item.npc,'offers'),false);
});
test('Explorer links Capture merchants only by names and scoped messages',async()=>{
 const html=await readFile(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const main=await readFile(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 for(const id of ['npc-merchant-editor','npc-merchant-picker','npc-merchant-reload',
  'npc-merchant-clear','npc-merchant-status','npc-dialogue-trade'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.doesNotMatch(html,/id="actor-npc-merchant"/);
 assert.match(main,/gensrpg.exploration.npc.merchant.catalog.request.v1/);
 assert.match(main,/gensrpg.capture.v2.npc.merchant.catalog.response.v1/);
 assert.match(main,/gensrpg.exploration.npc.merchant.open.v1/);
 assert.match(main,/npcDialogueMerchant=canShop\?npc:null/);
 assert.match(main,/requestNpcMerchantShop\(actor\)/);
 assert.match(main,/gensrpg.capture.v2.npc.merchant.open-ack.v1/);
 assert.match(main,/gensrpg.capture.v2.npc.merchant.closed.v1/);
 assert.match(main,/event.origin!==window.location.origin\|\|event.source!==window.parent/);
 assert.match(main,/new Option\(shop.name,shop.id\)/);
 assert.doesNotMatch(main,/localStorage\.setItem\(.*merchant/i);
});
