# GenSrpG Exploration — Matrice de propriétaires

| Responsabilité | Propriétaire cible | Entrées | Sorties | Interdictions |
|---|---|---|---|---|
| Navigation GenSrpG | Shell principal (futur) | intent | vue active | Exploration force une vue globale |
| Session Capture | Capture runtime (futur) | profil/monde | contexte Capture | Exploration devient racine du module |
| Position/mouvement | Exploration Engine | intent + dt + world | position/velocity | input/renderer écrit x/y |
| Collision | Collision World | trajectoire + obstacles | mouvement autorisé | renderer possède collision |
| Monde runtime | World Model | document généré/chargé | état monde | UI duplique l'état |
| Génération | World Generator | seed + config | WorldDocument | renderer génère des règles |
| Caméra | Camera | position + viewport | transform écran | caméra écrit position monde |
| Rendu | Renderer | world + camera | pixels | calcul gameplay |
| Input | Input Adapter | tactile/clavier | intent normalisé | déplacement direct |
| Rencontre | Encounter Controller | world + entités | encounter intent | Combat décide le monde |
| Raccord combat | Encounter Bridge | encounter state | Snapshot/Result | accès arbitraire aux internes |
| Combat Capture | Capture Combat (futur) | Snapshot | Result | Exploration calcule le combat |
| Builder | Editor/Data | données utilisateur | documents validés | modifier runtime actif |
| Stockage | Core Storage (futur) | document versionné | persisted data | stockage dispersé |
| Assets | Core Asset Resolver (futur) | asset id/context | URL/resource | fallback inter-module |
| Cache PWA | Service worker | version/assets | cache | logique gameplay |

## Règle

Si une nouvelle fonction ne rentre pas clairement dans une ligne, ne pas coder avant d'avoir défini son propriétaire.

## Phase laboratoire

Les services Core absents peuvent être simulés localement uniquement via adapter clairement nommé.

Lors de l'intégration GenSrpG, le simulateur doit être retiré ou remplacé dans le même chantier de raccord afin d'éviter deux autorités.
