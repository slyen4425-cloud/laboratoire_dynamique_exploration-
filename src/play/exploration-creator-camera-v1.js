// Official Exploration owner for the native game camera. GenSRPG only
// selects an angle for a specific AdventureSession; projection & zoom remain
// under Exploration's existing sculpt-camera-projection.js and navigation HUD.
import {SCULPT_GAME_CAMERA_ANGLE} from '../render/sculpt-camera-projection.js';
export function cameraAngleFromAdventurePlayUrlV1(search){
 const params=new URLSearchParams(search);
 if(params.get('play')!=='1'||!params.get('adventureSession'))return null;
 const raw=params.get('cameraAngle');
 if(raw===null)return null; // Native Tester and historical saves keep old default.
 if(!/^\d+$/.test(raw))throw new RangeError('Angle de caméra du créateur invalide');
 const angle=Number(raw);
 if(!Number.isSafeInteger(angle)||
    angle<SCULPT_GAME_CAMERA_ANGLE.min||angle>SCULPT_GAME_CAMERA_ANGLE.max||
    (angle-SCULPT_GAME_CAMERA_ANGLE.min)%5!==0)
  throw new RangeError('Angle de caméra du créateur : 35 à 90 degrés par pas de 5');
 return angle;
}

/** Initial zoom is an Adventure preference, never a second map camera.
 * After first paint the player can still change native Exploration zoom. */
export function cameraInitialZoomFromAdventurePlayUrlV1(search){
 const params=new URLSearchParams(search);
 if(params.get('play')!=='1'||!params.get('adventureSession'))return null;
 const raw=params.get('cameraZoom');
 if(raw===null)return null; // Old saves keep the native 175% without migration.
 if(!/^\d+$/.test(raw))throw new RangeError('Zoom initial de caméra invalide');
 const percent=Number(raw);
 if(!Number.isSafeInteger(percent)||percent<100||percent>240||percent%5!==0)
  throw new RangeError('Zoom initial de caméra : 100 à 240 %, par pas de 5');
 return percent;
}
