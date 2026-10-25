import {interiorWallMaterial} from '../world/interior-material-catalog.js';

// Native Canvas wall finish: reusable, small repeating procedural tiles.
// This is an appearance adapter only. The wall segment in WorldArea owns collision.
const tiles=new Map();
function finish(ctx,key){
  const m=interiorWallMaterial(key);
  if(typeof document==='undefined'||typeof ctx.createPattern!=='function')return m.fill;
  let tile=tiles.get(m.id);
  if(!tile){
    tile=document.createElement('canvas');tile.width=72;tile.height=72;
    const g=tile.getContext('2d');
    g.fillStyle=m.fill;g.fillRect(0,0,72,72);
    g.lineWidth=2;g.strokeStyle=m.stroke;g.globalAlpha=.62;
    if(m.id==='wood'){
      for(let x=0;x<72;x+=18){
        g.beginPath();g.moveTo(x,0);g.lineTo(x,72);g.stroke();
        g.beginPath();g.moveTo(x+6,6);g.lineTo(x+6,62);g.stroke();
        g.beginPath();g.moveTo(x,32);g.lineTo(x+18,32);g.stroke();
      }
    }else if(m.id==='brick'||m.id==='stone'||m.id==='dark-stone'){
      const hh=m.id==='brick'?15:23, ww=m.id==='brick'?36:42;
      for(let row=0,y=0;y<=72;y+=hh,row++){
        g.beginPath();g.moveTo(0,y);g.lineTo(72,y);g.stroke();
        for(let x=-(row%2?ww/2:0);x<90;x+=ww){
          g.beginPath();g.moveTo(x,y);g.lineTo(x,y+hh);g.stroke();
        }
      }
    }else{
      g.fillStyle='#fff7df';g.globalAlpha=.18;
      for(let i=0;i<70;i++){const x=(i*37)%72,y=(i*23)%72;g.fillRect(x,y,1.4,1.4);}
    }
    tiles.set(m.id,tile);
  }
  return ctx.createPattern(tile,'repeat')??m.fill;
}
// Read-only V79 room envelope, authored in the SAME terrain/camera coordinate
// space as the existing Sculpt renderer. Collision remains in Collision World.
// Back and side walls are visible; the south/front wall is cut away so the
// hero and interior stay readable at camera 35–90°. No bitmap collision masks.
export function drawSculptInteriorWalls(ctx,terrain,{tileWidth=28,tileHeight=21,
  rise=18,wallLevels=2,doorway=null,doorScale=.58,walls=[],cameraPitch=1,
  stairPortals=[],boundaryPoints=null,wallMaterialId='plaster',doorImage=null,connectorImages=null}={}){
  if(!terrain)return;
  const w=terrain.width*tileWidth,h=terrain.height*tileHeight;
  const lift=wallLevels*rise/Math.max(.5,cameraPitch);
  const wallFinish=finish(ctx,wallMaterialId);
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  // For shaped rooms draw the canonical polygon perimeter. 2.5D wall
  // faces remain presentation only: Collision World reads WorldArea.boundary.
  if(Array.isArray(boundaryPoints)&&boundaryPoints.length>4){
    for(let i=0;i<boundaryPoints.length;i++){
      const a=boundaryPoints[i],b=boundaryPoints[(i+1)%boundaryPoints.length];
      const front=(a.y+b.y)*.5>h*.78;
      if(!front){
        ctx.fillStyle=wallFinish;ctx.beginPath();
        ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
        ctx.lineTo(b.x,b.y-lift);ctx.lineTo(a.x,a.y-lift);
        ctx.closePath();ctx.fill();
        ctx.strokeStyle='#d0b399';ctx.lineWidth=2.5;
        ctx.beginPath();ctx.moveTo(a.x,a.y-lift);
        ctx.lineTo(b.x,b.y-lift);ctx.stroke();
      }else{
        ctx.strokeStyle='rgba(237,208,173,.62)';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
    }
  }else{
  // Back wall — beyond the north edge, not covering the player.
  ctx.fillStyle=wallFinish;
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w,0);
  ctx.lineTo(w,-lift);ctx.lineTo(0,-lift);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#cbb69b';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(0,-lift);ctx.lineTo(w,-lift);ctx.stroke();
  // Left wall: a low, readable perimeter seen in oblique perspective.
  ctx.fillStyle=wallFinish;
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,h);
  ctx.lineTo(-14,h-lift);ctx.lineTo(-14,-lift);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#d0b399';ctx.beginPath();
  ctx.moveTo(0,-lift);ctx.lineTo(0,h-lift);ctx.stroke();
  // Right outline and front threshold only; do not paint opaque foreground
  // walls over the actor or over indoor furniture.
  ctx.strokeStyle='rgba(237,208,173,.78)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(w,0);ctx.lineTo(w,h);ctx.stroke();
  ctx.setLineDash([6,4]);ctx.strokeStyle='rgba(238,216,183,.45)';
  ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(w*.41,h);
  ctx.moveTo(w*.59,h);ctx.lineTo(w,h);ctx.stroke();
  }
  // The same WorldArea wall segments are rendered here as read-only geometry;
  // Collision World tests their original coordinates, not these polygons.
  for(const wall of [...walls].sort((a,b)=>
    (a.a.y+a.b.y)-(b.a.y+b.b.y))){
    const z=wall.height/Math.max(.5,cameraPitch);
    const a=wall.a,b=wall.b;
    const width=wall.thickness;
    ctx.fillStyle=wallFinish;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
    ctx.lineTo(b.x,b.y-z);ctx.lineTo(a.x,a.y-z);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='#dbc3a3';ctx.lineWidth=Math.max(2,width*.35);
    ctx.beginPath();ctx.moveTo(a.x,a.y-z);ctx.lineTo(b.x,b.y-z);ctx.stroke();
    ctx.strokeStyle='rgba(20,16,12,.36)';ctx.lineWidth=width;
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  // Explicit perimeter: shaped rooms visibly remove the excluded corners.
  if(boundaryPoints?.length>4){
    ctx.save();ctx.lineWidth=4;ctx.setLineDash([9,5]);ctx.strokeStyle='#f3cb82';
    ctx.beginPath();boundaryPoints.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.closePath();ctx.stroke();ctx.restore();
  }
  // Native Portal markers only: the transition and target Spawn are NOT
  // derived from the artwork. No second collision or stair authority.
  for(const portal of stairPortals){
    if(portal.trigger?.kind!=='point')continue;
    const {x,y}=portal.trigger;
    ctx.save();ctx.setLineDash([]);ctx.textAlign='center';
    const img=connectorImages?.get(portal.visual?.assetId);
    if(img?.complete&&img.naturalWidth){ctx.drawImage(img,x-31,y-65,62,71);}
    else if(portal.visual?.assetId==='ladder.wood'){
      ctx.lineWidth=5;ctx.strokeStyle='#b78654';
      ctx.beginPath();ctx.moveTo(x-20,y-57);ctx.lineTo(x-20,y+8);
      ctx.moveTo(x+20,y-57);ctx.lineTo(x+20,y+8);ctx.stroke();
      ctx.lineWidth=3;ctx.strokeStyle='#ebc48b';
      for(let yy=y-45;yy<=y;yy+=12){ctx.beginPath();ctx.moveTo(x-18,yy);ctx.lineTo(x+18,yy);ctx.stroke();}
    }
    ctx.fillStyle='rgba(43,39,32,.82)';ctx.strokeStyle='#e5be76';
    ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);
    ctx.fill();ctx.stroke();
    ctx.font='23px system-ui';ctx.fillStyle='#ffffff';
    ctx.fillText(portal.visual?.label?.startsWith('Monter')?'↑':'↓',x,y+8);
    ctx.restore();
  }
  // Temporary asset-independent door, sized like an actual standing door.
  // This visible doorway is anchored to the SAME exitPortal.trigger.
  if(doorway?.kind==='point'&&Number.isFinite(doorway.x)&&
     Number.isFinite(doorway.y)){
    const x=Math.max(46,Math.min(w-46,doorway.x));
    const baseY=doorway.y+9;
    const doorHeight=91/Math.max(.5,cameraPitch);
    const top=baseY-doorHeight;
    ctx.save();ctx.setLineDash([]);
    // Scale around the floor anchor. Door dimensions and gameplay Portal
    // collision are independent; the visible foot matches the true trigger.
    const size=Math.max(.35,Math.min(1.5,Number(doorScale)||.58));
    ctx.translate(x,baseY);ctx.scale(size,size);ctx.translate(-x,-baseY);
    ctx.fillStyle='rgba(0,0,0,.25)';
    ctx.beginPath();ctx.ellipse(x,baseY,42,12,0,0,Math.PI*2);ctx.fill();
    // Stone doorway, a wood panel and an arch with a clear top silhouette.
    if(doorImage?.complete&&doorImage.naturalWidth){
      ctx.drawImage(doorImage,x-37,top-9,74,doorHeight+12);
    }else{
    ctx.fillStyle='#65513f';ctx.fillRect(x-37,top-9,74,doorHeight+12);
    ctx.fillStyle='#ae906d';ctx.fillRect(x-35,top-7,70,doorHeight+9);
    ctx.fillStyle='#2b1b15';ctx.fillRect(x-30,top,60,doorHeight);
    ctx.fillStyle='#704329';ctx.fillRect(x-27,top+4,54,doorHeight-8);
    ctx.fillStyle='#93613c';ctx.fillRect(x-20,top+11,40,doorHeight*.36);
    ctx.fillRect(x-20,top+doorHeight*.57,40,doorHeight*.32);
    ctx.strokeStyle='#3d2419';ctx.lineWidth=3;
    ctx.strokeRect(x-20,top+11,40,doorHeight*.36);
    ctx.strokeRect(x-20,top+doorHeight*.57,40,doorHeight*.32);
    ctx.fillStyle='#e4c177';ctx.beginPath();
    ctx.arc(x+18,top+doorHeight*.61,4.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#c0a17a';ctx.beginPath();
    ctx.arc(x,top-7,37,Math.PI,2*Math.PI);ctx.lineTo(x+37,top-6);
    ctx.lineTo(x-37,top-6);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#edcf9b';ctx.lineWidth=3;
    ctx.strokeRect(x-35,top-5,70,doorHeight+8);
    }
    ctx.restore();
  }
  ctx.restore();
}
