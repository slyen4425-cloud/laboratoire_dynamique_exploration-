# GenSrpG Exploration — Copier un WorldObject vers le pinceau (14 octobre 2026)

## Source et gouvernance
- Retour créateur : ne plus dupliquer immédiatement ; mémoriser les réglages d'un objet (rocher agrandi, pivoté), puis tamponner autant de nouveaux objets de même taille/orientation que souhaité.
- Branche `work/exploration-builder-object-copy-stamp-2026-10-14`, base du lot `8051c31c195fcd30a5dd733b89492778168a4aa1`.
- Checkpoint START `checkpoint/exploration-start-builder-object-copy-stamp-2026-10-14`. Charte, current work, architecture et ownership respectés ; ne pas fusionner le Builder modifié vers main.
- Autorité des objets : `WorldDocument` et mutation canonique `addWorldObject`. Uniquement état de presse-papiers éphémère en Builder, aucun second stockage d'objets.
- Composants : `src/builder/world-object-stamp-preset.js` (contrat pur), `src/builder/world-builder-main.js` (input UI), `builder.html` (bouton et statut), `tests/builder-object-copy-stamp.test.js`.

## Comportement
1. Sélectionner un objet placé ; régler sa rotation, ses échelles X/Y avec les champs existants.
2. Cliquer « Copier » (ancien libellé « Dupliquer »). Aucun nouveau placement créé à ce stade ; le pinceau `Placer objet` est armé.
3. Toucher la carte à plusieurs positions pour déposer plusieurs nouveaux exemplaires indépendants.
4. Chaque exemplaire conserve `objectDefinitionId`, `scaleX`, `scaleY`, `rotationDeg` et éventuellement `visualVariantId`. L'ID et la position sont toujours nouveaux, les références `traversalSurfaceFeatureIds` restent vides.
5. Choisir explicitement un autre modèle ou l'action « Choisir et placer » réinitialise le preset (taille normale ×1, rotation 0°).
6. Carte vierge, import JSON et restauration de démo effacent le presse-papiers temporaire, pas les placements du WorldDocument.
7. Statut « Copié : taille X, Y, rotation » affiché dans la barre d'objets, y compris dans le mode plein écran.

## Tests et non-régressions
- TDD initial RED : `f42c1b49b0378213e04122880af35e95e76ba5e4`.
- CI code `38592981758` au SHA `05f33cf8e3d92796663d3939a8c70c55998bff7f` : SUCCESS, **452/452 tests + npm run check**.
- Tests : snapshot figé vs changements ultérieurs de la source ; deux tampons avec IDs distincts ; scale/rotation héritées ; variantes ; sortie spatiale non copiée ; export/import canonique ; choix d'un autre modèle = normal ; sentinelles UI.
- Réutilisation du système de placement tactile, coalescing et DPR plein écran du lot précédent ; aucun changement dans moteur collision, runtime, Combat ou caméra configurable.
- Gate utilisateur : sur smartphone, agrandir un rocher, copier, placer trois exemplaires en plein écran, modifier l'un des trois, confirmer indépendance ; changer modèle et vérifier taille normale, exporter puis réimporter ; contrôler fluidité.
- **GREEN TECHNIQUE / PREVALIDATION seulement**. Publication Pages et validation tactile réelle nécessaires avant GREEN FINAL.
