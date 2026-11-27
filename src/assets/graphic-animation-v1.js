// One validated sprite-atlas descriptor shared by the existing object and material
// owners. Static assets omit animation entirely; existing native data is unchanged.
export const GRAPHIC_IMPORT_MAX_BYTES=8*1024*1024;
export const GRAPHIC_IMPORT_MAX_FRAMES=64;
export const GRAPHIC_IMPORT_MAX_DIMENSION=4096;
export const GRAPHIC_IMPORT_MAX_PIXELS=16*1024*1024;
export function normalizeGraphicAnimation(animation,width,height){
 if(animation==null)return null;
 const {frames,columns,frameWidth,frameHeight,fps}=animation;
 if(![frames,columns,frameWidth,frameHeight,width,height].every(Number.isInteger)||
    frames<1||frames>GRAPHIC_IMPORT_MAX_FRAMES||columns<1||columns>frames||
    frameWidth<16||frameHeight<16||width!==columns*frameWidth||
    height!==Math.ceil(frames/columns)*frameHeight||
    width>GRAPHIC_IMPORT_MAX_DIMENSION||height>GRAPHIC_IMPORT_MAX_DIMENSION||
    width*height>GRAPHIC_IMPORT_MAX_PIXELS||!Number.isFinite(fps)||fps<1||fps>30)
   throw Error('Planche de sprites invalide : dimensions, nombre de frames ou FPS.');
 return Object.freeze({frames,columns,frameWidth,frameHeight,fps});
}
export function graphicAnimationFromGrid({width,height,columns,rows,frames=columns*rows,fps=8}){
 if(!Number.isInteger(rows)||rows<1||!Number.isInteger(columns)||columns<1||
    frames>columns*rows||frames<=(rows-1)*columns)
   throw Error('La grille doit contenir les frames sans ligne vide.');
 return normalizeGraphicAnimation({frames,columns,frameWidth:width/columns,frameHeight:height/rows,fps},width,height);
}
export function planGraphicFrameAtlas(frameWidth,frameHeight,frames,fps=8){
 if(!Number.isInteger(frameWidth)||!Number.isInteger(frameHeight)||!Number.isInteger(frames)||
    frameWidth<16||frameHeight<16||frames<1||frames>GRAPHIC_IMPORT_MAX_FRAMES)
   throw Error('Dimensions ou nombre de frames invalide.');
 const maxColumns=Math.min(frames,Math.floor(GRAPHIC_IMPORT_MAX_DIMENSION/frameWidth));
 for(let columns=Math.min(maxColumns,Math.ceil(Math.sqrt(frames*frameHeight/frameWidth)));columns<=maxColumns&&columns>0;columns++){
  const width=columns*frameWidth,height=Math.ceil(frames/columns)*frameHeight;
  if(height<=GRAPHIC_IMPORT_MAX_DIMENSION&&width*height<=GRAPHIC_IMPORT_MAX_PIXELS)
   return Object.freeze({width,height,animation:normalizeGraphicAnimation({frames,columns,frameWidth,frameHeight,fps},width,height)});
 }
 throw Error('Animation trop volumineuse : réduis les dimensions ou le nombre de frames.');
}
