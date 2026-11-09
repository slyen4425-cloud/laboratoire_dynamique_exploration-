import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankWorldBuilderDraft,addWorldArea,connectWorldAreas,
  serializeWorldBuilderDraft,importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const html=read('world-assembler.html');
const js=read('src/builder/world-assembler-main.js');
const css=read('src/builder/world-assembler.css');

test('unique native Area dialog has a compact content filter and real Portal navigation',()=>{
  for(const id of ['area-content-filter','selected-neighbor-area','open-neighbor-area']){
    assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1);
    assert.ok(html.indexOf('id="'+id+'"')>html.indexOf('id="area-details-dialog"'));
  }
  assert.match(html,/<option value="dungeon">Donjons<\/option>/);
  assert.match(html,/Destination|Zone reliée par un passage/);
  assert.match(js,/const neighborIds=\[\.\.\.new Set\(draft\.portals\.flatMap/);
  assert.match(js,/portal\.sourceAreaId===area\.id\?\[portal\.targetAreaId\]/);
  assert.match(js,/portal\.targetAreaId===area\.id\?\[portal\.sourceAreaId\]/);
  assert.match(js,/on\(byId\('open-neighbor-area'\),'click'/);
  assert.match(js,/on\(byId\('area-content-filter'\),'change'/);
  assert.match(js,/portal-open-area/);
  assert.match(css,/area-neighbor-nav/);
});

test('filter and navigation are view-only: existing WorldDocument, objects and Portals survive export/import',()=>{
  let original=createBlankWorldBuilderDraft({id:'world-native-content-only'});
  original=addWorldArea(original,{name:'Salle',kind:'interior'});
  original=connectWorldAreas(original,{
    sourceAreaId:original.areas[0].id,
    targetAreaId:original.areas[1].id,returnPortal:true
  });
  const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(original));
  assert.deepEqual(restored.areas,original.areas);
  assert.deepEqual(restored.portals,original.portals);
  assert.deepEqual(restored.events,original.events);
  assert.equal(restored.authoringLayout,original.authoringLayout);
  assert.doesNotMatch(js,/new (WorldDocument|WorldObject|Portal)\(/);
  assert.doesNotMatch(js,/updateAreaObjectOwner|new ObjectDefinitionCatalog/);
  assert.match(js,/if\(!window\.confirm\('Supprimer ce passage existant/);
});
