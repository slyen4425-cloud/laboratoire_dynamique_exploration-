// Official Exploration-only notification that a scoped play navigation
// checkpoint has ALREADY been accepted and persisted. The original navigation
// object is the source of truth: never recompute world coordinates, collide,
// save a second checkpoint, or send network messages from the Lab.
export const EXPLORATION_PLAY_NAVIGATION_COMMITTED_EVENT_V1=
 'gensrpg.exploration.play.navigation-committed.v1';
const KEYS=Object.freeze(['schema','version','worldId','worldFingerprint',
 'sessionId','currentAreaId','x','y']);
function validNavigation(nav){
 if(!nav||typeof nav!=='object'||Array.isArray(nav)||!Object.isFrozen(nav)||
    Object.keys(nav).length!==KEYS.length||
    Object.keys(nav).some(key=>!KEYS.includes(key))||
    nav.schema!=='gensrpg.exploration.play-navigation.v1'||nav.version!==1)
  return false;
 if(typeof nav.sessionId!=='string'||!nav.sessionId||
    typeof nav.worldId!=='string'||!nav.worldId||
    typeof nav.worldFingerprint!=='string'||!nav.worldFingerprint||
    typeof nav.currentAreaId!=='string'||!nav.currentAreaId)
  return false;
 if(!Number.isFinite(nav.x)||!Number.isFinite(nav.y)||nav.x<0||nav.y<0)
  return false;
 return true;
}
export function emitExplorationPlayNavigationCommittedV1({target,navigation}={}){
 // Standalone Builder/Jouer has no GenSrpg-scoped session, so no event.
 if(!validNavigation(navigation))return false;
 const CustomEventCtor=target?.CustomEvent;
 if(typeof target?.dispatchEvent!=='function'||typeof CustomEventCtor!=='function')
  return false;
 const detail=Object.freeze({
  schema:EXPLORATION_PLAY_NAVIGATION_COMMITTED_EVENT_V1,version:1,
  navigation
 });
 target.dispatchEvent(new CustomEventCtor(
  EXPLORATION_PLAY_NAVIGATION_COMMITTED_EVENT_V1,{detail}
 ));
 return true;
}
