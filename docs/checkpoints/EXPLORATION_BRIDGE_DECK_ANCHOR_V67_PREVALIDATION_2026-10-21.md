# V67 — Ancrage des ponts au centre réel du tablier — Prévalidation technique

Date : 21 octobre 2026.

## Référence immuable
Base V66: e7d823c291629d627648e76a9042412f0580c741, CI #39659074209 SUCCESS.
START: checkpoint/exploration-start-bridge-deck-anchor-v67-2026-10-21.
Branche: work/exploration-bridge-deck-anchor-v67-2026-10-21.
Source V67 immuable: 28e68818913ffd822d581618140d520759f30a90.
Checkpoint: checkpoint/exploration-bridge-deck-anchor-v67-prevalidation-2026-10-21.
[CI V67 #39661442528](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39661442528) SUCCESS : tests Node, npm check, vrais Chromium Builder / Exploration / Combat.

## Correction de cause, pas de rustine
WorldObject transform X/Y reste le centre du corridor traversable. Le renderer dessinait pourtant les 28 sprites de ponts 2,5D avec le pied du bitmap à ce point, c'est-à-dire le tablier 55% plus haut. V57 avait ajouté une élévation artificielle du personnage, incohérente selon la caméra.

V67 crée un unique coefficient explicite de localisation du tablier DANS l'artwork : 55% de sa hauteur depuis la base de la source. L'image du pont est décalée pour que ses planches coïncident avec le même centre canonique que Collision World. La sélection de l'image et le clip de garde-corps suivent le même décalage. Le pied du héros n'est plus artificiellement déplacé sur ce pont. Les ponts historiques et autres objets gardent leur ancrage. Aucun pixel WebP d'origine ni aucune collision, hauteur d'eau ou monde persistent ne sont modifiés.

## Tests réels et bornes
- Unit : 4 orientations visuelles, échelles 40 %, 100 %, 250 %, 300 %, coordonnées de tablier, caméra 35°/55°/90°, hit-test, calque garde-corps et invariant heightfield.
- Chromium complet : carte 20×12, gorge humide profonde sur plusieurs rangées, deux plateaux secs à niveau 6, pont bois natif horizontal à échelle 130%, déplacement réel du héros par touche flèche droite jusqu'à l'autre rive (à 35° puis 90°), nav engine et persistance vérifiés. Ce test aurait empêché de déclarer les premières versions vertes sans franchissement complet.
- Sentinelles Builder, Capture Combat et modules sculpt antérieurs : CI GREEN.
- Le flux audio sur branches séparées reste intact.

## Limitations / validation utilisateur nécessaire
- Les 28 sprites d'origine ne contiennent pas de géométrie 3D variable selon la caméra. Le coefficient d'ancrage commun peut nécessiter un réglage par famille/vue après test réel Pixel ; ne jamais déduire une collision depuis les pixels.
- Inspecter le pont du Pixel à 35° puis 90°, les différentes vues, échelles, garde-corps et le diagnostic facultatif de zone de passage. CI ne garantit pas une silhouette esthétique parfaite.
- Les collines ont un contour arrondi VISUEL mais des niveaux de terrain encore entiers. Les vrais déplacements en pente nécessiteraient un nouveau système géométrique unique, pas un relâchement général de la collision des falaises. Joystick V66 corrigé, à valider tactilement.
- Aucun GREEN créateur avant validation esthétique / tactile. Rollback : V66 SHA e7d823c291629d627648e76a9042412f0580c741, ou V64 SHA bb32a1b257fd7672af28678cc6504da428da1f8c.
