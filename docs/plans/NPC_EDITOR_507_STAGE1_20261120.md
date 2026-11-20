# START — Éditeur de PNJ canonique (Exploration #507 / #408)

Date : 2026-11-20
Source immuable : `main@2cb75a601cadcd26d33ffdd093a07badaaa9e86f`
Branche isolée : `work/exploration-npc-editor-507-v1-20261120`

## Domaine et propriétaires
- Exploration Actor Definition Editor : définitions PNJ versionnées, médias PNG/WebP persistants dans IndexedDB (stockage PNJ dédié, héros inchangés).
- World Builder / WorldDocument : emplacement `actorDefinitionId`, X/Y, orientation et échelle d'instance. Ne reçoit jamais les Blobs.
- `MapActorRenderer` / `ImageAssetLoader` / `MapActorVisualPreparer` : présentation existante.
- `map-actor-npc-settings-v1`, `npc-wander-runtime-v1`, Collision World et Encounter Bridge : comportements déjà implantés, aucune deuxième boucle ni moteur.
- Capture/Combat/Items : conservent les équipes, monstres, boutiques, récompenses et combats.

## Lots
1. Contrat strict, persistance, éditeur autonome et prévisualisation réelle ; tests de validation et roundtrip.
2. Bibliothèque visuelle dans la palette Acteurs Sculpt 2,5D ; placements par références + projection runtime des comportements PNJ ; migration additive sans effacer les fiches héritées.
3. Lots séparés ultérieurs : patrouilles, quêtes complexes, boss scénarisés, raccord des sélecteurs externes et tests mobiles de jeu réel.

Gels : héros, V80, WorldDocument, sauvegardes historiques, texture/relief, PWA, moteur Combat, assets officiels. La PR doit rester en brouillon jusqu'aux CI, navigateur réel et validation utilisateur. Aucun déploiement PWA automatique.
