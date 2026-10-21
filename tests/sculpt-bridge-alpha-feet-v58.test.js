import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cleanSculptBridgePixels} from '../src/assets/sculpt-bridge-alpha.js';
function fixture(){
 const width=64,height=64,data=new Uint8ClampedArray(width*height*4);
 const put=(x,y,rgb,alpha=255)=>data.set([...rgb,alpha],(y*width+x)*4);
 for(let y=30;y<=56;y++)for(let x=15;x<=29;x++)put(x,y,[115,111,100]);
 // Opaque white triangular garbage TOUCHING the dark masonry at x30.
 for(let y=44;y<=53;y++)for(let x=30;x<=45-(y-44);x++)put(x,y,[252,250,251]);
 // A true connected pale stone speck and one white bolt above the foot.
 put(20,50,[245,243,245]);put(20,35,[246,245,244]);
 // Ivory paint inside stone should remain (not on transparent exterior).
 put(26,40,[251,250,247]);
 return {width,height,data};
}
test('V58 strips large white polygons attached to masonry, not just detached diamonds',()=>{
 const p=fixture(),original=p.data.slice();
 const before=p.data[(46*p.width+35)*4+3];
 assert.equal(before,255);
 const result=cleanSculptBridgePixels(p);
 assert.ok(result.removed>70,'white polygon should be removed despite connected alpha');
 assert.equal(p.data[(46*p.width+35)*4+3],0);
 assert.equal(p.data[(50*p.width+20)*4+3],255,'connected pale stone highlight retained');
 assert.equal(p.data[(35*p.width+20)*4+3],255,'upper rail/bolt untouched');
 assert.equal(p.data[(30*p.width+20)*4+3],255,'masonry not erased');
 assert.deepEqual(Array.from(p.data.filter((_,i)=>i%4!==3)),
   Array.from(original.filter((_,i)=>i%4!==3)),'RGB original assets cannot be rewritten');
});
test('V58 conserves alpha content on upper bridge deck and refuses huge white stone surfaces',()=>{
 const width=64,height=64,data=new Uint8ClampedArray(width*height*4);
 for(let y=5;y<27;y++)for(let x=5;x<49;x++)data.set([248,247,248,255],(y*width+x)*4);
 const before=data.slice(),after=cleanSculptBridgePixels({width,height,data});
 assert.equal(after.removed,0);
 assert.deepEqual(data,before);
});
test('V58 only the cached Sculpt visual image is prepared; no game geometry changes',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const src=readFileSync(new URL('../src/assets/sculpt-bridge-alpha.js',import.meta.url),'utf8');
 assert.match(main,/prepareSculptBridgeImage\(picture\)/);
 assert.match(main,/sculpt-bridge-foot-clean-v58/);
 assert.match(page,/sculpt-(?:bridge-foot-clean-v58|hill-shoulder-v59|bridge-crossing-v60|whole-hill-v61|bridge-bank-v62|high-platform-bridge-v63)/);
 assert.match(src,/visitedWhite=new Uint8Array\(count\)/);
 assert.doesNotMatch(src,/WorldDocument|isBlocked\(/);
});
