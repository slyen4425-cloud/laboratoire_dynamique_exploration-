// Generic, reusable surface-sprite clock and atlas. Each frame is an
// independently rendered seamless 112x84 tile, generated once per style.
// No image downloads, timers or per-cell animations.
export const SURFACE_FRAME_COUNT=12;
export const SURFACE_TILE=Object.freeze({width:112,height:84});
export function animatedSurfaceFrame(timeSeconds,fps=8,count=SURFACE_FRAME_COUNT){
 const t=Number.isFinite(timeSeconds)?timeSeconds:0;
 const rate=Number.isFinite(fps)?Math.max(1,Math.min(16,fps)):8;
 return ((Math.floor(t*rate)%count)+count)%count;
}
const styles=Object.freeze({
 'water.clear_blue':{color:'#d7f8ff',amplitude:2.1,streak:1},
 'water.turquoise':{color:'#e1fff7',amplitude:1.7,streak:1.2},
 'water.forest_stream':{color:'#bfe5e9',amplitude:1.3,streak:1.6},
 'water.swamp':{color:'#abd6b5',amplitude:.9,streak:.7}
});
const frames=new Map();
export function animatedSurfaceSprite(id,index,createCanvas=()=>document.createElement('canvas')){
 const style=styles[id];if(!style)return null;
 const frame=((index%SURFACE_FRAME_COUNT)+SURFACE_FRAME_COUNT)%SURFACE_FRAME_COUNT;
 const key=id+':'+frame;if(frames.has(key))return frames.get(key);
 const canvas=createCanvas(),{width:w,height:h}=SURFACE_TILE;canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const phase=frame/SURFACE_FRAME_COUNT*Math.PI*2;
 ctx.lineCap='round';ctx.strokeStyle=style.color;
 // Repeat periodic bands across tile boundaries: no visible seams or jumps.
 for(let row=0;row<6;row++){
  const y=(row+.5)*h/6;
  const shift=phase+row*1.71;
  for(let copy=-1;copy<=1;copy++){
   const origin=copy*w+(row%2)*w/4+Math.sin(shift)*5;
   for(let j=0;j<3;j++){
    const x=origin+j*w/3;
    const length=(13+5*Math.sin(shift+j*2))*style.streak;
    const yy=y+Math.cos(shift+j)*1.8;
    ctx.globalAlpha=.12+.10*(.5+.5*Math.sin(shift+j*1.9));
    ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x,yy);
    ctx.quadraticCurveTo(x+length*.5,yy+Math.sin(shift+j)*style.amplitude,x+length,yy);
    ctx.stroke();
   }
  }
 }
 frames.set(key,canvas);return canvas;
}
