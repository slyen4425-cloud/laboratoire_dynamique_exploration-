# Exploration V76 R12 — Altitude lisible, angles texturés et sommet sphérique praticable (24 octobre 2026)

## Origine
Retour du créateur (23/10 20:56) avec capture : angles de plateaux carrés avec aplats de roche déchirés, demande d'éclaircissement progressif de l'herbe selon les étages 1–7, taille visuelle croissante du héros en hauteur et décroissante en profondeur, mouvement extrêmement contraint lorsqu'il se trouve déjà sur un plateau sphérique.

## Charte / isolation
- Dernier GREEN utilisateur : V75 R2 `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`. Dernière prévalidation publique : V76 R11 `ec5f4ed79e448693fbc434c7e06f1d04dac624e5`.
- START immuable : `checkpoint/exploration-start-altitude-depth-v76-r12-2026-10-24`.
- Branche de travail unique : `work/exploration-altitude-depth-v76-r12-2026-10-24`.
- World Model propriétaire unique de la hauteur. Collision World du franchissement. Renderer de la lumière, de la taille du sprite et du masque des coins. Asset Adapter/Material Registry de la roche HD. Aucune duplication d'autorité.
- Gel : zones d'eau, ponts V74, cascades V3, falaises V75, R5 anti-lag, V76 profil/JSON (R9), anneau/rendu R10, V77 pentes et V78 escaliers, autres sous-systèmes.

## Réalisation
1. `src/render/sculpt-altitude-visual.js` : **une seule fonction visuelle dérivée** de l'altitude. Niveau de référence des cartes v1 : 2 (neutre). Niveau 3→7 luminosité par palier jusqu'à +0,26 ; niveau 1/0 obscurcissement jusqu'à −0,156. Le facteur de taille visuelle du héros suit les mêmes paliers (2,7 % par niveau) et reste borné. La physique et la taille du collider n'y accèdent jamais.
2. Les hauteurs carrées et l'herbe sphérique à plateau lisent cette fonction unique. Le retour du plateau à 2D n'invente pas de bordure entre cases de même altitude. Les coins arrondis exposent désormais les **vrais assets rocheux HD** déjà fournis par l'Atlas propriétaire, au lieu d'un aplat beige sans texture.
3. `src/sculpt-lab-main.js` transmet `visualScale` au `createMapActorRenderer` existant, qui sait déjà adapter sprite **et ombre**. `navVisualLevel` adoucit la transition, sans modifier la position physique. Sur une calotte sphérique où le personnage est déjà présent, ses pieds visuels lisent aussi la hauteur canonique.
4. `src/core/sculpt-navigation-collision.js` : un acteur **déjà situé dans la zone intérieure plate du sommet** peut marcher dans cette même zone. Il ne gagne pas le droit de gravir la pente ou d'entrer par le pied du cylindre, et l'ancienne retraite de sécurité vers l'extérieur reste possible. Vol et ponts inchangés. Les sphères sans plateau et les trous ne deviennent pas franchissables.

## Limite connue assumée
Le schéma terrain actuel autorise les niveaux absolus **0 à 7** et la carte de démonstration commence à 2. Il n'existe donc à ce stade que **deux paliers physiques sous le niveau 2** ; une descente physique de sept niveaux sous terre demanderait un autre lot, une extension vérifiée du World Model et de l'import/export, pas un faux effet CSS.

## Contrôles
- Tests Node : éclairage monotone aux niveaux 0..7 ; héros plus grand/petit et ombre proportionnelle ; coins rocheux recouverts des assets canoniques ; déplacement dans le sommet plan depuis l'intérieur, impossibilité de monter du bas, retrait extérieur V76 sauvegardé ; anciens modèles/JSON préservés.
- CI : `npm test`, `npm run check`, Chromium Sculpt / Builder / Combat au SHA final ; comparaison de fichiers sans changement d'asset ni de données monde.
- Publication (seulement si tests GREEN) : PR infrastructure qui épingle le SHA du code testé sur GitHub Pages, jamais merge de fonctionnalités dans `main`.
- **Statut : NON GREEN Pixel**, en attente de test utilisateur sur les angles HD, l'éclairage, l'échelle du héros et les déplacements en altitude. V77/V78 gelées.
