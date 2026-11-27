#!/usr/bin/env python3
"""Read-only hero sprite audit and conservative review candidates, never runtime writes."""
import hashlib, json, pathlib, zipfile
from collections import deque
from PIL import Image, ImageDraw, ImageChops

ROOT=pathlib.Path('assets/exploration/actors/official')
OUT=pathlib.Path('artifacts/hero-sprite-review')
DIRS=('N','NE','E','SE','S','SW','W','NW')
PACKS=('gensrpg_monster_capture_lot_1_6_heros_decoupes.zip',
       'GenSRPG_heros_lot2_A_heros_07_08_09.zip',
       'GenSRPG_heros_lot2_B_heros_10_11_12.zip')

def components(alpha):
    w,h=alpha.size
    remaining={i for i,v in enumerate(alpha.getdata()) if v}
    result=[]
    while remaining:
        q=deque([remaining.pop()]); pts=[]
        while q:
            i=q.popleft(); pts.append(i); x,y=i%w,i//w
            for dy in (-1,0,1):
                for dx in (-1,0,1):
                    nx,ny=x+dx,y+dy
                    if 0<=nx<w and 0<=ny<h:
                        j=ny*w+nx
                        if j in remaining:
                            remaining.remove(j); q.append(j)
        result.append(pts)
    return sorted(result,key=len,reverse=True)

def inspect(im):
    alpha=im.getchannel('A'); w,h=im.size
    parts=components(alpha)
    if not parts: raise ValueError('Empty frame')
    main=parts[0]
    bbox=(min(p%w for p in main),min(p//w for p in main),
          max(p%w for p in main)+1,max(p//w for p in main)+1)
    def outside(p):
        x,y=p%w,p//w
        return x<bbox[0]-3 or x>=bbox[2]+3 or y<bbox[1]-3 or y>=bbox[3]+3
    # Never move, scale, or reconstruct poses; only flag very tiny detached
    # components outside the main silhouette's padded bounds for ARTIST review.
    candidates=[pts for pts in parts[1:] if len(pts)<=12 and all(map(outside,pts))]
    edited=im.copy()
    for pts in candidates:
        for p in pts: edited.putpixel((p%w,p//w),(0,0,0,0))
    return {'alpha_bounds':alpha.getbbox(),'main_bounds':bbox,
            'touches_canvas':bbox[0]==0 or bbox[1]==0 or bbox[2]==w or bbox[3]==h,
            'component_sizes':[len(p) for p in parts[:20]],
            'candidate_removed_pixels':sum(map(len,candidates))},edited

def rgb_on(im):
    bg=Image.new('RGBA',im.size,(43,53,65,255)); bg.alpha_composite(im)
    return bg.convert('RGB')

def delta(a,b):
    diff=ImageChops.difference(rgb_on(a),rgb_on(b))
    return round(sum(i*n for c in diff.split() for i,n in enumerate(c.histogram()))/(a.width*a.height*3*255),6)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    catalog=json.loads((ROOT/'catalog.json').read_text())
    assert len(catalog['heroes'])==12
    report={'source_zip_inventory':{},'heroes':[]}
    for name in PACKS:
        with zipfile.ZipFile(name) as z:
            # Exact filenames, including any original sheets; never assume they exist.
            report['source_zip_inventory'][name]=[i.filename for i in z.infolist() if not i.is_dir()]
    count=0
    for hero in catalog['heroes']:
        slug=hero['id'].split('.')[-1]
        dest=OUT/slug; dest.mkdir(exist_ok=True)
        report_hero={'id':hero['id'],'fps':hero['fps'],'directions':{}}
        sheet=Image.new('RGB',(6*144+90,8*185),(43,53,65))
        draw=ImageDraw.Draw(sheet)
        for row,direction in enumerate(DIRS):
            files=hero['directions'][direction]
            assert len(files)==6
            frames=[]; edits=[]; facts=[]
            for col,path in enumerate(files):
                with Image.open(path) as img:
                    if img.size!=(128,160) or img.mode!='RGBA':
                        raise ValueError(f'Wrong canvas/mode: {path} {img.size} {img.mode}')
                    im=img.copy()
                f,edited=inspect(im)
                f.update(path=path,sha256=hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest())
                frames.append(im); edits.append(edited); facts.append(f); count+=1
                if f['candidate_removed_pixels']:
                    cp=dest/'candidates'/direction
                    cp.mkdir(parents=True,exist_ok=True)
                    edited.save(cp/f'{col:02}.png')
                x=90+col*144; y=row*185
                sheet.paste(rgb_on(im),(x,y))
                draw.text((x,y+162),f'{col:02}'+(' EDGE' if f['touches_canvas'] else '')+(' SPECK' if f['candidate_removed_pixels'] else ''),fill='white')
            draw.text((8,row*185+72),direction,fill='white')
            diffs=[delta(frames[i],frames[(i+1)%6]) for i in range(6)]
            report_hero['directions'][direction]={'frames':facts,'transition_delta_including_loop':diffs,
                'exact_duplicate_pairs':[i for i in range(6) if diffs[i]==0]}
            # Full actual frames at the original timing, no interpolation.
            ms=round(1000/hero['fps'])
            rgb=[rgb_on(i) for i in frames]
            rgb[0].save(dest/f'{direction}-original.gif',save_all=True,append_images=rgb[1:],duration=ms,loop=0,disposal=2,optimize=False)
            if any(f['candidate_removed_pixels'] for f in facts):
                rgb=[rgb_on(i) for i in edits]
                rgb[0].save(dest/f'{direction}-candidate.gif',save_all=True,append_images=rgb[1:],duration=ms,loop=0,disposal=2,optimize=False)
        sheet.save(dest/'all-directions.png')
        report['heroes'].append(report_hero)
    assert count==576
    report['frame_count']=count
    (OUT/'audit.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
    allfacts=[f for h in report['heroes'] for d in h['directions'].values() for f in d['frames']]
    print('FRAME_COUNT',count,'EDGE_FLAGS',sum(f['touches_canvas'] for f in allfacts),
          'DETACHED_SPECK_CANDIDATES',sum(bool(f['candidate_removed_pixels']) for f in allfacts))
    for h in report['heroes']:
        print(h['id'], 'edge flags',sum(f['touches_canvas'] for d in h['directions'].values() for f in d['frames']),
          'duplicate transitions',sum(len(d['exact_duplicate_pairs']) for d in h['directions'].values()))

if __name__=='__main__': main()
