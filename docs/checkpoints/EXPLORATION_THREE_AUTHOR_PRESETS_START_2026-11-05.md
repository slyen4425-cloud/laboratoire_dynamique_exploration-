# Exploration — cartes auteur Forêt 1 / Plaine 1 / Neige 1 — START

- Base officielle : main@35ea92710dfdee8e5a00e46776d69d64def6b54c, après fusion des moulins/éoliennes #376.
- PR : #378, branche work/exploration-three-author-presets-2026-11-05; aucun changement GenSRPG, Combat ou Dungeon.
- Sources Forêt 1 et Plaine 1 : données exactes issues de PR #337, commit c4d084ad1cb4f807e34c084d3d32f44ddc9ad270; 80×60.
- Neige 1 : fichier utilisateur `neige-1.map-preset.json` fourni le 05/11, 80×64, 2 zones de surface, 5 routes, 0 objets.
- Catalogue natif : IDs 109,110,111; suppression de l'affichage des démos 101–108, sans écraser les WorldDocuments personnels ni les bibliothèques utilisateur.
- Les scènes restent des données dans la bibliothèque existante, sans autorité de Portals/Spawns parallèle.
- Vérifier l'instanciation WorldArea, les chemins, le retour au World Builder, le chargement navigateur en vraie publication HTTPS.
- NON GREEN tant que CI 3/3, navigateur, publication Pages main et recette PC ne sont pas confirmés.
