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
