// One Exploration-owned soundtrack, independent from Combat's SoundtrackSession.
// Four author-approved listening copies are deployed by the Exploration build;
// the original masters are retained only in the private audio repository.
export const EXPLORATION_TRACKS_V1=Object.freeze([
  Object.freeze({id:'exploration-1',file:'exploration-01.mp3'}),
  Object.freeze({id:'exploration-2',file:'exploration-02.mp3'}),
  Object.freeze({id:'exploration-3',file:'exploration-03.mp3'}),
  Object.freeze({id:'exploration-4',file:'exploration-04.mp3'})
]);

// Read-only adapter to the official Combat SoundtrackProjectV1 Map scene.
// Exploration retains the ONLY player and physical MP3 files. No cloned
// playlist store, no external media URLs and no manually authored asset IDs.
export function explorationSoundtrackSceneV1(scene,approved=EXPLORATION_TRACKS_V1){
 if(scene===null||scene===undefined)return Object.freeze({
  tracks:Object.freeze([...approved]),order:'shuffle',volume:.45,fadeMs:0,repeat:true
 });
 if(!scene||typeof scene!=='object'||Array.isArray(scene)||
   Object.keys(scene).some(k=>!['tracks','order','volume','fadeMs','repeat'].includes(k)))
   throw new TypeError('SoundtrackProject Map music scene invalid');
 if(!Array.isArray(scene.tracks)||scene.tracks.length>4||
    new Set(scene.tracks).size!==scene.tracks.length)
   throw new RangeError('Map soundtrack must use 0..4 unique official tracks');
 const tracks=scene.tracks.map(id=>{
  if(typeof id!=='string'||!/^gensrpg:music:exploration:0[1-4]$/.test(id))
   throw new TypeError('Unknown Exploration music asset ID');
  const index=Number(id.slice(-2))-1;
  if(!approved[index])throw new TypeError('Exploration track missing');
  return approved[index];
 });
 if(!['sequence','shuffle'].includes(scene.order)||
   !Number.isFinite(scene.volume)||scene.volume<0||scene.volume>1||
   !Number.isInteger(scene.fadeMs)||scene.fadeMs<0||scene.fadeMs>10000||
   typeof scene.repeat!=='boolean')
   throw new TypeError('Invalid Map soundtrack options');
 return Object.freeze({tracks:Object.freeze(tracks),order:scene.order,
  volume:scene.volume,fadeMs:scene.fadeMs,repeat:scene.repeat});
}

export function createExplorationSoundtrackV1({
  AudioCtor=globalThis.Audio,
  tracks=EXPLORATION_TRACKS_V1,
  sceneMusic=null,
  assetUrl=file=>new URL('../../assets/runtime/audio/exploration-v1/'+file,import.meta.url).href,
  random=Math.random,
  volume=0.45,
  onError=error=>console.warn('Musique Exploration indisponible',error)
}={}) {
  if(typeof AudioCtor!=='function'||!Array.isArray(tracks)||tracks.length!==4||
     typeof assetUrl!=='function'||typeof random!=='function')
    throw new TypeError('Exploration soundtrack requires the four approved tracks');
  const settings=explorationSoundtrackSceneV1(sceneMusic,tracks);
  const activeTracks=settings.tracks;
  const audio=new AudioCtor();
  audio.volume=sceneMusic===null?volume:settings.volume;
  audio.preload='metadata';
  audio.loop=false;
  let state='stopped',current=-1,bag=[],disposed=false,sequence=0,lastError=null;
  function draw() {
    if(!bag.length) {
      if(current>=0&&!settings.repeat)return -1;
      bag=activeTracks.map((_,i)=>i);
      for(let i=bag.length-1;settings.order==='shuffle'&&i>0;i--) {
        const r=random();
        const j=Math.min(i,Math.max(0,Math.floor((Number.isFinite(r)?r:0)* (i+1))));
        [bag[i],bag[j]]=[bag[j],bag[i]];
      }
      if(bag.length>1&&bag[0]===current) [bag[0],bag[1]]=[bag[1],bag[0]];
    }
    return bag.length?bag.shift():-1;
  }
  function failed(error,version) {
    if(disposed||sequence!==version||state!=='starting')return;
    lastError=error?.name??'MediaError';
    state=lastError==='NotAllowedError'?'blocked':'error';
    onError(error);
  }
  function play() {
    const version=++sequence;
    state='starting';lastError=null;
    try {
      // A fulfilled play() Promise, not an attempted call, proves playback.
      // Android can reject this after a legacy encounter confirmation dialog.
      Promise.resolve(audio.play()).then(()=>{
        if(!disposed&&sequence===version&&state==='starting')state='playing';
      },error=>failed(error,version));
    }catch(error){failed(error,version);}
  }
  function next() {
    current=draw();
    if(current<0){state='stopped';return;}
    audio.src=assetUrl(activeTracks[current].file);
    // Assigning src and play() is sufficient; load() would restart the
    // resource and can interrupt a pending mobile media play request.
    play();
  }
  function ended() {
    if(!disposed&&(state==='playing'||state==='starting'))next();
  }
  function mediaError() {
    const error=new Error('Exploration MP3 non decodable ou indisponible : '+audio.src);
    error.name='MediaError';
    failed(error,sequence);
  }
  audio.addEventListener('ended',ended);
  audio.addEventListener('error',mediaError);
  return Object.freeze({
    start() {
      if(disposed||!activeTracks.length||state==='playing'||state==='starting')return false;
      if(current<0) next();
      else play();
      return true;
    },
    pause() {
      if(disposed||state==='stopped'||state==='paused'||state==='blocked'||state==='error')return false;
      ++sequence;
      audio.pause();
      state='paused';
      return true;
    },
    resume() {
      if(disposed||state==='playing'||state==='starting'||state==='stopped')return false;
      play();
      return true;
    },
    stop() {
      if(disposed)return false;
      ++sequence;
      audio.pause();
      audio.currentTime=0;
      state='stopped';
      current=-1;
      bag=[];
      lastError=null;
      return true;
    },
    dispose() {
      if(disposed)return;
      ++sequence;
      audio.pause();
      audio.removeEventListener('ended',ended);
      audio.removeEventListener('error',mediaError);
      audio.removeAttribute?.('src');
      audio.load?.();
      current=-1;
      state='stopped';
      disposed=true;
    },
    get state(){return state;},
    get lastError(){return lastError;},
    get mediaReadyState(){return audio.readyState??null;},
    get mediaCurrentTime(){return audio.currentTime??null;},
    get currentTrackId(){return current<0?null:activeTracks[current].id;}
  });
}
