#!/usr/bin/env node
// ONLY changes the assembled GitHub Pages staging directory, never source repos.
// Historical preview source snapshots remain pinned in Git history. Their old
// entry URLs now intentionally redirect to the single maintained modern editor.
import {statSync,existsSync,readFileSync,rmSync,mkdirSync,writeFileSync,realpathSync} from 'node:fs';
import {join,resolve,relative} from 'node:path';
import {execFileSync} from 'node:child_process';

const ARCHIVE_BUDGET_BYTES=900*1024*1024;
const HISTORIC=Object.freeze([
  ['rich-presets-pr301','40955a7838beb8fb76e74fd4b941ce4bb7cd1505'],
  ['ramp-pr316','0dc90b9778b0a9e530adf7e90ac6d2506599c952'],
  ['waterfall-height-pr320','d4b9d8c804e592392c5b7a2ec7cc2f160291a076'],
  ['unified-candidate','77607520574c8509becf91a6dc55783e29c1570c']
]);
const PAGES=Object.freeze(['sculpt-lab.html','sculpt-lab-v80.html','world-assembler.html','builder.html','index.html','play.html']);
const root=resolve(process.argv[2]??'site');
const arg=process.argv.slice(3).find(x=>x.startsWith('--budget-bytes='));
const budget=arg?Number(arg.slice('--budget-bytes='.length)):ARCHIVE_BUDGET_BYTES;
if(!Number.isSafeInteger(budget)||budget<1)throw Error('Budget incohérent');
const verified=(rel)=>join(root,rel);
function requireFile(rel){
 const p=verified(rel);
 if(!existsSync(p)||!statSync(p).isFile())throw Error('Fichier canonique requis absent : '+rel);
}
function directorySize(dir){
 if(!existsSync(dir))return 0;
 const line=execFileSync('du',['-sb','--',dir],{encoding:'utf8'}).trim();
 return Number.parseInt(line.split(/\s+/)[0],10);
}
function logSizes(label){
 console.log('PAGES PAYLOAD REPORT — '+label);
 for(const rel of ['preview/encounters-v80',...HISTORIC.map(([n])=>'preview/'+n)]){
  const folder=verified(rel);
  console.log('PREVIEW\t'+rel+'\t'+directorySize(folder));
  for(const name of ['combat-preview','capture-assets','assets','src']){
   const p=join(folder,name);
   if(existsSync(p))console.log('SUBDIR\t'+rel+'/'+name+'\t'+directorySize(p));
  }
 }
 console.log('TOTAL_BYTES\t'+directorySize(root));
}
function redirect(page,old){
 const target='../encounters-v80/'+page;
 return '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8">'+
   '<meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url='+target+'">'+
   '<link rel="canonical" href="'+target+'"><title>Éditeur Exploration — lien historique</title></head>'+
   '<body><p>Cette ancienne prévisualisation est archivée. '+
   '<a href="'+target+'">Ouvrir l\'éditeur Exploration actuel</a>.</p></body></html>\n';
}
// Gate: do not touch any part of the staging tree until the source and four
// historic copies are proven to exist. No writes in a source checkout.
requireFile('sculpt-lab-v80.html');
for(const name of ['sculpt-lab.html','world-assembler.html','builder.html','index.html','play.html'])
 requireFile('preview/encounters-v80/'+name);
for(const [name] of HISTORIC)requireFile('preview/'+name+'/sculpt-lab.html');
const v80=readFileSync(verified('sculpt-lab-v80.html'));
logSizes('BEFORE');
for(const [name,sha] of HISTORIC){
 const dir=verified('preview/'+name);
 rmSync(dir,{recursive:true,force:false});
 mkdirSync(dir,{recursive:true});
 for(const page of PAGES){
  const safePage=page==='sculpt-lab-v80.html'?'sculpt-lab.html':page;
  writeFileSync(join(dir,page),redirect(safePage,name));
 }
 writeFileSync(join(dir,'historical-preview-alias.v1.json'),JSON.stringify({
  version:1,kind:'exploration-historical-preview-redirect',
  name,archivedSourceSha:sha,canonical:'../encounters-v80/',
  notice:'Source historique conservée dans Git ; l URL de test redirige maintenant vers le dernier éditeur officiel'
 },null,2)+'\n');
}
if(!readFileSync(verified('sculpt-lab-v80.html')).equals(v80))
 throw Error('FATAL: release V80 frozen changed');
logSizes('AFTER');
const bytes=directorySize(root);
if(bytes>budget){
 console.error('BUDGET PAGES FAILED: '+bytes+' > '+budget+' bytes; do not deploy');
 process.exitCode=1;
}else console.log('PAGES COMPACT GREEN: '+bytes+' / '+budget+' bytes; only one full preview');
