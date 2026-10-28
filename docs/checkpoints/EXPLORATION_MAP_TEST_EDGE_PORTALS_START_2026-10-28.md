# START — Options de test, passages jouables et cartes à traverser
Date : 2026-10-28
Branche : `work/exploration-map-test-options-edge-portals-2026-10-28`
Point de départ GREEN : `81304cc6d4bc3151f24673c218c70e2196621e86` (CI 873/873 ; preview isolée)
Checkpoint START : `checkpoint/exploration-start-map-test-options-edge-portals-2026-10-28`
Propriétaires : navigation de test = Exploration, portail et arrivée = WorldDocument / Portal / Spawn, bibliothèque = scène Sculpt existante.
Problèmes : HUD de test non repliable ; entrée préset au milieu ; sortie Portal absente sur les présets extérieurs créés.
Périmètre : panneau natif repliable par défaut, présets reliés à la zone sélectionnée via de vrais Portals réciproques, Spawn côté entrée et Sortie bord opposé au plus près du chemin.
Invariants : V80 intacte, pas de second modèle de carte, présets sans topology, compatibilité anciens Portals, aucune migration silencieuse, pas de masquage.
Tests : Node RED->GREEN, chemin vrai Portal -> Spawn -> test jeu, smoke Chromium mobile, vérification CI/Pages.
Risque : carte existante volontairement non repositionnée ; seuls les futurs instanciations depuis préset reçoivent cette disposition.
