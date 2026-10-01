# GenSrpG Exploration — Coordination

## Coordinateur unique

Un seul fil directeur coordonne le chantier.

Règle :
**1 lot = 1 branche = 1 périmètre homogène.**

## État actif — 2026-10-01

Chantier :
alignement gouvernance GenSrpG — GREEN, checkpoint final à créer.

Branche :
`work/exploration-governance-alignment-2026-10-01`

Checkpoint de départ :
`checkpoint/exploration-start-governance-alignment-2026-10-01`

Base :
`35d4cf3666fd2f6d99eecdd34ba7b6ef37346063`

Dernier checkpoint fonctionnel :
`checkpoint/exploration-phase0-bootstrap-green-2026-10-01`

Source GenSrpG relue :
`work/gensrpg-phase8-tactical-consolidation-preaudit-2026-10-01` au SHA `9fd5a789180e26204833e9d6b330079352272ec6`

## Invariants de coordination

- ne jamais développer directement sur main ;
- ne jamais toucher au dépôt principal depuis ce labo ;
- ne jamais toucher au labo Combat depuis ce labo ;
- pas de rustine globale ;
- pas de double autorité ;
- pas de gameplay important codé en dur ;
- mobile prioritaire ;
- chaque régression devient un test ;
- tout jalon GREEN possède un checkpoint ;
- aucun nouveau lot avant son checkpoint de départ.

## Preview

Le mécanisme Pages est une infrastructure de test.
Il ne devient pas le propriétaire du runtime et ne justifie aucune fusion du code de travail dans main.

## Intégration future

L'intégration à GenSrpG sera un chantier distinct, ouvert seulement lorsque :
- le sous-système est suffisamment stable ;
- ses contrats sont versionnés ;
- ses dépendances Core/Shell sont identifiées ;
- les tests sentinelles sont portables ;
- un checkpoint GREEN d'intégration est créé côté GenSrpG.
