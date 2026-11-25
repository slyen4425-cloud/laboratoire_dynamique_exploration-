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
 // Missing or zero rotation preserves historical serialized settings and rendering.
 const degrees=Number(raw.rotationDeg);
 if(Number.isFinite(degrees)){
  const rotationDeg=((Math.round(degrees)%360)+360)%360;
  if(rotationDeg)next.rotationDeg=rotationDeg;
 }
 return Object.freeze(next);
}
export function worldObjectShadowSettingsEqualV1(a,b){
 const lhs=normalizeWorldObjectShadowSettingsV1(a),rhs=normalizeWorldObjectShadowSettingsV1(b);
 if(!lhs||!rhs)return lhs===rhs;
 return Object.keys(WORLD_OBJECT_SHADOW_DEFAULT_V1).every(key=>lhs[key]===rhs[key])&&
  (lhs.rotationDeg??0)===(rhs.rotationDeg??0);
}


// A model-wide visual profile is keyed by the official rendered asset, never
// by an editor-generated ID. Individual WorldObject overrides win over it.
// WorldDocument owns it while editing a world; standalone Sculpt JSON can
// transport the identical profile format without introducing another renderer.
export const WORLD_OBJECT_SHADOW_PROFILE_LIMIT_V1=512;
export function normalizeWorldObjectShadowProfilesV1(raw){
 if(raw==null)return Object.freeze([]);
 if(!Array.isArray(raw)||raw.length>WORLD_OBJECT_SHADOW_PROFILE_LIMIT_V1)
  throw Error('Profils d\'ombres : liste invalide ou trop longue');
 const used=new Set(),profiles=[];
 for(const item of raw){
  const assetId=typeof item?.assetId==='string'?item.assetId.trim():'';
  if(!assetId||assetId.length>240||used.has(assetId)||item.shadow?.mode!=='custom')
   throw Error('Profil d\'ombre de modèle invalide ou en double');
  used.add(assetId);
  profiles.push(Object.freeze({assetId,
   shadow:normalizeWorldObjectShadowSettingsV1(item.shadow)}));
 }
 return Object.freeze(profiles);
}
export function worldObjectShadowProfileForAssetV1(profiles,assetId){
 if(typeof assetId!=='string'||!assetId)return null;
 return (profiles??[]).find(item=>item.assetId===assetId)?.shadow??null;
}
export function setWorldObjectShadowProfileV1(profiles,assetId,rawShadow){
 if(typeof assetId!=='string'||!assetId.trim()||assetId.length>240)
  throw Error('Sélectionne un modèle officiel avant de régler son ombre');
 const existing=normalizeWorldObjectShadowProfilesV1(profiles);
 const nextShadow=normalizeWorldObjectShadowSettingsV1(rawShadow);
 const previous=worldObjectShadowProfileForAssetV1(existing,assetId);
 if(worldObjectShadowSettingsEqualV1(previous,nextShadow))return existing;
 const next=existing.filter(item=>item.assetId!==assetId);
 if(nextShadow)next.push(Object.freeze({assetId,shadow:nextShadow}));
 return normalizeWorldObjectShadowProfilesV1(next);
}
