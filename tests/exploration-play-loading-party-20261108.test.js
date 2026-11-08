import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCaptureCombatWarmupV1} from '../src/encounters/capture-combat-warmup-v1.js';
import {createImmersiveEncounterHostV1} from '../src/encounters/immersive-encounter-host-v1.js';

const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('scoped Combat prewarming decodes the SAVED fighter, never reads Demo party or another species',async()=>{
 const visual=(id,view)=>({draft:{id,presentation:{visual:{[view]:{assetId:id+'-asset'}}}}});
 const bundle={creatureTransfers:[visual('saved-a','back'),visual('saved-b','back'),visual('enemy','front')]};
 const catalog={assets:['saved-a','saved-b','enemy'].map(id=>({
  id:id+'-asset',resource:{file:'capture/'+id+'.webp'}
 }))};
 const requests=[],decoded=[];
 const warm=createCaptureCombatWarmupV1({
  documentUrl:'https://test.invalid/sculpt-lab.html',
  decodeImage:async url=>decoded.push(url.pathname),
  fetchImpl:async url=>{
   requests.push(url.pathname);
   if(url.pathname.endsWith('encounter-bundle.v1.json'))return {ok:true,json:async()=>bundle};
   if(url.pathname.endsWith('global-visual-assets.v1.json'))return {ok:true,json:async()=>catalog};
   throw Error('Preview party forbidden for scoped game '+url.pathname);
  }
 });
 const first=await warm.warmCreature('enemy','saved-b');
 assert.deepEqual(first,['capture/saved-b.webp','capture/enemy.webp']);
 assert.ok(!requests.some(s=>s.includes('party.preview')));
 assert.equal(decoded.length,2);
 assert.deepEqual(await warm.warmCreature('enemy','saved-b'),first);
 assert.equal(decoded.length,2,'same real opponent/active pair remains cached');
 const other=await warm.warmCreature('enemy','saved-a');
 assert.deepEqual(other,['capture/saved-a.webp','capture/enemy.webp']);
 assert.equal(decoded.length,4,'changed active instance must prewarm the correct model');
});

test('native play never reveals the editor before a painted frame, and ramp heights reuse the owner cache',()=>{
 const html=file('sculpt-lab.html'),js=file('src/sculpt-lab-main.js');
 assert.match(html,/classList\.add\('sculpt-play-booting'\)/);
 assert.match(html,/id="sculpt-play-boot-mask"/);
 assert.match(html,/id="play-area-loading"/);
 assert.match(html,/play-loading-brand[^>]*>GenSRPG/);
 assert.match(js,/requestAnimationFrame\(\(\)=>requestAnimationFrame\(\(\)=>\{/);
 assert.match(js,/schema:'gensrpg\.exploration\.play\.ready\.v1'/);
 assert.match(js,/\.\.\.resolvedSculptTerrainRamps\(\)\],\s*navActor\.sculptStairId/);
 assert.match(js,/void sculptCombatWarmup\.warmCreature\(creatureId,scopedEncounter\?\.party\?\.active\?\.speciesId\?\?null\)/);
 assert.match(js,/if\(!sculptPlayRequested\)\{\s*refreshSculptEncounterEditor\(\);\s*refreshSculptWorldPanel\(\);/,
  'real play should never build hidden authoring panels during a zone mount');
});

test('genuine Combat iframe remains masked until correlated readiness, spoofing cannot unlock it',()=>{
 const origin='https://test.invalid',eventHandlers={};
 const win={location:{origin,href:origin+'/sculpt-lab.html'},addEventListener(t,fn){eventHandlers[t]=fn;},removeEventListener(t){delete eventHandlers[t]}};
 const nodes=[];
 const doc={fullscreenElement:null,documentElement:{requestFullscreen(){return Promise.resolve()}},
  body:{append(node){nodes.push(node)}},
  createElement(tag){
   const el={tagName:tag.toUpperCase(),dataset:{},style:{},children:[],
    append(child){this.children.push(child);},setAttribute(name,value){this[name]=value;},
    remove(){const at=nodes.indexOf(this);if(at>=0)nodes.splice(at,1);}};
   if(tag==='iframe')el.contentWindow={iframeId:'battle'};
   return el;
  }};
 const host=createImmersiveEncounterHostV1({windowRef:win,documentRef:doc,
  storage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
  onCompleted:()=>false});
 const snapshot={encounterId:'real-battle',returnToken:'token-1'};
 const url=origin+'/combat-preview/examples/dom-demo/exploration-encounter.html';
 assert.equal(host.open({url,snapshot}),true);
 const frame=nodes[0].children[0],loading=nodes[0].children[1];
 assert.equal(frame.dataset.combatReady,'false');
 assert.equal(frame.style.opacity,'0');
 assert.equal(loading.className,'combat-overlay__loading');
 const message=(source,originValue,data)=>eventHandlers.message({source,origin:originValue,data});
 const ready={type:'gensrpg.capture.combat-ready.v1',encounterId:'real-battle',returnToken:'token-1'};
 message({},origin,ready);
 message(frame.contentWindow,'https://spoof.invalid',ready);
 message(frame.contentWindow,origin,{...ready,returnToken:'wrong'});
 assert.equal(frame.style.opacity,'0');
 message(frame.contentWindow,origin,ready);
 assert.equal(frame.dataset.combatReady,'true');
 assert.equal(frame.style.opacity,'1');
 assert.equal(nodes.length,1,'CombatResult is not consumed by rendering readiness');
 host.dispose();
 assert.equal(nodes.length,0);
});
