import {validInteriorDoorAsset,validInteriorConnectorAsset} from './interior-material-catalog.js';
import {
  findWorldArea,
  findWorldAreaSpawn,
  resolveWorldAreaObjects,
  resolveWorldAreaSpawnPoint
} from './world-area-model.js?rev=builder-dynamic-return-v1';
import {
  normalizeWorldTriggerGeometry,
  resolveWorldTriggerPoint,
  worldTriggerContainsPoint
} from './world-trigger-geometry.js?rev=trigger-geometry-v1';

export const PORTAL_SCHEMA_VERSION = 1;

function finiteNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  return Number.isFinite(value) && value >= min && value <= max
    ? value
    : fallback;
}

function normalizedString(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

function normalizePortalVisual(raw) {
  const visual = raw && typeof raw === 'object' ? raw : {};
  const marker =
    visual.marker === 'exit' ||
    visual.marker === 'entry' ||
    visual.marker === 'portal' ||
    visual.marker === 'shadow' ||
    visual.marker === 'texture'
      ? visual.marker
      : 'portal';

  return Object.freeze({
    visible: visual.visible === true,
    marker,
    label: normalizedString(visual.label),
    // Optional native surface texture ID, never a URL or an asset copy.
    ...(normalizedString(visual.textureMaterialId)?{
      textureMaterialId:normalizedString(visual.textureMaterialId)
    }:{}),
    // Optional presentation parameter owned by Portal, never by the renderer.
    // Absent on legacy Portals so existing worlds keep their original schema.
    ...(validInteriorDoorAsset(visual.assetId)||validInteriorConnectorAsset(visual.assetId)
      ?{assetId:visual.assetId}:{}),
    // Visual orientation belongs to the Portal; its canonical trigger/Spawn
    // and collision are never rotated or copied into a second geometry.
    ...(Number.isFinite(visual.rotationDeg)?{
      rotationDeg:((visual.rotationDeg%360)+360)%360
    }:{}),
    ...(Number.isFinite(visual.scale) ? {
      scale:finiteNumber(visual.scale,1,{min:.35,max:1.5})
    }: {})
  });
}

export function normalizePortal(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;

  const sourceAreaId = normalizedString(raw.sourceAreaId);
  const targetAreaId = normalizedString(raw.targetAreaId);
  const targetSpawnId = normalizedString(raw.targetSpawnId);
  const trigger = normalizeWorldTriggerGeometry(raw.trigger);

  if (!sourceAreaId || !targetAreaId || !targetSpawnId || !trigger) {
    return null;
  }

  return Object.freeze({
    schemaVersion: PORTAL_SCHEMA_VERSION,
    id: normalizedString(raw.id) ?? `portal-${index + 1}`,
    enabled: raw.enabled !== false,
    sourceAreaId,
    trigger,
    targetAreaId,
    targetSpawnId,
    ...(raw.sharedDoorPoint===true?{sharedDoorPoint:true}:{}),
    visual: normalizePortalVisual(raw.visual)
  });
}

export function normalizePortals(rawPortals = []) {
  if (!Array.isArray(rawPortals)) return Object.freeze([]);

  const seen = new Set();
  const portals = [];

  rawPortals.forEach((raw, index) => {
    const portal = normalizePortal(raw, index);
    if (!portal || seen.has(portal.id)) return;
    seen.add(portal.id);
    portals.push(portal);
  });

  return Object.freeze(portals);
}

export function resolvePortalTriggerPoint(areas, portal) {
  if (!portal?.trigger) return null;

  const area = findWorldArea(areas, portal.sourceAreaId);
  if (!area) return null;

  return resolveWorldTriggerPoint(
    area,
    portal.trigger
  );
}
export function portalReferencesAreValid(areas, portal) {
  if (!portal) return false;

  const sourceArea = findWorldArea(areas, portal.sourceAreaId);
  const targetArea = findWorldArea(areas, portal.targetAreaId);
  const targetSpawn = findWorldAreaSpawn(
    targetArea,
    portal.targetSpawnId
  );
  const targetPoint = resolveWorldAreaSpawnPoint(
    targetArea,
    portal.targetSpawnId
  );
  const triggerPoint = resolvePortalTriggerPoint(areas, portal);

  return Boolean(
    sourceArea &&
    targetArea &&
    targetSpawn &&
    targetPoint &&
    triggerPoint
  );
}

// Identify the original door pair by its existing building anchor and the
// reverse Spawn anchor, not by a generated ID or a parallel door registry.
export function buildingDoorCounterpart(world,portal){
  if(!world||!portal)return null;
  const area=id=>findWorldArea(world.areas,id);
  const source=area(portal.sourceAreaId),target=area(portal.targetAreaId);
  if(!source||!target||source.kind===target.kind)return null;
  const reverse=(world.portals??[]).filter(p=>p.sourceAreaId===portal.targetAreaId&&
    p.targetAreaId===portal.sourceAreaId&&p.enabled!==false);
  const matches=(entry,exit)=>{
    if(entry.trigger?.kind!=='object-anchor'||exit.trigger?.kind!=='point')return false;
    const spawn=findWorldAreaSpawn(area(exit.targetAreaId),exit.targetSpawnId);
    return spawn?.anchor?.kind==='building-door'&&
      spawn.anchor.objectId===entry.trigger.objectId&&
      spawn.anchor.anchorId===entry.trigger.anchorId;
  };
  const candidates=reverse.filter(p=>source.kind==='exterior'?matches(portal,p):matches(p,portal));
  return candidates.length===1?candidates[0]:null;
}
export function isManualBuildingPortal(world,portal){
  return !!buildingDoorCounterpart(world,portal);
}
// A shared door uses its one explicitly placed Portal.trigger for both
// directions. Until edited, the safe historical arrival Spawn is the common
// point; its old doorway anchor and legacy Spawn IDs stay intact.
export function resolvePortalWaypoint(world,portal){
  const point=resolvePortalTriggerPoint(world.areas,portal);
  const reverse=buildingDoorCounterpart(world,portal);
  // Standalone legacy Sculpt scenes have no WorldDocument initial Area.
  // Their separately authored entrance/exit geometry remains compatible.
  if(!point||!reverse||portal.sharedDoorPoint||!world.initialAreaId)return point;
  const source=findWorldArea(world.areas,portal.sourceAreaId);
  const arrival=resolveWorldAreaSpawnPoint(source,reverse.targetSpawnId);
  return arrival?Object.freeze({x:arrival.x,y:arrival.y,radius:point.radius}):point;
}

export function findTriggeredPortal(
  worldDocument,
  currentAreaId,
  entity,
  {automaticOnly=false}={}
) {
  if (
    !worldDocument ||
    typeof currentAreaId !== 'string' ||
    !entity ||
    !Number.isFinite(entity.x) ||
    !Number.isFinite(entity.y)
  ) {
    return null;
  }

  for (const portal of worldDocument.portals) {
    if (
      portal.enabled !== true ||
      portal.sourceAreaId !== currentAreaId ||
      (automaticOnly&&isManualBuildingPortal(worldDocument,portal))
    ) {
      continue;
    }

    const point = resolvePortalWaypoint(worldDocument,portal);
    if (!point) continue;

    if (worldTriggerContainsPoint(entity, point)) {
      return portal;
    }
  }

  return null;
}

export function applyPortalTransition(
  worldDocument,
  state,
  portal
) {
  if (
    !worldDocument ||
    !state ||
    !portal ||
    state.currentAreaId !== portal.sourceAreaId
  ) {
    return null;
  }

  const targetArea = findWorldArea(
    worldDocument.areas,
    portal.targetAreaId
  );
  const targetSpawn = findWorldAreaSpawn(
    targetArea,
    portal.targetSpawnId
  );
  const reverse=buildingDoorCounterpart(worldDocument,portal);
  const targetPoint=reverse&&worldDocument.initialAreaId?resolvePortalWaypoint(worldDocument,reverse):
    resolveWorldAreaSpawnPoint(targetArea,portal.targetSpawnId);

  if (!targetArea || !targetSpawn || !targetPoint) return null;

  return Object.freeze({
    currentAreaId: targetArea.id,
    x: targetPoint.x,
    y: targetPoint.y,
    viaPortalId: portal.id
  });
}

// Gameplay-only edge detector: crossing the real Portal trigger starts travel.
// A Spawn inside the reverse Portal is NOT a fresh entry until the hero exits
// its hitbox and walks into it again. No timer, alternate physics or new XY.
export function findPortalEnteredDuringMove(worldDocument,currentAreaId,previousPoint,nextPoint){
  if(!previousPoint||!nextPoint||
     !Number.isFinite(previousPoint.x)||!Number.isFinite(previousPoint.y)||
     Math.hypot(nextPoint.x-previousPoint.x,nextPoint.y-previousPoint.y)<.001)return null;
  const entered=findTriggeredPortal(worldDocument,currentAreaId,nextPoint,{automaticOnly:true});
  if(!entered)return null;
  const alreadyInside=findTriggeredPortal(worldDocument,currentAreaId,previousPoint,{automaticOnly:true});
  return alreadyInside?.id===entered.id?null:entered;
}
