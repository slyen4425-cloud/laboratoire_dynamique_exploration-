# V57 — prévalidation technique uniquement — 2026-10-21

Source immuable: `067f8659aac9ddcc682154b76d8526be0109c394`. Branche: `work/exploration-bridge-deck-occlusion-v57-2026-10-21`. START: `checkpoint/exploration-start-bridge-deck-occlusion-v57-2026-10-21`. Checkpoint: `checkpoint/exploration-bridge-deck-occlusion-v57-prevalidation-2026-10-21`.

Retour Pixel: personnage dessiné derrière/en travers du pont bien que corridor franchissable. Correction: **aucun changement de gameplay**; le pont porté par le corridor canonique est dessiné derrière l'acteur, puis le garde-corps inférieur est redessiné devant; ancrage natif image bas conservé et pied visuel rehaussé de façon bornée. Les autres WorldObjects conservent le tri original.

CI [#39603083562](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39603083562) **SUCCESS**, incluant tests Node, build/check, et vrai Chromium Builder/Exploration/Combat. Nouveau test `tests/sculpt-bridge-deck-occlusion-v57.test.js`. Les sentinelles historiques sont conservées et adaptées au paramètre de révision du module.

**Limite :** il faut une inspection Pixel du véritable rendu en mouvement sur chaque orientation et de la ligne de garde-corps ; GREEN esthétique non attribué. Aucun changement des WebP. Publication de la preview une fois V58/V59 testés (lots distincts). Rollback: V56 publié `eabb936639686a41fa31cf469d135c58e4cfbea4`.
