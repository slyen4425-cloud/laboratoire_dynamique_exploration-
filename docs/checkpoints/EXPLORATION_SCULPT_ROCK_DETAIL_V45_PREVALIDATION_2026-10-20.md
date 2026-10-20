# Exploration — V45 roche à facettes et grain minéral — Prévalidation 20/10/2026

## Gouvernance
- Retour utilisateur après V44 : très bonne ergonomie mais parois rocheuses trop uniformes (« pas beau »), souhaite rendu plus réaliste, formes non répétitives, couleurs variées.
- Source initiale V44 créateur validée : `809802015eb91d752016bafe1103e4d02ddd50e4`.
- Checkpoint START `checkpoint/exploration-start-sculpt-rock-detail-v45-2026-10-20`, travail `work/exploration-sculpt-rock-detail-v45-2026-10-20`.
- Code V45 figé à `8dca9d98640f3af4397b5ed2b02b21e9a10b6bd7`.
- Checkpoint prévalidation `checkpoint/exploration-sculpt-rock-detail-v45-prevalidation-2026-10-20` au même SHA.
- CI source [#39428130429](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39428130429) SUCCESS, tests Node, syntaxe, réel Chromium, Builder/Combat ; CI checkpoint [#39428284597](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39428284597), attente résultat final lors de la rédaction.
- La validation esthétique sur smartphone du créateur reste **à faire**, ne pas marquer GREEN créateur par avance.

## Changement visuel seulement
- Nouveau module `src/render/sculpt-rock-detail.js` : texture de grain minéral 128×128 déterministe et périodique, Canvas raster généré **une seule fois par palette** et réutilisé en cache ; aucune image générée/exportée ni texture doublée par cellule.
- Facettes non répétitives, fines veines/fissures et stratification cassée en segments, calculées de façon déterministe selon les runs de roches existants. Aucun changement aux rochers placés, au heightfield, aux faces physiques ou aux collisions.
- Toutes les palettes précédentes (Grès brun, Gris bleu, Sable ocre, Roche sombre) sont conservées ; ajout Granite gris / Roche dorée. Nouveau cache-bust renderer JS `sculpt-rear-rim-v37-rock-v45`, conservant la sentinelle V37.
- La terre du sommet et le liseré sombre de V37, la passabilité V40, ciel V41, acteurs V42, déplacements fluides V44 restent strictement inchangés.

## Vérification
- Test pur bornes des facettes, déterminisme des seed, six palettes.
- Test Chromium réel sur une falaise continue haute de trois niveaux : plus de 50 variations minérales colorées dans la zone test, >120 pixels différents entre gris et brun, aucune modification du sol plat lors d'un changement de palette.
- Garde réelle Chromium V35/V36/V37 sur quatre liserés, V38/V39 angle, V40 passabilité, V41 météo, V42 Capture Actors, V43 toolbar et V44 déplacement.
- Performance : texture raster en cache, complexité des facettes bornée à 58 colonnes et 7 lignes; le décor en édition Objets continue de réutiliser le cache V44.

## Limites & suite
Ce rendu est une première tentative procédurale plus détaillée, **pas une texture externe photographique**. Son style sera confronté à la référence du créateur avant décision sur des textures 2D réelles. Berges d'eau carrées = lot visuel dédié et séparé, préserver volumes/Collision World.
