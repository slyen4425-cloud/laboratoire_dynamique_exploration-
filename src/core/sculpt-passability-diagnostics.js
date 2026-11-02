// Read-only editor diagnostic: every result comes from Collision World's
// isBlocked with the *same* sculptNavigation context as real player walking.
// Samples cell centres; this is NOT a flood-fill, route solver, save, or
// second collision authority. "limited" means some adjacent transition is
// restricted, not that a teleport/spawn is guaranteed.
import {isBlocked} from './collision.js';

export function sculptPassabilityCells({
  world,terrain,collisionContext,tileWidth=28,tileHeight=21,radius=5,
  traversalRegistry
}={}){
  if(!terrain || !world || !(tileWidth>0) || !(tileHeight>0))return Object.freeze([]);
  const width=terrain.width,height=terrain.height;
  const cells=[];
  const walkEntity=(x,y)=>({x,y,radius,locomotion:{modes:['ground']},
    facingX:1,moving:false});
  const center=(col,row)=>({
    x:(col+.5)*tileWidth,y:(row+.5)*tileHeight
  });
  // Phase 1: canonical local contact (WorldArea boundary, walls, objects,
  // surface traversal, water, spherical terrain) at the real hero radius.
  for(let row=0;row<height;row++)for(let col=0;col<width;col++){
    const {x,y}=center(col,row);
    const blocked=isBlocked(world,walkEntity(x,y),x,y,
      traversalRegistry,collisionContext);
    cells.push({col,row,kind:blocked?'blocked':'passable'});
  }
  // Phase 2: sample actual adjacent movement in BOTH directions through the
  // authoritative swept-cell/bridge/stair check. A walkable plateau may be
  // inaccessible from below; an obstacle next door is not such a transition.
  const get=(c,r)=>cells[r*width+c];
  for(const item of cells){
    if(item.kind==='blocked')continue;
    const origin=center(item.col,item.row);
    let traversableNeighbours=0,limited=false;
    for(const [dc,dr] of [[0,-1],[1,0],[0,1],[-1,0]]){
      const c=item.col+dc,r=item.row+dr;
      if(c<0||r<0||c>=width||r>=height||get(c,r).kind==='blocked')continue;
      traversableNeighbours++;
      const target=center(c,r);
      if(isBlocked(world,walkEntity(origin.x,origin.y),target.x,target.y,
          traversalRegistry,collisionContext)||
         isBlocked(world,walkEntity(target.x,target.y),origin.x,origin.y,
          traversalRegistry,collisionContext)){
        limited=true;
      }
    }
    if(limited||traversableNeighbours===0)item.kind='limited';
  }
  return Object.freeze(cells.map(item=>Object.freeze(item)));
}
