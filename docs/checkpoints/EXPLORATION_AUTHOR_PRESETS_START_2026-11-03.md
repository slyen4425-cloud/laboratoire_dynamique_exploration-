# START — deux cartes auteur livrables en presets intégrés — 03/11/2026

- Branche de départ : `work/exploration-passability-overlay-2026-11-02`.
- SHA initial : `c7e42cb35f37b2bb38c5943b84755a9b8f46e938`.
- Checkpoint : `checkpoint/exploration-author-presets-start-2026-11-03`.
- Travail : `work/exploration-author-presets-forest-plain-2026-11-03`; PR draft #337, dépend de PR #335, candidate #329.
- Périmètre : incorporer, sans les retoucher, les scènes `foret_1` et `plaine_1` du WorldDocument `nouveau-monde.world.json` partagé le 3 novembre : deux templates codés dans le catalogue officiel, pas deux sauvegardes localStorage ou autorités WorldDocument. Retirer les huit anciens modèles procéduraux du catalogue officiel tout en préservant les sauvegardes utilisateur existantes ; ne distribuer que les deux cartes auteur.
- Tests d'acceptation : mode navigateur vierge expose uniquement Forêt 1 et Plaine 1 (2 cartes) ; Forêt 1 80×60, 142 objets, 5 routes ; Plaine 1 80×60, 64 objets, 14 routes et 7 rampes ; données auteurs intactes ; conversion en vraie WorldArea avec la logique existante ; tests historiques et CI.
- Publication Pages / GenSRPG **interdite dans ce lot** : l'utilisateur apporte encore les moulins et éoliennes dans une autre conversation, puis demandera validation du raccord Minds/GenSRPG.
- Pas de GREEN produit sans test de CI et validation manuelle ultérieure.
