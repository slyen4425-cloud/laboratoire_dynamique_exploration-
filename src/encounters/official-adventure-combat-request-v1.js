// Exploration owns the Combat bridge; Combat main owns ALL author data and rules.
// One scoped Aventure launch carries an ephemeral cache-isolation token across
// every official JSON/HTML request, including the nested Combat iframe.
// This is not a catalog, version fallback, new service worker, or save owner.
export function officialAdventureCombatRequestV1(url,{
  sessionId=null,loadId=null
}={}){
 const source=new URL(url);
 if(sessionId===null){
  if(loadId!==null)throw new TypeError('No cache isolation token outside Aventure');
  return Object.freeze({url:source.href,init:undefined});
 }
 if(typeof sessionId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(sessionId))
  throw new RangeError('Invalid Adventure session for official Combat transport');
 if(typeof loadId!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(loadId))
  throw new RangeError('Scoped Adventure requires a valid boot UUID');
 source.searchParams.set('_gens_capture_release',loadId);
 return Object.freeze({url:source.href,init:Object.freeze({cache:'no-store'})});
}
