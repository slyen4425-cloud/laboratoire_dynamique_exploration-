# LAB_CURRENT_WORK — Parcours jouable entre zones 2,5D et rencontres Capture

Date : 2026-10-28
Base GREEN : `13f6254e8825b33edda59e6ed6b5edc4c021e419`
Branche : `work/exploration-playable-zone-routes-2026-10-28`
Checkpoint START : `checkpoint/exploration-start-playable-zone-routes-2026-10-28`

## Reproduction et correction
Sur mobile, le joueur voit `SORTIE → area-principale` et `Passage impossible en 2,5D`. Son portail vise une WorldArea historique 2400×1600, non éditable dans la grille Sculpt 28×21 (max 80×64). Le précédent garde-fou empêche la panne mais ne fournit pas de route alternative.

Commande explicite « 🔗 Relier zones jouables » dans le World Builder : utilise une autre WorldArea extérieure compatible, ou crée les scènes nécessaires depuis les présets officiels ; recible un Portal point vers une zone réellement incompatible, établit le trajet réciproque avec `connectWorldAreas`, et définit un départ jouable si l'ancien départ ne l'est pas. Confirmation préalable ; **aucune zone historique supprimée ni réduite**. Un Portal vers une zone intérieure valide ne doit PAS être reciblé.

Lorsqu'on crée un préset depuis une zone hôte incompatible, demander explicitement si cette nouvelle carte doit être créée comme zone de départ indépendante et conserver l'ancienne WorldArea ; ne plus créer un lien condamné à échouer. Les présets ont déjà des maisons/intérieurs raccordés.

## Rencontres
Labo 2,5D utilise le même `createEncounterController`, `WorldArea.encounters.randomEnabled`, `WorldDocument.encounterConfig`, `CaptureCreatureCatalogPreviewV1`, `createImmersiveEncounterHostV1` que le système validé. Les zones extérieures des présets héritent de `randomEnabled=true`, les intérieurs restent désactivés par défaut. Le panneau Rencontres sélectionne la famille de terrain de la nouvelle zone au passage (aucune deuxième configuration).

## Validation / garde-fous
1 WorldDocument, WorldArea, Portal et Spawn comme autorités ; TDD Node, Chromium 960×540 parcours de réparation réel avec dialogue accepté, CI Core+Combat, Pages isolées V80 immuable. Déploiement après GREEN et test manuel sur Pixel ensuite. Aucun changement sur le monde historique sans clic explicite.
