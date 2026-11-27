import {prepareGraphicImport} from './graphic-import-v1.js';
import {drawWorldObjectSprite} from '../render/world-object-frame-selector.js';
export function graphicImportMarkup(){
 return `<label>Format <select data-graphic-import="mode"><option value="static">Image simple</option><option value="sheet">Planche de sprites</option><option value="frames">Images multiples</option><option value="gif">GIF animé</option><option value="zip">ZIP de frames</option></select></label>
 <label>Fichier(s) <input type="file" data-graphic-import="file"></label>
 <div data-graphic-import="order" hidden></div>
 <div data-graphic-import="grid" hidden><label>Colonnes <input type="number" data-graphic-import="columns" min="1" max="64" value="3"></label><label>Lignes <input type="number" data-graphic-import="rows" min="1" max="64" value="3"></label><label>Frames (facultatif) <input type="number" data-graphic-import="frames" min="1" max="64"></label></div>
 <label data-graphic-import="speed" hidden>Vitesse FPS <input type="number" data-graphic-import="fps" min="1" max="30" value="8"></label>
 <button type="button" data-graphic-import="preview">Prévisualiser</button><canvas data-graphic-import="canvas" hidden></canvas>
 <output data-graphic-import="status" role="status" aria-live="polite"></output>
 <button type="button" data-graphic-import="commit" disabled>Enregistrer dans la bibliothèque</button>`;
}
// Presentation and decoding only: a consumer supplies the existing asset store.
export function createGraphicImportControls({root,onImport}){
 const $=key=>root.querySelector('[data-graphic-import="'+key+'"]');
 const mode=$('mode'),file=$('file'),canvas=$('canvas'),status=$('status'),order=$('order');
 let files=[],prepared=null,bitmap=null,timer=0,busy=false,disposed=false;
 const stop=()=>{clearTimeout(timer);timer=0;bitmap?.close?.();bitmap=null;};
 function dirty(){prepared=null;stop();canvas.hidden=true;$('commit').disabled=true;status.textContent='Prépare le visuel avant de l’enregistrer.';}
 function displayOrder(){
  order.replaceChildren(...files.map((item,i)=>{
   const row=document.createElement('div'),label=document.createElement('span');label.textContent=item.name;row.append(label);
   for(const direction of [-1,1]){
    const button=document.createElement('button');button.type='button';button.textContent=direction<0?'↑':'↓';
    button.setAttribute('aria-label',direction<0?'Monter la frame':'Descendre la frame');
    button.disabled=busy||i+direction<0||i+direction>=files.length;
    button.addEventListener('click',()=>{[files[i],files[i+direction]]=[files[i+direction],files[i]];dirty();displayOrder();});row.append(button);
   }return row;
  }));
 }
 function lock(value){
  busy=value;for(const el of root.querySelectorAll('input,select,button'))el.disabled=value;
  $('commit').disabled=value||!prepared;displayOrder();
 }
 function updateMode(){
  file.multiple=mode.value==='frames';
  file.accept=mode.value==='gif'?'image/gif':mode.value==='zip'?'.zip,application/zip':'image/png,image/jpeg,image/webp';
  $('grid').hidden=mode.value!=='sheet';$('speed').hidden=mode.value==='static';order.hidden=mode.value!=='frames';
  file.value='';files=[];dirty();displayOrder();
 }
 mode.addEventListener('change',updateMode);
 file.addEventListener('change',()=>{files=Array.from(file.files??[]);dirty();displayOrder();});
 for(const key of ['columns','rows','frames','fps'])$(key).addEventListener('input',dirty);
 async function prepare(){
  if(busy||disposed)return;dirty();lock(true);
  try{
   const a=await prepareGraphicImport({files,mode:mode.value,columns:Number($('columns').value),rows:Number($('rows').value),frames:$('frames').value?Number($('frames').value):undefined,fps:Number($('fps').value)});
   if(disposed)return;const img=await createImageBitmap(a.blob);if(disposed){img.close();return;}bitmap=img;
   const frame=a.animation,w=frame?.frameWidth??a.width,h=frame?.frameHeight??a.height,ratio=Math.min(1,220/w,160/h);
   canvas.width=Math.max(1,Math.round(w*ratio));canvas.height=Math.max(1,Math.round(h*ratio));canvas.hidden=false;
   const ctx=canvas.getContext('2d'),start=performance.now();
   const draw=()=>{
    if(!bitmap||disposed)return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawWorldObjectSprite(ctx,bitmap,{animation:frame},{x:0,y:0,width:canvas.width,height:canvas.height},(performance.now()-start)/1000);
    if(frame&&root.isConnected&&!canvas.hidden&&root.closest('details')?.open!==false)timer=setTimeout(draw,Math.max(33,1000/frame.fps));
   };draw();prepared=a;
   status.textContent=frame?frame.frames+' frames · '+w+' × '+h+' · '+frame.fps+' FPS':w+' × '+h+' px';
  }catch(error){stop();status.textContent='Import refusé : '+error.message;}
  finally{if(!disposed)lock(false);}
 }
 $('preview').addEventListener('click',prepare);
 $('commit').addEventListener('click',async()=>{
  if(busy||!prepared||disposed)return;lock(true);
  try{const result=await onImport(prepared);dirty();files=[];file.value='';status.textContent=result||'Ressource enregistrée.';}
  catch(error){status.textContent='Enregistrement impossible : '+error.message;}
  finally{if(!disposed)lock(false);}
 });
 root.closest('details')?.addEventListener('toggle',event=>{if(!event.currentTarget.open&&!busy)dirty();});
 updateMode();return Object.freeze({dispose(){disposed=true;dirty();},prepare});
}
