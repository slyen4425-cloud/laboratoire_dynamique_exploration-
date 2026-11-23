# Checkpoint Exploration — navigation sans passage (#530), lot 1, 23 novembre 2026

**SCOPE INITIAL** : `main@9f7139b5a8fc31d0aafdf8c5b2353fd4c3e58207` (CI + Pages GREEN) → `feat/navigation-forbidden-brush-20261123`.

## Propriétaires conservés
- `SculptTerrain` — données officielles via `WorldArea.sculptTerrain`; nouveaux indices de cases bloquées uniquement si explicitement peints.
- `sculptNavigationRoute` — **Collision World** continue de prendre seul les décisions de mouvement, pour le héros, PNJ et créatures.
- `sculptBrushFootprint` — une seule géométrie de peinture (rond/carré/croix), pas de second pinceau ni d'écran en double.

## Invariants
1. Les cartes sans `navigationBlockedCells` sérialisent **exactement comme avant**.
2. Les cases rouges n'apparaissent qu'en édition, sans altérer ni le relief, ni la texture, ni les rencontres.
3. La collision considère le rayon de l'acteur et teste le trajet balayé ; le vol reste autorisé ; l'acteur coincé peut sortir.
4. Le bouton « Autoriser entre hauteurs » réutilise le vrai `terrain-ramp` déjà validé : pas de contournement de falaises ou d'eau par un booléen d'UI.
5. Le bouton Normal retire les cellules interdites, Undo/Redo fonctionnent, WorldDocument normalise/import/export sans nouveau magasin, pas d'IDs manuels.
6. Une autorisation avec deux rives, un support sur l'eau et la création de gués/ponts **reste à développer dans un lot séparé**, conforme à #530. Le ticket reste donc ouvert.

## Tests requis avant publication
`tests/sculpt-navigation-block-zones-20261123.test.mjs`, suite CI complète, `scripts/smoke-sculpt-terrain-lab.mjs` vrai Chromium, sentinelles de Collision World et de l'éditeur ancien V80, Page size <= 900 Mio, CI SHA de PR puis CI et site HTTPS main.

**Statut : prévalidation en cours** (ne pas écrire GREEN sur simple création du document).
