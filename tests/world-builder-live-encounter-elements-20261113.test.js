import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectCaptureShowcaseEncounterSourceV1} from '../src/capture/capture-showcase-encounter-source-v1.js';
import {createCaptureCreatureCatalogProvider} from '../src/capture/capture-creature-catalog-provider.js';

const transfer=(id,element)=>({
  schema:'capture-creature-transfer-v1',version:1,
  draft:{id,displayName:id,elements:[element],capture:{spawnChance:25,capturable:true}}
});

test('new and existing published types appear without a second authored Encounter list',()=>{
  const published=projectCaptureShowcaseEncounterSourceV1([
    transfer('snow-creature','ice'),
    transfer('tree-creature','nature'),
    transfer('later-creature','future-element')
  ]);
  const provider=createCaptureCreatureCatalogProvider(published);
  assert.deepEqual(provider.listElements().map(x=>x.id),['future-element','ice','nature']);
  assert.equal(provider.findByElement('ice').length,1);
  assert.equal(provider.findByElement('nature').length,1);
  assert.equal(provider.findByElement('future-element')[0].id,'later-creature');
});

test('World Builder derives encounter options from the same official Combat bundle as Sculpt Tester',()=>{
  const source=readFileSync(new URL('../src/builder/world-builder-main.js',import.meta.url),'utf8');
  const sculpt=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(source,/loadCaptureShowcaseEncounterSourceV1/);
  assert.match(source,/createCaptureCreatureCatalogProvider\(captureSource\)/);
  assert.match(source,/\.listElements\(\)/);
  assert.match(source,/cache: 'no-store'/);
  assert.doesNotMatch(source,/CAPTURE_CREATURE_CATALOG_PREVIEW_V1/);
  assert.match(sculpt,/loadCaptureAuthorEncounterBundleV1/);
  assert.match(sculpt,/projectCaptureShowcaseEncounterSourceV1/);
  assert.match(source,/Catalogue Combat officiel indisponible/);
});
