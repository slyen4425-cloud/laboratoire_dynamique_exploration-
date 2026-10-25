# V79 R3A2 — Prévalidation de la porte et du tracé mural (25/10/2026)

**Statut : PREVALIDATION technique ; pas GREEN final.** Le créateur a validé la caméra 35° R3A mais pas les outils porte/murs R3A2 sur Pixel.

## Références de gouvernance
- Base V79 R3A : `f57a365a8d34fa3c0e69c5eb93823933fa1abf33` (CI `40153513287`, preview `40177965144`).
- START checkpoint immuable : `checkpoint/exploration-start-interior-door-wall-usability-v79-r3a2-2026-10-25`.
- Branche : `work/exploration-interior-door-wall-usability-v79-r3a2-2026-10-25`.
- Prévalidation code : `dabb04e63942a776088ab0f7566ae52ebf62d657`, CI `40179102071` SUCCESS (Node, Chromium vrai mouvement et rendu).
- Publication preview uniquement par PR infrastructure qui pointe un SHA testé ; aucune fusion du travail métier sur `main`.

## Réalisé
1. Porte : base provisoire réduite à **58 %** de la précédente, taille adjustable (35–125 %) via le seul `exitPortal.visual.scale`; rendu à échelle relative au pied de porte.
2. Repositionnement : mode tactile « Déplacer la porte », aperçu au glisser, validation au relâchement, export/import ; source de gameplay toujours `exitPortal.trigger`, sans trigger invisible annexe.
3. Arrivée depuis extérieur : le `WorldArea.spawns['entrance']` suit la nouvelle porte, à l'intérieur de la pièce ; l'entrée extérieure reste `Portal` au `building-door anchor` du bâtiment (non modifiée).
4. Murs : appuyer-glisser-relâcher ou deux touches, grille, accroche aux extrémités existantes, verrouillage horizontal/vertical par défaut, option diagonale ; Undo/Redo et collisions issus du seul `WorldArea.walls`.
5. Mode construction : palette intérieure compacte, prévisualisation de ligne et points, sans régresser le mode hors intérieure.

## Contrôles et gel
- Tests Node : modèles, ancienne scène sans scale, JSON, normalizePortal, arêtes de murs et gestion d'entrées.
- Vrai Chromium (smoke SculptLab) : deux touches historiques, drag d'une cloison, Undo/Redo, portail de jeu, scale porte, repositionnement et Spawn exporté.
- CI `40179102071` : SUCCESS sur code `dabb04e6`.
- Caméra 35° **explicitement validée par le créateur**, pas modifiée dans ce lot.
- Pentes V77, escaliers V78, autres systèmes, Combat et main GenSrpG inchangés.
- R3B portes internes/ouvertures et étages hors périmètre ; dans cette prévisualisation, les murs restent pleins, sans portes internes découpées.

**Prochaine gate :** déploiement Pages depuis le SHA CI vérifié, essai concret sur Pixel, puis décision GREEN/R3B.
