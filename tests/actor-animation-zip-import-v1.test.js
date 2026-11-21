import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateRawSync} from 'node:zlib';
import {readActorAnimationZipV1} from '../src/actors/actor-animation-zip-import-v1.js';
function crc32(bytes){
 let value=0xffffffff;
 for(const byte of bytes){
  value^=byte;
  for(let bit=0;bit<8;bit++)value=(value>>>1)^((value&1)?0xedb88320:0);
 }
 return (value^0xffffffff)>>>0;
}
function packZip(entries,{compression=0,damageCrc=false}={}){
 const sections=[],table=[];
 let offset=0;
 for(const [name,bytes] of entries){
  const title=Buffer.from(name,'utf8'),raw=Buffer.from(bytes);
  const packed=compression===8?deflateRawSync(raw):raw,crc=crc32(raw);
  const local=Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50,0);
  local.writeUInt16LE(20,4);local.writeUInt16LE(compression,8);
  local.writeUInt32LE(crc,14);local.writeUInt32LE(packed.length,18);
  local.writeUInt32LE(raw.length,22);local.writeUInt16LE(title.length,26);
  const central=Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50,0);
  central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);
  central.writeUInt16LE(compression,10);
  central.writeUInt32LE(damageCrc?crc^1:crc,16);
  central.writeUInt32LE(packed.length,20);central.writeUInt32LE(raw.length,24);
  central.writeUInt16LE(title.length,28);central.writeUInt32LE(offset,42);
  sections.push(local,title,packed);table.push(central,title);
  offset+=local.length+title.length+packed.length;
 }
 const middle=Buffer.concat(table),end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);
 end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);
 end.writeUInt32LE(middle.length,12);end.writeUInt32LE(offset,16);
 return new File([Buffer.concat([...sections,middle,end])],'direction.zip',{type:'application/zip'});
}
const png=(index)=>Buffer.from([137,80,78,71,13,10,26,10,index]);
const entries=()=>[5,2,4,0,3,1].map(i=>['frames/frame_'+i+'.png',png(i)]);
test('imports six PNG frames by natural numeric order, stored ZIP',async()=>{
 const files=await readActorAnimationZipV1(packZip(entries()));
 assert.deepEqual(files.map(f=>f.name),[0,1,2,3,4,5].map(i=>'frame_'+i+'.png'));
 assert.equal(files[0].type,'image/png');
 assert.deepEqual([...new Uint8Array(await files[5].arrayBuffer())], [...png(5)]);
});
test('imports deflate-raw ZIP with same verified ordered files',async()=>{
 const files=await readActorAnimationZipV1(packZip(entries(),{compression:8}));
 assert.equal(files.length,6);
 assert.equal(files[0].name,'frame_0.png');
});
test('rejects a wrong number of frames rather than silently losing animations',async()=>{
 await assert.rejects(readActorAnimationZipV1(packZip(entries().slice(0,5))),/exactement 6/);
});
test('rejects corrupted CRC before saving a hero or NPC',async()=>{
 await assert.rejects(readActorAnimationZipV1(packZip(entries(),{damageCrc:true})),/CRC/);
});
test('rejects unsafe paths before decoding images',async()=>{
 const malicious=[...entries().slice(0,5),['../bad.png',png(6)]];
 await assert.rejects(readActorAnimationZipV1(packZip(malicious)),/Chemin non autorisé/);
});
test('rejects wrong image signature and requires genuine PNG or WebP bytes',async()=>{
 const fake=[...entries().slice(0,5),['frame_9.png',Buffer.from('not a png')]];
 await assert.rejects(readActorAnimationZipV1(packZip(fake)),/corrompu/);
});
