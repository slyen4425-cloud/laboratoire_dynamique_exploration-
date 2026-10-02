# GenSrpG Exploration — Coordination

## Coordinateur unique

Un seul fil directeur coordonne le chantier.

Règle :
**1 lot = 1 branche = 1 périmètre homogène.**

## État actif — 2026-10-02

Chantier :
World Builder Dynamique UI v1 — **validation smartphone GREEN obtenue** ; fermeture documentaire et checkpoint GREEN.

Branche source :
`work/exploration-world-builder-dynamique-ui-v1-2026-10-02`

Checkpoint de départ :
`checkpoint/exploration-start-world-builder-dynamique-ui-v1-2026-10-02`

Base GREEN :
`745b13bd550893b5ae21c351fa1f511acb2bdc16`

Dernier checkpoint fonctionnel avant ce lot :
`checkpoint/exploration-map-actor-visual-v1-green-2026-10-02`

Preview validée :
- main `ee116709d49fc85281e49a5402fd0096fccd6ede` ;
- Pages run `37041673850` — SUCCESS ;
- Builder : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html`.

Validation utilisateur finale :
- rivière canonique bloquante hors pont : OK ;
- pont traversable : OK ;
- Builder/zoom : OK.

Prochain lot autorisé après checkpoint GREEN :
**Map Actor Editor v1** — édition/placement héros, PNJ et créatures sur la map en réutilisant le Map Actor Visual System GREEN.

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
