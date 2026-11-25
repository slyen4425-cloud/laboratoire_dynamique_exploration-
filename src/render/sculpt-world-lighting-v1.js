import {sculptCameraUnproject} from './sculpt-camera-projection.js';
// One cached cloud mask; only compositing runs on the native frame.
let cloudMask=null;
function getCloudMask(){
 if(cloudMask)return cloudMask;
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 for(const [x,y,rx,ry] of [[72,68,65,39],[130,52,76,45],[185,75,61,38]]){
  ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
  const g=ctx.createRadialGradient(0,0,0,0,0,1);
  g.addColorStop(0,'rgba(20,24,44,.85)');g.addColorStop(.45,'rgba(20,24,44,.55)');g.addColorStop(1,'rgba(20,24,44,0)');
  ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
 }
 return cloudMask=canvas;
}
// Viewport coordinates have had pan/zoom removed, but still carry the native
// camera pitch and shear. Reuse Camera's exact inverse for world-space culling.
export function sculptCloudWorldViewportV1(viewport,camera){
 if(!viewport||!camera)return viewport??null;
 const corners=[
  sculptCameraUnproject(camera,viewport.minX,viewport.minY),
  sculptCameraUnproject(camera,viewport.minX,viewport.maxY),
  sculptCameraUnproject(camera,viewport.maxX,viewport.minY),
  sculptCameraUnproject(camera,viewport.maxX,viewport.maxY)
 ];
 return Object.freeze({minX:Math.min(...corners.map(p=>p.x)),
  maxX:Math.max(...corners.map(p=>p.x)),
  minY:Math.min(...corners.map(p=>p.y)),
  maxY:Math.max(...corners.map(p=>p.y))});
}
export function drawSculptWorldCloudShadowsV1(ctx,{lighting,width,height,timeSeconds=0,viewport,camera}){
 if(!lighting?.cloudsEnabled||!lighting.cloudOpacityPct)return 0;
 const mask=getCloudMask();if(!mask)return 0;
 const size=lighting.cloudSize,step=size*1.75,angle=lighting.cloudDirectionDeg*Math.PI/180;
 const dx=timeSeconds*lighting.cloudSpeed*Math.cos(angle),dy=timeSeconds*lighting.cloudSpeed*Math.sin(angle);
 const mod=x=>((x%step)+step)%step;
 // Draw only visible clouds in WORLD space after camera unprojection.
 const worldViewport=sculptCloudWorldViewportV1(viewport,camera);
 const minX=Math.max(-size,worldViewport?.minX??0)-size,minY=Math.max(-size,worldViewport?.minY??0)-size;
 const maxX=Math.min(width+size,worldViewport?.maxX??width)+size,maxY=Math.min(height+size,worldViewport?.maxY??height)+size;
 const ox=mod(dx),oy=mod(dy);
 ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.clip();ctx.globalAlpha=lighting.cloudOpacityPct/100;
 let count=0;
 for(let y=Math.floor((minY-oy)/step)*step+oy;y<=maxY;y+=step)
  for(let x=Math.floor((minX-ox)/step)*step+ox;x<=maxX;x+=step){
   ctx.drawImage(mask,x,y,size,size*.5);count++;
  }
 ctx.restore();return count;
}
export function drawSculptWarmLightV1(ctx,{lighting,width,height,dpr=1}){
 if(!lighting?.warmthPct)return false;
 ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.globalAlpha=lighting.warmthPct/100;ctx.fillStyle=lighting.warmColor;
 ctx.fillRect(0,0,width,height);ctx.restore();return true;
}
