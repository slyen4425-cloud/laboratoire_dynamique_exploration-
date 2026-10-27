# Exploration V76 R10 — Flanc conique continu et zéro triangle parasite (23/10/2026)

## Entrée / constat créateur

Capture après publication V76 R9 : en posant un plateau d'herbe avec un sommet de **50 %** et des sommets encore plus étroits, les flancs rocheux forment des **pointes triangulaires verticales**, des trous de textures et une silhouette qui n'est pas un tronc de cône uniforme. Retour explicite : « On s'approche mais encore bug texture et pour diamètre plus petit, c'est pas encore bon ». V76 R9 est donc **NON GREEN**.

## Gouvernance charte

- Dernier GREEN utilisateur : V75 R2 `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`.
- Base V76 R9 source publiée : `f5ca685a5ff3e6f9063f389cee12c873ec6caf63`.
- Checkpoint START immuable : `checkpoint/exploration-start-sphere-continuous-flank-v76-r10-2026-10-23`.
- Unique branche de travail : `work/exploration-sphere-continuous-flank-v76-r10-2026-10-23`.
- Un seul propriétaire de la forme physique : `src/world/sculpt-height-model.js`. La couche de rendu ne modifie pas la physique, les JSON, les collisions ni les règles de mouvement.
- Gel : V75 falaises, V77 pentes franchissables et V78 escaliers, ponts V74, cascades V3, assets HD/Forest existants, la caméra, le masque de projection collision R9, l'interface et ses 0–100 %, le pinceau R6, les ombres R7 et les performances R5. Pas de rustine, doublon d'autorité, ni correctif sur `main`.

## Analyse et correction unique

- Cause 1 : rendu R9 peignait les flancs via une union de quads radiaux projetés séparément. Sur les frustums raides les quadrilatères se replient / se chevauchent en coordonnées écran : trames rocheuses en dents, faces partiellement effacées et triangles sur les côtés du petit plateau.
- Cause 2 : au bord exact d'un cylindre 100 %, `Math.sin/cos` produit parfois un rayon flottant légèrement inférieur à 1 ; le modèle renvoie alors toute la hauteur au lieu de 0, provoquant des pointes extrêmes sur le périmètre de dessin. En rendu seulement, le dernier anneau est échantillonné strictement avec delta=0. Aucune correction parallèle de Collision World.
- Correction R10 : pour toute `hill` avec `summitRatio > 0`, produire **exactement deux contours continus** à partir du maillage analytique déjà caché :
  - **Sommet unique** = cercle fermé de 36 secteurs au rayon du plateau (contact R8), rempli par le vrai matériau herbe du sol, avec éclairage doux.
  - **Paroi avant unique** = rideau fermé joignant les 19 points du demi-cercle SUD du sommet aux 19 points du demi-cercle SUD du pied. Le rocher/terre/herbe est texturé avec **un unique pattern ancré dans le monde**, puis ombré avec les gradients R7. Le pied conserve sa courbe en demi-cercle, la pente conique est régulière, sans trianges derrière le sommet.
- `summitRatio=0` conserve le dôme sphérique historique ; les `basin` gardent leur rendu et collision d'excavation. `summitRatio=1` conserve le cylindre R9. Pas de nouveaux sprites.
- Moins de dix remplissages par relief à sommet : la méthode conserve le cache R5 et supprime au lieu d'ajouter des quads peints.

## Critères de GREEN technique

- Tests Node `tests/sculpt-spherical-relief-v76.test.js` : sommet 5/10/20/30/50/75/95/100 %, contours partagés exactement ; 37 points au plateau, 19+19 points au rideau, pied à niveau zéro, absence de nouveau trait noir et de fragments, plafond de remplissages ; anciennes sphères, anciens trous et JSON préservés.
- Chromium `scripts/smoke-sculpt-terrain-lab.mjs` : canvas réel peint avec silhouettes 5, 20, 50, 75, 100 %, échantillonnage de pixels sur le rideau sans transparence parasite ; autres tests Sculpt/Builder/Combat toujours verts.
- CI entière sur SHA final et diff de code limité au renderer/test/docs (aucun asset/World Model/Collision World modifiés). Publication par **PR infrastructure** épinglant le SHA testé, jamais merge de gameplay dans main.
- **V76 R10 NON GREEN Pixel** jusqu'au retour visuel sur une petite couronne, une couronne 50 %, et le cylindre 100 %.
