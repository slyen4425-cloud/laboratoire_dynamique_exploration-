// One optional visual override on the canonical WorldObject placement.
// A missing/null setting keeps the current silhouette projection untouched.
// Percentage dimensions are resolution-independent across PC and mobile.
export const WORLD_OBJECT_SHADOW_DEFAULT_V1=Object.freeze({
 mode:'custom',widthPct:100,heightPct:100,offsetXPct:0,offsetYPct:0,opacityPct:25
});
export const WORLD_OBJECT_SHADOW_LIMITS_V1=Object.freeze({
 widthPct:Object.freeze([50,200]),heightPct:Object.freeze([30,200]),
 offsetXPct:Object.freeze([-60,60]),offsetYPct:Object.freeze([-60,60]),
 opacityPct:Object.freeze([5,65])
});
export function normalizeWorldObjectShadowSettingsV1(raw){
 if(!raw||raw.mode==='auto')return null;
 if(typeof raw!=='object'||Array.isArray(raw)||raw.mode!=='custom')return null;
 const next={mode:'custom'};
 for(const [name,[min,max]] of Object.entries(WORLD_OBJECT_SHADOW_LIMITS_V1)){
  const value=raw[name]===undefined?WORLD_OBJECT_SHADOW_DEFAULT_V1[name]:Number(raw[name]);
  next[name]=Number.isFinite(value)?Math.max(min,Math.min(max,Math.round(value))):
   WORLD_OBJECT_SHADOW_DEFAULT_V1[name];
 }
 return Object.freeze(next);
}
export function worldObjectShadowSettingsEqualV1(a,b){
 const lhs=normalizeWorldObjectShadowSettingsV1(a),rhs=normalizeWorldObjectShadowSettingsV1(b);
 if(!lhs||!rhs)return lhs===rhs;
 return Object.keys(WORLD_OBJECT_SHADOW_DEFAULT_V1).every(key=>lhs[key]===rhs[key]);
}
