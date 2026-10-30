import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {builtinSculptMapPresets} from '../src/builder/sculpt-builtin-map-presets.js';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {createWorldAreaFromSculptMapPreset} from '../src/builder/sculpt-map-preset-library.js';
import {sculptWorldAreaScene} from '../src/builder/sculpt-world-area-link.js';
import {resolvePortalTriggerPoint,findTriggeredPortal,applyPortalTransition} from '../src/world/portal-model.js';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('all existing prefab houses create usable 2.5D WorldArea interiors and canonical anchored return Portals',()=>{
 let houses=0;
 for(const preset of builtinSculptMapPresets()){
  const host=createBlankWorldBuilderDraft({id:'preset-homes',width:36*28,height:24*21});
  const doc=createWorldAreaFromSculptMapPreset(host,preset,{
   name:preset.name,kind:'exterior',hostAreaId:host.initialAreaId
  });
  const outside=doc.areas[1];
  const buildings=outside.objects.filter(x=>x.objectDefinitionId.includes('objectdef.building.'));
  const entered=doc.portals.filter(p=>p.sourceAreaId===outside.id&&p.trigger.kind==='object-anchor');
  assert.equal(entered.length,buildings.length,preset.name+' requires one real linked interior per building');
  for(const b of buildings){
    houses++;
    const entry=entered.find(p=>p.trigger.objectId===b.id);
    assert.ok(entry,'house must have anchored door');
    const point=resolvePortalTriggerPoint(doc.areas,entry);
    assert.ok(point,'building door anchor must resolve');
    const inside=doc.areas.find(a=>a.id===entry.targetAreaId);
    assert.equal(inside.kind,'interior');
    assert.equal(inside.width,18*28);
    assert.equal(inside.height,14*21);
    assert.equal(sculptWorldAreaScene(inside).terrain.width,18);
    assert.ok(inside.walls.length>=1,'interior has a real partition wall');
    assert.ok(inside.surface.zones.length>=1,'interior has an editable finished floor area');
    const gate=findTriggeredPortal(doc,outside.id,{x:point.x,y:point.y});
    assert.equal(gate?.id,entry.id);
    const arrival=applyPortalTransition(doc,{currentAreaId:outside.id,x:point.x,y:point.y},entry);
    assert.equal(arrival.currentAreaId,inside.id);
    const exit=doc.portals.find(p=>p.sourceAreaId===inside.id&&p.targetAreaId===outside.id);
    assert.ok(exit,'house return door must be present');
    assert.ok(resolvePortalTriggerPoint(doc.areas,exit));
    const outsideAgain=applyPortalTransition(doc,{currentAreaId:inside.id,x:exit.trigger.x,y:exit.trigger.y},exit);
    assert.equal(outsideAgain.currentAreaId,outside.id);
    assert.ok(serializeWorldBuilderDraft(doc).length>1000);
  }
 }
 assert.ok(houses>=5);
});

test('old destinations that cannot open in Sculpt are disabled before pressing Enter',()=>{
 const s=src('src/sculpt-lab-main.js');
 assert.match(s,/sculptWorldAreaScene\(target\)/);
 assert.match(s,/Passage impossible en 2,5D/);
 assert.match(s,/button.disabled=true/);
 assert.match(s,/sculptWorldCurrentInterior\(\)/);
});
