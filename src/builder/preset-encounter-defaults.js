// New-world initial data only. The WorldDocument owns its encounterConfig
// after creation. The preview demo is a value template, never a runtime owner.
import {demoWorldDocument} from '../world/demo-world.js?rev=terrain-family-palette-editable-v2&speed=terrain-family-speed-editor-v1';

const clone=value=>JSON.parse(JSON.stringify(value));
export function presetEncounterDefaults(terrainFamilyIds=null,previousConfig=null){
  const source=demoWorldDocument.encounterConfig.families;
  const previous=previousConfig?.families??[];
  const ids=terrainFamilyIds??source.map(f=>f.terrainFamilyId);
  return {
    version:1,
    families:ids.map(id=>{
      const user=previous.find(f=>f.terrainFamilyId===id);
      const sample=source.find(f=>f.terrainFamilyId===id);
      return clone(sample??user??{terrainFamilyId:id,encounterChancePercent:0,elementChances:[]});
    })
  };
}

export function encounterConfigNeedsExplicitInitialization(config){
  const rules=config?.families??[];
  // Every profile is empty: distinguish no prior setup from a tuned world
  // via an EXPLICIT user action. The creator can intentionally leave 0%.
  return rules.length===0||rules.every(f=>
    !(Number(f.encounterChancePercent)>0)&&
    !(f.elementChances??[]).some(x=>Number(x.chancePercent)>0));
}
