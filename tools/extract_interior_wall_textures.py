#!/usr/bin/env python3
"""Unpack and validate the approved five interior wall materials."""
import hashlib, io, json
from pathlib import Path
from zipfile import ZipFile
from PIL import Image
root=Path(__file__).resolve().parents[1]
dest=root/"assets/exploration/materials/interior/walls"
archive=dest/"exploration_wall_textures_5.zip"
names=["wall_stone_gray_01.webp","wall_wood_01.webp","wall_brick_red_01.webp","wall_stone_light_01.webp","wall_stone_dark_01.webp"]
with ZipFile(archive) as z:
    available=set(z.namelist())
    if set(names+["manifest.v1.json"]) != available: raise SystemExit(f"Unexpected archive entries: {available}")
    manifest=json.loads(z.read("manifest.v1.json"))
    for name in names:
        data=z.read(name)
        with Image.open(io.BytesIO(data)) as im:
            if im.format!="WEBP" or im.size!=(128,128): raise SystemExit(f"Invalid WebP 128x128: {name}")
        (dest/name).write_bytes(data)
    (dest/"manifest.v1.json").write_bytes(z.read("manifest.v1.json"))
print("Validated and extracted 5 interior wall textures")
