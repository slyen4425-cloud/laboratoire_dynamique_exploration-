#!/usr/bin/env node
// Package ONLY the assets referenced by the official Capture visual catalog.
// The global-assets author branch (and its originals, ZIPs, drafts and .git)
// is never touched. The copied files retain their original relative paths.
import {readFileSync,mkdirSync,copyFileSync,statSync,existsSync} from 'node:fs';
import {dirname,join,posix,resolve} from 'node:path';

const source=resolve(process.argv[2]??'capture-source');
const dest=resolve(process.argv[3]??'site/preview/encounters-v80/capture-assets');
const catalogPath='data/assets/catalog/global-visual-assets.v1.json';
const library='assets/library/';
function safeRel(value){
 if(typeof value!=='string'||!value||value.startsWith('/')||value.includes('\\'))throw Error('Chemin Capture interdit: '+value);
 const normalized=posix.normalize(value);
 if(normalized==='.'||normalized==='..'||normalized.startsWith('../')||normalized!==value)throw Error('Chemin Capture non canonique: '+value);
 return normalized;
}
function full(base,rel){return join(base,safeRel(rel));}
function stage(rel){
 const src=full(source,rel),target=full(dest,rel);
 if(!existsSync(src)||!statSync(src).isFile())throw Error('Asset Capture publié manquant: '+rel);
 mkdirSync(dirname(target),{recursive:true});
 copyFileSync(src,target);
 if(statSync(src).size!==statSync(target).size)throw Error('Copie Capture corrompue: '+rel);
 return statSync(src).size;
}
const catalog=JSON.parse(readFileSync(full(source,catalogPath),'utf8'));
if(!Array.isArray(catalog.assets)||catalog.assets.length<300||catalog.storage?.libraryRoot!==library)
 throw Error('Catalogue Capture global non validé : refus de publication');
const needed=new Set([catalogPath]);
for(const asset of catalog.assets){
 const res=asset?.resource;
 if(!res||(!res.file&&!res.manifest))throw Error('Asset Capture sans fichier référencé: '+asset?.id);
 if(res.file)needed.add(library+safeRel(res.file));
 if(res.manifest){
  const manifestRel=library+safeRel(res.manifest);
  needed.add(manifestRel);
  const value=JSON.parse(readFileSync(full(source,manifestRel),'utf8'));
  const folder=posix.dirname(res.manifest);
  const relatives=[...(Array.isArray(value.frames)?value.frames:[]),...(value.atlas?[value.atlas]:[])];
  if(relatives.length===0)throw Error('Manifest sans frames ni atlas: '+manifestRel);
  for(const rel of relatives){
   if(typeof rel!=='string')throw Error('Frame non textuelle : '+manifestRel);
   needed.add(library+safeRel(posix.join(folder,safeRel(rel))));
  }
 }
}
let bytes=0;
for(const rel of [...needed].sort())bytes+=stage(rel);
console.log(JSON.stringify({
 type:'capture-public-assets-v1',catalog:catalog.catalogId,assets:catalog.assets.length,
 stagedFiles:needed.size,bytes,source:'Combat global-assets',dest,
 statement:'Only catalog-referenced files. No author originals or archives deleted.'
}));
