import test from 'node:test';
import assert from 'node:assert/strict';
import {createExplorationUniverseHeroProjectsV1}
 from '../src/storage/exploration-universe-hero-projects-v1.js';
const s=()=>{const m=new Map([['gensrpg.exploration.user-hero.old','preserve']]);
 return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};};
const heroes=()=>{const m=new Map([['hero.user.12345678-1234-1234-1234-123456789abc',{id:'hero.user.12345678-1234-1234-1234-123456789abc',name:'Vert'}]]);
 return {get:async k=>m.get(k)??null,list:async()=>[...m.values()],
  put:async v=>(m.set(v.id,v),v.id)};};
test('existing HeroDefinition and media database remain untouched and new games have own IDs',async()=>{
 const storage=s(),heroStore=heroes(),p=createExplorationUniverseHeroProjectsV1({storage,heroStore});
 assert.deepEqual(await p.list('unv_00000001'),[]);
 p.createEmpty('unv_00000001');p.createEmpty('unv_00000002');
 const id='hero.user.12345678-1234-1234-1234-123456789abc';
 await p.add('unv_00000001',id);
 assert.equal((await p.list('unv_00000001'))[0].id,id);
 assert.deepEqual(await p.list('unv_00000002'),[]);
 await assert.rejects(()=>p.add('unv_00000002',id),/appartient déjà/);
 assert.equal(storage.getItem('gensrpg.exploration.user-hero.old'),'preserve');
});
test('hero project refuses missing records or corrupt index without deleting IndexedDB',async()=>{
 const storage=s(),heroStore=heroes(),p=createExplorationUniverseHeroProjectsV1({storage,heroStore});
 p.createEmpty('unv_00000001');
 await assert.rejects(()=>p.add('unv_00000001','hero.user.absent'),/absent/);
 assert.throws(()=>p.createEmpty('unv_00000001'),/déjà présent/);
 storage.setItem('gensrpg.exploration.universe-heroes.index.v1','corrupt');
 assert.throws(()=>p.createEmpty('unv_00000002'),/illisible/);
 assert.equal((await heroStore.list()).length,1);
});
