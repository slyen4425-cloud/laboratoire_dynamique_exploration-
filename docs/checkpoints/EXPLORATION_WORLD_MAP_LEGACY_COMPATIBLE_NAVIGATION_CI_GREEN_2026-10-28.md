# Exploration World/Map legacy-compatible navigation — CI GREEN

Date : 2026-10-28

- Branche source : `work/exploration-world-map-legacy-compatible-navigation-2026-10-28`
- SHA **exact** testé : `32e38b07227a7e85426fa64fc15fdb1a81416ad0`
- Checkpoint de départ : `checkpoint/exploration-start-world-map-legacy-compatible-navigation-2026-10-28`
- Checkpoint CI GREEN : `checkpoint/exploration-world-map-legacy-compatible-navigation-ci-green-2026-10-28`
- CI vérifiée : [Actions #40765978145](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/40765978145) : `core-tests` **success**, `modern-combat-encounter` **success**.
- TDD RED : [Actions #40765460188](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/40765460188) : régression reproduite avant l'export du résolveur.
- Tests : `npm test`, `npm run check`, audits Combat/Capture, vrai Chromium paysage (`smoke-sculpt-terrain-lab.mjs`, passage par le vrai `Carte 2,5D`, dialogue natif, Handoff autoritatif, carte 2400×1600 préservée), test du retour tactile de la carte historique, régression des intérieurs maisons, Encounter startup.
- Périmètre : sélection de la bonne WorldArea existante, sans mutation du WorldDocument, taille, Portal, Spawn, ou des rencontres. Le 2D historique demeure.
- Gel : production V80 immuable, aucun merge GenSrpg, aucune nouvelle autorité.
- Validation utilisateur : **encore requise sur Pixel** (lien de preview Pages isolée à publier avant clôture fonctionnelle). Le lot reste en PR brouillon et n'est **pas déclaré livré** avant ce test.
- Régressions connues : aucune dans les gates automatiques. Limite >80×64 cellules toujours non supportée volontairement.
- Suite autorisée : lot Pages isolé épinglant précisément ce SHA GREEN, sans overlay V80, et contrôle HTTP réel.
