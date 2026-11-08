// Read-only UI readiness cache for the World Portal button.
// The World Builder draft and its WorldArea object identity are the keys.
// It never owns scene authoring, transport or collision. The actual entry
// performs its own fresh validation in sculptWorldAreaScene.
export function createSculptPlaySceneReadinessCacheV1(validateScene){
 if(typeof validateScene!=='function')
  throw new TypeError('Official scene validator required');
 let currentDocument=null,checked=new WeakMap();
 return function previewReadiness(area,worldDocument){
  if(worldDocument!==currentDocument){
   currentDocument=worldDocument;
   checked=new WeakMap();
  }
  if(area&&typeof area==='object'){
   const saved=checked.get(area);
   if(saved)return saved;
  }
  let value;
  try{
   validateScene(area);
   value=Object.freeze({ok:true});
  }catch(error){
   value=Object.freeze({ok:false,error:String(error?.message??error)});
  }
  if(area&&typeof area==='object')checked.set(area,value);
  return value;
 };
}
