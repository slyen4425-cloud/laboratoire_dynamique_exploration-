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
| Policy rencontre aléatoire Area | World Area Model | kind + override explicite | encounters.randomEnabled | texture/terrain/renderer décide si le random est autorisé |
| Portals | Portal Model | trigger + cible | changement d'Area intent | location.reload / navigation sauvage |
| Géométrie surface | World Surface Model | WorldDocument | base/zones/routes/rivières | texture définit géométrie |
| Famille terrain | World Surface Model | terrainFamilyId explicite | sémantique terrain gameplay | Material Registry/texture déduit la famille |
| Autorisation locomotion | Capture/Actor gameplay (futur) | compétences, créatures possédées, monture, effets | profil locomotion autorisé | Traversal/UI accorde swim/fly |
| Traversée surface | Surface Traversal Resolver | géométrie + traversalRuleId + locomotion autorisée | passabilité + multiplicateur | accorder une capacité / Material Registry/renderer décide gameplay |
| Matériaux | Material Registry | materialId + pack | description visuelle | matériau possède collision |
| Assets physiques | Asset Adapter / Core Resolver futur | asset ids | URL/resource | chemins inter-module sauvages |
| Génération | World Generator | seed + config | WorldDocument | renderer génère des règles |
| Caméra | Camera | position + viewport | transform écran | caméra écrit position monde |
| Rendu | Renderer | world + materials + camera | pixels | calcul gameplay |
| Visuel Map Actor | Map Actor Visual Model | assetId + réglages visuels | contrat visuel | posséder x/y/collision/stats |
| Préparation Map Actor | Map Actor Visual Preparer | image source | visuel préparé | modifier gameplay |
| Rendu Map Actor | Map Actor Renderer | état acteur + visuel préparé + camera | pixels | écrire état acteur |
| Authoring profil acteur | Éditeur Héros/PNJ/Créatures (futur, hors World Builder) | asset + réglages visuels | définition acteur / MapActorVisual | posséder placement monde |
| Placement acteur | World Builder / World Model | actorDefinitionId + placement | référence placée dans WorldDocument | éditer/copier le profil visuel intrinsèque |
| Input | Input Adapter | tactile/clavier | intent normalisé | déplacement direct |
| Config rencontre famille | Terrain Family Encounter Config | terrainFamilyId + chance + pourcentages élémentaires | règles par famille | créer géométrie Encounter parallèle |
| Résolution famille locale | Terrain Family Resolver | World Surface + position | terrainFamilyId | lire materialId comme gameplay |
| Catalogue créatures Capture | CaptureDatabaseV1 / provider lecture seule | id + elements + capture.spawnChance | candidats/rareté | Exploration recrée le catalogue |
| Sélection créature rencontre | Terrain Family Encounter Resolver | famille + config + Capture catalog | creatureId canonique | copier stats/visuels/rareté dans le monde |
| Déclenchement rencontre | Encounter Controller | position + résolution famille + acteur visible optionnel | encounter intent | renderer/Combat décide le monde |
| Raccord combat | Encounter Bridge | encounter state | Snapshot/Result | accès arbitraire aux internes |
| Combat Capture | Capture Combat (futur) | Snapshot | Result | Exploration calcule le combat |
| World Builder Dynamique | Editor/Data | WorldDocument | document validé | modifier runtime actif |\n| Draft World Builder | World Builder Draft Model | WorldDocument source + edits | draft sérialisable | devenir état runtime / posséder renderer |\n| Preview Builder | Renderers Exploration existants | draft normalisé + caméra preview | pixels | écrire données/collision/mouvement |
| Navigation Area Builder | Builder UI (projection lecture seule) | WorldArea active + Building sélectionné + Portals canoniques | intent de sélection selectedAreaId | stocker un lien parallèle, écrire Portal/WorldArea, dupliquer les coordonnées |
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

## Extensions d'authoring

Les futurs éditeurs suivent la séparation définie dans
`LAB_MODULAR_AUTHORING_ARCHITECTURE_V1.md`.

| Responsabilité | Propriétaire cible | Entrées | Sorties | Interdictions |
|---|---|---|---|---|
| Définition WorldObject | Object Definition Editor / Object Catalog | données intrinsèques objet | ObjectDefinition versionnée | posséder placement monde |
| Placement WorldObject | World Builder / WorldDocument | objectDefinitionId + transform + overrides autorisés | placement dans le niveau | recopier la définition complète |
| Règles générales Capture | Capture Rules Authority | configuration créateur | règles XP/loot/capture/progression | World Builder ou Combat possèdent ces règles |
| Composition monde global future | World Editor | références niveaux/mondes | WorldDocument global/versionné futur | réécrire géométrie interne des niveaux |
| Composition campagne future | Campaign Editor | références mondes/niveaux/quêtes/règles | CampaignDocument versionné futur | devenir propriétaire des ressources référencées |

Tout nouvel éditeur doit être classé comme producteur de **définitions** ou de **composition par références** avant implémentation.
