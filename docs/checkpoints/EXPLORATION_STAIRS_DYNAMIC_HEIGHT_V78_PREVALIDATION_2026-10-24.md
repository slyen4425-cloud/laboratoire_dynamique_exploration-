# Exploration V78 — Escaliers à hauteur dynamique pied → tête (24 octobre 2026)

## Demande exacte
Chaque escalier reprend le niveau physique du terrain à son pied et le niveau réel du terrain à sa tête. Un escalier plus long peut grimper plusieurs niveaux, sans règle artificielle « +1 ». Plusieurs escaliers peuvent se suivre avec jonction sur une plateforme intermédiaire. Montée et descente empruntent le même couloir autorisé.

## Gouvernance et base
- Source de départ R15 publiée : `9b410c1a1c2428c9306456ba3f01dd15de31fc6f`.
- Dernière validation utilisateur explicite : coins nets V76 R14 ; source `9f56549c07715e44c565ca905b83d8c5006ae792`.
- START immuable : `checkpoint/exploration-start-stairs-dynamic-height-v78-2026-10-24`.
- Branche : `work/exploration-stairs-dynamic-height-v78-2026-10-24`.

## Autorité unique et changements
- `src/core/sculpt-stair-traversal.js` calcule un couloir orienté depuis le WorldObject `kind:stairs`, sans géométrie dupliquée ni lecture de pixels. Bas = ancre au pied sur terrain sec ; tête = extrémité de longueur native `baseSize.height × scaleY` avec terrain sec. La largeur vient de `baseSize.width × scaleX` avec marge. Les deux niveaux sont lus uniquement dans le heightfield canonique. Si tête au même niveau, plus basse, hors carte, en eau ou dénivelé incompatible avec la longueur, **pas de passage**.
- `src/core/sculpt-navigation-collision.js` autorise le déplacement uniquement le long du couloir valide et les entrées/sorties à ses bouts. Collision World reste propriétaire de la décision, mêmes contrôles d'eau/sphères ; ponts, falaises hors escaliers et vol inchangés.
- `src/core/movement.js` : même commit atomique du déplacement monde X/Y et des états de portage `sculptBridgeId` / `sculptStairId`, obtenus d’une seule route pure. Aucun téléport ni second modèle de position.
- `src/sculpt-lab-main.js` : longueur et largeur indépendantes (25–300 %) via les contrôles natifs existants, statut et altitude du héros interpolée depuis la même géométrie. Les vues Face/3-4/Côté restent des variantes visuelles sans modifier la collision.
- `src/render/sculpt-object-picking.js` : allonge visuellement la montée de l’image en tenant compte du différentiel d’altitude entre deux vrais niveaux ; rendu esthétique à vérifier surtout lors d'une rotation oblique.
- Sauvegarde/import : mêmes `WorldObjectPlacement` et `SculptTerrain` ; pas de migration ni changement de schéma.
- Fichiers de tests V56/V69 ajustés pour protéger les mêmes invariants pont tout en lisant le nouveau raccord atomique et le nouveau sélecteur commun, sans masquer une régression réelle.

## Contrôles techniques et validation
- Test Node ciblé `tests/sculpt-stairs-dynamic-height-v78.test.js` : pied/tête 2→5, étage réel différent de +1, refus escalier trop court, agrandissement puis montée et descente réelles via `stepMovement`, entrée latérale refusée, eau/rotation/largeur, scène JSON intacte, deux escaliers 2→4→6 puis retour.
- Gates exigés : Node `npm test`, `npm run check`, Chromium Sculpt/Builder/Combat, CI sur SHA final, publication par PR Pages pin d'infrastructure seulement.
- **NON GREEN Pixel jusqu’au contrôle manuel** : escalier correctement raccordé, héro monte progressivement sur le visuel, descend et peut rejoindre deux escaliers consécutifs sans franchir les parois latérales.
- Pentes naturelles V77 : futur lot autonome, pas inclues dans le présent correctif d'escaliers.
