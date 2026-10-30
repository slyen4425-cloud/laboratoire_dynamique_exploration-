# Collision Boundary & WorldObject Obstacles v1 — Prévalidation R2

Date : 2026-10-10

## Protocole / filiation

- Base gameplay de départ historique : `ab3ea4b761050977d181d424eb5bfb6439dd249e`
- Base GREEN FINAL documentée après coup : `11d1c4fe39b6bc8b587a3357dbca9e157a58bdab`
- Cette prévalidation réconcilie les deux lignées par merge à deux parents,
  sans réécrire la chaîne TDD ni modifier `main`.
- Branche de travail : `work/exploration-collision-boundary-worldobject-obstacles-v1-2026-10-10`

## Correction R2

- Suppression du cas spécial Building dans `src/core/collision.js`
- Résolution générique `WorldObject.collision` ou ancien `ObjectDefinition.footprint`,
  sans collision parallèle et avec priorité à `passable` explicite.
- Tests du vrai chemin Building toujours bloquant ; Bridge traversable ;
  classes rock/tree ; imports et créatures vivantes conservés.
- RED : `da67d2f`, run `38052251914` FAILURE ciblée.
- GREEN : `30d0d33`, run `38052319049` SUCCESS, 429/429.
- Cache RED : `bf5b86a`, run `38052396832` FAILURE attendue.
- CI cache finale : `38052495858` SUCCESS, 430/430 + npm run check.
- Révision publique : `collision-boundary-worldobject-obstacles-v1-r2`.

## Test manuel obligatoire

1. Intérieur Rectangle/T/L/Croix : marcher contre mur supérieur, tête visible.
2. Portals entrée/sortie et marche latérale non régressés.
3. Rochers et arbres bloquants ; diagonal, rotation, scale.
4. Bâtiment legacy toujours bloquant ; porte et pont praticables.
5. Import personnel Obstacle bloque ; Traversable laisse passer.
6. Créatures sauvages hors obstacles ; wander sans traversée.
7. Mobile paysage/pan/performance R5 inchangés.

État : **PREVALIDATION R2 uniquement**.
Aucun GREEN FINAL sans validation smartphone de l'utilisateur.
