import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {SCULPT_CLIFF_ATLAS_V47,cliffAtlasTheme,sculptCliffAtlasHasLayers,
  resolveSculptCliffAtlasUrl,drawSculptCliffAtlas} from '../src/render/sculpt-cliff-atlas.js';
import {SCULPT_ROCK_PALETTES} from '../src/render/sculpt-height-renderer.js';
const atlas=SCULPT_CLIFF_ATLAS_V47;
test('V47 six rock colors map into gray/ochre canonical illustrated bases',()=>{
  for(const theme of ['warm','slate','sandstone','dark','granite','ochre']){
    assert.ok(SCULPT_ROCK_PALETTES[theme]);
    assert.ok(['gray','ochre'].includes(cliffAtlasTheme(theme)));
  }
  assert.equal(cliffAtlasTheme('slate'),'gray');
  assert.equal(cliffAtlasTheme('granite'),'gray');
  assert.equal(cliffAtlasTheme('dark'),'gray');
  assert.equal(cliffAtlasTheme('warm'),'ochre');
  assert.equal(cliffAtlasTheme('sandstone'),'ochre');
  assert.equal(cliffAtlasTheme('ochre'),'ochre');
});
test('V47 every artist image occupies a unique internal atlas rectangle',()=>{
  assert.equal(atlas.width,192);assert.equal(atlas.height,160);
  assert.deepEqual(Object.keys(atlas.layers),['gray','ochre','cracks','chunks','moss']);
  const rectangles=Object.values(atlas.layers);
  for(const r of rectangles){
    assert.ok(r.x>=0&&r.y>=0&&r.width>0&&r.height>0);
    assert.ok(r.x+r.width<=atlas.width&&r.y+r.height<=atlas.height);
  }
  for(let i=0;i<rectangles.length;i++)for(let j=i+1;j<rectangles.length;j++){
    const a=rectangles[i],b=rectangles[j];
    const overlap=a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
    assert.equal(overlap,false,'atlas artwork rectangles may not overlap');
  }
  assert.ok(resolveSculptCliffAtlasUrl().endsWith('/assets/sculpt/cliff-atlas-v47.webp'));
});
test('V47 unloaded/unexpected atlas keeps the existing nonempty rock renderer fallback',()=>{
  assert.equal(sculptCliffAtlasHasLayers(null),false);
  assert.equal(sculptCliffAtlasHasLayers({complete:true,naturalWidth:128,naturalHeight:128}),false);
  assert.equal(sculptCliffAtlasHasLayers({complete:false,naturalWidth:192,naturalHeight:160}),false);
  assert.equal(drawSculptCliffAtlas({},{
    image:null,colors:SCULPT_ROCK_PALETTES.warm,x:10,y:10,width:40,height:36
  }),false);
});

test('V47 temporary asset SHA/bytes audit from committed runtime WebP',()=>{
  const bytes=readFileSync(new URL('../assets/sculpt/cliff-atlas-v47.webp',import.meta.url));
  const sha256=createHash('sha256').update(bytes).digest('hex');
  const manifest=JSON.parse(readFileSync(new URL('../assets/sculpt/cliff-atlas-v47.manifest.json',import.meta.url),'utf8'));
  assert.equal(bytes.length,manifest.bytes,'committed binary bytes must match pinned manifest');
  assert.equal(sha256,manifest.sha256,'committed SHA-256 must match pinned manifest');
  assert.equal(manifest.width,SCULPT_CLIFF_ATLAS_V47.width);
  assert.equal(manifest.height,SCULPT_CLIFF_ATLAS_V47.height);
  assert.deepEqual(manifest.layers,SCULPT_CLIFF_ATLAS_V47.layers);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(bytes.readUInt32LE(4)+8,bytes.length);
});
