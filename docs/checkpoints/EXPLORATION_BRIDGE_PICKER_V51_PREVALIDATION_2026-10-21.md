# Exploration — V51 Ponts dans la palette de Sculpture — Prévalidation (21 octobre 2026)

## Retour et cause
- Sur V50, esthétique falaise validée ; les sept ponts et leurs 28 orientations existaient dans l'Asset Adapter et l'Object Definition Catalog mais n'étaient pas exposés dans la palette Sculpt.
- Cause prouvée : `src/world/sculpt-scene-preview.js` ne proposait que `building/tree/rock`; la liste HTML de `sculpt-lab.html` ne proposait pas `bridge`. Une garde commune refusait toute pose sur case d'eau.

## Base et gouvernance
- Base immuable V50 validée `d43d58494bc1f918bcb213846501bc790774ed02`.
- Départ `checkpoint/exploration-start-bridge-picker-v51-2026-10-21`.
- Travail `work/exploration-bridge-picker-v51-2026-10-21`.
- Domaine : UI/placement Sculpt prévisualisant les définitions canoniques WorldObject. Aucun changement Asset Adapter/Collision World/Traversal/Monde.

## Modifications
- Élargissement de la liste de définitions plaçables à `bridge`, sans dupliquer le registre.
- Catégorie « Ponts » dans la palette et libellé générique « Vue / orientation de l'objet ». Les sept familles exposent les quatre vues natives.
- Le placement sur eau reste interdit pour bâtiments, rochers et arbres, mais est autorisé pour les ponts canoniques uniquement. Pas de transformation d'une case d'eau en terrain sec et pas de garantie de traversal si aucun corridor n'est lié.
- Le format d'import/export de scène, l'Undo et la rotation restent inchangés.
- Instrumentation UI lecture seule pour contrôler catégories et visuels dans Chromium.

## Vérifications
- Node : `tests/sculpt-bridges-picker-v51.test.js` couvre familles, vues, asset resolver, sérialisation et sélections.
- Chromium : `scripts/smoke-sculpt-terrain-lab.mjs` ouvre la palette réelle, montre sept ponts et quatre orientations, charge une scène avec eau et clique réellement un pont, vérifie variante puis restaure la scène V23.
- [CI GitHub V51 #39540750409](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39540750409) SUCCESS sur `3f2a7eec782b5cfd212cd6ccc469cf907fb13d71` ; core-tests, npm test, npm run check, navigateur réel Chromium et Combat/Builder GREEN.
- V50 rendu falaise, eau V46, caméra, 6 maisons, anciennes catégories, Combat et modèle WorldDocument gelés.
- **Gate restant :** prévisualisation Pages épinglée et test tactile sur smartphone, sélection/pose, taille/orientation et observation d'un pont sur les deux rives. Pas de GREEN final créateur.

## Suivant
- Rendu des bordures extérieures et outil opt-in d'arrondi de falaise en lots indépendants, après jalon technique et sans modifier les collisions.
