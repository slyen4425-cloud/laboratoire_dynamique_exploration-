// Visual-only references to existing Material Registry IDs. Compact contiguous
// runs keep large painted maps small; no separate persistence or water geometry.
export const SCULPT_WATER_MATERIAL_IDS=Object.freeze(['water.clear_blue','water.turquoise','water.forest_stream','water.swamp','water.lava']);
export const DEFAULT_SCULPT_WATER_MATERIAL=SCULPT_WATER_MATERIAL_IDS[0];
const valid=new Set(SCULPT_WATER_MATERIAL_IDS);
export const isSculptWaterMaterial=id=>valid.has(id);
export function validSculptWaterMaterialRuns(runs,size){
 if(!Array.isArray(runs)||runs.length>size)return false;
 let end=0;
 for(const run of runs){
  if(!Array.isArray(run)||run.length!==3||!Number.isInteger(run[0])||!Number.isInteger(run[1])||
   run[0]<end||run[1]<1||run[0]+run[1]>size||!valid.has(run[2]))return false;
  end=run[0]+run[1];
 }
 return true;
}
const cache=new WeakMap();
export function sculptWaterMaterialCells(terrain){
 if(cache.has(terrain))return cache.get(terrain);
 const cells=Array(terrain.width*terrain.height).fill(DEFAULT_SCULPT_WATER_MATERIAL);
 for(const [start,length,id] of terrain.waterMaterialRuns??[])cells.fill(id,start,start+length);
 const frozen=Object.freeze(cells);cache.set(terrain,frozen);return frozen;
}
export function compactSculptWaterMaterialCells(cells){
 const runs=[];
 for(let i=0;i<cells.length;){
  const id=cells[i];let end=i+1;
  while(end<cells.length&&cells[end]===id)end++;
  if(valid.has(id)&&id!==DEFAULT_SCULPT_WATER_MATERIAL)runs.push(Object.freeze([i,end-i,id]));
  i=end;
 }
 return Object.freeze(runs);
}
export function normalizeSculptWaterMaterialRuns(runs,size){
 if(!validSculptWaterMaterialRuns(runs,size))return Object.freeze([]);
 const cells=Array(size).fill(DEFAULT_SCULPT_WATER_MATERIAL);
 for(const [start,length,id] of runs)cells.fill(id,start,start+length);
 return compactSculptWaterMaterialCells(cells);
}
