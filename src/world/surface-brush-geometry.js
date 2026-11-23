// Shared WorldSurface square paint footprint. This is geometry, not a second
// renderer, terrain family, movement engine, or persistent layer.
// The square brush sweeps an axis-aligned (map-grid) square along each path
// segment. Identical geometry is used by rendering, encounters and traversal.
export function normalizeSurfaceBrushShape(raw){
  return raw==='square'?'square':'round';
}

export function squareSurfaceStrokePolygon(a,b,halfWidth){
  if(!a||!b||!(halfWidth>0))return [];
  const corners=[];
  for(const p of [a,b])
    for(const dx of [-halfWidth,halfWidth])
      for(const dy of [-halfWidth,halfWidth])
        corners.push({x:p.x+dx,y:p.y+dy});
  corners.sort((p,q)=>p.x-q.x||p.y-q.y);
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const lower=[],upper=[];
  for(const p of corners){
    while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();
    lower.push(p);
  }
  for(let i=corners.length-1;i>=0;i--){
    const p=corners[i];
    while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();
    upper.push(p);
  }
  lower.pop();upper.pop();
  return [...lower,...upper];
}

function squareIntersectsSegment(a,b,x,y,halfWidth){
  let lo=0,hi=1;
  for(const key of ['x','y']){
    const d=b[key]-a[key],target=key==='x'?x:y;
    if(Math.abs(d)<1e-10){
      if(Math.abs(a[key]-target)>halfWidth)return false;
      continue;
    }
    const p=(target-halfWidth-a[key])/d,q=(target+halfWidth-a[key])/d;
    lo=Math.max(lo,Math.min(p,q));
    hi=Math.min(hi,Math.max(p,q));
    if(lo>hi+1e-9)return false;
  }
  return true;
}

export function squareSurfaceStrokeContainsPoint(points,x,y,halfWidth){
  if(!Array.isArray(points)||points.length<2||!Number.isFinite(x)||
    !Number.isFinite(y)||!(halfWidth>=0))return false;
  for(let i=1;i<points.length;i++)
    if(squareIntersectsSegment(points[i-1],points[i],x,y,halfWidth))
      return true;
  return false;
}

// Each canvas consumer chooses material, alpha and clipping. Geometry stays
// here: no guessed square stamps in a second painter and no off-by-one gaps.
export function drawSquareSurfaceStrokePath(ctx,points,width,offsetX=0,offsetY=0){
  if(!Array.isArray(points)||points.length<2||!(width>0))return false;
  ctx.beginPath();
  for(let i=1;i<points.length;i++){
    const polygon=squareSurfaceStrokePolygon(points[i-1],points[i],width/2);
    if(!polygon.length)continue;
    ctx.moveTo(polygon[0].x+offsetX,polygon[0].y+offsetY);
    for(let j=1;j<polygon.length;j++)
      ctx.lineTo(polygon[j].x+offsetX,polygon[j].y+offsetY);
    ctx.closePath();
  }
  return true;
}
