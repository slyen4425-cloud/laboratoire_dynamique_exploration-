# START — Pages isolated legacy compatible map navigation

Date : 2026-10-28
Base Pages : main `ee315ddedf5bad1cd796745d8274792bda0ae987` (dernier workflow Pages vérifié).
START : `checkpoint/exploration-start-world-map-legacy-navigation-pages-2026-10-28` (SHA exact du main de départ).
Branche : `work/exploration-world-map-legacy-navigation-pages-2026-10-28`.

## Portée et autorité
- Publier seulement la source Exploration du lot `world-map-legacy-compatible-navigation` : `32e38b07227a7e85426fa64fc15fdb1a81416ad0`, CI Core + Combat + navigateur GREEN [#40765978145](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/40765978145).
- Conserver l'unique publisher GitHub Pages `.github/workflows/publish-v81-main.yml`.
- Assembler la source sous `preview/encounters-v80/`, exactement comme la prévisualisation précédente.
- V80 production immuable : `933c852c41c4511cb0eed0717c246cc6b19aeddc`; comparer octet par octet comme le workflow actuel.
- Portals, encounters, dimensions de la WorldArea 2400×1600, Combat et tous les assets protégés inchangés.

## Gates
- Workflow pull_request : `npm test`, `npm run check`, audit Combat, Chromium paysage réel, nouveau scénario `GREEN legacy Map tab`, contrôle du retour tactile et présets maison, source V80 vérifiée.
- Pas de déploiement sur PR ; attendre workflow vert, puis merger pour déploiement isolé.
- Après merge : `deploy-pages`, HTTPS cible et assets vérifiés avant publication du lien utilisateur.
- PR fonctionnalité #285 demeure DRAFT jusqu'au test manuel Android.
