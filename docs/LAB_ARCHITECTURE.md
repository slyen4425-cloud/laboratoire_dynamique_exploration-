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
