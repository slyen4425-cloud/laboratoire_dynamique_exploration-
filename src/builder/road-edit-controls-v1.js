import {routeKnotsFromPoints,routePointsFromKnots} from '../world/road-edit-geometry-v1.js';
import {editSculptRoute,resolveSculptSurfaceMaterial} from '../world/sculpt-surface-paint.js';
import {ROAD_BORDER_ASSETS} from '../render/road-border-renderer-v1.js';
const defaults={width:8,scale:1,offset:0,spacing:2,opacity:1};
const clone=x=>JSON.parse(JSON.stringify(x));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function distance(p,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0;
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
export function createRoadEditControls({getSurface,commit,redraw,status,getBounds,getRegistry=()=>null,root=document}){
  const $=id=>root.getElementById(id);
  const action=$('surface-action'),material=$('surface-material'),panel=$('road-style-controls');
  if(!panel)return null; // V80 markup is intentionally unchanged.
  const enabled=$('road-border-enabled'),side=$('road-border-side');
  const select={left:$('road-border-left'),right:$('road-border-right')};
  const fields=Object.fromEntries(['width','scale','offset','spacing','opacity'].map(k=>[k,$('road-border-'+k)]));
  for(const node of Object.values(select))for(const asset of ROAD_BORDER_ASSETS){
    const opt=root.createElement('option');opt.value=asset.id;opt.textContent=asset.label;node.append(opt);
  }
  let id=null,drag=null,style={left:{...defaults},right:{...defaults}},activeSide='left',pending=[];
  const route=()=>getSurface().routes.find(r=>r.id===id);
  function readSide(){
    const next={...style[activeSide]};
    for(const [key,node] of Object.entries(fields))if(Number.isFinite(node.valueAsNumber))next[key]=node.valueAsNumber/(key==='opacity'?100:1);
    style[activeSide]=next;
  }
  function writeSide(){
    for(const [key,node] of Object.entries(fields))node.value=String(style[activeSide][key]*(key==='opacity'?100:1));
  }
  function border(){
    readSide();const out={enabled:enabled.checked};
    for(const k of ['left','right'])if(select[k].value)out[k]={assetId:select[k].value,...style[k]};
    return out;
  }
  function selectRoute(next){
    id=next?.id??null;drag=null;
    const b=next?.border;
    enabled.checked=b?.enabled??false;
    for(const k of ['left','right']){
      const {assetId,...settings}=b?.[k]??{};
      select[k].value=assetId??'';style[k]={...defaults,...settings};
    }
    writeSide();
    if(next){
      $('surface-width').value=String(Math.max(1,Math.min(12,next.width/28)));
      $('surface-width-value').textContent=$('surface-width').value+' cases';
      $('surface-brush-shape').value=next.brushShape??'round';
    }
    refresh();redraw();
  }
  function refresh(){
    if(id&&!route()){id=null;drag=null;}
    const selected=route(),editing=action.value==='edit',curve=action.value==='curve';
    panel.hidden=!(resolveSculptSurfaceMaterial(material.value,getRegistry())?.kind==='route'||editing||curve);
    $('road-selected').textContent=selected?'Route sélectionnée · '+selected.id:'Aucune route sélectionnée';
    $('road-border-apply').disabled=!selected||!editing;
    $('road-curve-convert').disabled=!selected||!!selected.knots||!editing;
    $('road-curve-finish').hidden=!curve;$('road-curve-finish').disabled=pending.length<2;
    $('road-curve-cancel').hidden=!curve;$('road-curve-cancel').disabled=!pending.length;
  }
  side.addEventListener('change',()=>{readSide();activeSide=side.value;writeSide();});
  enabled.addEventListener('change',()=>{
    if(enabled.checked&&!select.left.value&&!select.right.value)select.left.value=select.right.value=ROAD_BORDER_ASSETS[0].id;
  });
  $('road-border-apply').addEventListener('click',()=>{
    if(!route())return;
    commit(editSculptRoute(getSurface(),id,{border:border(),width:Number($('surface-width').value)*28,brushShape:$('surface-brush-shape').value},getRegistry()));refresh();redraw();
  });
  $('road-curve-convert').addEventListener('click',()=>{
    if(!route())return;
    const knots=routeKnotsFromPoints(route().points,getBounds());if(!knots)return;
    commit(editSculptRoute(getSurface(),id,{knots,brushShape:'round'},getRegistry()));refresh();redraw();
  });
  function setCurveFinish(fn){
    $('road-curve-finish').addEventListener('click',()=>{if(pending.length<2)return;const points=pending;pending=[];fn(points);refresh();redraw();});
  }
  $('road-curve-cancel').addEventListener('click',()=>{pending=[];refresh();redraw();});
  action.addEventListener('change',()=>{
    if(action.value==='curve'||action.value==='edit'){material.value='road.dirt';material.dispatchEvent(new Event('change',{bubbles:true}));}
    pending=[];drag=null;
    if(action.value!=='edit')id=null;
    refresh();redraw();
  });
  material.addEventListener('change',()=>{if(resolveSculptSurfaceMaterial(material.value,getRegistry())?.kind!=='route'&&['curve','edit'].includes(action.value)){action.value='paint';pending=[];id=null;drag=null;}refresh();redraw();});
  function begin(point,radius){
    const selected=route();
    if(selected?.knots){
      let hit=null;
      selected.knots.forEach((k,i)=>{
        for(const key of ['in','out','point']){
          const p=key==='point'?k:k[key],d=dist(point,p);
          if(d<=radius&&(!hit||d<hit.d||(d===hit.d&&key==='point')))hit={i,key,d};
        }
      });
      if(hit){drag={...hit,knots:clone(selected.knots),start:point,original:clone(selected.knots[hit.i])};return;}
    }
    const candidates=getSurface().routes.map(r=>({r,d:Math.min(...r.points.slice(1).map((p,i)=>distance(point,r.points[i],p)))}))
      .filter(({r,d})=>d<=r.width/2+radius).sort((a,b)=>a.d-b.d);
    selectRoute(candidates[0]?.r);
  }
  function bounded(p){
    const b=getBounds();return {x:Math.max(0,Math.min(b.width-.01,p.x)),y:Math.max(0,Math.min(b.height-.01,p.y))};
  }
  function move(point){
    if(!drag)return false;
    const k=drag.knots[drag.i],o=drag.original,dx=point.x-drag.start.x,dy=point.y-drag.start.y;
    if(drag.key==='point'){
      const p=bounded({x:o.x+dx,y:o.y+dy});k.x=p.x;k.y=p.y;
      for(const key of ['in','out'])k[key]=bounded({x:o[key].x+p.x-o.x,y:o[key].y+p.y-o.y});
    }else k[drag.key]=bounded({x:o[drag.key].x+dx,y:o[drag.key].y+dy});
    redraw();return true;
  }
  function finish(cancelled=false){
    if(!drag)return false;
    const knots=drag.knots;drag=null;
    if(!cancelled&&route())commit(editSculptRoute(getSurface(),id,{knots},getRegistry()));refresh();redraw();return true;
  }
  function draw(ctx,project,zoom){
    const selected=route(),editing=action.value==='edit';
    const knots=editing?(drag?.knots??selected?.knots):null;
    const points=knots?routePointsFromKnots(knots):editing?selected?.points:action.value==='curve'&&pending.length?pending:null;
    if(!points?.length)return;
    const px=1/Math.max(.32,zoom);ctx.save();
    ctx.beginPath();for(const [i,p] of points.entries()){const q=project(p);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);}
    ctx.lineWidth=2*px;ctx.strokeStyle='#f1cb5c';ctx.setLineDash([5*px,4*px]);ctx.stroke();ctx.setLineDash([]);
    if(knots)for(const k of knots){
      const p=project(k),a=project(k.in),b=project(k.out);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(p.x,p.y);ctx.lineTo(b.x,b.y);ctx.lineWidth=1.5*px;ctx.strokeStyle='#f1cb5c';ctx.stroke();
      for(const q of [a,b]){ctx.beginPath();ctx.arc(q.x,q.y,5*px,0,2*Math.PI);ctx.fillStyle='#f1cb5c';ctx.fill();ctx.strokeStyle='#1a1f27';ctx.stroke();}
      ctx.fillStyle='#fff';ctx.fillRect(p.x-4*px,p.y-4*px,8*px,8*px);ctx.strokeStyle='#1688d0';ctx.strokeRect(p.x-4*px,p.y-4*px,8*px,8*px);
    }else for(const p of points){const q=project(p);ctx.fillStyle='#fff';ctx.fillRect(q.x-3*px,q.y-3*px,6*px,6*px);}
    ctx.restore();
  }
  return {border,refresh,begin,move,finish,draw,setCurveFinish,
    addAnchor(point){if(pending.length>=32){status('32 points maximum : valide le tracé.');return;}pending.push(point);refresh();redraw();},
    clear(){drag=null;id=null;pending=[];refresh();},
    selectRoute};
}
