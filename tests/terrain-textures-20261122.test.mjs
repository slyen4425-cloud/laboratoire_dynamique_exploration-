import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { materialPackV1 } from '../src/materials/material-pack-v1.js';
import { resolveMaterialAsset } from '../src/assets/material-asset-adapter.js';
import { SCULPT_SURFACE_MATERIALS, createSculptSurface, appendSculptSurfaceStroke } from '../src/world/sculpt-surface-paint.js';

const expected=[["grass.forest.tall","texture.grass.forest.tall.01","terrain_haute_herbe_01.webp","forest","9a127bde4f600d1fbb77fc8cb1a03f7bc05d569576805e98ad461bb59627a49b"],["grass.forest.flowers","texture.grass.forest.flowers.01","terrain_herbe_fleurie_01.webp","forest","6cef9ed6c7e12b67f1e9d2cb1ab2ba7d3f13908ef6e111a32797462ae92bfff0"],["ground.snow.rocky","texture.ground.snow.rocky.01","terrain_neige_rocheuse_01.webp","snow","2e336b9446c335b0cf5f1913b45dbae5a137cb691ab77bd2ff7dbc57337cda35"],["ground.dirt.textured","texture.ground.dirt.textured.01","terrain_sol_terre_01.webp","plain","e3d1958b076497b6b56b29a582792ad583a42d94cff7d2206efae5af691f1440"],["ground.volcanic.rocky","texture.ground.volcanic.rocky.01","terrain_sol_volcanique_01.webp","volcano","d14a157801e96c4a0e7121cb044799c1bfe17ea15125aa9e63029f417faf2cbc"]];
const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
const paint=html.match(/<select id="surface-material">([\s\S]*?)<\/select>/)?.[1]??'';
const base=html.match(/<select id="material">([\s\S]*?)<\/select>/)?.[1]??'';
const manifest=JSON.parse(readFileSync(new URL('../assets/exploration/materials/forest/manifest.v1.json',import.meta.url),'utf8'));

test('all five approved textures have native material IDs, real verified WebPs, and two visible paint selectors',()=>{
  for(const [materialId,assetId,fileName,family,sha256] of expected){
    const mat=materialPackV1.materials.find(m=>m.id===materialId);
    assert.equal(mat?.kind,'surface',materialId);
    assert.equal(mat?.terrainFamilyId,family);
    assert.equal(mat?.assets.base,assetId);
    const asset=resolveMaterialAsset(assetId);
    assert.equal(asset?.path,'./assets/exploration/materials/forest/surfaces/'+fileName);
    assert.ok(SCULPT_SURFACE_MATERIALS.some(m=>m.id===materialId&&m.kind==='zone'));
    assert.ok(paint.includes('value="'+materialId+'"'),'paint: '+materialId);
    assert.ok(base.includes('value="'+materialId+'"'),'base: '+materialId);
    const binary=readFileSync(new URL('../'+asset.path.slice(2),import.meta.url));
    assert.equal(binary.toString('ascii',0,4),'RIFF');
    assert.equal(binary.toString('ascii',8,12),'WEBP');
    assert.equal(createHash('sha256').update(binary).digest('hex'),sha256);
    const entry=manifest.files.find(m=>m.assetId===assetId);
    assert.equal(entry?.sha256,sha256);
    assert.equal(entry?.bytes,binary.length);
    assert.equal(entry?.width,128);
    assert.equal(entry?.height,128);
    const drawn=appendSculptSurfaceStroke(createSculptSurface(),{
      materialId,points:[{x:1,y:2},{x:40,y:20}],width:60
    });
    assert.equal(drawn.zones[0].terrainFamilyId,family);
    const custom=appendSculptSurfaceStroke(createSculptSurface(),{
      materialId,terrainFamilyId:'user-family-test',points:[{x:1,y:2},{x:40,y:20}],width:60
    });
    assert.equal(custom.zones[0].terrainFamilyId,'user-family-test');
  }
});
