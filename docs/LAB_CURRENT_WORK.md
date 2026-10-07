# LAB_CURRENT_WORK — Point de reprise unique

> ÉTAT ACTIF — 2026-10-07
>
> Chantier : **Interior Random Encounter Policy v1**
>
> Branche : `work/exploration-interior-random-encounter-policy-v1-2026-10-07`
>
> Base GREEN exacte : `281754a2d2c707517dbf785838031c82b9e81857`
>
> Checkpoint de départ : `checkpoint/exploration-start-interior-random-encounter-policy-v1-2026-10-07`
>
> Checkpoint prévalidation prévu : `checkpoint/exploration-interior-random-encounter-policy-v1-prevalidation-green-2026-10-07`
>
> Preview prévue : `preview/exploration-interior-random-encounter-policy-v1-2026-10-07`

## Contrat canonique

```text
WorldArea.encounters.randomEnabled
```

Normalisation WorldArea v5 :
- `exterior` -> `true` par défaut ;
- `interior` -> `false` par défaut ;
- override booléen explicite autorisé, notamment pour un futur intérieur dangereux ;
- anciennes Areas sans champ -> normalisées selon `kind`.

Le Encounter Controller reste l'unique autorité du déclenchement `terrain-random`.
Quand `randomEnabled === false` :
- l'ancre de distance reste tenue à jour ;
- la distance accumulée est remise à zéro ;
- retour `null` avant Terrain Family Resolver / Encounter Resolver ;
- aucun RNG n'est appelé.

Les combats explicites/scénarisés restent hors de cette policy.

## Autorités protégées

- nature/policy locale de l'Area -> World Area Model ;
- déclenchement aléatoire -> Encounter Controller ;
- famille locale -> Terrain Family Resolver ;
- chance/élément/créature -> Terrain Family Encounter Config + CaptureDatabase ;
- transformation vers Combat -> Encounter Bridge ;
- changement d'Area -> Portal Model ;
- rendu -> Renderer lecture seule.

Interdits confirmés :
- aucun `if interior` dans Renderer/Portal/Bridge ;
- aucun `indoor-safe` / `interior-safe` ;
- aucun materialId/terrainFamilyId spécial ;
- aucune désactivation globale du Combat ;
- aucune modification de `Zombicide-40k`.

## TDD

RED final :
- HEAD tests : `65b02d8ac96e358f6443f255c86db6eb814ef620` ;
- CI : `37633727026` — **FAILURE attendue** ;
- 386 tests, 381 GREEN, 5 RED ciblés sur le contrat absent.

Couverture ajoutée :
1. extérieur -> terrain-random toujours possible ;
2. intérieur -> aucun terrain-random par défaut ;
3. RNG jamais appelé dans intérieur bloqué ;
4. entrée intérieur -> ancre distance reset ;
5. sortie extérieur -> random restauré ;
6. source Combat explicite préservée ;
7. aucune fuite de policy dans Renderer / Portal / Bridge ;
8. aucun faux terrain/material safe ;
9. override intérieur explicite -> random possible.

## Implémentation

- WorldArea v5 + `encounters.randomEnabled` : `a51b9fcf701c0f2123db402c56aa89180cf6ea8f` ;
- Encounter Controller bloque avant roll : `cd0dcbe41d90ebc27ea2732cedaca9583f3ff41c` ;
- CI fonctionnelle : `37633971384` — **SUCCESS** ;
- cache runtime aligné : `647fcd35b85869ef6a684c047133b75b49474be5` ;
- WorldDocument / Builder imports alignés jusqu'à `8569f0ae516c7002c9c3f9758662afe52f6a6680` ;
- CI chaîne navigateur/Builder : `37634086848` — **SUCCESS** ;
- libellé sentinelle WorldArea v5 : `349987de8325967b9531e7fcc6a10796a1665269` ;
- CI : `37634445594` — **SUCCESS**.

## Gate utilisateur restant

Publier la preview séparée puis tester sur smartphone :
1. entrer dans la maison ;
2. marcher longtemps à l'intérieur : aucun random ;
3. sortir ;
4. marcher dehors : les rencontres terrain reviennent ;
5. confirmer que les mécanismes de Combat explicites existants restent indépendants.

État : **GREEN TECHNIQUE — PRÉVALIDATION EN COURS. GREEN FINAL interdit avant gate utilisateur.**
