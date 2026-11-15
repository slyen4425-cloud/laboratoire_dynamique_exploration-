#!/usr/bin/env python3
"""One-time strict native-house cleanup. Edit alpha only; NEVER redraw roof/walls/windows.

Author-supplied chalet and crystal/tent visual identities are frozen.
Extracts stray snow/stone ground from 20 other snow-house canonical WebPs and
removes solid grey art contamination behind pagoda lanterns. Source filenames
and official IDs stay unchanged; all checksum ledgers are rewritten in place.
"""
from __future__ import annotations
import hashlib, io, json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/"assets/exploration/objects/buildings"
MANIFEST=DIR/"manifest.snow-houses.v1.json"
SUMS=DIR/"SHA256SUMS.snow-houses-v1.txt"
PROTECT="building_house_snow_alpine_timber_2p5d_side_01.webp"
SKIP={"ice_crystal","elven_crystal","nordic_tent"}
LINES={
"front":[(0,306),(45,325),(100,346),(161,355),(230,355),(301,340),(347,318),(384,307)],
"side":[(0,301),(43,319),(102,346),(158,355),(229,352),(300,333),(363,304),(384,297)],
"back":[(0,306),(53,323),(117,347),(185,358),(257,356),(324,338),(370,311),(384,305)]}
PAGODA={
"side":[(22,318),(55,331),(95,345),(156,354),(224,350),(281,329),(338,301),(370,295)],
"front":[(22,317),(62,335),(105,342),(153,354),(206,357),(267,348),(326,347),(374,328)],
"back":[(22,316),(67,329),(125,342),(185,352),(251,359),(310,346),(364,324)]}
GREY_BACKING={
"side":[[(47,211),(85,235),(81,307),(49,318)]],
"front":[[(44,222),(87,249),(77,317),(41,319)],[(295,244),(365,241),(375,352),(320,354)]],
"back":[[(40,205),(80,228),(79,318),(41,316)],[(329,207),(378,225),(381,331),(333,328)]]}

def clean(image,variant,view):
    original=np.asarray(image.convert("RGBA"),dtype=np.uint8)
    data=original.copy()
    H,W=data.shape[:2]
    assert (H,W)==(384,384)
    yy,xx=np.mgrid[:H,:W]
    if variant=="east_pagoda":
        polygons=Image.new("L",(W,H),0)
        draw=ImageDraw.Draw(polygons)
        for points in GREY_BACKING[view]: draw.polygon(points,fill=255)
        region=np.asarray(polygons)>0
        r,g,b,a=[data[:,:,i].astype(np.int16) for i in range(4)]
        gray=(abs(r-g)<30)&(b-g>-5)&(b-r<30)&(r<138)&(g<139)&(b<151)&(a>0)
        gray &= ~((r>g+20)|(r>b+23))
        data[:,:,3][gray&region]=0
        if view=="side": data[:,:,3][(xx>336)&(yy>287)&(b>r+5)&(r<200)]=0
        elif view=="front":data[:,:,3][(xx>348)&(yy>299)&(b>r+5)]=0
        else:data[:,:,3][(xx>351)&(yy>302)&(b>r+5)]=0
    anchors=PAGODA[view] if variant=="east_pagoda" else LINES[view]
    x,y=zip(*anchors)
    floor=np.interp(np.arange(W),x,y)
    factor=np.clip((floor[None,:]-yy+1.5)/3.0,0.0,1.0)
    data[:,:,3]=np.uint8(np.rint(data[:,:,3].astype(float)*factor))
    # Preserve every RGB pixel and the actual building silhouette at/above its floor line.
    assert np.array_equal(original[:,:,:3],data[:,:,:3])
    assert np.all(data[:,:,3] <= original[:,:,3])
    assert np.array_equal(original[:290,:,3],data[:290,:,3]) if variant!="east_pagoda" else True
    ratio=float(data[:,:,3].sum()/max(1,original[:,:,3].sum()))
    if ratio<.90 or ratio>.998:
        raise ValueError(f"Unexpected change to {variant}:{view}: alpha ratio {ratio:.5f}")
    return Image.fromarray(data,"RGBA"),ratio

def main():
    doc=json.loads(MANIFEST.read_text(encoding="utf8"))
    old_sums=SUMS.read_text(encoding="utf8")
    if doc.get("modelCount")!=10 or len(doc.get("files",[]))!=30:
        raise ValueError("unexpected house inventory")
    updated=old_sums
    changes=[]; protected=[]; bytes_before=bytes_after=0
    for row in doc["files"]:
        path=ROOT/row["path"]
        raw=path.read_bytes()
        old_hash=hashlib.sha256(raw).hexdigest()
        if old_hash!=row["sha256"] or len(raw)!=row["bytes"] or f"{old_hash}  {row['path']}" not in old_sums:
            raise ValueError(f"Source manifest stale: {path}")
        filename=path.name
        if filename==PROTECT or row["variant"] in SKIP:
            protected.append((filename,old_hash));continue
        original=Image.open(io.BytesIO(raw)).convert("RGBA")
        output,ratio=clean(original,row["variant"],row["view"])
        stream=io.BytesIO()
        output.save(stream,format="WEBP",lossless=True,exact=True,method=6)
        new=stream.getvalue()
        new_hash=hashlib.sha256(new).hexdigest()
        bytes_before+=len(raw);bytes_after+=len(new)
        if new_hash==old_hash:raise ValueError(f"No real edit: {filename}")
        path.write_bytes(new)
        row["bytes"]=len(new)
        row["sha256"]=new_hash
        updated=updated.replace(f"{old_hash}  {row['path']}",f"{new_hash}  {row['path']}")
        changes.append({"filename":filename,"old_sha":old_hash,"new_sha":new_hash,"before":len(raw),"after":len(new),"alpha_ratio":round(ratio,5)})
    if len(changes)!=20 or len(protected)!=10:
        raise ValueError(f"Change count mismatch {len(changes)}, protected {len(protected)}")
    assert next(x["sha256"] for x in doc["files"] if x["path"].endswith(PROTECT))=="a27851cd830ae9a7dba18ade9c6218bd218eceabbc34020d80a0ecdbd1f65467"
    MANIFEST.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    SUMS.write_text(updated,encoding="utf8")
    audit={"edited":len(changes),"unchanged":len(protected),"old_bytes":bytes_before,"new_bytes":bytes_after,"changes":changes}
    Path("/tmp/house-ground-props-audit.json").write_text(json.dumps(audit,indent=2),encoding="utf8")
    print(json.dumps({k:v for k,v in audit.items() if k!="changes"},indent=2))
if __name__=="__main__":main()
