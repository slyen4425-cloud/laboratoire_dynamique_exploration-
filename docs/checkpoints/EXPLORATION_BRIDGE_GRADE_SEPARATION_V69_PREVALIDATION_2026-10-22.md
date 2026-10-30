# Prévalidation V69 — Deux couches de circulation aux ponts (22/10/2026)

## Base / gouvernance
- Base publique V68 : `9cce0e7dfdcff26c4385442babd4234175ba1c21`.
- Checkpoint START : `checkpoint/exploration-start-bridge-grade-separation-v69-2026-10-22`.
- Branche source : `work/exploration-bridge-grade-separation-v69-2026-10-22`.
- Diff strict : seule la prévisualisation Sculpt (Core Collision/Mouvement, adapter Render, cache module), tests et documentation.

## Propriété des données
- Altitude et couche de pont ne dérivent jamais de l'alpha WebP ni de la caméra.
- Le Collision World retourne sans mutation `sculptNavigationRoute().{reason,bridgeId}`.
- Seul l'Exploration Engine valide et inscrit `entity.sculptBridgeId` lors du commit X/Y.
- La couche reste temporaire et absente du WorldDocument/2D ordinaire.

## Comportement V69
- Approche par berge réelle à hauteur tablier : monter sur le pont (y compris pont 250 % dont le début couvre déjà une portion de la berge).
- Sur le pont : aucune sortie latérale vers le fond ; sortie en bout sur vraie berge sèche et de hauteur compatible.
- Sous le pont : traversée sur terrain bas, sans téléportation sur la passerelle ; l'eau garde la nage obligatoire.
- Aucune traversée de pointe rocheuse dépassant la hauteur du tablier.
- La caméra 35/55/80/90° ne change pas le niveau physique ; occlusion correcte dessus/dessous.
- Aucun changement de WebP, décor, définitions WorldObject ou moteur Combat.

## Sentinelles
- `tests/sculpt-bridge-grade-separation-v69.test.js` : ponts secs et humides, aller-retour, 4 échelles, bord, sous-pont, swimming, angles, isolement runtime 2D.
- Legacy V17, V55, V57, V60, V62, V63, V67, V68 conservés.
- CI complète préliminaire `#39718959104` SUCCESS, source `ae5156635e7256782c539f140281e08461468470` (Node + vrais Chromium/Combat).
- Toute mise à jour du présent document oblige à relancer la CI sur le nouveau SHA avant un checkpoint de source prévalidé.

## Statut et validation
- **Prévalidation technique seulement**, sous réserve CI du SHA final.
- **NON GREEN tactile et visuel** jusqu'au test du créateur sur Pixel (pont haut, bords, passage sous pont, vues 35°/80°).
- Ne pas fusionner le code de laboratoire sur `main`. Pour une preview Pages, seule l'infrastructure de déploiement épinglée au SHA immuable est fusionnable après SUCCESS.
- Retour arrière : revenir au source V68 `9cce0e7dfdcff26c4385442babd4234175ba1c21`.
