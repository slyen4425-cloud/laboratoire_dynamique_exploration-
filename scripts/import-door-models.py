#!/usr/bin/env python3
"""Integrate the 10 canonical interior doors (front and 3/4) into the Builder catalog.
The assets come from lot/portes-interieures-20-assets-20261026, not main.
"""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
manifest_path=root/'assets/interiors/doors/manifest.json'
manifest=json.loads(manifest_path.read_text())
assert manifest['schema']=='gensrpg-doors-v1'
items=manifest['items']
assert len(items)==20
by_model={}
for item in items:
    assert item['view'] in ('face','trois_quarts')
    path=root/item['file']
    assert path.is_file(), f'Missing PNG: {path}'
    assert path.read_bytes()[:8]==b'\x89PNG\r\n\x1a\n', f'Invalid PNG: {path}'
    by_model.setdefault(item['model'],{})[item['view']]=item['file']
assert len(by_model)==10 and all(set(views)=={'face','trois_quarts'} for views in by_model.values())
catalog=root/'src/world/interior-material-catalog.js'
source=catalog.read_text()
start=source.index('export const INTERIOR_DOOR_ASSETS=Object.freeze([')
end=source.index('].map(x=>Object.freeze(x)));',start)
existing=source[start:end]
if 'object.door.interior.' in existing:
    raise SystemExit('Interior doors already imported')
labels={
 'bois_renforce':'Bois renforcé','bois_arche_pierre':'Bois et arche de pierre',
 'bois_double':'Double porte en bois','fer_ornement':'Fer ornementé',
 'bois_coulissant':'Bois coulissant','bois_dore':'Bois doré',
 'fer_donjon':'Fer de donjon','bois_lierre':'Bois et lierre',
 'grille_fer':'Grille en fer','porte_noble':'Porte noble'}
lines=[]
for model,views in by_model.items():
    for view in ('face','trois_quarts'):
        ident=f'object.door.interior.{model}.{view}'
        label=f"{labels.get(model,model.replace('_',' ').title())} — {'face' if view=='face' else '3/4'}"
        path='./'+views[view]
        lines.append(' '+json.dumps({'id':ident,'label':label,'path':path},ensure_ascii=False,separators=(',',':'))+',')
replacement=source[:end].rstrip()
if not replacement.endswith(','): replacement+=','
replacement+='\n'+'\n'.join(lines)+'\n'+source[end:]
catalog.write_text(replacement)
print(f'Integrated {len(by_model)} models / {len(items)} views into Builder door catalog')
