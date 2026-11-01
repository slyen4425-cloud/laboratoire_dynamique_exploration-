import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createExplorationSoundtrackV1,EXPLORATION_TRANSITION_CUES_V1}
 from '../src/audio/exploration-soundtrack-v1.js';

function rig(){
 const tasks=new Map();let id=0,player;
 class FakeAudio{
  constructor(){this.volume=0;this.currentTime=0;this.listeners=new Map();this.playCount=0;this.paused=true;player=this;}
  addEventListener(key,fn){this.listeners.set(key,fn);}
  removeEventListener(key){this.listeners.delete(key);}
  play(){this.paused=false;this.playCount++;return Promise.resolve();}
  pause(){this.paused=true;}
  removeAttribute(){}
  load(){}
 }
 const session=createExplorationSoundtrackV1({
  AudioCtor:FakeAudio,assetUrl:file=>'test://'+file,random:()=>0,
  schedule:(fn,ms)=>{const key=++id;tasks.set(key,fn);return key;},
  cancel:key=>tasks.delete(key)
 });
 function flush(){
  for(let n=0;tasks.size&&n<100;n++){
    const [key,fn]=tasks.entries().next().value;
    tasks.delete(key);fn();
  }
  assert.equal(tasks.size,0,'fade must always settle after finite ticks');
 }
 return {session,flush,tasks,get player(){return player;}};
}
test('Combat fades Exploration out and victory fades same soundtrack back in',async()=>{
 const q=rig(),s=q.session;
 assert.equal(s.start(),true);await Promise.resolve();
 const track=s.currentTrackId;
 assert.equal(s.fadeOut({durationMs:600}),true);
 assert.equal(s.state,'playing','fade must not abruptly pause when battle starts');
 q.flush();
 assert.equal(s.state,'paused');
 assert.equal(q.player.paused,true);
 assert.equal(s.fadeIn({durationMs:700}),true);
 assert.equal(q.player.volume,0,'resume begins at silence and ramps smoothly');
 await Promise.resolve();
 q.flush();
 assert.equal(s.state,'playing');
 assert.equal(q.player.volume,0.45);
 assert.equal(s.currentTrackId,track,'no restart or random new song after combat');
 assert.equal(q.player.playCount,2);
 s.dispose();
});
test('cancelled fades cannot pause resumed music after an overlapping scene change',async()=>{
 const q=rig(),s=q.session;
 s.start();await Promise.resolve();
 s.fadeOut({durationMs:600});assert.ok(q.tasks.size>0);
 s.fadeIn({durationMs:800});await Promise.resolve();
 q.flush();assert.equal(s.state,'playing');assert.equal(q.player.volume,0.45);
 s.fadeOut({durationMs:650});assert.ok(q.tasks.size>0);
 s.dispose();assert.equal(q.tasks.size,0,'disposing cancels stale fade callbacks');
});
test('Combat jingles remain reserved slots, not arbitrary unapproved audio assets',()=>{
 assert.deepEqual(EXPLORATION_TRANSITION_CUES_V1,{
   combatEntry:null,victory:null,defeat:null
 });
 const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(source,/explorationSoundtrack\.fadeOut\(/);
 assert.match(source,/explorationSoundtrack\.fadeIn\(/);
});

test('Android playback denial after a fade-in restores audible volume for a trusted retry',async()=>{
 let audio,playCount=0;
 class GestureAudio{
  constructor(){audio=this;this.volume=.45;this.currentTime=0;this.listeners=new Map();}
  addEventListener(kind,fn){this.listeners.set(kind,fn);}
  removeEventListener(kind){this.listeners.delete(kind);}
  play(){playCount++;return playCount===2
    ?Promise.reject(Object.assign(new Error('trusted gesture required'),{name:'NotAllowedError'}))
    :Promise.resolve();}
  pause(){}
  removeAttribute(){}
  load(){}
 }
 const tasks=new Map();let seq=0;
 const session=createExplorationSoundtrackV1({AudioCtor:GestureAudio,
   schedule:fn=>{const id=++seq;tasks.set(id,fn);return id;},
   cancel:id=>tasks.delete(id),
   assetUrl:file=>'test://'+file
 });
 session.start();await Promise.resolve();
 session.fadeOut({durationMs:400});
 for(let i=0;i<30&&tasks.size;i++){const [id,fn]=tasks.entries().next().value;tasks.delete(id);fn();}
 assert.equal(session.state,'paused');
 session.fadeIn({durationMs:500});
 await Promise.resolve();await Promise.resolve();
 assert.equal(session.state,'blocked');
 assert.equal(audio.volume,.45,'a blocked return cannot leave retry at silent volume');
 assert.equal(session.start(),true);
 await Promise.resolve();await Promise.resolve();
 assert.equal(session.state,'playing');
 assert.equal(audio.volume,.45);
 session.dispose();
});
