import test from "node:test";
import assert from "node:assert/strict";
import {createExplorationSoundtrackIntentsV1,EXPLORATION_SOUNDTRACK_INTENT_V1} from "../../src/adapters/exploration-soundtrack-intents-v1.js";

const setup=(projectId="game-capture")=>createExplorationSoundtrackIntentsV1({
 projectId, battleSceneId:"capture:combat:normal",
 sceneForArea:({areaId,terrainFamilyId})=>"capture:exploration:"+areaId+(terrainFamilyId?":"+terrainFamilyId:"")
});
test("area/biome scene -> encounter -> exact area restore with single-use token",()=>{
  const api=setup();
  const origin=api.enterArea({areaId:"forest",terrainFamilyId:"wood"});
  assert.deepEqual(origin,{schema:EXPLORATION_SOUNDTRACK_INTENT_V1,version:1,projectId:"game-capture",sceneId:"capture:exploration:forest:wood",reason:"enter-area"});
  const change=api.enterArea({areaId:"cave",terrainFamilyId:"stone"});
  assert.equal(change.sceneId,"capture:exploration:cave:stone");
  const battle=api.beginEncounter("enc-1");
  assert.equal(battle.intent.sceneId,"capture:combat:normal");
  assert.equal(api.endEncounter(battle.returnToken).sceneId,change.sceneId);
  assert.throws(()=>api.endEncounter(battle.returnToken));
  assert.equal(api.leaveWorld().sceneId,null);
});
test("independent projects and lifecycle cannot cross-consume tokens",()=>{
  const a=setup("a"),b=setup("b");
  a.enterArea({areaId:"forest"});
  b.enterArea({areaId:"forest"});
  const enc=a.beginEncounter("enc-1");
  assert.throws(()=>b.endEncounter(enc.returnToken));
  assert.throws(()=>a.beginEncounter("enc-2"));
  assert.throws(()=>a.enterArea({areaId:"river"}));
  a.leaveWorld();
  assert.throws(()=>a.endEncounter(enc.returnToken));
});
test("input validation and explicit null scene (silence), no runtime/global state",()=>{
  assert.throws(()=>setup("not valid spaces"));
  const api=createExplorationSoundtrackIntentsV1({
    projectId:"game",battleSceneId:"battle",
    sceneForArea:()=>null
  });
  assert.equal(api.enterArea({areaId:"forest"}).sceneId,null);
  const {returnToken}=api.beginEncounter("e");
  assert.equal(api.endEncounter(returnToken).sceneId,null);
  assert.throws(()=>api.enterArea({areaId:"invalid area"}));
  assert.throws(()=>api.beginEncounter("invalid encounter id"));
});
