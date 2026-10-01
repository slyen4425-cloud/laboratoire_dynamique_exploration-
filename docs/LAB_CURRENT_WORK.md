# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-01

## Chantier actif
Asset Pack Forêt v1 — premier raccord visuel Exploration.

## Branche
`work/exploration-asset-pack-forest-v1-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-asset-pack-forest-v1-2026-10-01`

## SHA de base
`afe258c0fbf33d17c5741267930a8915869fe85b`

## Dernier checkpoint GREEN
`checkpoint/exploration-asset-audit-green-2026-10-01`

## État gelé à préserver
- moteur déplacement X/Y ;
- config Phase 1A ;
- collisions ;
- caméra ;
- stick tactile ;
- architecture sentinels.

## Périmètre
- importer uniquement les 6 textures forêt retenues par l'audit ;
- les placer sous ownership Exploration ;
- conserver leur traçabilité source SHA/blob ;
- créer un Asset Adapter local par identifiants sémantiques ;
- utiliser ces textures uniquement pour le rendu du sol ;
- aucune collision dérivée de l'image ;
- aucune dépendance runtime au dépôt Zombicide-40k ;
- preview mobile ciblée.

## Propriétaires
- asset mapping : Exploration Asset Adapter ;
- rendu : Exploration Renderer ;
- monde/collision : inchangés.

## Fichiers runtime autorisés
- `src/assets/` ;
- `src/main.js` uniquement pour consommation du rendu sol ;
- éventuellement un module renderer dédié si nécessaire ;
- tests ;
- manifeste d'assets.

## Hors périmètre
- murs ;
- eau ;
- routes ;
- rivières ;
- ponts ;
- bâtiments ;
- modification du World Generator ;
- modification des collisions ;
- modification d'un autre dépôt.

## Tests requis
- tous les tests Phase 0/1A restent GREEN ;
- Asset Adapter résout les 6 variantes ;
- aucune URL inter-dépôt dans le runtime ;
- aucune référence `assets/dungeon/` dans `src/` ;
- CI GREEN ;
- preview mobile ;
- validation utilisateur du rendu.

## Risque
Visuel uniquement. Risque principal : performance/culling et répétition visible de texture.

## État technique
- 6 textures forêt importées localement et vérifiées par blob SHA ;
- Asset Adapter local actif ;
- terrain renderer avec culling actif ;
- aucune URL inter-dépôt dans le runtime ;
- aucune référence `assets/dungeon/` dans `src/` ;
- CI technique GREEN au SHA `8f5b2040a9ae49a398705c5f72f341990d0d3507` ;
- preview Pages déployée via main : run `36876722990` — SUCCESS ;
- infrastructure preview checkpoint : `checkpoint/exploration-preview-forest-v1-green-2026-10-01`.

## Test manuel requis
En attente de validation smartphone :
- sol forêt visible ;
- pas de fond cassé/écran blanc ;
- déplacement toujours fluide ;
- collisions inchangées ;
- caméra fluide ;
- répétition des textures acceptable pour ce premier prototype.

## Critère GREEN
Sol forêt visible en mobile sans modifier la fluidité ni les collisions.

Le checkpoint GREEN fonctionnel du pack ne sera créé qu'après validation utilisateur.
