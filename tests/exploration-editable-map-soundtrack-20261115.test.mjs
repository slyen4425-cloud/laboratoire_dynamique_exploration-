import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createExplorationSoundtrackV1,explorationSoundtrackSceneV1,
 EXPLORATION_TRACKS_V1} from '../src/audio/exploration-soundtrack-v1.js';
const ids=Object.freeze(Array.from({length:4},(_,i)=>
 'gensrpg:music:exploration:0'+(i+1)));
const scene=(tracks=ids,rest={})=>({tracks,order:'shuffle',volume:.45,fadeMs:0,repeat:true,...rest});
function fakeAudio(){
 const voices=[];
 class AudioFake{
  constructor(){this.events={};this.currentTime=0;voices.push(this);}
  addEventListener(type,fn){this.events[type]=fn}
  removeEventListener(type,fn){if(this.events[type]===fn)delete this.events[type]}
  play(){return Promise.resolve()}
  pause(){}
  removeAttribute(){}
  load(){}
 }
 return {AudioFake,voices};
}
test('native Explorer accepts only the four current official Combat catalog IDs',()=>{
 const approved=explorationSoundtrackSceneV1(scene());
 assert.deepEqual(approved.tracks,EXPLORATION_TRACKS_V1);
 assert.throws(()=>explorationSoundtrackSceneV1(scene(['my-private-asset'])),/Unknown/);
 assert.throws(()=>explorationSoundtrackSceneV1(scene([ids[0],ids[0]])),/unique/);
 assert.throws(()=>explorationSoundtrackSceneV1(scene(ids,{volume:5})),/Invalid/);
 assert.equal(explorationSoundtrackSceneV1(scene([])).tracks.length,0);
});
test('Map composer selection, order, volume and repeat run through ONE native Exploration player',async()=>{
 const {AudioFake,voices}=fakeAudio();
 const player=createExplorationSoundtrackV1({AudioCtor:AudioFake,
  sceneMusic:scene([ids[2],ids[0]],{order:'sequence',volume:.2,repeat:false}),
  assetUrl:file=>'https://test.invalid/exploration/'+file});
 assert.equal(voices.length,1);
 assert.equal(voices[0].volume,.2);
 assert.equal(player.start(),true);
 await Promise.resolve();
 assert.match(voices[0].src,/exploration-03\.mp3$/);
 assert.equal(player.currentTrackId,'exploration-3');
 voices[0].events.ended();
 await Promise.resolve();
 assert.match(voices[0].src,/exploration-01\.mp3$/);
 assert.equal(player.currentTrackId,'exploration-1');
 voices[0].events.ended();
 assert.equal(player.state,'stopped');
 assert.equal(player.currentTrackId,null);
 player.dispose();
});
test('empty Map music means silence without a second Combat audio element',()=>{
 const {AudioFake,voices}=fakeAudio();
 const player=createExplorationSoundtrackV1({AudioCtor:AudioFake,sceneMusic:scene([])});
 assert.equal(voices.length,1);
 assert.equal(player.start(),false);
 player.dispose();
});
test('gameplay only receives the official Map playlist while original MP3 URLs stay native',()=>{
 const text=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(text,/soundtrackMusic/);
 assert.match(text,/createExplorationSoundtrackV1\(\{sceneMusic:captureMapMusicScene\}\)/);
 assert.match(text,/explorationSoundtrack=createExplorationSoundtrackV1\(\)/);
 assert.doesNotMatch(text,/new Audio\(.*soundtrackMusic/);
});
