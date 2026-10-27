# V79 R3A — Murs intérieurs, porte jouable, caméra 35° — PRÉVALIDATION

Date : 25 octobre 2026. **NON GREEN final : attente essais réels Pixel du créateur.**

## Cause
Sur V79 R2, l'éditeur fonctionnait mais le créateur a signalé :
- interaction maison cachée dans les options de Tester au lieu de l'écran de jeu ;
- représentation de porte minuscule, texte « Sorti » ;
- liaison de la pièce au bâtiment peu claire ;
- absence de pose de murs ;
- déformation visuelle à 35°.

Le retour « C'est mieux, mais... » n'est **PAS** une validation GREEN R2.
Ce lot correctif reste isolé et n'a aucun droit de fusion métier sur main.

## Source et charte
- START depuis V79 R2 : `fbfe8daae804504f8d18bb865fde8d315eafc49c`
- START immuable : `checkpoint/exploration-start-interior-ux-walls-v79-r3a-2026-10-25`.
- Branche métier : `work/exploration-interior-ux-walls-v79-r3a-2026-10-25`.
- Un propriétaire de chaque donnée : `WorldArea.walls` pour segments persistés, `Collision World` pour obstacle, `Renderer` pour pixels, `Portal` pour entrée et sortie, `Camera` pour projection.
- Pas de transfert de données vers main, pas de rustine de collision sprite, pas de variante de mouvement.

## Livrable
1. **Interaction** : l'action du Portal de maison apparaît dans le DOM de la scène de jeu, près du pouce droit lorsque le héros est à portée ; aucune commande d'interaction dans les réglages de l'éditeur. Le portail et le Spawn canonique restent inchangés.
2. **Visuel** : porte de dimensions crédibles, panneau boisé et encadrement dessinés provisoirement par le Renderer depuis le seul `exitPortal.trigger` ; aucun asset inventé ni collision issue de l'image.
3. **Raccord** : dans Objets > Sélectionner/modifier > maison, choisir « Créer et lier un intérieur à cette maison » ou « Modifier son intérieur lié ». Chaque maison garde Area / Portals / Spawns indépendants, et le modèle de pièce réutilisable n'emporte jamais ces références.
4. **Murs** : « Placer des murs », « Supprimer un mur », annuler/rétablir dans la palette intérieure. Pose par deux touches. Les segments vivent dans `WorldArea.walls`, sont contrôlés par `isBlocked` de Collision World et visibles en 2,5D via le seul Renderer. Sérialisation JSON, import, sauvegarde de modèle.
5. **Caméra** : même adapter et projection/inverse 35°–90°, mais intérieur sans cisaillement X induisant une pente artificielle des murs ; hauteur écran des murs et de porte adaptée au pitch.

## Vérifications exigées
- Node : modèles invalides/doublons, collision acteur avec mur, héritage WorldArea v6, Portals, JSON, modèles entre maisons, caméra inverse 35/55/90, marqueurs UI.
- Chromium réel : maison, choisir intérieur, 2 touches mur, Undo, Redo, test du bouton sur le terrain, export de mur, sortie et roundtrip.
- Régressions obligatoires : V77 pentes, V78 escaliers, ponts, eau, sphères, sols R2, Capture.
- **Aucune prétention GREEN ou publication Pages tant qu'un SHA précis n'a pas passé la CI complète.**

## Hors périmètre
Les portes ouvrables dans les cloisons (R3B), les pièces polygonales et raccords de sol (R3C), ainsi que les étages reliés et l'intégration WorldDocument runtime (R3D/R3E) restent à développer. La prévisualisation SculptLab n'est pas encore l'intégration finale en jeu.
