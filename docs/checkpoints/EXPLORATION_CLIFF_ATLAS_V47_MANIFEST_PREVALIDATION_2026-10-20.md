# V47 — Atlas de falaise illustrée, prévalidation technique — 20/10/2026

## Demande et décisions
Utilisateur : roches V45 rejetées esthétiquement, eau V46 validée, accord de tester un véritable atlas d'images de paroi : bases grise/ocre, fissures, éclats, mousse facultative. L'intégration doit être faite par le laboratoire, en suivant `docs/LAB_CHARTE.md`, sans demander le redépôt de textures générées dans la conversation.

## Source et publication
- Source publiée précédente V46 + 6 bâtiments / 23 vues : `957f93f55d0e632594b6dc780cd93a041c52b467`, CI/Pages #39436248689 SUCCESS.
- START : `checkpoint/exploration-start-cliff-texture-atlas-v47-2026-10-20`.
- Travail : `work/exploration-cliff-texture-atlas-v47-2026-10-20`.
- Source immuable V47 : `3b79161355b6c65ec10afe0dabc5851f71fca513`.
- Prévalidation officielle finale : `checkpoint/exploration-cliff-atlas-v47-manifest-prevalidation-2026-10-20` épinglée sur exactement cette source. Un checkpoint exploratoire antérieur `checkpoint/exploration-cliff-texture-atlas-v47-prevalidation-2026-10-20` existe, mais il précède l'ajout du manifeste SHA; ne jamais le confondre avec la source publiée.
- CI source #39460619430 SUCCESS (632 tests et vrai Chromium); checkpoint #39460848397 SUCCESS.
- PR infrastructure seule [#189](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/189), merge main `ab9db02f56a654cf39d7c854660984f061ac6b67`. GitHub Pages [#39461194018](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39461194018) ; attendre succès de run avant annoncer déploiement GREEN.
- Preview `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/sculpt-lab.html?v=47`.

## Asset réellement intégré (charte 12.1)
- `assets/sculpt/cliff-atlas-v47.webp`, **8304 octets** ; `RIFF WEBP`, taille RIFF déclarée = 8304 octets. Runtime manifest `assets/sculpt/cliff-atlas-v47.manifest.json` version 1, 192×160 px, 5 rectangles (bases grise/ocre de 96×96, fissures/éclats/mousse de 64×64).
- SHA-256 mesuré **dans la CI sur les octets effectivement commités** : `ebaf2db3249c6901fd3cd81b1e606f022d116f7058c4d90f8791a0cd0cb30673`. Le test Node vérifie SHA/bytes/RIFF et concordance manifeste.
- `src/render/sculpt-cliff-atlas.js` : source unique d'images, découpe Atlas cachée, couleurs chaudes/froides, deux overlays d'éclats/fissures et mousse optionnelle. Rendu `src/render/sculpt-height-renderer.js` clippe à la forme géométrique canonique. `src/sculpt-lab-main.js` charge une fois, invalide cache terrain V44 au chargement.
- Test Chromium réel prouve atlas chargé, parois modifiées (1 541 pixels échantillonnés), 6 palettes disponibles et contrastées, sol plat inchangé, fallback explicite, maisons et eau V46 préservées.

## Limitations connues / validation utilisateur
- Atlas **miniature de prévisualisation**, 192×160 pixels (bases 96×96) : ce n'est pas une texture HD, seamless non garanti par génération. Risques de flou, de répétition et d'artéfacts d'overlays sur longues falaises. Toute qualité esthétique reste à confirmer par le créateur sur smartphone.
- Aucun changement des hauteurs, Collision World, pinceaux d'eau/terre, caméra, Actor, maisons, interactions, export/import, rencontres, Builder/Combat.
- **Statut : prévalidation technique uniquement**, non GREEN esthétique. Refaire une texture plus haute définition si le test réel ne satisfait pas le créateur ; ne pas déclarer la série d'assets terminée avant validation.
