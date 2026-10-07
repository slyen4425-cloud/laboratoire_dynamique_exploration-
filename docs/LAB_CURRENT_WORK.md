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
> Dernier GREEN : `checkpoint/exploration-building-interiors-entrance-link-v1-green-2026-10-07`

## Besoin utilisateur

Une `WorldArea(kind = interior)` ne doit pas produire spontanément une rencontre `source = terrain-random` simplement parce que le joueur marche.

Les combats explicites restent autorisés et hors de cette règle : acteur hostile placé, WorldEvent combat, trigger scripté, boss, interaction ou autre mécanisme possédant sa propre autorité.

## Audit LIVE

- Encounter Controller = autorité unique du déclenchement terrain aléatoire.
- WorldArea = autorité de la nature/configuration locale de l'Area.
- Terrain Family Resolver = famille locale uniquement.
- Encounter Bridge = transformation intent -> Combat, hors policy.
- Portal = changement d'Area uniquement, hors policy.
- Renderer = lecture seule, hors policy.
- aucun chantier parallèle `random` / `encounter-policy` / `work/exploration-interior*` détecté.
- `WorldArea v4` ne possède actuellement aucune policy de rencontre.

## Contrat retenu

Ajouter une policy canonique persistée dans `WorldArea` :

```text
WorldArea.encounters.randomEnabled
```

Valeurs par défaut :
- `exterior` -> `true`
- `interior` -> `false`

Un override explicite pourra donc autoriser plus tard les rencontres aléatoires dans une Area intérieure dangereuse sans déduire la règle du matériau, de la texture ou de `terrainFamilyId`.

Le Encounter Controller :
1. conserve/reset l'ancre de distance lors d'un changement d'Area ;
2. lit uniquement la policy canonique de l'Area ;
3. retourne `null` avant résolution/roll si random désactivé ;
4. n'appelle jamais le RNG dans ce cas.

## Propriétaires / frontières

- policy Area : WorldArea Model ;
- déclenchement random : Encounter Controller ;
- famille locale : Terrain Family Resolver ;
- chance/éléments/créature : Terrain Family Encounter Config + CaptureDatabase ;
- Combat explicite : autorités existantes, inchangées.

## Fichiers attendus

- `src/world/world-area-model.js`
- `src/encounters/encounter-controller.js`
- tests ciblés Encounter / WorldArea / runtime architecture
- documentation du lot

Hors périmètre :
- Renderer ;
- Portal Model ;
- Combat Bridge ;
- textures/materials ;
- nouveau terrainFamilyId ;
- désactivation globale du Combat ;
- `Zombicide-40k`.

## TDD RED requis

1. extérieur identique -> `terrain-random` toujours possible ;
2. intérieur identique -> aucun random par défaut ;
3. aucun appel RNG dans intérieur bloqué ;
4. entrée intérieur -> ancre distance remise correctement ;
5. sortie extérieur -> random restauré normalement ;
6. combats explicites non affectés ;
7. aucune logique interior/policy dans Renderer / Portal / Combat Bridge ;
8. aucun `terrainFamilyId` / `materialId` artificiel pour simuler un intérieur sûr ;
9. override intérieur explicite -> random autorisable.

## Gate

- CI RED attendue après commit des tests ;
- implémentation seulement après RED constaté ;
- CI GREEN technique ;
- checkpoint prévalidation ;
- preview séparée ;
- test smartphone : entrer maison, marcher longtemps sans random, sortir, retrouver random extérieur, vérifier combat explicite ;
- GREEN FINAL uniquement après validation utilisateur.
