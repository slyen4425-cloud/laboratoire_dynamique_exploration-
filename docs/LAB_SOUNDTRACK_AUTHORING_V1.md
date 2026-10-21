# GenSrpG Exploration — associations de bandes-son par Area / terrain v1

Date : 21 octobre 2026. Base du lot : `checkpoint/exploration-soundtrack-bridge-v1-technical-green-2026-10-21@788e5e4` (V62 + adaptateur de scène, CI technique), checkpoint de départ `checkpoint/exploration-start-soundtrack-authoring-v1-2026-10-21`, branche `work/exploration-soundtrack-authoring-v1-2026-10-21`.

## Place architecturale
Le World Builder ne doit pas posséder ni dupliquer les pistes, le catalogue ou le lecteur musical. Il produit seulement des références de scènes, séparées du `WorldDocument`.
`ExplorationSoundtrackBindingsV1` (`src/adapters/exploration-soundtrack-bindings-v1.js`) stocke :
- `projectId` : doit être identique à l'identifiant du `SoundtrackProjectV1` commun ;
- `defaultSceneId` : ambiance d'exploration par défaut ou silence `null` ;
- `combatSceneId` : scène au démarrage du combat ;
- `areaScenes` : dictionnaire d'Area `areaId → sceneId` ;
- `terrainFamilyScenes` : `terrainFamilyId → sceneId`.
Aucune URL, fichier audio, compétence, collision ou donnée de géométrie.

## Priorité de résolution
`areaScenes[areaId]` si explicite ; sinon `terrainFamilyScenes[terrainFamilyId]` ; sinon `defaultSceneId`. L'option Combat n'a pas priorité sur les zones, elle s'applique **seulement** pendant une rencontre. `createExplorationSoundtrackContextV1` convertit les bindings validés en entrées du seul `createExplorationSoundtrackIntentsV1`, propriétaire de l'entrée/sortie de scène et du token de restauration. Les canaux musiques/ambiances/fondus sont gérés en dehors d'Exploration par la session commune.

## Édition mobile
Onglet « Musiques » ajouté au `builder.html`, sans changement de `src/builder/world-builder-main.js`. La navigation native `data-tab/data-panel` le reconnaît automatiquement. Module séparé `src/ui/exploration-soundtrack-editor-v1.js` monté explicitement dans la même page.
Le créateur saisit identifiant de jeu, contexte global/Area/terrain/rencontre et `sceneId`, peut remplir l'Area depuis le sélecteur courant, retirer un override, prévisualiser la résolution des IDs, créer un autre jeu et exporter/importer des bindings JSON sans aucun audio physique.

## Limites explicites
- Ce lot **n'écrit pas de configuration musicale dans la carte** : les associations audio s'exportent séparément. Ne pas affecter les sauvegardes WorldDocument existantes.
- Aucun son de vitrine tant que le créateur n'a pas fourni les pistes et le statut de redistribution.
- Aucun second lecteur n'est instancié et aucune copie du dépôt Combat n'est faite. Le vrai runtime Exploration sera relié au gestionnaire partagé dans un **lot de raccord ultérieur** documenté et testé.
- Le Builder V62 conserve ses ponts/arrondis/roches, sans garantie esthétique Pixel autre que la validation future de l'auteur.
- L'intégration aux menus GenSrpG principal reste hors périmètre.

## Sentinelles
`tests/exploration-soundtrack-authoring-v1.test.mjs` vérifie priorité Area/terrain/défaut, isolation projet, roundtrip, validation et passage contrat Encounter. CI Node et navigateur avant validation technique ; UX Android par l'auteur distincte avant publication Pages.
