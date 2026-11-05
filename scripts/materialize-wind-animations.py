#!/usr/bin/env python3
"""Validate approved ZIPs; optionally extract 72 PNG frames and build six WebP sheets."""
import argparse, hashlib, io, json, re, struct, sys
from pathlib import Path
from zipfile import ZipFile
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'assets/exploration/objects/animated'
def validate(e, extract=False, sheets=False):
    path=ROOT/e['sourceArchive']; raw=path.read_bytes()
    if len(raw)!=e['bytes'] or hashlib.sha256(raw).hexdigest()!=e['sha256']:
        raise ValueError(f'ZIP checksum mismatch: {path}')
    with ZipFile(io.BytesIO(raw)) as z:
        if z.testzip(): raise ValueError(f'Corrupt ZIP: {path}')
        rx=re.compile(r'^'+re.escape(e['sourceFramePrefix'])+r'(\d{2})\.png$')
        files={}
        for name in z.namelist():
            m=rx.fullmatch(name)
            if m:
                i=int(m.group(1))
                if i in files: raise ValueError(f'Duplicate frame {i}')
                files[i]=z.read(name)
        if sorted(files)!=list(range(12)): raise ValueError(f'Missing frames in {path}: {sorted(files)}')
        for data in files.values():
            if data[:8]!=b'\x89PNG\r\n\x1a\n' or data[12:16]!=b'IHDR':
                raise ValueError('Bad PNG header')
            whd=struct.unpack('>IIBB',data[16:26])
            if whd!=(512,512,8,6): raise ValueError(f'Not 512x512 RGBA: {whd}')
        dest=BASE/e['targetDir']
        if extract or sheets:
            (dest/'frames').mkdir(parents=True,exist_ok=True)
            for i in range(12): (dest/'frames'/f'frame_{i:02}.png').write_bytes(files[i])
        if sheets:
            from PIL import Image
            atlas=Image.new('RGBA',(1024,768),(0,0,0,0))
            for i in range(12):
                image=Image.open(io.BytesIO(files[i])).convert('RGBA')
                thumb=image.resize((256,256),Image.Resampling.LANCZOS)
                atlas.alpha_composite(thumb,((i%4)*256,(i//4)*256))
            atlas.save(dest/'sheet.webp','WEBP',quality=90,method=4)
    print('OK',e['id'])
def main():
    p=argparse.ArgumentParser();p.add_argument('--extract',action='store_true');p.add_argument('--sheets',action='store_true');a=p.parse_args()
    m=json.loads((BASE/'manifest.v1.json').read_text(encoding='utf8'))
    if m.get('schemaVersion')!=1 or len(m.get('animations',[]))!=6: raise ValueError('Invalid six-animation manifest')
    for e in m['animations']:
        if e['frameCount']!=12 or e['frameSize']!=[512,512]: raise ValueError('Unexpected frame contract')
        validate(e,a.extract or a.sheets,a.sheets)
    print('PASS: 6 approved ZIPs, 72 source RGBA frames')
if __name__=='__main__':
    try: main()
    except (ValueError,KeyError,OSError,ImportError) as exc:
        print('FAIL:',exc,file=sys.stderr);sys.exit(1)
