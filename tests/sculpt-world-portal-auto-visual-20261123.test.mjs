import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createBlankWorldBuilderDraft,addWorldArea,connectWorldAreas,
 serializeWorldBuilderDraft,importWorldBuilderDocument
} from '../src/builder/world-builder-draft.js';
import {
 findPortalEnteredDuringMove,findTriggeredPortal,applyPortalTransition
} from '../src/world/portal-model.js';
import {setSculptWorldPortalAppearance} from '../src/builder/sculpt-world-area-link.js';
import {markersForSculptWorldArea,pickSculptWorldEditorMarkerV1} from '../src/builder/sculpt-world-portal-markers.js';

function linked(){
 let draft=createBlankWorldBuilderDraft({id:'auto-travel',width:36*28,height:24*21});
 draft=addWorldArea(draft,{name:'Nouvelle forêt',kind:'exterior'});
 draft=connectWorldAreas(draft,{
  sourceAreaId:draft.areas[0].id,targetAreaId:draft.areas[1].id,returnPortal:true
 });
 const from=draft.areas[0].id,to=draft.areas[1].id;
 const outward=draft.portals.find(p=>p.sourceAreaId===from);
 const reverse=draft.portals.find(p=>p.sourceAreaId===to);
 return {draft,from,to,outward,reverse};
}
const within=portal=>({x:portal.trigger.x,y:portal.trigger.y});
const outside=portal=>({x:portal.trigger.x+portal.trigger.radius+4,y:portal.trigger.y});

test('automatic crossing reads a real post-collision Portal once, not the rendering style',()=>{
 const {draft,from,to,outward,reverse}=linked();
 assert.equal(findPortalEnteredDuringMove(draft,from,outside(outward),within(outward))?.id,outward.id);
 assert.equal(findPortalEnteredDuringMove(draft,from,within(outward),within(outward)),null);
 assert.equal(findPortalEnteredDuringMove(draft,from,within(outward),
   {x:outward.trigger.x+2,y:outward.trigger.y}),null);
 const arrival=applyPortalTransition(draft,{currentAreaId:from,...within(outward)},outward);
 assert.equal(arrival.currentAreaId,to);
 assert.equal(findPortalEnteredDuringMove(draft,to,within(reverse),
   {x:reverse.trigger.x+1,y:reverse.trigger.y}),null,
   'arrival inside a reverse passage cannot bounce back immediately');
 assert.equal(findPortalEnteredDuringMove(draft,to,outside(reverse),within(reverse))?.id,reverse.id);
});

test('invisible portal stays traversable and editable without a hidden second geometry',()=>{
 const {draft,from,outward}=linked();
 const hidden=setSculptWorldPortalAppearance(draft,outward.id,{mode:'hidden'});
 const portal=hidden.portals.find(p=>p.id===outward.id);
 assert.equal(portal.visual.visible,false);
 assert.deepEqual(portal.trigger,outward.trigger);
 assert.equal(findTriggeredPortal(hidden,from,within(outward))?.id,outward.id);
 assert.equal(markersForSculptWorldArea(hidden,from,{testing:true}).some(m=>m.portalId===outward.id),false);
 assert.equal(markersForSculptWorldArea(hidden,from).some(m=>m.portalId===outward.id),false);
 const ghost=markersForSculptWorldArea(hidden,from,{testing:false,showHidden:true})
   .find(m=>m.portalId===outward.id);
 assert.equal(ghost.visibleInPlay,false);
 assert.equal(pickSculptWorldEditorMarkerV1(hidden,from,within(outward))?.portalId,outward.id);
 assert.deepEqual(importWorldBuilderDocument(serializeWorldBuilderDraft(hidden))
   .portals.find(p=>p.id===outward.id).trigger,outward.trigger);
});

test('black shadow and official texture survive WorldDocument import/export',()=>{
 const {draft,from,outward}=linked();
 const shadow=setSculptWorldPortalAppearance(draft,outward.id,{mode:'shadow'});
 assert.equal(shadow.portals.find(p=>p.id===outward.id).visual.marker,'shadow');
 const withArt=setSculptWorldPortalAppearance(shadow,outward.id,
   {mode:'texture',textureMaterialId:'ground.snow.rocky'});
 const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(withArt));
 const portal=restored.portals.find(p=>p.id===outward.id);
 assert.equal(portal.visual.visible,true);
 assert.equal(portal.visual.marker,'texture');
 assert.equal(portal.visual.textureMaterialId,'ground.snow.rocky');
 assert.equal(markersForSculptWorldArea(restored,from,{testing:true})
   .find(m=>m.portalId===outward.id).textureMaterialId,'ground.snow.rocky');
 assert.equal(findTriggeredPortal(restored,from,within(outward))?.id,outward.id);
 assert.throws(()=>setSculptWorldPortalAppearance(restored,outward.id,
   {mode:'texture',textureMaterialId:'https://untrusted.example/p.png'}),/Texture officielle/);
 assert.throws(()=>setSculptWorldPortalAppearance(restored,outward.id,{mode:'unknown'}),/Aspect/);
});

test('one existing waypoint UI exposes visibility and official material selection, no manual portal IDs',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const script=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const builder=readFileSync(new URL('../builder.html',import.meta.url),'utf8');
 for(const id of ['object-waypoint-appearance','object-waypoint-marker-mode',
   'object-waypoint-marker-texture','object-waypoint-marker-save']){
   assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1);
 }
 assert.match(script,/findPortalEnteredDuringMove\(sculptWorldDraft,sculptWorldAreaId/);
 assert.match(script,/if\(autoReady\)queueMicrotask\(\(\)=>\{/);
  assert.match(script,/void traverseSculptWorldPortal\(\)/);
 assert.match(script,/if\(sculptPortalLoading\)/);
 assert.match(script,/setSculptWorldPortalAppearance\(sculptWorldDraft/);
 assert.match(script,/showHidden:!navigationTesting/);
 assert.match(builder,/id="portal-texture"/);
 assert.match(builder,/<option value="shadow">/);
 assert.match(builder,/<option value="texture">/);
});
