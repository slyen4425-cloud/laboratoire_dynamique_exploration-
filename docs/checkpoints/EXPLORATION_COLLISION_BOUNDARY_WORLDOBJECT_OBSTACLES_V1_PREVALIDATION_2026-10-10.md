# Exploration — Collision Boundary & WorldObject Obstacles v1 — Prévalidation

Date : 2026-10-10

## Base

- base GREEN : `ab3ea4b761050977d181d424eb5bfb6439dd249e`
- start checkpoint : `checkpoint/exploration-start-collision-boundary-worldobject-obstacles-v1-2026-10-10`
- branche : `work/exploration-collision-boundary-worldobject-obstacles-v1-2026-10-10`

## Besoin validé

1. empêcher le haut du héros de disparaître dans le noir d'un intérieur ;
2. rendre rochers/arbres réellement bloquants ;
3. préparer l'import utilisateur avec classification Obstacle / Traversable.

## Autorités

- WorldArea boundary : World Area Model ;
- silhouette gameplay : Actor/Exploration config ;
- collision WorldObject : ObjectDefinition ;
- placement/rotation/scale : WorldObject placement ;
- résolution utilisateur : Composed Object Catalog injecté ;
- décision de blocage : Collision World.

Aucune collision n'est dérivée d'un asset ou de pixels.
Aucun WorldObject n'est dupliqué dans WorldArea.obstacles.

## TDD / CI

- RED initial : `62698a345b1a39a78b276f877260698adab010ba` / CI `38023628937` FAILURE attendue
- fonctionnel initial : CI `38023867529` SUCCESS
- RED cache : `274622954da5f28b6360cd33e87b836496b32b1c` / CI `38023908679` FAILURE attendue
- cache GREEN : CI `38024238259` SUCCESS
- RED vrai chemin import : `f57cf1caac959cbe4c92081f608d3f6924b2c2e2` / CI `38024297618` FAILURE attendue
- raccord runtime final : `4a8d51c0dc2b3a1d176d28085db5f38858d1b0ee`
- CI finale : `38024391220` SUCCESS — 428/428 + npm check GREEN

## Gate smartphone requis

- intérieur : marcher vers le mur haut, aucune moitié de corps dans le noir ;
- extérieur : rocher et arbre bloquent ;
- Building et Portal restent fonctionnels ;
- Bridge reste franchissable ;
- import utilisateur Obstacle bloque ;
- import utilisateur Traversable ne bloque pas ;
- T/L/Croix restent jouables.

Statut : **PREVALIDATION uniquement — GREEN FINAL interdit avant verdict utilisateur.**
