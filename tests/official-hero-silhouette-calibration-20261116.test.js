// Diagnostic, not another sprite source: read the 12 canonical PNG files.
// RGBA/PNG scanline alpha extents are measured WITHOUT editing any artwork.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
function bounds(path) {
 const png=readFileSync(new URL('../'+path,import.meta.url));
 assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');
 const w=png.readUInt32BE(16),h=png.readUInt32BE(20),depth=png[24],type=png[25];
 const n={6:4,2:3,4:2,0:1}[type];
 assert.equal(depth,8,'pixel depth'); assert.ok(n,'supported PNG type');
 let offset=8, chunks=[];
 while(offset<png.length){
  const bytes=png.readUInt32BE(offset),kind=png.toString('ascii',offset+4,offset+8);
  if(kind==='IDAT')chunks.push(png.subarray(offset+8,offset+8+bytes));
  offset+=12+bytes;
  if(kind==='IEND')break;
 }
 const data=inflateSync(Buffer.concat(chunks)),stride=w*n;
 let prev=Buffer.alloc(stride),at=0,left=w,top=h,right=-1,bottom=-1;
 for(let y=0;y<h;y++){
  const filter=data[at++],row=Buffer.alloc(stride);
  for(let x=0;x<stride;x++){
   const raw=data[at++],a=x>=n?row[x-n]:0,b=prev[x],c=x>=n?prev[x-n]:0;
   let predicted=0;
   if(filter===1)predicted=a;
   if(filter===2)predicted=b;
   if(filter===3)predicted=Math.floor((a+b)/2);
   if(filter===4){const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);predicted=da<=db&&da<=dc?a:db<=dc?b:c;}
   assert.ok(filter>=0&&filter<=4,'filter');
   row[x]=(raw+predicted)&255;
  }
  for(let x=0;x<w;x++) {
   const alpha=type===6?row[x*n+3]:type===4?row[x*n+1]:255;
   if(alpha>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
  }
  prev=row;
 }
 return {w,h,left,right,top,bottom,contentHeight:1+bottom-top,contentWidth:1+right-left,paddingBottom:h-1-bottom};
}
test('audit official hero silhouette heights against published green model; do not mutate any authored PNG',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../assets/exploration/actors/official/catalog.json',import.meta.url),'utf8'));
 assert.equal(catalog.heroes.length,12);
 const data=catalog.heroes.map(hero=>{
  const frames=hero.directions.S.map(bounds);
  return {id:hero.id,targetHeight:hero.targetHeight??35,frames:frames.map(f=>({height:f.contentHeight,width:f.contentWidth,top:f.top,bottomPadding:f.paddingBottom})),
    averageVisibleHeight:Math.round(frames.reduce((s,f)=>s+f.contentHeight,0)/frames.length*100)/100};
 });
 console.log('HERO_GREEN_SIZE_AUDIT='+JSON.stringify(data));
 for(const hero of data)assert.ok(hero.frames.every(f=>f.height>15&&f.height<=160));
});
