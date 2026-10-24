# Exploration V77 — Pentes naturelles 2,5D praticables (24 octobre 2026)

## Validation d'origine
- Le créateur a **explicitement validé V78 R2 escaliers** le 24/10/2026 (« Ok je valide le système d escalier »). SHA publié : `134b608ef402392e78e02d72707ef8a6324b4bd2`; checkpoint immuable `checkpoint/exploration-stairs-v78-r2-green-pixel-2026-10-24`.
- Lot V77 START `checkpoint/exploration-start-ramp-v77-2026-10-24`, branche `work/exploration-natural-ramp-v77-2026-10-24`.

## Fonctionnalité réalisée
- Palette `Objets > ⛰️ Pentes` : 3 définitions natives `objectdef.ramp.grass.01`, `objectdef.ramp.earth.01`, `objectdef.ramp.stone.01`. Pas d’asset factice : surface 2,5D dessinée procéduralement avec des couleurs herbe, terre et roche.
- Bas et haut de chaque pente sur `WorldObjectPlacement` : bas = ancre placée sur sol sec ; haut = extrémité orientée, raccord à un vrai terrain sec en altitude supérieure ; hauteur interpolée. Longueur et largeur 25-300 % + rotation ; un passage peut relier plusieurs niveaux si suffisamment long. Plusieurs pentes peuvent s'enchaîner.
- Réutilise `sculptStairCorridor` et `sculptNavigationRoute` (Collision World) déjà propriétaires de la traversée des escaliers, étendus à `kind:ramp` ; ***aucun second vérificateur physique***. Le joueur reste porté par le même identifiant de couloir `sculptStairId` en mémoire, jamais sauvegardé dans WorldDocument.
- Le rendu utilise directement les coordonnées haut/bas de la même géométrie à 35, 55 et 90°, donc pas d’effet de panneau à taille fixe. Pendant la traversée, le terrain est peint derrière le héros. Pente non raccordée montrée comme **forme pointillée** et ne donne aucun franchissement.
- Sauvegarde/import utilise `WorldObjectPlacement` + `SculptTerrain` existants (aucun changement JSON terrain, ni migration). Boutons Annuler/Rétablir objets conservés. 

## Garanties et tests
- Le gel des escaliers validés, ponts/rails, hauteurs carrées, sphères, eau, vol, collisions hors couloirs, Builder/Combat et assets est impératif.
- Tests : `tests/sculpt-natural-ramp-v77.test.js`, 3 palettes, propagation aux catalogues Collision World, niveaux 2→5, longueur insuffisante, entrée latérale, eau, rotation, montée-descente, deux pentes en série, import/export, projection 35/55/90° ; tests existants escaliers et ponts ; suite complète Node/check + Chromium Sculpt/Builder/Combat en CI.
- Un ancien test de référence d'identité du catalogue a mis en évidence qu'il fallait conserver le **même** module canonique dans `sculpt-scene-preview.js` ; correction de cette erreur de cache sans adapter l'ancien test ni cloner le catalogue.

## Test Pixel ciblé — statut PREVALIDATION / NON GREEN
1. Créer deux plateaux : un bas et un haut (différence 1–3), avec une falaise entre les deux.
2. Ouvrir Objets > Pentes > Herbe. Poser le **pied en bas**, orienter le haut vers le plateau haut (défaut : vers le haut / nord), régler longueur jusqu'à ce que la tête atteigne l'étage supérieur ; un contour **pointillé** signifie que l'une des extrémités ne raccorde pas.
3. Tester montée et descente, vue 90° → 55° → 35°, marche hors pente toujours bloquée, largeur et orientation indépendantes, sauvegarde puis réimport.
4. Valider aussi les escaliers R2 existants, les sphères, les ponts et la caméra sur Pixel. Ne déclarer GREEN qu'après ce contrôle visuel.
