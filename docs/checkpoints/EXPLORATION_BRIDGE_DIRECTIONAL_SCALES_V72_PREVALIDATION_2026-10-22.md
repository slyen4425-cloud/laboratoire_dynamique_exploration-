# Exploration V72 — Prévalidation des échelles longueur / largeur et orientation du pont vertical — 22/10/2026

## Retour de test Pixel V71
- L'utilisateur confirme les ponts horizontaux corrects.
- La vue verticale ne correspond toujours pas au passage attendu ; sa longueur est impossible à régler sans agrandir aussi les rambardes.
- Capture fournie dans le fil montrant la vue verticale du pont, les berges et le héros sur la passerelle.

## Base, branche, autorité
- Base immuable V71 : `8ca851aada87f75a6157150b47191b7e0400be0c`.
- Checkpoint START avant tout correctif : `checkpoint/exploration-start-bridge-directional-scales-v72-2026-10-22`.
- Lot `work/exploration-bridge-directional-scales-v72-2026-10-22`.
- Autorité géométrie `WorldObjectPlacement.transform.scaleX/scaleY` (schéma existant) : **scaleX = axe longitudinal** (longueur) ; **scaleY = axe transversal** (largeur). Les quatre variantes (horizontal, vertical, diagonales) partagent ce sens sémantique, déjà consommé par `bridgeTraversalRect`.
- Le Scene Preview expose des opérations d'édition indépendantes des deux dimensions sans schéma supplémentaire, compatibles avec anciens placements `scale`.
- Le Sculpt Editor expose deux sliders distincts pour les ponts, conserve le réglage uniforme pour objets non-ponts. Sélection, déplacement, undo, sérialisation/import utilisent le WorldObject canonique.
- Le Sculpt renderer seul transpose la boîte visuelle des assets natifs `_2p5d.vertical.` : image largeur = `base.width * scaleY` ; hauteur = `base.length * scaleX`. Le corridor physique de V71 reste long sur Y et centré. La sélection visuelle lit le même adaptateur.

## Invariants protégés
- Aucune modification des 28 images, ni de leur manifeste d'intégrité.
- Ponts horizontaux inchangés ; autres vues et ponts historiques inchangés.
- `traversal.widthRatio = 0.35`, `lengthRatio = 0.92`, altitude, eau, rail-edge, passage sous/sur le pont, gestion des pieds et traversée en longueur inchangés.
- Collision et mouvement ne lisent aucun pixel ou dimension du renderer.
- WorldDocument / Builder 2D / Combat Capture / caméra / joystick hors périmètre.

## Vérifications
- Sentinelle `tests/sculpt-bridge-directional-scales-v72.test.js` : sept styles, quatre vues, changements de longueur/largeur, export/import, géométrie horizontale et verticale, collisions réelles aux deux bords et passage longitudinal.
- Sentinelle historique V56 gardée : dimension maximale 300 % des ponts, limite 120 % des objets non-ponts, réparation alpha sans gameplay.
- Parcours browser `scripts/smoke-sculpt-terrain-lab.mjs` : placement pont à 250 %, sélection/déplacement tactile simulé, réglage longueur à 200 % et largeur à 70 %, changement réel de vue verticale, export puis comparaison sprite/corridor : largeur visuelle 67.2, hauteur visuelle 340, longueur physique 312.8, largeur de traversée 23.52.
- CI V72 code et sentinelles Node + Chromium Sculpt/Builder + Combat **SUCCESS #39785396478** (SHA `fe0b77fd03b6ae2405775dc5af8966d2db6f73ee`).
- Le SHA final après documentation nécessite la même CI verte avant épinglage et checkpoint.

## Gates
- **Prévalidation technique** après CI sur SHA final et déploiement Pages.
- **Validation Pixel manquante** : horizontal comme contrôle ; vertical en 35/80/90°, longer les deux rambardes, franchir les deux extrémités ; longueur 200 %, largeur 70 % ; sauvegarde/import ; compatibilité anciennes cartes.
- Aucune affirmation de GREEN fonctionnel complet avant test du créateur.
- Revenir à la V71 publiée : `8ca851aada87f75a6157150b47191b7e0400be0c`.
