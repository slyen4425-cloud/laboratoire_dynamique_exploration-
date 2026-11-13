// Visual-only V1 experiment: generated scenery outside the canonical playable grid.
// Neither this renderer nor its settings create surfaces, collisions, objects or portals.
export const SCULPT_BORDER_SIDES=Object.freeze(['front','left','right','back']);
export const SCULPT_BORDER_BIOMES=Object.freeze(['plain','forest','snow','sand','mountain','volcano','sea']);
export const SCULPT_BORDER_STYLES=Object.freeze(['auto','hills','forest','cliffs','mountains','coast']);
const PALETTES=Object.freeze({
  plain:{ground:'#77945c',edge:'#536f4c',far:'#a6b9a2',near:'#6d8d80',tree:'#436b4d',detail:'#b4b57e'},
  forest:{ground:'#4b764f',edge:'#355941',far:'#8dab96',near:'#456e61',tree:'#214e39',detail:'#8da86b'},
  snow:{ground:'#d9e4e2',edge:'#9eafbb',far:'#cddde2',near:'#9ab5be',tree:'#466c73',detail:'#f3f8f7'},
  sand:{ground:'#d6b579',edge:'#a88759',far:'#e1c59e',near:'#b89c79',tree:'#817a53',detail:'#f1d4a0'},
  mountain:{ground:'#80918a',edge:'#536e75',far:'#a2b3ba',near:'#718b91',tree:'#45665a',detail:'#b3bcb5'},
  volcano:{ground:'#68626a',edge:'#3c3a44',far:'#7b6670',near:'#564650',tree:'#8b4537',detail:'#b66b49'},
  sea:{ground:'#71a69d',edge:'#477f87',far:'#9cc7c7',near:'#6eabae',tree:'#3d7c7a',detail:'#c5e1d1'}
});
const DEFAULT_SIDE=Object.freeze({style:'auto',density:55,revision:0});
export function normalizeSculptBorderPreview(raw={}){
  const sides={};
  for(const side of SCULPT_BORDER_SIDES){
    const source=raw?.sides?.[side]??{};
    sides[side]=Object.freeze({
      style:SCULPT_BORDER_STYLES.includes(source.style)?source.style:'auto',
      density:Number.isFinite(source.density)?Math.min(100,Math.max(0,Math.round(source.density))):DEFAULT_SIDE.density,
      revision:Number.isSafeInteger(source.revision)&&source.revision>=0?source.revision:0
    });
  }
  return Object.freeze({
    // The old generated border experiment is retired by default. Only a
    // deliberate opt-in may display it during migration to sculptable edges.
    enabled:raw?.enabled===true,
    biome:raw?.biome==='auto'||SCULPT_BORDER_BIOMES.includes(raw?.biome)?raw.biome:'auto',
    sides:Object.freeze(sides)
  });
}
export function resolveSculptBorderBiome(requested,terrainFamily){
  if(SCULPT_BORDER_BIOMES.includes(requested))return requested;
  return SCULPT_BORDER_BIOMES.includes(terrainFamily)?terrainFamily:'plain';
}
export function sculptBorderStyle(biome,style){
  if(style!=='auto')return SCULPT_BORDER_STYLES.includes(style)?style:'hills';
  return {forest:'forest',snow:'mountains',sand:'hills',mountain:'mountains',
    volcano:'cliffs',sea:'coast',plain:'hills'}[biome]??'hills';
}
export function sculptBorderSeed(value){
  let hash=2166136261;
  for(const character of String(value??'map')){hash^=character.charCodeAt(0);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}
function rand(seed,a,b=0){
  let h=(seed+Math.imul(a+101,374761393)+Math.imul(b+31,668265263))|0;
  h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;
}
function trace(ctx,points){
  if(points.length===0)return;
  ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
  ctx.closePath();
}
function ridge(ctx,points,color){trace(ctx,points);ctx.fillStyle=color;ctx.fill();}
function paletteFor(config){return PALETTES[config?.biome]??PALETTES.plain;}
function decorShape(ctx,x,y,size,style,color,seed,i){
  ctx.save();ctx.fillStyle=color;
  if(style==='forest'){
    ctx.fillRect(x-size*.09,y-size*.34,size*.18,size*.4);
    trace(ctx,[[x-size*.47,y-size*.2],[x,y-size*(1.0+rand(seed,i,8)*.48)],
      [x+size*.47,y-size*.2]]);ctx.fill();
  }else if(style==='mountains'||style==='cliffs'){
    trace(ctx,[[x-size*.62,y],[x-size*.13,y-size*(.6+rand(seed,i,7)*.4)],
      [x+size*.17,y-size*.35],[x+size*.51,y-size*.8],[x+size*.76,y]]);
    ctx.fill();
  }else if(style==='coast'){
    ctx.beginPath();ctx.ellipse(x,y,size*.72,size*.18,0,0,Math.PI*2);ctx.fill();
  }else{
    ctx.beginPath();ctx.ellipse(x,y,size*.75,size*.3,0,Math.PI,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function sidePoint(side,t,width,height,depth,offset=0){
  if(side==='front')return [t*width,height+offset*depth];
  if(side==='back')return [t*width,-offset*depth];
  if(side==='left')return [-offset*depth,t*height];
  return [width+offset*depth,t*height];
}
export function drawSculptBorderExtension(ctx,{terrain,tile={width:28,height:21},
  config={},mapKey='map'}={}){
  if(!ctx||!terrain||config.enabled===false)return Object.freeze({sides:0,features:0});
  const w=terrain.width*tile.width,h=terrain.height*tile.height;
  const pal=paletteFor(config),seed=sculptBorderSeed(mapKey);
  let features=0;
  ctx.save();
  for(const [sideIndex,side] of SCULPT_BORDER_SIDES.entries()){
    const settings=config.sides?.[side]??DEFAULT_SIDE;
    const style=sculptBorderStyle(config.biome,settings.style);
    const ownSeed=seed^sculptBorderSeed(side)^Math.imul(settings.revision??0,10007);
    const frontBack=side==='front'||side==='back';
    const depth=(frontBack?tile.height:tile.width)*(side==='front'?8:side==='back'?7:5);
    const segments=frontBack?Math.max(12,terrain.width):Math.max(10,terrain.height);
    const inner=[],outer=[];
    for(let i=0;i<=segments;i++){
      const t=i/segments;
      // The seam sits UNDER the authored terrain, so its playable edge stays authoritative.
      inner.push(sidePoint(side,t,w,h,depth,-.04));
      const irregular=.85+rand(ownSeed,i,11)*.42;
      outer.push(sidePoint(side,t,w,h,depth,irregular));
    }
    ridge(ctx,[...inner,...outer.reverse()],pal.ground);
    // Edge-to-world visual textures: deliberately sparse to preserve mobile performance.
    const detailCount=Math.round((frontBack?terrain.width:terrain.height)*Math.max(0,settings.density)/130);
    for(let i=0;i<detailCount;i++){
      const t=.03+rand(ownSeed,i,1)*.94;
      const p=sidePoint(side,t,w,h,depth,.24+rand(ownSeed,i,2)*.68);
      const size=(frontBack?tile.width:tile.height)*(1.4+rand(ownSeed,i,3)*1.5);
      decorShape(ctx,p[0],p[1],size,style,pal.tree,ownSeed,i);
      features++;
    }
    // Ragged exterior rim, never a new tile that could be traversed or selected.
    ctx.beginPath();const count=segments;
    for(let i=0;i<=count;i++){
      const p=sidePoint(side,i/count,w,h,depth,.85+rand(ownSeed,i,11)*.42);
      if(i===0)ctx.moveTo(...p);else ctx.lineTo(...p);
    }
    ctx.lineWidth=2.2;ctx.strokeStyle=pal.edge;ctx.stroke();
  }
  ctx.restore();
  return Object.freeze({sides:4,features});
}
export function drawSculptDistantBorders(ctx,{width,height,config={},mapKey='map'}={}){
  if(!ctx||config.enabled===false)return;
  const w=Math.max(1,width),h=Math.max(1,height),pal=paletteFor(config);
  const seed=sculptBorderSeed(mapKey);
  const back=config.sides?.back??DEFAULT_SIDE;
  const style=sculptBorderStyle(config.biome,back.style);
  ctx.save();
  for(let layer=0;layer<2;layer++){
    const base=h*(layer===0?.82:.90);
    const heightScale=h*(style==='mountains'?.16:style==='forest'?.09:.065)*(layer===0?1:.82);
    const samples=32,points=[[0,h]];
    for(let i=0;i<=samples;i++){
      const x=w*i/samples,r=rand(seed^sculptBorderSeed('back'),i,layer+(back.revision??0)*37);
      const amplitude=(style==='coast'?.28:.4)+r*.65;
      points.push([x,base-heightScale*amplitude]);
    }
    points.push([w,h]);ridge(ctx,points,layer===0?pal.far:pal.near);
  }
  ctx.restore();
}
