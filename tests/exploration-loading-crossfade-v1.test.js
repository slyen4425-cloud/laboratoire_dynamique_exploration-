import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mountCaptureLoadingArtCrossfadeV1} from '../src/play/exploration-loading-art-v1.js';

function element(){
 const node={style:{},dataset:{},children:[],parent:null,
  setAttribute(name,value){this[name]=value;},
  append(...items){items.forEach(item=>{item.parent=this;this.children.push(item);});},
  prepend(item){item.parent=this;this.children.unshift(item);},
  remove(){if(!this.parent)return;this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null;}
 };
 return node;
}
test('a short loader keeps its one original art and never creates a recurring timer',()=>{
 const host=element(),label=element();host.append(label);
 let scheduled=0;
 const fade=mountCaptureLoadingArtCrossfadeV1({
  host,images:['blob:https://example.org/single'],
  documentRef:{createElement:element},
  windowRef:{setTimeout(){scheduled++;return 1;},clearTimeout(){},matchMedia:()=>({matches:false})}
 });
 assert.equal(fade.active,true);
 assert.equal(scheduled,0);
 assert.equal(host.children.length,2);
 assert.equal(host.children[0].children[0].style.backgroundSize,'contain');
 fade.dispose();
 assert.equal(fade.active,false);
 assert.equal(host.children.length,1);
 assert.equal(label.style.position, '');
});
test('ten-second crossfade waits for image decode, then swaps without losing input and disposes',async()=>{
 const host=element(),button=element();host.append(button);
 let pending=[],cleared=[],decoded=0;
 class Img{set src(v){this.value=v;}async decode(){decoded++;}}
 const win={Image:Img,matchMedia:()=>({matches:false}),
  setTimeout(fn,ms){pending.push({fn,ms});return pending.length;},
  clearTimeout(id){cleared.push(id);}
 };
 const fade=mountCaptureLoadingArtCrossfadeV1({
  host,images:['blob:https://example.org/one','blob:https://example.org/two'],
  documentRef:{createElement:element},windowRef:win
 });
 assert.equal(pending[0].ms,10000);
 const layers=host.children[0].children;
 assert.equal(layers[0].style.opacity,'1');
 assert.equal(button.style.zIndex,'1');
 pending.shift().fn();
 for(let i=0;i<5;i++)await Promise.resolve();
 assert.equal(decoded,1);
 assert.equal(layers[0].style.opacity,'0');
 assert.equal(layers[1].style.opacity,'1');
 assert.equal(layers[1].style.transition,'opacity 700ms ease');
 fade.dispose();
 assert.equal(host.children.length,1);
 assert.equal(button.style.zIndex,'');
 assert.ok(cleared.length>0);
});
test('the same native owners retain readiness/cancellation; only artwork changes',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const encounter=read('src/encounters/immersive-encounter-host-v1.js');
 const sculpt=read('src/sculpt-lab-main.js');
 assert.match(encounter,/mountCaptureLoadingArtCrossfadeV1/);
 assert.match(encounter,/active\.crossfade\?\.dispose\(\);/);
 assert.match(encounter,/event\.data\.type==='gensrpg\.capture\.combat-ready\.v1'/);
 assert.match(sculpt,/crossfade\?\.dispose\(\);\s*overlay\.hidden=true;/);
 assert.match(sculpt,/await awaitSculptPlayArtReady\(\)/);
});
