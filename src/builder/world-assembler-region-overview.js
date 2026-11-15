// Read-only projection of the canonical WorldDocument for the world overview.
// Interior/dungeon/instance Areas remain in the WorldDocument and can be
// opened from their parent Area; they are never graph nodes or graph arrows.
export function worldAssemblerRegionOverview(doc){
  const regions=doc.areas.filter(area=>area.kind==='exterior');
  const regionIds=new Set(regions.map(area=>area.id));
  const passages=doc.portals.filter(portal=>
    regionIds.has(portal.sourceAreaId)&&regionIds.has(portal.targetAreaId));
  // Only completely disconnected instances need a maintenance entry:
  // nested instances reachable through another interior are not orphans.
  // Follow entry direction: a return-only Portal cannot enter an interior.
  const reachable=new Set(regionIds);
  let changed=true;
  while(changed){
    changed=false;
    for(const portal of doc.portals){
      if(reachable.has(portal.sourceAreaId)&&!reachable.has(portal.targetAreaId)){
        reachable.add(portal.targetAreaId);changed=true;
      }
    }
  }
  const orphanInstances=doc.areas.filter(area=>
    area.kind==='interior'&&!reachable.has(area.id));
  return {regions,passages,orphanInstances};
}
