import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptSurface,appendSculptSurfaceStroke,normalizeSculptSurface} from '../src/world/sculpt-surface-paint.js';
const points=[{x:10,y:10},{x:30,y:30}];
test('painted terrain family is explicit and independent of visual material',()=>{
 const surface=appendSculptSurfaceStroke(createSculptSurface(),{materialId:'ground.snow',terrainFamilyId:'volcano',points});
 assert.equal(surface.zones[0].terrainFamilyId,'volcano');
 assert.equal(surface.zones[0].materialId,'ground.snow');
});
test('unknown terrain family is rejected both during painting and import',()=>{
 assert.throws(()=>appendSculptSurfaceStroke(createSculptSurface(),{materialId:'ground.snow',terrainFamilyId:'desert',points}),RangeError);
 const surface=appendSculptSurfaceStroke(createSculptSurface(),{materialId:'ground.snow',terrainFamilyId:'sand',points});
 assert.throws(()=>normalizeSculptSurface({...surface,zones:[{...surface.zones[0],terrainFamilyId:'desert'}]}),RangeError);
});
