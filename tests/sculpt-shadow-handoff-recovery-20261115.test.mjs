import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {worldObjectShadowMaskV1} from '../src/render/world-object-shadow-silhouette-v1.js';
import {drawWorldObjectContactShadowV1,worldObjectShadowProjectionV1}
 from '../src/render/world-object-renderer.js';
import {createCaptureEncounterSnapshot} from '../src/encounters/capture-encounter-contract.js';
import {launchCombatHandoffNavigation,resumePendingCombatHandoffNavigation}
 from '../src/encounters/combat-handoff-navigation.js';
import {readCombatHandoff,saveCombatHandoff,attachCombatResult,consumeCombatResult}
 from '../src/encounters/combat-handoff-store.js';
const script=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
const snapshot=()=>createCaptureEncounterSnapshot({
 encounterId:'encounter-original',playerPartyRef:'capture-party-player-v1',
 opponentCreatureId:'crea_nat_3',rulesetId:'capture.standard.1v1',
 areaId:'forest-exterior',terrainFamilyId:'forest',elementId:'nature',
 combatArenaIds:['snow'],returnToken:'return-original'
});
const store=()=>{const values=new Map();return {
 getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),
 removeItem:k=>values.delete(k)
}};
const page='https://example.test/laboratoire_dynamique_exploration-/sculpt-lab.html?worldAssembler=1';

test('building contact is a cropped facade footline, never a full-height dark pseudo-hill',()=>{
 const w=32,h=24,pixels=new Uint8ClampedArray(w*h*4);
 for(let x=3;x<29;x++)for(let y=4;y<=(x<14?17:22);y++)
   pixels[(y*w+x)*4+3]=255;
 const doc={createElement(){return {width:0,height:0,getContext(){return {
  drawImage(){},getImageData(){return {data:pixels}},
  fillRect(){},set globalCompositeOperation(_){},set fillStyle(_){}
 }}}}};
 const image={naturalWidth:w,naturalHeight:h,ownerDocument:doc};
 const mask=worldObjectShadowMaskV1(image,null,{groundContact:true});
 assert.ok(mask.contactColumns>=20);
 assert.ok(mask.contactHeight<h/2,'contact mask is a tight lower strip');
 assert.ok(mask.contactTop>=Math.floor(h*.56),'no shadow is painted at the roof');
 const draws=[],transforms=[];
 const ctx={save(){},restore(){},translate(){},
  transform(...args){transforms.push(args)},drawImage(...args){draws.push(args)},
  set globalAlpha(_){}
 };
 assert.equal(drawWorldObjectContactShadowV1(ctx,{
  kind:'building',width:160,height:120,footOffset:60,image
 }),true);
 assert.equal(draws.length,2);
 assert.equal(draws[1][0],mask.contactCanvas);
 assert.equal(draws[1][6],160);
 assert.equal(draws[1][7],120*mask.contactHeight/mask.h);
 assert.ok(draws[1][5]>0,'contact starts near facade base, not at image top');
 assert.deepEqual(transforms[0].slice(0,4),[1,0,-.14,.105]);
 const building=worldObjectShadowProjectionV1({
  kind:'building',width:160,height:120,footOffset:60
 });
 const tree=worldObjectShadowProjectionV1({kind:'tree',width:160,height:120,footOffset:60});
 assert.ok(building.flatten<tree.flatten/2,'house footprint stays near its feet');
 assert.equal(drawWorldObjectContactShadowV1(ctx,{
  kind:'bridge',width:160,height:120,image
 }),false,'bridge has no fake shadow');
});

test('pending untouched battle is resumed without rewriting its return point, arena or bytes',()=>{
 const storage=store(),snap=snapshot();let url;
 launchCombatHandoffNavigation({
  snapshot:snap,player:{currentAreaId:'forest-exterior',x:22,y:49},
  storage,documentUrl:page,navigate:u=>{url=u}
 });
 const before=readCombatHandoff(storage);
 const raw=JSON.stringify(before);
 assert.equal(before.returnState.x,22);
 assert.equal(resumePendingCombatHandoffNavigation({
  snapshot:snap,storage,documentUrl:page,navigate:u=>{url=u}
 }),true);
 assert.ok(url.endsWith('/combat-preview/examples/dom-demo/exploration-encounter.html'));
 assert.equal(JSON.stringify(readCombatHandoff(storage)),raw,'resume leaves envelope bytes intact');
 assert.deepEqual(readCombatHandoff(storage).snapshot.context.combatArenaIds,
   before.snapshot.context.combatArenaIds);
});

test('a new arena encounter cannot replace the old correlation, and committed results cannot replay',()=>{
 const storage=store(),snap=snapshot();
 launchCombatHandoffNavigation({
  snapshot:snap,player:{currentAreaId:'forest-exterior',x:22,y:49},
  storage,documentUrl:page,navigate(){}
 });
 const original=readCombatHandoff(storage);
 const changed={...snap,encounterId:'new-encounter',returnToken:'new-return'};
 assert.throws(()=>resumePendingCombatHandoffNavigation({
  snapshot:changed,storage,documentUrl:page,navigate(){}
 }),/précédent/);
 assert.deepEqual(readCombatHandoff(storage),original);
 const done=attachCombatResult(original,{
  encounterId:snap.encounterId,returnToken:snap.returnToken,outcome:'victory'
 });
 saveCombatHandoff(storage,done);
 assert.throws(()=>resumePendingCombatHandoffNavigation({
  snapshot:snap,storage,documentUrl:page,navigate(){}
 }),/précédent/);
 assert.equal(readCombatHandoff(storage).result.outcome,'victory');
 assert.equal(consumeCombatResult(storage).result.outcome,'victory');
 assert.equal(readCombatHandoff(storage),null);
});

test('resume rejects unknown page and tampered callback origin without clearing pending data',()=>{
 const storage=store(),snap=snapshot();
 launchCombatHandoffNavigation({
  snapshot:snap,player:{currentAreaId:'forest-exterior',x:22,y:49},
  storage,documentUrl:page,navigate(){}
 });
 const original=readCombatHandoff(storage);
 for(const documentUrl of ['https://evil.test/sculpt-lab.html',
  'https://example.test/other-editor.html']){
  assert.throws(()=>resumePendingCombatHandoffNavigation({
   snapshot:snap,storage,documentUrl,navigate(){}
  }),/page|correspond/);
 }
 assert.deepEqual(readCombatHandoff(storage),original);
});

test('Tester re-enters prior battle first; no auto-delete of scoped Capture reward or bypass',()=>{
 assert.match(script,/recoverStandaloneSculptEncounter\(\)/);
 assert.match(script,/if\(!recoveredTesterCombat\)sculptEncounterStep\(\)/);
 assert.match(script,/sculptTesterCombatRecoveryBlocked/);
 assert.match(script,/consumeCombatResult\(sculptCombatStorage\)/);
 assert.match(script,/resumePendingCombatHandoffNavigation/);
 assert.match(script,/if\(scopedEncounter\)return commitScopedSculptEncounter\(envelope\)/);
 assert.doesNotMatch(script.slice(script.indexOf('function recoverStandaloneSculptEncounter'),
  script.indexOf('function launchSculptEncounter')),/removeItem|clear\(|localStorage\.setItem/);
});
