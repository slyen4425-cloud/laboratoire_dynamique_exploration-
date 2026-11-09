import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  createBlankWorldBuilderDraft, createWorldBuilderDraft, addWorldArea,
  connectWorldAreas, removeWorldArea,
  setWorldAssemblerNodePosition, resetWorldAssemblerNodePositions,
  serializeWorldBuilderDraft, importWorldBuilderDocument
} from '../src/builder/world-builder-draft.js';

const createWorld=()=>{
  let doc=createBlankWorldBuilderDraft({id:'world-editor-layout'});
  doc=addWorldArea(doc,{name:'Vallée',kind:'exterior'});
  doc=addWorldArea(doc,{name:'Arène intérieure',kind:'dungeon'});
  doc=connectWorldAreas(doc,{
    sourceAreaId:doc.areas[1].id,
    targetAreaId:doc.areas[2].id,
    returnPortal:true
  });
  // A real native arena object, not a new object category or fake building.
  const arena={
    id:'arena-physical-1',
    objectDefinitionId:'objectdef.building.arena.element.nature.01',
    transform:{x:120,y:150,scaleX:1,scaleY:1,rotationDeg:0}
  };
  return createWorldBuilderDraft({
    ...doc,
    areas:doc.areas.map((area,i)=>i===1
      ? {...area,objects:[...area.objects,arena]}:area)
  });
};

test('World Assembler graph position survives real WorldDocument export/import and native world library roundtrip',()=>{
  const initial=createWorld();
  const areaId=initial.areas[1].id;
  const changed=setWorldAssemblerNodePosition(initial,areaId,{x:431.6,y:219.3});
  assert.equal(changed.authoringLayout.positions[areaId].x,432);
  assert.equal(changed.authoringLayout.positions[areaId].y,219);
  const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(changed));
  assert.deepEqual(restored.authoringLayout.positions[areaId],{x:432,y:219});
  assert.equal(restored.areas.length,initial.areas.length);
  assert.deepEqual(restored.areas,initial.areas);
  assert.deepEqual(restored.portals,initial.portals);
  assert.deepEqual(restored.events,initial.events);
  assert.equal(restored.initialAreaId,initial.initialAreaId);
  assert.equal(restored.areas[1].objects[0].objectDefinitionId,
    'objectdef.building.arena.element.nature.01');
  assert.equal(initial.authoringLayout,undefined,'never mutate source draft');
});

test('individual Area movement never affects movement, Portals or game coordinate authority',()=>{
  const doc=createWorld(),id=doc.areas[0].id;
  const first=setWorldAssemblerNodePosition(doc,id,{x:100,y:100});
  const second=setWorldAssemblerNodePosition(first,id,{x:180,y:120});
  assert.deepEqual(second.portals,doc.portals);
  assert.deepEqual(second.areas,doc.areas);
  assert.deepEqual(second.authoringLayout.positions[id],{x:180,y:120});
  assert.deepEqual(first.authoringLayout.positions[id],{x:100,y:100});
  const reset=resetWorldAssemblerNodePositions(second);
  assert.equal(reset.authoringLayout,undefined);
  assert.deepEqual(reset.areas,doc.areas);
  assert.deepEqual(reset.portals,doc.portals);
});

test('out-of-bounds, missing and unknown Area positions cannot corrupt a saved world',()=>{
  const doc=createWorld(),id=doc.areas[0].id;
  assert.throws(()=>setWorldAssemblerNodePosition(doc,'deleted-area',{x:50,y:50}),/introuvable/);
  assert.throws(()=>setWorldAssemblerNodePosition(doc,id,{x:NaN,y:50}),/invalide/);
  assert.throws(()=>setWorldAssemblerNodePosition(doc,id,{x:-1,y:50}),/invalide/);
  assert.throws(()=>setWorldAssemblerNodePosition(doc,id,{x:50000,y:50}),/invalide/);
  const raw={
    ...doc,
    authoringLayout:{positions:{
      [id]:{x:140,y:230},
      'obsolete-area':{x:14,y:14}
    }}
  };
  const restored=createWorldBuilderDraft(raw);
  assert.deepEqual(Object.keys(restored.authoringLayout.positions),[id]);
  assert.equal(restored.authoringLayout.positions['obsolete-area'],undefined);
});

test('deleting an unlinked Area cleans only its authoring coordinate',()=>{
  let doc=createWorld();
  doc=addWorldArea(doc,{name:'Côté nord',kind:'exterior'});
  const id=doc.areas.at(-1).id;
  doc=setWorldAssemblerNodePosition(doc,id,{x:555,y:444});
  const removed=removeWorldArea(doc,id);
  assert.ok(!removed.areas.some(a=>a.id===id));
  assert.equal(removed.authoringLayout,undefined);
  assert.equal(removed.portals.length,doc.portals.length);
});

test('World Assembler reuses native object/catalog/portal owners in its contents pane',()=>{
  const html=readFileSync(new URL('../world-assembler.html',import.meta.url),'utf8');
  const js=readFileSync(new URL('../src/builder/world-assembler-main.js',import.meta.url),'utf8');
  const css=readFileSync(new URL('../src/builder/world-assembler.css',import.meta.url),'utf8');
  for(const id of ['toggle-graph-links','reset-graph-layout','selected-contents',
    'place-area-object','create-area-instance']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(js,/objectDefinitionCatalogV1\.get/);
  assert.match(js,/portal\.sourceAreaId!==area\.id/);
  assert.match(js,/setWorldAssemblerNodePosition/);
  assert.match(js,/openAreaEditor\(mapPanelUrl\)/);
  assert.match(js,/setPointerCapture/);
  assert.match(css,/touch-action:none/);
});
