# START — Relier les zones jouables en 2,5D, préserver les mondes historiques
Date : 2026-10-28
Base CI GREEN : `13f6254e8825b33edda59e6ed6b5edc4c021e419`.
Checkpoint : `checkpoint/exploration-start-playable-zone-routes-2026-10-28`.
Branche : `work/exploration-playable-zone-routes-2026-10-28`.
Reproduction Android : la forêt montre SORTIE → area-principale, bouton disabled « Passage impossible en 2,5D ». Ce dernier garde-fou est correct, mais l'utilisateur ne dispose d'aucun raccord vers une deuxième zone jouable.
Objectif : command explicite du World Builder « Relier des zones jouables » qui réoriente le Portal bloqué vers une zone compatible ou crée les cartes manquantes, pose des Portals réciproques, et choisit un départ 2,5D si le départ actuel est legacy. La zone 2400×1600 reste intacte. Pour les nouveaux présets, ne jamais relier de nouveau Portal vers un hôte incompatible sans avertissement/choix explicite.
Autorité : WorldDocument/WorldArea/Portal/Spawn existants, validation `sculptWorldAreaScene`, même contrôleur de rencontres et CaptureCatalog ; aucun nouveau graphe.
TDD RED→GREEN, Node + Chromium paysage, CI, checkpoint GREEN, preview Pages isolée et V80 inchangée.
