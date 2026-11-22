#!/usr/bin/env python3
"""One-time replacement of uploaded bridge/stair assets; preserves object IDs."""
from pathlib import Path
from zipfile import ZipFile
import hashlib
import json

ROOT=Path(__file__).resolve().parents[1]
BR=ROOT/"assets/exploration/objects/bridges"
ST=ROOT/"assets/exploration/objects/stairs"
def sha(b):return hashlib.sha256(b).hexdigest()
def webp(b):
    assert len(b)>500 and b[:4]==b"RIFF" and b[8:12]==b"WEBP"
    assert int.from_bytes(b[4:8],"little")+8==len(b)
def jsonfile(p):return json.loads(p.read_text(encoding="utf8"))
def save(p,obj):p.write_text(json.dumps(obj,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
def replace_once(path,old,new):
    s=path.read_text(encoding="utf8")
    assert s.count(old)==1,(str(path),old[:100],s.count(old))
    path.write_text(s.replace(old,new),encoding="utf8")
bridgepath=BR/"manifest.v1.json"
stairpath=ST/"manifest.v1.json"
bridges=jsonfile(bridgepath)
stairs=jsonfile(stairpath)
assert len(bridges["files"])==32 and len(stairs["files"])==33
updated={}
with ZipFile(ROOT/"ponts_nettoyes_labo_exploration_2026-11-22.zip") as z:
    inv=json.loads(z.read("inventaire.json"))
    assert len(inv["files"])==8
    for record in inv["files"]:
        path=record["asset_path"]
        assert path.startswith("assets/exploration/objects/bridges/bridge_")
        assert any("_2p5d_"+v+"_01.webp" in path for v in ("horizontal","vertical","diagonal_left","diagonal_right"))
        assert any(f in path for f in ("bridge_castle_","bridge_wood_rustic_"))
        dst=ROOT/path
        assert dst.exists(),path
        b=z.read(path)
        webp(b)
        assert sha(b)==record["sha256"] and len(b)==record["bytes"]
        metadata=next(x for x in bridges["files"] if x["path"]==path)
        assert metadata["assetId"].startswith("object.bridge.")
        dst.write_bytes(b)
        metadata.update(sha256=sha(b),bytes=len(b),sourceFile="User-cleaned 2026-11-22",
                        sourceSha256=record["source_sha256"],
                        runtimeProfile="mobile-webp-512x512-lossless-v75")
        updated[path]=(len(b),sha(b))
bridges["assetCleanup"]={"revision":"v75","format":"WebP lossless RGBA",
                        "scope":"8 wood_rustic and castle assets replaced in place",
                        "legacyFilesUnchanged":4}
save(bridgepath,bridges)
with ZipFile(ROOT/"escalier_terre_bois_2_profils_valides.zip") as z:
    inv={x["file"]:x for x in json.loads(z.read("SHA256.json"))}
    for name,dest,variant in (
        ("escalier_terre_bois_profil_B_preview_512.webp",
         "stairs_earth_log_path_2p5d_side_01.webp","side"),
        ("escalier_terre_bois_profil_A_preview_512.webp",
         "stairs_earth_log_path_2p5d_side_alt_01.webp","side_alt")
    ):
        b=z.read(name)
        webp(b)
        assert sha(b)==inv[name]["sha256"] and len(b)==inv[name]["bytes"]
        p=ST/dest
        if variant=="side": assert p.exists()
        else: assert not p.exists()
        p.write_bytes(b)
        path=str(p.relative_to(ROOT))
        assetId="object.stairs.earth_log_path_2p5d."+variant+".01"
        meta=next((x for x in stairs["files"] if x["assetId"]==assetId),None)
        if variant=="side": assert meta and meta["path"]==path
        else:
            assert meta is None
            meta={"assetId":assetId,"path":path,"role":"stairs-visual",
                  "family":"earth_log_path","variant":variant,"view":"side-2.5d"}
            stairs["files"].append(meta)
        meta.update(sha256=sha(b),bytes=len(b),sourceFile=name,
                    runtimeProfile="webp-512x512-lossless-20261122")
        updated[path]=(len(b),sha(b))
for variant in ("front","oblique"):
    name="stairs_earth_log_path_2p5d_"+variant+"_01.webp"
    src=ROOT/name
    assert src.exists(),name
    b=src.read_bytes()
    webp(b)
    dst=ST/name
    assert dst.exists(),name
    dst.write_bytes(b)
    path=str(dst.relative_to(ROOT))
    meta=next(x for x in stairs["files"] if x["path"]==path)
    assert meta["assetId"]=="object.stairs.earth_log_path_2p5d."+variant+".01"
    meta.update(sha256=sha(b),bytes=len(b),sourceFile="User-cleaned "+name,
                runtimeProfile="webp-rgba-384x384-20261122")
    updated[path]=(len(b),sha(b))
assert len(stairs["files"])==34
assert len({x["assetId"] for x in stairs["files"]})==34
assert len({x["path"] for x in stairs["files"]})==34
save(stairpath,stairs)
catalog=ROOT/"src/objects/object-definition-catalog.js"
replace_once(catalog,
    "{ id: 'side', label: 'Côté', assetId: 'object.stairs.earth_log_path_2p5d.side.01' }",
    "{ id: 'side', label: 'Côté · Profil B', assetId: 'object.stairs.earth_log_path_2p5d.side.01' },\n"
    "        { id: 'side_alt', label: 'Côté · Profil A', assetId: 'object.stairs.earth_log_path_2p5d.side_alt.01' }")
adapter=ROOT/"src/assets/world-object-asset-adapter.js"
anchor="""  'object.stairs.earth_log_path_2p5d.side.01': Object.freeze({
    id: 'object.stairs.earth_log_path_2p5d.side.01',
    kind: 'stairs-visual',
    path: './assets/exploration/objects/stairs/stairs_earth_log_path_2p5d_side_01.webp',
    render: Object.freeze({ rotationOffsetDeg: 0, widthScale: 1, heightScale: 1 })
  }),"""
addition=""" 
  'object.stairs.earth_log_path_2p5d.side_alt.01': Object.freeze({
    id: 'object.stairs.earth_log_path_2p5d.side_alt.01',
    kind: 'stairs-visual',
    path: './assets/exploration/objects/stairs/stairs_earth_log_path_2p5d_side_alt_01.webp',
    render: Object.freeze({ rotationOffsetDeg: 0, widthScale: 1, heightScale: 1 })
  }),"""
replace_once(adapter,anchor,anchor+addition)
test=ROOT/"tests/exploration-stairs-2p5d-v1.test.js"
for before,after in (
 ("assert.equal(manifest.files.length,33);","assert.equal(manifest.files.length,34);"),
 ("assert.equal(added.length,30);","assert.equal(added.length,31);"),
 ("assert.equal(new Set(added.map(x=>x.assetId)).size,30);",
  "assert.equal(new Set(added.map(x=>x.assetId)).size,31);"),
 ("assert.deepEqual(def.visual.variants.map(v=>v.id),views);",
  "assert.deepEqual(def.visual.variants.map(v=>v.id),family==='earth_log_path'?[...views,'side_alt']:views);"),
 ("for(const view of views) {",
  "for(const view of (family==='earth_log_path'?[...views,'side_alt']:views)) {"),
 ("the 30 committed WebP binaries match","the 31 committed WebP binaries match")
):
    replace_once(test,before,after)
replace_once(ROOT/"src/sculpt-lab-main.js","?source-clean-v74","?source-clean-v75")
replace_once(ROOT/"tests/sculpt-bridge-source-webps-v74.test.js","source-clean-v74","source-clean-v75")
for path,(size,digest) in updated.items():
    b=(ROOT/path).read_bytes()
    assert len(b)==size and sha(b)==digest
assert len(updated)==12
cp=ROOT/"docs/checkpoints/EXPLORATION_USER_CLEANED_BRIDGES_STAIRS_20261122.md"
cp.write_text(
    "# Escaliers et ponts nettoyés — 22 novembre 2026\n\n"
    "8 ponts remplacés à chemin et ID identiques. Les vues front/oblique/côté "
    "de terre-rondins remplacées sans changer les identifiants préexistants. "
    "Nouvelle variante côté A : object.stairs.earth_log_path_2p5d.side_alt.01. "
    "Le modèle B remplace le côté d'origine; l'ancien visuel n'est plus actif.\n\n"
    "Pas de changement des collisions, franchissements, tailles et positions. "
    "Pas de duplication des images dans v81 (historique gelé).\n\n"
    +"\n".join("- "+path+" | "+str(n)+" octets | sha256 "+digest
      for path,(n,digest) in sorted(updated.items()))+"\n",
    encoding="utf8")
print(json.dumps({"assets":len(updated),"bridges":8,"stairs_existing_replaced":3,
                  "stairs_new_variant":1,"files":sorted(updated)},ensure_ascii=False))
