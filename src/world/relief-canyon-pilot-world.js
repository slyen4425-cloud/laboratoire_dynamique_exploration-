// Optional editorial demo only. WorldDocument remains the only source of level data.
// No change to the regular demo, camera, height, collision or traversal engines.
import { demoWorldDocument } from './demo-world.js?rev=relief-canyon-pilot-v1';
import { normalizeWorldDocument } from './world-document-model.js?rev=relief-canyon-pilot-v1';

function prop(id, objectDefinitionId, x, y, scaleX = 1, scaleY = scaleX) {
  return { id, objectDefinitionId, transform: { x, y, rotationDeg: 0, scaleX, scaleY } };
}

export const reliefCanyonPilotDocument = normalizeWorldDocument({
  ...demoWorldDocument,
  id: 'relief-canyon-pilot-v1',
  initialAreaId: 'canyon-exterior',
  initialSpawnId: 'depart-canyon',
  portals: [],
  events: [],
  areas: [{
    id: 'canyon-exterior',
    kind: 'exterior',
    width: 2400,
    height: 1560,
    encounters: { randomEnabled: false },
    surface: {
      baseTerrainFamilyId: 'forest',
      baseMaterialId: 'grass.forest',
      baseTraversalRuleId: 'terrain.ground',
      zones: [
        { id: 'pine-clearing', width: 240, terrainFamilyId: 'plain',
          materialId: 'ground.forest_floor', points: [{x: 120, y: 1120},{x: 660, y: 1200},{x: 1200, y: 1120}] },
        { id: 'upper-path-clearing', width: 165, terrainFamilyId: 'plain',
          materialId: 'grass.forest', points: [{x: 130,y: 220},{x: 660,y: 170},{x: 1110,y: 220}] }
      ],
      routes: [
        { id: 'canyon-sand-road', width: 96, terrainFamilyId: 'road',
          materialId: 'road.dirt', traversalRuleId: 'terrain.road',
          points: [{x:-40,y:1300},{x:280,y:1210},{x:560,y:1260},{x:820,y:1150},
            {x:1160,y:1175},{x:1420,y:1110},{x:1830,y:1175},{x:2420,y:1080}] },
        { id: 'canyon-north-road', width: 80, terrainFamilyId: 'road',
          materialId: 'road.dirt', traversalRuleId: 'terrain.road',
          points: [{x:0,y:190},{x:320,y:245},{x:660,y:170},{x:970,y:208},{x:1410,y:195},{x:2300,y:170}] }
      ],
      rivers: [
        { id: 'canyon-river', width: 182, terrainFamilyId: 'sea',
          materialId: 'water.canyon_turquoise', traversalRuleId: 'terrain.water',
          points: [{x:-60,y:820},{x:280,y:815},{x:620,y:845},{x:1060,y:822},
            {x:1480,y:860},{x:1830,y:830},{x:2450,y:840}] }
      ]
    },
    objects: [
      prop('upper-cliff-left', 'objectdef.relief.cliff.grassy_edge.01', 460, 610, 1.02),
      prop('upper-cliff-right', 'objectdef.relief.cliff.broken_ledge.02', 1530, 600, 1.02),
      prop('upper-cliff-angle', 'objectdef.relief.cliff.corner.01', 2250, 585, 0.88),
      prop('waterfall-center', 'objectdef.relief.waterfall.blue.01', 1080, 677, 0.78),
      prop('pine-upper-a', 'objectdef.tree.forest.pine.01', 185, 255, 1.25),
      prop('pine-upper-b', 'objectdef.tree.forest.pine.01', 510, 300, 1),
      prop('pine-upper-c', 'objectdef.tree.forest.pine.01', 805, 300, 0.83),
      prop('pine-upper-d', 'objectdef.tree.forest.pine.01', 1390, 260, 1.18),
      prop('pine-upper-e', 'objectdef.tree.forest.pine.01', 1770, 310, 1.08),
      prop('pine-upper-f', 'objectdef.tree.forest.pine.01', 2140, 282, 1.23),
      prop('pine-lower-a', 'objectdef.tree.forest.pine.01', 150, 1040, 1.18),
      prop('pine-lower-b', 'objectdef.tree.forest.pine.01', 550, 1030, 1.07),
      prop('pine-lower-c', 'objectdef.tree.forest.pine.01', 820, 1370, 1.16),
      prop('pine-lower-d', 'objectdef.tree.forest.pine.01', 1600, 1370, 0.92),
      prop('pine-lower-e', 'objectdef.tree.forest.pine.01', 2160, 1350, 1.10),
      prop('rock-foreground-a', 'objectdef.rock.forest.boulder.01', 400, 1410, 1.08),
      prop('rock-foreground-b', 'objectdef.rock.forest.plateau.01', 1200, 1380, 0.92),
      prop('rock-foreground-c', 'objectdef.rock.forest.spires.01', 1990, 1250, 0.83)
    ],
    actors: [],
    obstacles: [],
    spawns: [{ id: 'depart-canyon', x: 305, y: 1230 }]
  }]
});

// Keep this demo code non-authoritative; the serialized map edits the same
// WorldArea surfaces and WorldObject placement contracts as a normal map.
export const reliefCanyonPilotSummary = Object.freeze({
  id: 'relief-canyon-pilot-v1',
  levelHeightGameplay: false,
  cameraMode: 'existing-2d',
  style: 'decorative-2.5d',
  objectCount: reliefCanyonPilotDocument.areas[0].objects.length,
  areaId: reliefCanyonPilotDocument.initialAreaId
});
