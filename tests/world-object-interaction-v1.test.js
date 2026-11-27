import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWorldObjectInteractionV1 as normalize} from '../src/world/world-object-interaction-v1.js';
import {normalizeWorldObjectPlacement,resolveWorldObjectPlacement} from '../src/world/world-object-placement-model.js';
import {updateSculptPreviewObject,serializeSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
const message={enabled:true,action:'message',label:'Fouiller',message:'La caisse est vide.',radius:64,once:false};
const reward={...message,action:'reward',once:true,currency:10,items:[{itemId:'test-item-reference',quantity:2}]};
test('legacy unchanged and only selected placement carries authored interaction',()=>{
 const catalog={get:id=>id==='fixture'?{id,kind:'decoration',schemaVersion:1,baseSize:{width:32,height:32}}:null};
 const a=normalizeWorldObjectPlacement({id:'fixture-a',objectDefinitionId:'fixture',transform:{x:40,y:50}},0,catalog);
 const b=normalizeWorldObjectPlacement({...a,id:'fixture-b'},1,catalog);
 assert.equal(Object.hasOwn(a.overrides,'interaction'),false);
 const edited=updateSculptPreviewObject([a,b],a.id,{interaction:reward},catalog);
 assert.deepEqual(edited[0].overrides.interaction,normalize(reward));
 assert.deepEqual(edited[1],b);
 assert.deepEqual(resolveWorldObjectPlacement(edited[0],catalog).interaction,normalize(reward));
 const moved=updateSculptPreviewObject(edited,a.id,{x:55,flipX:true},catalog);
 assert.deepEqual(moved[0].overrides.interaction,normalize(reward));
 const disabled=updateSculptPreviewObject(moved,a.id,{interaction:null},catalog);
 assert.equal(Object.hasOwn(disabled[0].overrides,'interaction'),false);
});
test('reward contracts reject repeated grant, duplicate IDs, invalid quantity, and missing action',()=>{
 for(const bad of [{...reward,once:false},{...reward,items:[...reward.items,...reward.items]},{...reward,items:[{itemId:'x',quantity:0}]},{...reward,items:[],currency:0},{...reward,action:'script'},{...message,radius:0}]){
  assert.throws(()=>normalize(bad));
 }
 assert.equal(normalize(null),null);
 assert.deepEqual(normalize(message),message);
});
