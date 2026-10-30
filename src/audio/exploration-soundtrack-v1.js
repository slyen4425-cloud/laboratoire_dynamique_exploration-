// One Exploration-owned soundtrack, independent from Combat's SoundtrackSession.
// Four author-approved listening copies are deployed by the Exploration build;
// the original masters are retained only in the private audio repository.
export const EXPLORATION_TRACKS_V1=Object.freeze([
  Object.freeze({id:'exploration-1',file:'exploration-01.mp3'}),
  Object.freeze({id:'exploration-2',file:'exploration-02.mp3'}),
  Object.freeze({id:'exploration-3',file:'exploration-03.mp3'}),
  Object.freeze({id:'exploration-4',file:'exploration-04.mp3'})
]);

// Future cue slots only; no jingle file is invented or injected into Combat.
export const EXPLORATION_TRANSITION_CUES_V1=Object.freeze({
  combatEntry:null,victory:null,defeat:null
});

export function createExplorationSoundtrackV1({
  AudioCtor=globalThis.Audio,
  tracks=EXPLORATION_TRACKS_V1,
  assetUrl=file=>new URL('../../assets/runtime/audio/exploration-v1/'+file,import.meta.url).href,
  random=Math.random,
  volume=0.45,
  schedule=(fn,delay)=>globalThis.setTimeout(fn,delay),
  cancel=timer=>globalThis.clearTimeout(timer),
  onError=error=>console.warn('Musique Exploration indisponible',error)
}={}) {
  if(typeof AudioCtor!=='function'||!Array.isArray(tracks)||tracks.length!==4||
     typeof assetUrl!=='function'||typeof random!=='function'||
     typeof schedule!=='function'||typeof cancel!=='function'||
     !Number.isFinite(volume)||volume<0||volume>1)
    throw new TypeError('Exploration soundtrack requires the four approved tracks');
  const audio=new AudioCtor();
  audio.volume=volume;
  audio.preload='metadata';
  audio.loop=false;
  let state='stopped',current=-1,bag=[],disposed=false,sequence=0,lastError=null;
  let fadeTimer=null,fadeVersion=0;
  function clearFade(){
    ++fadeVersion;
    if(fadeTimer!==null){cancel(fadeTimer);fadeTimer=null;}
  }
  function rampTo(target,durationMs,done=()=>{}){
    clearFade();
    const version=fadeVersion,steps=16,from=audio.volume;
    let index=0;
    function tick(){
      if(disposed||fadeVersion!==version)return;
      if(state!=='playing'&&state!=='starting')return;
      index++;
      audio.volume=from+(target-from)*(index/steps);
      if(index<steps)fadeTimer=schedule(tick,durationMs/steps);
      else {fadeTimer=null;done();}
    }
    fadeTimer=schedule(tick,durationMs/steps);
  }
  function validFadeMs(durationMs){
    if(!Number.isFinite(durationMs)||durationMs<100||durationMs>5000)
      throw new RangeError('Durée de fondu audio invalide');
  }
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
  function failed(error,version) {
    if(disposed||sequence!==version||state!=='starting')return;
    lastError=error?.name??'MediaError';
    state=lastError==='NotAllowedError'?'blocked':'error';
    clearFade();
    // Chrome can deny an automatic resume after Combat. The next trusted
    // pointer/keyboard retry must restore audible volume, not stay at zero.
    audio.volume=volume;
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
    audio.src=assetUrl(tracks[current].file);
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
      if(disposed||state==='playing'||state==='starting')return false;
      if(current<0) next();
      else play();
      return true;
    },
        fadeOut({durationMs=600}={}) {
      if(disposed||['stopped','paused','blocked','error'].includes(state))return false;
      validFadeMs(durationMs);
      rampTo(0,durationMs,()=>{
        ++sequence;
        audio.pause();
        state='paused';
      });
      return true;
    },
    fadeIn({durationMs=700}={}) {
      if(disposed)return false;
      validFadeMs(durationMs);
      clearFade();
      if(state==='playing'||state==='starting'){
        rampTo(volume,durationMs);
        return true;
      }
      audio.volume=0;
      if(state==='stopped'&&current<0)next();
      else play(); // Invoked on the real return gesture, not a second timer.
      rampTo(volume,durationMs);
      return true;
    },
    pause() {
      if(disposed||state==='stopped'||state==='paused'||state==='blocked'||state==='error')return false;
      ++sequence;
      clearFade();
      audio.pause();
      audio.volume=volume;
      state='paused';
      return true;
    },
    resume() {
      if(disposed||state==='playing'||state==='starting'||state==='stopped')return false;
      clearFade();
      audio.volume=volume;
      play();
      return true;
    },
    stop() {
      if(disposed)return false;
      ++sequence;
      clearFade();
      audio.pause();
      audio.volume=volume;
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
      clearFade();
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
    get currentTrackId(){return current<0?null:tracks[current].id;}
  });
}
