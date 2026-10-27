# Exploration V76 R14 — Coins carrés nets, lissage des hauteurs retiré (24 octobre 2026)

## Retour produit et référence

- Retour visuel Pixel sur R13 : le terrain carré présente encore quatre coins marron en triangle, capture du 24/10/2026. L’utilisateur demande de retirer « Lisser les hauteurs » et de supprimer l’arrondi inutilisable.
- Base source publiée : `6dad922681faf964197da81ace42fe4e199e78ac`, incluant les assets escaliers 2,5D ajoutés sur R13. **Dernier GREEN global utilisateur connu** V75 R2 `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`.
- START immuable : `checkpoint/exploration-start-square-no-smoothing-v76-r14-2026-10-24`; branche de travail unique `work/exploration-square-no-smoothing-v76-r14-2026-10-24`.

## Cause reproduite et correction soustractive

1. Le mode visuel V54/V61 `roundness` masque en courbe le gazon d’un plateau **carré**. Ce clip expose des fragments de roche HD dans les angles ; l’ajustement R13 de texture ne pouvait pas résoudre un défaut de géométrie du masque.
2. L’ancienne paroi Est `sculptEastSeamBounds` commençait 3 px sous le bord HAUT de la case, donc recouvrait aussi la surface herbeuse d’une bande minérale, en particulier au coin inférieur droit. La paroi démarre maintenant **au pied du carreau supérieur**, sous l’herbe, sans changer sa collision.
3. `drawSculptTerrain` peint sans masque courbe les sommets carrés, la roche n’étant dessinée que sur les faces exposées ; suppression des décorations en bords adoucis et des raccords V59/V61 dans le chemin réel de rendu.
4. L’UI supprime **« Lisser les hauteurs »**, **« Arrondir toute la colline »** et son curseur visuel ; **« Lisser l’eau » demeure**. Les données historiques `roundness` restent importables/exportables sans entraîner de retour aux masques courbes ; les anciens helpers demeurent testables par compatibilité mais hors chemin visible.
5. Révisions de cache de `sculpt-lab.html` et de l’import Renderer dans `src/sculpt-lab-main.js` pour navigateur Pixel.

## Autorités gelées et non-régressions

- **Aucun changement** dans `src/core/sculpt-navigation-collision.js` : collisions sphériques validées R12, traversée des sommets plats, acteurs et ponts inchangés.
- **Aucun changement** World Model, JSON, `src/render/sculpt-sphere-mesh.js`, sprites de héros et échelle R13, matériaux HD, données des escaliers, combat, Builder, dépôt principal.
- Tests ciblés Node (sommet droit, paroi Est sous herbe, source UI, formats anciens) et **test Chromium réel** comparant pixels de plateaux 4 × 4 historiques 95 % vs 150 %, vérifiant les quatre coins verts, boutons disparus, capacités sphériques/eau conservées. Gates complets `npm test`, `npm run check`, Chromium Sculpt/Builder/Combat sur GitHub Actions à valider au SHA final.

## Statut

**PRÉVALIDATION — NON GREEN Pixel** : source et parcours automatiques à publier uniquement après CI verte ; validation de l’esthétique sur Pixel par le créateur indispensable avant checkpoint GREEN définitif.
