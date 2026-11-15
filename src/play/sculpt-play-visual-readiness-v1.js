// Read-only synchronization on assets already owned by the Sculpt renderer.
// No new image cache, material registry, world state, timer or loading UI.
export function waitForSculptVisualImageV1(image,{optional=false}={}){
 if(!image)return Promise.resolve();
 const finish=()=>{
   if(!optional && image.naturalWidth===0)
     throw new Error('Une image de la carte ne peut pas être décodée : '+(image.src??''));
   // decode() waits for painting readiness even when image.onload already ran.
   return typeof image.decode==='function'
    ?Promise.resolve(image.decode()).catch(error=>{
       if(!optional)throw error;
     }):Promise.resolve();
 };
 if(image.complete===true)return Promise.resolve().then(finish);
 return new Promise((resolve,reject)=>{
   const cleanup=()=>{image.removeEventListener('load',loaded);image.removeEventListener('error',failed);};
   const loaded=()=>{cleanup();Promise.resolve().then(finish).then(resolve,reject);};
   const failed=()=>{cleanup();if(optional)resolve();else reject(new Error('Texture non disponible : '+(image.src??'')));};
   image.addEventListener('load',loaded);
   image.addEventListener('error',failed);
   // The image can finish in the interval between .complete and listeners.
   if(image.complete===true)loaded();
 });
}
export async function waitForSculptVisualSetV1(images){
 await Promise.all(images.map(image=>waitForSculptVisualImageV1(image)));
}
