# EXPLORATION — V75 R2 — prévalidation technique Pixel (22/10/2026)

## Retour d'essai et cause
Après V75 initiale en ligne, le créateur constate sur Pixel qu'en venant du haut de la vue, l'acteur paraît pénétrer la calotte d'une falaise. Le Collision World V75 interdisait déjà les changements de hauteur aux bords des cellules ; il ne rendait pas compte du décalage géométrique de la *projection* 2,5D des sommets nord.

## Lot et source
- Base unique : `273e1b9cd7d900647003013b0952e95871f49d50` (V75 + Cascades V3, CI antérieure SUCCESS).
- START : `checkpoint/exploration-start-cliff-lock-v75-north-occlusion-r2-2026-10-22`.
- Travail : `work/exploration-cliff-lock-v75-north-occlusion-r2-2026-10-22`.
- Propriétaire : Collision World, rendu non propriétaire du déplacement.
- Champs `WorldDocument` et textures/animations/objets inchangés.

## Changement
`sculptNorthCliffProjectionBlock` examine uniquement les escarpements canoniques ouverts au nord et leur avance visuelle paramétrée (`projectionRise`). Le Tester passe explicitement cette distance depuis sa tuile existante : le noyau 2D historique n'active pas ce diagnostic de sculpture sans contexte. La recherche est bornée à sept niveaux de dénivelé ; elle ne crée aucun collider sauvegardé.

Le contrôle s'applique aux marcheurs de l'éditeur, à l'exception d'une traversée physiquement portée par un pont, d'un passage sous pont existant et du vol. La sortie nord d'une position déjà prise dans l'ancienne zone reste possible. La détection normale de dénivelé au bord réel demeure en place. Invalidation ciblée du cache des modules concernés.

## Preuves et sentinelles
- Test Node `tests/sculpt-cliff-lock-v75.test.js` : deux destinations de **même hauteur** avant le bord canonique ; marche bloquée par le même `stepMovement/isBlocked`, déplacement latéral plat et vol préservés, retraite nord permise.
- Navigateur Chromium `scripts/smoke-sculpt-terrain-lab.mjs` : chemin réel des modules à 35°, 55°, 80° et 90° et succès des sentinelles historiques.
- Première CI complète PASSÉE : [Exploration CI du correctif R2](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39843775557) sur SHA `63fd7ba10c77150e163b912fb3bbe80d8765d709`.
- Plusieurs commits intermédiaires ont échoué à la CI ; les erreurs de compatibilité ponts ont été corrigées avant ce succès. Chaque futur SHA publié doit être vérifié à son tour.
- Vérifier avant publication que les 20 WebP cascades V3 et les 28 ponts restent identiques aux fichiers de la base.

## GREEN et reprise
**Prévalidation technique uniquement.** Checkpoint GREEN complet **interdit** tant que le créateur n'a pas contrôlé sur Pixel : nord/sud/est/ouest et diagonales, 35°/55°/80°/90°, marches 1 et 2 niveaux, pont sur/sous, vol et cascades V3.

Prévisualisation Pages par PR infra séparée épinglant **le SHA exact final** et seulement après CI SUCCESS de ce SHA. V76 sphères/cavités, V77 pentes et V78 escaliers restent gelés jusqu'à acceptation explicite de V75 R2.
