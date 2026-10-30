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
  from './sculpt-map-preset-library.js?rev=preset-travel-encounters-v2';

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
 'objectdef.building.house.fantasy_wood_stone.01',
 'objectdef.building.inn.golden_thatch_2p5d.01'
]);
const LAYOUT=Object.freeze([
 [3,3],[7,5],[11,3],[16,4],[22,4],[28,3],[33,4],
 [4,9],[8,11],[13,9],[24,9],[29,10],[33,12],
 [3,18],[8,20],[14,20],[21,19],[26,20],[32,19],
 [4,14],[11,16],[28,15],
 [2,2],[5,2],[9,2],[13,2],[18,2],[23,2],[28,2],[32,2],
 [2,22],[6,22],[11,22],[16,22],[21,22],[27,22],[32,22]
]);
const CONFIGS=Object.freeze([
 {name:'Forêt du village · chemin, maison et mare',biome:'forest',
  water:{x:9,y:17,r:3},house:0,road:0,rock:3},
 {name:'Forêt profonde · sentier des anciens',biome:'forest',
  road:1,rock:5,hill:1},
 {name:'Clairière forestière · étang et maisonnette',biome:'forest',
  water:{x:23,y:17,r:2.8},house:2,road:2,rock:2},
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
// Distinct authored settlements and waterside compositions. These are
// deterministic INPUTS to the public Sculpt brush/ObjectDefinition commands,
// never custom WorldAreas, gameplay rules or copied collision/portal models.
// Coordinates use the same 28x21 world units as the editor.
const RICH=Object.freeze([
 {homes:[[0,150,140],[1,335,137],[4,510,132],[2,692,138],[3,853,140],
          [2,148,428],[0,870,426]],
  ponds:[{x:27,y:17,r:2.7}],
  bridge:{x:252,y:357,style:'wood_rustic'},
  waterfall:{x:756,y:357,style:'front_wide',variant:'forest_stream'}},
 {homes:[[3,350,433],[2,858,426]],
  ponds:[{x:28,y:18,r:2.7}],
  waterfall:{x:784,y:378,style:'tiered',variant:'forest_stream'}},
 {homes:[[2,150,136],[0,332,130],[3,510,130],[1,690,134],[4,145,430]],
  ponds:[{x:9,y:17,r:2.6}],
  bridge:{x:644,y:357,style:'stone_arch'},
  waterfall:{x:252,y:357,style:'three_quarter',variant:'turquoise'}},
 {homes:[[0,145,137],[2,500,130],[3,847,135],[1,145,430]],
  ponds:[{x:27,y:17,r:2.5}],
  bridge:{x:756,y:357,style:'old_wood'}},
 {homes:[[3,145,135],[2,335,130],[4,510,132],[0,855,430],[1,145,430]],
  ponds:[{x:27,y:17,r:2.5},{x:9,y:21,r:2.0}],
  bridge:{x:756,y:357,style:'stone_arch'},
  waterfall:{x:252,y:441,style:'side_narrow',variant:'clear_blue'}},
 {homes:[[4,148,135],[0,318,135],[1,493,133],[2,670,135],[3,850,138],
          [0,145,430],[1,858,430]],
  ponds:[{x:27,y:17,r:2.6}],
  bridge:{x:252,y:357,style:'cobblestone'},
  waterfall:{x:756,y:357,style:'front_wide',variant:'clear_blue'}},
 {homes:[[0,150,135],[1,340,130],[2,510,131],[3,855,135],
          [0,145,430],[1,860,430]],
  ponds:[{x:27,y:17,r:2.6},{x:8,y:18,r:2.2}],
  bridge:{x:756,y:357,style:'wood_rustic'},
  waterfall:{x:224,y:378,style:'side_narrow',variant:'forest_stream'}},
 {homes:[[3,315,130],[2,858,130]],
  ponds:[{x:27,y:17,r:2.5},{x:9,y:17,r:2.3}],
  bridge:{x:252,y:357,style:'earth_crossing'},
  waterfall:{x:756,y:357,style:'tiered',variant:'canyon_turquoise'}}
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
 const rich=RICH[index];
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
 for(const pond of rich.ponds)
   terrain=applySculptWaterStroke(terrain,{mode:'water-fill',target:4,
     radius:pond.r,points:[{x:pond.x,y:pond.y}],edgeSoftness:.16});
 const base= config.biome==='snow'?'ground.snow':config.biome==='forest'
   ?'grass.forest':config.biome==='mountain'?'ground.mountain_rock':'ground.dirt';
 let surface=normalizeSculptSurface({...createSculptSurface(),
    baseTerrainFamilyId:config.biome==='snow'?'snow':config.biome==='forest'
      ?'forest':config.biome==='mountain'?'mountain':'plain',
    baseMaterialId:base});
 const points=ROUTES[config.road];
 surface=appendSculptSurfaceStroke(surface,{materialId:'road.dirt',points,width:53});
 // Project to the *existing* main route, never fabricate a new path authority.
 const nearestRoadPoint=(x,y)=>{
   let best=null,bestD=Infinity;
   for(let i=1;i<points.length;i++){
     const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y;
     const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));
     const p={x:a.x+dx*t,y:a.y+dy*t},d=Math.hypot(x-p.x,y-p.y);
     if(d<bestD){best=p;bestD=d;}
   }
   return best;
 };
 const dryLink=(a,b)=>{
   for(let n=0;n<=12;n++){
     const t=n/12,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
     if(sculptWaterAt(terrain,Math.min(35,Math.floor(x/28)),
       Math.min(23,Math.floor(y/21)))>0)return false;
   }
   return true;
 };
 for(const [,x,y] of rich.homes){
   const from={x,y:y+24},to=nearestRoadPoint(x,y+24);
   if(to&&dryLink(from,to))
     surface=appendSculptSurfaceStroke(surface,{materialId:'road.dirt',
       points:[from,to],width:23});
 }
 if(rich.bridge){
   const b=rich.bridge,from=nearestRoadPoint(b.x,b.y-113);
   const bank={x:b.x,y:b.y-112};
   if(from&&dryLink(from,bank))
     surface=appendSculptSurfaceStroke(surface,{materialId:'road.dirt',
       points:[from,bank],width:29});
   const south={x:b.x,y:b.y+113},outer={x:Math.min(WORLD_W-40,b.x+90),y:south.y};
   if(dryLink(south,outer))
     surface=appendSculptSurfaceStroke(surface,{materialId:'road.dirt',
       points:[south,outer],width:26});
 }
 // Additional textured clearing by the home, still the canonical surface.
 // Dedicated forecourts and pedestrian spur paths join the native main road.
 // Surface data remains editable and never creates a second navigation model.
 for(const [kind,x,y] of rich.homes){
   surface=appendSculptSurfaceStroke(surface,{
     materialId:config.biome==='snow'?'ground.snow':'ground.forest_floor',
     terrainFamilyId:config.biome==='snow'?'snow':'plain',width:86,
     points:[{x:x-22,y:y-5},{x:x+22,y:y-5}]});
 }
 const used=[];
 let objects=[];
 function place(id,x,y,scale=.34,rotationDeg=0,variantId=null){
   if(x<35||y<35||x>WORLD_W-35||y>WORLD_H-35)return false;
   if(Math.hypot(x-18.5*28,y-12.5*21)<73)return false; // default Spawn
   // A bridge is the legal water crossing; waterfalls are nonblocking
   // visual decor. Other WorldObjects stay on dry ground.
   const wet=sculptWaterAt(terrain,Math.floor(x/28),Math.floor(y/21))>0;
   if(wet&&!id.startsWith('objectdef.bridge.')&&
      !id.startsWith('objectdef.waterfall.'))return false;
   if(used.some(p=>Math.hypot(p.x-x,p.y-y)<56))return false;
   const next=appendSculptPreviewObject(objects,{definitionId:id,x,y,scale,
     rotationDeg,variantId});
   if(next.length!==objects.length+1)throw Error('Préset : ObjectDefinition rejetée '+id);
   objects=next;used.push({x,y});return true;
 }
 // Authored homes use native building door anchors. Instantiation creates
 // an independent interior WorldArea and reciprocal Portals for EACH house.
 for(const [kind,x,y] of rich.homes)
   if(!place(HOUSES[kind],x,y,.39))
     throw Error('Préset : maison non implantable '+config.name+' '+x+','+y);
 // No fake water decals: a bridge must actually sit over Sculpt water.
 if(rich.bridge){
   const b=rich.bridge;
   if(sculptWaterAt(terrain,Math.floor(b.x/28),Math.floor(b.y/21))<=0)
     throw Error('Préset : pont sans eau '+config.name);
   if(!place('objectdef.bridge.'+b.style+'_2p5d.01',b.x,b.y,1.16,0,'vertical'))
     throw Error('Préset : pont non implantable '+config.name);
 }
 if(rich.waterfall){
   const f=rich.waterfall;
   if(!place('objectdef.waterfall.'+f.style+'.01',f.x,f.y,.33,0,f.variant))
     throw Error('Préset : cascade non implantable '+config.name);
 }
 const treeKinds=TREE[config.biome]??TREE.snow;
 let treeNum=0;
 for(const [col,row] of LAYOUT){
   const x=(col+.5)*28,y=(row+.5)*21;
   // An intentional walking corridor linking the two world edges.
   if(pathClearance(x,y,points)<77)continue;
   if(config.water&&Math.hypot(col-config.water.x,row-config.water.y)<config.water.r+2)continue;
   // Preserve visible yards and collision-free entrance approaches.
   if(rich.homes.some(([,hx,hy])=>Math.hypot(x-hx,y-hy)<115))continue;
   if(rich.bridge&&Math.hypot(x-rich.bridge.x,y-rich.bridge.y)<100)continue;
   if(rich.waterfall&&Math.hypot(x-rich.waterfall.x,y-rich.waterfall.y)<100)continue;
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
