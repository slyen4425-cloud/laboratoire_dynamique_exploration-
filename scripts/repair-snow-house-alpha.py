#!/usr/bin/env python3
"""Clean existing 2.5D snow-house asset silhouettes without redrawing artwork.

Only canonical WebP filenames from the existing manifest are altered.
The author's edited alpine_timber side view is protected and untouched.
"""
from __future__ import annotations
import argparse, hashlib, io, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, gaussian_filter, label

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "assets/exploration/objects/buildings"
MANIFEST = DIR / "manifest.snow-houses.v1.json"
SUMS = DIR / "SHA256SUMS.snow-houses-v1.txt"
PROTECTED = "building_house_snow_alpine_timber_2p5d_side_01.webp"

def clean_image(src):
    image = np.asarray(src.convert("RGBA"), dtype=np.uint8).copy()
    height,width = image.shape[:2]
    if (width,height) != (384,384) or (image[:,:,3]>=32).sum()<500:
        raise ValueError("unexpected 384x384 building image")
    alpha = image[:,:,3].astype(np.float32)
    regions,number = label(alpha>=6,structure=np.ones((3,3),dtype=np.uint8))
    if number:
        count=np.bincount(regions.ravel())
        largest=np.argmax(count[1:])+1
        for k in range(1,len(count)):
            if k!=largest and count[k]<10:
                alpha[regions==k]=0
    blurred=gaussian_filter(alpha,sigma=.65,mode="constant")
    boundary=(alpha>0)&(alpha<220)
    alpha[boundary]=np.minimum(alpha[boundary],np.maximum(0.,blurred[boundary]+3.))
    alpha[alpha<5]=0
    # Decontaminate low-alpha colour with nearest opaque original RGB.
    opaque=alpha>=230
    if opaque.any():
        coords=distance_transform_edt(~opaque,return_distances=False,return_indices=True)
        fringe=(alpha>0)&(alpha<165)
        y,x=np.where(fringe)
        nearest=image[coords[0,y,x],coords[1,y,x],:3].astype(np.float32)
        original=image[y,x,:3].astype(np.float32)
        weight=((165-alpha[y,x])/165*.75)[:,None]
        image[y,x,:3]=np.uint8(np.clip(original*(1-weight)+nearest*weight,0,255))
    # Local base silhouette only: never fade roof, windows, upper details.
    ypos=np.where(alpha>=24)[0]
    base_global=int(ypos.max())
    min_foot=base_global-43
    for x in range(width):
        valid=np.flatnonzero(alpha[:,x]>=24)
        if not len(valid):
            continue
        last=int(valid[-1])
        if last<min_foot:
            continue
        first=max(min_foot,last-8)
        for y in range(first,last+1):
            u=(y-first)/max(1,last-first)
            alpha[y,x]*=1.0-.70*(u*u*(3-2*u))
    image[:,:,3]=np.uint8(np.rint(np.clip(alpha,0,255)))
    return Image.fromarray(image,"RGBA")

def make_contact_sheet(samples,out_path):
    # 10 models by 3 views: transparent originals & repairs on checkerboard.
    thumb=166; between=20; rowheight=208
    sheet=Image.new("RGB",(thumb*6+between*3+12,rowheight*10),"#20262d")
    d=ImageDraw.Draw(sheet)
    variants=list(samples.keys())
    for row,variant in enumerate(variants):
        d.text((6,row*rowheight+2),variant,fill="#f4f5f8")
        entries=samples[variant]
        for col,(_,before,after) in enumerate(entries):
            for side,src in enumerate((before,after)):
                canvas=Image.new("RGBA",src.size,"#697883")
                painter=ImageDraw.Draw(canvas)
                for yy in range(0,384,32):
                    for xx in range(0,384,32):
                        if ((xx+yy)//32)%2==0:
                            painter.rectangle((xx,yy,xx+31,yy+31),fill="#7a8991")
                canvas.alpha_composite(src)
                im=canvas.convert("RGB").resize((thumb,thumb),Image.Resampling.LANCZOS)
                x=(col*2+side)*thumb+col*between
                sheet.paste(im,(x,row*rowheight+25))
            d.text((col*2*thumb+col*between,row*rowheight+191),
                ["FRONT","SIDE","BACK"][col]+" BEFORE / AFTER",fill="#d5dee7")
    out_path.parent.mkdir(parents=True,exist_ok=True)
    sheet.save(out_path)

def run(*,apply,preview,report):
    doc=json.loads(MANIFEST.read_text(encoding="utf-8"))
    old_sums=SUMS.read_text(encoding="utf-8")
    if doc.get("modelCount")!=10 or len(doc.get("files",[]))!=30:
        raise ValueError("unexpected snow-house manifest inventory")
    if len(set(f["path"] for f in doc["files"]))!=30:
        raise ValueError("duplicate asset path")
    new_sums=old_sums
    results=[]
    samples={}
    total_before=total_after=0
    for row in doc["files"]:
        filename=Path(row["path"]).name
        if not filename.startswith("building_house_snow_") or not filename.endswith(".webp"):
            raise ValueError("out-of-scope asset")
        path=ROOT/row["path"]
        data=path.read_bytes()
        old_sha=hashlib.sha256(data).hexdigest()
        if row["sha256"]!=old_sha or row["bytes"]!=len(data) or f"{old_sha}  {row['path']}" not in old_sums:
            raise ValueError(f"stale original inventory: {filename}")
        src=Image.open(io.BytesIO(data)).convert("RGBA")
        if filename==PROTECTED:
            dst=src
            after=data
            state="artist-protected"
        else:
            dst=clean_image(src)
            stream=io.BytesIO()
            dst.save(stream,format="WEBP",lossless=True,exact=True,method=6)
            after=stream.getvalue()
            state="cleaned"
        m0=np.asarray(src)[:,:,3]; m1=np.asarray(dst)[:,:,3]
        mass=float(m1.sum()/max(1,m0.sum()))
        if mass<.963 or np.sum(m1[m0>=240]<236)>max(20,int(np.sum(m0>=240)*.003)):
            raise ValueError(f"destructive alpha edit: {filename}")
        digest=hashlib.sha256(after).hexdigest()
        total_before+=len(data)
        total_after+=len(after)
        results.append({"path":row["path"],"old_bytes":len(data),"new_bytes":len(after),
                        "old_sha256":old_sha,"new_sha256":digest,"alpha_mass_ratio":round(mass,5),"state":state})
        samples.setdefault(row["variant"],[]).append((row["view"],src,dst))
        if apply and state=="cleaned":
            path.write_bytes(after)
            row["bytes"]=len(after)
            row["sha256"]=digest
            new_sums=new_sums.replace(f"{old_sha}  {row['path']}",f"{digest}  {row['path']}")
    if apply:
        MANIFEST.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        SUMS.write_text(new_sums,encoding="utf-8")
    if preview:
        # manifest order is front / side / back, enforced for stable previews
        for value in samples.values():
            value.sort(key=lambda x: {"front":0,"side":1,"back":2}[x[0]])
        if len(samples)!=10 or any(len(v)!=3 for v in samples.values()):
            raise ValueError("incomplete preview collection")
        make_contact_sheet(samples,preview)
    result={"count":len(results),"protected":PROTECTED,
            "old_bytes":total_before,"new_bytes":total_after,
            "delta_bytes":total_after-total_before,"files":results}
    if report:
        report.parent.mkdir(parents=True,exist_ok=True)
        report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in result.items() if k!="files"},indent=2))

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--apply",action="store_true")
    p.add_argument("--preview",type=Path)
    p.add_argument("--report",type=Path)
    opts=p.parse_args()
    run(apply=opts.apply,preview=opts.preview,report=opts.report)
