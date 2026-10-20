// Sculpt "Tester" only: deterministic lightweight Canvas sky beyond the map.
// No image generation, assets, physics, weather gameplay, timers or World state.
export const SCULPT_SKY_PRESETS=Object.freeze({
  morning:Object.freeze({label:'Matin',zenith:'#87a9c9',horizon:'#ffe0b1',bottom:'#c4d1bc',
    ridgeFar:'#9f9ab5',ridgeNear:'#767f91',cloud:'rgba(255,243,226,.72)',fog:'rgba(255,233,202,.43)'}),
  midday:Object.freeze({label:'Midi',zenith:'#68b0dc',horizon:'#d5e9e5',bottom:'#a7cdb9',
    ridgeFar:'#97b4b4',ridgeNear:'#6c9697',cloud:'rgba(255,255,255,.80)',fog:'rgba(228,251,249,.39)'}),
  evening:Object.freeze({label:'Soir',zenith:'#364572',horizon:'#eaa17d',bottom:'#aa8c92',
    ridgeFar:'#77718c',ridgeNear:'#5b5974',cloud:'rgba(255,206,176,.57)',fog:'rgba(248,197,174,.34)'}),
  night:Object.freeze({label:'Nuit',zenith:'#081529',horizon:'#293858',bottom:'#344964',
    ridgeFar:'#34465a',ridgeNear:'#25384d',cloud:'rgba(148,169,196,.22)',fog:'rgba(96,124,157,.21)'})
});
export const SCULPT_SKY_DEFAULTS=Object.freeze({time:'midday',clouds:true,mist:true,stars:true});
export function sculptSkyPreset(time){return SCULPT_SKY_PRESETS[time]??SCULPT_SKY_PRESETS.midday;}
const noise=(n)=>{let t=Math.imul(n+33,1103515245)+12345; t^=t>>>13;return ((t>>>0)%10000)/10000;};

function ridge(ctx,width,height,base,phase,color){
  ctx.beginPath();ctx.moveTo(0,height);
  ctx.lineTo(0,base);
  const steps=18;
  for(let i=1;i<=steps;i++){
    const x=i/steps*width;
    const mountain=(noise(i*17+phase)*.58+noise(i*7+phase+4)*.42)*height*.10;
    ctx.lineTo(x,base-mountain);
  }
  ctx.lineTo(width,height);ctx.closePath();ctx.fillStyle=color;ctx.fill();
}
function cloud(ctx,x,y,w,h,color){
  ctx.save();ctx.fillStyle=color;
  ctx.beginPath();
  ctx.ellipse(x-w*.20,y,w*.29,h*.36,0,0,Math.PI*2);
  ctx.ellipse(x+w*.05,y-h*.19,w*.25,h*.45,0,0,Math.PI*2);
  ctx.ellipse(x+w*.33,y,w*.25,h*.32,0,0,Math.PI*2);
  ctx.fill();ctx.restore();
}
export function drawSculptSkyBackdrop(ctx,{width,height,time='midday',clouds=true,mist=true,stars=true}={}){
  const w=Math.max(1,Number(width)||1),h=Math.max(1,Number(height)||1);
  const preset=sculptSkyPreset(time),night=preset===SCULPT_SKY_PRESETS.night;
  // Always opaque: the old dark canvas should never show behind the map.
  const sky=ctx.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,preset.zenith);
  sky.addColorStop(.68,preset.horizon);
  sky.addColorStop(1,preset.bottom);
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  let starsDrawn=0,cloudsDrawn=0;
  if(night&&stars){
    ctx.save();ctx.fillStyle='rgba(244,249,255,.75)';
    for(let i=0;i<72;i++){
      const x=noise(i*37+71)*w,y=noise(i*19+117)*h*.59;
      const radius=.35+noise(i*13+4)*1.05;
      ctx.globalAlpha=.43+noise(i*11+9)*.53;
      ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();starsDrawn++;
    }
    ctx.restore();
  }
  if(clouds){
    for(let i=0;i<5;i++){
      const x=(.11+i*.21+noise(90+i)*.04)*w;
      const y=(.19+noise(12+i*5)*.21)*h;
      cloud(ctx,x,y,w*(.14+noise(i+8)*.08),h*.064,preset.cloud);
      cloudsDrawn++;
    }
  }
  // Soft distant horizon: decorative silhouettes, never extra walkable terrain.
  ridge(ctx,w,h,h*.85,28,preset.ridgeFar);
  ridge(ctx,w,h,h*.94,64,preset.ridgeNear);
  if(mist){
    const band=ctx.createLinearGradient(0,h*.59,0,h);
    band.addColorStop(0,'rgba(255,255,255,0)');
    band.addColorStop(.54,preset.fog);
    band.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=band;ctx.fillRect(0,h*.59,w,h*.41);
  }
  return Object.freeze({time:night?'night':time in SCULPT_SKY_PRESETS?time:'midday',
    night,starsDrawn,cloudsDrawn,mist:!!mist});
}
