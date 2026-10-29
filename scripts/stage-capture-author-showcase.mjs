// Build-time sync: Combat main owns engine, Combat gh-pages owns the live
// author-published Showcase. One staged owner per data class, never a runtime
// request to a foreign repo or an alternate fallback catalogue.
import {readFileSync,existsSync,mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';

export const CAPTURE_AUTHOR_MANIFESTS_V1=Object.freeze([
  {path:'src/catalogs/capture-showcase-creature-presets-v1.js',
   name:'CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1'},
  {path:'src/catalogs/capture-showcase-skill-presets-v1.js',
   name:'CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1'}
]);
function safePath(root,relative) {
  if(typeof relative!=='string'||!/^data\/capture\/showcase\/[\w. -]+\.capture-(creature|skill)-transfer-v1\.json$/.test(relative))
    throw new RangeError('Untrusted author Showcase manifest path: '+relative);
  const path=resolve(root,relative);
  if(!path.startsWith(root+'/'))throw new RangeError('Author path outside checkout');
  return path;
}
function copyAuthorFile(source,target,relative){
  const src=resolve(source,relative),dst=resolve(target,relative);
  if(!src.startsWith(source+'/')||!dst.startsWith(target+'/'))
    throw new RangeError('Refusing path escape');
  if(!existsSync(src))throw new Error('Missing official published author file '+relative);
  mkdirSync(dirname(dst),{recursive:true});copyFileSync(src,dst);
}
export async function stageCaptureAuthorShowcaseV1({authorRoot,combatRoot}) {
  const source=resolve(authorRoot),target=resolve(combatRoot);
  const report={};
  const authored={creatureTransfers:[],skillTransfers:[]};
  for(const {path,name} of CAPTURE_AUTHOR_MANIFESTS_V1){
    const mod=await import(pathToFileURL(resolve(source,path)).href);
    const files=mod[name];
    if(!Array.isArray(files)||!files.length||new Set(files).size!==files.length)
      throw new RangeError('Missing or duplicate live Combat author entries: '+name);
    for(const file of files){
      safePath(source,file);
      copyAuthorFile(source,target,file);
      const transfer=JSON.parse(readFileSync(safePath(source,file),'utf8'));
      const expectedKind=name==='CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1'?'creature':'skill';
      if(transfer.schema!=='capture-'+expectedKind+'-transfer-v1'||transfer.version!==1||
         typeof transfer.draft?.id!=='string'||!transfer.draft.id)
        throw new RangeError('Invalid official Showcase transfer: '+file);
      authored[expectedKind+'Transfers'].push(transfer);
    }
    copyAuthorFile(source,target,path);
    report[name]=files.length;
  }
  copyAuthorFile(source,target,'data/capture/showcase/markers.capture-markers-v1.json');
  const authorSha=execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim();
  const engineSha=execFileSync('git',['rev-parse','HEAD'],{cwd:target,encoding:'utf8'}).trim();
  const provenance={schema:'capture-exploration-author-stage-v1',
    author:{branch:'gh-pages',commit:authorSha},
    engine:{branch:'main',commit:engineSha},
    ...report};
  // Read-only derived load artifact: exact author entries are still copied
  // unchanged above. One HTTP response replaces dozens of first-battle roundtrips.
  // This bundle must NEVER be edited independently of author transfers.
  const bundle={schema:'capture-author-encounter-bundle-v1',version:1,
    authorSha,engineSha, ...authored};
  const bundlePath=join(target,'data/capture/showcase/encounter-bundle.v1.json');
  writeFileSync(bundlePath,JSON.stringify(bundle)+'\n');
  report.encounterBundleBytes=Buffer.byteLength(JSON.stringify(bundle));
  writeFileSync(join(target,'examples/dom-demo/exploration-author-provenance.v1.json'),
    JSON.stringify(provenance,null,2)+'\n');
  return Object.freeze(provenance);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const result=await stageCaptureAuthorShowcaseV1({
    authorRoot:process.argv[2]??'combat-author',
    combatRoot:process.argv[3]??'combat-preview'
  });
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
