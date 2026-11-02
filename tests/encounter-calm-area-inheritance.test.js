import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeWorldArea} from '../src/world/world-area-model.js';
import {createBlankWorldBuilderDraft,updateAreaEncounterOverrides,
  serializeWorldBuilderDraft,importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';
import {resolveTerrainFamilyEncounter} from '../src/encounters/terrain-family-encounter-resolver.js';
import {normalizeTerrainFamilyEncounterConfig} from '../src/encounters/terrain-family-encounter-config.js';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const nativeArea=(encounters={randomEnabled:true})=>normalizeWorldArea({
  id:'forest-zone',kind:'exterior',width:1200,height:800,
  encounters,surface:{baseTerrainFamilyId:'forest'}
});

test('legacy WorldArea inherits the calm WorldDocument policy, no duplicated probabilities',()=>{
  const area=nativeArea();
  assert.equal(area.encounters.checkDistance,null);
  assert.equal(area.encounters.chanceMultiplierPercent,null);
  assert.equal(area.encounters.randomEnabled,true);
});

test('one Area may override its cadence and chance multiplier, all other Areas inherit',()=>{
  const old=createBlankWorldBuilderDraft();
  const a=old.areas[0],b=nativeArea();
  const world={...old,areas:[a,b]};
  const modified=updateAreaEncounterOverrides(world,b.id,{checkDistance:120,chanceMultiplierPercent:175});
  assert.equal(modified.areas[0].encounters.checkDistance??null,null);
  assert.equal(modified.areas[0].encounters.chanceMultiplierPercent??null,null);
  assert.equal(modified.areas[1].encounters.checkDistance,120);
  assert.equal(modified.areas[1].encounters.chanceMultiplierPercent,175);
  assert.deepEqual(old.areas,[a],'authoring does not change original');
  const imported=importWorldBuilderDocument(serializeWorldBuilderDraft(modified));
  assert.equal(imported.areas[1].encounters.checkDistance,120);
  assert.equal(imported.areas[1].encounters.chanceMultiplierPercent,175);
  const inherited=updateAreaEncounterOverrides(modified,b.id,{
    checkDistance:null,chanceMultiplierPercent:null
  });
  assert.equal(inherited.areas[1].encounters.checkDistance??null,null);
  assert.equal(inherited.areas[1].encounters.chanceMultiplierPercent??null,null);
});

test('chance multiplier affects encounter trigger, not allowed elements or creature rarity',()=>{
  const config=normalizeTerrainFamilyEncounterConfig({families:[
    {terrainFamilyId:'forest',encounterChancePercent:10,
      elementChances:[{elementId:'nature',chancePercent:100}]}
  ]});
  const catalog={listCreatures:()=>[{
    id:'beast',elements:['nature'],spawnChance:20
  }]};
  const run=chanceMultiplierPercent=>resolveTerrainFamilyEncounter({
    terrainFamilyId:'forest',config,captureCatalog:catalog,
    chanceMultiplierPercent,random:()=>0.08
  });
  assert.equal(run(100).triggered,true);
  assert.equal(run(50).triggered,false);
  assert.equal(run(200).triggered,true);
});

test('both editors provide world calm preset plus optional per-Area inheritance',()=>{
  for(const [html,word] of [['builder.html','family'],['sculpt-lab.html','sculpt']]){
    const markup=source(html);
    for(const id of [
      word+'-encounter-distance',word+'-encounter-calm-baseline',
      word+'-encounter-area-inherit',word+'-encounter-area-distance',
      word+'-encounter-area-multiplier'
    ])assert.ok(markup.includes('id="'+id+'"'),'Missing true authoring UI: '+id);
  }
  assert.match(source('src/encounters/encounter-controller.js'),/area\.encounters\?\.checkDistance/);
  assert.match(source('src/encounters/terrain-family-encounter-resolver.js'),/chanceMultiplierPercent/);
});
