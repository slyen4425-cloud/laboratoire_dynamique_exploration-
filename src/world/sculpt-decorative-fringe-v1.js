// One optional WorldArea-owned decorative ring. All relief edits reuse the
// native SculptTerrain brush. Gameplay continues to read WorldArea.width,
// height, boundary and sculptTerrain exclusively.
import {createSculptTerrain,importSculptTerrain,applySculptBrush,applySculptWaterBrush} from './sculpt-height-model.js';
import {normalizeWorldObjectPlacements} from './world-object-placement-model.js';

export const SCULPT_DECORATIVE_FRINGE_SCHEMA='world-area-decorative-fringe-v1';
export const SCULPT_DECORATIVE_FRINGE_CHUNK=8;
export const SCULPT_DECORATIVE_FRINGE_MARGIN=8;
const TILE_W=28,TILE_H=21;
const integer=value=>Number.isSafeInteger(value);
function coreGrid(area){
  const w=Number(area?.width)/TILE_W,h=Number(area?.height)/TILE_H;
  if(!integer(w)||!integer(h)||w<8||h<8||w>80||h>64)
    throw new RangeError('WorldArea exterior dimensions required for decorative fringe');
  return {w,h};
}
export function sculptDecorativeFringeCellIsOuterV1(area,col,row){
  const {w,h}=coreGrid(area),m=SCULPT_DECORATIVE_FRINGE_MARGIN;
  return integer(col)&&integer(row)&&col>=-m&&row>=-m&&col<w+m&&row<h+m&&
    (col<0||row<0||col>=w||row>=h);
}
function validChunkLocation(area,col,row){
  if(!integer(col)||!integer(row)||col%8!==0||row%8!==0)return false;
  const {w,h}=coreGrid(area),m=SCULPT_DECORATIVE_FRINGE_MARGIN;
  return col>=-m&&row>=-m&&col<w+m&&row<h+m&&
    (col<0||row<0||col+8>w||row+8>h);
}
function decorativeObjectIsOuter(area,placement){
  const {w,h}=coreGrid(area),m=SCULPT_DECORATIVE_FRINGE_MARGIN;
  const x=placement.transform.x/TILE_W,y=placement.transform.y/TILE_H;
  return x>=-m&&y>=-m&&x<w+m&&y<h+m&&
    (x<0||y<0||x>=w||y>=h);
}
export function normalizeSculptDecorativeFringeV1(raw,area){
  if(raw===null||raw===undefined)return null;
  if(!raw||raw.schema!==SCULPT_DECORATIVE_FRINGE_SCHEMA||
     !Array.isArray(raw.chunks)||raw.chunks.length>80||
     !Array.isArray(raw.objects)||raw.objects.length>250)
    throw new Error('Decorative fringe is invalid');
  coreGrid(area);
  const seen=new Set();
  const chunks=raw.chunks.map(entry=>{
    const col=entry?.col,row=entry?.row,key=col+':'+row;
    if(!validChunkLocation(area,col,row)||seen.has(key))
      throw new Error('Decorative fringe chunk outside limits or duplicated');
    seen.add(key);
    const terrain=importSculptTerrain(entry.terrain);
    if(terrain.width!==8||terrain.height!==8)
      throw new Error('Decorative fringe chunks must reuse 8x8 native terrain');
    return Object.freeze({col,row,terrain});
  });
  const objects=normalizeWorldObjectPlacements(raw.objects);
  if(objects.length!==raw.objects.length||objects.some(p=>!decorativeObjectIsOuter(area,p)))
    throw new Error('Decorative objects must stay outside the playable area');
  return Object.freeze({
    schema:SCULPT_DECORATIVE_FRINGE_SCHEMA,
    chunks:Object.freeze(chunks),objects:Object.freeze(objects)
  });
}
export function createSculptDecorativeFringeV1(area){
  const {w,h}=coreGrid(area);
  // First enable: reproduce each original edge's relief so the user sees
  // contiguous land, not four unrelated flat cliffs. Core cells are NEVER edited.
  const core=area.sculptTerrain?importSculptTerrain(area.sculptTerrain):
    createSculptTerrain({width:w,height:h});
  const chunks=[];
  for(let row=-8;row<h+8;row+=8)for(let col=-8;col<w+8;col+=8){
    if(!validChunkLocation(area,col,row))continue;
    const levels=[],waterLevels=[],roundness=[];
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){
      const cx=Math.max(0,Math.min(w-1,col+x));
      const cy=Math.max(0,Math.min(h-1,row+y));
      const index=cy*w+cx;
      levels.push(core.levels[index]);
      waterLevels.push(core.waterLevels[index]);
      roundness.push(core.roundness[index]);
    }
    chunks.push({col,row,terrain:createSculptTerrain({
      width:8,height:8,levels,waterLevels,roundness
    })});
  }
  return normalizeSculptDecorativeFringeV1({
    schema:SCULPT_DECORATIVE_FRINGE_SCHEMA,chunks,objects:[]
  },area);
}
export function paintSculptDecorativeFringeV1(raw,area,{col,row,...brush}={}){
  if(!sculptDecorativeFringeCellIsOuterV1(area,col,row))
    throw new RangeError('Fringe editing is only permitted outside playable bounds');
  const fringe=normalizeSculptDecorativeFringeV1(raw,area)??createSculptDecorativeFringeV1(area);
  const chunkCol=Math.floor(col/8)*8,chunkRow=Math.floor(row/8)*8;
  const index=fringe.chunks.findIndex(p=>p.col===chunkCol&&p.row===chunkRow);
  const former=index>=0?fringe.chunks[index].terrain:createSculptTerrain({width:8,height:8});
  const painter=String(brush.mode||'').startsWith('water-')?applySculptWaterBrush:applySculptBrush;
  const terrain=painter(former,{...brush,x:col-chunkCol+.5,y:row-chunkRow+.5});
  if(terrain===former)return fringe;
  const chunks=[...fringe.chunks];
  const changed=Object.freeze({col:chunkCol,row:chunkRow,terrain});
  if(index<0)chunks.push(changed);else chunks[index]=changed;
  return normalizeSculptDecorativeFringeV1({...fringe,chunks},area);
}
export function placeSculptDecorativeFringeObjectV1(raw,area,placement){
  const fringe=normalizeSculptDecorativeFringeV1(raw,area)??createSculptDecorativeFringeV1(area);
  const next=normalizeWorldObjectPlacements([...fringe.objects,placement]);
  if(next.length!==fringe.objects.length+1)
    throw new Error('Decorative object is invalid or duplicated');
  return normalizeSculptDecorativeFringeV1({...fringe,objects:next},area);
}
