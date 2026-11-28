// Build an isolated self-contained HTML for the PR artifact. Never publish to Pages.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {chromium} from 'playwright';
const html=await readFile('prototypes/organic-relief-pilot.html','utf8');
const match=html.match(/<script type="module">([\s\S]*?)<\/script>/);
if(!match)throw Error('missing prototype script');
const assets=['grass_forest_base_01.webp','snow_ground_stylized_01.webp','volcanic_ash_lava_stylized_01.webp'];
const root='assets/exploration/materials/forest/surfaces/';
const embedded={};
for(const name of assets)embedded['../'+root+name]='data:image/webp;base64,'+(await readFile(root+name)).toString('base64');
embedded['../assets/sculpt/cliff-base-hd-v49.webp']='data:image/webp;base64,'+(await readFile('assets/sculpt/cliff-base-hd-v49.webp')).toString('base64');
const source=match[1].replace('img.src=path;','img.src=embedded[path]??path;');
const result=await build({stdin:{contents:'const embedded='+JSON.stringify(embedded)+';\n'+source,resolveDir:resolve('prototypes'),loader:'js'},bundle:true,write:false,format:'esm',platform:'browser'});
await mkdir('artifacts/organic-relief',{recursive:true});
const dest=resolve('artifacts/organic-relief/index.html');
await writeFile(dest,html.replace(match[0],()=>'<script type="module">'+result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')+'</script>'));
const browser=await chromium.launch({headless:true});
try{
 for(const [device,viewport] of [['PC',{width:1440,height:960}],['Android-paysage',{width:932,height:430}]]){
  const page=await browser.newPage({viewport,hasTouch:device!=='PC',isMobile:device!=='PC'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+dest);
  for(const name of assets){
   await page.selectOption('#biome',name);
   await page.waitForFunction(name=>document.querySelector('#status').dataset.biome===name,name);
   const info=await page.evaluate(()=>{const a=document.querySelector('#old'),b=document.querySelector('#new');
     const sample=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let opaque=0,sum=0;for(let i=0;i<d.length;i+=16){opaque+=d[i+3]>0;sum+=d[i]+d[i+1]+d[i+2];}return {opaque,sum};};
     return {a:sample(a),b:sample(b),status:document.querySelector('#status').textContent};});
   if(!info.status.startsWith('Textures chargées')||info.a.opaque<50000||info.b.opaque<50000||info.a.sum===info.b.sum||errors.length)throw Error(JSON.stringify({info,errors}));
   await page.screenshot({path:resolve('artifacts/organic-relief/'+device+'-'+name.replace('.webp','.png')),fullPage:true});
  }
  await page.close();
 }
}finally{await browser.close();}
