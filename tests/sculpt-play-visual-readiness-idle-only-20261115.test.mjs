import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {waitForSculptVisualImageV1,waitForSculptVisualSetV1}
 from '../src/play/sculpt-play-visual-readiness-v1.js';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function deferredImage(){
 const events={};
 const image={complete:false,naturalWidth:0,src:'https://test.invalid/tree.webp',
   addEventListener(name,fn){events[name]=fn;},
   removeEventListener(name,fn){if(events[name]===fn)delete events[name];},
   decode(){return Promise.resolve();}};
 return {image,load(){image.complete=true;image.naturalWidth=32;events.load?.();},
  fail(){image.complete=true;image.naturalWidth=0;events.error?.();}};
}
test('gameplay waits on real native images instead of two arbitrary RAFs',async()=>{
 const d=deferredImage();
 let finished=false;
 const pending=waitForSculptVisualImageV1(d.image).then(()=>finished=true);
 await Promise.resolve();
 assert.equal(finished,false,'image still undecoded; cannot show the map');
 d.load();await pending;
 assert.equal(finished,true);
});
test('loading failure does not fake a ready map; optional cliff atlas can fall back',async()=>{
 const d=deferredImage();
 const pending=waitForSculptVisualImageV1(d.image);
 d.fail();
 await assert.rejects(pending,/Texture non disponible/);
 const cliff=deferredImage();
 const optional=waitForSculptVisualImageV1(cliff.image,{optional:true});
 cliff.fail();await optional;
});
test('visual readiness handles cached decoded images without a second asset registry',async()=>{
 const obj={complete:true,naturalWidth:64,decode:()=>Promise.resolve()};
 await waitForSculptVisualSetV1([obj,obj]);
 assert.equal(await waitForSculptVisualImageV1(null),undefined);
});
test('hero oscillation remains idle only for saved hero, frame, and eight-way animation',()=>{
 const renderer=file('src/render/map-actor-renderer.js');
 assert.match(renderer,/if\(visual\.role==='hero'&&actor\.moving===true\)return 0/);
 assert.match(renderer,/Math\.sin\(timeSeconds/);
 const edit=file('hero-editor.html');
 assert.match(edit,/Oscillation au repos/);
 assert.match(edit,/id="hero-walk-amplitude"[^>]*disabled/);
});
test('native first launch and Portal keep masks through the same terrain and objects',()=>{
 const source=file('src/sculpt-lab-main.js');
 assert.match(source,/async function awaitSculptPlayArtReady\(\)/);
 assert.match(source,/await Promise\.all\(\[setTheme\(\),loadSurfacePaintAssets\(\),initialRibbonImagesReady,initialSphereImagesReady\]\)/);
 assert.match(source,/objectImage\(id\)/);
 assert.match(source,/await waitForSculptVisualSetV1\(objects/);
 assert.match(source,/await awaitSculptPlayArtReady\(\);\s*requestAnimationFrame\(\(\)=>requestAnimationFrame\(\(\)=>\{/);
 assert.match(source,/schema:'gensrpg\.exploration\.play\.ready\.v1'/);
 assert.match(source,/finally\{\s*if\(overlay\)\{[\s\S]*?await awaitSculptPlayArtReady\(\)/);
});
