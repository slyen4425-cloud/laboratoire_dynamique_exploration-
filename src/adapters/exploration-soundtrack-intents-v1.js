// Contract-only bridge: Exploration never creates Audio elements or loads
// another laboratory's code. The eventual SoundtrackSession owns playback.
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,159}$/;
function id(value,label) {
  if (typeof value !== "string" || !ID.test(value)) throw new TypeError(label+" must be an identifier");
  return value;
}
export const EXPLORATION_SOUNDTRACK_INTENT_V1 = "exploration-soundtrack-intent-v1";

export function createExplorationSoundtrackIntentsV1({projectId, sceneForArea, battleSceneId}) {
  id(projectId,"projectId");
  id(battleSceneId,"battleSceneId");
  if (typeof sceneForArea !== "function") throw new TypeError("sceneForArea callback required");
  let activeArea = null;
  let restoreScene = null;
  let inBattle = false;
  let serial = 0;
  function intent(sceneId,reason) {
    return Object.freeze({
      schema:EXPLORATION_SOUNDTRACK_INTENT_V1,version:1,projectId,
      sceneId:sceneId===null?null:id(sceneId,"sceneId"),reason
    });
  }
  function enterArea({areaId,terrainFamilyId=null}) {
    if (inBattle) throw new Error("cannot change soundtrack area during battle; defer until return");
    id(areaId,"areaId");
    if (terrainFamilyId!==null) id(terrainFamilyId,"terrainFamilyId");
    const sceneId=sceneForArea({areaId,terrainFamilyId});
    if (sceneId!==null) id(sceneId,"resolved sceneId");
    activeArea={areaId,terrainFamilyId,sceneId};
    return intent(sceneId,"enter-area");
  }
  function beginEncounter(encounterId) {
    id(encounterId,"encounterId");
    if (inBattle) throw new Error("encounter already active");
    if (!activeArea) throw new Error("enter an area before encounter");
    inBattle=true;
    serial++;
    restoreScene=activeArea.sceneId;
    const token=Object.freeze({projectId,encounterId,serial});
    return Object.freeze({intent:intent(battleSceneId,"start-encounter"),returnToken:token});
  }
  function endEncounter(token) {
    if (!inBattle || !token || token.projectId!==projectId ||
        typeof token.encounterId!=="string" || token.serial!==serial) {
      throw new RangeError("unknown or already consumed soundtrack return token");
    }
    inBattle=false;
    const next=intent(restoreScene,"resume-exploration");
    restoreScene=null;
    return next;
  }
  function leaveWorld() {
    serial++;
    inBattle=false;
    activeArea=null;
    restoreScene=null;
    return intent(null,"leave-world");
  }
  return Object.freeze({enterArea,beginEncounter,endEncounter,leaveWorld});
}
