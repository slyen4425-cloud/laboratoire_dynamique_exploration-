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
function rockFace(ctx,{x,y,width,height,colors,seed=0,sun=1}){
  if(height<=0)return;
  const gradient=ctx.createLinearGradient(x,y,x,y+height);
  gradient.addColorStop(0,colors[sun===1?0:1]);
  gradient.addColorStop(.46,colors[1]);
  gradient.addColorStop(1,colors[3]);
  ctx.fillStyle=gradient;ctx.fillRect(x,y,width,height);
  const veins=Math.min(8,Math.max(1,Math.floor(height/8)));
  for(let i=0;i<veins;i++){
    const yLine=y+height*(i+.45)/veins;
    const shift=(hash(seed,i,17)%13)-6;
    ctx.beginPath();ctx.moveTo(x+2,yLine);
    ctx.quadraticCurveTo(x+width*.5,yLine+shift*.18,x+width-2,yLine+shift*.30);
    ctx.lineWidth=.65;ctx.strokeStyle=i%3===0?'rgba(234,214,187,.22)':'rgba(36,38,55,.20)';ctx.stroke();
  }
  // Irregular vertical seams vary by cell and never change collision geometry.
  if(width>12){const offset=(hash(seed,3,1)%10)/10;
    ctx.beginPath();ctx.moveTo(x+width*(.3+offset*.35),y+4);
    ctx.lineTo(x+width*(.25+offset*.38),y+height*.72);
    ctx.strokeStyle='rgba(37,39,47,.23)';ctx.lineWidth=.7;ctx.stroke();}
}
export function drawSculptTerrain(ctx,{terrain,material,texture=null,rockPalette='warm',tile=SCULPT_TILE}={}){
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
    const front=south.get(idx);
    if(front)rockFace(ctx,{x,y:y+h,width:w+.6,height:(front.upper-front.lower)*rise,
      colors,seed:idx,sun:1});
    const side=east.get(idx);
    if(side)rockFace(ctx,{x:x+w-3,y:y+3,width:4.5,
      height:(side.upper-side.lower)*rise+h-3,colors,seed:idx+54,sun:0});
  }
  return {faceCount:faces.length,worldWidth:totalWidth,worldHeight:totalHeight};
}
