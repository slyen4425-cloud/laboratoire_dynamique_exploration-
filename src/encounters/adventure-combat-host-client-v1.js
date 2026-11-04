// Only a GenSRPG Aventure host may provide the Core receipt. Dispatch on the
// current frame element rather than on a global bus or directly into Core.
const REQUEST_TYPE='gensrpg.capture.v2.adventure-combat-commit.v1';

export function requestAdventureCombatHostV1(frame,sessionId,kind){
  if(!frame)return Promise.reject(new Error('Hôte Aventure absent'));
  return new Promise((resolve,reject)=>{
    const handled=!frame.dispatchEvent(new CustomEvent(REQUEST_TYPE,{
      cancelable:true,
      detail:{sessionId,kind,respond(response){
        if(response?.error)reject(new Error(response.error));
        else resolve(response);
      }}
    }));
    if(!handled)reject(new Error('Hôte Aventure absent'));
  });
}

export function acquireAdventureEncounterLeaseV1(locks,sessionId){
  if(typeof locks?.request!=='function')return Promise.resolve(null);
  return new Promise((resolve,reject)=>{
    locks.request('gensrpg.capture.v2.adventure-encounter:'+sessionId,{ifAvailable:true},lock=>{
      if(!lock){resolve(null);return;}
      return new Promise(release=>resolve(release));
    }).catch(reject);
  });
}
