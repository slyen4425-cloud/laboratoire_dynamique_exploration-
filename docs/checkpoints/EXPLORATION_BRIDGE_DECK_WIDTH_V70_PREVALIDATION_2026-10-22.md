# Checkpoint V70 — 22 octobre 2026 — Resserrement des bandes marchables des ponts 2,5D

## Motif
Retour visuel Pixel sur V69 : le dessus et le dessous fonctionnent, mais le héros circule dans une bande invisible à hauteur du tablier, au-delà des planches visibles, à la caméra 35°. Capture de l'utilisateur dans le fil de validation le 22/10/2026.

## Bases et branche
- Point de départ immuable : `111594186b8911e1643c3babef5e49ae2926a0a8` (V69, Node/Chromium/Combat CI #39719138147 SUCCESS, preview Pages #39719340952 SUCCESS).
- Checkpoint START : `checkpoint/exploration-start-bridge-deck-width-v70-2026-10-22`.
- Unique branche de lot : `work/exploration-bridge-deck-width-v70-2026-10-22`.

## Diagnostic et changement de vérité
- Sept ObjectDefinitions 2,5D comportaient un `traversal.widthRatio=.82` sur une dimension visuelle de `96`. Cette largeur débordait le plateau de planches et intégrait les rails, retours de maçonnerie et reliefs non marchables.
- Largeur de circulation maintenant `widthRatio=.50` pour **les sept types de ponts 2,5D**. La contrainte de cercle entier (rayon acteur inclus) du Collision World s'applique au rectangle orienté WorldObject.
- Ratio horizontal longueur .92 inchangé ; les quatre vues, la rotation et le scale restent dérivés de la déclaration WorldObject. Les **ponts historiques** restent à .82 et tous les 28 WebP sont inchangés.
- Le mécanisme de couche `sculptBridgeId` de V69 reste propriétaire côté Exploration Core ; passages par dessous, entrées aux extrémités, hauteurs terrain et collisions du fond inchangés.
- L'UI de diagnostic du corridor lit toujours la même géométrie ; aucun masque pixel ni collider parallèle.
- Cache-busting explicite de la chaîne module navigateur pour éviter un mélange des anciennes définitions V69 avec la géométrie V70.

## Sentinelles
- V70 `tests/sculpt-bridge-walkable-width-v70.test.js` : 7 familles × 4 variantes × 4 scales × 2 rotations, contrainte rayon acteur, arrêt physique latéral avec le vrai `stepMovement`, sous-pont sur sol bas, invariance caméra 35° / 55° / 80° / 90°.
- Test historique `tests/exploration-bridges-2p5d-v1.test.js` conserve formellement la largeur .82 des ponts historiques et vérifie la nouvelle exception intentionnelle .50 des seuls ponts 2,5D.
- Chromium réel `scripts/smoke-sculpt-terrain-lab.mjs` recalcule les dimensions du pont placé à 250 %, contrôle la nouvelle largeur physique du tablier .50 et la surface graphique immuable.
- Anciennes sentinelles V17/V55/V60/V63/V65/V66/V67/V68/V69 intactes.
- **Validation automatique :** CI complète requise sur le SHA exact après documentation. Ne pas baptiser GREEN complet avant validation Pixel.

## Validation manuelle manquante
Sur Pixel 10 / portrait-paysage si possible : se placer sur le pont, glisser latéralement vers les deux bords (doit arrêter le centre du héros sur les planches), marcher en longueur, passer dessous à niveau inférieur, tester échelles 50/100/180/300 % et orientation verticale/diagonale à 35°, 80°, 90°. Capturer si nouveau décalage.

## Publication
- Déployer source immuable uniquement après CI SUCCESS, via PR d'infrastructure Pages modifiant seulement `.github/workflows/pages-preview.yml` sur `main`.
- Rétrogradation de preview possible par restauration du ref V69 `111594186b8911e1643c3babef5e49ae2926a0a8`. Pas de fusion du moteur / des assets sur `main`.
