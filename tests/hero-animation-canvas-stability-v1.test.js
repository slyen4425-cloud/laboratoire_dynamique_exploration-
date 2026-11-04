import test from 'node:test';
import assert from 'node:assert/strict';
import {createMapActorVisualPreparer} from '../src/assets/map-actor-visual-preparer.js';

function makeCanvas(){
 const image={width:128,height:128};
 const canvases=[];
 const canvasFactory=()=>{
  const context={
   clearRect(){},drawImage(){},putImageData(){},
   createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},
   getImageData(x,y,w,h){
    const data=new Uint8ClampedArray(w*h*4);
    for(let py=32;py<96;py++)for(let px=48;px<80;px++)
     data[(py*w+px)*4+3]=255;
    return {data};
   }
  };
  const canvas={width:0,height:0,getContext(){return context}};
  canvases.push(canvas);return canvas;
 };
 const preparer=createMapActorVisualPreparer({imageLoader:{get:id=>id==='frame.one'?image:null},canvasFactory});
 return {preparer,canvases};
}
test('animated hero frame keeps the FULL authored canvas to prevent moving silhouettes from jumping',()=>{
 const {preparer}=makeCanvas();
 preparer.prepare(['frame.one'],{preserveCanvas:true});
 const output=preparer.get('frame.one');
 assert.equal(output.width,128);
 assert.equal(output.height,128);
 assert.equal(output.aspectRatio,1);
 assert.deepEqual(output.anchor,{x:.5,y:.96});
});
test('historical single-image mode keeps transparent-margin crop and automatic anchor',()=>{
 const {preparer}=makeCanvas();
 preparer.prepare(['frame.one']);
 const output=preparer.get('frame.one');
 assert.equal(output.width,32);
 assert.equal(output.height,64);
});
test('same prepared asset may not silently change between full-frame and cropped geometry',()=>{
 const {preparer}=makeCanvas();
 preparer.prepare(['frame.one'],{preserveCanvas:true});
 assert.throws(()=>preparer.prepare(['frame.one'],{preserveCanvas:false}),/mode|canvas|prepar/i);
});
