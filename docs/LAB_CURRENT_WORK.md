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
