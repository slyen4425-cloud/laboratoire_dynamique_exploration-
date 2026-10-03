# GenSrpG Exploration — Architecture cible

## Position dans GenSrpG

Le laboratoire prépare un sous-système de Monster Capture.

Cible future :

```text
GenSrpG Shell
   -> Capture runtime
      -> Capture Exploration
         -> Encounter Bridge
            -> Capture Combat
```

Exploration ne possède ni le Shell, ni les services Core partagés, ni le moteur Combat Capture.

## Flux monde / rendu

```text
World Generator ─┐
                 ├─> WorldDocument
World Builder Dynamique ──┘       |
                         v
                 World Surface Model
                         |
                    materialId
                         |
                         v
                  Material Registry
                         |
                         v
                    Asset Adapter
                         |
                         v
                      Renderer
```

Le même WorldDocument doit être utilisable par génération, édition, sauvegarde et runtime.

## Couches et propriétaires

### bootstrap
Installe explicitement le sous-système et ses adapters.
Pas d'auto-install caché.

### exploration-engine
Autorité sur :
- position ;
- vitesse ;
- mouvement ;
- état de déplacement.

Logique pure, sans DOM.

### collision-world
Autorité unique sur :
- obstacles ;
- volumes de collision ;
- résolution des déplacements bloqués.

### world-model
Source de vérité du monde runtime :
- dimensions ;
- biome ;
- zones ;
- objets ;
- entités ;
- spawns ;
- points d'intérêt ;
- passages ;
- Areas ;
- Portals.

### world-surface-model
Autorité sur la géométrie des surfaces :
- sol de base ;
- routes ;
- rivières ;
- futures zones/falaises/plages.

Une route/rivière est décrite par données X/Y, largeur et materialId.
Aucune texture ne définit la géométrie canonique.

### world-object-model
Autorité sur les objets placés :
- type d'objet ;
- transform X/Y/rotation/scale ;
- taille logique ;
- référence visuelle sémantique ;
- données de collision/interaction explicitement déclarées.

Premier objet : `bridge`.

Le renderer lit ce modèle mais ne le modifie pas.
Le Collision World peut lire les corridors traversables déclarés, mais n'infère jamais la collision depuis l'image.

### world-area-model
Cible future pour les espaces liés :
- `WorldArea` extérieure ou intérieure ;
- `currentAreaId` dans l'état Exploration ;
- objets/surface/collisions propres à chaque Area ;
- chargement/changement d'Area sans reload de page.

### portal-model
Cible future :
- relie une Area source à une Area cible ;
- source trigger/anchor ;
- targetAreaId ;
- targetSpawnId ;
- même contrat pour portes, escaliers, grottes et sorties.

### surface-traversal
Autorité pure sur la traversée des surfaces :
- lit la géométrie du World Surface Model ;
- lit `traversalRuleId` ;
- résout la règle dans Traversal Rule Registry ;
- lit le profil de locomotion de l'acteur ;
- retourne passabilité, mode retenu et multiplicateur.

Il ne lit jamais `materialId`.
Il ne modifie jamais la position.
Le mouvement final reste propriété de l'Exploration Engine et la collision statique reste propriété du Collision World.

### material-registry
Autorité sur l'apparence sémantique :
- matériaux de surface ;
- matériaux linéaires ;
- eau ;
- paramètres visuels ;
- transitions ;
- decals disponibles.

Il ne possède ni géométrie ni collision.

### world-generator
Produit un `world-model` / `WorldDocument` à partir de :
- seed ;
- configuration normalisée ;
- contraintes.

Le même couple seed/config doit produire le même résultat.

### camera
Transforme monde -> écran.
Ne modifie jamais la position logique.

### renderer
Affiche :
- World Surface Model ;
- matériaux résolus ;
- objets/décor ;
- entités.

Il ne recalcule pas le gameplay et ne modifie pas le WorldDocument.

### input-adapter
Transforme clavier/tactile/manette en intent de mouvement.
Ne déplace jamais directement l'entité.

### encounter-controller
Décide qu'une rencontre doit commencer à partir du monde Exploration.

Deux sources de rencontre sont prévues, sans double autorité :

1. **Rencontre aléatoire par famille de terrain** — cas ordinaire
   - la surface canonique porte un `terrainFamilyId` ;
   - la config rencontre possède une chance globale par famille ;
   - cette même config possède une répartition en pourcentages par élément Capture ;
   - le catalogue Capture fournit les créatures éligibles et leur `capture.spawnChance` intrinsèque ;
   - sortie : Encounter Intent.

2. **Rencontre avec acteur visible** — cas spécial
   - WildCreatureEntity / acteur explicitement placé ;
   - contact ou scénario explicite ;
   - sortie vers le même Encounter Intent.

Chaîne cible pour les rencontres ordinaires :

```text
position Exploration
  -> World Surface Resolver
  -> terrainFamilyId
  -> Terrain Family Encounter Config
  -> chance globale de rencontre
  -> pourcentage élément Capture
  -> CaptureDatabaseV1
  -> creature.capture.spawnChance
  -> Encounter Intent
  -> Encounter Bridge
```

Familles canoniques :
`plain / forest / sea / mountain / volcano / snow / road / sand`.

Exemple :
une famille Forêt peut définir 22 % de chance de rencontre, puis 50 % Nature, 20 % Terre, 10 % Eau, 10 % Feu, 10 % Ombre.
Après choix de l'élément, les créatures Capture compatibles restent pondérées par leur propre `spawnChance`.

Une Route sûre est simplement la famille `road` configurée à 0 % de rencontre.

Séparation obligatoire :
- `terrainFamilyId` = sémantique gameplay ;
- `materialId` = variante visuelle ;
- plusieurs textures peuvent appartenir à une même famille ;
- changer la texture ne change jamais la famille.

Interdictions :
- aucun Encounter Layer géométrique parallèle ;
- `materialId` ne détermine jamais le taux de rencontre ;
- une texture ne détermine jamais la famille au runtime ;
- Exploration ne duplique pas les créatures ni leur rareté ;
- le renderer ne déclenche aucune rencontre.

Les créatures visibles sont conservées pour les rencontres scénarisées, rares, boss, quêtes ou autres cas explicitement placés.

### encounter-bridge
Convertit l'état en `CaptureEncounterSnapshot v1`.
Reçoit `CaptureCombatResult v1`.
Aucun accès arbitraire aux internes du moteur Combat.

### world-builder-dynamique/data
Produit ou modifie un WorldDocument validé.

Le World Builder Dynamique peut :
- créer à la main ;
- ouvrir une carte générée ;
- déplacer des points ;
- changer largeur/materialId ;
- placer objets/zones ;
- sauvegarder.

Il ne devient jamais une autorité runtime.

### storage-adapter
Dans le laboratoire : interface isolée.
À l'intégration : délègue au Core storage GenSrpG.

### asset-adapter
Résout les fichiers physiques demandés par les Material Packs.

Dans le laboratoire : résolution locale contrôlée.
À l'intégration : délègue au resolver central GenSrpG.

## Material Pack v1

Un pack versionné peut fournir :

```text
MaterialPack
├─ materials
│  ├─ surface
│  ├─ path
│  └─ water
├─ transitions
├─ decals
└─ visual object references
```

Exemple :

```text
grass.forest
road.dirt
water.forest_stream
```

Un matériau peut déclarer :
- texture principale ;
- variantes ;
- textures/masks de bord ;
- decals ;
- densité ;
- échelle ;
- teinte ;
- animation visuelle ;
- fallback explicite.

## Géométrie vs matériau

Exemple :

```text
Route A
points = [...]
width = 82
materialId = road.dirt
```

Changer en :

```text
materialId = road.stone
```

ne change ni les points ni la largeur.

Même règle pour les rivières et zones de sol.

## Decals vs objets

Decal :
- purement visuel ;
- aucune collision ;
- aucune interaction.

Objet :
- position canonique ;
- peut avoir collision ;
- peut avoir interaction ;
- peut être persistant.

## Coordonnées

Autorité runtime :
```text
x: number
y: number
```

La grille est autorisée uniquement pour :
- génération ;
- spatial partitioning ;
- pathfinding interne ;
- culling/indexation.

Elle n'est jamais la position joueur canonique.

## Cycle de vie

Chaque composant temporaire doit être montable/démontable :

```text
install()
dispose()
status() // si utile
```

Après `dispose()`, aucun listener/timer/callback ne doit continuer à modifier le monde ou l'UI.

## Configuration

Les valeurs gameplay sont fournies par données normalisées.

Les valeurs visuelles éditables appartiennent au Material Registry/Pack.

Les valeurs codées dans un prototype ne sont que des défauts techniques de bootstrap et doivent sortir du moteur avant de devenir une règle éditable.

## Intégration future

Aucun fichier de ce dépôt ne sera copié aveuglément dans GenSrpG.

L'intégration devra :
1. auditer les propriétaires existants ;
2. mapper les adapters sur Core/Shell/Capture ;
3. conserver les tests sentinelles ;
4. introduire le sous-système par contrat public ;
5. remplacer l'Asset Adapter local par le resolver central ;
6. conserver les materialId sémantiques ;
7. retirer tout simulateur local devenu doublon.


## WorldObject / Bridge v1

Contrat cible :

```text
Bridge
├─ id
├─ kind = bridge
├─ transform
│  ├─ x
│  ├─ y
│  ├─ rotation
│  ├─ scaleX
│  └─ scaleY
├─ baseSize
│  ├─ length
│  └─ width
├─ visual
│  └─ assetId
└─ traversal
   ├─ enabled
   ├─ lengthRatio
   ├─ widthRatio
   └─ overridesObstacleIds[]
```

La taille traversable est dérivée de la taille logique et du transform.
Elle n'est jamais dérivée des pixels de l'asset.

Le scale X agit sur la longueur locale du pont.
Le scale Y agit sur sa largeur locale.

## Bâtiments et intérieurs

Cible validée :

```text
Area extérieure
   |
Building WorldObject
   |
Door / Portal
   |
Area intérieure
```

Le bâtiment extérieur et son intérieur sont deux responsabilités différentes :
- l'objet extérieur fournit présence/collision/porte ;
- l'Area intérieure contient son propre monde explorable.

Les étages réutilisent exactement le même mécanisme de Portal.

Ce modèle est préféré en v1 à un système général concurrent de toiture dynamique/seamless.


## World Builder Dynamique — contrat d'édition des WorldObjects

Le World Builder Dynamique édite les données normalisées du WorldDocument.

Pour un WorldObject compatible, l'éditeur doit pouvoir exposer :
- `transform.x/y` ;
- `transform.rotationDeg` ;
- `transform.scaleX/scaleY` ;
- `visual.assetId` ;
- footprint/taille logique ;
- propriétés d'interaction ;
- liens Portal lorsqu'ils existent.

Pour un Building WorldObject :
- le sprite extérieur ne définit pas la collision ;
- `doorAnchor` est exprimé en coordonnées locales du bâtiment ;
- le transform du bâtiment transforme aussi la position monde de ses anchors ;
- le Portal référence l'anchor et est l'unique autorité du lien entre Areas ;
- changer l'asset visuel ne doit pas modifier footprint ou anchor ;
- le Building ne stocke pas de `portalRefs` autoritaires : les liens vivent uniquement dans le Portal Model.


## WorldArea / Portal v1

Contrat :

```text
WorldDocument
├─ areas[]
│  ├─ id
│  ├─ kind: exterior | interior
│  ├─ width / height
│  ├─ surface
│  ├─ objects
│  ├─ actors[]
│  │  ├─ id
│  │  ├─ actorDefinitionId
│  │  ├─ x / y
│  │  └─ facingX
│  ├─ obstacles
│  └─ spawns[]
└─ portals[]
   ├─ id
   ├─ sourceAreaId
   ├─ trigger
   │  ├─ point
   │  └─ building-door
   ├─ targetAreaId
   └─ targetSpawnId
```

Le runtime conserve une seule position Exploration avec :
- `currentAreaId` ;
- `x/y`.

Une transition Portal remplace ces trois valeurs à partir d'un target Spawn explicite.
Aucune navigation de page n'est impliquée.

Pour un trigger `building-door`, le Portal Model résout le `doorAnchor` du Building.
Le Building ne contient aucune copie du lien vers le Portal.


## Map Actor Visual System v1

Un Map Actor est une **représentation visuelle** d'un acteur gameplay, pas une seconde entité.

Flux :

```text
visuel unique fourni
        |
Map Actor Asset Adapter
        |
Map Actor Visual Preparer
(trim/alpha/anchor)
        |
PreparedMapVisual cache
        |
Map Actor Renderer
        ^
        |
acteur gameplay (x/y/facing/moving)
```

### Accès aux modes de locomotion

Le Surface Traversal Resolver **ne donne jamais** à un acteur le droit de nager ou voler.

Chaîne cible :

```text
Actor/Capture gameplay capabilities
        ↓
capacité active / monture / effet autorisé
        ↓
profil de locomotion courant de l'acteur
        ↓
Surface Traversal Resolver
        ↓
passabilité + multiplicateur
```

Exemples :
- héros normal -> `ground` ;
- héros possédant/activant une monture volante -> `fly` tant que cette condition est valide ;
- créature aquatique ou capacité de nage -> `swim` ;
- effet retiré / monture quittée -> retour au profil autorisé par le gameplay.

Le laboratoire peut exposer Marche/Nage/Vol dans une UI de **test**, mais cette UI n'est pas une mécanique produit et ne doit jamais devenir l'autorité des capacités.

Le resolver consomme un profil de locomotion ; il ne possède ni inventaire, ni créatures possédées, ni compétences, ni montures.

Le Map Actor Renderer peut appliquer :
- ombre ;
- miroir horizontal ;
- idle ;
- bounce de marche ;
- scale visuel.

Il ne peut jamais :
- écrire x/y ;
- définir la collision ;
- modifier les stats ;
- déclencher l'IA ;
- posséder une interaction.

Le mode simple requiert seulement un asset visuel.
Les modes multi-vues ou animés pourront étendre le contrat sans remplacer cette base.

### Orientation native du visuel

`MapActorVisual` déclare l'orientation native de l'image :
- `sourceFacingX = 1` : le visuel regarde naturellement à droite ;
- `sourceFacingX = -1` : le visuel regarde naturellement à gauche.

Le sens réel de déplacement reste `actor.facingX`, propriété de l'état gameplay.
Le renderer applique un miroir seulement lorsque le sens voulu diffère de l'orientation native.

Il ne déduit jamais cette orientation depuis les pixels et ne modifie jamais `facingX`.

### Séparation authoring acteur / placement Builder

Les réglages intrinsèques du `MapActorVisual` appartiennent à l'éditeur Héros/PNJ/Créatures, pas au World Builder final.

Chaîne cible :

```text
Éditeur Héros/Créatures
        ↓
Actor Definition + MapActorVisual
        ↓
Actor Catalog
        ↓
World Builder sélectionne actorDefinitionId
        ↓
placement/référence dans WorldDocument
        ↓
runtime Exploration
```

Le World Builder final ne duplique pas :
- sourceFacingX ;
- targetHeight ;
- anchor ;
- ombre ;
- paramètres de mouvement visuel ;
- configuration de miroir.

Le banc de calibration Map Actor a été retiré du World Builder produit.

Le contrat de placement canonique est désormais :

```text
WorldArea.actors[]
  -> id
  -> actorDefinitionId
  -> x / y
  -> facingX
```

Il est interdit d'y sérialiser :
- assetId ;
- MapActorVisual ;
- targetHeight ;
- sourceFacingX ;
- anchor ;
- ombre ;
- animation/motion ;
- stats, compétences ou données Capture.

Au rendu, `actorDefinitionId` est résolu par l'Actor Catalog. La définition fournit son `MapActorVisual`, puis l'Asset Adapter résout l'asset physique. Builder et runtime utilisent exactement cette même chaîne.

Pour une créature Capture :

```text
WorldArea.actors[].actorDefinitionId
        ↓
Capture Actor Definition provider
        ↓
Capture creature presentation.assetId
        ↓
Global Visual Asset Catalog
        ↓
MapActorVisual dérivé
        ↓
Map Actor Visual Preparer
        ↓
Map Actor Renderer
```

Le World Builder ne connaît donc jamais le chemin physique d'un visuel Capture.

## World Builder Dynamique UI v1

Le Builder est une surface d'édition séparée du runtime Exploration.

Flux :

```text
builder.html
   -> World Builder UI
   -> mutable draft WorldDocument
   -> validation via les modèles canoniques
   -> WorldDocument v1
   -> export JSON / import JSON / preview
```

Règles :
- aucun format `BuilderMap` ;
- le draft n'est pas une autorité runtime ;
- le Builder ne déplace jamais le joueur actif ;
- le Builder ne possède ni collision, ni mouvement, ni Portal runtime ;
- la preview réutilise les Surface / WorldObject / Portal Renderers existants ;
- les données éditées restent celles de WorldArea, WorldObject, Spawn et Portal ;
- l'export est un WorldDocument v1 normalisé ;
- une référence invalide bloque l'export au lieu d'être supprimée silencieusement.

### Périmètre UI v1

Édition disponible :
- WorldArea : largeur / hauteur / matériau de base ;
- Spawns : X/Y, ajout et suppression protégée ;
- WorldObjects : ajout, duplication, suppression protégée, transform, assetId ;
- Building : baseSize, footprint, doorAnchor ;
- Bridge : baseSize, corridor traversable, obstacles explicitement franchis ;
- Portals : Area source, trigger point/building-door, Area cible, Spawn cible, marqueur visuel ;
- import/export JSON.

La création graphique de routes/rivières et l'import de Map Actors restent des lots séparés.


## World Builder Dynamique — manipulation directe

Les contrôles directs restent des adapters d'édition du WorldDocument.

Chaîne unique :
```text
geste / poignée / pinceau
        ↓
World Builder Draft helper
        ↓
draft WorldDocument
        ↓
normalizeWorldDocument
        ↓
preview renderer
```

Les poignées de déplacement, scale et rotation ne possèdent jamais un transform parallèle.
Elles écrivent dans `WorldObject.transform`.

La poignée de taille d'Area écrit uniquement dans `WorldArea.width/height`.

### Zones de terrain peintes

Le pinceau paysage écrit directement dans :

```text
WorldArea.surface.zones[]
```

Chaque zone v1 contient :
- id ;
- materialId de kind `surface` ;
- largeur/diamètre ;
- points X/Y du trait.

Le Surface Renderer lit ces zones directement.
Les zones sont purement visuelles et ne deviennent jamais collision ou gameplay.
Routes et rivières restent leurs contrats linéaires existants.


### Spawn ancré à un Building

Pour les retours liés à un objet transformable :

```text
Building transform + doorAnchor
              ↓
      Anchored WorldArea Spawn
              ↓
        Portal targetSpawnId
              ↓
      Exploration position X/Y
```

Le Spawn ancré ne stocke pas de X/Y concurrent.
Il stocke :
- `anchor.kind = building-door` ;
- `objectId` ;
- `anchorId` ;
- `offset`.

La résolution de la position monde est pure et se fait depuis le WorldDocument courant.
Le World Builder Dynamique déplace uniquement le Building ; il ne répare ni ne synchronise le Spawn.
