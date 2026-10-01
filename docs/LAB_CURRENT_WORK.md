# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-01

## Chantier actif
Alignement de gouvernance sur la charte officielle GenSrpG.

## Branche
`work/exploration-governance-alignment-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-governance-alignment-2026-10-01`

## SHA de base
`35d4cf3666fd2f6d99eecdd34ba7b6ef37346063`

## Dernier checkpoint GREEN fonctionnel
`checkpoint/exploration-phase0-bootstrap-green-2026-10-01`

SHA :
`35d4cf3666fd2f6d99eecdd34ba7b6ef37346063`

## État fonctionnel gelé
Phase 0 GREEN :
- déplacement continu X/Y ;
- stick tactile mobile ;
- diagonales normalisées ;
- collisions ;
- caméra ;
- aucune case comme autorité ;
- CI GREEN ;
- test smartphone validé ;
- preview GitHub Pages fonctionnelle.

## Périmètre du lot actuel
Documentation et gouvernance uniquement :
- aligner la charte ;
- définir propriétaires ;
- définir garde-fous ;
- définir procédure checkpoint ;
- définir règles de coordination ;
- définir contrat d'intégration future.

## Propriétaire
Coordination/architecture du laboratoire Exploration.

## Systèmes réutilisés
- politique de gouvernance GenSrpG ;
- principes Core/Shell/modules ;
- stratégie de tests sentinelles ;
- principe mobile-first.

## Fonctions gelées / à ne pas toucher
Tout le runtime Phase 0 :
- mouvement ;
- collision ;
- caméra ;
- input ;
- renderer ;
- demo world.

## Fichiers runtime autorisés
Aucun dans ce lot.

## Tests prévus
- aucun changement runtime ;
- CI existante doit rester GREEN ;
- revue du diff : documentation uniquement.

## Risque inter-module
Nul en runtime. Le but du lot est précisément de réduire le risque d'intégration future.

## Source de gouvernance GenSrpG relue
Branche :
`work/gensrpg-phase8-tactical-consolidation-preaudit-2026-10-01`

Documents :
- GENSRPG_CHARTE ;
- GENSRPG_DEVELOPMENT_RULES ;
- GENSRPG_CHECKPOINT_POLICY ;
- GENSRPG_COORDINATION ;
- GENSRPG_TECHNICAL_GUARDRAILS ;
- GENSRPG_MODULE_OWNERSHIP ;
- GENSRPG_MANUAL_TEST_GATE ;
- GENSRPG_RESTRUCTURATION_ROADMAP.

## Prochaine étape
Après checkpoint GREEN de ce lot :
- créer un **nouveau checkpoint de départ Phase 1** ;
- seulement ensuite reprendre le code Exploration Core.
