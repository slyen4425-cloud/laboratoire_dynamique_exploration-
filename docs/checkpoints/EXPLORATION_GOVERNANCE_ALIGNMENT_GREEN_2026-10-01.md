# Checkpoint GREEN — Governance Alignment

Date : 2026-10-01

## Chantier
Alignement du laboratoire Exploration sur la charte officielle GenSrpG.

## Branche source
`work/exploration-governance-alignment-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-governance-alignment-2026-10-01`

## SHA de base
`35d4cf3666fd2f6d99eecdd34ba7b6ef37346063`

## Source GenSrpG de gouvernance
Branche :
`work/gensrpg-phase8-tactical-consolidation-preaudit-2026-10-01`

SHA :
`9fd5a789180e26204833e9d6b330079352272ec6`

## Périmètre validé
- charte ;
- règles de développement ;
- matrice de propriétaires ;
- architecture ;
- garde-fous techniques ;
- coordination ;
- politique de checkpoints ;
- manual test gate ;
- contrat d'intégration ;
- roadmap ;
- sentinelles CI.

## Garantie fonctionnelle
Aucun fichier runtime `src/` modifié.
Le comportement Phase 0 reste gelé.

## CI
- tests Phase 0 : GREEN ;
- sentinelles architecture : GREEN ;
- aucune mécanique globale interdite détectée ;
- Core sans dépendance DOM.

## Invariants ajoutés
- 1 lot = 1 branche = 1 périmètre ;
- checkpoint start avant toute modification ;
- propriétaire unique ;
- une source de vérité ;
- pas de rustine globale ;
- pas de gameplay important codé en dur ;
- contrats versionnés ;
- Builder produit des données ;
- mobile-first ;
- régression = test permanent ;
- intégration future par contrats, jamais par copie aveugle.

## Étape suivante
Phase 1 Exploration Core, mais uniquement après création de son checkpoint de départ et de sa branche dédiée.
