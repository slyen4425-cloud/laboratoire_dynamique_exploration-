#!/usr/bin/env python3
"""Canonical green hero walk replacement from the exact uploaded approved test pack."""
import pathlib, zipfile, hashlib, json, io, sys
from PIL import Image, ImageOps
ROOT=pathlib.Path('assets/exploration/actors/official')
ZIP=pathlib.Path('GenSRPG_heros_vert_complet_test_jeu.zip')
SHA='b03e2098c7b38d6a2406c6a64657df3e15d3a6f9cfc3411d992d59f5188b6978'
D=('N','NE','E','SE','S','SW','W','NW')
def main():
    assert hashlib.sha256(ZIP.read_bytes()).hexdigest()==SHA, 'Unexpected source pack'
    cat=json.loads((ROOT/'catalog.json').read_text())
    hero=next(h for h in cat['heroes'] if h['id']=='hero.official.02_heros_vert')
    assert hero['frameSize']==[128,160] and hero['fps']==16
    frames={}
    with zipfile.ZipFile(ZIP) as z:
        m=json.loads(z.read('manifest.json'))
        assert m['frameSize']==[512,512] and m['mirrors']=={'SW':'SE','NE':'NW'}
        for d in D:
            with zipfile.ZipFile(io.BytesIO(z.read('imports/'+d+'.zip'))) as sub:
                assert set(sub.namelist())=={f'{i:02}.png' for i in range(6)}
                for i in range(6):
                    with Image.open(io.BytesIO(sub.read(f'{i:02}.png'))) as image:
                        assert image.mode=='RGBA' and image.size==(512,512)
                        # One isotropic transform for ALL directions and poses;
                        # preserve approved anchor, no per-frame fitting or recentering.
                        scaled=image.resize((156,156),Image.Resampling.LANCZOS)
                        bounds=scaled.getchannel('A').getbbox()
                        assert bounds and bounds[0]>=14 and bounds[2]<=142
                        out=Image.new('RGBA',(128,160))
                        out.paste(scaled,(-14,2))
                        a=out.getchannel('A'); l,t,r,b=a.getbbox()
                        assert 0<l<r<128 and 0<t<b<160 and a.getextrema()==(0,255)
                        frames[d,i]=out
    for d,src in [('SW','SE'),('NE','NW')]:
        for i in range(6):
            assert frames[d,i].tobytes()==ImageOps.mirror(frames[src,i]).tobytes()
    for (d,i),im in frames.items():
        path=ROOT/'02_heros_vert'/'frames'/d/f'{i:02}.png'
        assert str(path)==hero['directions'][d][i] and path.is_file()
        if '--check' in sys.argv:
            with Image.open(path) as current:
                assert current.mode=='RGBA' and current.size==(128,160)
                assert current.tobytes()==im.tobytes(),str(path)
        else:
            im.save(path,format='PNG',optimize=True)
    print('48 canonical RGBA 128x160 frames verified; mirrors exact; no clipping; unchanged catalog')
if __name__=='__main__':main()
