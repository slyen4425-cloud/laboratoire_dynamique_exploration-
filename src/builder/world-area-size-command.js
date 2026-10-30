// WorldArea dimension editor adapter. A single pure conversion between the
// existing 2.5D grid units and canonical WorldDocument world coordinates.
// Does not own or persist an alternative size state.
export const WORLD_AREA_TILE_LIMITS=Object.freeze({
  minWidth:8,maxWidth:80,minHeight:8,maxHeight:64,
  tileWidth:28,tileHeight:21
});
export function worldAreaSizeFromTiles({width,height}={}){
  if(width===''||height===''||width===null||height===null||
     width===undefined||height===undefined)
    throw Error('Choisis la taille de la carte en cases');
  const w=Number(width),h=Number(height),rules=WORLD_AREA_TILE_LIMITS;
  if(!Number.isInteger(w)||!Number.isInteger(h)||
     w<rules.minWidth||w>rules.maxWidth||
     h<rules.minHeight||h>rules.maxHeight)
    throw Error('Dimensions invalides : 8–80 × 8–64 cases');
  return Object.freeze({width:w*rules.tileWidth,height:h*rules.tileHeight});
}
