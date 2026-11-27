#!/usr/bin/env python3
"""Replace only the canonical green hero walk frames from the approved archive."""
import pathlib, zipfile, hashlib, json, struct, sys
ROOT=pathlib.Path('assets/exploration/actors/official')
ZIP=pathlib.Path('GenSRPG_heros_vert_remplacement_20261127.zip')
SHA='0d531bab839d711db6c28dc842aaa8ce6bb26db9e91e9c43b2ca7926aae1d3ac'
D=('N','NE','E','SE','S','SW','W','NW')
def main():
    if hashlib.sha256(ZIP.read_bytes()).hexdigest()!=SHA:
        raise ValueError('Unapproved source archive')
    cat=json.loads((ROOT/'catalog.json').read_text())
    hero=next(h for h in cat['heroes'] if h['id']=='hero.official.02_heros_vert')
    expected={str(ROOT/'02_heros_vert'/'frames'/d/f'{i:02}.png') for d in D for i in range(6)}
    assert hero['frameSize']==[128,160] and hero['fps']==16
    assert expected=={p for d in D for p in hero['directions'][d]}
    with zipfile.ZipFile(ZIP) as z:
        assert len(z.namelist())==49 and set(z.namelist())==expected|{'manifest.json'}
        m=json.loads(z.read('manifest.json'))
        assert m['hero']==hero['id'] and m['frameSize']==[128,160] and set(m['frames'])==expected
        blobs={}
        for name in sorted(expected):
            blob=z.read(name)
            assert blob[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',blob[16:24])==(128,160) and blob[25]==6
            assert hashlib.sha256(blob).hexdigest()==m['frames'][name]
            assert pathlib.Path(name).is_file()
            blobs[name]=blob
    # Validate everything before any replacement. Existing asset paths and catalog are unchanged.
    for name,blob in blobs.items():
        path=pathlib.Path(name)
        if '--check' in sys.argv:
            assert path.read_bytes()==blob, name
        else:
            path.write_bytes(blob)
    print('GREEN HERO: 48 canonical RGBA 128x160 frames verified; catalog untouched')
if __name__=='__main__':main()
