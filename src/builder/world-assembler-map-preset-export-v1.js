// Read-only WorldBuilder export: convert the selected canonical WorldArea into
// the EXISTING native MapPreset JSON contract (not a second save/WorldDocument).
import {sculptWorldAreaScene} from './sculpt-world-area-link.js';
import {createSculptMapPreset,importSculptMapPreset} from './sculpt-map-preset-library.js';

export function exportWorldAreaAsMapPresetV1(worldDocument,areaId){
  const area=worldDocument?.areas?.find(entry=>entry.id===areaId);
  if(!area)throw new Error('Sélectionne une carte du monde à exporter');
  const label=typeof area.label==='string'&&area.label.trim()
    ?area.label.trim():(typeof area.name==='string'&&area.name.trim()
      ?area.name.trim():'Carte');
  // The native Sculpt adapter refuses an incompatible historical WorldArea,
  // rather than inventing resized terrain or silently dropping placements.
  const scene=sculptWorldAreaScene(area);
  const preset=importSculptMapPreset(createSculptMapPreset(scene,{
    name:label.slice(0,64)
  }));
  const slug=label.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,65)||'carte';
  return Object.freeze({
    fileName:slug+'.map-preset.json',
    json:JSON.stringify(preset,null,2)+'\n',
    preset
  });
}
