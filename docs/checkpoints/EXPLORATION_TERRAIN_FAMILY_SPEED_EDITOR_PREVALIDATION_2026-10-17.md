# Exploration — Terrain Family Speed Editor — prévalidation technique

Date : 2026-10-17

- Branche unique : `work/exploration-terrain-family-speed-editor-2026-10-17`
- Base CI GREEN : `ff3db58d6f7c065f7dc0b9fb556ce16c9115dd62`
- Checkpoint de départ : `checkpoint/exploration-start-terrain-family-speed-editor-2026-10-17`
- Code testé avant documentation : `33194bd53e9199a00df254ede56dbc8e10a75cf4`
- CI complète : [run 38993188944](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/38993188944) — SUCCESS (core-tests + modern-combat-encounter Chromium).
- TDD RED : [run 38992742065](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/38992742065) — FAILURE attendue avant implémentation.
- Régressions initiales identifiées sur schéma legacy / cache JS, puis résolues sans affaiblir les anciennes cartes ou les règles de tests.
- Périmètre : vitesse Marche/Nage/Vol 0-1000 % par famille dans le Builder, stockée dans `WorldDocument.terrainFamilies` ; Registry/Resolver unique ; mouvements sur zones peintes ; export/import ; cache navigateur.
- Valeurs de compatibilité : Route marche x1.25 ; sol x1 ; eau nage x0.75 ; mode à zéro non traversable. Anciens WorldDocuments sans paramètre restent intacts.
- Registre et résolution de surface : uniques ; ordre rivière > route > zone peinte > fond ; Bridge conserve son override. `materialId` n'influence pas les vitesses.
- Régressions connues : aucune sur tests CI. Test tactile et visibilité des champs sur smartphone **non encore validés par le créateur**.
- Statut : **CI GREEN technique / prévalidation uniquement — PAS GREEN FINAL** ; le checkpoint final attend la validation utilisateur mobile.
- Étape autorisée : publier la preview isolée depuis le SHA testé final, vérifier visuellement sur smartphone, puis seulement checkpoint GREEN final. Aucun travail dans le laboratoire Combat ni dans `Zombicide-40k`.
