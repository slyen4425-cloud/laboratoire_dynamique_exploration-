# Exploration — Audit assets terrain / murs

Date : 2026-10-01

## Source auditée

Dépôt :
`slyen4425-cloud/Zombicide-40k`

Branche :
`work/gensrpg-phase8-tactical-consolidation-preaudit-2026-10-01`

Commit de référence :
`9fd5a789180e26204833e9d6b330079352272ec6`

Manifest exact :
`docs/assets/SOURCE_ASSET_CANDIDATES_V1.json`

## Résultat

42 fichiers candidats inventoriés avec chemin source, blob SHA et taille.

### Sols

- forêt : 6 variantes ;
- grotte : 6 ;
- glace : 6 ;
- lave : 6 ;
- pierre : 6 ;
- eau : 6.

Chemins historiques :
`assets/dungeon/creatures/dng_floor_<biome>_01..06.png`

Ces fichiers sont aujourd'hui physiquement sous ownership Dungeon même lorsque leur visuel peut être générique.

### Murs

Deux références trouvées :
- `assets/dungeon/creatures/dng_wall_block.jpg`
- `assets/dungeon/creatures/dungeon_wall.png`

Classification :
**Dungeon-owned — revue obligatoire avant réutilisation**.

Ils ne sont pas déclarés `common` dans GenSrpG.

### Legacy

Quatre anciens sols :
- cracked ;
- lava ;
- stone ;
- water.

Ils restent des références historiques et ne sont pas prioritaires.

## Resolver GenSrpG

`assets/gensrpg/core/asset-resolver-v1.js` ne sait actuellement résoudre que :
- créatures Dungeon ;
- héros Dungeon ;
- objets Dungeon.

Il ne possède aucun contrat de terrain/sol/mur.

Conclusion :
le labo ne doit pas appeler directement ce resolver pour ces textures et ne doit pas coder les chemins Dungeon comme contrat durable.

## Autres éléments recherchés

Dans l'arbre Dungeon audité, aucune famille explicite de :
- route/road ;
- rivière/river ;
- pont/bridge ;
- arbre/tree ;
- herbe/grass ;
- toiture/roof ;
- maison/house

n'a été trouvée par nom.

Deux assets de porte Dungeon existent, mais restent spécifiques au module et ne sont pas retenus pour le pack extérieur initial.

## Classification proposée

### Candidat pack forêt v1
Les 6 `dng_floor_forest_01..06.png`.

Pourquoi :
- meilleur rapport utilité/risque pour une première map Capture ;
- permet de remplacer immédiatement le fond plat du prototype ;
- aucune règle gameplay dépend de l'image ;
- compatible avec un rendu continu sans case autoritaire.

### Candidat secondaire
Les 6 variantes eau.

Usage futur :
- rivière ;
- mare ;
- bordure de zone ;
mais la forme et la collision doivent être pilotées par le World Model, jamais par les pixels de l'image.

### À repousser
Murs Dungeon.

Pour une exploration Capture extérieure, les obstacles naturels et bâtiments demandent un pack dédié.
Un mur Dungeon ne doit pas devenir un asset Capture par simple commodité.

## Règle de raccord

Interdit :
```text
Exploration runtime -> URL brute Zombicide-40k/assets/dungeon/...
```

Cible :
```text
World Model
 -> terrain asset id
 -> Exploration Asset Adapter
 -> asset local du labo
```

À l'intégration GenSrpG :
```text
Capture Exploration
 -> Core Asset Resolver
 -> assets/capture/... ou assets/common/...
```

La décision `capture` vs `common` sera prise lors du chantier d'intégration.

## Prochain lot recommandé

`asset-pack-forest-v1`

Périmètre :
1. copier uniquement les 6 textures forêt dans le labo ;
2. conserver un manifeste source SHA/blob ;
3. les renommer sous ownership Exploration ;
4. créer un Asset Adapter par identifiants ;
5. afficher le sol sans changer les collisions ;
6. culling visuel simple ;
7. preview smartphone ;
8. checkpoint GREEN.

Les murs viendront dans un lot distinct.
