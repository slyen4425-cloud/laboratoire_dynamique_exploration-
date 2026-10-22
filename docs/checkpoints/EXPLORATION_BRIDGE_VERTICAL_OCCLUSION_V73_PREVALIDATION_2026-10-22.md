# Exploration V73 — Prévalidation technique : pont vertical, rambardes sans recouvrement du héros

**Date :** 22 octobre 2026

## Problème utilisateur reproduit

Capture Pixel V72 avec un pont vertical à la caméra **55°** : le personnage est au-dessus du tablier et la navigation fonctionne, mais une zone du plancher plus proche du bas de l'image se redessine **sur son corps**.

La V68 redessinait au second passage une bande horizontale pleine largeur (`sculptBridgeForegroundClip()`). Pour un visuel **vertical** cette bande englobe les planches centrales, alors que les rambardes visibles longent les bords gauche et droit. La physique est correcte : c'est une erreur de découpage du rendu.

## Base et gouvernance

- **Base V72 (prévalidation technique GitHub Pages) :** `dc08370a922858f51fb9be6935561c6c70a84199`.
- **Checkpoint avant modification :** `checkpoint/exploration-start-bridge-vertical-occlusion-v73-2026-10-22`.
- **Branche unique :** `work/exploration-bridge-vertical-occlusion-v73-2026-10-22`.
- **Autorité :** uniquement le rendu `src/render/sculpt-bridge-deck-layers.js` et le canvas `src/sculpt-lab-main.js`. La fonction `sculptBridgeForegroundRegions()` déclare deux bandes visuelles extérieures pour les 7 ponts 2,5D dont la variante est `vertical`. Les autres vues gardent `sculptBridgeForegroundClip()` inchangée.

## Invariants et risques

- Le premier passage peint toujours l'intégralité du pont **derrière** le héros, le second ne peint que les rambardes gauche/droite devant ; aucune bande de planches centrales au second passage. Si le héros marche **sous** le pont, le pont complet reste peint devant lui.
- V69 deux couches, V71 largeur centrale 35 %, V72 taille longueur/largeur, 28 WebP, rotation, Collision World, WorldDocument, caméra et joystick gelés.
- Les bordures peintes sont limitées aux 19 % externes du sprite de chaque côté, quelle que soit sa taille. Les tests visuels Pixel devront contrôler la fine limite des rambardes et le contact des pieds à 35°, 55°, 80°.
- Pas de masque basé sur des pixels ou des surfaces physiques nouvelles.

## Sentinelles

- Nouveau test `tests/sculpt-bridge-vertical-occlusion-v73.test.js` : 7 types verticaux, 5 combinaisons d'échelles non uniformes, caméra 35/55/80/90°, coins et corps du héros protégés ; masques horizontaux/diagonaux/historiques inchangés.
- Vérification réelle Chromium dans `scripts/smoke-sculpt-terrain-lab.mjs` après édition d'un pont vertical : deux zones de garde-corps visibles, aucune région de second passage couvrant le centre du tablier.
- Régression Node et Chromium des anciens lots ; workflow Combat inclus ; révision Web module V73 évite cache Pixel.

## Gate de validation

- **Prévalidation technique requise :** CI SUCCESS sur le SHA final exact, branche de checkpoint de prévalidation, branche infra de publication et workflow Pages SUCCESS.
- **GREEN visuel/tactile : en attente.** Seul le test manuel Pixel du créateur à 55° puis 35/80°, horizontal inchangé et trajet dessous/dessus, permettra de lever ce gate.
- **Rollback Pages :** `dc08370a922858f51fb9be6935561c6c70a84199` (V72).

**État initial de ce document :** correctif poussé sur branche ; CI V73 à valider avant publication.
