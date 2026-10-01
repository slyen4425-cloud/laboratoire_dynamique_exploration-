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
Builder manuel ──┘       |
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
- passages.

### world-surface-model
Autorité sur la géométrie des surfaces :
- sol de base ;
- routes ;
- rivières ;
- futures zones/falaises/plages.

Une route/rivière est décrite par données X/Y, largeur et materialId.
Aucune texture ne définit la géométrie canonique.

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

### builder/data
Produit ou modifie un WorldDocument validé.

Le Builder peut :
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
