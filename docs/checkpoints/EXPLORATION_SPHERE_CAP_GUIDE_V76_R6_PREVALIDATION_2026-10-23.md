# Exploration V76 R6 — surface de sommet continue et pinceau réutilisable (23/10/2026)

## Constat utilisateur
Capture après V76 R5 : **fluidité nettement meilleure**. Deux défauts restants :
1. Le guide du pinceau s'éteint immédiatement après une pose et ne permet pas d'enchaîner intuitivement les formes, notamment en mode **Placement précis** sur mobile.
2. Sur une colonne à sommet herbeux, les flancs rocheux arrière et la bande sombre masquent une partie du disque d'herbe, donnant un effet de trou ou de couronne rocheuse au lieu d'un plateau continu.

V76 R5 **NON GREEN visuel**. Dernier GREEN utilisateur V75 R2 : `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`.

## Charte et isolation
- Base source immuable R5 : `195ff6a5975a1307ce26fbc5fd53520496a5bd2f`.
- Checkpoint START : `checkpoint/exploration-start-sphere-cap-guide-v76-r6-2026-10-23`.
- Branche unique : `work/exploration-sphere-cap-guide-v76-r6-2026-10-23`.
- Gel strict : modèles de sphères, géométrie et import/export JSON, Collision World et franchissement, nage/vol, ponts, cascades, assets, caméra, Builder/Combat, cache/raster et performance R5. V77/V78 ne démarrent pas sans validation GREEN de V76.

## Correctifs
- Renderer propriétaire `src/render/sculpt-sphere-mesh.js` : découpe des faces visibles en flancs arrière, couronne/sommet continu, flancs avant en fonction de la profondeur monde. Le croissant sombre est désormais sous le sommet. **Même maillage analytique mis en cache** et mêmes textures HD roche / herbe / terre que R5 ; aucun morceau rocheux arrière ne masque le gazon sommital. Les flancs avant peuvent logiquement recouvrir le bord avant.
- UI propriétaire `src/sculpt-lab-main.js` : après `Appliquer ici`, le guide pointillé clair **reste actif** sur la visée sélectionnée ; l'utilisateur peut ajuster la cible avec les flèches immédiatement. En pose directe, le dernier point reste temporairement visible, même quand Android envoie `pointerleave` après levée du doigt. Le guide est dessiné en superposition dans l'éditeur uniquement et jamais ajouté à la carte. Il reste masqué en navigation/test.
- Tests Node : ordre vérifiable des remplissages arrière/bande sombre/herbe/avant, matière projetée en deux groupes au maximum, anciennes scènes compatibles, comportement de guide. Tests réels Chromium Sculpt : guide actif à la pose et ensuite, flèches, plateau large, assets et cache préservés.

## Gates
1. `npm test` et `npm run check` et tests Chromium Sculpt/Builder/Combat verts sur **SHA final**.
2. Comparaison source R5 → R6 : uniquement code/docs/tests ; aucun asset ni gameplay modifié.
3. Checkpoint R6 prévalidation, PR infra séparée épinglant le commit source CI vert à GitHub Pages, sans fusion du code métier dans main.
4. Validation visuelle et ergonomique sur Pixel par le créateur obligatoire pour GREEN V76.

**Statut de ce document : NON GREEN Pixel, prévalidation technique.**
