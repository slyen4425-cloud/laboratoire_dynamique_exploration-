// Fixed library of example CARDS, not a world / map authority. Each card
// is assembled once from the exact same public SculptTerrain, SculptSurface,
// Scene and ObjectDefinition commands available to the user editor. The user
// may copy it to any WorldArea; no Portal, Spawn, or Encounter state is saved.
import {createBlankSculptPreviewScene,appendSculptPreviewObject}
  from '../world/sculpt-scene-preview.js';
import {applySculptWaterStroke,applySculptStroke,sculptWaterAt}
  from '../world/sculpt-height-model.js';
import {createSculptSurface,normalizeSculptSurface,appendSculptSurfaceStroke}
  from '../world/sculpt-surface-paint.js';
import {createSculptMapPreset,readSculptMapPresets}
  from './sculpt-map-preset-library.js?rev=edge-gates-v1';

const TREE=Object.freeze({
  forest:['objectdef.tree.forest.oak.01','objectdef.tree.forest.broadleaf.01',
    'objectdef.tree.forest.pine_dense.01','objectdef.tree.fantasy.ancient_twist.01'],
  snow:['objectdef.tree.forest.spruce_tall.01','objectdef.tree.forest.pine_dense.01',
    'objectdef.tree.forest.pine.01'],
  plain:['objectdef.tree.forest.oak.01','objectdef.tree.forest.broadleaf.01']
});
const ROCK=Object.freeze({
  forest:'objectdef.rock.moss.wide_boulder.01',
  snow:'objectdef.rock.gray.round_boulder.01',
  plain:'objectdef.rock.gray.layered_slab.01',
  mountain:'objectdef.rock.gray.tall_spire.01'
});
const HOUSES=Object.freeze([
 'objectdef.building.house.blue_cottage_2p5d.01',
 'objectdef.building.house.red_tile_2p5d.01',
 'objectdef.building.house.green_moss_2p5d.01',
 'objectdef.building.house.fantasy_wood_stone.01'
]);
const LAYOUT=Object.freeze([
 [3,3],[7,5],[11,3],[16,4],[22,4],[28,3],[33,4],
 [4,9],[8,11],[13,9],[24,9],[29,10],[33,12],
 [3,18],[8,20],[14,20],[21,19],[26,20],[32,19],
 [4,14],[11,16],[28,15]
]);
const CONFIGS=Object.freeze([
 {name:'Forêt du village · chemin, maison et mare',biome:'forest',
  water:{x:9,y:17,r:3},house:0,road:0,rock:3},
 {name:'Forêt profonde · sentier des anciens',biome:'forest',
  road:1,rock:5,hill:1},
 {name:'Clairière forestière · étang et maisonnette',biome:'forest',
  water:{x:27,y:17,r:3.6},house:2,road:2,rock:2},
 {name:'Neige · chemin sous les sapins',biome:'snow',
  road:0,rock:4,hill:1},
 {name:'Neige · refuge au col',biome:'snow',
  house:3,road:1,rock:6,hill:1},
 {name:'Plaine · hameau et étang',biome:'plain',
  water:{x:9,y:17,r:3.3},house:1,road:0,rock:1},
 {name:'Campagne · deux fermes et route',biome:'plain',
  house:0,secondHouse:1,road:2,rock:2},
 {name:'Montagne · chemin vers la grotte',biome:'mountain',
  road:0,rock:9,hill:2}
]);
const WORLD_W=36*28,WORLD_H=24*21;
const ROUTES=Object.freeze([
 [{x:4,y:230},{x:245,y:230},{x:487,y:255},{x:749,y:280},{x:WORLD_W-6,y:280}],
 [{x:8,y:410},{x:243,y:347},{x:490,y:255},{x:717,y:199},{x:WORLD_W-8,y:90}],
 [{x:12,y:260},{x:240,y:285},{x:490,y:255},{x:751,y:289},{x:WORLD_W-12,y:321}]
]);
function segmentDistance(px,py,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,q=dx*dx+dy*dy;
 const t=q===0?0:Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/q));
 return Math.hypot(px-a.x-dx*t,py-a.y-dy*t);
}
function pathClearance(x,y,points){
 let result=Infinity;for(let i=1;i<points.length;i++)
   result=Math.min(result,segmentDistance(x,y,points[i-1],points[i]));
 return result;
}
function createScene(config,index){
 const initial=createBlankSculptPreviewScene({width:36,height:24});
 let {terrain}=initial;
 if(config.hill){
   terrain=applySculptStroke(terrain,{mode:'raise',strength:1,radius:3,
     points:[{x:6.5,y:4.5},{x:9.5,y:4.5}],edgeSoftness:.32});
   if(config.hill===2)terrain=applySculptStroke(terrain,{mode:'raise',
      strength:2,radius:4,points:[{x:29,y:6.5},{x:32,y:6.5}],edgeSoftness:.35});
 }
 if(config.water)
   terrain=applySculptWaterStroke(terrain,{mode:'water-fill',target:4,
     radius:config.water.r,points:[{x:config.water.x,y:config.water.y}],
     edgeSoftness:.16});
 const base= config.biome==='snow'?'ground.snow':config.biome==='forest'
   ?'grass.forest':config.biome==='mountain'?'ground.mountain_rock':'ground.dirt';
 let surface=normalizeSculptSurface({...createSculptSurface(),
    baseTerrainFamilyId:config.biome==='snow'?'snow':config.biome==='forest'
      ?'forest':config.biome==='mountain'?'mountain':'plain',
    baseMaterialId:base});
 const points=ROUTES[config.road];
 surface=appendSculptSurfaceStroke(surface,{materialId:'road.dirt',points,width:53});
 // Additional textured clearing by the home, still the canonical surface.
 if(config.house!==undefined){
  surface=appendSculptSurfaceStroke(surface,{materialId:config.biome==='snow'
    ?'ground.snow':'ground.forest_floor',terrainFamilyId:config.biome==='snow'
    ?'snow':'plain',width:130,
    points:[{x:735,y:367},{x:785,y:367}]});
 }
 const used=[];
 let objects=[];
 function place(id,x,y,scale=.34,rotationDeg=0){
   if(x<35||y<35||x>WORLD_W-35||y>WORLD_H-35)return;
   if(Math.hypot(x-18.5*28,y-12.5*21)<73)return; // never block default Spawn
   if(sculptWaterAt(terrain,Math.floor(x/28),Math.floor(y/21))>0)return;
   if(used.some(p=>Math.hypot(p.x-x,p.y-y)<56))return;
   const next=appendSculptPreviewObject(objects,{definitionId:id,x,y,scale,rotationDeg});
   if(next.length!==objects.length+1)throw Error('Préset : ObjectDefinition rejetée '+id);
   objects=next;used.push({x,y});
 }
 if(config.house!==undefined)place(HOUSES[config.house],769,372,.42);
 if(config.secondHouse!==undefined)place(HOUSES[config.secondHouse],238,353,.38);
 const treeKinds=TREE[config.biome]??TREE.snow;
 let treeNum=0;
 for(const [col,row] of LAYOUT){
   const x=(col+.5)*28,y=(row+.5)*21;
   // An intentional walking corridor linking the two world edges.
   if(pathClearance(x,y,points)<77)continue;
   if(config.water&&Math.hypot(col-config.water.x,row-config.water.y)<config.water.r+2)continue;
   // Keep house and its clearing free of crowded foliage.
   if(config.house!==undefined&&Math.hypot(x-769,y-372)<127)continue;
   if(config.secondHouse!==undefined&&Math.hypot(x-238,y-353)<116)continue;
   if(config.biome==='mountain'){
     if(treeNum++%4===0)place('objectdef.tree.forest.pine.01',x,y,.30);
     continue;
   }
   const id=treeKinds[(index+treeNum++)%treeKinds.length];
   place(id,x,y,config.biome==='plain'?.32:.34);
 }
 const rocks=config.rock??0;
 for(let i=0;i<rocks;i++){
   const [col,row]=LAYOUT[(i*5+index*3+2)%LAYOUT.length];
   const x=(col+.5)*28+((i%3)-1)*13,y=(row+.5)*21+((i%2)?10:-8);
   if(pathClearance(x,y,points)<64)continue;
   const rock=config.biome==='mountain'?ROCK.mountain:
     config.biome==='snow'?ROCK.snow:config.biome==='forest'?ROCK.forest:ROCK.plain;
   place(rock,x,y,.33);
 }
 return {terrain,surface,objects,actors:[]};
}
const templates=Object.freeze(CONFIGS.map((cfg,i)=>
 createSculptMapPreset(createScene(cfg,i),{id:'map-preset-'+(101+i),name:cfg.name})));
export function builtinSculptMapPresets(){return templates;}
export function listAvailableSculptMapPresets(storage){
 // User library is independent. No builtin is written to localStorage.
 return Object.freeze([...templates,...readSculptMapPresets(storage)]);
}
