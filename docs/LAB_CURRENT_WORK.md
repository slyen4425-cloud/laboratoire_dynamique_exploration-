# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-01

## Chantier actif
World Surface Model v1 — terrain structuré pour routes/rivières/transitions.

## Branche
`work/exploration-world-surface-model-v1-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-world-surface-model-v1-2026-10-01`

## SHA de base
`afe258c0fbf33d17c5741267930a8915869fe85b`

## Dernier checkpoint GREEN
`checkpoint/exploration-asset-audit-green-2026-10-01`

## Contexte
Le lot `asset-pack-forest-v1` a été rejeté :
- v1 : mosaïque carrée visible ;
- v2 : coutures masquées mais rendu encore artificiel ;
- composition future des routes/rivières jugée fragile.

Aucun checkpoint GREEN n'a été créé pour ce renderer rejeté.

## Objectif
Créer une structure de surface indépendante des textures, utilisable plus tard par :
- génération automatique ;
- Builder manuel ;
- rendu ;
- sauvegarde.

## Modèle cible
```text
World
 ├─ surface.base
 ├─ surface.routes[]
 ├─ surface.rivers[]
 ├─ obstacles[]
 ├─ interactions[]   (futur)
 └─ entities[]       (futur)
```

### route
- id ;
- points monde X/Y ;
- largeur ;
- materialId.

### rivière
- id ;
- points monde X/Y ;
- largeur ;
- materialId.

## Propriétaires
- géométrie de surface : World Model ;
- validation/normalisation : Surface Model ;
- rendu : Surface Renderer ;
- collisions : Collision World (inchangé dans ce lot).

## Fichiers autorisés
- `src/world/` ;
- `src/render/` ;
- `src/main.js` pour consommation du renderer ;
- tests ;
- documentation.

## Invariants
- aucune texture ne définit la géométrie ;
- route/rivière en coordonnées monde continues ;
- aucune case comme autorité ;
- renderer lecture seule ;
- collision séparée du visuel ;
- même document utilisable par générateur et Builder ;
- aucun asset/hotlink requis pour valider le modèle.

## Hors périmètre
- autotiling texturé final ;
- import de nouveaux assets ;
- génération procédurale ;
- édition Builder ;
- changement de collision ;
- IA/rencontres ;
- autre dépôt.

## Tests requis
- document surface validé ;
- points invalides rejetés/normalisés explicitement ;
- routes/rivières conservent ordre et largeur ;
- renderer n'écrit pas le World Model ;
- mouvement/collision Phase 0/1A toujours GREEN ;
- architecture sentinels GREEN ;
- CI GREEN ;
- preview mobile.

## Critère de sortie
Une preview doit montrer un sol continu, une route et une rivière courbes et propres, sans grille, tout en conservant le déplacement/collisions existants.

Ce jalon valide l'architecture de composition, pas le style artistique final.


## État technique — 2026-10-01
Implémentation v1 :
- `World.surface` normalisé/versionné ;
- `surface.baseMaterialId` ;
- `surface.routes[]` avec points X/Y, largeur, materialId ;
- `surface.rivers[]` avec points X/Y, largeur, materialId ;
- Surface Renderer séparé ;
- routes/rivières courbes via tracé lissé ;
- sol de base sans grille ;
- collisions existantes inchangées ;
- l'obstacle rivière conserve son autorité de collision et n'est plus dessiné comme rectangle bleu ;
- aucune texture requise pour la géométrie.

## Tests
CI technique au SHA `97c35974e56e4e0c18d0003f3806fa71c501737c` :
run `36882087281` — SUCCESS.

Tests surface :
- conservation ordre/largeur/points ;
- filtrage des paths invalides ;
- aucun mutation de l'entrée ;
- defaults explicites.

## Test manuel requis
Preview mobile à valider :
- aucune grille/mosaïque ;
- route lisible et naturelle ;
- rivière lisible ;
- échelle cohérente avec le pion ;
- caméra/déplacement toujours fluides ;
- collision rivière cohérente visuellement pour ce prototype.

Ce jalon valide d'abord l'architecture de composition. Le style final viendra ensuite avec matériaux/textures adaptés à chaque couche.
