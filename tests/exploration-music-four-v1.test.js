import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createExplorationSoundtrackV1,EXPLORATION_TRACKS_V1} from '../src/audio/exploration-soundtrack-v1.js';

const expected=[
  {file:'exploration-01.mp3',size:2601992,sha:'c3a0cfffa5f022c4f1c23b8eaa7673a61781669f400c7a38bbeb9572c64a3657'},
  {file:'exploration-02.mp3',size:2614951,sha:'5a10067b885ab5c1fa99ec9b8337679903bd294679b636991d9a1fd4e98868d7'},
  {file:'exploration-03.mp3',size:2367277,sha:'ec94c86e82861899dd1f6771794acfa6c0645a4e8d6f545338f3875f06ee8ad8'},
  {file:'exploration-04.mp3',size:2199373,sha:'2b9374c98e41a2343fe01027101f48e3443b87ee0043d107f585be7ffe657ce6'}
];

test('four distinct playable public listening copies, verified against the private transcode manifest',()=>{
  assert.deepEqual(EXPLORATION_TRACKS_V1.map(t=>t.file),expected.map(t=>t.file));
  for(const x of expected){
    const bytes=readFileSync(new URL('../assets/runtime/audio/exploration-v1/'+x.file,import.meta.url));
    assert.equal(bytes.length,x.size,'missing or truncated '+x.file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),x.sha,'modified audio '+x.file);
    assert.equal(bytes.toString('ascii',0,3),'ID3');
  }
});

test('shuffle plays all four without an immediate repeat; pause and resume preserve current song',async()=>{
  let player;
  class FakeAudio {
    constructor(){this.listeners=new Map();this.plays=[];this.currentTime=0;player=this;}
    addEventListener(name,fn){this.listeners.set(name,fn);}
    removeEventListener(name){this.listeners.delete(name);}
    load(){}
    play(){this.plays.push(this.src);return Promise.resolve();}
    pause(){this.paused=true;}
    removeAttribute(name){if(name==='src')this.src='';}
    fire(name){this.listeners.get(name)?.();}
  }
  const session=createExplorationSoundtrackV1({
    AudioCtor:FakeAudio,random:()=>0,assetUrl:file=>'https://example.org/audio/'+file
  });
  assert.equal(session.state,'stopped');
  assert.equal(session.start(),true);
  assert.equal(session.start(),false);
  const heard=[session.currentTrackId];
  for(let i=0;i<11;i++){player.fire('ended');heard.push(session.currentTrackId);}
  assert.equal(new Set(heard.slice(0,4)).size,4);
  assert.equal(new Set(heard.slice(4,8)).size,4);
  assert.equal(new Set(heard.slice(8,12)).size,4);
  assert.ok(heard.every((id,i)=>!i||id!==heard[i-1]),'no adjacent repeated tracks');
  const before=session.currentTrackId;
  assert.equal(session.pause(),true);assert.equal(session.state,'paused');
  assert.equal(session.resume(),true);assert.equal(session.currentTrackId,before);
  assert.equal(session.stop(),true);assert.equal(session.state,'stopped');
  assert.equal(session.currentTrackId,null);
  session.dispose();
  assert.equal(player.listeners.has('ended'),false);
  assert.equal(session.start(),false,'disposed music cannot restart');
});

test('music resume only follows battle; no additional sound activation button',()=>{
  const code=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(code,/explorationSoundtrack\.start\(\)/);
  assert.match(code,/explorationSoundtrack\.pause\(\)/);
  assert.match(code,/explorationSoundtrack\.resume\(\)/);
  assert.match(code,/explorationSoundtrack\.stop\(\)/);
  assert.match(code,/if\(navigationTesting\)explorationSoundtrack\.resume\(\)/);
  assert.match(code,/window\.addEventListener\('pagehide',\(\)=>explorationSoundtrack\.dispose\(\)/);
});

test('Android media rejection remains observable and retries with the next trusted gesture',async()=>{
  let player,playCount=0;
  const errors=[];
  class PolicyAudio {
    constructor(){player=this;this.events=new Map();this.currentTime=0;}
    addEventListener(name,callback){this.events.set(name,callback);}
    removeEventListener(name){this.events.delete(name);}
    play(){
      playCount++;
      if(playCount===1)return Promise.reject(Object.assign(new Error('gesture required'),{name:'NotAllowedError'}));
      return Promise.resolve();
    }
    pause(){}
    removeAttribute(){}
  }
  const session=createExplorationSoundtrackV1({
    AudioCtor:PolicyAudio,assetUrl:file=>'https://example.org/'+file,onError:e=>errors.push(e.name)
  });
  assert.equal(session.start(),true);
  await Promise.resolve();await Promise.resolve();
  assert.equal(session.state,'blocked','a rejected play must not be reported as audible');
  assert.equal(session.lastError,'NotAllowedError');
  assert.deepEqual(errors,['NotAllowedError']);
  const song=session.currentTrackId;
  assert.equal(session.start(),true,'the next real gesture may re-attempt this exact song');
  await Promise.resolve();await Promise.resolve();
  assert.equal(session.state,'playing');
  assert.equal(session.currentTrackId,song);
  assert.equal(playCount,2);
  session.dispose();
  assert.equal(player.events.has('error'),false);
});

test('Tester starts audio before native confirmation and first-paint module URLs are versioned',()=>{
  const code=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  
  // The real handler is wired through the project's canonical $ helper.
  const handler=code.slice(code.indexOf("$('navigation-toggle').addEventListener('click'"));
  assert.ok(handler.indexOf('explorationSoundtrack.start()') < handler.indexOf('setNavigationTesting(!navigationTesting)'), 'music activation must precede consent dialog');
  assert.match(code,/retryExplorationAudioFromGesture/);
  assert.match(code,/document.addEventListener\('pointerdown',retryExplorationAudioFromGesture/);
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.match(html,/exploration-mobile-real-play-r2/);
});
