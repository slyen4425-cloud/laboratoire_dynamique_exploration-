# Builder — Familles de textures / performance — Prévalidation technique

Date : 2026-10-13

## Gouvernance

- Branche : `work/exploration-builder-terrain-texture-perf-gatefix-2026-10-13`
- Base : `edfadb539fb53aacbf57dd91e79fe9a4efe374c1`
- Start : `checkpoint/exploration-start-builder-terrain-texture-perf-gatefix-2026-10-13`
- GREEN précédent : `checkpoint/exploration-interior-geometry-authoring-v1-green-2026-10-10`
- Collision R2 demeure PREVALIDATION et non GREEN FINAL.
- Aucune écriture de gameplay sur `main`.

## Résolution technique

- Familles Plaine, Forêt, Mer, Montagne, Volcan, Neige, Route, Sable associées à leurs textures en vitrine.
- Changement de famille synchronise le matériau choisi pour le sol / pinceau sans confondre les autorités sémantique/visuelle.
- Import des textures sol avec famille assignée ; plusieurs images possibles dans une famille, y compris personnalisée.
- Tampons de transitions visuelles limités à la zone du trait et alloués seulement si un tracé existe.
- Réutilisation de tampons lors des variations de taille ; points de pinceau traités au rythme RAF.
- Aucune réécriture des surfaces sauvegardées qui auraient un matériau incohérent ; les anciennes peuvent être rééditées manuellement.

## TDD / preuve

- RED `bd7b662` — CI `38472482630` FAILURE attendue.
- Fix `922cb3d`, sentinelles et optimisations `4736131`, `f1e7da1`.
- CI `38473354843` **SUCCESS** — 435/435 tests + npm run check.
- Tests couvrent association famille/texture, import local, masques nuls sur carte vide, buffers bornés/réutilisés, scheduler RAF et tous les invariants existants.

## Gate utilisateur obligatoire

1. Smartphone paysage : sur carte vide, déplacer / zoomer / peindre pendant 20–30 secondes, vérifier fluidité.
2. Choisir Sable : un nouveau trait doit afficher sable, jamais Herbe.
3. Choisir Forêt / Neige / Montagne / Volcan / Plaine / Mer / Route et vérifier la texture du tracé.
4. Changer la famille d'un tracé sélectionné : famille gameplay et matériau du tracé restent cohérents.
5. Importer deux textures utilisateur dans la même famille, les retrouver sous cette famille ; créer une famille personnalisée et y importer un sol.
6. Import/export WorldDocument, recharger et retrouver zones, familles, matériaux.
7. Contrôles Collision R2 distincts : mur haut, rochers/arbres, Bridge/Building, import Obstacle/Traversable.

**État : GREEN TECHNIQUE — PREVALIDATION, ni mesures mobiles ni GREEN FINAL.**
