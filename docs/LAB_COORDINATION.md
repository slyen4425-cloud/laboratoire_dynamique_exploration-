# GenSrpG Exploration — Coordination

## Coordinateur unique

Un seul fil directeur coordonne le chantier.

Règle :
**1 lot = 1 branche = 1 périmètre homogène.**

## État actif — 2026-10-02

Chantier :
**Map Actor Editor v1** — édition visuelle héros / PNJ / créatures avec aperçu map.

Branche :
`work/exploration-map-actor-editor-v1-2026-10-02`

Checkpoint de départ :
`checkpoint/exploration-start-map-actor-editor-v1-2026-10-02`

Base GREEN :
`80e6468eda0261e0f7db12c81f98beb13df339ab`

Dernier checkpoint GREEN :
`checkpoint/exploration-world-builder-dynamique-ui-v1-green-2026-10-02`

Systèmes réutilisés :
- Map Actor Visual System v1 GREEN ;
- Map Actor Visual Preparer ;
- Map Actor Renderer ;
- Map Actor Asset Adapter ;
- viewport/preview du World Builder GREEN.

Interdictions du lot :
- aucune position gameplay parallèle ;
- aucune collision acteur ;
- aucune stat/IA ;
- aucun nouveau renderer acteur ;
- aucun hotlink inter-dépôt.

## Invariants de coordination

- ne jamais développer directement sur main ;
- ne jamais toucher au dépôt principal depuis ce labo ;
- ne jamais toucher au labo Combat depuis ce labo ;
- pas de rustine globale ;
- pas de double autorité ;
- mobile prioritaire ;
- chaque régression devient un test ;
- tout jalon GREEN possède un checkpoint.

## Preview

Le mécanisme Pages est une infrastructure de test.
Il ne devient pas une autorité runtime.

## Intégration future

À l'intégration GenSrpG, le visuel du héros proviendra du contexte Capture et les assets du resolver central.
Le laboratoire ne doit donc pas transformer son éditeur visuel en propriétaire des stats, de la session Capture ou du monde vivant.
