# Contrat audio Exploration v1 — sans son intégré

## Objectif validé
Un jeu possède une bande-son indépendante par `projectId`, mais toutes les musiques / ambiances peuvent être choisies depuis une bibliothèque commune. Exploration sélectionne une scène de musique par Area ou famille de terrain, et demande une transition vers Combat à l'entrée d'une rencontre, puis un retour après Combat. Hors Shell et menus.

## Ownership et isolation
- Fichier propriétaire de la passerelle : `src/adapters/exploration-soundtrack-intents-v1.js`.
- API `createExplorationSoundtrackIntentsV1({projectId,battleSceneId,sceneForArea})` renvoie des intentions JSON versionnées : `enterArea`, `beginEncounter`, `endEncounter`, `leaveWorld`.
- `sceneForArea` reçoit seulement `{areaId,terrainFamilyId}`; l'éditeur/contrat futur fournira la configuration : aucune musique ne dépend directement du `materialId` ou du graphisme.
- Le moteur Exploration ne charge **aucune** implémentation du labo Combat et ne lit aucun fichier audio. `SoundtrackSession` externe sera propriétaire de `music` et `ambience` après raccord dédié.
- Même `returnToken` logique de musique consommé une fois, indépendant de la mécanique canonique du `CaptureCombatResult`. La passerelle musicale ne décide jamais des résultats du combat.

## Garanties
- Aucun changement aux positions, collision, caméra, traversées de pont ou relief V62, Builder, WorldDocument, gameplay ni CSS.
- Un changement d'Area pendant un combat nécessite d'attendre le retour, aucune modification du monde en arrière-plan.
- Configurations sans musique : `sceneId:null` est une transition vers silence.
- Son de vitrine, import utilisateur et moteur navigateur à fournir dans des lots ultérieurs ; aucune exposition du dépôt audio privé.

## Validation
Tests purs `tests/exploration-soundtrack-intents-v1.test.mjs` ; suite Node complète + CI. Ce lot fournit le **contrat de raccord**, pas encore la lecture de musique en situation de jeu. Un futur lot UI configurera les associations Area/biome, avec test Android.
