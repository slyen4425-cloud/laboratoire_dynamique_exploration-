# V44 — sélection d'objets fiable et fluide — prévalidation technique (20 octobre 2026)

## Motif
Retour utilisateur sur V43 : le mouvement et surtout la sélection fonctionnent mais sont difficiles, avec ralentissements sensibles sur téléphone. Pas de GREEN ergonomique V43.

## Gouvernance
- Départ immuable V43 publiée `29e85ef92f1d07f42edafa7f79429bb4377afb7d` ; START `checkpoint/exploration-start-sculpt-object-pick-perf-v44-2026-10-20`.
- Source code V44 **figée** `809802015eb91d752016bafe1103e4d02ddd50e4` ; travail `work/exploration-sculpt-object-pick-perf-v44-2026-10-20`.
- Checkpoint prévalidation `checkpoint/exploration-sculpt-object-pick-perf-v44-prevalidation-2026-10-20`, exactement même SHA source.
- CI source https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39423716320 : **SUCCESS** 622 tests Node, syntaxe, Chromium réel (sculptation + Capture/Combat/Builder).
- CI checkpoint https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39423903681 : **SUCCESS**.
- Diff de publication infrastructure seul via PR https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/185 (merge `ce1aaccd1f9b832869392c3060d4869c429318f8`) ; Pages https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39424251818 (vérifier le statut final).
- Lien `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/sculpt-lab.html?v=44`.

## Diagnostic et correction (lot unique)
1. Mode Objets V43 : dessin de tous les carreaux, parois, eau et overlays à chaque frame tactile, même quand seul un objet bouge. Réutilise désormais le cache raster **terrain seulement** déjà utilisé dans Tester, inchangeable tant que le fond ne change pas. Le terrain en édition sol/eau conserve son rendu non mis en cache.
2. Sélection V43 : `screenToCell` puis tolérance d'ancre brute ignorait les hauteurs, orientation et image réellement affichée. Nouvelle requête visuelle dérivée de `resolveWorldObjectPlacements`, `sculptObjectVisualRect`, mêmes dimensions/rotation/décalage d'altitude que le renderer. Aucun rectangle additionnel de collision; c'est uniquement un *hit* dans le visuel.
3. L'appui sur une zone vide désélectionne correctement et ne déplace plus l'ancien objet, le glissement conserve offset, restrictions eau/carte, placement natif, export JSON et une seule unité undo/redo.

## Tests du vrai chemin
- Node : silhouette surélevée (niveau 5), rotation 45°, superposition d'objets, dessin visuel canonique sans collision; test de sauvegarde objet V43 inchangé.
- Chromium après scène importée : objet **rehaussé et rotaté 45°** sélectionné en cliquant son corps projeté au-dessus de sa case d'ancre ; glissement réel par 12 `Input.dispatchMouseEvent` successifs ; `terrainRasterBuilds=12` avant et après (aucune reconstruction pendant drag), export et undo conformes.
- Sentinelles antérieures V39 caméra/terrain, V40 passabilité, V41 ciel, V42 acteurs Capture, V43 largeur barre paysage/drag/cancel/restauration, Builder/Combat : **GREEN**.
- Pas de nouvelle image, matière ni changement de données gameplay.

## Limite / gate
Le gain en réduction de recalculs de la carte est confirmé par le navigateur CI ; la **fluidité subjective sur le smartphone réel demeure à valider par le créateur**. Statut V44 : **prévalidation technique uniquement**, pas GREEN créateur avant test mobile. Si rendu dégradé ou sélection difficile sur carte très dense, revenir à la source V43 épinglée et diagnostiquer avant fusion.
