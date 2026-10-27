# Exploration — Interior Geometry Authoring v1 — Prévalidation R2

Date : 2026-10-10

## Retour utilisateur

La première preview a échoué au gate smartphone :
- entrée dans un intérieur en T -> personnage bloqué entre sol intérieur et bordure noire ;
- rochers/objets franchissables signalés en parallèle.

Le GREEN FINAL est refusé.

## Cause intérieure

L'ancien placement de connexion intérieure utilisait une position pensée pour une Area rectangulaire.
Pour la première connexion d'une Area 720×560 :
- X ≈ 216 ;
- la tige basse du preset T commence vers X ≈ 230.4.

Le Spawn d'arrivée pouvait donc être hors boundary ou sans clearance suffisante.

## TDD / correction

- RED : `d0c6b4857574d910251d3b34c705f973666ef823`
- CI RED : `38000127075` — FAILURE attendue
- helper boundary-safe : `1ca80e92729c1f6105f6679757bd80a95dedfc49`
- raccord Draft / Portal / Spawn : `e3b414a3034892e6c29e31c67b53c35849e49734`
- test frozen contract : `c862ddaab959bd3fcae6d014a6eec6f15e14117e`
- CI fonctionnelle : `38000304668` — SUCCESS
- cache public R2 : `3339b980592e91e2219a41f85c8ad67dd196cf29`
- sentinelles/imports R2 : `77f255cb62cb0bee70676ec99a64eabc46229f3e`
- CI R2 : `38000499216` — SUCCESS

## Contrat corrigé

La WorldArea boundary reste l'unique géométrie.

Le Builder :
- cherche un point de connexion avec clearance réellement inclus dans la boundary ;
- réconcilie les Spawns coordonnés et triggers Portal point lorsqu'un resize/changement de forme les rend invalides ;
- ne crée aucune seconde autorité de coordonnées.

## Collision des rochers/objets

Audit confirmé mais **hors périmètre** de ce lot :
- building possède déjà un footprint collision ;
- rock/tree/door/stairs n'ont pas de footprint canonique ;
- Collision World ne bloque actuellement que les building.

Le chantier suivant sera **WorldObject Collision Footprints v1**, après validation de cette R2.

## Gate R2

Sur smartphone :
1. créer/ouvrir un intérieur ;
2. sélectionner forme T ;
3. entrer depuis le Building ;
4. vérifier que le personnage arrive sur le sol praticable ;
5. vérifier qu'il peut immédiatement se déplacer ;
6. sortir puis rentrer ;
7. tester L et Croix ;
8. tester un resize puis une nouvelle entrée.

Statut : **PREVALIDATION R2 — GREEN FINAL interdit avant validation utilisateur.**
