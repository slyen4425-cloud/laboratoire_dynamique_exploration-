# V79 R1 — Éditeur intérieur 2,5D : première jonction (prévalidation)

Date : 24 octobre 2026.

## Demande créateur
Reprendre les intérieurs de maisons avec le **nouveau moteur de sculpture** et sa caméra inclinable ; ne surtout pas remettre en route l'ancien éditeur 2D comme moteur intérieur. Le créateur a confirmé « Ok vas-y ».

## Gouvernance
- SHA source V77 R3 GREEN créateur : `199461083cd64f69f8a981151093e654f220bca2`.
- START immuable : `checkpoint/exploration-start-2p5d-interior-area-v79-r1-2026-10-24`.
- Branche de travail : `work/exploration-2p5d-interior-area-v79-r1-2026-10-24`.
- Aucun changement sur V77 R3 pente, V78 R2 escalier, Collision World, Core Movement, Builder historique ni moteur Combat.

## Première tranche du produit
- Dans `sculpt-lab.html`, choisir **Objets → Sélectionner/modifier → maison → Modifier l'intérieur 2,5D**.
- Un bâtiment extérieur a une **WorldArea intérieure** avec un terrain `SculptTerrain` indépendant, initialement rectangulaire 18×14. Ce terrain utilise les mêmes outils de niveaux, pentes, escaliers, objets et peinture existants ; modifications conservées en quittant puis en rouvrant la pièce.
- Deux vrais contrats `Portal` : entrée liée à `doorAnchor` canonique de la maison, retour lié à un `Spawn` extérieur ancré à la même porte et recalculé en cas de déplacement/rotation de la maison. Le modèle Building ne stocke aucun `portalId` concurrent.
- Bouton **Retour extérieur** sans rechargement et bouton contextuel de porte en mode **Tester** lorsque le héros est proche du déclencheur, par le même `findTriggeredPortal/applyPortalTransition` que le WorldArea historique.
- Caméra intérieure **35–90°**, via `sculptCameraGameView` existant. Rendu des murs arrière/latéraux léger, ouvert sur le devant pour conserver la visibilité. Collisions de bordure conservées via l'unique Collision World.
- Export scène JSON ajoute facultativement `interiors[]` aux fichiers SculptPreview v1 ; sans la collection, les anciennes scènes restent identiques. Pour un intérieur actif, exporter d'abord l'extérieur comme racine et conserver la pièce active dans les données d'intérieur.
- Ce lot reste **une prévisualisation SculptLab**, pas une nouvelle persistance runtime dans WorldDocument : raccord définitif du WorldDocument et outils géométriques mur/pièces multiples seulement dans le lot suivant, après validation produit.

## Tests et limites
- `tests/sculpt-interior-area-v79.test.js` : contrat Portal, entrée/sortie, heightfield indépendant, sauvegarde/chargement, refus orphelins, caméra/UI.
- `scripts/smoke-sculpt-terrain-lab.mjs` : vrai Chromium, chargement maison, sélection, ouverture pièce, inclinaison 35/90, retour, JSON import/export.
- Toutes les sentinelles Node, check syntaxe, Chromium Sculpt/Builder/Combat doivent rester GREEN ; publication via PR infrastructure Pages seulement ensuite. **NE PAS DÉCLARER GREEN final avant test smartphone par créateur**.
- **Hors périmètre R1** : murs polygonaux/dessin libre, portes dans murs personnalisés, fenêtres, toiture escamotable, étages intérieurs complets, raccord permanent de SculptTerrain au WorldDocument final. Les anciens outils Builder restent distincts pendant cette tranche ; aucune promesse de migration intégrale en R1.
