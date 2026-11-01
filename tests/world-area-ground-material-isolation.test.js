import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlankWorldBuilderDraft,addWorldArea,connectWorldAreas,
  serializeWorldBuilderDraft,importWorldBuilderDocument
} from '../src/builder/world-builder-draft.js';
import {sculptWorldAreaScene,saveSculptWorldArea}
  from '../src/builder/sculpt-world-area-link.js';
import {normalizeSculptSurface} from '../src/world/sculpt-surface-paint.js';
import {applyPortalTransition} from '../src/world/portal-model.js';

function paintBase(doc,areaId,baseMaterialId){
  const area=doc.areas.find(a=>a.id===areaId);
  const scene=sculptWorldAreaScene(area);
  return saveSculptWorldArea(doc,areaId,{
    ...scene,surface:normalizeSculptSurface({...scene.surface,baseMaterialId})
  });
}
function baseOf(doc,areaId){
  return sculptWorldAreaScene(doc.areas.find(a=>a.id===areaId)).surface.baseMaterialId;
}

test('Area A grass -> Area B rock -> Area A grass retains distinct authored WorldSurface, including JSON persistence',()=>{
  const start=createBlankWorldBuilderDraft({id:'two-materials',width:1008,height:504});
  const a=start.initialAreaId;
  const added=addWorldArea(start,{name:'Montagne',kind:'exterior',width:1008,height:504});
  const b=added.areas.find(area=>area.id!==a).id;
  let doc=paintBase(added,a,'grass.forest');
  doc=paintBase(doc,b,'ground.mountain_rock');
  doc=connectWorldAreas(doc,{sourceAreaId:a,targetAreaId:b,returnPortal:true});
  assert.equal(baseOf(doc,a),'grass.forest');
  assert.equal(baseOf(doc,b),'ground.mountain_rock');
  for(const [from,to,expected] of [[a,b,'ground.mountain_rock'],
    [b,a,'grass.forest'],[a,b,'ground.mountain_rock'],[b,a,'grass.forest']]){
    const portal=doc.portals.find(p=>p.sourceAreaId===from&&p.targetAreaId===to);
    assert.ok(portal);
    const outcome=applyPortalTransition(doc,{
      currentAreaId:from,x:portal.trigger.x,y:portal.trigger.y
    },portal);
    assert.equal(outcome.currentAreaId,to);
    assert.equal(baseOf(doc,outcome.currentAreaId),expected);
  }
  const loaded=importWorldBuilderDocument(serializeWorldBuilderDraft(doc));
  assert.equal(baseOf(loaded,a),'grass.forest');
  assert.equal(baseOf(loaded,b),'ground.mountain_rock');
  // Editing B after return must never repaint A.
  const changed=paintBase(loaded,b,'ground.snow');
  assert.equal(baseOf(changed,a),'grass.forest');
  assert.equal(baseOf(changed,b),'ground.snow');
});
