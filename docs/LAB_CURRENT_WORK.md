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
- sélection Actor Definition future : Encounter Table Resolver + catalogue Capture ;
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
- entrée par tags/pool ou actorDefinitionId ;
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
- catalogue Capture réel ;
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
- entrées par `actorDefinitionId` opaque ou tags/pool ;
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
