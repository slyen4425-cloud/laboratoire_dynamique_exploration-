# V77 R3 — Pente du terrain : outil tactile simplifié

Date : 24 octobre 2026.

## Besoin / origine
- L'utilisateur valide le fonctionnement de la pente native V77 R2 mais indique que « l'outil est pas pratique ».
- Socle publié V77 R2 `eb0c18d67885b9ea5c865905a609babf53b5240a`. START immuable `checkpoint/exploration-start-slope-touch-ux-v77-r3-2026-10-24`.
- Règle : **aucun changement de la géométrie/physique, sauvegarde ou textures** ; seule l'ergonomie de l'outil `Terre → Créer une pente` évolue. Le rendu et la logique des escaliers V78 R2 explicitement validés restent gelés.

## Contrat de l'outil
- Contrôle souris et toucher direct même lorsque le mode précision, actif par défaut sur smartphone, est coché. Les AUTRES modes restent inchangés.
- En deux touches : première touche sur le pied bas (état éphémère), seconde touche sur le plateau haut pour valider. Un long glissement bas→haut crée également une pente en un seul geste. Lorsqu'une seconde touche n'est pas raccordée, conserver le point de départ et expliquer pourquoi ; sans écriture ni Undo intermédiaire.
- Prévisualiser la largeur réelle de la pente, ses extrémités numérotées 1/2, et vert si géométrie exacte valide, ambre sinon. L'aperçu se limite aux services EXISTANTS `appendSculptTerrainRamp`, `sculptTerrainRampProjections` et `sculptRampVisualMesh` ; jamais de copie des règles de collision.
- Bouton « Changer le pied » : réinitialise le choix en cours, sans retirer les pentes déjà commises. Un seul commit d'annulation par pente placée, Annuler/Rétablir du relief réutilisés. La palette existante expose le parcours, sans nouveau panneau bloquant.
- La seule mutation persistante reste `terrain.ramps`, avec sérialisation ancienne compatible.

## Tests et limites
- `tests/sculpt-ramp-touch-ux-r3.test.js` : point de départ/fin, mode précision par défaut, rendering exact, refus de prévisualisation incorrecte, indépendance de l'objet.
- `scripts/smoke-sculpt-terrain-lab.mjs` : vrai Chromium, création via deux clics, aperçu vert, mode précision actif, création via drag, undo/redo, annulation du pied. Tous les autres tests Node et Chromium du labo sont maintenus.
- Preview Pages seulement si CI verte. **Pas GREEN utilisateur** avant essai Pixel et retour. Si l'utilisateur voulait un type d'interaction différent, recueillir précisément ce retour pour adapter la prochaine révision au lieu de prétendre que l'ergonomie est définitivement validée.
