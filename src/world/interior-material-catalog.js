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
 {id:'object.door.fantasy.tavern_golden.01',label:'Porte auberge dorée',path:'./assets/exploration/objects/doors/door_fantasy_tavern_golden_01.webp'},
 {"id":"object.door.interior.bois_renforce.face","label":"Bois renforcé — face","path":"./assets/interiors/doors/01_bois_renforce_face.png"},
 {"id":"object.door.interior.bois_renforce.trois_quarts","label":"Bois renforcé — 3/4","path":"./assets/interiors/doors/01_bois_renforce_trois_quarts.png"},
 {"id":"object.door.interior.bois_arche_pierre.face","label":"Bois et arche de pierre — face","path":"./assets/interiors/doors/02_bois_arche_pierre_face.png"},
 {"id":"object.door.interior.bois_arche_pierre.trois_quarts","label":"Bois et arche de pierre — 3/4","path":"./assets/interiors/doors/02_bois_arche_pierre_trois_quarts.png"},
 {"id":"object.door.interior.bois_double.face","label":"Double porte en bois — face","path":"./assets/interiors/doors/03_bois_double_face.png"},
 {"id":"object.door.interior.bois_double.trois_quarts","label":"Double porte en bois — 3/4","path":"./assets/interiors/doors/03_bois_double_trois_quarts.png"},
 {"id":"object.door.interior.fer_ornement.face","label":"Fer ornementé — face","path":"./assets/interiors/doors/04_fer_ornement_face.png"},
 {"id":"object.door.interior.fer_ornement.trois_quarts","label":"Fer ornementé — 3/4","path":"./assets/interiors/doors/04_fer_ornement_trois_quarts.png"},
 {"id":"object.door.interior.bois_coulissant.face","label":"Bois coulissant — face","path":"./assets/interiors/doors/05_bois_coulissant_face.png"},
 {"id":"object.door.interior.bois_coulissant.trois_quarts","label":"Bois coulissant — 3/4","path":"./assets/interiors/doors/05_bois_coulissant_trois_quarts.png"},
 {"id":"object.door.interior.bois_dore.face","label":"Bois doré — face","path":"./assets/interiors/doors/06_bois_dore_face.png"},
 {"id":"object.door.interior.bois_dore.trois_quarts","label":"Bois doré — 3/4","path":"./assets/interiors/doors/06_bois_dore_trois_quarts.png"},
 {"id":"object.door.interior.fer_donjon.face","label":"Fer de donjon — face","path":"./assets/interiors/doors/07_fer_donjon_face.png"},
 {"id":"object.door.interior.fer_donjon.trois_quarts","label":"Fer de donjon — 3/4","path":"./assets/interiors/doors/07_fer_donjon_trois_quarts.png"},
 {"id":"object.door.interior.bois_lierre.face","label":"Bois et lierre — face","path":"./assets/interiors/doors/08_bois_lierre_face.png"},
 {"id":"object.door.interior.bois_lierre.trois_quarts","label":"Bois et lierre — 3/4","path":"./assets/interiors/doors/08_bois_lierre_trois_quarts.png"},
 {"id":"object.door.interior.grille_fer.face","label":"Grille en fer — face","path":"./assets/interiors/doors/09_grille_fer_face.png"},
 {"id":"object.door.interior.grille_fer.trois_quarts","label":"Grille en fer — 3/4","path":"./assets/interiors/doors/09_grille_fer_trois_quarts.png"},
 {"id":"object.door.interior.porte_noble.face","label":"Porte noble — face","path":"./assets/interiors/doors/10_porte_noble_face.png"},
 {"id":"object.door.interior.porte_noble.trois_quarts","label":"Porte noble — 3/4","path":"./assets/interiors/doors/10_porte_noble_trois_quarts.png"},
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
