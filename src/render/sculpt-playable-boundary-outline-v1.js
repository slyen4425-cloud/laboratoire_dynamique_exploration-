// Pure authoring-time projection of the existing playable terrain extent.
// The decorative 8-cell perimeter is never added to Collision World.
export function sculptPlayableBoundaryOutlineV1(terrain,{
 tileWidth=28,tileHeight=21,rise=8,heightAt
}={}){
 const width=terrain?.width,height=terrain?.height;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
    typeof heightAt!=='function')throw new TypeError('Terrain and height sampler required');
 const pts=[];
 function append(col,row){
   const x=Math.max(0,Math.min(width,col)),y=Math.max(0,Math.min(height,row));
   const level=heightAt(terrain,Math.min(width-1,Math.max(0,Math.floor(x===width?x-1:x))),
     Math.min(height-1,Math.max(0,Math.floor(y===height?y-1:y))));
   pts.push(Object.freeze({x:x*tileWidth,y:y*tileHeight-Math.max(0,level)*rise}));
 }
 for(let x=0;x<=width;x++)append(x,0);
 for(let y=1;y<=height;y++)append(width,y);
 for(let x=width-1;x>=0;x--)append(x,height);
 for(let y=height-1;y>0;y--)append(0,y);
 return Object.freeze(pts);
}
