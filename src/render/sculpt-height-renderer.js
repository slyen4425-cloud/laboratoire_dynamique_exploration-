// Sculpt lab only. 2.5D projection of a canonical experimental height grid.
// Faces are emitted only where neighboring height levels differ; no placed rock assets.
import {sculptHeightAt,sculptFaces,sculptBrushFootprint,applySculptStroke,applySculptWaterStroke,sculptWaterAt} from '../world/sculpt-height-model.js';
import {paintSculptRockDetails} from './sculpt-rock-detail.js';
import {drawSculptCliffAtlas} from './sculpt-cliff-atlas.js?rev=cliff-depth-v48';
import {sculptRoundedHillRegions,sculptClipRoundedHill} from './sculpt-hill-region-contour.js?rev=sculpt-whole-hill-v61';
export const SCULPT_TILE=Object.freeze({width:28,height:21,rise:18});
export const SCULPT_ROCK_PALETTES=Object.freeze({
  warm:['#bea28c','#947c70','#6c6064','#4b4a56'],
  slate:['#abb4b5','#7d929a','#566a78','#3b4e5d'],
  sandstone:['#d6b68e','#b98e72','#966f61','#745861'],
  dark:['#89878c','#65616e','#494b58','#323843'],
  granite:['#c9c4b9','#a7a39f','#777c7b','#484f51'],
  ochre:['#e3c4a0','#c59673','#96694f','#5f514b']
});
function hash(x,y,z=0){
  let n=Math.imul(x+71,374761393)+Math.imul(y+19,668265263)+Math.imul(z+3,1442695041);
  n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0;
}
function color(colors,x,y,i){return colors[hash(x,y,i)%colors.length];}
// Pure visual fillet: one projected face curves at its corners but does not
// alter a single canonical cell height, neighbor, object or collision.
export function sculptFaceContour({width,height,smoothness=0}={}){
  const softness=Math.max(0,Math.min(1.5,Number(smoothness)||0));
  const corner=Math.min(width*.34,height*.35,13*softness);
  const undulation=Math.min(3.5*softness,height*.13);
  const foot=Math.min(24*softness,height*.40,Math.max(2,width*.17));
  const toe=Math.min(10*softness,height*.17,Math.max(1,width*.09));
  return Object.freeze({corner,undulation,foot,toe});
}
// Pure, read-only lighting cues calculated from canonical terrain elevations.
// The top texture, collision geometry and water model remain untouched.
export function sculptGroundReliefLighting(terrain,col,row){
  if(!terrain||sculptWaterAt(terrain,col,row)>0)
    return Object.freeze({tone:0,contactShadows:Object.freeze([]),exposedEdges:Object.freeze([])});
  const level=sculptHeightAt(terrain,col,row);
  // Shared elevation tint over entire plateaus (no outlines between equal cells).
  const tone=Math.max(-.065,Math.min(.105,(level-2)*.029));
  const contactShadows=[],exposedEdges=[];
  for(const [side,dx,dy] of [['north',0,-1],['east',1,0],['south',0,1],['west',-1,0]]){
    const x=col+dx,y=row+dy;
    if(x<0||y<0||x>=terrain.width||y>=terrain.height||
       sculptWaterAt(terrain,x,y)>0)continue;
    const delta=sculptHeightAt(terrain,x,y)-level;
    if(delta>0)contactShadows.push(Object.freeze({
      side,opacity:Math.min(.37,.19+Math.min(delta,3)*.055)
    }));
    else if(delta<0)exposedEdges.push(side);
  }
  return Object.freeze({tone,
    contactShadows:Object.freeze(contactShadows),
    exposedEdges:Object.freeze(exposedEdges)});
}
function drawSculptGroundReliefLighting(ctx,{terrain,col,row,x,y,w,h}){
  const info=sculptGroundReliefLighting(terrain,col,row);
  if(info.tone!==0){
    ctx.fillStyle=info.tone>0
      ?'rgba(251,243,206,'+info.tone+')'
      :'rgba(15,35,39,'+(-info.tone)+')';
    ctx.fillRect(x,y,w,h);
  }
  for(const {side,opacity} of info.contactShadows){
    const horizontal=side==='west'||side==='east';
    const band=horizontal?w*.30:h*.31;
    const start=side==='east'?(x+w-band):x;
    const top=side==='south'?(y+h-band):y;
    const grad=horizontal
      ?ctx.createLinearGradient(start,0,start+band,0)
      :ctx.createLinearGradient(0,top,0,top+band);
    const dark='rgba(16,31,34,'+opacity+')';
    if(side==='north'||side==='west'){
      grad.addColorStop(0,dark);grad.addColorStop(1,'rgba(16,31,34,0)');
    }else{
      grad.addColorStop(0,'rgba(16,31,34,0)');grad.addColorStop(1,dark);
    }
    ctx.fillStyle=grad;
    if(horizontal)ctx.fillRect(start,y,band,h);
    else ctx.fillRect(x,top,w,band);
  }
  // Dark top lip only along REAL dry height drops. The V36 front (south/east)
  // already worked, but the rear (north) and left (west) were entirely
  // absent. These two missing silhouettes are what blends high grass into
  // background grass when looking down at a hill in the sculpt editor.
  // Stay within each raised tile; never add collision or modify height data.
  if(info.exposedEdges.includes('north')){
    const band=Math.min(5.5,h*.28);
    const rim=ctx.createLinearGradient(0,y,0,y+band);
    rim.addColorStop(0,'rgba(17,30,28,.52)');
    rim.addColorStop(.42,'rgba(19,32,30,.28)');
    rim.addColorStop(1,'rgba(19,32,30,0)');
    ctx.fillStyle=rim;ctx.fillRect(x,y,w,band);
    ctx.fillStyle='rgba(16,28,27,.32)';
    ctx.fillRect(x,y,w,1.3);
  }
  if(info.exposedEdges.includes('west')){
    const band=Math.min(4.5,w*.17);
    const rim=ctx.createLinearGradient(x,0,x+band,0);
    rim.addColorStop(0,'rgba(17,30,28,.46)');
    rim.addColorStop(.45,'rgba(19,32,30,.23)');
    rim.addColorStop(1,'rgba(19,32,30,0)');
    ctx.fillStyle=rim;ctx.fillRect(x,y,band,h);
    ctx.fillStyle='rgba(16,28,27,.30)';
    ctx.fillRect(x,y,1.3,h);
  }
  // Existing front faces and their V36 inner fade stay unchanged.
  if(info.exposedEdges.includes('south')){
    const band=Math.min(4.4,h*.24);
    const rim=ctx.createLinearGradient(0,y+h-band,0,y+h);
    rim.addColorStop(0,'rgba(19,32,30,0)');
    rim.addColorStop(.55,'rgba(19,32,30,.13)');
    rim.addColorStop(1,'rgba(19,32,30,.43)');
    ctx.fillStyle=rim;ctx.fillRect(x,y+h-band,w,band);
    ctx.fillStyle='rgba(16,28,27,.34)';
    ctx.fillRect(x,y+h-1.2,w,1.2);
  }
  if(info.exposedEdges.includes('east')){
    const band=Math.min(3.8,w*.14);
    const rim=ctx.createLinearGradient(x+w-band,0,x+w,0);
    rim.addColorStop(0,'rgba(19,32,30,0)');
    rim.addColorStop(.55,'rgba(19,32,30,.10)');
    rim.addColorStop(1,'rgba(19,32,30,.35)');
    ctx.fillStyle=rim;ctx.fillRect(x+w-band,y,band,h);
    ctx.fillStyle='rgba(16,28,27,.30)';
    ctx.fillRect(x+w-1.2,y,1.2,h);
  }
}

// Exact east-facing cliff strip, without overlap onto the adjacent cell.
export function sculptEastSeamBounds(tile,col,row,upper,lower){
  const {width:w,height:h,rise}=tile;
  const thickness=Math.min(3,w*.11);
  return Object.freeze({x:(col+1)*w-thickness,
    y:row*h-upper*rise+3,
    width:thickness,height:(upper-lower)*rise+h-3});
}
function rockFace(ctx,{x,y,width,height,colors,seed=0,sun=1,smoothness=.72,
  cliffAtlas=null,cliffHD=null,rockPalette='warm',cliffMoss=false}={}){
  if(height<=0)return;
  const {corner,undulation,foot,toe}=sculptFaceContour({width,height,smoothness});
  // V12: the foot now curves OUTWARD into a broad rock toe, rather than
  // a tiny rounded corner at each 28px voxel cell. Faces are rendered as
  // continuous horizontal runs (see drawSculptTerrain).
  ctx.save();
  // Face silhouette must not intrude on a visually walkable neighbor.
  ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();
  ctx.beginPath();ctx.moveTo(x+corner,y);
  ctx.quadraticCurveTo(x+width*.50,y-undulation*.42,x+width-corner,y);
  ctx.quadraticCurveTo(x+width,y,x+width,y+corner);
  ctx.lineTo(x+width,y+height*.72);
  ctx.bezierCurveTo(x+width+toe*.10,y+height*.86,
    x+width+toe,y+height-foot*.43,x+width+toe,y+height-foot*.17);
  ctx.quadraticCurveTo(x+width+toe*.53,y+height+undulation*.48,
    x+width-foot*.72,y+height+undulation*.33);
  ctx.quadraticCurveTo(x+width*.5,y+height+undulation*.75,
    x+foot*.72,y+height+undulation*.25);
  ctx.quadraticCurveTo(x-toe*.52,y+height+undulation*.15,
    x-toe,y+height-foot*.2);
  ctx.bezierCurveTo(x-toe,y+height-foot*.55,
    x-toe*.08,y+height*.84,x,y+height*.72);
  ctx.lineTo(x,y+corner);
  ctx.quadraticCurveTo(x,y,x+corner,y);
  ctx.closePath();
  ctx.clip();
  const gradient=ctx.createLinearGradient(x,y,x,y+height);
  gradient.addColorStop(0,colors[sun===1?0:1]);
  gradient.addColorStop(.20,colors[1]);
  gradient.addColorStop(.72,colors[2]);
  gradient.addColorStop(1,colors[3]);
  ctx.fillStyle=gradient;ctx.fillRect(x-toe-1,y-undulation-1,width+2*toe+2,height+2*undulation+2);
  // Broad mineral planes, softer than the old rectangular one-color extrusion.
  const shift=(hash(seed,91,2)%100)/100;
  const sideGradient=ctx.createLinearGradient(x,y,x+width,y+height*.35);
  sideGradient.addColorStop(0,'rgba(245,227,197,.12)');
  sideGradient.addColorStop(.38+shift*.18,'rgba(245,227,197,.035)');
  sideGradient.addColorStop(1,'rgba(19,30,46,.19)');
  ctx.fillStyle=sideGradient;ctx.fillRect(x,y,width,height);
  // V45: mineral grain and uneven natural facets, clipped to old geometry.
  if(!drawSculptCliffAtlas(ctx,{image:cliffAtlas,hdImage:cliffHD,rockPalette,colors,
    x,y,width,height,seed,moss:cliffMoss}))
    paintSculptRockDetails(ctx,{x,y,width,height,seed,colors});
  const layers=Math.min(5,Math.max(1,Math.floor(height/21)));
  for(let i=0;i<layers;i++){
    const offset=(hash(seed,i,17)%21-10)*.2;
    const lineY=y+height*(i+.42)/layers+offset;
    ctx.beginPath();
    const start=x+width*((hash(seed,i,29)%39)/100);
    const span=width*(.20+(hash(seed,i,31)%39)/100);
    const end=Math.min(x+width-1,start+span);
    ctx.moveTo(start,lineY+2);
    ctx.lineTo(start+span*.31,lineY-1+(hash(seed,i,45)%5));
    ctx.lineTo(start+span*.65,lineY+2-(hash(seed,i,46)%4));
    ctx.lineTo(end,lineY-1);
    ctx.lineWidth=.55+(hash(seed,i,44)%6)*.055;
    ctx.strokeStyle=i%3===0?'rgba(239,214,182,.20)':'rgba(28,36,51,.14)';
    ctx.stroke();
  }
  // Small recessed seams and shaded facets, deterministic per world cell.
  const split=.31+(hash(seed,3,1)%34)/100;
  ctx.beginPath();
  ctx.moveTo(x+width*split,y+6);
  ctx.bezierCurveTo(x+width*(split-.05),y+height*.37,
    x+width*(split+.08),y+height*.61,x+width*(split+.02),y+height*.84);
  ctx.lineWidth=1.1;ctx.strokeStyle='rgba(29,35,49,.22)';ctx.stroke();
  for(let i=0;i<4;i++){
    const p=hash(seed,i,54)%1000/1000;
    ctx.beginPath();
    ctx.arc(x+4+p*Math.max(1,width-8),
      y+height*(.23+((hash(seed,i,57)%60)/100)),.5+((hash(seed,i,58)%8)/12),0,Math.PI*2);
    ctx.fillStyle=i%2?'rgba(233,217,192,.19)':'rgba(42,43,55,.19)';
    ctx.fill();
  }
  ctx.restore();
}
// Optional demonstration ribbons. These are NOT WorldSurface rivers/routes:
// they only test material appearance on the independent heightfield raster.
export const SCULPT_PREVIEW_RIBBONS=Object.freeze({
  water:Object.freeze({materialId:'water.clear_blue',kind:'water',widthCells:2.8}),
  road:Object.freeze({materialId:'road.dirt',kind:'path',widthCells:1.65})
});
export function sculptRibbonY(kind,cellX){
  if(kind==='water')return 12.2+Math.sin(cellX*.32)*2.05+Math.sin(cellX*.81)*.18;
  if(kind==='road')return 3.6+cellX*.16+Math.sin(cellX*.22)*.9;
  return NaN;
}
function drawRibbonCell(ctx,{kind,col,row,x,y,w,h,overlay}){
  if(!overlay?.visible)return false;
  const feature=SCULPT_PREVIEW_RIBBONS[kind];
  const span=feature.widthCells*h;
  const leftY=sculptRibbonY(kind,col-1);
  const middleY=sculptRibbonY(kind,col+.5);
  const rightY=sculptRibbonY(kind,col+2);
  const minY=Math.min(leftY,middleY,rightY)-feature.widthCells*.5-1;
  const maxY=Math.max(leftY,middleY,rightY)+feature.widthCells*.5+1;
  if(row+.5<minY||row+.5>maxY)return false;
  ctx.save();ctx.beginPath();ctx.rect(x,y,w+.6,h+.6);ctx.clip();
  const line=()=>{
    ctx.beginPath();
    for(let step=0;step<=12;step++){
      const sx=x-w+step*(w*3/12);
      const sy=y+(sculptRibbonY(kind,col-1+step*3/12)-row)*h;
      if(step===0)ctx.moveTo(sx,sy);else ctx.lineTo(sx,sy);
    }
  };
  const style=overlay.material?.render??{};
  ctx.lineCap='round';ctx.lineJoin='round';
  line();ctx.lineWidth=span+3;ctx.strokeStyle=
    kind==='water'?(style.outerBankColor??'#507a7b'):(style.outerEdgeColor??'#544536');
  ctx.globalAlpha=.72;ctx.stroke();
  line();ctx.lineWidth=span;ctx.strokeStyle=
    kind==='water'?(style.waterColor??'#39aee5'):(style.centerColor??'#977750');
  ctx.globalAlpha=1;ctx.stroke();
  if(overlay.texture&&typeof ctx.createPattern==='function'){
    const pattern=ctx.createPattern(overlay.texture,'repeat');
    if(pattern?.setTransform&&typeof DOMMatrix!=='undefined')
      pattern.setTransform(new DOMMatrix().scale(.55));
    if(pattern){line();ctx.lineWidth=span*.91;ctx.globalAlpha=.85;ctx.strokeStyle=pattern;ctx.stroke();}
  }
  line();ctx.lineWidth=Math.max(.55,span*.045);ctx.globalAlpha=kind==='water'?.36:.21;
  ctx.strokeStyle=kind==='water'?(style.highlightColor??'#d7f8ff'):(style.highlightColor??'#e9c894');
  ctx.stroke();
  ctx.restore();return true;
}


// Contacts use only the sculpt heightfield's water volume, never pixels.
// No shore effect is drawn against another submerged cell or off-map.
export function sculptWetShoreEdges(terrain,col,row){
  if(sculptWaterAt(terrain,col,row)<=0)return Object.freeze([]);
  const edges=[];
  for(const [side,dx,dy] of [['north',0,-1],['east',1,0],['south',0,1],['west',-1,0]]){
    const x=col+dx,y=row+dy;
    if(x>=0&&y>=0&&x<terrain.width&&y<terrain.height&&
       sculptWaterAt(terrain,x,y)<=0)edges.push(side);
  }
  return Object.freeze(edges);
}
// V46 water smoothing is a MASK inside the author's wet cell, not a
// change to wet-cell geometry. No source of gameplay passability depends on it.
export function sculptWetShoreProfile(terrain,col,row,tile=SCULPT_TILE){
  const edges=sculptWetShoreEdges(terrain,col,row);
  const {width:w,height:h}=tile;
  const radius=Math.min(6.8,w*.245,h*.325);
  const inset=Math.min(1.6,Math.max(.75,h*.058));
  const bend=1.1+((hash(col,row,92)%100)/100)*1.3;
  return Object.freeze({edges,radius,inset,bend});
}
function sculptWetShorePath(ctx,x,y,w,h,profile){
  const edges=profile.edges;
  const n=edges.includes('north'),e=edges.includes('east'),
        s=edges.includes('south'),west=edges.includes('west');
  const {radius,inset,bend}=profile;
  const tl=n&&west?radius:0,tr=n&&e?radius:0,
        br=s&&e?radius:0,bl=s&&west?radius:0;
  const left=x+(west?inset:0),right=x+w-(e?inset:0),
        top=y+(n?inset:0),bottom=y+h-(s?inset:0);
  ctx.beginPath();
  // The four outward dry-facing sides are gently concave; adjacent wet
  // tiles meet exactly at their common edge, avoiding internal gaps.
  ctx.moveTo(x+tl,top);
  ctx.quadraticCurveTo(x+w*.5,top+(n?bend:0),x+w-tr,top);
  if(tr)ctx.quadraticCurveTo(right,top,right,y+tr);
  else ctx.lineTo(right,top);
  ctx.quadraticCurveTo(right-(e?bend:0),y+h*.5,right,y+h-br);
  if(br)ctx.quadraticCurveTo(right,bottom,x+w-br,bottom);
  else ctx.lineTo(right,bottom);
  ctx.quadraticCurveTo(x+w*.5,bottom-(s?bend:0),x+bl,bottom);
  if(bl)ctx.quadraticCurveTo(left,bottom,left,y+h-bl);
  else ctx.lineTo(left,bottom);
  ctx.quadraticCurveTo(left+(west?bend:0),y+h*.5,left,y+tl);
  if(tl)ctx.quadraticCurveTo(left,top,x+tl,top);
  else ctx.lineTo(x,top);
  ctx.closePath();
}
// A wet surface can fall into a LOWER wet surface, but cannot form a
// waterfall wall over dry land. At a dry neighbor the water's terminus is a
// shore; painting a vertical water slab there caused V32 blue rectangles.
export function sculptWaterSouthDrop(terrain,col,row){
  if(!terrain||row<0||col<0||col>=terrain.width||row>=terrain.height-1)return 0;
  if(sculptWaterAt(terrain,col,row)<=0 ||
     sculptWaterAt(terrain,col,row+1)<=0)return 0;
  const i=row*terrain.width+col;
  return Math.max(0,terrain.waterLevels[i]-terrain.waterLevels[i+terrain.width]);
}
// Draw the native full-width cliff-toe run only over DRY cells in front
// of the rock. A previously deferred toe rendered over a lake creates
// dark floating rock islands disconnected from the wall.
export function sculptRockToeSegments(terrain,row,from,to){
  const segments=[];let start=null;
  for(let c=from;c<=to;c++){
    const wet=c<to&&(sculptWaterAt(terrain,c,row)>0||
      (row+1<terrain.height&&sculptWaterAt(terrain,c,row+1)>0));
    if(c<to&&!wet&&start===null)start=c;
    if((wet||c===to)&&start!==null){
      segments.push(Object.freeze({from:start,to:c}));
      start=null;
    }
  }
  return Object.freeze(segments);
}
function drawSculptShoreFoam(ctx,{terrain,col,row,x,y,w,h,rim}){
  const edges=sculptWetShoreEdges(terrain,col,row);
  if(!edges.length)return;
  const phase=(hash(col,row,83)%100)/100;
  const jitter=(hash(col,row,84)%5-2)*.18;
  ctx.save();
  sculptWetShorePath(ctx,x,y,w,h,sculptWetShoreProfile(terrain,col,row,{width:w,height:h}));
  ctx.clip();
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const edge of edges){
    // Overlay only within the water tile, softly break the straight edge
    // with a shallow shoreline wave; preserve the real cell geometry.
    let a,b,c,d;
    if(edge==='north'){a=[x-.8,y+1.8];b=[x+w/2,y+2.9+jitter];c=[x+w+.8,y+1.8];d=[0,1];}
    else if(edge==='south'){a=[x-.8,y+h-1.8];b=[x+w/2,y+h-2.9-jitter];c=[x+w+.8,y+h-1.8];d=[0,-1];}
    else if(edge==='west'){a=[x+1.8,y-.8];b=[x+2.9+jitter,y+h/2];c=[x+1.8,y+h+.8];d=[1,0];}
    else {a=[x+w-1.8,y-.8];b=[x+w-2.9-jitter,y+h/2];c=[x+w-1.8,y+h+.8];d=[-1,0];}
    ctx.beginPath();ctx.moveTo(...a);ctx.quadraticCurveTo(...b,...c);
    ctx.globalAlpha=.27;ctx.strokeStyle=rim;ctx.lineWidth=4.2;ctx.stroke();
    ctx.globalAlpha=.58;ctx.lineWidth=1.4;ctx.stroke();
    // A small second broken froth arc adds sparkle without a solid outline.
    ctx.beginPath();
    const dotT=.26+phase*.45;
    const px=a[0]+(c[0]-a[0])*dotT,py=a[1]+(c[1]-a[1])*dotT;
    ctx.moveTo(px,py);ctx.lineTo(px+d[0]*1.6,py+d[1]*1.6);
    ctx.globalAlpha=.45;ctx.lineWidth=1;ctx.stroke();
  }
  ctx.restore();
}

// Render a volume of water per authored surface cell. Actual submerged depth
// is the difference between water surface elevation and land elevation.
// One cell can dry out after raising its ground without deleting water data.
function drawWaterVolume(ctx,{terrain,overlay,tile,rowStart=0,rowEnd=terrain.height}){
  if(!overlay?.visible||!terrain?.waterLevels)return 0;
  const {width:w,height:h,rise}=tile;
  const style=overlay.material?.render??{};
  let count=0;
  const water=style.waterColor??'#39aee5';
  const rim=style.highlightColor??'#d7f8ff';
  const pattern=overlay.texture&&ctx.createPattern?.(overlay.texture,'repeat');
  if(pattern?.setTransform&&typeof DOMMatrix!=='undefined')pattern.setTransform(new DOMMatrix().scale(.55));
  for(let row=rowStart;row<rowEnd;row++)for(let col=0;col<terrain.width;col++){
    const depth=sculptWaterAt(terrain,col,row);
    if(!depth)continue;
    count++;
    const surface=terrain.waterLevels[row*terrain.width+col];
    const x=col*w,y=row*h-surface*rise;
    const eastDepth=sculptWaterAt(terrain,col+1,row);
    // Compare WATER surfaces only, never the elevation of a dry south cell.
    // A dry neighbor is an ordinary shore with foam, not a blue falling wall.
    const visibleWall=sculptWaterSouthDrop(terrain,col,row)*rise;
    // Water surface, optionally textured from the canonical Material Registry.
    ctx.save();
    const shore=sculptWetShoreProfile(terrain,col,row,tile);
    if(shore.edges.length){
      sculptWetShorePath(ctx,x,y,w,h,shore);
      ctx.clip();
    }
    ctx.globalAlpha=.94;ctx.fillStyle=water;ctx.fillRect(x,y,w+.65,h+.65);
    if(pattern){ctx.globalAlpha=.52;ctx.fillStyle=pattern;ctx.fillRect(x,y,w+.65,h+.65);}
    ctx.globalAlpha=.28;ctx.strokeStyle=rim;ctx.lineWidth=.75;
    ctx.beginPath();ctx.moveTo(x+3,y+h*.45);ctx.bezierCurveTo(x+w*.38,y+h*.32,
      x+w*.61,y+h*.60,x+w-3,y+h*.41);ctx.stroke();
    ctx.restore();
    drawSculptShoreFoam(ctx,{terrain,col,row,x,y,w,h,rim});
    if(visibleWall>0){
      const grad=ctx.createLinearGradient(x,y+h,x,y+h+visibleWall);
      grad.addColorStop(0,'rgba(107,217,240,.83)');
      grad.addColorStop(.65,'rgba(39,142,185,.83)');
      grad.addColorStop(1,'rgba(19,83,130,.64)');
      ctx.fillStyle=grad;
      ctx.fillRect(x,y+h,w+.7,visibleWall);
      ctx.fillStyle='rgba(226,252,250,.42)';
      ctx.fillRect(x,y+h,w,.85);
    }
    if(col<terrain.width-1 && surface>
      (eastDepth?terrain.waterLevels[row*terrain.width+col+1]:sculptHeightAt(terrain,col+1,row))){
      ctx.fillStyle='rgba(24,91,139,.44)';
      ctx.fillRect(x+w-2,y+h,3,Math.max(2,Math.min(depth*rise,6)));
    }
  }
  return count;
}
// Preview uses the EXACT same footprint weights as applySculptStroke.
// Each tinted tile is a cell that a click here would really affect.
export function drawSculptBrushPreview(ctx,{terrain,points=[],radius=3,edgeSoftness=0,
  mode='dig',target=3,strength=1,shape='circle',rockRoundness=null,tile=SCULPT_TILE,zoom=1}={}){
  if(!ctx||!terrain||!points.length)return Object.freeze({cells:0,centerHeight:null});
  const marks=sculptBrushFootprint(terrain,{points,radius,edgeSoftness,mode,shape});
  const waterMode=mode.startsWith('water-');
  const candidate=waterMode
    ?applySculptWaterStroke(terrain,{points,radius,edgeSoftness,mode,target,strength,shape})
    :applySculptStroke(terrain,{points,radius,edgeSoftness,mode,target,strength,shape,rockRoundness});
  const w=tile.width,h=tile.height,rise=tile.rise;
  const tint=mode.startsWith('water-')?'#6be9ff':mode==='dig'?'#ffc181':mode==='raise'?'#9ee2ff':
    mode==='plateau'?'#b2ffb0':mode==='cliff-round'?'#ffdbaa':'#f4e6ba';
  ctx.save();
  for(const m of marks){
    const level=sculptHeightAt(terrain,m.x,m.y);
    const profileMode=mode==='cliff-round',mi=m.y*terrain.width+m.x;
    const next=profileMode?candidate.roundness[mi]:waterMode?sculptWaterAt(candidate,m.x,m.y):sculptHeightAt(candidate,m.x,m.y);
    const before=profileMode?terrain.roundness[mi]:waterMode?sculptWaterAt(terrain,m.x,m.y):level;
    const x=m.x*w,y=m.y*h-level*rise;
    ctx.globalAlpha=.12+.29*m.weight;
    ctx.fillStyle=tint;ctx.fillRect(x+.7,y+.7,w-1.4,h-1.4);
    ctx.globalAlpha=.30+.50*m.weight;
    ctx.strokeStyle=next!==before?'#f5ffff':'#d1d9dd';
    ctx.lineWidth=Math.max(.65,1/Math.max(.32,zoom));
    ctx.strokeRect(x+.9,y+.9,w-1.8,h-1.8);
  }
  const head=points[points.length-1];
  const cx=Math.floor(head.x),cy=Math.floor(head.y);
  const centerLevel=sculptHeightAt(terrain,cx,cy);
  const after=mode==='cliff-round'&&cx>=0&&cy>=0&&cx<terrain.width&&cy<terrain.height
    ?candidate.roundness[cy*terrain.width+cx]:waterMode?sculptWaterAt(candidate,cx,cy):sculptHeightAt(candidate,cx,cy);
  if(cx>=0&&cy>=0&&cx<terrain.width&&cy<terrain.height){
    const px=(cx+.5)*w,py=(cy+.5)*h-centerLevel*rise;
    ctx.globalAlpha=1;ctx.strokeStyle='#fff';ctx.lineWidth=1.5/Math.max(.32,zoom);
    ctx.beginPath();ctx.moveTo(px-6,py);ctx.lineTo(px+6,py);
    ctx.moveTo(px,py-6);ctx.lineTo(px,py+6);ctx.stroke();
    const label=mode==='cliff-round'?'Arrondi '+after+' %':waterMode?'Eau '+after+' blocs':
      mode==='plateau'?'Niveau '+after:centerLevel+' → '+after;
    ctx.font='bold 12px system-ui,sans-serif';
    const labelW=ctx.measureText(label).width+18;
    const lx=Math.max(2,Math.min(terrain.width*w-labelW-2,px+10));
    const ly=py-56/Math.max(.7,zoom);
    ctx.fillStyle='rgba(15,31,42,.93)';ctx.fillRect(lx,ly-17,labelW,23);
    ctx.fillStyle='#f6fff9';ctx.fillText(label,lx+9,ly-1);
  }
  ctx.restore();
  return Object.freeze({cells:marks.length,centerHeight:after});
}
// Canonical WorldSurface strokes are rasterized on top of sculpt terrain.
function sculptPaintByCell(ctx,terrain,tile,surface,paintImages){
  if(!surface||!paintImages)return ()=>0;
  const features=[...(surface.zones??[]),...(surface.routes??[])];
  if(!features.length)return ()=>0;
  const {width:w,height:h,rise}=tile;
  const buckets=new Array(terrain.width*terrain.height);
  const patterns=new Map();
  for(const feature of features){
    const img=paintImages.get(feature.materialId);
    if(!img?.naturalWidth)continue;
    if(!patterns.has(feature.materialId)){
      const pattern=ctx.createPattern(img,'repeat');
      if(pattern?.setTransform&&typeof DOMMatrix!=='undefined')
        pattern.setTransform(new DOMMatrix().scale(.55));
      patterns.set(feature.materialId,pattern);
    }
    if(!patterns.get(feature.materialId))continue;
    const reach=feature.width/2+6;
    const xs=feature.points.map(p=>p.x),ys=feature.points.map(p=>p.y);
    const minx=Math.max(0,Math.floor((Math.min(...xs)-reach)/w));
    const maxx=Math.min(terrain.width-1,Math.floor((Math.max(...xs)+reach)/w));
    const miny=Math.max(0,Math.floor((Math.min(...ys)-reach)/h));
    const maxy=Math.min(terrain.height-1,Math.floor((Math.max(...ys)+reach)/h));
    for(let row=miny;row<=maxy;row++)for(let col=minx;col<=maxx;col++){
      const i=row*terrain.width+col;
      if(!buckets[i])buckets[i]=[];
      buckets[i].push(feature);
    }
  }
  return (col,row,level,x,y)=>{
    const items=buckets[row*terrain.width+col];
    if(!items?.length)return 0;
    ctx.save();ctx.beginPath();ctx.rect(x,y,w+.65,h+.65);ctx.clip();
    for(const feature of items){
      const pattern=patterns.get(feature.materialId);
      if(!pattern||feature.points.length<2)continue;
      ctx.beginPath();
      ctx.moveTo(feature.points[0].x,feature.points[0].y-level*rise);
      for(let i=1;i<feature.points.length;i++)
        ctx.lineTo(feature.points[i].x,feature.points[i].y-level*rise);
      ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=pattern;
      ctx.lineWidth=feature.width+6;ctx.globalAlpha=.20;ctx.stroke();
      ctx.lineWidth=feature.width;ctx.globalAlpha=.95;ctx.stroke();
    }
    ctx.restore();return items.length;
  };
}

// V54: same per-cell authored visual profile now also rounds the GRASS
// shoulder of a convex hill. The canonical height-grid and the unedited
// 95 % cells stay byte-for-byte/pixel-for-pixel on their old paint path.
export function sculptHillTopProfile(terrain,col,row,tile=SCULPT_TILE){
  if(!terrain||!Array.isArray(terrain.roundness)||col<0||row<0||
     col>=terrain.width||row>=terrain.height||sculptWaterAt(terrain,col,row)>0)
    return Object.freeze({radius:0,corners:Object.freeze([])});
  const i=row*terrain.width+col,amount=terrain.roundness[i];
  // Reversibility: 95 is the published V50 default and is not an opt-in.
  if(amount<=95)return Object.freeze({radius:0,corners:Object.freeze([])});
  const level=terrain.levels[i];
  const exposed=(dx,dy)=>{
    const x=col+dx,y=row+dy;
    return x>=0&&y>=0&&x<terrain.width&&y<terrain.height&&
      sculptWaterAt(terrain,x,y)===0&&sculptHeightAt(terrain,x,y)<level;
  };
  const n=exposed(0,-1),e=exposed(1,0),s=exposed(0,1),w=exposed(-1,0);
  const corners=Object.freeze([n&&w,n&&e,s&&e,s&&w]);
  if(!corners.some(Boolean))return Object.freeze({radius:0,corners});
  const amountNormalized=(amount-95)/55;
  const radius=Math.min(tile.width*.60,tile.height*.76)*amountNormalized;
  return Object.freeze({radius,corners});
}
function sculptHillTopPath(ctx,x,y,w,h,{radius,corners}){
  const radii=corners.map(active=>active?radius:0);
  // A larger V59 radius must not make opposing corner arcs overlap within
  // the same cell (e.g. a thin strip one tile wide).
  for(const [i,j,limit] of [[0,1,w],[1,2,h],[2,3,w],[3,0,h]]){
    if(radii[i]+radii[j]>limit){const factor=limit/(radii[i]+radii[j]);
      radii[i]*=factor;radii[j]*=factor;}
  }
  const [tl,tr,br,bl]=radii;
  ctx.beginPath();ctx.moveTo(x+tl,y);
  ctx.lineTo(x+w-tr,y);
  if(tr)ctx.quadraticCurveTo(x+w,y,x+w,y+tr);
  ctx.lineTo(x+w,y+h-br);
  if(br)ctx.quadraticCurveTo(x+w,y+h,x+w-br,y+h);
  ctx.lineTo(x+bl,y+h);
  if(bl)ctx.quadraticCurveTo(x,y+h,x,y+h-bl);
  ctx.lineTo(x,y+tl);
  if(tl)ctx.quadraticCurveTo(x,y,x+tl,y);
  ctx.closePath();
}
// V59: a textured grass shoulder reaches slightly onto a DRY cliff lip.
// No second heightmap, collision, or walkable ramp is ever created.
export function sculptHillGrassShoulderWidth(terrain,col,row,tile=SCULPT_TILE,orientation='south'){
  if(!terrain||!Array.isArray(terrain.roundness)||col<0||row<0||
     col>=terrain.width||row>=terrain.height)return 0;
  const dx=orientation==='east'?1:0,dy=orientation==='east'?0:1;
  if(col+dx>=terrain.width||row+dy>=terrain.height||
     sculptWaterAt(terrain,col,row)>0||sculptWaterAt(terrain,col+dx,row+dy)>0||
     sculptHeightAt(terrain,col,row)<=sculptHeightAt(terrain,col+dx,row+dy))return 0;
  const intensity=Math.max(0,Math.min(1,(terrain.roundness[row*terrain.width+col]-95)/55));
  return Math.min(tile.width*.36,tile.height*.56)*intensity;
}
function drawSculptGrassShoulder(ctx,{x,y,band,width,pattern,baseColor,vertical=false}){
  if(band<=0)return;
  // Use the SAME grass material pattern as the upper walkable top. Rounded
  // stroke caps soften the tile-step silhouette rather than painting rocks.
  const pad=Math.min(band*.35,width*.28);
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle=pattern??baseColor;ctx.lineWidth=band;
  ctx.beginPath();
  if(vertical){ctx.moveTo(x,y+pad);ctx.lineTo(x,y+width-pad);}
  else{ctx.moveTo(x+pad,y);ctx.lineTo(x+width-pad,y);}
  ctx.stroke();ctx.restore();
}
// V52: visible outside SOUTH edge, derived only from the last canonical row.
// Rock facing never participates in geometry, collision, water or traversal.
// Adjacent equal elevations/profiles are one wall to avoid tiled box seams.
export function sculptOuterSouthCliffRuns(terrain){
  if(!terrain||!Number.isInteger(terrain.width)||!Number.isInteger(terrain.height)||
     terrain.width<1||terrain.height<1)return Object.freeze([]);
  const row=terrain.height-1,runs=[];
  const roundness=Array.isArray(terrain.roundness)?terrain.roundness:null;
  for(let col=0;col<terrain.width;){
    const index=row*terrain.width+col;
    const level=terrain.levels[index];
    if(level<=0||sculptWaterAt(terrain,col,row)>0){col++;continue;}
    const profile=roundness?roundness[index]:95;
    let end=col+1;
    while(end<terrain.width){
      const next=row*terrain.width+end;
      if(terrain.levels[next]!==level||
         (roundness?roundness[next]:95)!==profile||
         sculptWaterAt(terrain,end,row)>0)break;
      end++;
    }
    runs.push(Object.freeze({start:col,end,level,smoothness:profile/100}));
    col=end;
  }
  return Object.freeze(runs);
}

// V53: optical seam continuity is strictly opt-in. Native 95 % profiles
// continue through V50/V52's exact legacy rock-face painter.
export function sculptRoundedSouthColumns(terrain,row){
  if(!terrain||!Array.isArray(terrain.roundness)||row<0||row>=terrain.height-1)
    return Object.freeze([]);
  const width=terrain.width,selected=new Set();
  const dryFace=col=>col>=0&&col<width&&
    sculptHeightAt(terrain,col,row)>sculptHeightAt(terrain,col,row+1)&&
    sculptWaterAt(terrain,col,row)<=0&&sculptWaterAt(terrain,col,row+1)<=0;
  for(let col=0;col<width;col++){
    if(!dryFace(col)||terrain.roundness[row*width+col]===95)continue;
    // Include a single neighbouring dry cliff face: the edited endpoint
    // blends into its neighbour instead of ending in a second square wall.
    for(let n=col-1;n<=col+1;n++)if(dryFace(n))selected.add(n);
  }
  return Object.freeze([...selected].sort((a,b)=>a-b));
}
// Span is proportional to the step and to the actual authored roundness.
// The old rectangle formula saturated for a 28px tile already at 95 %.
export function sculptSouthCliffJointSpan({width=28,delta=0,left=95,right=95}={}){
  const soften=Math.max(0,Math.min(1.5,(Number(left)+Number(right))/200));
  return Math.min(Math.max(0,Number(width))*.46,
    Math.max(0,Math.abs(Number(delta)||0))*.65)*(soften/1.5);
}
// Pure visual mask, never reused for collisions or surface geometry. Both
// top and foot are joined with a cubic fillet between adjacent height spans.
function sculptSouthCliffContinuousPath(ctx,faces,profiles,tile,{capLeft=true,capRight=true}={}){
  const {width:w,height:h,rise}=tile;
  const top=face=>face.y*h-face.upper*rise+h;
  const bottom=face=>face.y*h-face.lower*rise+h;
  const first=faces[0],last=faces[faces.length-1];
  const start=first.x*w,end=(last.x+1)*w;
  const cornerL=capLeft?sculptFaceContour({width:w,height:bottom(first)-top(first),
    smoothness:profiles[0]/100}).corner:0;
  const cornerR=capRight?sculptFaceContour({width:w,height:bottom(last)-top(last),
    smoothness:profiles.at(-1)/100}).corner:0;
  ctx.beginPath();
  ctx.moveTo(start,top(first)+cornerL);
  if(cornerL)ctx.quadraticCurveTo(start,top(first),start+cornerL,top(first));
  else ctx.lineTo(start,top(first));
  for(let i=0;i<faces.length-1;i++){
    const a=faces[i],b=faces[i+1],border=(a.x+1)*w;
    const ay=top(a),by=top(b);
    const span=sculptSouthCliffJointSpan({width:w,delta:by-ay,
      left:profiles[i],right:profiles[i+1]});
    ctx.lineTo(border-span,ay);
    if(span>0)ctx.bezierCurveTo(border-span*.18,ay,
      border+span*.18,by,border+span,by);
    else ctx.lineTo(border,by);
  }
  ctx.lineTo(end-cornerR,top(last));
  if(cornerR)ctx.quadraticCurveTo(end,top(last),end,top(last)+cornerR);
  else ctx.lineTo(end,top(last));
  ctx.lineTo(end,bottom(last)-cornerR);
  if(cornerR)ctx.quadraticCurveTo(end,bottom(last),end-cornerR,bottom(last));
  else ctx.lineTo(end,bottom(last));
  for(let i=faces.length-2;i>=0;i--){
    const a=faces[i],b=faces[i+1],border=(a.x+1)*w;
    const ay=bottom(a),by=bottom(b);
    const span=sculptSouthCliffJointSpan({width:w,delta:ay-by,
      left:profiles[i],right:profiles[i+1]});
    ctx.lineTo(border+span,by);
    if(span>0)ctx.bezierCurveTo(border+span*.18,by,
      border-span*.18,ay,border-span,ay);
    else ctx.lineTo(border,ay);
  }
  ctx.lineTo(start+cornerL,bottom(first));
  if(cornerL)ctx.quadraticCurveTo(start,bottom(first),start,bottom(first)-cornerL);
  else ctx.lineTo(start,bottom(first));
  ctx.closePath();
}
export function drawSculptTerrain(ctx,{terrain,material,texture=null,
  rockPalette='warm',cliffAtlas=null,cliffHD=null,cliffMoss=false,visualSmoothness=.72,
  overlays={},paintSurface=null,paintImages=null,tile=SCULPT_TILE}={}){
  if(!terrain||!ctx)return {faceCount:0};
  const {width:w,height:h,rise}=tile;
  const colors=SCULPT_ROCK_PALETTES[rockPalette]??SCULPT_ROCK_PALETTES.warm;
  const baseColor=material?.render?.baseColor??'#677955';
  const pattern=texture&&typeof ctx.createPattern==='function'
    ?ctx.createPattern(texture,'repeat'):null;
  if(pattern?.setTransform&&typeof DOMMatrix!=='undefined')
    pattern.setTransform(new DOMMatrix().scale(.55));
  const totalWidth=terrain.width*w,totalHeight=terrain.height*h;
  ctx.fillStyle=baseColor;ctx.fillRect(0,0,totalWidth,totalHeight);
  const faces=sculptFaces(terrain);
  const south=new Map(),east=new Map();
  for(const face of faces)(face.orientation==='south'?south:east).set(face.y*terrain.width+face.x,face);
  let waterCells=0,roadCells=0,faceRuns=0;
  const hasProfiles=Array.isArray(terrain.roundness);
  const roundedHillRegions=sculptRoundedHillRegions(terrain);
  const drawPaint=sculptPaintByCell(ctx,terrain,tile,paintSurface,paintImages);
  let paintedCells=0;
  const deferredToes=[];
  for(let row=0;row<terrain.height;row++){
    // Draw all top surfaces of a row first, then contiguous wall runs.
    // A 6-cell cliff has one curved foot, not six square block bottoms.
    for(let col=0;col<terrain.width;col++){
      const idx=row*terrain.width+col,level=terrain.levels[idx];
      const x=col*w,y=row*h-level*rise;
      const roundedHill=roundedHillRegions.get(idx);
      const hill=roundedHill?{radius:0}:sculptHillTopProfile(terrain,col,row,tile);
      if(roundedHill){
        ctx.fillStyle=colors[1];ctx.fillRect(x,y,w+.6,h+.6);
        ctx.save();sculptClipRoundedHill(ctx,roundedHill,tile);
      }else if(hill.radius>0){
        // When grass rounds back, expose the mineral shoulder below it,
        // rather than a transparent black corner or a second level of land.
        ctx.fillStyle=colors[1];ctx.fillRect(x,y,w+.6,h+.6);
        ctx.save();sculptHillTopPath(ctx,x,y,w,h,hill);ctx.clip();
      }
      ctx.fillStyle=pattern??baseColor;ctx.fillRect(x,y,w+.6,h+.6);
      ctx.fillStyle=color(['rgba(255,255,255,.035)','rgba(0,0,0,.025)',
        'rgba(0,0,0,.01)'],col,row,2);
      ctx.fillRect(x,y,w,h);
      if(level>0){
        const variation=hash(col,row,91)%5;
        ctx.fillStyle=variation===0?'rgba(255,245,216,.15)':'rgba(39,49,38,.08)';
        ctx.fillRect(x+((hash(col,row,7)%15)+1),y+4,Math.max(2,w*.24),1.5);
      }
      if(drawRibbonCell(ctx,{kind:'road',col,row,x,y,w,h,overlay:overlays.road}))roadCells++;
      paintedCells+=drawPaint(col,row,level,x,y);
      // Height-aware ambient contact shadow on existing land material only.
      drawSculptGroundReliefLighting(ctx,{terrain,col,row,x,y,w,h});
      if(roundedHill)ctx.restore();
      if(hill.radius>0){
        // Thin earthy rim is painted along the curved lip, above the same
        // V50 rock texture, without altering grass outside edited tiles.
        ctx.strokeStyle='rgba(42,50,41,.30)';ctx.lineWidth=1.25;
        sculptHillTopPath(ctx,x,y,w,h,hill);ctx.stroke();ctx.restore();
      }
      const side=east.get(idx);
      if(side){
        rockFace(ctx,{...sculptEastSeamBounds(tile,col,row,side.upper,side.lower),
          colors,seed:idx+54,sun:0,smoothness:hasProfiles?terrain.roundness[idx]/100:visualSmoothness,
          rockPalette,cliffAtlas,cliffHD,cliffMoss});
        const band=sculptHillGrassShoulderWidth(terrain,col,row,tile,'east');
        if(band>0)drawSculptGrassShoulder(ctx,{x:x+w-1,y:y+1,width:h-2,
          band,pattern,baseColor,vertical:true});
      }
    }
    const blendedColumns=new Set(sculptRoundedSouthColumns(terrain,row));
    for(let col=0;col<terrain.width;){
      const idx=row*terrain.width+col,first=south.get(idx);
      if(!first){col++;continue;}
      if(blendedColumns.has(col)){
        let end=col+1;
        while(end<terrain.width&&blendedColumns.has(end)&&
          south.has(row*terrain.width+end))end++;
        const faces=Array.from({length:end-col},(_,i)=>south.get(row*terrain.width+col+i));
        const profiles=faces.map(face=>terrain.roundness[row*terrain.width+face.x]);
        const leftNeighbour=col>0&&south.has(row*terrain.width+col-1);
        const rightNeighbour=end<terrain.width&&south.has(row*terrain.width+end);
        const minTop=Math.min(...faces.map(face=>row*h-face.upper*rise+h));
        const maxBottom=Math.max(...faces.map(face=>row*h-face.lower*rise+h));
        ctx.save();
        sculptSouthCliffContinuousPath(ctx,faces,profiles,tile,
          {capLeft:!leftNeighbour,capRight:!rightNeighbour});
        ctx.clip();
        // Reuse the same HD atlas, palette, cracks and vertical depth shade.
        // The mask is never stored as a second terrain or collision shape.
        rockFace(ctx,{x:col*w,y:minTop,width:(end-col)*w,height:maxBottom-minTop,
          colors,seed:idx,sun:1,smoothness:0,
          rockPalette,cliffAtlas,cliffHD,cliffMoss});
        ctx.restore();
        for(const face of faces){
          const band=sculptHillGrassShoulderWidth(terrain,face.x,row,tile);
          if(band>0)drawSculptGrassShoulder(ctx,{
            x:face.x*w,y:row*h-face.upper*rise+h,width:w,band,pattern,baseColor});
        }
        faceRuns++;col=end;continue;
      }
      let end=col+1;
      while(end<terrain.width){
        const adjacent=south.get(row*terrain.width+end);
        if(!adjacent||blendedColumns.has(end)||
          adjacent.upper!==first.upper||adjacent.lower!==first.lower||
          (hasProfiles&&terrain.roundness[row*terrain.width+end]!==terrain.roundness[idx]))break;
        end++;
      }
      const x=col*w,y=row*h-first.upper*rise+h;
      const width=(end-col)*w,height=(first.upper-first.lower)*rise;
      const runSmoothness=hasProfiles?terrain.roundness[idx]/100:visualSmoothness;
      // Cliff-wide base shade follows the long wall rather than square tiles.
      if(runSmoothness>0){
        ctx.save();ctx.fillStyle='rgba(35,36,45,.16)';
        ctx.beginPath();ctx.ellipse(x+width*.5,y+height+3*runSmoothness,
          width*.46,Math.max(1.5,5*runSmoothness),0,0,Math.PI*2);
        ctx.fill();ctx.restore();
      }
      rockFace(ctx,{x,y,width,height,colors,seed:idx,sun:1,smoothness:runSmoothness,
        rockPalette,cliffAtlas,cliffHD,cliffMoss});
      for(let c=col;c<end;c++){
        const band=sculptHillGrassShoulderWidth(terrain,c,row,tile);
        if(band>0)drawSculptGrassShoulder(ctx,{
          x:c*w,y,width:w,band,pattern,baseColor});
      }
      if(runSmoothness>0){
        ctx.save();
        ctx.strokeStyle='rgba(45,48,48,.18)';ctx.lineWidth=.9;
        ctx.beginPath();ctx.moveTo(x+2,y+1);
        ctx.quadraticCurveTo(x+width*.3,y+runSmoothness*2,
          x+width*.59,y+1);
        ctx.quadraticCurveTo(x+width*.84,y-runSmoothness*1.2,x+width-2,y+1);
        ctx.stroke();ctx.restore();
      }
      deferredToes.push({x,width,bottom:y+height,seed:idx,smoothness:runSmoothness,
         row,from:col,to:end});
      faceRuns++;col=end;
    }
    // Painter order: water belongs to its own absolute-height layer. Paint it
    // before the next (foreground) land row, never over every finished cliff.
    waterCells+=drawWaterVolume(ctx,{terrain,overlay:overlays.water,tile,
      rowStart:row,rowEnd:row+1});
  }

  // Outside-world front rim is a V50 HD cliff, not untextured baseColor.
  // Derive it from the final canonical dry row; no phantom gameplay faces.
  const outerSouthRuns=sculptOuterSouthCliffRuns(terrain);
  for(const run of outerSouthRuns){
    rockFace(ctx,{x:run.start*w,y:totalHeight-run.level*rise,
      width:(run.end-run.start)*w,height:run.level*rise,
      colors,seed:terrain.width*terrain.height+run.start,
      sun:1,smoothness:run.smoothness,rockPalette,cliffAtlas,cliffHD,cliffMoss});
  }
  // The NEXT ground row would otherwise paint over the rounded rock foot.
  // Compositing a slender irregular rock toe AFTER all ground is drawn makes
  // the curved base actually visible against lower dirt, road and water.
  // No pixels are used to decide physics; these are decorative only.
  for(const toe of deferredToes){
    const soften=Math.max(0,Math.min(1.5,Number(toe.smoothness)||0));
    if(soften<=0)continue;
    for(const dry of sculptRockToeSegments(terrain,toe.row,toe.from,toe.to)){
    const x=dry.from*w,width=(dry.to-dry.from)*w,bottom=toe.bottom,seed=toe.seed;
    // Minimize detached-looking bumps over the LOWER dry ground.
    const depth=Math.min(7*soften,Math.max(1.5,width*.05));
    const phase=(hash(seed,27,2)%7-3)*.15;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x+Math.min(4,width*.08),bottom-2);
    ctx.bezierCurveTo(x+width*.19,bottom-3.2*soften,
      x+width*.41,bottom+phase,x+width*.57,bottom-2.2*soften);
    ctx.bezierCurveTo(x+width*.82,bottom-3.3*soften,
      x+width-2,bottom-1.5*soften,x+width-1,bottom+.6*depth);
    ctx.bezierCurveTo(x+width*.84,bottom+depth*.96,
      x+width*.65,bottom+depth*.42,x+width*.49,bottom+depth);
    ctx.bezierCurveTo(x+width*.31,bottom+depth*.52,
      x+width*.12,bottom+depth*.94,x+1,bottom+depth*.52);
    ctx.closePath();
    const gradient=ctx.createLinearGradient(x,bottom-2,x,bottom+depth);
    gradient.addColorStop(0,colors[2]);
    gradient.addColorStop(.45,colors[3]);
    gradient.addColorStop(1,'rgba(44,45,51,0)');
    ctx.fillStyle=gradient;ctx.globalAlpha=.84;ctx.fill();
    ctx.globalAlpha=.40;ctx.strokeStyle=colors[2];
    ctx.lineWidth=.65;ctx.stroke();
    ctx.restore();
    }
  }
  return {faceCount:faces.length,faceRuns,outerCliffRuns:outerSouthRuns.length,waterCells,roadCells,paintedCells,worldWidth:totalWidth,worldHeight:totalHeight};
}
