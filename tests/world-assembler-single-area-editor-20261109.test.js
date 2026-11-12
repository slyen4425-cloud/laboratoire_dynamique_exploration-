import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankWorldBuilderDraft,createWorldBuilderDraft,
  setAreaEncounterLevelRange,serializeWorldBuilderDraft,
  importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';
import {resolveTerrainFamilyEncounter} from '../src/encounters/terrain-family-encounter-resolver.js';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const html=read('world-assembler.html');
const js=read('src/builder/world-assembler-main.js');
const css=read('src/builder/world-assembler.css');
const count=(txt,re)=>(txt.match(re)||[]).length;

test('single Area editor: actual settings relocated to dialog, no duplicate rail or IDs',()=>{
  assert.match(html,/<dialog id="area-details-dialog"[^>]+aria-labelledby="selected-name"/);
  assert.doesNotMatch(html,/<aside class="inspector"/);
  for(const id of ['world-area-encounter-levels','area-encounter-min-level',
    'area-encounter-max-level','connect-form','selected-portals',
    'selected-contents','selected-events','area-add-form','area-kind',
    'remove-area','edit-area','edit-sculpt-area']){
    assert.equal(count(html,new RegExp('id="'+id+'"','g')),1,
      'one official DOM owner for '+id);
  }
  assert.ok(html.indexOf('id="area-add-form"')>html.indexOf('id="area-details-dialog"'));
  assert.ok(html.indexOf('id="world-area-encounter-levels"')>html.indexOf('id="area-details-dialog"'));
  const allIds=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(allIds).size,allIds.length,'duplicate DOM settings ids forbidden');
  assert.match(html,/id="open-selected-area"/);
  assert.match(html,/id="new-world-area"/);
  assert.match(html,/id="close-area-editor"/);
  assert.match(html,/id="area-creation-details"/);
  assert.match(css,/dialog\.area-editor-dialog::backdrop/);
  assert.match(css,/grid-template-columns:250px minmax\(0,1fr\)/);
  assert.doesNotMatch(css,/grid-template-columns:250px minmax\(0,1fr\) 284px/);
});

test('both zone card and list open same dialog, drag does not change gameplay data',()=>{
  assert.match(js,/button\.addEventListener\('click',\(\)=>openAreaDetails\(area\.id\)\)/);
  assert.match(js,/\(\)=>openAreaDetails\(area\.id\)/);
  assert.match(js,/if\(!areaDialog\.open\)areaDialog\.showModal\(\)/);
  assert.match(js,/on\(byId\('close-area-editor'\),'click',\(\)=>areaDialog\.close\(\)\)/);
  assert.match(js,/setWorldAssemblerNodePosition/);
  assert.match(js,/renderAreaEvents\(area\)/);
  assert.match(js,/draft\.events\?\?\[\]/);
  assert.match(js,/objectDefinitionCatalogV1\.get/);
  assert.doesNotMatch(js,/openAreaEditor\('\.\/builder\.html\?worldAssembler=1'\)/);
});

test('encounter chance stays owned by texture; zone level authoring never changes it',()=>{
  const base=createBlankWorldBuilderDraft({id:'texture-chance-owner'});
  const areaId=base.areas[0].id;
  const familyId=base.terrainFamilies[0].id;
  const terrainConfig={...base.encounterConfig,
    families:base.encounterConfig.families.map(f=>({
      ...f,encounterChancePercent:f.terrainFamilyId==='road'?0:
        f.terrainFamilyId===familyId?75:f.encounterChancePercent,
      elementChances:f.terrainFamilyId===familyId
        ?[{elementId:'nature',chancePercent:100}]:f.elementChances
    }))
  };
  const seeded=createWorldBuilderDraft({...base,encounterConfig:terrainConfig});
  const changed=setAreaEncounterLevelRange(seeded,areaId,{minLevel:7,maxLevel:18});
  const saved=importWorldBuilderDocument(serializeWorldBuilderDraft(changed));
  assert.deepEqual(saved.encounterConfig,seeded.encounterConfig);
  assert.deepEqual(saved.areas[0].encounters.minLevel,7);
  assert.deepEqual(saved.areas[0].encounters.maxLevel,18);
  const catalog={listCreatures:()=>[{id:'herbe-creature',spawnChance:100,elements:['nature']}]};
  const chance=resolveTerrainFamilyEncounter({
    terrainFamilyId:familyId,config:saved.encounterConfig,captureCatalog:catalog,
    random:()=>0.3
  });
  assert.equal(chance.triggered,true,'texture still triggers encounters after level edit');
  if(saved.encounterConfig.families.some(f=>f.terrainFamilyId==='road')){
    const road=resolveTerrainFamilyEncounter({
      terrainFamilyId:'road',config:saved.encounterConfig,captureCatalog:catalog,random:()=>0
    });
    assert.equal(road.triggered,false,'safe road stays 0%');
  }
  assert.match(html,/chances de rencontre restent définies/);
  assert.match(html,/par texture de terrain/);
  assert.match(html,/Textures et chances de rencontre \(carte 2,5D\)/);
  // No new WorldArea chance-per-texture object or second terrain encounter writer.
  assert.doesNotMatch(js,/setAreaEncounterChance|updateTerrainFamilyEncounterProfile/);
});

test('battle backdrops use the staged Combat catalog alongside the placed building list',()=>{
  assert.match(html,/select id="area-combat-arena"/);
  assert.match(html,/select id="world-combat-arena"/);
  assert.match(html,/select id="building-combat-arena"/);
  assert.match(js,/import\('\.\.\/\.\.\/combat-preview\/examples\/dom-demo\/demo-assets\.js'\)/);
  assert.match(js,/demoPresentationAssets\.arenaOptions\(\)/);
});
