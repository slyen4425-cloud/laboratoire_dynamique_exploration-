# V49 — Source HD réelle sur falaises — prévalidation du 20/10/2026

## Version de référence et gouvernance
- V48 validée pour direction visuelle / relief et profondeur, source publiée immuable `623bc4a84254793b9073b24508448333da5f1014`.
- Start `checkpoint/exploration-start-cliff-hd-v49-2026-10-20`, branche `work/exploration-cliff-hd-v49-2026-10-20`.
- Source V49 validée sans modifications ultérieures : `d4dd683ac4d0bcd302f9c2647819cd130f1c42f1`, checkpoint `checkpoint/exploration-cliff-hd-v49-prevalidation-2026-10-20`.
- Source CI `#39492624038` SUCCESS (635 tests Node/JS ; vrai Chromium + Combat/Builder). Checkpoint CI `#39492806773` à confirmer avant publication.
- **Statut créateur :** V49 encore **NON validée visuellement sur smartphone**. V46 eau, V48 ombres, V44 ergonomie et nouveaux bâtiments sont conservés.

## Changement de qualité
- Asset `assets/sculpt/cliff-base-hd-v49.webp`: **2 textures grise et ocre, 256 × 256 chacune**, échantillonnées directement depuis 2 PNG originaux **1 254 × 1 254**. Ce n'est PAS un agrandissement des bases 96 × 96 de V47.
- Atlas HD total **512 × 256**, source Git blob `8284c49831937806b34112fcb317f91f32428026`, poids **8 412 octets** en WebP (mobile). Manifeste `cliff-base-hd-v49.manifest.json`, SHA-256 `b32bb9da1c33c865d62adc2c9c53107fcf2189a7ddfc9d51c3fa35c3e53a3d49` conforme aux octets committés.
- Nouveau visual adapter `src/render/sculpt-cliff-hd.js`, chargé en cache une fois. Il remplace uniquement les deux **bases** lors du dessin des murs, conserve les overlays fissures/éclats/mousse de V47, le dégradé haut→bas et l'ombre latérale **appliqués après** les textures dans V48.
- Absence ou erreur d'image HD : le rendu V48 se maintient, sans faux transfert ni deuxième matériau de collision. Pas de modification terrain/heightfield/WorldSurface/Collision World.
- Comparaison précédente vs nouvelle texture sur la vraie toile Chrome : **2 123** échantillons de falaise visuellement différents, **2 124** différences entre palettes, degré d'assombrissement haut/bas **27,09**. Source réellement décodée **512 × 256**, et ancien atlas V47 toujours **192 × 160**. Champ et surface sol/eau, liseré V37, mobilité V44, acteurs et maisons restent protégés par sentinelles.

## Limite
Le prototype WebP 256 px gagne ~2,67× la dimension de motif natif (96 → 256) mais ne représente pas les 1 254px sources à pleine échelle ; une version plus grande peut être envisagée après appréciation esthétique/performance du créateur. Les raccords de texture en mosaïque doivent être appréciés sur plusieurs longueurs/hauteurs de falaise. Ponts, rencontres Capture/Combat et intérieurs sont des lots ultérieurs distincts et non mélangés au V49.
