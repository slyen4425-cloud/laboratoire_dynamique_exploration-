#!/usr/bin/env python3
"""Import uploaded door PNGs into the existing interior door catalog."""
from pathlib import Path
import zipfile, io, re, json
from PIL import Image
root=Path(__file__).resolve().parents[1]
archive=root/'gensrpg_portes_20_vues_png.zip'
target=root/'assets/exploration/objects/doors/imported'
target.mkdir(parents=True,exist_ok=True)
entries=[]
with zipfile.ZipFile(archive) as z:
    names=sorted(n for n in z.namelist() if n.lower().endswith('.png') and not n.startswith('__MACOSX/') and not Path(n).name.startswith('.'))
    if len(names)!=20: raise SystemExit(f'Expected 20 PNG views, found {len(names)}: {names}')
    for i,name in enumerate(names,1):
        with Image.open(io.BytesIO(z.read(name))) as image:
            image.load()
            if image.mode!='RGBA': image=image.convert('RGBA')
            output=f'door_imported_{i:02d}.png'
            image.save(target/output,optimize=True)
        entries.append({'id':f'object.door.imported.{i:02d}','label':f'Porte importée {i:02d} — {Path(name).stem.replace("_"," ").replace("-"," ")}','path':f'./assets/exploration/objects/doors/imported/{output}'})
catalog=root/'src/world/interior-material-catalog.js'
source=catalog.read_text()
start=source.index('export const INTERIOR_DOOR_ASSETS=Object.freeze([')
end=source.index('].map(x=>Object.freeze(x)));',start)+len('].map(x=>Object.freeze(x)));')
old=source[start:end]
if 'object.door.imported.' in old: raise SystemExit('Door catalog already contains imported entries')
additional='\n'+''.join(' '+json.dumps(e,ensure_ascii=False,separators=(",",":"))+',\n' for e in entries)
replacement=old.replace('\n].map(x=>Object.freeze(x)));',','+additional+'].map(x=>Object.freeze(x)));')
# Remove duplicate comma if original last item already has a trailing comma
replacement=replacement.replace('},,\n','},\n')
catalog.write_text(source[:start]+replacement+source[end:])
print(f'Imported {len(entries)} PNGs into {target.relative_to(root)}')
