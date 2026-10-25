// Read-only authoring vocabulary. All choices are stored in canonical WorldArea
// or Portal; this catalog never stores geometry, collisions or the active room.
export const INTERIOR_WALL_MATERIALS=Object.freeze([
 {id:'plaster',label:'Enduit clair',fill:'#aa9b85',stroke:'#decbb1'},
 {id:'stone',label:'Pierre taillée',fill:'#858078',stroke:'#beb7ad'},
 {id:'brick',label:'Brique rouge',fill:'#985c48',stroke:'#ca9071'},
 {id:'wood',label:'Planches de bois',fill:'#845a39',stroke:'#c9a078'},
 {id:'dark-stone',label:'Pierre de donjon',fill:'#514e57',stroke:'#89858c'}
].map(x=>Object.freeze(x)));
export const INTERIOR_DOOR_ASSETS=Object.freeze([
 {id:'default',label:'Porte bois (dessin actuel)',path:null},
 {id:'object.door.fantasy.wood.01',label:'Porte fantasy bois',path:'./assets/exploration/objects/doors/door_fantasy_wood_01.webp'},
 {id:'object.door.fantasy.stone_redroof.01',label:'Porte pierre et rouge',path:'./assets/exploration/objects/doors/door_fantasy_stone_redroof_01.webp'},
 {id:'object.door.fantasy.tavern_golden.01',label:'Porte auberge dorée',path:'./assets/exploration/objects/doors/door_fantasy_tavern_golden_01.webp'}
].map(x=>Object.freeze(x)));
export const INTERIOR_CONNECTOR_ASSETS=Object.freeze([
 {id:'stairs.wood',label:'Escalier en bois',path:'./assets/exploration/objects/stairs/stairs_wood_rustic_2p5d_front_01.webp'},
 {id:'stairs.stone',label:'Escalier en pierre',path:'./assets/exploration/objects/stairs/stairs_stone_rustic_2p5d_front_01.webp'},
 {id:'ladder.wood',label:'Échelle en bois',path:null}
].map(x=>Object.freeze(x)));
const has=(items,id)=>items.some(x=>x.id===id);
export function interiorWallMaterial(id){
 return INTERIOR_WALL_MATERIALS.find(x=>x.id===id)??INTERIOR_WALL_MATERIALS[0];
}
export function validInteriorDoorAsset(id){return has(INTERIOR_DOOR_ASSETS,id);}
export function validInteriorConnectorAsset(id){return has(INTERIOR_CONNECTOR_ASSETS,id);}
export function interiorWallMaterialId(id){
 return has(INTERIOR_WALL_MATERIALS,id)?id:'plaster';
}
