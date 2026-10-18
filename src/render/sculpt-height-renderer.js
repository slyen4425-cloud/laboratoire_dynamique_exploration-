// Sculpt lab only. 2.5D projection of a canonical experimental height grid.
// Faces are emitted only where neighboring height levels differ; no placed rock assets.
import {sculptHeightAt,sculptFaces,sculptBrushFootprint,applySculptStroke,applySculptWaterStroke,sculptWaterAt} from '../world/sculpt-height-model.js';
export const SCULPT_TILE=Object.freeze({width:28,height:21,rise:18});
export const SCULPT_ROCK_PALETTES=Object.freeze({
  warm:['#bea28c','#947c70','#6c6064','#4b4a56'],
  slate:['#abb4b5','#7d929a','#566a78','#3b4e5d'],
  sandstone:['#d6b68e','#b98e72','#966f61','#745861'],
  dark:['#89878c','#65616e','#494b58','#323843']
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
function rockFace(ctx,{x,y,width,height,colors,seed=0,sun=1,smoothness=.72}){
  if(height<=0)return;
  const {corner,undulation,foot,toe}=sculptFaceContour({width,height,smoothness});
  // V12: the foot now curves OUTWARD into a broad rock toe, rather than
  // a tiny rounded corner at each 28px voxel cell. Faces are rendered as
  // continuous horizontal runs (see drawSculptTerrain).
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x+corner,y);
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
  const layers=Math.min(8,Math.max(1,Math.floor(height/13)));
  for(let i=0;i<layers;i++){
    const offset=(hash(seed,i,17)%21-10)*.2;
    const lineY=y+height*(i+.42)/layers+offset;
    ctx.beginPath();
    ctx.moveTo(x+2,lineY+2);
    ctx.bezierCurveTo(x+width*.28,lineY-2,x+width*.7,lineY+2.2,
      x+width-2,lineY-1);
    ctx.lineWidth=.72;
    ctx.strokeStyle=i%3===0?'rgba(239,214,182,.23)':'rgba(28,36,51,.16)';
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
    const southDepth=sculptWaterAt(terrain,col,row+1);
    const eastDepth=sculptWaterAt(terrain,col+1,row);
    const southSurface=southDepth?terrain.waterLevels[(row+1)*terrain.width+col]:
      sculptHeightAt(terrain,col,row+1);
    const visibleWall=Math.max(0,(surface-southSurface)*rise);
    // Water surface, optionally textured from the canonical Material Registry.
    ctx.save();ctx.globalAlpha=.94;ctx.fillStyle=water;ctx.fillRect(x,y,w+.65,h+.65);
    if(pattern){ctx.globalAlpha=.52;ctx.fillStyle=pattern;ctx.fillRect(x,y,w+.65,h+.65);}
    ctx.globalAlpha=.28;ctx.strokeStyle=rim;ctx.lineWidth=.75;
    ctx.beginPath();ctx.moveTo(x+3,y+h*.45);ctx.bezierCurveTo(x+w*.38,y+h*.32,
      x+w*.61,y+h*.60,x+w-3,y+h*.41);ctx.stroke();
    ctx.restore();
    if(visibleWall>0&&row<terrain.height-1){
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
  mode='dig',target=3,strength=1,tile=SCULPT_TILE,zoom=1}={}){
  if(!ctx||!terrain||!points.length)return Object.freeze({cells:0,centerHeight:null});
  const marks=sculptBrushFootprint(terrain,{points,radius,edgeSoftness,mode});
  const waterMode=mode.startsWith('water-');
  const candidate=waterMode
    ?applySculptWaterStroke(terrain,{points,radius,edgeSoftness,mode,target,strength})
    :applySculptStroke(terrain,{points,radius,edgeSoftness,mode,target,strength});
  const w=tile.width,h=tile.height,rise=tile.rise;
  const tint=mode.startsWith('water-')?'#6be9ff':mode==='dig'?'#ffc181':mode==='raise'?'#9ee2ff':
    mode==='plateau'?'#b2ffb0':'#f4e6ba';
  ctx.save();
  for(const m of marks){
    const level=sculptHeightAt(terrain,m.x,m.y);
    const next=waterMode?sculptWaterAt(candidate,m.x,m.y):sculptHeightAt(candidate,m.x,m.y);
    const before=waterMode?sculptWaterAt(terrain,m.x,m.y):level;
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
  const after=waterMode?sculptWaterAt(candidate,cx,cy):sculptHeightAt(candidate,cx,cy);
  if(cx>=0&&cy>=0&&cx<terrain.width&&cy<terrain.height){
    const px=(cx+.5)*w,py=(cy+.5)*h-centerLevel*rise;
    ctx.globalAlpha=1;ctx.strokeStyle='#fff';ctx.lineWidth=1.5/Math.max(.32,zoom);
    ctx.beginPath();ctx.moveTo(px-6,py);ctx.lineTo(px+6,py);
    ctx.moveTo(px,py-6);ctx.lineTo(px,py+6);ctx.stroke();
    const label=waterMode?'Eau '+after+' blocs':mode==='plateau'?'Niveau '+after:centerLevel+' → '+after;
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

export function drawSculptTerrain(ctx,{terrain,material,texture=null,rockPalette='warm',visualSmoothness=.72,overlays={},paintSurface=null,paintImages=null,tile=SCULPT_TILE}={}){
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
  const drawPaint=sculptPaintByCell(ctx,terrain,tile,paintSurface,paintImages);
  let paintedCells=0;
  const deferredToes=[];
  for(let row=0;row<terrain.height;row++){
    // Draw all top surfaces of a row first, then contiguous wall runs.
    // A 6-cell cliff has one curved foot, not six square block bottoms.
    for(let col=0;col<terrain.width;col++){
      const idx=row*terrain.width+col,level=terrain.levels[idx];
      const x=col*w,y=row*h-level*rise;
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
      const side=east.get(idx);
      if(side)rockFace(ctx,{x:x+w-3,y:y+3,width:4.5,
        height:(side.upper-side.lower)*rise+h-3,
        colors,seed:idx+54,sun:0,smoothness:hasProfiles?terrain.roundness[idx]/100:visualSmoothness});
    }
    for(let col=0;col<terrain.width;){
      const idx=row*terrain.width+col,first=south.get(idx);
      if(!first){col++;continue;}
      let end=col+1;
      while(end<terrain.width){
        const adjacent=south.get(row*terrain.width+end);
        if(!adjacent||adjacent.upper!==first.upper||adjacent.lower!==first.lower||
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
      rockFace(ctx,{x,y,width,height,colors,seed:idx,sun:1,smoothness:runSmoothness});
      if(runSmoothness>0){
        ctx.save();
        ctx.strokeStyle='rgba(45,48,48,.18)';ctx.lineWidth=.9;
        ctx.beginPath();ctx.moveTo(x+2,y+1);
        ctx.quadraticCurveTo(x+width*.3,y+runSmoothness*2,
          x+width*.59,y+1);
        ctx.quadraticCurveTo(x+width*.84,y-runSmoothness*1.2,x+width-2,y+1);
        ctx.stroke();ctx.restore();
      }
      deferredToes.push({x,width,bottom:y+height,seed:idx,smoothness:runSmoothness});
      faceRuns++;col=end;
    }
    // Painter order: water belongs to its own absolute-height layer. Paint it
    // before the next (foreground) land row, never over every finished cliff.
    waterCells+=drawWaterVolume(ctx,{terrain,overlay:overlays.water,tile,
      rowStart:row,rowEnd:row+1});
  }

  // The NEXT ground row would otherwise paint over the rounded rock foot.
  // Compositing a slender irregular rock toe AFTER all ground is drawn makes
  // the curved base actually visible against lower dirt, road and water.
  // No pixels are used to decide physics; these are decorative only.
  for(const toe of deferredToes){
    const soften=Math.max(0,Math.min(1.5,Number(toe.smoothness)||0));
    if(soften<=0)continue;
    const depth=Math.min(15*soften,Math.max(3,toe.width*.10));
    const {x,width,bottom,seed}=toe;
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
  return {faceCount:faces.length,faceRuns,waterCells,roadCells,paintedCells,worldWidth:totalWidth,worldHeight:totalHeight};
}
