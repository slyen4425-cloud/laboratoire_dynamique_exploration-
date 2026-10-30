# Prévalidation V71 — Passage central 35 % et bordures bloquantes — 22 octobre 2026

## Retour créateur V70
- Dessus / dessous du pont V70 considérablement améliorés, mais le héros marche encore dans une fine bande latérale (haut/bas selon la vue), à hauteur de tablier.
- Décision explicite : largeur marchable 35 %, centrée ; les deux bordures se comportent comme des barrières physiques empêchant de marcher sur les rambardes.

## Base et autorité
- Source immuable de référence V70 : `b0235eab980a3311b4d899edc40ebe79d4049fd9`.
- Checkpoint avant modifications : `checkpoint/exploration-start-bridge-center-rails-v71-2026-10-22` sur ce SHA.
- Source lot : `work/exploration-bridge-center-rails-v71-2026-10-22`.
- **Autorité unique** WorldObject ObjectDefinition : dans les 7 familles de ponts 2,5D, `traversal.widthRatio=.35` au lieu de `.50`. Le corridor `bridgeTraversalRect()` reste centré sans offset, avec la longueur `.92` et la rotation/scale inchangés.
- **Collision** : `circleFitsOrientedRect` exige l'intégralité du disque du personnage au milieu ; tout mouvement latéral dépassant cette bande est refusé avec `bridge-edge`. Le bord constitue l'obstacle **pour le seul acteur sur le pont** ; sous le pont la couche sol reste autorisée. Aucun collider de rampe autonome n'est ajouté, évitant une double autorité.
- **Core/Renderer** : V69 conserve seul `sculptBridgeId`, la hauteur, les accès secs en bout et le passage sous le pont ; le rendu du pont conserve ses 28 WebP et l'ancrage V67 / l'avant-plan V68. Le contour diagnostic lit la même géométrie que Collision World.
- **Cache** : révision V71 des import URLs du chemin navigateur afin d'éviter le chargement simultané de catalogues `.50` et `.35`.

## Tests exécutés
- Nouveau `tests/sculpt-bridge-center-rails-v71.test.js` : 7 familles × 4 orientations × 4 échelles × 3 rotations avec deux bords, rayon complet, centre inchangé et caméras 35/55/80/90°.
- Moteur `stepMovement` réel : arrêt aux deux bords, impossibilité de tomber / marcher sur les barrières ; traversée longitudinale et passage inférieur préservés.
- Sentinelles V70 et `tests/exploration-bridges-2p5d-v1.test.js` actualisées à la nouvelle valeur explicitement demandée, conservant les ponts historiques à `.82`.
- Chromium réel `scripts/smoke-sculpt-terrain-lab.mjs` contrôle la nouvelle largeur sur un pont placé à 250 %.
- CI complète Node/npm + Chromium Sculpt/Builder/Combat `#39755354274` **SUCCESS** au SHA pré-documentation `55efd47066808c293cf9b217c2748b573b4d92ad`.
- Le SHA final après documentation doit à son tour recevoir une CI complète **SUCCESS** avant publication épinglée ou checkpoint de prévalidation.

## Ce qui demeure gelé
- Dimensions artistiques et 28 fichiers WebP ; longueur, rotation/variant, scale, vitesse caméra et joystick.
- Ponts historiques et leurs profils existants ; relief et hauteur de berges, eau, WorldDocument, Surface, 2D/Builder, Combat et autres dépôts.

## Gates
- **GREEN technique uniquement** après CI complète du SHA final.
- **NON GREEN visuel/tactile** : validation manuelle sur Pixel demandée ; à 35° et 80° se frotter aux deux rambardes, tester les 4 variantes, le franchissement avant/arrière et le passage inférieur.
- Preview isolée dans Pages via une branche infra et un PR sur `main` ne modifiant que `.github/workflows/pages-preview.yml`. Le code source n'est jamais fusionné dans `main`.
- Rollback preview vers V70 : `b0235eab980a3311b4d899edc40ebe79d4049fd9`.
