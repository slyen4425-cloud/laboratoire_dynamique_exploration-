import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWorldObjectShadowSettingsV1,worldObjectShadowSettingsEqualV1,setWorldObjectShadowProfileV1,worldObjectShadowProfileForAssetV1} from '../src/world/world-object-shadow-settings-v1.js';
import {worldObjectShadowProjectionV1,worldObjectContactShadowV1,drawWorldObjectContactShadowV1} from '../src/render/world-object-renderer.js';
const base={mode:'custom',widthPct:125,heightPct:80,offsetXPct:10,offsetYPct:-10,opacityPct:35};
test('direction is optional, normalizes cyclically and does not alter legacy settings',()=>{
 assert.deepEqual(normalizeWorldObjectShadowSettingsV1(base),base);
 assert.deepEqual(normalizeWorldObjectShadowSettingsV1({...base,rotationDeg:360}),base);
 assert.deepEqual(normalizeWorldObjectShadowSettingsV1({...base,rotationDeg:Infinity}),base);
 assert.equal(normalizeWorldObjectShadowSettingsV1({...base,rotationDeg:-90}).rotationDeg,270);
 assert.equal(normalizeWorldObjectShadowSettingsV1({...base,rotationDeg:450}).rotationDeg,90);
 assert.equal(worldObjectShadowSettingsEqualV1(base,{...base,rotationDeg:90}),false);
 assert.equal(worldObjectShadowSettingsEqualV1(base,{...base,rotationDeg:360}),true);
});
test('model profiles retain rotation through JSON and equality; reset remains native',()=>{
 const p=setWorldObjectShadowProfileV1([],'tree.test',{...base,rotationDeg:90});
 const roundTrip=JSON.parse(JSON.stringify(p));
 assert.equal(worldObjectShadowProfileForAssetV1(roundTrip,'tree.test').rotationDeg,90);
 const updated=setWorldObjectShadowProfileV1(roundTrip,'tree.test',{...base,rotationDeg:180});
 assert.equal(worldObjectShadowProfileForAssetV1(updated,'tree.test').rotationDeg,180);
 assert.deepEqual(setWorldObjectShadowProfileV1(updated,'tree.test',null),[]);
});
test('direction rotates the existing projection around the unchanged foot; excluded types stay excluded',()=>{
 const args={width:100,height:200,footOffset:25,pitch:.7,shadow:base};
 const before=worldObjectShadowProjectionV1(args);
 const after=worldObjectShadowProjectionV1({...args,shadow:{...base,rotationDeg:90}});
 assert.equal(after.rotationDeg,90);
 const {rotationDeg,...rest}=after;
 assert.deepEqual(rest,before);
 assert.equal(worldObjectContactShadowV1({...args,kind:'bridge',shadow:{...base,rotationDeg:90}}),null);
});

test('real drawing path rotates exactly one alpha mask around the original contact point',()=>{
 const pixels=new Uint8ClampedArray(4*4*4).fill(255);
 const maskContext={drawImage(){},getImageData(){return {data:pixels}},fillRect(){}};
 const image={width:4,height:4,ownerDocument:{createElement(){return {getContext(){return maskContext}}}}};
 const draws=[];
 const ctx={save(){},restore(){},translate(...v){draws.push(['translate',...v])},
  transform(...v){draws.push(['transform',...v])},drawImage(){draws.push(['image'])},
  ellipse(){assert.fail('no extra contact ellipse for a valid silhouette')}};
 const args={kind:'tree',width:100,height:200,footOffset:25,pitch:.7,image,shadow:base};
 assert.equal(drawWorldObjectContactShadowV1(ctx,args),true);
 assert.equal(drawWorldObjectContactShadowV1(ctx,{...args,shadow:{...base,rotationDeg:90}}),true);
 assert.deepEqual(draws[0],draws[3]);
 assert.deepEqual(draws.filter(d=>d[0]==='image'),[['image'],['image']]);
 const [,a,b,c,d,e,f]=draws[1], [,A,B,C,D,E,F]=draws[4];
 for(const [actual,expected] of [[A,-b],[B,a],[C,-d],[D,c],[E,e],[F,f]])
  assert.ok(Math.abs(actual-expected)<1e-10);
});
