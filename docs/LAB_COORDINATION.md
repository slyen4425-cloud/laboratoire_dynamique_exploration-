# GenSrpG Exploration — Coordination

## Coordinateur unique

Un seul fil directeur coordonne le chantier.

Règle :
**1 lot = 1 branche = 1 périmètre homogène.**

## État actif — 2026-10-02

Chantier :
**Map Actor Editor v1 — calibration technique — GREEN**.

Validation smartphone finale obtenue le 2026-10-03 :
- import/handoff/retour Builder : OK ;
- orientation native gauche/droite : OK ;
- miroir automatique au déplacement : OK.

Décision produit 2026-10-03 :
ce panneau complet n'est pas l'éditeur produit final.
Les réglages visuels intrinsèques appartiendront à l'éditeur Héros/PNJ/Créatures.
Le World Builder final sélectionnera une définition d'acteur dans un catalogue et éditera uniquement son placement/référence dans le WorldDocument.

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

## Prochaine étape coordonnée

L'ancienne branche `work/exploration-surface-traversal-rules-v1-2026-10-02` reste une validation technique isolée et **ne doit pas être reprise telle quelle**.

Suite obligatoire :
1. checkpoint GREEN exact du lot Map Actor actuel ;
2. nouveau checkpoint de départ Surface Traversal ;
3. nouvelle branche Surface Traversal depuis ce GREEN ;
4. report sélectif des changements utiles de l'ancienne branche ;
5. relance de toutes les sentinelles Builder + Map Actor + Traversal ;
6. publication seulement depuis cette nouvelle lignée.

## Preview

Le mécanisme Pages est une infrastructure de test.
Il ne devient pas une autorité runtime.

## Intégration future

À l'intégration GenSrpG :
- le profil visuel sera configuré dans l'éditeur Héros/PNJ/Créatures ;
- le visuel du héros proviendra du contexte Capture ;
- le catalogue d'acteurs fournira les définitions sélectionnables au World Builder ;
- les assets passeront par le resolver central ;
- le World Builder ne recopiera pas les réglages MapActorVisual dans les placements.

Le laboratoire ne doit donc pas transformer son panneau de calibration visuelle en propriétaire des stats, de la session Capture, du catalogue ou du monde vivant.
