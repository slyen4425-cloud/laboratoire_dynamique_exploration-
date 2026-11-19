import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankWorldBuilderDraft,addWorldArea,connectWorldAreas,
 serializeWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {createBlankSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {appendSculptSurfaceStroke} from '../src/world/sculpt-surface-paint.js';
import {createSculptDecorativeFringeV1,paintSculptDecorativeFringeSurfaceV1}
 from '../src/world/sculpt-decorative-fringe-v1.js';
import {saveSculptWorldArea,sculptWorldAreaScene}
 from '../src/builder/sculpt-world-area-link.js';
import {importSculptMapPreset,createSculptMapPreset,createWorldAreaFromSculptMapPreset}
 from '../src/builder/sculpt-map-preset-library.js';
import {exportWorldAreaAsMapPresetV1} from '../src/builder/world-assembler-map-preset-export-v1.js';

const blankWorld=()=>createBlankWorldBuilderDraft({
 id:'un-monde-auteur',width:36*28,height:24*21
});
const page=readFileSync(new URL('../world-assembler.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/builder/world-assembler-main.js',import.meta.url),'utf8');

test('World Builder shows one export-map button alongside EXISTING full-world export',()=>{
 assert.match(page,/id="export-selected-map-preset"/);
 assert.match(page,/id="export-world"/);
 assert.match(page,/Monde = zones et passages/);
 assert.match(app,/exportWorldAreaAsMapPresetV1\(draft,selectedId\)/);
 assert.match(app,/link\.download=file\.fileName/);
 assert.equal((app.match(/on\(byId\('export-selected-map-preset'\)/g)||[]).length,1);
});

test('native preset from selected WorldArea is a single importable JSON, without changing world or portals',()=>{
 let world=blankWorld();
 world=addWorldArea(world,{name:'Forêt des rives',width:36*28,height:24*21});
 world=connectWorldAreas(world,{sourceAreaId:world.initialAreaId,
  targetAreaId:world.areas[1].id,returnPortal:true});
 const selected=world.areas[1],before=serializeWorldBuilderDraft(world);
 const scene=createBlankSculptPreviewScene({width:36,height:24});
 const painted=appendSculptSurfaceStroke(scene.surface,{
   materialId:'ground.snow',points:[{x:150,y:190}],width:35});
 const paintedWorld=saveSculptWorldArea(world,selected.id,{...scene,surface:painted});
 const snap=serializeWorldBuilderDraft(paintedWorld);
 const exportFile=exportWorldAreaAsMapPresetV1(paintedWorld,selected.id);
 assert.match(exportFile.fileName,/\.map-preset\.json$/);
 const exported=JSON.parse(exportFile.json);
 assert.equal(exported.kind,'gensrpg-sculpt-map-preset');
 assert.equal(exported.scene.terrain.width,36);
 assert.equal(exported.scene.surface.zones.length,1);
 assert.equal('portals' in exported,false);
 assert.equal('spawns' in exported,false);
 assert.equal('worldDocument' in exported,false);
 assert.deepEqual(importSculptMapPreset(exportFile.json),exported);
 assert.equal(serializeWorldBuilderDraft(paintedWorld),snap,'Export must not save/mutate anything');
 assert.notEqual(snap,before,'fixture really has a painted map');
 const target=createWorldAreaFromSculptMapPreset(blankWorld(),exported,{name:'Carte importée'});
 const imported=target.areas.find(a=>a.id!==target.initialAreaId);
 assert.deepEqual(imported.sculptTerrain,paintedWorld.areas[1].sculptTerrain);
 assert.deepEqual(imported.surface,paintedWorld.areas[1].surface);
 assert.equal(target.portals.length,0,'exported preset never clones graph passages');
});

test('custom north/south decoration survives export, native preset import and new WorldArea',()=>{
 const before=blankWorld(),area=before.areas[0],base=createBlankSculptPreviewScene({width:36,height:24});
 let fringe=createSculptDecorativeFringeV1(area);
 fringe=paintSculptDecorativeFringeSurfaceV1(fringe,area,{
   points:[{x:40,y:-30}],materialId:'ground.snow',width:28});
 const source=saveSculptWorldArea(before,area.id,{...base,decorativeFringe:fringe});
 const original=JSON.stringify(source);
 const file=exportWorldAreaAsMapPresetV1(source,area.id);
 const imported=importSculptMapPreset(file.json);
 assert.equal(JSON.stringify(source),original);
 assert.deepEqual(imported.scene.decorativeFringe,source.areas[0].decorativeFringe);
 const generated=createWorldAreaFromSculptMapPreset(blankWorld(),imported,{name:'Carte enneigée'});
 const copy=generated.areas.at(-1);
 assert.deepEqual(copy.decorativeFringe,source.areas[0].decorativeFringe);
 assert.equal(sculptWorldAreaScene(copy).decorativeFringe.chunks.length,fringe.chunks.length);
});

test('bad fringe and unsupported historical dimensions fail closed without modifying existing maps',()=>{
 const original=blankWorld();
 const preset=createSculptMapPreset(createBlankSculptPreviewScene({width:36,height:24}),{name:'Départ'});
 const bad=JSON.parse(JSON.stringify(preset));
 bad.scene.decorativeFringe={schema:'world-area-decorative-fringe-v1',chunks:[],objects:[
  {id:'bad',objectDefinitionId:'unknown',transform:{x:0,y:0}}]};
 assert.throws(()=>importSculptMapPreset(bad),/fringe|Decorative|invalid/i);
 const legacy={...original,areas:original.areas.map(a=>({...a,width:1001}))};
 assert.throws(()=>exportWorldAreaAsMapPresetV1(legacy,legacy.initialAreaId),/dimensions|terrain/i);
 assert.equal(original.areas[0].width,36*28);
});
