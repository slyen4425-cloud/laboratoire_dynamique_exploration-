# GenSrpG Exploration — Coordination

## Coordinateur unique

Un seul fil directeur coordonne le chantier.

Règle :
**1 lot = 1 branche = 1 périmètre homogène.**

## État actif — 2026-10-02

Chantier :
WorldArea / Portal v1 — implémenté, CI GREEN, preview publiée, validation smartphone requise.

Branche :
`work/exploration-worldarea-portal-v1-2026-10-02`

Checkpoint de départ :
`checkpoint/exploration-start-worldarea-portal-v1-2026-10-02`

Base GREEN :
`bb8cad37400ba6853e3aba76ffc633303c263bcb`

Dernier checkpoint fonctionnel :
`checkpoint/exploration-building-world-object-v1-green-2026-10-02`

Plan suivant validé :
WorldArea/Portal -> Map Actor Visual System -> World Builder Dynamique UI.

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
