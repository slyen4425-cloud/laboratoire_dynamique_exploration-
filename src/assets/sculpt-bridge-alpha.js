// Sculpt Bridge visual adapter: alpha-only cleanup once after WebP load.
// Never modifies committed binary, asset IDs, deck dimensions or collision.
export function cleanSculptBridgePixels({width,height,data}={}){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0||
     !data||data.length!==width*height*4)
    return Object.freeze({changed:false,removed:0,softened:0});
  const count=width*height,visited=new Uint8Array(count);
  const queue=new Int32Array(count),members=[];
  let removed=0,softened=0;
  for(let start=0;start<count;start++){
    if(visited[start]||data[start*4+3]<18)continue;
    let first=0,last=1,white=0;
    queue[0]=start;visited[start]=1;members.length=0;
    while(first<last){
      const index=queue[first++],offset=index*4;
      members.push(index);
      const minimum=Math.min(data[offset],data[offset+1],data[offset+2]);
      const maximum=Math.max(data[offset],data[offset+1],data[offset+2]);
      if(minimum>=226&&maximum-minimum<=24)white++;
      const x=index%width,y=Math.floor(index/width);
      // Eight-connected components preserve continuous diagonals of bridges.
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(dx===0&&dy===0)continue;
        const nx=x+dx,ny=y+dy;
        if(nx<0||ny<0||nx>=width||ny>=height)continue;
        const next=ny*width+nx;
        if(!visited[next]&&data[next*4+3]>=18){
          visited[next]=1;queue[last++]=next;
        }
      }
    }
    // Small, overwhelmingly chalk-white detached components are extraction
    // leftovers (e.g. white diamonds). Keep the bridge body and connected
    // highlights, even when they contain white paint or pale stones.
    if(members.length<=160&&white/members.length>=.86){
      for(const index of members){data[index*4+3]=0;removed++;}
      continue;
    }
    for(const index of members){
      const i=index*4,alpha=data[i+3];
      if(alpha>=190)continue;
      const lo=Math.min(data[i],data[i+1],data[i+2]);
      const hi=Math.max(data[i],data[i+1],data[i+2]);
      if(lo>=224&&hi-lo<=26){
        const reduced=Math.round(alpha*.65);
        if(reduced!==alpha){data[i+3]=reduced;softened++;}
      }
    }
  }
  return Object.freeze({changed:removed+softened>0,removed,softened});
}
export function prepareSculptBridgeImage(image,canvasFactory=()=>document.createElement('canvas')){
  if(!image?.naturalWidth||!image?.naturalHeight)return image;
  try{
    const canvas=canvasFactory();
    canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)return image;
    ctx.drawImage(image,0,0);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    const result=cleanSculptBridgePixels(pixels);
    if(!result.changed)return image;
    ctx.putImageData(pixels,0,0);
    return canvas;
  }catch{return image;}
}
