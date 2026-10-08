# LAB_CURRENT_WORK — Point de reprise unique

> ÉTAT ACTIF — 2026-10-08
>
> Chantier : **Interior Geometry Authoring v1**
>
> Branche : `work/exploration-interior-geometry-authoring-v1-2026-10-08`
>
> Base GREEN exacte : `1585de871136ffbb9858cedae0b6a0df2e679c8d`
>
> Checkpoint précédent validé : `checkpoint/exploration-mobile-landscape-area-navigation-ux-v1-green-2026-10-08`
>
> Checkpoint de départ : `checkpoint/exploration-start-interior-geometry-authoring-v1-2026-10-08`

## Validation précédente

Le créateur valide le 2026-10-08 que la preview mobile R5 est **plus fluide** et demande de poursuivre le plan.

CI du commit de validation : `37741074814` — SUCCESS.
CI checkpoint GREEN UX : `37741136975` — SUCCESS.

## Besoin produit

L'édition d'une WorldArea intérieure doit permettre :
- régler sa **taille** ;
- régler sa **forme** ;
- conserver une édition simple sur smartphone ;
- poursuivre ensuite l'intégration des textures/assets, dans un lot séparé.

## Autorité canonique retenue

`WorldArea` reste l'unique propriétaire de la géométrie locale.

Contrat v1 :
- `width/height` restent l'étendue canonique et pilotent la taille ;
- nouvelle `boundary` canonique :
  - `{ kind: 'rectangle' }` ;
  - ou `{ kind: 'polygon', vertices: [{x,y}, ...] }` ;
- les vertices polygonales sont normalisées dans l'espace local 0..1 afin qu'un changement de width/height redimensionne la forme sans dupliquer les coordonnées ;
- absence de boundary dans une ancienne carte -> rectangle implicite ;
- aucun `shapePresetId` persistant : les presets Builder sont uniquement des commandes d'authoring vers la boundary.

## Formes Builder v1

Pour un intérieur :
- Rectangle ;
- L ;
- T ;
- Croix.

Une boundary polygonale importée qui ne correspond pas à un preset reste valide et sera affichée comme forme personnalisée ; le Builder ne la remplace pas silencieusement.

## Consommateurs obligatoires

La même boundary doit être consommée par :
- Collision World pour les limites de déplacement ;
- runtime renderer via un clip en lecture seule ;
- preview Builder via le même clip ;
- overlay Builder pour le contour ;
- taille Area existante pour redimensionner proportionnellement la boundary normalisée.

## Compatibilité / migration

- WorldArea schema v5 sans boundary -> WorldArea v6 rectangle ;
- round-trip import/export préserve la boundary canonique ;
- les anciennes WorldArea rectangulaires gardent exactement leur comportement ;
- pas de migration destructive.

## Périmètre fichiers attendu

- `src/world/world-area-model.js`
- nouveau helper pur de géométrie WorldArea si nécessaire
- `src/core/collision.js`
- helper render de clip WorldArea partagé runtime/Builder
- `src/main.js`
- `src/builder/world-builder-draft.js`
- `src/builder/world-builder-main.js`
- `builder.html`
- tests dédiés + sentinelles existantes
- docs architecture/ownership après GREEN technique

## Hors périmètre

- textures supplémentaires ;
- import de nouveaux assets ;
- génération procédurale d'intérieur ;
- éditeur libre de sommets polygonaux ;
- nouvelle collision d'objet ;
- Encounter/Combat ;
- Zombicide-40k.

## TDD obligatoire

RED avant implémentation :
1. schema v6 + migration v5 rectangle ;
2. polygon boundary normalisée/frozen ;
3. helpers point/cercle dans boundary ;
4. Collision World bloque le cutout d'une forme L ;
5. resize width/height conserve la forme normalisée ;
6. Builder intérieur expose Forme + taille sans seconde autorité ;
7. presets écrivent uniquement la boundary ;
8. runtime + Builder réutilisent le même clip read-only ;
9. les extérieurs/anciennes Areas restent rectangulaires.

## Gate

CI complète + preview + test smartphone obligatoire avant GREEN FINAL.
