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


## TDD / implémentation — Interior Geometry Authoring v1

RED fonctionnel :
- commit : `4fbd40c9c44ba7896b0ea3ac01cc891622fc65e3`
- CI : `37741723179` — **FAILURE attendue**
- 409 tests : 400 GREEN, 9 RED ciblés sur schema v6, boundary, collision, Builder, presets et clip partagé.

Implémentation fonctionnelle :
- commit : `3d87e32892b7d145467cb9f32373473b3504e857`
- CI : `37742123865` — **SUCCESS**
- 409/409 tests GREEN.

Livré :
- WorldArea schema v6 ;
- ancienne Area sans boundary -> rectangle canonique ;
- boundary polygonale normalisée en coordonnées 0..1 ;
- helpers purs de géométrie WorldArea ;
- Collision World bloque hors boundary et respecte les cutouts concaves ;
- clip WorldArea partagé par runtime + preview Builder ;
- Builder intérieur : formes Rectangle / L / T / Croix ;
- forme importée non reconnue conservée comme Personnalisée ;
- width/height existants redimensionnent la forme proportionnellement ;
- aucune donnée `shapePresetId` persistée ;
- Taille Area directe continue d'écrire uniquement width/height.

TDD cache :
- RED : `867bd9102248adce1bd44758180b94750ba3ca18`
- CI : `37742252525` — **FAILURE attendue**, 409/410 GREEN, uniquement cache public ;
- code cache : `a8adfb4eb7652594c61aeab9f83aaaaabfa8b91c`
- sentinelles alignées : `5047f48ab9d283d24348130acb7513924f1cf349`
- CI : `37742615742` — **SUCCESS**, 410/410 tests.

Révision publique :
`interior-geometry-authoring-v1`

## Gate attendu

Sur smartphone :
1. ouvrir un intérieur ;
2. changer Rectangle -> L -> T -> Croix ;
3. vérifier que le sol et les objets/acteurs visibles sont bien clipsés à la forme ;
4. vérifier qu'on ne peut pas marcher dans les zones découpées ;
5. modifier Largeur/Hauteur puis Taille Area directe ;
6. vérifier que la forme se redimensionne sans se déformer arbitrairement ;
7. tester `← Extérieur` puis `Intérieur →` ;
8. vérifier que le Builder reste fluide comme en R5.

État : **GREEN TECHNIQUE — documentation + checkpoint/preview requis avant validation utilisateur.**


## Prévalidation publiée — Interior Geometry Authoring v1

- SHA gameplay/docs prévalidation : `085a2aa100274af1676b17b420359bc0b509ac4a`
- CI work : `37742782556` — **SUCCESS**
- checkpoint : `checkpoint/exploration-interior-geometry-authoring-v1-prevalidation-green-2026-10-08`
- CI checkpoint : `37742828444` — **SUCCESS**
- preview : `preview/exploration-interior-geometry-authoring-v1-2026-10-08`
- publication infrastructure uniquement : PR #105
- merge infra `main` : `faf4704d2489ff1f764804acf6ed2d9b77e4d642`
- Pages : `37742930654` — **SUCCESS**
- aucun gameplay du lot n'a été mergé dans `main`.

Lien de gate :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=interior-geometry-authoring-v1`

État : **GREEN TECHNIQUE / PREVALIDATION — attente validation smartphone de la forme/taille intérieure avant GREEN FINAL et avant le lot textures.**
