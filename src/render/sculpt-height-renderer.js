// Sculpt lab only. 2.5D projection of a canonical experimental height grid.
// Faces are emitted only where neighboring height levels differ; no placed rock assets.
import {sculptHeightAt,sculptFaces} from '../world/sculpt-height-model.js';
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
  const softness=Math.max(0,Math.min(1,Number(smoothness)||0));
  const corner=Math.min(width*.27,height*.3,7*softness);
  const undulation=Math.min(2.4*softness,height*.10);
  return Object.freeze({corner,undulation});
}
function rockFace(ctx,{x,y,width,height,colors,seed=0,sun=1,smoothness=.72}){
  if(height<=0)return;
  const {corner,undulation}=sculptFaceContour({width,height,smoothness});
  // Rounded upper lip + sculpted foot: removes perfectly square hanging walls.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x,y+corner);
  ctx.quadraticCurveTo(x,y,x+corner,y);
  ctx.quadraticCurveTo(x+width*.49,y+undulation,x+width-corner,y);
  ctx.quadraticCurveTo(x+width,y,x+width,y+corner);
  ctx.lineTo(x+width,y+height-corner);
  ctx.quadraticCurveTo(x+width,y+height,x+width-corner,y+height);
  ctx.quadraticCurveTo(x+width*.50,y+height-undulation*.75,x+corner,y+height);
  ctx.quadraticCurveTo(x,y+height,x,y+height-corner);
  ctx.closePath();
  ctx.clip();
  const gradient=ctx.createLinearGradient(x,y,x,y+height);
  gradient.addColorStop(0,colors[sun===1?0:1]);
  gradient.addColorStop(.20,colors[1]);
  gradient.addColorStop(.72,colors[2]);
  gradient.addColorStop(1,colors[3]);
  ctx.fillStyle=gradient;ctx.fillRect(x,y,width,height);
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
export function drawSculptTerrain(ctx,{terrain,material,texture=null,rockPalette='warm',visualSmoothness=.72,tile=SCULPT_TILE}={}){
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
  for(let row=0;row<terrain.height;row++)for(let col=0;col<terrain.width;col++){
    const idx=row*terrain.width+col,level=terrain.levels[idx];
    const x=col*w,y=row*h-level*rise;
    // Top surfaces retain the EXISTING material texture, not a separate cliff skin.
    ctx.fillStyle=pattern??baseColor;ctx.fillRect(x,y,w+.6,h+.6);
    ctx.fillStyle=color(['rgba(255,255,255,.035)','rgba(0,0,0,.025)',
      'rgba(0,0,0,.01)'],col,row,2);ctx.fillRect(x,y,w,h);
    if(level>0){
      const variation=hash(col,row,91)%5;
      ctx.fillStyle=variation===0?'rgba(255,245,216,.15)':'rgba(39,49,38,.08)';
      ctx.fillRect(x+((hash(col,row,7)%15)+1),y+4,Math.max(2,w*.24),1.5);
    }
    // A thin organic top bevel draws the terrain over the rock face.
    // Visual only: true tile level stays untouched.
    if(visualSmoothness>0 && south.has(idx)){
      const soften=Math.max(0,Math.min(1,visualSmoothness));
      ctx.beginPath();
      ctx.moveTo(x,y+h-3*soften);
      ctx.quadraticCurveTo(x+w*.22,y+h+1.4*soften,x+w*.45,y+h-1.2*soften);
      ctx.quadraticCurveTo(x+w*.78,y+h+2*soften,x+w,y+h-2.5*soften);
      ctx.lineTo(x+w,y+h-5*soften);
      ctx.lineTo(x,y+h-5*soften);
      ctx.closePath();
      ctx.fillStyle=pattern??baseColor;ctx.fill();
      ctx.strokeStyle='rgba(34,35,32,.11)';ctx.lineWidth=.7;ctx.stroke();
    }
    const front=south.get(idx);
    if(front)rockFace(ctx,{x,y:y+h,width:w+.6,height:(front.upper-front.lower)*rise,
      colors,seed:idx,sun:1,smoothness:visualSmoothness});
    const side=east.get(idx);
    if(side)rockFace(ctx,{x:x+w-3,y:y+3,width:4.5,
      height:(side.upper-side.lower)*rise+h-3,colors,seed:idx+54,sun:0,smoothness:visualSmoothness});
  }
  return {faceCount:faces.length,worldWidth:totalWidth,worldHeight:totalHeight};
}
