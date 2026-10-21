# Exploration — V50 falaises natives HD + ponts, prévalidation du 21/10/2026

## Motivation et retour créateur
- V47 : direction esthétique améliorée mais texture trop répétitive/floue et dégradé vertical supprimé. V48 a rétabli les ombres et ajouté de l'irrégularité ; qualité HD de la plaque encore insuffisante.
- V49 avait préparé deux plaques natives 256×256 dérivées des sources 1254×1254 (pas un upscale du motif 96×96) et avait réussi la CI, mais la PR infra #191 était devenue **dirty** après le déploiement des ponts PR #192.
- Ne jamais remplacer le pin source Pages des ponts par celui de l'ancienne V49 qui les omet.

## Gouvernance et source
- Dernière base publiée ponts/V48 : `e8b8c52ccc382a3b2cccf3bb05416ee0607165b1` ; Pages CI [#39494477615](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39494477615) SUCCESS.
- START : `checkpoint/exploration-start-cliff-hd-bridge-reconcile-v50-2026-10-21`.
- Branche : `work/exploration-cliff-hd-bridge-reconcile-v50-2026-10-21`.
- Intégration de 9 fichiers de V49 source `d4dd683ac4d0bcd302f9c2647819cd130f1c42f1`, depuis les SHA blobs GitHub, dans le tree du socle ponts. Documentation du nouveau lot dans LAB_CURRENT_WORK **avant** changement runtime.
- **Source de runtime figée** : `d43d58494bc1f918bcb213846501bc790774ed02`.
- Prévalidation : `checkpoint/exploration-cliff-hd-bridges-v50-prevalidation-2026-10-21` même SHA.
- PR infra seule [#193](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/193) : merge main `319cd099097dbf8dce4bf0d7108fa643c9913fa9` ; source épinglée `d43d58494bc1f918bcb213846501bc790774ed02`. Pages [#39539288589](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39539288589) en cours à la rédaction.

## Tests
- [CI source V50 #39539039602](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39539039602) SUCCESS : 637 tests Node/CI, 637 pass, 0 fail ; Chromium réel Builder + Exploration + Capture/Combat.
- [CI checkpoint #39539155864](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39539155864) SUCCESS.
- CI du socle ponts (toujours présente) : 28 vues natives, manifestes SHA/bytes, quatre ponts historiques, traversées et passabilité.
- Chromium paysage/caméra confirme : V46 eau raccordée, V48 ombres haut→bas delta ~24 ; V49 plaque native 256 px par palette (512×256), 2 123 pixels réellement changés, contraste ombre ~27.09, fallback WebP/overlay V47 inchangés, terrain plat non modifié.
- **Aucun changement** de caméra, Collision World, hauteur, WorldDocument, statuts objets, Actor Capture/Combat, 6 maisons et 7 ponts.

## Gate esthétique
- GREEN **technique et publication** seulement après succès Pages. La satisfaction mobile et la netteté perçue **restent à valider par le créateur**. Si pixelisation/motif répétitif perceptibles, ouvrir un lot de matérieux artistiques dédié, ne pas modifier les collisions.
