import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  createBlankWorldBuilderDraft,addWorldArea,connectWorldAreas,
  serializeWorldBuilderDraft,importWorldBuilderDocument
} from '../src/builder/world-builder-draft.js';
import {worldAssemblerRegionOverview} from '../src/builder/world-assembler-region-overview.js';

const sample=()=>{
  let doc=createBlankWorldBuilderDraft({id:'regions-only'});
  doc=addWorldArea(doc,{name:'Neige 1',kind:'exterior'});
  doc=addWorldArea(doc,{name:'Maison neige',kind:'interior'});
  doc=addWorldArea(doc,{name:'Donjon cave',kind:'dungeon'});
  doc=addWorldArea(doc,{name:'Instance à raccorder',kind:'interior'});
  const [start,neige,maison,donjon]=doc.areas;
  doc=connectWorldAreas(doc,{
    sourceAreaId:start.id,targetAreaId:neige.id,returnPortal:true
  });
  doc=connectWorldAreas(doc,{
    sourceAreaId:neige.id,targetAreaId:maison.id,returnPortal:true
  });
  doc=connectWorldAreas(doc,{
    sourceAreaId:maison.id,targetAreaId:donjon.id,returnPortal:true
  });
  return doc;
};

test('world overview shows only real exterior regions and region-to-region arrows',()=>{
  const doc=sample(),before=serializeWorldBuilderDraft(doc);
  const view=worldAssemblerRegionOverview(doc);
  assert.deepEqual(view.regions.map(a=>a.id),doc.areas.slice(0,2).map(a=>a.id));
  assert.equal(view.passages.length,2);
  assert.ok(view.passages.every(p=>
    view.regions.some(a=>a.id===p.sourceAreaId)&&
    view.regions.some(a=>a.id===p.targetAreaId)));
  assert.equal(doc.portals.length,6,'interior and dungeon portals remain real');
  assert.equal(serializeWorldBuilderDraft(doc),before,'projection never writes data');
});

test('linked nested interiors and dungeons stay accessible; only orphan instance is recoverable',()=>{
  const doc=sample(),view=worldAssemblerRegionOverview(doc);
  assert.equal(doc.areas[3].kind,'interior');
  assert.equal(doc.areas[3].siteKind,'dungeon');
  assert.deepEqual(view.orphanInstances.map(a=>a.id),[doc.areas[4].id]);
  assert.ok(doc.portals.some(p=>p.targetAreaId===doc.areas[2].id));
  assert.ok(doc.portals.some(p=>p.targetAreaId===doc.areas[3].id));
  const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(doc));
  assert.deepEqual(restored.areas,doc.areas);
  assert.deepEqual(restored.portals,doc.portals);
  assert.deepEqual(worldAssemblerRegionOverview(restored).passages,view.passages);
});

test('a one-way return Portal does not hide an instance that cannot be entered',()=>{
  let doc=createBlankWorldBuilderDraft({id:'return-only'});
  doc=addWorldArea(doc,{name:'Maison sans entrée',kind:'interior'});
  const [region,inside]=doc.areas;
  doc=connectWorldAreas(doc,{
    sourceAreaId:inside.id,targetAreaId:region.id,returnPortal:false
  });
  const view=worldAssemblerRegionOverview(doc);
  assert.deepEqual(view.orphanInstances.map(a=>a.id),[inside.id]);
  assert.equal(view.passages.length,0);
  assert.equal(doc.portals.length,1);
});

test('screen uses region-only projection for graph, list, and edges without deleting Portal data',()=>{
  const root=new URL('../',import.meta.url);
  const js=readFileSync(new URL('src/builder/world-assembler-main.js',root),'utf8');
  const html=readFileSync(new URL('world-assembler.html',root),'utf8');
  assert.match(js,/import \{worldAssemblerRegionOverview\}/);
  assert.match(js,/const overview=worldAssemblerRegionOverview\(draft\)/);
  assert.match(js,/for\(const area of overview\.regions\)/);
  assert.match(js,/for\(const portal of overview\.passages\)/);
  assert.match(js,/renderAreaContents\(area\)/);
  assert.match(js,/target\?\.kind==='interior'/);
  assert.match(js,/orphanInstances/);
  assert.match(html,/Régions extérieures/);
  assert.doesNotMatch(html,/legend-dot instance/);
});
