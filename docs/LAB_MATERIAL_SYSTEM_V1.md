# GenSrpG Exploration — Material System v1

Date : 2026-10-01

## But

Permettre de personnaliser fortement l'apparence du monde sans coupler :
- géométrie ;
- textures ;
- collisions ;
- gameplay ;
- Builder ;
- génération procédurale.

## Chaîne d'autorité

```text
WorldDocument
  -> surface geometry
  -> materialId
  -> Material Registry
  -> Material definition
  -> Asset Adapter
  -> Renderer
```

## Principe fondamental

Le WorldDocument dit **quoi et où**.
Le matériau dit **comment ça doit paraître**.

Exemple :

```text
route:
  points: [...]
  width: 82
  materialId: road.dirt
```

Changer uniquement :

```text
materialId: road.stone
```

doit conserver exactement :
- points ;
- longueur ;
- largeur ;
- collisions éventuelles ;
- logique de rencontre ;
- position des objets.

## MaterialPack v1

Structure cible :

```json
{
  "schemaVersion": 1,
  "id": "forest-core",
  "materials": [],
  "transitions": [],
  "decals": []
}
```

## Material v1

Champs communs :

```json
{
  "id": "road.dirt",
  "kind": "path",
  "label": "Chemin de terre",
  "base": {},
  "variants": [],
  "edge": {},
  "decals": {},
  "render": {}
}
```

### kind

Valeurs prévues :
- `surface` : sol large, herbe/neige/sable ;
- `path` : route/chemin ;
- `water` : rivière/lac/ruisseau ;
- futurs types uniquement si leur propriétaire est clair.

## Références d'assets

Un matériau peut référencer des asset ids sémantiques :

```text
texture.grass.forest.base.01
texture.grass.forest.base.02
texture.road.dirt.center.01
transition.road.dirt_to_grass_forest.edge.01
texture.water.forest_stream.center.01
transition.water.forest_stream_to_grass_forest.bank.01
decal.forest.leaves.01
decal.forest.roots.01
```

Le Material Registry ne connaît pas forcément l'URL physique.
L'Asset Adapter fait cette résolution.

## Base / texture principale

Paramètres possibles :
- `assetId` ;
- `scale` ;
- `repeat` ;
- `opacity` ;
- `tint` ;
- `rotationPolicy`.

Si aucun asset n'est disponible, un fallback procédural explicite peut être défini pour le laboratoire.

## Variantes

But :
éviter la répétition artificielle.

Exemple :
- base 01 ;
- base 02 ;
- base 03.

La sélection doit être déterministe pour un même monde/seed.

## Bords / edge

Utilisé pour :
- route -> herbe ;
- rivière -> berge ;
- sable -> herbe ;
- neige -> roche.

Le bord peut utiliser :
- asset dédié ;
- masque ;
- largeur ;
- teinte ;
- bruit procédural léger.

La géométrie du bord vient toujours de la géométrie source, jamais d'une tuile imposée.

## Transitions

Une transition décrit la rencontre entre deux matériaux.

Exemple cible :

```text
from: grass.forest
to: road.dirt
transition: road.dirt_to_grass
```

Le renderer calcule l'apparence à partir de la frontière réelle.


### Surface Feather v1

Pour les zones de sol peintes `WorldArea.surface.zones[]`, le pack peut déclarer une politique générique :

```js
surfaceTransition: {
  mode: 'feather',
  widthRatio: 0.18,
  minWidth: 6,
  maxWidth: 64,
  steps: 7,
  edgeOpacity: 0.08
}
```

Cette politique appartient au Material Pack / Material Registry.

Règles :
- la largeur canonique `zone.width` ne change jamais ;
- le feather est calculé vers l'intérieur de cette largeur ;
- aucune bande, zone ou géométrie de transition n'est sérialisée ;
- le renderer dessine plusieurs passes imbriquées du matériau de la zone ;
- le bord reste partiellement transparent afin de laisser voir le matériau déjà rendu dessous ;
- le cœur devient opaque ;
- l'ordre canonique des `surface.zones[]` reste l'ordre de composition ;
- un pack sans politique explicite reçoit `{ mode: 'none' }` et conserve le rendu historique opaque en une passe.

Ce mécanisme est générique surface → surface. Les transitions dédiées route/herbe et eau/berge du lot `transition-decals-v1` restent indépendantes et inchangées.

Les paramètres sont visuels uniquement : ils ne changent ni `terrainFamilyId`, ni `traversalRuleId`, ni collision, ni gameplay.

## Decals

Exemples :
- feuille ;
- fleur ;
- racine ;
- caillou ;
- boue ;
- trace ;
- fissure.

Propriétés :
- asset ids ;
- densité ;
- échelle min/max ;
- rotation ;
- opacité ;
- règles de placement visuel.

Un decal n'a jamais collision/interactions.

Si un élément devient gameplay, il doit être promu en objet World Model.

## Objets

Exemples :
- arbre ;
- gros rocher ;
- pont ;
- maison ;
- clôture.

Ils ne sont pas des matériaux.

Ils peuvent avoir :
- sprite/model ;
- position ;
- collision ;
- interaction ;
- état persistant.

## Eau

Un matériau `water` peut déclarer :
- centre ;
- bord/berge ;
- reflets ;
- transparence ;
- vitesse visuelle ;
- animation ;
- decals de rive.

La traversabilité reste une donnée gameplay/collision séparée.

## Personnalisation Builder

Le Builder doit pouvoir exposer progressivement :

### Carte
- taille ;
- biome ;
- matériau de base.

### Route
- ajouter/supprimer ;
- points ;
- courbure via points ;
- largeur ;
- materialId ;
- paramètres visuels autorisés.

### Rivière
- ajouter/supprimer ;
- points ;
- largeur ;
- materialId ;
- paramètres visuels autorisés.

### Décor
- densité decals ;
- objets ;
- végétation ;
- points d'intérêt.

### Génération
Le générateur peut recevoir des contraintes :
- nombre de routes ;
- sinuosité ;
- nombre de rivières ;
- ponts ;
- densité forêt ;
- clairières ;
- village ;
- POI.

Il produit ensuite le même WorldDocument que le Builder.

## Workflow créateur

```text
Générer une carte
      |
      v
WorldDocument
      |
      v
Ouvrir dans Builder
      |
      +-> déplacer une route
      +-> changer sa largeur
      +-> road.dirt -> road.stone
      +-> déplacer rivière
      +-> ajouter pont
      +-> régler décor
      |
      v
Enregistrer / jouer
```

## Packs prévus

Exemples :
- Forest ;
- Snow ;
- Desert ;
- Cave ;
- City ;
- Lava.

Chaque pack peut apporter :
- surfaces ;
- chemins ;
- eau/lave ;
- transitions ;
- decals ;
- références d'objets compatibles.

## Performance mobile

Règles :
- privilégier WebP lorsque pertinent ;
- dimensions raisonnables ;
- répétition contrôlée de petites ressources plutôt qu'une mégatexture ;
- culling ;
- chargement autour de la caméra ;
- cache partagé ;
- éviter de dupliquer les mêmes images dans plusieurs matériaux ;
- aucune analyse pixel gameplay en runtime.

## Trois pilotes v1

### grass.forest
Type : `surface`.
Doit démontrer :
- base forestière ;
- variations ;
- détails visuels ;
- transition future avec chemin/eau.

### road.dirt
Type : `path`.
Doit démontrer :
- centre ;
- bords ;
- largeur variable ;
- changement de matériau sans changement de géométrie.

### water.forest_stream
Type : `water`.
Doit démontrer :
- eau ;
- berge ;
- reflet/variation ;
- largeur variable ;
- collision indépendante.

## Règle de validation

Material Pack v1 ne sera GREEN que si :
- les trois ids sont réellement utilisés par le renderer ;
- aucun style de ces trois matériaux n'est codé comme autorité dans le World Model ;
- changer materialId change l'apparence sans changer la géométrie ;
- aucun asset inter-module sauvage ;
- CI GREEN ;
- preview mobile validée.


## Pack graphique pilote — forest-core-v1

Premier profil de test :
`mobile-test-128`.

Emplacement physique :
`assets/exploration/materials/forest/`.

Règle :
- le Material Pack ne contient jamais de chemin de fichier ;
- il ne contient que des assetIds sémantiques ;
- `Material Asset Adapter` résout assetId -> fichier local ;
- `Material Texture Loader` gère explicitement le cycle de chargement ;
- le renderer consomme l'image prête ou le fallback procédural.

Les fichiers de transition et decals sont présents dès v1 afin de stabiliser le contrat d'assets, mais ils ne doivent être rendus que lorsque leur algorithme de placement respecte réellement la géométrie courbe.
