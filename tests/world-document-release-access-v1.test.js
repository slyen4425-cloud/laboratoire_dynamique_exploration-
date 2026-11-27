import test from 'node:test';
import assert from 'node:assert/strict';
import {openWorldDocumentReleaseAccessV1,WORLD_DOCUMENT_RELEASE_OWNER_V1} from '../src/storage/world-document-release-access-v1.js';
const storage=()=>{const m=new Map();return {get length(){return m.size;},key:i=>[...m.keys()][i]??null,getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
test('release composition selects one explicit owner and keeps legacy unchanged before cutover',async()=>{
 const s=storage(),sessionStorage=storage();
 assert.equal(WORLD_DOCUMENT_RELEASE_OWNER_V1,'legacy');
 const legacy=await openWorldDocumentReleaseAccessV1({storage:s,sessionStorage});assert.equal(legacy.durable,false);
 await assert.rejects(openWorldDocumentReleaseAccessV1({storage:s,sessionStorage,owner:{}}),/incomplète/);
 const owner={run:async cmd=>cmd({readDraft:id=>({id})})};
 const durable=await openWorldDocumentReleaseAccessV1({storage:s,sessionStorage,universeId:'unv_test1234',owner,store:{}});
 assert.equal(durable.durable,true);assert.equal((await durable.readDraft()).id,'unv_test1234');assert.equal(s.length,0);
});
