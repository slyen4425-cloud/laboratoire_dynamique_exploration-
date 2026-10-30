// Purely visual rock grain and natural stone facet shapes for the sculpt lab.
// The canonical terrain grid, WorldSurface and Collision World never read this.
const rockTextures=new Map();
function hash(a,b=0,c=0){
  let n=(Math.imul(a+71,374761393)+Math.imul(b+19,668265263)+Math.imul(c+3,1442695041))|0;
  n=Math.imul(n^(n>>>13),1274126177);
  return (n^(n>>>16))>>>0;
}
function unit(a,b,c){return hash(a,b,c)/4294967295;}
function gridNoise(x,y,cells,seed){
  const xx=x*cells,yy=y*cells;
  const col=Math.floor(xx),row=Math.floor(yy);
  const fx=xx-col,fy=yy-row;
  const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const val=(dx,dy)=>unit((col+dx)%cells,(row+dy)%cells,seed);
  const upper=val(0,0)*(1-sx)+val(1,0)*sx;
  const lower=val(0,1)*(1-sx)+val(1,1)*sx;
  return upper*(1-sy)+lower*sy;
}
// A small periodic alpha mineral texture made once; it is NOT a generated
// external asset and is reused by every cliff / every frame of a palette.
export function sculptRockGrainPattern(ctx,colors){
  if(!ctx?.createPattern)return null;
  const key=colors.join('|');
  if(!rockTextures.has(key)){
    const doc=ctx.canvas?.ownerDocument??(typeof document!=='undefined'?document:null);
    if(!doc?.createElement)return null;
    const image=doc.createElement('canvas');
    const size=128;image.width=size;image.height=size;
    const g=image.getContext('2d');
    if(!g?.createImageData||!g?.putImageData)return null;
    const pixels=g.createImageData(size,size);
    for(let py=0;py<size;py++)for(let px=0;px<size;px++){
      const u=px/size,v=py/size;
      const large=gridNoise(u,v,5,17),medium=gridNoise(u,v,16,23);
      const fine=unit(px,py,79);
      const value=(large-.5)*.53+(medium-.5)*.32+(fine-.5)*.15;
      const index=(py*size+px)*4;
      const light=value>=0;
      pixels.data[index]=light?242:25;
      pixels.data[index+1]=light?232:29;
      pixels.data[index+2]=light?213:36;
      pixels.data[index+3]=Math.round(Math.min(88,Math.abs(value)*290+10));
    }
    g.putImageData(pixels,0,0);
    rockTextures.set(key,image);
  }
  return ctx.createPattern(rockTextures.get(key),'repeat');
}
export function sculptRockDetailPlan({width=0,height=0,seed=0}={}){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
    return Object.freeze({facets:Object.freeze([]),fractures:Object.freeze([])});
  const cols=Math.max(1,Math.min(58,Math.ceil(width/43)));
  const rows=Math.max(1,Math.min(7,Math.ceil(height/27)));
  const facets=[],fractures=[];
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const id=hash(seed,col,row);
    const columnWidth=width/cols,rowHeight=height/rows;
    const cx=(col+.5+(unit(seed,col,row+70)-.5)*.25)*columnWidth;
    const cy=(row+.5+(unit(seed,row,col+41)-.5)*.34)*rowHeight;
    const radiusX=columnWidth*(.30+unit(id,1,3)*.22);
    const radiusY=rowHeight*(.29+unit(id,2,4)*.25);
    const points=Object.freeze([
      Object.freeze([cx-radiusX*.67,cy-radiusY*.94]),
      Object.freeze([cx+radiusX*.28,cy-radiusY*1.12]),
      Object.freeze([cx+radiusX,cy-radiusY*.17]),
      Object.freeze([cx+radiusX*.67,cy+radiusY*.81]),
      Object.freeze([cx-radiusX*.39,cy+radiusY*1.06]),
      Object.freeze([cx-radiusX,cy+radiusY*.04])
    ]);
    facets.push(Object.freeze({points,shade:unit(id,3,5),strength:.075+unit(id,8,9)*.18}));
    if(height>15&&unit(id,6,1)>.34){
      fractures.push(Object.freeze({
        points:Object.freeze([
          Object.freeze([cx-radiusX*.46,cy-radiusY*.49]),
          Object.freeze([cx-radiusX*.13,cy-radiusY*.05]),
          Object.freeze([cx+radiusX*.24,cy+radiusY*.15]),
          Object.freeze([cx+radiusX*.38,cy+radiusY*.63])
        ]),
        strength:.12+unit(id,7,6)*.15
      }));
    }
  }
  return Object.freeze({facets:Object.freeze(facets),fractures:Object.freeze(fractures)});
}
export function paintSculptRockDetails(ctx,{x,y,width,height,seed=0,colors}){
  if(!ctx||width<=0||height<=0)return;
  const pattern=sculptRockGrainPattern(ctx,colors);
  if(pattern){
    ctx.save();ctx.globalAlpha=.89;ctx.fillStyle=pattern;
    ctx.fillRect(x,y,width,height);ctx.restore();
  }
  const plan=sculptRockDetailPlan({width,height,seed});
  for(const face of plan.facets){
    const p=face.points;
    ctx.beginPath();ctx.moveTo(x+p[0][0],y+p[0][1]);
    for(let i=1;i<p.length;i++)ctx.lineTo(x+p[i][0],y+p[i][1]);
    ctx.closePath();
    ctx.globalAlpha=face.strength;
    ctx.fillStyle=face.shade>.58?colors[0]:face.shade<.27?colors[3]:colors[1];
    ctx.fill();
    // Mineral cleavage accent along one uneven upper ridge of the facet.
    ctx.globalAlpha=Math.min(.32,face.strength+.065);
    ctx.strokeStyle=face.shade>.5?colors[0]:colors[2];ctx.lineWidth=.9;
    ctx.beginPath();ctx.moveTo(x+p[0][0],y+p[0][1]);
    ctx.lineTo(x+p[1][0],y+p[1][1]);
    ctx.lineTo(x+p[2][0],y+p[2][1]);ctx.stroke();
  }
  for(const fault of plan.fractures){
    const p=fault.points;
    ctx.globalAlpha=fault.strength;ctx.lineWidth=.7;
    ctx.strokeStyle=colors[3];ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(x+p[0][0],y+p[0][1]);
    for(let i=1;i<p.length;i++)ctx.lineTo(x+p[i][0],y+p[i][1]);
    ctx.stroke();
    ctx.globalAlpha=fault.strength*.35;ctx.strokeStyle=colors[0];
    ctx.beginPath();ctx.moveTo(x+p[1][0]+1,y+p[1][1]);
    ctx.lineTo(x+p[2][0]+1,y+p[2][1]);ctx.stroke();
  }
  ctx.globalAlpha=1;
}
