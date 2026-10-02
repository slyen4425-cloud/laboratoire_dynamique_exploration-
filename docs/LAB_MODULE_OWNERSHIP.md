# GenSrpG Exploration — Matrice de propriétaires

| Responsabilité | Propriétaire cible | Entrées | Sorties | Interdictions |
|---|---|---|---|---|
| Navigation GenSrpG | Shell principal (futur) | intent | vue active | Exploration force une vue globale |
| Session Capture | Capture runtime (futur) | profil/monde | contexte Capture | Exploration devient racine du module |
| Position/mouvement | Exploration Engine | intent + dt + world | position/velocity | input/renderer écrit x/y |
| Collision | Collision World | trajectoire + obstacles | mouvement autorisé | renderer possède collision |
| Monde runtime | World Model | document généré/chargé | état monde | UI duplique l'état |
| Objets placés | World Object Model | données objet | transform/footprint/interaction | renderer possède transform |
| Area active | World Area Model | areaId | contenu Area | Shell/renderer invente l'Area |
| Portals | Portal Model | trigger + cible | changement d'Area intent | location.reload / navigation sauvage |
| Géométrie surface | World Surface Model | WorldDocument | base/routes/rivières | texture définit géométrie |
| Traversée surface | Surface Traversal Resolver | géométrie + traversalRuleId + locomotion | passabilité + multiplicateur | Material Registry/renderer décide gameplay |
| Matériaux | Material Registry | materialId + pack | description visuelle | matériau possède collision |
| Assets physiques | Asset Adapter / Core Resolver futur | asset ids | URL/resource | chemins inter-module sauvages |
| Génération | World Generator | seed + config | WorldDocument | renderer génère des règles |
| Caméra | Camera | position + viewport | transform écran | caméra écrit position monde |
| Rendu | Renderer | world + materials + camera | pixels | calcul gameplay |
| Input | Input Adapter | tactile/clavier | intent normalisé | déplacement direct |
| Rencontre | Encounter Controller | world + entités | encounter intent | Combat décide le monde |
| Raccord combat | Encounter Bridge | encounter state | Snapshot/Result | accès arbitraire aux internes |
| Combat Capture | Capture Combat (futur) | Snapshot | Result | Exploration calcule le combat |
| World Builder Dynamique | Editor/Data | WorldDocument | document validé | modifier runtime actif |
| Stockage | Core Storage (futur) | document versionné | persisted data | stockage dispersé |
| Cache PWA | Service worker | version/assets | cache | logique gameplay |

## Règle

Si une nouvelle fonction ne rentre pas clairement dans une ligne, ne pas coder avant d'avoir défini son propriétaire.

## World Builder Dynamique et Generator

Le World Builder Dynamique et le World Generator sont deux **producteurs du même WorldDocument**.

Ils n'ont pas le droit de produire deux formats de carte concurrents.

## Material Registry

Le Material Registry possède uniquement l'apparence :
- matériaux ;
- transitions ;
- decals disponibles ;
- paramètres visuels.

Il ne possède jamais :
- géométrie ;
- collisions ;
- règles de spawn ;
- interactions ;
- état de partie.

## Phase laboratoire

Les services Core absents peuvent être simulés localement uniquement via adapter clairement nommé.

Lors de l'intégration GenSrpG, le simulateur doit être retiré ou remplacé dans le même chantier de raccord afin d'éviter deux autorités.
