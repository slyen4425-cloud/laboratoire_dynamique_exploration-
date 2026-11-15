#!/usr/bin/env python3
"""Remove ONLY out-of-building environmental debris from selected winter houses.

Source of truth remains each existing 384x384 WebP/assetId; no redraw, no duplicate
asset, no WorldDocument/renderer mutation. Manual guard polygons in sprite pixels.
The user-supplied alpine_timber side view is intentionally never modified.
"""
import argparse, io, json, hashlib
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"assets/exploration/objects/buildings"
PROTECTED="building_house_snow_alpine_timber_2p5d_side_01.webp"
SPEC={
"east_pagoda":{
"side":[[(0,290),(35,297),(48,309),(67,314),(78,330),(0,350)],[(350,298),(384,277),(384,367),(331,346)],[(0,375),(384,375),(384,352),(282,352),(230,355),(163,357),(118,356),(67,343),(0,340)]],
"front":[[(0,291),(44,295),(55,314),(75,328),(0,354)],[(357,307),(384,292),(384,366),(331,347)],[(0,375),(384,375),(384,352),(313,352),(263,354),(207,353),(145,355),(97,354),(63,345),(0,349)]],
"back":[[(0,291),(43,294),(55,311),(77,329),(0,347)],[(352,291),(384,290),(384,372),(327,351)],[(0,377),(384,377),(384,353),(322,350),(266,359),(191,357),(122,351),(72,344),(0,346)]]},
"stone_cottage":{
"side":[[(0,280),(40,285),(55,293),(68,316),(78,336),(0,354)],[(351,276),(384,269),(384,365),(324,353)],[(0,377),(384,377),(384,355),(290,354),(218,355),(162,354),(115,351),(69,344),(0,349)]],
"front":[[(0,286),(40,291),(53,301),(71,331),(0,354)],[(351,291),(384,285),(384,365),(333,356)],[(0,376),(384,376),(384,360),(278,357),(200,356),(134,358),(81,347),(0,350)]],
"back":[[(0,286),(41,291),(58,303),(71,326),(0,357)],[(353,286),(384,280),(384,367),(336,349)],[(0,376),(384,376),(384,360),(312,356),(230,354),(173,355),(100,350),(65,347),(0,354)]]},
"banner_lodge":{
"front":[[(0,285),(42,290),(63,303),(73,329),(0,358)],[(352,287),(384,274),(384,361),(329,350)],[(0,374),(384,374),(384,352),(302,349),(256,354),(216,361),(164,361),(126,359),(75,345),(0,353)]],
"side":[[(0,283),(41,288),(58,301),(76,332),(0,360)],[(352,280),(384,270),(384,359),(336,346)],[(0,375),(384,375),(384,355),(312,352),(243,352),(175,356),(121,355),(81,346),(0,353)]],
"back":[[(0,285),(42,291),(57,303),(75,327),(0,357)],[(353,281),(384,270),(384,365),(336,349)],[(0,376),(384,376),(384,358),(311,355),(244,356),(174,359),(118,357),(75,342),(0,353)]]},
"watchtower":{
"front":[[(0,282),(40,285),(57,296),(75,325),(0,356)],[(351,292),(384,288),(384,359),(334,347)],[(0,376),(384,376),(384,355),(307,349),(251,350),(210,361),(157,362),(106,353),(74,341),(0,350)]],
"side":[[(0,282),(38,285),(54,295),(74,326),(0,352)],[(353,285),(384,270),(384,366),(332,349)],[(0,373),(384,373),(384,356),(316,356),(245,352),(181,358),(127,355),(84,347),(0,350)]],
"back":[[(0,280),(40,284),(53,296),(73,324),(0,357)],[(352,280),(384,270),(384,365),(335,349)],[(0,376),(384,376),(384,358),(310,356),(237,357),(185,358),(118,354),(71,345),(0,350)]]},
"alpine_timber":{
"front":[[(0,282),(42,287),(61,303),(80,324),(0,359)],[(354,278),(384,269),(384,362),(334,353)],[(0,378),(384,378),(384,357),(302,357),(242,360),(183,361),(122,355),(80,345),(0,351)]],
"back":[[(0,281),(42,289),(63,306),(80,325),(0,358)],[(353,279),(384,273),(384,365),(338,350)],[(0,378),(384,378),(384,358),(300,358),(232,358),(180,360),(111,355),(70,348),(0,350)]]}}
LANTERN_BG={
"side":[[(36,210),(77,217),(80,306),(44,313)]],
"front":[[(42,209),(80,221),(82,309),(48,322)],[(354,225),(377,228),(381,332),(353,324)]],
"back":[[(37,205),(78,218),(82,314),(44,323)],[(359,210),(383,217),(383,324),(359,328)]]}

def convert(src,family,view):
    arr=np.asarray(src.convert("RGBA")).copy()
    if arr.shape!=(384,384,4):
        raise ValueError("Not the expected 384x384 RGBA asset")
    original=arr[:,:,3].copy()
    for points in SPEC[family][view]:
        cover=np.zeros((384,384),np.uint8)
        cv2.fillPoly(cover,[np.asarray(points,np.int32)],255)
        feather=cv2.GaussianBlur(cover,(5,5),.65).astype(np.float32)/255
        arr[:,:,3]=np.uint8(np.clip(np.rint(arr[:,:,3]*(1-feather)),0,255))
    if family=="east_pagoda":
        zone=np.zeros((384,384),np.uint8)
        for points in LANTERN_BG[view]:
            cv2.fillPoly(zone,[np.asarray(points,np.int32)],255)
        r,g,b=[arr[:,:,i].astype(np.int16) for i in range(3)]
        gray=(abs(r-g)<=31)&(abs(g-b)<=30)&(r<122)&(g<120)&(b<137)
        warm=(r>g+15)&(r>b+15)
        arr[:,:,3][(zone>0)&gray&~warm]=0
    changed=int(np.sum((original>=12)&(arr[:,:,3]<12)))
    alpha_ratio=float(arr[:,:,3].sum()/original.sum())
    # Protect roof and living architecture, exclude inaccurate/massive cuts.
    if changed<1200 or changed>8000 or not (.90<alpha_ratio<.99):
        raise ValueError(f"Destructive or ineffective cut: {family} {view}: {changed} ratio {alpha_ratio:.4f}")
    if not np.array_equal(original[:195,:],arr[:195,:,3]):
        raise ValueError(f"Roof area mutated: {family} {view}")
    if not np.array_equal(arr[:,:,:3],np.asarray(src.convert("RGBA"))[:,:,:3]):
        raise ValueError("Painted pixels unexpectedly modified")
    return Image.fromarray(arr,"RGBA"),changed,alpha_ratio

def run():
    manifest=BASE/"manifest.snow-houses.v1.json"
    checksums=BASE/"SHA256SUMS.snow-houses-v1.txt"
    data=json.loads(manifest.read_text())
    sums=checksums.read_text()
    if len(data.get("files",[]))!=30 or data.get("modelCount")!=10:raise ValueError("Unexpected inventory")
    updates={};report=[]
    canvas=Image.new("RGB",(768,14*408),"#263139")
    painter=ImageDraw.Draw(canvas)
    index=0
    for family,views in SPEC.items():
      for view in views:
        name=f"building_house_snow_{family}_2p5d_{view}_01.webp"
        if name==PROTECTED:raise ValueError("Author original is protected")
        row=next((r for r in data["files"] if Path(r["path"]).name==name),None)
        if row is None:raise ValueError("Unknown canonical asset: "+name)
        path=ROOT/row["path"]
        original_bytes=path.read_bytes()
        original_sha=hashlib.sha256(original_bytes).hexdigest()
        if original_sha!=row["sha256"] or len(original_bytes)!=row["bytes"] or f"{original_sha}  {row['path']}" not in sums:
            raise ValueError("Stale content/checksum for "+name)
        original=Image.open(io.BytesIO(original_bytes)).convert("RGBA")
        edited,removed,ratio=convert(original,family,view)
        out=io.BytesIO();edited.save(out,"WEBP",lossless=True,method=6)
        new_bytes=out.getvalue();new_sha=hashlib.sha256(new_bytes).hexdigest()
        updates[row["path"]]=(original_sha,new_sha,len(new_bytes),new_bytes)
        for j,img in enumerate((original,edited)):
            bg=Image.new("RGBA",(384,384),"#929da7"); bg.alpha_composite(img)
            canvas.paste(bg.convert("RGB"),(384*j,index*408+24))
            painter.text((384*j+6,index*408+4),("AVANT " if j==0 else "APRÈS ")+family+" "+view,fill="white")
        report.append({"path":row["path"],"removed_pixels":removed,"alpha_mass_ratio":round(ratio,5),
                       "old_sha256":original_sha,"new_sha256":new_sha,"old_bytes":len(original_bytes),"new_bytes":len(new_bytes)})
        index+=1
    assert len(updates)==14 and len(report)==14
    # Canonical order; no new filenames, IDs or duplicated assets.
    for row in data["files"]:
      if row["path"] in updates:
        old,new,size,payload=updates[row["path"]]
        (ROOT/row["path"]).write_bytes(payload)
        row["bytes"]=size;row["sha256"]=new
        sums=sums.replace(old+"  "+row["path"],new+"  "+row["path"])
    manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n")
    checksums.write_text(sums)
    for row in data["files"]:
      payload=(ROOT/row["path"]).read_bytes()
      if len(payload)!=row["bytes"] or hashlib.sha256(payload).hexdigest()!=row["sha256"]:
        raise ValueError("Post-write checksum fail")
    image_out=Path("/tmp/house-props-before-after.png");canvas.save(image_out)
    Path("/tmp/house-props-audit.json").write_text(json.dumps(report,indent=2))
    print("Repaired",len(report),"canonical WebPs. Protected artist image not touched.")
    print("Before/after: /tmp/house-props-before-after.png")
if __name__=="__main__":run()
