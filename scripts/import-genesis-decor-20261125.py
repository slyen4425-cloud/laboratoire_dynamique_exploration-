#!/usr/bin/env python3
"""Deterministic one-time import from author ZIPs; no source deletion."""
import hashlib, io, json, re, zipfile
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT=Path(__file__).resolve().parents[1]
ASSET=ROOT/'assets/exploration/objects'
source={}
for archive in sorted(ROOT.glob('GENSRPG_Explo_20261125_*.zip')):
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None, archive
        for entry in json.loads(z.read('manifest.json'))['fichiers']:
            data=z.read(entry['fichier'])
            assert hashlib.sha256(data).hexdigest()==entry['sha256'], entry['fichier']
            key=int(Path(entry['fichier']).name[:3])
            assert key not in source
            source[key]=(data,archive.name,entry)
assert len(source)==77 and len(list(ROOT.glob('GENSRPG_Explo_20261125_*.zip')))==10

# Explicit, visually inspected selection. Sheet coordinates are the bounding
# boxes of the individual opaque connected components, not a blind grid cut.
# Each item: source number, semantic slug, label, folder, target max dimension,
# component bounding box or None, obstacle or not.
rows=[]
def add(n,slug,label,folder,size=100,box=None,solid=True):
    rows.append((n,slug,label,folder,size,box,solid))
F='decor/fences'; S='decor/storage'; B='vegetation/bushes'; G='vegetation/flowers-grass'
M='decor/furniture'; T='decor/shops'; P='decor/health'
for n,slug,label,size in [
 (1,'farm_grassy_front','Clôture de ferme · face herbe',150),
 (9,'farm_front','Clôture de ferme · face',150),
 (11,'farm_oblique','Clôture de ferme · diagonale',150),
 (16,'farm_vertical','Clôture de ferme · axe nord-sud',150),
 (43,'ornate_front','Barrière ornée · face',125),
 (44,'ornate_oblique_left','Barrière ornée · trois-quarts gauche',125),
 (45,'ornate_oblique_right','Barrière ornée · trois-quarts droite',125),
 (46,'rustic_gate','Portillon rustique',115)]:
    add(n,slug,label,F,size)
# 003: two essentially repeated front views + two end views retained as sources.
# The top-down rail is a distinct usable view.
add(3,'farm_rail_top','Clôture de ferme · dessus',150,(107,496,1340,644))
for n,slug,label,size in [
 (57,'crate_moss','Caisse en bois · mousse',65),(58,'crate_open','Caisse ouverte',65),
 (59,'crate_reinforced','Caisse renforcée',70),(68,'barrel_small','Petit tonneau',60),
 (71,'barrel_wood','Tonneau en bois',70),(72,'barrel_rope','Tonneau à poignée',70)]:
    add(n,slug,label,S,size)
for slug,label,box,size in [
 ('crate_braced','Caisse à croisillons',(229,50,655,497),65),
 ('barrel_banded','Tonneau cerclé',(751,17,1123,483),65),
 ('barrel_cloth','Tonneau couvert',(1221,89,1562,475),65),
 ('chest_iron','Coffre ferré',(43,490,489,872),75),
 ('sack','Sac de toile',(531,484,859,847),55),
 ('hay_bale','Botte de foin',(897,518,1369,840),85),
 ('apple_basket','Panier de pommes',(1418,475,1733,835),50)]:
    add(22,slug,label,S,size,box)
for n,slug,label,size in [
 (32,'meadow_red','Massif naturel · fleurs rouges',130),
 (34,'meadow_purple','Massif naturel · fleurs violettes',130),
 (35,'meadow_mixed','Massif naturel · fleurs variées',130),
 (38,'meadow_orange','Massif naturel · fleurs orangées',130),
 (53,'bush_green','Buisson vert',75),(54,'bush_pink','Buisson discret fleuri',75),
 (55,'bush_blossom','Buisson fleuri rose',85),(65,'bush_multicolor','Buisson multicolore',85)]:
    add(n,slug,label,B,size,solid=False)
for n,slug,label,size in [
 (56,'ground_leaves','Feuillage bas',75),(60,'purple_spikes','Touffe violette',65),
 (63,'grass_bloom','Graminée fleurie',60),(66,'ground_wildflowers','Parterre sauvage bas',80),
 (67,'ground_pastel','Parterre pastel',80),(74,'grass_tuft','Touffe d’herbe',65),
 (75,'daisy_bush','Touffe de marguerites',70),(77,'grass_tall','Herbes hautes décoratives',65),
 (48,'flower_mixed','Fleurs champêtres mélangées',50),(49,'flower_blue','Bleuets',50),
 (50,'flower_poppy','Coquelicots',50),(51,'flower_cosmos','Cosmos roses',50),
 (52,'flower_lily','Lys orange',50),(62,'flower_yellow','Fleurs dorées',50),
 (73,'flower_lavender','Lavande',50),(76,'flower_daisy','Marguerites',50)]:
    add(n,slug,label,G,size,solid=False)
# Distinct species recovered from reserve; no duplicate poppy/daisy/lavender.
for slug,label,box in [('flower_bluebell','Campanules bleues',(36,536,362,887)),
 ('flower_white_cluster','Petites fleurs blanches',(782,554,1120,899))]:
    add(8,slug,label,G,55,box,False)
add(24,'flower_lily_valley','Muguet',G,55,(778,559,1128,909),False)
add(24,'flower_clover','Trèfle rose',G,55,(1160,557,1514,915),False)
for n,slug,label,size in [
 (42,'wardrobe_fantasy','Armoire fantasy',125),(47,'bookcase_fantasy','Bibliothèque fantasy',125),
 (61,'dresser_fantasy','Commode fantasy',100),(64,'bed_fantasy','Lit d’auberge',125),
 (69,'nightstand_fantasy','Table de chevet',75),(70,'round_table_fantasy','Table ronde fantasy',85)]:
    add(n,slug,label,M,size)
add(27,'pastry_case_front','Vitrine pâtisserie · face',T,150)
add(28,'bread_rack_front','Présentoir pain · face',T,150)
# Isolated components only: no cutting through a chair or a scene.
for slug,label,box,size,solid in [
 ('pastry_case_oblique','Vitrine pâtisserie · oblique',(30,43,483,423),150,True),
 ('bread_rack_oblique','Présentoir pain · oblique',(508,25,854,397),140,True),
 ('fridge_double','Réfrigérateur vitré',(875,24,1126,381),135,True),
 ('checkout','Comptoir de caisse',(1155,93,1518,387),150,True),
 ('shop_shelf_jars','Rayon · bocaux',(36,442,230,731),110,True),
 ('shop_shelf_boxes','Rayon · boîtes',(259,426,453,718),110,True),
 ('pastry_stand','Présentoir à étages',(470,446,662,720),65,True),
 ('bread_basket','Panier de baguettes',(658,431,789,605),50,True),
 ('shop_plant','Plante en pot',(858,413,1009,622),65,True),
 ('flower_vase','Vase fleuri',(1005,400,1137,635),55,False),
 ('shop_wall_shelf','Étagère murale végétale',(1154,397,1299,542),70,False),
 ('shop_sign','Ardoise de boutique',(764,552,912,731),70,True),
 ('shop_window','Fenêtre contemporaine',(1164,551,1394,712),100,False),
 ('hanging_plant','Plante suspendue',(1408,582,1529,783),65,False),
 ('shop_island','Présentoir fruits et produits',(894,697,1261,1000),130,True)]:
    add(26,slug,label,T,size,box,solid)
add(12,'clinic_reception','Accueil médical · face',P,160)
add(14,'pharmacy_cabinet','Grande armoire pharmacie',P,170)
add(19,'clinic_chair','Chaise médicale seule',P,70)
add(4,'pharmacy_counter_oblique','Comptoir pharmacie · oblique',P,150,(320,20,1225,514))
add(4,'pharmacy_counter_front','Comptoir pharmacie · face',P,150,(199,512,1302,997))
for slug,label,box,size,solid in [
 ('pharmacy_shelf','Rayon pharmacie',(55,7,458,545),135,True),
 ('pharmacy_glass','Armoire médicale vitrée',(1211,54,1500,545),135,True),
 ('clinic_plant','Plante de salle d’attente',(23,576,309,989),75,True),
 ('sanitizer_station','Borne de désinfection',(340,611,498,969),90,True),
 ('waiting_bench','Banquette de salle d’attente',(525,698,895,951),105,True),
 ('privacy_screen','Paravent médical',(911,601,1270,976),130,True),
 ('health_terminal','Borne médicale',(1300,623,1499,975),95,True)]:
    add(5,slug,label,P,size,box,solid)

def extract(n,box):
    data,archive,entry=source[n]
    im=Image.open(io.BytesIO(data)).convert('RGBA')
    arr=np.array(im); alpha=arr[:,:,3]
    # Use actual alpha rather than background color. Keep the original
    # antialiased edge within a narrow band of the selected opaque core.
    labs,num=ndi.label(alpha>100)
    counts=np.bincount(labs.ravel())
    if box is not None:
        found=[]
        for i,sl in enumerate(ndi.find_objects(labs),1):
            if sl is None or counts[i]<1000: continue
            coords=(sl[1].start,sl[0].start,sl[1].stop,sl[0].stop)
            if coords==box: found.append(i)
        assert len(found)==1,(n,box,found)
        core=labs==found[0]
        # The selected component's alpha may touch a neighbour only in
        # antialiasing; never copy pixels assigned to another opaque core.
        keep=ndi.binary_dilation(core,iterations=4)&((labs==0)|core)
    else:
        good=np.flatnonzero(counts>=18);good=good[good!=0]
        core=np.isin(labs,good)
        keep=ndi.binary_dilation(core,iterations=4)
    arr[:,:,3]=np.where(keep,alpha,0)
    # Remove very low-alpha color spill; preserve antialiasing above it.
    arr[:,:,3][arr[:,:,3]<8]=0
    arr[arr[:,:,3]==0,:3]=0
    obj=Image.fromarray(arr,'RGBA')
    bb=obj.getchannel('A').getbbox()
    assert bb is not None
    obj=obj.crop(bb)
    assert min(obj.size)>10
    # Keep aspect ratio, no stretched or clipped image, padding 3 px.
    obj.thumbnail((506,506) if max(obj.size)>800 else (378,378),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(obj.width+6,obj.height+6))
    out.paste(obj,(3,3))
    return out,archive,entry

def q(v): return json.dumps(v,ensure_ascii=False)
defs=[]; adapters=[]; records=[]; seen=set()
for n,slug,label,folder,size,box,solid in rows:
    out,archive,entry=extract(n,box)
    assert slug not in seen;seen.add(slug)
    path=ASSET/folder/('genesis_'+slug+'.webp')
    assert not path.exists(),path
    path.parent.mkdir(parents=True,exist_ok=True)
    out.save(path,'WEBP',quality=90,method=6,alpha_quality=100)
    check=Image.open(path).convert('RGBA')
    assert check.getchannel('A').getextrema()[0]==0 and check.getchannel('A').getextrema()[1]>=200
    assert check.getchannel('A').getbbox()[0]>0
    w,h=out.size;scale=size/max(w,h)
    aid='object.decor.genesis.'+slug+'.01'; did='objectdef.decor.genesis.'+slug+'.01'
    rel=path.relative_to(ROOT).as_posix()
    lib={'categoryId':folder.split('/')[0],'folderId':folder,'provenance':'native'}
    definition={'id':did,'label':label,'kind':'decor','library':lib,'visual':{'assetId':aid},
        'baseSize':{'width':max(8,round(w*scale)),'height':max(8,round(h*scale))}}
    if solid:
        ratio=0.82 if folder==F else 0.74
        # Use existing collision authority, localized near the ground.
        definition['collision']={'role':'obstacle','shape':'box','widthRatio':ratio,'heightRatio':0.22,'offsetX':0,'offsetY':0.32}
    else:
        definition['footprint']={'enabled':False}
    defs.append('  { schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION, '+q(definition)[1:])
    adapters.append('  '+q(aid)+': Object.freeze({ id: '+q(aid)+', kind: "decor-visual", path: '+q('./'+rel)+', render: Object.freeze({ rotationOffsetDeg: 0, widthScale: 1, heightScale: 1 }) })')
    records.append({'sourceNumber':n,'archive':archive,'source':entry['fichier'],'sourceSha256':entry['sha256'],'component':box,'file':rel,'assetId':aid,'definitionId':did,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'width':w,'height':h,'bytes':path.stat().st_size,'traversable':not solid})

def insert(path,needle,content):
    p=ROOT/path;s=p.read_text()
    assert s.count(needle)==1,(path,needle)
    p.write_text(s.replace(needle,needle+content,1))

insert('src/objects/object-definition-catalog.js','const DEFINITIONS = frozen([\n',',\n'.join(defs)+',\n')
insert('src/assets/world-object-asset-adapter.js','const WORLD_OBJECT_ASSETS = Object.freeze({\n',',\n'.join(adapters)+',\n')
folders=[(F,'Clôtures / barrières'),(S,'Caisses / tonneaux / stockage'),(M,'Mobilier intérieur'),(T,'Boutiques / boulangeries'),(P,'Pharmacie / soins')]
insert('src/objects/object-library-taxonomy.js','const FOLDERS = Object.freeze([\n',''.join('  Object.freeze('+q({'id':f,'categoryId':'decor','label':l,'defaultKind':'decor'})+'),\n' for f,l in folders))
manifest={'version':1,'sourceCount':len(source),'assetCount':len(records),'bytes':sum(r['bytes'] for r in records),'excludedSourceNumbers':sorted(set(source)-{r['sourceNumber'] for r in records}),'assets':records}
(ASSET/'manifest.genesis-decor-20261125.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in manifest.items() if k!='assets'},ensure_ascii=False))
# Contact sheet for review: use neutral opaque backdrop, never publish to site.
preview=Image.new('RGB',(960,((len(records)+5)//6)*120),'#dddddd')
from PIL import ImageDraw
draw=ImageDraw.Draw(preview)
for i,rec in enumerate(records):
    im=Image.open(ROOT/rec['file']).convert('RGBA');im.thumbnail((150,95))
    x=(i%6)*160;y=(i//6)*120
    preview.paste(im,(x+(160-im.width)//2,y),im)
    draw.text((x+3,y+97),rec['assetId'].split('.')[-2][:23],fill='black')
preview.save('/tmp/genesis-decor-preview.jpg',quality=90)
