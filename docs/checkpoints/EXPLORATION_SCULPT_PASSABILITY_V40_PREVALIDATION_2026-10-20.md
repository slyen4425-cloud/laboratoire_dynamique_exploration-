# Prévalidation technique — V40 passabilité des reliefs

- **Date :** 20 octobre 2026.
- **Demande :** jonctions de relief sculptées semblant praticables mais bloquant le personnage.
- **Base approuvée :** V39 `fb9f373ecfcd422df1f0cd132205d5abdc692357`, liseré V37 et caméra V39 acceptés sur smartphone.
- **Checkpoint départ :** `checkpoint/exploration-start-sculpt-passability-v40-2026-10-20`.
- **Travail :** `work/exploration-sculpt-passability-v40-2026-10-20`.
- **Source immuable :** `316099aa0cfb64c09723940a7f6e0f5e15faa809`.
- **Checkpoint source prévalidation :** `checkpoint/exploration-sculpt-passability-v40-prevalidation-2026-10-20`.
- **Travail réel :** maximum de dénivelé (montée et descente) réglable entre 1 et 3, défaut 2, exclusivement dans `Tester` ; seule autorité de décision collision `sculptNavigationBlockDetail` réutilisée par `isSculptNavigationBlocked`, retour explicite cause eau/hauteur/limites. Ni heightfield, ni géométrie ni règles de collision 2D ordinaires modifiés.
- **CI :** [source #39365281963](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39365281963) SUCCESS ; [checkpoint #39365419551](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39365419551) SUCCESS.
- **Navigateur :** Chromium réel confirme initial 2 / strict 1 / permissif 3 / retour 2, panneau visible, JSON de scène inchangé et vue d'édition inchangée.
- **Test métier :** une montée/descente de deux niveaux est traversée à 2, refusée à 1 ; une falaise de cinq niveaux reste bloquée à 3 ; eau et limites préservées. Les sentinelles existantes navigation, Builder, Combat, caméra V39, eau/peinture restent vertes.
- **Publication :** [PR infra #178](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/178), main `116718f4e1f9cc0a46b8959405eb3df35f4e3822` ; Pages [#39365497601](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39365497601).
- **Preview :** https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/sculpt-lab.html?v=40
- **Limite :** l'arrondi des parois reste purement visuel ; pour une vraie pente continue physiquement franchissable, futur chantier dédié de rampes authorées (pas d'autorité cachée). Les rencontres, ciel et échelle d'acteurs sont sur issues #175, #176, #177.
- **Statut :** prévalidation technique GREEN ; **NON GREEN créateur jusqu'à validation visuelle et mouvement sur smartphone**.
