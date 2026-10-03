# Checkpoint GREEN — Surface Traversal Rules v1 replay

Date : 2026-10-03

## Branche source
`work/exploration-surface-traversal-rules-v1-replay-2026-10-03`

## Checkpoint de départ
`checkpoint/exploration-start-surface-traversal-rules-v1-replay-2026-10-03`

## Base GREEN
`ecdf28ba33fac409e7a2411ba2fd6592a34dc0b7`

## SHA technique final avant checkpoint
`0fc096c4b717e4ebb67ab1ab15ed8ab591df0259`

## Validation automatique
- convergence technique : run `37094377193` — SUCCESS
- cache/versioning : run `37094556304` — SUCCESS
- fermeture + règle de capability locomotion : run `37100173275` — SUCCESS

## Preview validée
- main preview : `ea5920e03cf32ceac268359a88b3821756cda58a`
- Pages run : `37094636663` — SUCCESS
- artifact : `11262639570`

## Validation smartphone utilisateur
**GREEN**.

Validé :
- Marche : bonus route ;
- Marche : eau bloquée hors pont ;
- pont traversable ;
- Nage : eau traversable x0.75 ;
- Vol : eau traversable x1.00 ;
- Map Actor / sourceFacingX sans régression ;
- World Builder sans régression.

## Autorité locomotion
Le Surface Traversal Resolver ne donne jamais l'accès à Nage ou Vol.

Chaîne cible :
```text
Capture / gameplay acteur
  -> compétence / créature possédée / monture / effet
  -> profil locomotion autorisé
  -> Surface Traversal Resolver
  -> passabilité + multiplicateur
```

Le sélecteur Marche/Nage/Vol présent dans la preview est uniquement un harnais de test.

## Autorités protégées
- géométrie : World Surface Model ;
- règles : Traversal Rule Registry ;
- capacité locomotion : gameplay acteur/Capture futur ;
- résolution : Surface Traversal Resolver ;
- mouvement final : Exploration Core ;
- collision : Collision World ;
- rendu : lecture seule.

## Suite
Phase 5 — Monde vivant.

Premier micro-lot recommandé :
**Wild Creature Entity + Spawn Contract v1**.

Objectif :
poser les données/ownership de créatures sauvages et de leurs règles de spawn avant toute errance/poursuite/fuite.
