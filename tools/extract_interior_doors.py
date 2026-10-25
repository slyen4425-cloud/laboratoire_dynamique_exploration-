#!/usr/bin/env python3
"""Extract and validate GenSrpG interior door sprites from the uploaded archive."""
from pathlib import Path
from zipfile import ZipFile
from PIL import Image
import json, io, sys
root=Path(__file__).resolve().parents[1]
archive=root/"gensrpg_portes_20_vues_png.zip"
destination=root/"assets"/"interiors"/"doors"
destination.mkdir(parents=True,exist_ok=True)
expected=["bois_renforce","bois_arche_pierre","bois_double","fer_ornement","bois_coulissant","bois_dore","fer_donjon","bois_lierre","grille_fer","porte_noble"]
with ZipFile(archive) as z:
    entries={Path(n).name:n for n in z.namelist() if n.lower().endswith(".png")}
    manifest=[]
    for i,model in enumerate(expected,1):
        for view in ("face","trois_quarts"):
            filename=f"{i:02d}_{model}_{view}.png"
            if filename not in entries: raise RuntimeError(f"Missing {filename}; found: {sorted(entries)}")
            raw=z.read(entries[filename])
            with Image.open(io.BytesIO(raw)) as img:
                if img.mode!="RGBA": raise RuntimeError(f"{filename}: PNG must be RGBA")
                if img.getchannel("A").getextrema()[0]==255: raise RuntimeError(f"{filename}: no transparency")
                img.save(destination/filename)
                manifest.append({"model":model,"view":view,"file":f"assets/interiors/doors/{filename}","width":img.width,"height":img.height})
(destination/"manifest.json").write_text(json.dumps({"schema":"gensrpg-doors-v1","items":manifest},indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print(f"Extracted {len(manifest)} RGBA PNG sprites")
