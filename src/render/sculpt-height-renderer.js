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
// The height grid remains integer and authoritative. Only the *visible* outline
// is curved; the data, face list and JSON are untouched by visual smoothing.
function rockFace(ctx, {x, y, width, height, colors, seed=0, sun=1, roundness=.7}) {
  if (height <= 0) return;
  const smooth = Math.max(0, Math.min(1, Number(roundness) || 0));
  const rounding = Math.min(width * .28, height * .27, 9) * smooth;
  const left = x - .65, right = x + width + .65;
  const bottom = y + height, bend = Math.min(5, height * .12) * smooth;
  const gradient = ctx.createLinearGradient(x, y, x, bottom);
  gradient.addColorStop(0, colors[sun===1?0:1]);
  gradient.addColorStop(.21, colors[1]);
  gradient.addColorStop(.74, colors[2]);
  gradient.addColorStop(1, colors[3]);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left, y - .8);
  ctx.quadraticCurveTo(x + width * .3, y - bend, x + width*.52, y - .35);
  ctx.quadraticCurveTo(x + width * .78, y + bend*.25, right, y - .7);
  ctx.lineTo(right, bottom - rounding);
  ctx.quadraticCurveTo(right, bottom - bend * .20, right - rounding, bottom + bend*.12);
  ctx.quadraticCurveTo(x + width*.55, bottom + bend*.20, left + rounding, bottom + bend*.10);
  ctx.quadraticCurveTo(left, bottom - bend*.12, left, bottom - rounding);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = gradient;
  ctx.fillRect(left, y-2-bend, width+2, height+4+bend*2);

  // Larger softly painted weathering patches, not one repeated hard-edged
  // stone rectangle per height cell.
  const shade = ((hash(seed, 17, 8)%11)-5)/13;
  ctx.beginPath();
  ctx.ellipse(x + width*(.45+shade*.2), y+height*.52,
    Math.max(2,width*.37), Math.max(2,height*.40), shade*.16, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(239,226,207,.075)';
  ctx.fill();

  const veins=Math.min(7, Math.max(1, Math.floor(height/9)));
  for (let i=0;i<veins;i++) {
    const yLine = y + height*(i+.5)/veins;
    const shift = (hash(seed,i,17)%15)-7;
    ctx.beginPath();
    ctx.moveTo(x-2,yLine);
    ctx.bezierCurveTo(x+width*.25,yLine+shift*.33,
      x+width*.65,yLine-shift*.26,x+width+2,yLine+shift*.13);
    ctx.lineWidth=.72;
    ctx.strokeStyle=i%3===0?'rgba(238,216,194,.18)':'rgba(35,40,52,.15)';
    ctx.stroke();
  }
  if (width>12) {
    const offset=(hash(seed,3,1)%10)/10;
    ctx.beginPath();
    ctx.moveTo(x+width*(.32+offset*.23), y+height*.18);
    ctx.quadraticCurveTo(x+width*(.28+offset*.2), y+height*.41,
      x+width*(.43+offset*.13), y+height*.67);
    ctx.strokeStyle='rgba(31,42,51,.17)';ctx.lineWidth=.8;ctx.stroke();
  }
  ctx.restore();
}
export function drawSculptTerrain(ctx,{terrain,material,texture=null,rockPalette='warm',roundness=.7,tile=SCULPT_TILE}={}){
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
      colors,seed:idx,sun:1,roundness});
    const side=east.get(idx);
    if(side)rockFace(ctx,{x:x+w-3,y:y+3,width:4.5,
      height:(side.upper-side.lower)*rise+h-3,colors,seed:idx+54,sun:0,roundness});
  }
  return {faceCount:faces.length,worldWidth:totalWidth,worldHeight:totalHeight};
}
