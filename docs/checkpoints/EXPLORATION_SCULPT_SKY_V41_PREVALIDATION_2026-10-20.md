# Prévalidation technique — V41 atmosphères du mode Tester

- **Date :** 20 octobre 2026.
- **Demande :** fond noir cassant le paysage + ciel matin/midi/soir/nuit, nuages, brume, étoiles ; [issue #175](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/issues/175).
- **Base source technique :** V40 `316099aa0cfb64c09723940a7f6e0f5e15faa809`, toujours en attente validation visuelle du franchissement ; V39 GREEN créateur.
- **Start :** `checkpoint/exploration-start-sculpt-sky-v41-2026-10-20`.
- **Branche de travail :** `work/exploration-sculpt-sky-v41-2026-10-20`.
- **Source immuable testée et publiée :** `5c6d727baac2f29a8e4ec676ffe99ca569285cb3`.
- **Checkpoint prévalidation :** `checkpoint/exploration-sculpt-sky-v41-prevalidation-2026-10-20`.
- **Diff réel :** `src/render/sculpt-sky-backdrop.js` rendu Canvas déterministe (4 ciels, horizon, nuages, brume, étoiles uniquement la nuit) ; image hors carte cachée sur la durée et réutilisée à chaque image de navigation ; `src/sculpt-lab-main.js` raccord uniquement `navigationTesting` ; `sculpt-lab.html` commandes de jeu, pas de mutation de scène ni d'asset généré.
- **Contrôles CI :** [source #39366098566](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39366098566) SUCCESS ; [checkpoint #39366227551](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39366227551) SUCCESS. Test réel Chromium : ciel hors carte pixels Matin `[135,169,200]`, Midi `[104,176,220]`, Soir `[55,69,114]`, Nuit `[8,21,41]`; 72 étoiles de nuit, aucune durant les trois modes de jour ; toggles étoiles, nuages et brume OK ; pixels mode édition et sérialisation JSON inchangés. Node/tests existants Buyer/Combat/terrain verts.
- **Publication :** [PR #179](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/179) fusionnée sur main `e55f9d08f28070b116961427eb6eb5cd4b7e517a`; [Pages #39366293530](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39366293530) en validation.
- **Lien test :** https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/sculpt-lab.html?v=41
- **Limites :** ambiance illustrative de fond sous la carte, pas encore un monde hors carte en géométrie 3D ; pas de météo/saisons ni gameplay brume, pas d'assets personnalisés. Le fond garde le même comportement aux angles 35–90°.
- **Statut :** prévalidation technique GREEN, confirmation visuelle utilisateur smartphone exigée.
