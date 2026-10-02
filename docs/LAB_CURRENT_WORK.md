# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-02

## Chantier actif
Map Actor Editor v1 — édition visuelle héros / PNJ / créatures avec aperçu directement sur la map.

## Branche
`work/exploration-map-actor-editor-v1-2026-10-02`

## Checkpoint de départ
`checkpoint/exploration-start-map-actor-editor-v1-2026-10-02`

## SHA de base GREEN
`80e6468eda0261e0f7db12c81f98beb13df339ab`

## Dernier checkpoint GREEN
`checkpoint/exploration-world-builder-dynamique-ui-v1-green-2026-10-02`

## Base validée
World Builder Dynamique UI v1 : smartphone GREEN.
CI fermeture : run `37055151667` — SUCCESS.

## Objectif
Permettre au créateur de régler la représentation map d'un héros, PNJ ou d'une créature en réutilisant exclusivement le **Map Actor Visual System v1 déjà GREEN**.

Règle produit :
**un seul visuel doit suffire pour obtenir un acteur lisible sur la map.**

Chaîne autoritaire :
```text
Map Actor Editor UI
      ↓
MapActorVisual v1
      ↓
Map Actor Visual Preparer
      ↓
Map Actor Renderer
```

L'éditeur ne crée aucune seconde position gameplay, collision, statistique, IA ou moteur de rendu.

## Périmètre v1
- nouvel onglet Builder `Acteurs` ;
- rôle : héros / PNJ / créature ;
- choix d'un asset Map Actor enregistré ;
- aperçu réel du modèle sur la map ;
- hauteur visuelle / scale via `targetHeight` ;
- anchor X/Y avec mode auto + override ;
- ombre : activée, largeur, hauteur, opacité ;
- miroir horizontal ;
- idle : amplitude/fréquence ;
- mouvement : amplitude/fréquence ;
- position d'aperçu Builder purement temporaire et clairement non gameplay ;
- changement direct de la position d'aperçu par tap/drag ;
- export JSON du `MapActorVisual v1` ;
- tests des contrôles et du vrai renderer existant.

## Import visuel utilisateur
Le lot doit préparer l'import d'un visuel unique sans créer de second resolver d'assets.
Toute image utilisateur passe par l'Asset Adapter / Visual Preparer existants ou leur extension contractuelle unique.
Aucun hotlink vers un autre dépôt.

## Hors périmètre
- stats héros/créature ;
- PV / compétences / éléments ;
- IA ;
- spawns gameplay ;
- rencontres ;
- Capture Combat ;
- collision acteur ;
- persistance Core/IndexedDB ;
- autre dépôt.

## Autorités protégées
- position runtime : Exploration Engine ;
- collision : Collision World ;
- visuel map : MapActorVisual + Map Actor Renderer ;
- assets : Map Actor Asset Adapter ;
- Builder : données/preview uniquement.

## Tests requis
- le rôle normalise toujours via MapActorVisual v1 ;
- targetHeight/anchor/shadow/motion passent par le modèle existant ;
- aucun renderer concurrent ;
- aucun x/y d'aperçu exporté dans MapActorVisual ;
- aucun import mouvement/collision/stats dans l'éditeur ;
- preview map utilise `createMapActorRenderer` ;
- World Builder GREEN reste protégé.

## Critère de sortie
Sur smartphone :
- ouvrir Acteurs ;
- choisir héros ou créature ;
- voir le modèle sur la map ;
- déplacer uniquement son point d'aperçu ;
- régler taille/anchor/ombre/mouvement ;
- constater les changements immédiatement ;
- exporter un MapActorVisual v1 valide ;
- aucune régression Builder existant.


## État technique — Map Actor Editor v1 — 2026-10-02

Implémenté :
- onglet Builder `Acteurs` ;
- rôles Héros / PNJ / Créature ;
- aperçu du vrai MapActorVisual sur la map ;
- déplacement du point d'aperçu au doigt/souris ;
- point d'aperçu strictement éphémère et non exporté ;
- hauteur visuelle `targetHeight` ;
- anchor auto ou override X/Y ;
- ombre configurable ;
- miroir gauche/droite ;
- direction d'aperçu ;
- idle et mouvement visuels configurables ;
- test animation fini, sans timer global permanent ;
- export `MapActorVisual v1` JSON ;
- import local d'un visuel unique pour aperçu ;
- import raccordé au même Asset Adapter / Image Loader / Visual Preparer ;
- aucun renderer Map Actor concurrent.

Correction de contrat :
- `normalizeMapActorVisual` est maintenant idempotent pour les anchor overrides.

TDD / sentinelles :
- contrat UI Map Actor Editor ;
- réutilisation obligatoire de `createMapActorRenderer` ;
- réutilisation obligatoire de `createMapActorVisualPreparer` ;
- extension du même resolver d'assets ;
- absence de collision fictive dans l'aperçu ;
- sentinelles World Builder historiques toujours GREEN.

CI technique :
- HEAD publié : `691b5f048d6336b51ca0e49e6f34504a2e626ea1` ;
- run `37055982923` — **SUCCESS**.

## Preview smartphone — Map Actor Editor v1

Infrastructure uniquement :
- checkpoint start preview :
  `checkpoint/exploration-start-preview-map-actor-editor-v1-2026-10-02` ;
- branche infra :
  `infra/pages-preview-map-actor-editor-v1-2026-10-02` ;
- PR #32 ;
- main SHA : `8471725c1f010578728f8bd71035abd652244dd7` ;
- Pages run : `37056274018` — **SUCCESS** ;
- artifact Pages : `11248353296`.

Le workflow Pages checkout explicitement :
`work/exploration-map-actor-editor-v1-2026-10-02`.

URL :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html`

Gate restante :
validation smartphone utilisateur de l'onglet Acteurs, de l'aperçu sur map, des réglages et de l'import visuel.

Le lot reste non GREEN jusqu'à cette validation.


## Régression — Tester en jeu perdait le MapActorVisual — 2026-10-02

Retour smartphone utilisateur :
- les réglages Acteur étaient visibles dans le Builder ;
- « Tester en jeu » lançait le runtime avec le héros visuel par défaut ;
- au retour Builder, les réglages Acteur revenaient également aux valeurs par défaut.

Cause confirmée :
- le handoff Builder -> runtime transportait uniquement le WorldDocument ;
- le runtime recréait `player.mapVisual` avec `actor.demo.hero.traveler.01` ;
- l'import local était un blob URL local au document Builder et ne survivait pas comme source explicite de session.

Correction architecturale :
- le contrat de session de test transporte désormais :
  - le WorldDocument canonique ;
  - un `MapActorVisual v1` optionnel ;
  - la source image importée optionnelle uniquement si elle correspond à l'asset du MapActorVisual ;
- le WorldDocument reste inchangé et demeure l'unique autorité du monde ;
- le MapActorVisual reste l'unique autorité visuelle de l'acteur ;
- le runtime utilise le même Map Actor Asset Adapter / Image Loader / Visual Preparer / Renderer ;
- aucune position acteur Builder n'est transportée ;
- aucune collision, stat ou IA n'est ajoutée au handoff ;
- l'image utilisateur de test est transportée en data URL de session afin de survivre à la navigation ;
- le retour runtime -> Builder restaure le même MapActorVisual et, si nécessaire, la même source image de session.

TDD :
- reproduction : commit `d5e568933bd4c4b4196f4fa7b92e50e9f72cfc29` — FAILURE attendue ;
- handoff session étendu ;
- runtime raccordé au MapActorVisual de session ;
- retour Builder raccordé à la même session ;
- sentinelle d'ordre d'initialisation navigateur ajoutée.

Correction finale :
- HEAD technique : `b89b2a3ed802b9cbe54daca9c4d044f40997a200` ;
- CI : run `37058114695` — **SUCCESS**.

## Preview finale — handoff Map Actor — 2026-10-02

Infrastructure uniquement :
- PR #34 ;
- main SHA : `59793448594bf4f92bb32d2579f758376cc49732` ;
- Pages run : `37058199291` — **SUCCESS** ;
- artifact : `11249131978`.

Gate smartphone :
1. régler taille/anchor/ombre/mouvement de l'acteur ;
2. éventuellement importer une image ;
3. « Tester en jeu » ;
4. vérifier que le runtime utilise bien ce visuel et ces réglages ;
5. « Retour World Builder » ;
6. vérifier que les réglages sont toujours présents.

Le lot reste non GREEN jusqu'à validation utilisateur.


## Régression — asset Map Actor importé invalide en runtime — 2026-10-02

Retour smartphone utilisateur :
- écran runtime vide ;
- message : `Erreur asset Map Actor — voir console` ;
- survenait après import d'un visuel acteur puis « Tester en jeu ».

Cause racine confirmée :
- `createImageAssetLoader` ajoutait systématiquement le suffixe de cache `?rev=...` à `asset.path` ;
- ce comportement est correct pour les chemins de fichiers / URL classiques ;
- mais il corrompait les sources `data:image/...` transportées par la session de test ;
- le Builder chargeait l'image sans cache revision, alors que le runtime appliquait une cache revision, d'où la différence de comportement.

Correction :
- le chargeur partagé reste l'unique autorité de chargement ;
- `cacheRevision` continue d'être appliquée aux chemins classiques ;
- aucune révision n'est ajoutée aux sources `data:` ou `blob:` ;
- aucune exception spécifique n'a été ajoutée dans le runtime ou le Builder.

TDD :
- reproduction : commit `0e8426d0afdd179f9c961f84ffdd5228adc68049` ;
- CI de reproduction : run `37059166186` — **FAILURE attendue** ;
- correction : commit `a5a2a05bac42267c365ebf16696dce5e8a390d7d` ;
- CI correction : run `37059209076` — **SUCCESS**.

Preview :
- PR #35 ;
- main SHA : `1afb3150fd3de9a7bec32e52a4d8799845f8cb0c` ;
- Pages run : `37059297803` — **SUCCESS** ;
- artifact : `11249507717`.

Gate smartphone :
- importer une image acteur ;
- « Tester en jeu » ;
- vérifier disparition de l'erreur asset ;
- vérifier que le bon visuel et ses réglages sont utilisés ;
- revenir au Builder et vérifier la restauration de session.

Le lot reste non GREEN jusqu'à cette validation.
