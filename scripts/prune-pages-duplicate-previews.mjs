#!/usr/bin/env node
// Compact a single official Exploration main artifact; NEVER mutate source worktrees.
// Historical public URLs are light redirects, not secondary engines or copied assets.
import {statSync,existsSync,readFileSync,rmSync,mkdirSync,writeFileSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';

export const UNUSED=undefined;
const BUDGET_BYTES=900*1024*1024;
const HISTORY=Object.freeze([
  'encounters-v80', // Historical public address only, never executable release authority.
  'rich-presets-pr301','ramp-pr316','waterfall-height-pr320','unified-candidate'
]);
const PAGES=Object.freeze(['index.html','sculpt-lab.html','sculpt-lab-v80.html',
  'world-assembler.html','builder.html','play.html']);
const root=resolve(process.argv[2]??'site');
const arg=process.argv.slice(3).find(x=>x.startsWith('--budget-bytes='));
const budget=arg?Number(arg.slice('--budget-bytes='.length)):BUDGET_BYTES;
if(!Number.isSafeInteger(budget)||budget<=0)throw Error('Budget Pages invalide');
for(const path of ['index.html','sculpt-lab.html','world-assembler.html','play.html',
  'src/sculpt-lab-main.js','combat-preview/examples/dom-demo/exploration-encounter.js',
  'capture-assets/data/assets/catalog/global-visual-assets.v1.json',
  'release-provenance.v1.json']){
  if(!existsSync(join(root,path))||!statSync(join(root,path)).isFile())
    throw Error('Source moderne manquante, publication bloquée : '+path);
}
function bytes(path){
  if(!existsSync(path))return 0;
  return Number(execFileSync('du',['-sb','--',path],{encoding:'utf8'}).trim().split(/\s+/)[0]);
}
const before=bytes(root);
for(const old of ['v81','docs','tests','.github','.git','node_modules']){
  const target=join(root,old);
  if(existsSync(target))rmSync(target,{recursive:true,force:true});
}
for(const file of readdirSync(root)){
  if(/\.(zip|tar|gz|7z|rar)$/i.test(file))rmSync(join(root,file),{force:true});
}
// Legacy preview pages preserve URL query/hash and jump to the ONE modern root.
// They never load historical engine JS, assets, WorldDocuments, or Combat.
function redirect(target){
  const href='../../'+target;
  return '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8">'+
    '<meta name="robots" content="noindex"><title>Exploration — redirection historique</title>'+
    '<meta http-equiv="refresh" content="0;url='+href+'">'+
    '<link rel="canonical" href="'+href+'">'+
    '<script>location.replace(new URL('+JSON.stringify(href)+'+location.search+location.hash,location.href));</script>'+
    '</head><body><a href="'+href+'">Ouvrir le Labo Exploration actuel</a></body></html>\n';
}
for(const name of HISTORY){
  const folder=join(root,'preview',name);
  if(existsSync(folder))rmSync(folder,{recursive:true,force:true});
  mkdirSync(folder,{recursive:true});
  for(const page of PAGES){
    const target=page==='sculpt-lab-v80.html'?'sculpt-lab.html':page;
    writeFileSync(join(folder,page),redirect(target));
  }
  writeFileSync(join(folder,'historical-preview-alias.v1.json'),
    JSON.stringify({version:1,kind:'exploration-historical-preview-redirect',
      name,canonical:'../../',notice:'Ancien lien redirigé vers Exploration main, sans copie du moteur'},
      null,2)+'\n');
}
// A last root bookmark remains a redirect, not the frozen V80 editor.
writeFileSync(join(root,'sculpt-lab-v80.html'),
  '<!doctype html><html lang="fr"><head><meta charset="utf-8">'+
  '<meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=./sculpt-lab.html">'+
  '<script>location.replace(new URL("./sculpt-lab.html"+location.search+location.hash,location.href));</script>'+
  '</head><body><a href="./sculpt-lab.html">Explorer la version actuelle</a></body></html>\n');
console.log('SINGLE EXPLORATION MAIN: before='+before+' after='+bytes(root)+' budget='+budget);
for(const name of HISTORY)console.log('REDIRECT',name,bytes(join(root,'preview',name)));
if(bytes(root)>budget)throw Error('BUDGET PAGES : site trop volumineux, pas de publication');
