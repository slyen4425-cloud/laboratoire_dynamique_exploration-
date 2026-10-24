// Read-only V79 room envelope, authored in the SAME terrain/camera coordinate
// space as the existing Sculpt renderer. Collision remains in Collision World.
// Back and side walls are visible; the south/front wall is cut away so the
// hero and interior stay readable at camera 35–90°. No bitmap collision masks.
export function drawSculptInteriorWalls(ctx,terrain,{tileWidth=28,tileHeight=21,
  rise=18,wallLevels=2,doorway=null}={}){
  if(!terrain)return;
  const w=terrain.width*tileWidth,h=terrain.height*tileHeight;
  const lift=wallLevels*rise;
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  // Back wall — beyond the north edge, not covering the player.
  ctx.fillStyle='#92795e';
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w,0);
  ctx.lineTo(w,-lift);ctx.lineTo(0,-lift);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#cbb69b';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(0,-lift);ctx.lineTo(w,-lift);ctx.stroke();
  // Left wall: a low, readable perimeter seen in oblique perspective.
  ctx.fillStyle='#7d6956';
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
  // Decorative doorway derives from the one canonical exit Portal.
  // It NEVER creates independent geometry, collision or an extra trigger.
  if(doorway?.kind==='point'&&Number.isFinite(doorway.x)&&
     Number.isFinite(doorway.y)){
    const x=Math.max(26,Math.min(w-26,doorway.x));
    const y=h-2;
    ctx.fillStyle='#432e22';ctx.fillRect(x-23,y-5,46,9);
    ctx.fillStyle='#bc905e';ctx.fillRect(x-19,y-4,38,5);
    ctx.strokeStyle='#d8b787';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(x-25,y-27);
    ctx.lineTo(x-25,y+1);ctx.lineTo(x+25,y+1);
    ctx.lineTo(x+25,y-27);ctx.stroke();
    ctx.fillStyle='rgba(188,144,86,.28)';
    ctx.beginPath();ctx.ellipse(x,doorway.y,20,8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f7dfb7';ctx.font='bold 12px sans-serif';
    ctx.textAlign='center';ctx.fillText('🚪 Sortie',x,doorway.y-11);
  }
  ctx.restore();
}
