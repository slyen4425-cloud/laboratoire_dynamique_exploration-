// WorldObject Renderer helper. Cosmetic only; never changes world geometry.
// Shoreline effects follow the same WorldDocument surface and placements as gameplay.
import {sampleSmoothPath} from './path-ribbon.js';
import {worldObjectVisualRect} from '../world/world-object-model.js?rev=collision-boundary-worldobject-obstacles-v1';

const pathCache=new WeakMap();
function samplesFor(river) {
  const previous=pathCache.get(river);
  if(previous)return previous;
  const samples=sampleSmoothPath(river.points,32);
  pathCache.set(river,samples);
  return samples;
}
function distanceToPath(x,y,points) {
  let nearest=Infinity;
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];
    const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
    if(length<=1e-9)continue;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/length));
    nearest=Math.min(nearest,Math.hypot(x-(a.x+t*dx),y-(a.y+t*dy)));
  }
  return nearest;
}
const FOOT_X=Object.freeze([-0.405,-0.222,-0.027,0.189,0.403]);
const FOOT_Y=Object.freeze([0.014,-0.014,0.003,0.020,-0.009]);
export function planObjectShoreContacts({object,surface,materialRegistry}={}) {
  const contact=object?.visual?.shoreContact;
  const rivers=surface?.rivers;
  if(!contact || !Array.isArray(rivers) || !materialRegistry)return [];
  const rect=worldObjectVisualRect(object);
  if(!rect)return [];
  const anchorY=Number(contact.anchorYRatio), span=Number(contact.widthRatio);
  if(!Number.isFinite(anchorY)||Math.abs(anchorY)>0.5||
     !Number.isFinite(span)||span<=0||span>1)return [];
  const cos=Math.cos(rect.rotation),sin=Math.sin(rect.rotation);
  const plan=[];
  for(const river of rivers) {
    const material=materialRegistry.resolve?.(river.materialId);
    const style=material?.kind==='water' ? material.render?.shoreContact : null;
    if(!style || !Number.isFinite(river.width)||river.width<=0)continue;
    const path=samplesFor(river);
    if(path.length<2)continue;
    for(let i=0;i<FOOT_X.length;i++) {
      const lx=FOOT_X[i]*rect.width*span;
      const ly=(anchorY+FOOT_Y[i])*rect.height;
      const x=rect.x+lx*cos-ly*sin;
      const y=rect.y+lx*sin+ly*cos;
      const delta=Math.abs(distanceToPath(x,y,path)-river.width/2);
      const tolerance=Math.max(18,Math.min(35,river.width*0.22));
      if(delta>tolerance)continue;
      const strength=Math.max(0.08,1-delta/tolerance);
      plan.push({
        x,y,angle:rect.rotation,
        length:Math.max(9,Math.min(66,rect.width*0.095*(0.85+(i%3)*0.10))),
        shadowColor:style.shadowColor,
        highlightColor:style.highlightColor,
        materialId:river.materialId,
        opacity:Math.min(0.85,Math.max(0,Number(style.opacity)||0))*strength
      });
    }
  }
  return plan;
}
