# LAB_CURRENT_WORK — Parcours présets : traverser + déclencher un combat

Date : 2026-10-28
Base CI GREEN : `32e38b07227a7e85426fa64fc15fdb1a81416ad0`
Branche : `work/exploration-preset-playable-travel-encounters-2026-10-28`
Checkpoint START : `checkpoint/exploration-start-preset-playable-travel-encounters-2026-10-28`
Dernier checkpoint : `checkpoint/exploration-world-map-legacy-compatible-navigation-ci-green-2026-10-28`
Statut : diagnostic utilisateur répété, lot fonctionnel non déclaré GREEN.

## Reproduction et causes racines
1. Les tests Chromium précédents déplaçaient manuellement les Portals près du Spawn avant de vérifier les changements de carte. Ces tests ne garantissent pas les destinations telles que créées par un préset. La réparation n'examine qu'un seul Portal historique et le test en jeu désactive « Entrer » vers une zone héritée incompatible (2400×1600).
2. `createBlankWorldBuilderDraft` ne fournit pas `encounterConfig` ; la normalisation du WorldDocument initialise des chances à 0%. Les nouveaux présets ont `randomEnabled=true` mais ne peuvent pas provoquer de rencontres si le profil n'a jamais été configuré. Le test « typeof chance === number » laissait passer 0%.

## Owner / invariants
- **Données** : WorldDocument/WorldArea/Portal/Spawn et EncounterConfig sont seules autorités. Les préréglages sont des données d'initialisation, pas un deuxième runtime.
- **Monde existant** : préserver toutes les tailles, scènes et configurations manuelles. Aucun réglage à 0% choisi par le créateur n'est changé sans confirmation explicite.
- **Runtime** : `findTriggeredPortal`, `applyPortalTransition`, `createEncounterController` et `resolveTerrainFamilyEncounter` restent autoritaires. Pas de téléportation de l'UI, pas de reset/retry global.
- **Périmètre** : initialisation des probabilités des nouveaux WorldDocuments, commande de remise en état explicite pour anciens mondes vierges, Portals bidirectionnels placés sur le chemin des présets, réparation des passages historiques au point d'usage.
- **Hors périmètre** : augmenter 80×64, toucher main/V80 ou combat dynamique.

## Gates exigés
TDD RED (nouveau monde non nul + véritable rencontre + deux passages réciproques non déplacés à la main + anciens 2400×1600 + refus), suite Node complète, CI Exploration/Combat, Chromium paysage smartphone sur la preview réellement assemblée, vérification HTTPS; checkpoint GREEN avant publication isolée. Validation manuelle Pixel requise avant fusion du gameplay.

## Fiabilité de la gate CI (dans ce même lot)
- Des runs Chromium anciens, toujours actifs malgré un `core-tests` terminé, ont saturé les runners et empêché la dernière validation navigateur. Le script Chromium de ce lot possède désormais un watchdog CDP de 60 secondes qui **échoue explicitement** en cas de blocage ; aucun succès n’est simulé.
- Le workflow utilise une concurrence par branche et annule uniquement les validations dépassées du même chantier ; la gate Chromium a une limite d’exécution explicite de 15 minutes. Une expiration est un **échec rouge**, jamais une autorisation de publier.
- Ne pas fusionner ni publier sur cette seule base : obtenir les sorties Core + Combat + Chromium réelles du SHA final et compléter la validation Pixel.


## 2026-10-29 — Raccordement du vrai Combat main (même chantier, sans fusion gameplay)
- Autorité Combat: checkout direct de `GenSrpg_labo_combat_dynamique/main` dans la CI, adaptateur Capture versionné `integration/combat-bridge/`, sans comparer le SHA, les fichiers, les capacités ou les sprites par égalité absolue. L'éditeur Combat demeure propriétaire de son HUD, CombatSession des PV et attaques, et Exploration de son WorldDocument.
- Preview Lab: la party `capture-party-player-v1` est une fixture explicitement déclarée dans `party.preview.v1.json`; ce n'est pas encore la sauvegarde du joueur GenSrpg. Le retour Combat passe par `CaptureCombatResult` corrélé et le signal iframe même origine, jamais par résultat forgé.
- Correctif cause-racine propriétaire Combat: la vraie activation d'une compétence à approche instantanée révélait une erreur Animation Core; corrigée dans Labo Combat PR #131, main squash `2e18bda047eb8f4f91115c2198dcc3ec4e02312c` après run #40840789990 GREEN 5/5. Aucun changement de formule, de durée de combat, ni de catalogue.
- Gates Exploration: auditeur compatible avec les évolutions de Combat, Node avec véritables compétences Combat, Chromium de marche 2D/2.5D + iframe+HUD et retour après KO réellement joué. La publication isolée reste conditionnée au CI du SHA exact et à une preview réellement reconstituée à partir du moteur Combat main.
