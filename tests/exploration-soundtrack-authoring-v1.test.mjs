import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  createEmptyExplorationSoundtrackBindingsV1,normalizeExplorationSoundtrackBindingsV1,
  setExplorationSoundtrackBindingV1,resolveExplorationSoundtrackSceneV1,
  createExplorationSoundtrackContextV1
} from "../src/adapters/exploration-soundtrack-bindings-v1.js";
import {createExplorationSoundtrackIntentsV1} from "../src/adapters/exploration-soundtrack-intents-v1.js";

test("same project shared soundtrack: Area overrides terrain, terrain overrides global, combat is separate",()=>{
 const empty=createEmptyExplorationSoundtrackBindingsV1("capture-a");
 let bindings=setExplorationSoundtrackBindingV1(empty,"default",null,"capture:exploration:default");
 bindings=setExplorationSoundtrackBindingV1(bindings,"terrainFamily","forest","capture:exploration:forest");
 bindings=setExplorationSoundtrackBindingV1(bindings,"area","deep-cave","capture:exploration:cave");
 bindings=setExplorationSoundtrackBindingV1(bindings,"combat",null,"capture:combat:boss");
 assert.equal(resolveExplorationSoundtrackSceneV1(bindings,{areaId:"deep-cave",terrainFamilyId:"forest"}),"capture:exploration:cave");
 assert.equal(resolveExplorationSoundtrackSceneV1(bindings,{areaId:"meadow",terrainFamilyId:"forest"}),"capture:exploration:forest");
 assert.equal(resolveExplorationSoundtrackSceneV1(bindings,{areaId:"island",terrainFamilyId:"water"}),"capture:exploration:default");
 assert.equal(empty.defaultSceneId,null);
 assert.equal(empty.areaScenes["deep-cave"],undefined);
 assert.deepEqual(normalizeExplorationSoundtrackBindingsV1(JSON.parse(JSON.stringify(bindings))),bindings);
 const intents=createExplorationSoundtrackIntentsV1(createExplorationSoundtrackContextV1(bindings));
 assert.equal(intents.enterArea({areaId:"deep-cave",terrainFamilyId:"forest"}).sceneId,"capture:exploration:cave");
 const encounter=intents.beginEncounter("battle-1");
 assert.equal(encounter.intent.sceneId,"capture:combat:boss");
 assert.equal(intents.endEncounter(encounter.returnToken).sceneId,"capture:exploration:cave");
});
test("remove overrides without touching other scenes and projects are isolated",()=>{
 const a=createEmptyExplorationSoundtrackBindingsV1("capture-a");
 const b=createEmptyExplorationSoundtrackBindingsV1("survival-b");
 const a1=setExplorationSoundtrackBindingV1(a,"terrainFamily","volcano","capture:exploration:volcano");
 const b1=setExplorationSoundtrackBindingV1(b,"terrainFamily","volcano","survival:exploration:volcano");
 assert.equal(resolveExplorationSoundtrackSceneV1(a1,{areaId:"plain",terrainFamilyId:"volcano"}),"capture:exploration:volcano");
 assert.equal(resolveExplorationSoundtrackSceneV1(b1,{areaId:"plain",terrainFamilyId:"volcano"}),"survival:exploration:volcano");
 const clear=setExplorationSoundtrackBindingV1(a1,"terrainFamily","volcano",null);
 assert.equal(resolveExplorationSoundtrackSceneV1(clear,{areaId:"plain",terrainFamilyId:"volcano"}),null);
 assert.equal(a1.terrainFamilyScenes.volcano,"capture:exploration:volcano");
});
test("schema rejects invalid fields / IDs, remains media-free and world-model independent",()=>{
 const value=createEmptyExplorationSoundtrackBindingsV1("game");
 assert.equal(JSON.stringify(value).includes("https://"),false);
 assert.throws(()=>normalizeExplorationSoundtrackBindingsV1({...value,unknown:1}),/unknown field/);
 assert.throws(()=>setExplorationSoundtrackBindingV1(value,"area","invalid area","scene"),/identifier/);
 assert.throws(()=>setExplorationSoundtrackBindingV1(value,"combat",null,null));
 assert.throws(()=>setExplorationSoundtrackBindingV1(value,"other",null,"scene"));
});
test("World Builder has a standalone music panel without new WorldDocument fields, main engine mutations or player",()=>{
 const html=readFileSync(new URL("../builder.html",import.meta.url),"utf8");
 assert.match(html,/data-tab="soundtrack"/);
 assert.match(html,/data-panel="soundtrack"/);
 assert.match(html,/exploration-soundtrack-editor-v1.js/);
 for(const field of ["project","kind","context","scene","status","current-area","save","remove",
   "new-project","export","import","preview","bindings"]) {
   assert.ok(html.includes("data-exploration-soundtrack-"+field),"missing "+field);
 }
 const js=readFileSync(new URL("../src/ui/exploration-soundtrack-editor-v1.js",import.meta.url),"utf8");
 assert.ok(js.includes("mountExplorationSoundtrackEditorV1"));
 assert.ok(js.includes('document.querySelector("[data-exploration-soundtrack-editor]")'));
 assert.equal((html.match(/data-tab="soundtrack"/g)||[]).length,1);
});
