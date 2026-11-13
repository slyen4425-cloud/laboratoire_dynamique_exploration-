#!/usr/bin/env python3
"""Materialise one usable 12-hero asset library from retained author archives.

The ZIPs remain author SOURCE only; no sprite sheets or duplicate frames are
published. Only this script creates the canonical ready-to-render assets.
"""
import json, pathlib, zipfile, re, struct, hashlib
from collections import defaultdict
packs = (
    "gensrpg_monster_capture_lot_1_6_heros_decoupes.zip",
    "GenSRPG_heros_lot2_A_heros_07_08_09.zip",
    "GenSRPG_heros_lot2_B_heros_10_11_12.zip",
)
root=pathlib.Path("assets/exploration/actors/official")
directions=("N","NE","E","SE","S","SW","W","NW")
seen={}
total=0
def png_dimensions(blob):
    if not blob.startswith(b"\x89PNG\r\n\x1a\n") or len(blob)<26:
        raise ValueError("Not a PNG")
    return struct.unpack(">II",blob[16:24]),blob[25]

for pack in packs:
    with zipfile.ZipFile(pack) as z:
        folders=sorted(set(f.split("/")[0] for f in z.namelist()
                           if f.endswith("/metadata.json")))
        if len(folders) not in (3,6):
            raise ValueError("Unexpected hero count in "+pack+" "+str(folders))
        for folder in folders:
            if folder in seen or not re.fullmatch(r"\d\d_[a-z_]+",folder):
                raise ValueError("Duplicate or invalid hero identity "+folder)
            metadata=json.loads(z.read(folder+"/metadata.json"))
            if tuple(metadata["frame_size"])!=(128,160):
                raise ValueError("Wrong author frame dimensions "+folder)
            if set(metadata["directions"])!=set(directions):
                raise ValueError("Incomplete 8 directions: "+folder)
            if metadata.get("frames_each",metadata.get("frame_count_each"))!=6:
                raise ValueError("Not six frames per direction: "+folder)
            record=dict(id="hero.official."+folder,
                        name=folder.split("_",1)[1].replace("_"," ").capitalize(),
                        thumbnail="assets/exploration/actors/official/"+folder+"/modele_face.png",
                        back="assets/exploration/actors/official/"+folder+"/modele_dos.png",
                        fps=8,frameSize=[128,160],directions={})
            for file in ("modele_face.png","modele_dos.png"):
                rel=folder+"/"+file
                blob=z.read(rel)
                png_dimensions(blob)
                path=root/rel
                path.parent.mkdir(parents=True,exist_ok=True)
                path.write_bytes(blob)
                total+=len(blob)
            for direction in directions:
                assets=[]
                for frame in range(6):
                    rel=f"{folder}/frames/{direction}/{frame:02}.png"
                    blob=z.read(rel)
                    (width,height),colorType=png_dimensions(blob)
                    if (width,height)!=(128,160) or colorType not in (4,6):
                        raise ValueError("Hero animation must be transparent RGBA 128x160 "+rel)
                    path=root/rel
                    path.parent.mkdir(parents=True,exist_ok=True)
                    path.write_bytes(blob)
                    assets.append("assets/exploration/actors/official/"+rel)
                    total+=len(blob)
                record["directions"][direction]=assets
            seen[folder]=record
if len(seen)!=12 or sorted(int(key[:2]) for key in seen)!=list(range(1,13)):
    raise ValueError("Expected twelve precisely numbered hero models")
catalog=dict(schema="exploration-official-hero-catalog-v1",version=1,
             source="archives auteur conservées — trois lots, aucun moteur dupliqué",
             heroes=[seen[key] for key in sorted(seen)])
path=root/"catalog.json"
path.parent.mkdir(parents=True,exist_ok=True)
path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
files=[f for f in root.rglob("*") if f.is_file()]
print("CANONICAL_HERO_ASSETS count=12 directions=8 frames=6 files="+str(len(files))+
      " bytes="+str(total)+" manifest="+str(path))
for r in catalog["heroes"]:
    print("HERO",r["id"],r["name"],"frames",sum(map(len,r["directions"].values())))
