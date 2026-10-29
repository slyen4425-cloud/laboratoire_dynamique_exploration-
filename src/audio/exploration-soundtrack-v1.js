// One Exploration-owned soundtrack, independent from Combat's SoundtrackSession.
// Four author-approved listening copies are deployed by the Exploration build;
// the original masters are retained only in the private audio repository.
export const EXPLORATION_TRACKS_V1=Object.freeze([
  Object.freeze({id:'exploration-1',file:'exploration-01.mp3'}),
  Object.freeze({id:'exploration-2',file:'exploration-02.mp3'}),
  Object.freeze({id:'exploration-3',file:'exploration-03.mp3'}),
  Object.freeze({id:'exploration-4',file:'exploration-04.mp3'})
]);

export function createExplorationSoundtrackV1({
  AudioCtor=globalThis.Audio,
  tracks=EXPLORATION_TRACKS_V1,
  assetUrl=file=>new URL('../../assets/runtime/audio/exploration-v1/'+file,import.meta.url).href,
  random=Math.random,
  volume=0.45,
  onError=error=>console.warn('Musique Exploration indisponible',error)
}={}) {
  if(typeof AudioCtor!=='function'||!Array.isArray(tracks)||tracks.length!==4||
     typeof assetUrl!=='function'||typeof random!=='function')
    throw new TypeError('Exploration soundtrack requires the four approved tracks');
  const audio=new AudioCtor();
  audio.volume=volume;
  audio.preload='metadata';
  audio.loop=false;
  let state='stopped',current=-1,bag=[],disposed=false,sequence=0;
  function draw() {
    if(!bag.length) {
      bag=tracks.map((_,i)=>i);
      for(let i=bag.length-1;i>0;i--) {
        const r=random();
        const j=Math.min(i,Math.max(0,Math.floor((Number.isFinite(r)?r:0)* (i+1))));
        [bag[i],bag[j]]=[bag[j],bag[i]];
      }
      if(bag.length>1&&bag[0]===current) [bag[0],bag[1]]=[bag[1],bag[0]];
    }
    return bag.shift();
  }
  function play() {
    const version=++sequence;
    state='playing';
    try {
      const promise=audio.play();
      Promise.resolve(promise).catch(error=>{
        if(disposed||sequence!==version||state!=='playing')return;
        state='blocked';
        onError(error);
      });
    }catch(error){
      if(sequence===version){state='blocked';onError(error);}
    }
  }
  function next() {
    current=draw();
    audio.src=assetUrl(tracks[current].file);
    audio.load?.();
    play();
  }
  function ended() {
    if(!disposed&&state==='playing')next();
  }
  audio.addEventListener('ended',ended);
  return Object.freeze({
    start() {
      if(disposed||state==='playing')return false;
      if(current<0) next();
      else play();
      return true;
    },
    pause() {
      if(disposed||state==='stopped'||state==='paused')return false;
      ++sequence;
      audio.pause();
      state='paused';
      return true;
    },
    resume() {
      if(disposed||state==='playing'||state==='stopped')return false;
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
      return true;
    },
    dispose() {
      if(disposed)return;
      ++sequence;
      audio.pause();
      audio.removeEventListener('ended',ended);
      audio.removeAttribute?.('src');
      audio.load?.();
      current=-1;
      state='stopped';
      disposed=true;
    },
    get state(){return state;},
    get currentTrackId(){return current<0?null:tracks[current].id;}
  });
}
