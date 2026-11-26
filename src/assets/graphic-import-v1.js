import {GRAPHIC_IMPORT_MAX_BYTES,GRAPHIC_IMPORT_MAX_FRAMES,GRAPHIC_IMPORT_MAX_DIMENSION,GRAPHIC_IMPORT_MAX_PIXELS,graphicAnimationFromGrid,planGraphicFrameAtlas} from './graphic-animation-v1.js';
const allowed=new Set(['image/png','image/jpeg','image/webp']);
const fail=message=>{throw Error(message);};
function checkedFile(file,types=allowed){
 if(!(file instanceof Blob)||!types.has(file.type)||file.size<1||file.size>GRAPHIC_IMPORT_MAX_BYTES)
  fail('Image invalide : PNG, JPEG, WebP ou GIF selon le mode, 8 Mio maximum.');
}
function checkedDimensions(width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<16||height<16||
    width>GRAPHIC_IMPORT_MAX_DIMENSION||height>GRAPHIC_IMPORT_MAX_DIMENSION||
    width*height>GRAPHIC_IMPORT_MAX_PIXELS)fail('Dimensions hors limites (16 à 4096 px).');
}
function canvasBlob(canvas){
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Encodage PNG impossible.')),'image/png'));
}
// Input is prepared completely before any existing asset store is written.
// Frame bitmaps are released individually, not retained for the whole animation.
export async function prepareGraphicImport({files,mode='static',columns=1,rows=1,frames,fps=8}={},{
 decode=globalThis.createImageBitmap,makeCanvas=()=>document.createElement('canvas'),ImageDecoderClass=globalThis.ImageDecoder
}={}){
 const list=Array.from(files??[]);
 if(!list.length||list.length>GRAPHIC_IMPORT_MAX_FRAMES)fail('Choisis entre 1 et 64 images.');
 if(list.reduce((sum,f)=>sum+(f?.size??Infinity),0)>GRAPHIC_IMPORT_MAX_BYTES)fail('Import limité à 8 Mio au total.');
 if(typeof decode!=='function')fail('Décodeur d’images indisponible.');
 const decodeImage=async file=>{checkedFile(file);const image=await decode(file);try{checkedDimensions(image.width,image.height);return image;}catch(e){image.close?.();throw e;}};
 const result=(blob,width,height,animation,sourceName)=>{
  checkedFile(blob);return Object.freeze({blob,mimeType:blob.type,bytes:blob.size,width,height,animation,sourceName:sourceName||'ressource'});
 };
 if(mode==='static'||mode==='sheet'){
  if(list.length!==1)fail('Ce mode attend une seule image.');
  const image=await decodeImage(list[0]);
  try{
   const a=mode==='sheet'?graphicAnimationFromGrid({width:image.width,height:image.height,columns,rows,frames:frames??columns*rows,fps}):null;
   return result(list[0],image.width,image.height,a,list[0].name);
  }finally{image.close?.();}
 }
 if(mode!=='frames'&&mode!=='gif')fail('Mode d’import inconnu.');
 let decoder=null;
 try{
  let count=list.length,first,readFrame;
  if(mode==='gif'){
   if(list.length!==1)fail('Choisis un seul GIF.');
   checkedFile(list[0],new Set(['image/gif']));
   if(typeof ImageDecoderClass!=='function'||!(await ImageDecoderClass.isTypeSupported('image/gif')))
    fail('Décodage GIF indisponible dans ce navigateur. Utilise une planche ou des PNG.');
   decoder=new ImageDecoderClass({data:await list[0].arrayBuffer(),type:'image/gif'});
   await decoder.tracks.ready;
   await decoder.completed;
   count=decoder.tracks.selectedTrack?.frameCount;
   if(!Number.isInteger(count)||count<1||count>GRAPHIC_IMPORT_MAX_FRAMES)fail('GIF limité à 64 frames.');
   readFrame=async i=>(await decoder.decode({frameIndex:i,completeFramesOnly:true})).image;
   first=await readFrame(0);
  }else{
   // Explicit selection order is kept. The UI can reorder before preparing.
   readFrame=i=>decodeImage(list[i]);first=await readFrame(0);
  }
  const widthOf=f=>f.displayWidth??f.width,heightOf=f=>f.displayHeight??f.height;
  let plan,canvas,ctx;
  try{
   const w=widthOf(first),h=heightOf(first);checkedDimensions(w,h);
   plan=planGraphicFrameAtlas(w,h,count,fps);
   canvas=makeCanvas();canvas.width=plan.width;canvas.height=plan.height;
   ctx=canvas.getContext('2d');if(!ctx)fail('Canvas indisponible.');
   ctx.drawImage(first,0,0,w,h);
  }finally{first.close?.();}
  const a=plan.animation;
  for(let i=1;i<count;i++){
   const image=await readFrame(i);
   try{
    if(widthOf(image)!==a.frameWidth||heightOf(image)!==a.frameHeight)fail('Toutes les frames doivent avoir les mêmes dimensions.');
    ctx.drawImage(image,(i%a.columns)*a.frameWidth,Math.floor(i/a.columns)*a.frameHeight,a.frameWidth,a.frameHeight);
   }finally{image.close?.();}
  }
  const blob=await canvasBlob(canvas);
  return result(blob,plan.width,plan.height,a,list[0].name);
 }finally{decoder?.close();}
}
