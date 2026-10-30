# Exploration V76 R3 — Prévalidation technique (23/10/2026)

## Validation et périmètre

Retour explicite du créateur : V76 R2 possède du volume, mais les flancs doivent être texturés (roche, herbe, terre), le sommet doit avoir une largeur réglable pour les colonnes/plateaux et les anneaux du pinceau ne doivent pas rester visibles après l'édition. V76 reste NON GREEN Pixel, malgré le volume accepté. Dernier GREEN utilisateur : V75 R2 `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`.

Base opérationnelle V76 R2 : `43e6082afdaac4c85e2bbaa828d4cb3e8c23b08f`. Checkpoint START immuable : `checkpoint/exploration-start-sphere-visual-v76-r3-2026-10-23`; branche de travail UNIQUE : `work/exploration-sphere-visual-v76-r3-2026-10-23`.

## Modifications

- World Model : chaque sphère peut spécifier `summitRatio` (0..0.85, rapport du rayon sommital sur le rayon externe) et `wallMaterial` (`rock`, `grass`, `earth`). Le profil radial partagé par le rendu est plat jusqu'au rayon sommital, puis raccordé en calotte de sphère au rayon extérieur. `summitRatio=0` préserve la formule historique. Import/export JSON et Undo restent canoniques ; anciens documents sans ces champs acceptés sans migration.
- Renderer : flancs effectivement colorés/texturés suivant le matériau choisi, atlas de roche existant réutilisé si chargé, texture de détail de repli sur mobile, plateau supérieur/fond de cavité plat conforme au profil World Model. Les anneaux concentriques autrefois peints définitivement dans le maillage sont supprimés. Le contour de la falaise reste un bord de silhouette, pas un guide d'édition.
- UI tactile : commandes « Largeur du sommet » (0..85 %) et « Flancs roche/herbe/terre » dans les outils Terre lors de la pose d'une nouvelle sphère ; curseur de placement éphémère, masqué après application et après le lever du doigt.
- Collision World : INCHANGÉ. La marche sur petits reliefs sera définie dans le lot V77 distinct après validation V76 R3. Ne pas créer de seconde source de collision.
- Gel : ponts sur/sous V73, assets ponts V74, cascades V3, terrain ancien, nage/vol, Builder/Combat, sauvegardes historiques et caméra.

## Preuves avant publication

- Node `tests/sculpt-spherical-relief-v76.test.js` : plateaux 0/60/85 %, trou à fond plat, textures distinctes, compatibilité vieux JSON, contraintes d'import, même empreinte bloquante, absence d'anneaux du renderer.
- Chromium `scripts/smoke-sculpt-terrain-lab.mjs` : vraie pose au pointeur avec largeur 75 % et texture Terre ; export scène et absence de guide après pointerup, smoke de l'ancien labo.
- `npm test && npm run check`, Chromium Sculpt/Builder/Combat et CI sur le SHA **final** du lot.
- Comparer la branche R2 -> R3 : aucun `assets/` modifié ; 28 WebP ponts et 20 WebP cascades conservés.
- Publication Pages par PR d'infrastructure épinglée au SHA final éprouvé, jamais fusion de code métier dans main.

**Statut : prévalidation technique ; NON GREEN Pixel jusqu'à essai créateur de colline ronde, colonne à sommet large, trou, choix des matériaux, disparition du guide et invariants ponts/cascades. V77/V78 gelés.**
