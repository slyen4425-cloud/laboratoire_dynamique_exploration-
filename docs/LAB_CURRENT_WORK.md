# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-03

## Chantier actif
Phase 5 — micro-lot :
**Encounter Layers v1 — données + édition World Builder**.

## Branche
`work/exploration-phase5-encounter-layers-v1-2026-10-03`

## Checkpoint de départ
`checkpoint/exploration-start-phase5-encounter-layers-v1-2026-10-03`

## SHA de base GREEN
`97eaec1e9de5750d89918629a42a6387f9e4eb82`

## Dernier checkpoint GREEN
`checkpoint/exploration-phase5-wild-wander-territory-v1-green-2026-10-03`

## Décision produit
La priorité n'est plus perception/poursuite/fuite.

Les rencontres ordinaires doivent être éditables sous forme de **layers gameplay** :
- zone peinte ;
- chance globale de rencontre ;
- fréquence de contrôle explicite ;
- table pondérée de pools/types/créatures ;
- superposition possible pour créer des zones sûres ou plus dangereuses.

Exemple :
- forêt : 25 % de rencontre par contrôle ;
- table : 80 % Terre/Herbe, 20 % Neutre ;
- route sûre : layer prioritaire avec 0 %.

## Autorités
- géométrie Encounter Layer : Encounter Layer Model ;
- chance/table/priorité : Encounter Layer Model ;
- édition : World Builder Draft/UI ;
- déclenchement runtime futur : Encounter Controller ;
- sélection créature : Encounter Table Resolver futur + catalogue Capture / CaptureDatabaseV1 ;
- surface/materials : aucune autorité sur les rencontres.

## Règle absolue
Interdit :
- réutiliser `surface.zones[]` comme zones gameplay ;
- déduire la rencontre depuis `materialId`, texture, biome visuel ;
- coder le déclenchement combat dans le Builder.

## Périmètre
- EncounterLayer path/brush v1 ;
- largeur + points X/Y ;
- chance 0..100 % ;
- distance de contrôle explicite ;
- priorité de layer ;
- table d'entrées pondérées ;
- entrée par sélecteur typé `creature` ou `element` ;
- normalisation et validation ;
- stockage canonique dans WorldArea ;
- édition Builder ;
- overlay Builder ;
- import/export WorldDocument.

## Hors périmètre
- déclenchement réel d'un combat ;
- RNG runtime ;
- cooldown anti-spam ;
- Encounter Bridge ;
- Capture Combat ;
- injection runtime de la CaptureDatabaseV1 active ;
- autre dépôt.

## Tests
- layer indépendant de surface.zones/materialId ;
- ids uniques ;
- géométrie valide ;
- chance bornée ;
- table pondérée ;
- layer 0 % valide sans table ;
- layer >0 % exige une table ;
- Builder ajoute/modifie/supprime ;
- export/import conserve les layers ;
- sentinelles historiques GREEN.

## Gate
Sur smartphone :
- peindre un layer ;
- régler 0..100 % ;
- éditer 80/20 ou autre table ;
- voir le layer en overlay ;
- exporter/réimporter sans perte.


## État technique — Encounter Layers v1 — 2026-10-03

Implémenté :
- `EncounterLayer v1` distinct de `surface.zones[]` ;
- stockage canonique dans `WorldArea.encounterLayers[]` ;
- WorldArea schema v3 ;
- géométrie path/brush : `points[] + width` ;
- chance de rencontre 0..100 % ;
- distance de contrôle explicite ;
- priorité de layer ;
- table pondérée ;
- entrées par `selectorKind + selectorId` : créature Capture ou élément ;
- aucun `materialId` dans EncounterLayer ;
- aucune copie stats/MapActorVisual/assets ;
- safe layer 0 % valide sans table ;
- layer > 0 % exige au moins une entrée ;
- ajout/modification/suppression via World Builder Draft ;
- import/export WorldDocument conserve les layers ;
- outil mobile « Peindre rencontres » ;
- overlay dédié sur la map ;
- édition des poids avec affichage de la part effective ;
- route/zone sûre réalisable par layer 0 % à priorité supérieure.

TDD :
- contrat modèle : commit `9495c29d42e4db2b89ae908fc9725a60b437cca2` — FAILURE attendue ;
- modèle : `d933ff83f72968019297f989e4e8b77bf7c78c9e` ;
- contrat Builder : `0f9526fb37e96eaba1066b18ccf5d660d1ef5d10` — FAILURE attendue ;
- draft/model raccord : `6f8906acf43ac93c6a79c0cbe31a25c5d3388fb6` — SUCCESS ;
- contrat UI : `584e53ea89b1ada55f16e716d994ec1b8c1425af` — FAILURE attendue ;
- UI + overlay + interactions : `01177042fa83e0e869509d321a92ce0add36c384` ;
- cache/versioning final : `7d15dcc68661d24f6cb85ee9fcb49326a5b67d9b` ;
- CI finale : run `37114046787` — **SUCCESS**.

Preview :
- PR #43 ;
- main SHA : `b97931e83974dabe0cb7cf0b8736bdd454ec81f5` ;
- Pages run : `37114109597` — **SUCCESS** ;
- artifact : `11271266979`.

Gate smartphone :
1. ouvrir l'onglet **Rencontres** ;
2. activer **Peindre rencontres** ;
3. tracer une zone ;
4. régler par exemple 25 % de chance ;
5. créer/éditer une table 80 / 20 ;
6. tracer un second layer « route sûre » à 0 % avec priorité supérieure ;
7. vérifier les overlays ;
8. exporter puis réimporter le WorldDocument et vérifier l'absence de perte.

Le lot reste non GREEN jusqu'à validation utilisateur.


## Correction utilisateur — Encounter Layers simplifiés + raccord Capture — 2026-10-03

Retour smartphone :
- l'outil « Peindre rencontres » ne peignait pas ;
- l'UI demandait des IDs/tags à taper manuellement ;
- aucun catalogue réel n'était visible ;
- la cible produit doit réutiliser les créatures créées dans Capture.

Cause racine peinture :
- `encounter` était routé vers le panneau Terrain dans `setMapTool` ;
- surtout, `pointerdown` n'incluait pas `encounter` dans le chemin de dessin ;
- `pointermove` savait déjà traiter encounter, mais le mode de dessin n'était donc jamais initialisé.

Correction :
- routage des outils centralisé dans `world-builder-map-tool.js` ;
- `encounter` ouvre désormais uniquement le panneau Rencontres ;
- le même helper détermine le chemin de peinture pour pointerdown/move/leave ;
- aucune rustine DOM ni observer.

Raccord Capture :
- contrat source confirmé dans le labo Combat : `CaptureDatabaseV1` ;
- créature : `draft.id`, `draft.displayName`, `draft.elements`, `draft.presentation` ;
- provider Exploration **lecture seule** capable de consommer directement CaptureDatabaseV1 ;
- preview locale alimentée par une projection traçable du checkpoint Combat
  `checkpoint/lab-creature-natural-elements-reconcile-v1-prevalidation-green-2026-09-30`
  SHA `54f38051f4aab7593f233a30f26d9f608e00ad08` ;
- projection : 102 créatures canoniques, 13 éléments ;
- cette projection n'est pas une autorité d'édition et sera remplacée à l'intégration par la CaptureDatabaseV1 active.

UI simplifiée :
- aucun champ texte pour creatureId/tags ;
- choix `Élément / type` ou `Créature précise` ;
- deuxième liste alimentée automatiquement par le catalogue Capture ;
- choisir « Feu » rend éligibles toutes les créatures dont `draft.elements` contient `fire` ;
- poids éditable par curseur ;
- chance de combat et taille du layer par curseurs ;
- options techniques reléguées dans « Options avancées ».

Lien visuel :
- `Capture -> Map Actor Adapter` lit `draft.presentation.visual.front.assetId` lorsqu'un acteur visible est nécessaire ;
- EncounterLayer ne copie jamais presentation/stats/elements.

Le lot reste non GREEN jusqu'à nouvelle validation smartphone de la peinture et de l'UI simplifiée.
