import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {materialPackV1} from '../src/materials/material-pack-v1.js';
import {resolveMaterialAsset} from '../src/assets/material-asset-adapter.js';
import {SCULPT_SURFACE_MATERIALS,createSculptSurface,appendSculptSurfaceStroke} from '../src/world/sculpt-surface-paint.js';
import {createBlankWorldBuilderDraft,addTerrainFamilyDefinition,updateTerrainFamilyElementChance,updateTerrainFamilyEncounterProfile,serializeWorldBuilderDraft,importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';

const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');

test('two shipped forest grass textures are distinct selectable materials, sharing the canonical forest family',()=>{
  const first=materialPackV1.materials.find(m=>m.id==='grass.forest');
  const second=materialPackV1.materials.find(m=>m.id==='grass.forest.alt');
  assert.ok(first);
  assert.ok(second);
  assert.equal(second.terrainFamilyId,'forest');
  assert.notEqual(first.assets.base,second.assets.base);
  assert.ok(resolveMaterialAsset(first.assets.base));
  assert.ok(resolveMaterialAsset(second.assets.base));
  assert.ok(SCULPT_SURFACE_MATERIALS.some(item=>item.id===second.id&&item.kind==='zone'));
  const painted=appendSculptSurfaceStroke(createSculptSurface(),{
    materialId:second.id,points:[{x:12,y:20},{x:120,y:20}],width:50
  });
  assert.equal(painted.zones[0].terrainFamilyId,'forest');
});

test('high grass family is created through existing World Builder commands and survives the canonical JSON roundtrip',()=>{
  let draft=createBlankWorldBuilderDraft();
  const before=new Set(draft.terrainFamilies.map(f=>f.id));
  draft=addTerrainFamilyDefinition(draft,{label:'Haute herbe',paintKind:'terrain'});
  const created=draft.terrainFamilies.find(f=>!before.has(f.id));
  assert.ok(created?.id);
  assert.equal(created.label,'Haute herbe');
  draft=updateTerrainFamilyElementChance(draft,created.id,'nature',100);
  draft=updateTerrainFamilyEncounterProfile(draft,created.id,{encounterChancePercent:60});
  const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(draft));
  const profile=restored.encounterConfig.families.find(f=>f.terrainFamilyId===created.id);
  assert.equal(profile.encounterChancePercent,60);
  assert.deepEqual(profile.elementChances,[{elementId:'nature',chancePercent:100}]);
});

test('mobile editor groups controls without duplicating IDs or exposing manual family identifiers',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  for(const id of ['sculpt-settings','surface-material','surface-family',
                   'surface-base-family','sculpt-family-create','sculpt-family-template',
                   'sculpt-family-chance','sculpt-encounter-chance',
                   'scene-export','json','sculpt-canvas','material','brush-shape','precision-mode','scenery-fringe-toggle','sculpt-family-kind']){
    assert.equal(ids.filter(value=>value===id).length,1,id);
  }
  assert.ok(html.indexOf('id="sculpt-canvas"')<html.indexOf('id="sculpt-settings"'));
  assert.match(html,/id="sculpt-settings-toggle"/);
  assert.match(html,/#sculpt-settings:not\(\[open\]\)\{display:none!important\}/);
  assert.match(script,/sculptSettingsToggle\.addEventListener\('click'/);
  assert.match(html,/<optgroup label="🌿 Herbe et forêt">/);
  assert.match(html,/<details id="sculpt-family-create-details"/);
  assert.match(html,/body\.sculpt-immersive #sculpt-settings/);
  assert.match(script,/addTerrainFamilyDefinition\(\{/);
  assert.match(script,/\.\.\.sculptWorldDraft,encounterConfig:sculptEncounterConfig/,
    'Adding families must not discard unsaved encounter authoring');
  assert.match(script,/sculptPaintFamilyManuallyChosen/);
});


test('freely named terrain, route and river families remain distinct after WorldDocument serialization',()=>{
  let draft=createBlankWorldBuilderDraft();
  const examples=[
    {label:'Marais luminescent',paintKind:'terrain',elementId:'nature',chance:65},
    {label:'Route des bandits',paintKind:'route',elementId:'fire',chance:30},
    {label:'Rivière enchantée',paintKind:'river',elementId:'water',chance:20}
  ];
  const ids=[];
  for(const example of examples){
    const before=new Set(draft.terrainFamilies.map(f=>f.id));
    draft=addTerrainFamilyDefinition(draft,{label:example.label,paintKind:example.paintKind});
    const family=draft.terrainFamilies.find(f=>!before.has(f.id));
    assert.ok(family?.id,example.label);
    ids.push(family.id);
    draft=updateTerrainFamilyElementChance(draft,family.id,example.elementId,100);
    draft=updateTerrainFamilyEncounterProfile(draft,family.id,{encounterChancePercent:example.chance});
  }
  assert.equal(new Set(ids).size,3,'no reused or manually assigned family identifiers');
  const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(draft));
  for(let i=0;i<examples.length;i++){
    const family=restored.terrainFamilies.find(f=>f.id===ids[i]);
    const profile=restored.encounterConfig.families.find(f=>f.terrainFamilyId===ids[i]);
    assert.equal(family?.label,examples[i].label);
    assert.equal(family?.paintKind,examples[i].paintKind);
    assert.equal(profile?.encounterChancePercent,examples[i].chance);
    assert.deepEqual(profile?.elementChances,[{elementId:examples[i].elementId,chancePercent:100}]);
  }
});

test('one level button pair in current editor, V80 compatibility preserved',()=>{
  const v80=readFileSync(new URL('../sculpt-lab-v80.html',import.meta.url),'utf8');
  for(const id of ['quick-level-plus','quick-level-minus'])
    assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,id);
  assert.doesNotMatch(html,/id="level-(up|down)"/);
  assert.match(html,/id="target"/);
  assert.match(v80,/id="level-up"/);
  assert.match(v80,/id="level-down"/);
  assert.match(script,/\$\('level-up'\)\?\.addEventListener/);
  assert.match(script,/\$\('level-down'\)\?\.addEventListener/);
});

test('custom family type and sole base material control are saved canonically',()=>{
  assert.match(html,/id="sculpt-family-name"[^>]+placeholder="Ex\. Marais/);
  for(const kind of ['terrain','route','river'])assert.match(html,new RegExp('<option value="'+kind+'">'));
  assert.match(script,/surfaceCommit\(normalizeSculptSurface\(\{\.\.\.surface,baseMaterialId:next\},activeSculptMaterialRegistry\(\)\)\)/);
  assert.equal([...html.matchAll(/id="material"/g)].length,1);
});
