# Checkpoint prévalidation GREEN — Interior Random Encounter Policy v1

Date : 2026-10-07

## Base

- GREEN précédent : `checkpoint/exploration-building-interiors-entrance-link-v1-green-2026-10-07`
- SHA : `281754a2d2c707517dbf785838031c82b9e81857`
- branche : `work/exploration-interior-random-encounter-policy-v1-2026-10-07`
- checkpoint de départ : `checkpoint/exploration-start-interior-random-encounter-policy-v1-2026-10-07`

## Contrat

`WorldArea.encounters.randomEnabled` est l'autorité canonique locale :
- exterior -> true par défaut ;
- interior -> false par défaut ;
- override explicite autorisé.

Encounter Controller consomme cette policy avant toute résolution/roll de rencontre terrain.
Portal, Renderer, Combat Bridge, texture, materialId et terrainFamilyId ne possèdent aucune copie de la règle.

## TDD

- RED : `65b02d8ac96e358f6443f255c86db6eb814ef620`
- CI RED : `37633727026` — FAILURE attendue
- GREEN fonctionnel : `cd0dcbe41d90ebc27ea2732cedaca9583f3ff41c`
- CI GREEN : `37633971384` — SUCCESS
- chaîne runtime/Builder alignée : `8569f0ae516c7002c9c3f9758662afe52f6a6680`
- CI : `37634086848` — SUCCESS
- sentinelle WorldArea v5 : `349987de8325967b9531e7fcc6a10796a1665269`
- CI : `37634445594` — SUCCESS

## Gate restant

Créer :
- `checkpoint/exploration-interior-random-encounter-policy-v1-prevalidation-green-2026-10-07`
- `preview/exploration-interior-random-encounter-policy-v1-2026-10-07`

Puis valider smartphone :
- maison : marche prolongée sans terrain-random ;
- extérieur : random restauré ;
- Combat explicite : non affecté.

Ce document ne vaut pas GREEN FINAL avant validation utilisateur.
