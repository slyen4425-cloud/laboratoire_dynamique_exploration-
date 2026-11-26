// Optional canonical world lighting. Absence preserves the historic renderer.
export const WORLD_LIGHTING_DEFAULT_V1=Object.freeze({
 directionDeg:45,shadowColor:'#1a1b3a',shadowOpacityPct:35,flattenPct:40,
 ambientOcclusionPct:25,warmthPct:8,warmColor:'#ffdc9b',
 cloudsEnabled:false,cloudOpacityPct:10,cloudSpeed:12,cloudSize:500,cloudDirectionDeg:45
});
const number=(v,d,min,max)=>Number.isFinite(Number(v))&&v!=null?Math.max(min,Math.min(max,Math.round(Number(v)))):d;
const angle=(v,d)=>Number.isFinite(Number(v))&&v!=null?((Math.round(Number(v))%360)+360)%360:d;
const color=(v,d)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v.toLowerCase():d;
export function normalizeWorldLightingV1(raw){
 if(!raw||typeof raw!=='object'||raw.enabled!==true)return null;
 const d=WORLD_LIGHTING_DEFAULT_V1;
 return Object.freeze({enabled:true,directionDeg:angle(raw.directionDeg,d.directionDeg),
  shadowColor:color(raw.shadowColor,d.shadowColor),
  shadowOpacityPct:number(raw.shadowOpacityPct,d.shadowOpacityPct,0,65),
  flattenPct:number(raw.flattenPct,d.flattenPct,15,100),
  ambientOcclusionPct:number(raw.ambientOcclusionPct,d.ambientOcclusionPct,0,50),
  warmthPct:number(raw.warmthPct,d.warmthPct,0,30),warmColor:color(raw.warmColor,d.warmColor),
  cloudsEnabled:raw.cloudsEnabled===true,
  cloudOpacityPct:number(raw.cloudOpacityPct,d.cloudOpacityPct,0,25),
  cloudSpeed:number(raw.cloudSpeed,d.cloudSpeed,0,60),
  cloudSize:number(raw.cloudSize,d.cloudSize,150,1200),
  cloudDirectionDeg:angle(raw.cloudDirectionDeg,d.cloudDirectionDeg)});
}
// World direction expressed in the object's local mirrored/rotated space.
// Right = 0°, down = 90°. Explicit local exceptions are still authoritative.
export function worldShadowLocalRotationV1(directionDeg,objectAngle,flipX,flatten,shear=-.48){
 const a=directionDeg*Math.PI/180-(Number.isFinite(objectAngle)?objectAngle:0);
 const x=Math.cos(a)*(flipX?-1:1),y=Math.sin(a);
 return Math.atan2(y,x)-Math.atan2(-flatten,-shear);
}
