// Canonical interior wall geometry. WorldArea owns the segments; neither
// Canvas artwork nor an editor-side proxy can decide whether a wall is solid.
export const INTERIOR_WALL_LIMIT=96;
const positive=n=>Number.isFinite(n)&&n>=0&&n<=20000;
const point=p=>p&&positive(p.x)&&positive(p.y)
  ?Object.freeze({x:p.x,y:p.y}):null;

export function normalizeInteriorWalls(raw=[]){
  if(!Array.isArray(raw)||raw.length>INTERIOR_WALL_LIMIT)
    throw Error('Murs intérieurs : liste invalide');
  const ids=new Set();
  return Object.freeze(raw.map((item,i)=>{
    const a=point(item?.a),b=point(item?.b);
    const id=typeof item?.id==='string'&&
      /^interior-wall-[a-z0-9-]{1,48}$/.test(item.id)?item.id:null;
    const thickness=Number.isFinite(item?.thickness)?item.thickness:8;
    const height=Number.isFinite(item?.height)?item.height:72;
    if(!a||!b||!id||ids.has(id)||Math.hypot(a.x-b.x,a.y-b.y)<12||
       thickness<4||thickness>28||height<24||height>180)
      throw Error('Murs intérieurs : segment #'+(i+1)+' invalide');
    ids.add(id);
    return Object.freeze({id,a,b,thickness,height});
  }));
}
function projection(point,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;
  const t=l2?Math.max(0,Math.min(1,((point.x-a.x)*dx+
    (point.y-a.y)*dy)/l2)):0;
  return {x:a.x+dx*t,y:a.y+dy*t,t};
}
export function interiorWallDistance(wall,x,y){
  const c=projection({x,y},wall.a,wall.b);
  return Math.hypot(x-c.x,y-c.y);
}
export function interiorWallBlocksCircle(walls=[],x,y,radius=0){
  for(const wall of walls){
    if(interiorWallDistance(wall,x,y)<=wall.thickness*.5+Math.max(0,radius))
      return wall;
  }
  return null;
}
export function appendInteriorWall(raw,{a,b,thickness=8,height=72}={}){
  const walls=normalizeInteriorWalls(raw);
  if(walls.length>=INTERIOR_WALL_LIMIT)throw Error('Maximum de murs atteint');
  const ids=new Set(walls.map(item=>item.id));
  let n=1;while(ids.has('interior-wall-'+n))n++;
  return normalizeInteriorWalls([...walls,{id:'interior-wall-'+n,a,b,thickness,height}]);
}
export function removeInteriorWallNear(raw,x,y,maxDistance=20){
  const walls=normalizeInteriorWalls(raw);
  let closest=null,distance=maxDistance;
  for(const wall of walls){
    const d=interiorWallDistance(wall,x,y);
    if(d<distance){closest=wall;distance=d;}
  }
  return closest?Object.freeze(walls.filter(w=>w.id!==closest.id)):walls;
}
