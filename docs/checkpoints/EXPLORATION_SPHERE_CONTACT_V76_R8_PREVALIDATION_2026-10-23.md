# Exploration V76 R8 — jonction géométrique herbe/roche (23/10/2026)

## Retour créateur
V76 R7 montre un disque herbeux plus large que le cône de roche qui le supporte. Le problème n'est **pas** un simple liseré de texture : le rendu ancien désignait comme sommet de l'herbe des faces *au-delà* de `summitRatio`, car `wall` n'était true que quand `(radial-summitRatio)/(1-summitRatio) >= .45` (monticule) ou `.24` (trou). Une colonne avec plateau `.75` avait donc visuellement de l'herbe sur une couronne de pente qui appartenait à la roche.

## Gouvernance
- Dernier GREEN utilisateur : V75 R2 `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`.
- Source V76 R7 avant correction : `db5cc35af3a8edb3d730ed9420f5c76b851fa0b2`. **V76 R7 NON GREEN**, pas validée sur smartphone.
- Checkpoint START : `checkpoint/exploration-start-sphere-contact-v76-r8-2026-10-23`; branche dédiée unique : `work/exploration-sphere-contact-v76-r8-2026-10-23`.
- Le propriétaire unique de la géométrie physique reste `src/world/sculpt-height-model.js` ; le renderer utilise ses échantillons et ne modifie **aucune collision** ni aucune hauteur enregistrée. Pas de patch dans main.

## Correctif V76 R8
- `src/render/sculpt-sphere-mesh.js` : introduit une frontière radiale visuelle unique `sculptSphereVisualContact(sphere)`. Avec `summitRatio>0`, elle vaut **exactement** la largeur physique du plateau `summitRatio`. Pour les sphères rondes historiques (`summitRatio=0`), garder une couronne arrondie sans plateau plat, avec limite .45 pour colline et .24 pour cuvette.
- `sculptSphereRadialRings(sphere)` insère une ligne de points projetés précisément à cette frontière si elle tombe entre deux subdivisions : ex. `.75` entre `.7` et `.8`. Les faces roche commencent à cet anneau et les faces herbeuses s'y terminent ; **mêmes sommets 2,5D**, sans fossé, disque en surplomb ou faux volume.
- Maillage inchangé en ordre de grandeur : 36 secteurs × 10 bandes + maximum une bande supplémentaire ; cache des sphères préservé. Le croissant d'ombre utilise maintenant les derniers anneaux du maillage adaptatif.
- Transitions : une épaule terreuse très légère (.11 opacité pour colline) est confinée à la **dernière bande d'herbe avant la frontière**. Elle ne déborde jamais. Conservation de l'ordre arrière/herbe/avant R6, éclairage R7, matériaux HD V49/registre, pinceau permanent en visée R6 et cache R5.
- Aucun changement à V75 falaises, ponts V74, cascades V3, eau, vol, Collision World, caméra, Build/Combat, World Model ou format JSON.

## Tests
- `tests/sculpt-spherical-relief-v76.test.js` : rayon partagé exact pour colline/cuvette aux profils 0, 15, 45, 50, 75 et 85 % ; absence de recouvrement de bandes ; rayon du disque d'herbe réel par lecture des contours de Canvas ; roche présente aux mêmes sommets ; sérialisation d'anciennes cartes ; nombre de remplissages borné.
- CI Node+Check + Chromium Sculpt/Builder/Combat sur SHA final. Comparaison R7→R8 sans assets ou gameplay changés.
- Publier par PR **infra pin** vers le SHA final CI GREEN, pas de merge fonctionnel sur main.
- **Statut : PRÉVALIDATION, NON GREEN Pixel** tant que l'utilisateur n'a pas vérifié sur son appareil une colonne herbeuse rayon sommet 75 % et l'absence de surplomb.
