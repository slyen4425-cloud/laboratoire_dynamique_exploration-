# LAB_CURRENT_WORK — World Builder : assemblage visuel des mondes

Date : 2026-10-28
Branche : `work/exploration-world-assembler-2026-10-28`
Dernier code technique GREEN de référence : `ed2d7bc3a4fe31879a8cf0426c461b908015661d` (842 tests Node / Chromium, éditeur de rencontres et combat, preview V80 validée).
Checkpoint de départ créé **avant** modification : `checkpoint/exploration-start-world-assembler-2026-10-28` sur le SHA ci-dessus.
V80 stable : fichier et éditeur historiquement publiés laissés inchangés.

## Demande
Créer depuis Exploration un nouvel écran « World Builder », inspiré de la vue d'assemblage des salles du constructeur de donjon RPG : zones/instances reliées par passages, choix du point de départ, édition de chaque zone et export/import complet.

## Frontières et propriétaires
- Modèle canonique `WorldDocument v3` : zones `WorldArea`, spawns et `Portal`, événements et familles existantes. AUCUN format `WorldGraph` persistant ni deuxième topologie.
- Commands d'édition : `src/builder/world-builder-draft.js`, prolongé avec création/suppression protégée de WorldArea et liens via `addPortal`.
- Vue graphe : projection **purement visuelle** dérivée du même WorldDocument, aucun doublon de coordonnées de gameplay.
- Éditeur détaillé : `builder.html` via un handoff `WorldDocument` validé, à consommation unique, puis retour avec les changements. Pas de nouvelle logique de terrain, collisions ou de scènes.
- Sauvegarde locale : une seule copie exportable du document canonique via adapter dédié, jamais de format parallèle ; import/export JSON vérifiés.
- L'atelier sculpt 2,5D conserve son format expérimental indépendant : le raccord inter-éditeurs 2,5D sera une étape contractuelle distincte plutôt qu'une conversion cachée.
- Compétences, Creature Capture, Dungeon, PvP, V80 production restent inchangés.

## Travail prévu et critères de sortie
1. TDD RED : créer régions/instances, vrai Portal validé, retours, protection suppression/point initial, export/import identique, handoff détaillé.
2. Interface séparée mobile paysage : graphe de WorldAreas, liaisons, panneau d'édition de liaisons, bouton d'ouverture de l'éditeur détaillé, export/import, remise à zéro explicite.
3. E2E Chromium entrée depuis l'exploration, création, raccord, édition retour, rechargement et export.
4. CI `npm test` + `npm run check`, vérifications sans régressions Combat/Exploration, et site preview isolé. GREEN final seulement après test utilisateur mobile.
Prochain geste : implémenter les commandes canoniques puis construire l'UI dédiée et le contrat de transfert.
