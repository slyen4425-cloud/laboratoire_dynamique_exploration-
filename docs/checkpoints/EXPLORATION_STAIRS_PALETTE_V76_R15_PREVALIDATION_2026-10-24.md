# Exploration V76 R15 — 10 escaliers 2,5D visibles et plaçables (24 octobre 2026)

## Contexte et point de reprise
- Le créateur a validé visuellement sur Pixel les angles carrés et la suppression du lissage R14 (« Ok c est bon »). Checkpoint source GREEN : `checkpoint/exploration-square-no-smoothing-v76-r14-green-2026-10-24` au SHA `9f56549c07715e44c565ca905b83d8c5006ae792`.
- Dix escaliers ont déjà **30 visuels WebP (face, oblique, côté)**, enregistrés dans le résolveur d’assets, le catalogue natif et les tests binaires. Mais `src/world/sculpt-scene-preview.js` autorisait seulement `building/tree/rock/bridge/decor` : aucune définition `stairs` n'était exposée ou importable dans Sculpt. La palette HTML n’avait pas cette catégorie. Ce n’était pas un échec de chargement des images.
- START : `checkpoint/exploration-start-stairs-visible-v76-r15-2026-10-24`. Branche source : `work/exploration-stairs-visible-v76-r15-2026-10-24`.

## Correction minimale de l'éditeur
- Rendre le kind natif `stairs` autorisé dans le registre de placements du Labo, réutilisé par placement, sélection, déplacement et sauvegarde/import ; pas de schéma concurrent.
- Ajouter la catégorie `🪜 Escaliers` dans la palette Objets. Les 10 modèles 2,5D et 3 anciens utilisent la même liste native. Les 3 vues (Face, Trois-quarts, Côté) proviennent directement des variants de définition.
- Cache Android : révision d'URL de `sculpt-lab-main.js` et de l'import du composant Scene Sculpt.
- Test `tests/sculpt-stairs-palette-v76-r15.test.js` : 10 familles × 3 vues, 3 anciens escaliers, collision d'eau des placements, transformation et sauvegarde de scène, source UI.

## Frontière et validation
- **Aucun escalier franchissable par défaut : ce lot est uniquement visuel / placement**. Le franchissement doit lire les vrais niveaux du World Model et autoriser des transitions uniquement dans un couloir d'escalier valide ; aucune image de marche ne doit servir de collision.
- Gel : Collision World R12, Sphere Renderer, modèle terrain, patrimoine JSON, sérialisation, heroScale, ponts, eau, 33 assets escaliers, Combat, Builder et GenSrpG principal.
- Gates : CI Node et Chromium (sculpt/builder/combat) au SHA final, publication par PR d'infrastructure uniquement après CI success.
- **Statut PREVALIDATION / NON GREEN Pixel**. Critère final : ouvre Objets > Escaliers, pose un modèle, change Face / Trois-quarts / Côté, déplace et exporte/recharge la scène sans disparition du modèle.

## Suite, lots indépendants non commencés
- **V77 Pentes** : contrat de passage du niveau n au niveau n±1 sur surfaces de pente explicitement déclarées (pas sur flancs de falaise), interpolation visuelle sans altérer la position canonique X/Y, verrouillage latéral, sauvegarde/undo, sentinelles de collision sur sphères, ponts, eau et vol.
- **V78 Escaliers franchissables** : couloir d'accès issu du WorldObject `stairs`, orientation et échelles X/Y, vérification de deux extrémités sur hauteurs admissibles, progression/régression sans téléportation, éventuelle composition avec le même contrat de montée V77. Les ponts et escaliers ne doivent pas avoir un contrôleur de déplacement concurrent.
