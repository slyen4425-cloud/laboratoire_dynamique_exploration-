# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-02

## Chantier actif
Map Actor Visual System v1.

## Branche
`work/exploration-map-actor-visual-v1-2026-10-02`

## Checkpoint de départ
`checkpoint/exploration-start-map-actor-visual-v1-2026-10-02`

## SHA de base GREEN
`4e6f6c77ff231c00e5868ca8cf572137b1835922`

## Dernier checkpoint GREEN
`checkpoint/exploration-worldarea-portal-v1-green-2026-10-02`

## Décision produit validée
**Le joueur fournit un seul visuel de héros, PNJ ou créature ; GenSrpG prépare automatiquement sa représentation sur la map.**

Le mode simple doit rester suffisant. Les spritesheets, vues arrière ou animations dessinées restent facultatifs.

## Propriétaires
- position X/Y / déplacement : propriétaire gameplay de l'acteur ;
- collision : Collision World ;
- MapActorVisual : Map Actor Visual Model ;
- préparation d'image : Map Actor Visual Preparer ;
- fichiers : Map Actor Asset Adapter ;
- rendu : Map Actor Renderer.

Le visuel ne devient jamais propriétaire de la position, collision, vitesse, IA, interaction ou statistiques.

## Périmètre v1
- contrat `MapActorVisual v1` ;
- un seul `assetId` obligatoire pour le mode simple ;
- rôle visuel hero / npc / creature ;
- préparation automatique d'image ;
- détection/rognage des marges transparentes ;
- suppression automatique seulement lorsqu'un fond uniforme peut être identifié de façon sûre ;
- anchor bas-centre automatique ;
- taille monde automatique/configurable ;
- ombre automatique ;
- miroir gauche/droite ;
- idle léger ;
- bounce de marche visuel sans spritesheet ;
- cache de visuel préparé ;
- un visuel de démonstration unique ;
- remplacement du cercle joueur de démonstration par Map Actor Renderer ;
- tests/CI/preview smartphone.

## Règle de sécurité image
Si un fond opaque complexe ne peut pas être détaché proprement par l'algorithme local, le pipeline doit le signaler explicitement comme `opaque-unresolved`.
Il ne doit pas détruire arbitrairement l'image.
Un traitement IA plus avancé pourra être raccordé plus tard derrière le même contrat, sans changer MapActorVisual.

## Hors périmètre
- UI d'import utilisateur ;
- IA distante de détourage/génération ;
- vraies frames de marche ;
- création de gameplay PNJ/créature ;
- IA des créatures ;
- stats/combat ;
- World Builder Dynamique UI ;
- autre dépôt.

## Autorité visuelle
Lorsqu'un acteur déclare un MapActorVisual avec `assetId`, le Map Actor Renderer est son unique représentation map.
Aucun cercle/pion procédural concurrent ne doit être dessiné pour ce même acteur.

## Tests requis
- normalisation MapActorVisual ;
- analyse alpha déterministe ;
- crop transparent ;
- fond uniforme détecté sans toucher un fond complexe ;
- anchor/scale auto indépendants de la collision ;
- miroir seulement dans le renderer ;
- renderer n'écrit jamais X/Y ;
- bootstrap attend asset + préparation ;
- absence de fallback cercle concurrent ;
- tous checkpoints GREEN historiques restent protégés.

## Critère de sortie
Sur smartphone :
- le héros est visible sous forme d'un vrai Map Actor ;
- mouvement reste fluide ;
- gauche/droite lisible par miroir ;
- idle/marche donnent de la vie sans spritesheet ;
- pont, bâtiment et Portal restent fonctionnels.

Le lot reste non GREEN jusqu'à validation utilisateur.


## État technique Map Actor Visual System v1 — 2026-10-02

Implémenté :
- contrat `MapActorVisual v1` ;
- mode simple à **un seul assetId** ;
- rôles visuels `hero / npc / creature` avec tailles automatiques ;
- Asset Adapter dédié ;
- analyse alpha pure/testable ;
- crop automatique des marges transparentes ;
- suppression automatique d'un fond opaque uniquement s'il est uniforme et identifié de façon sûre ;
- état explicite `opaque-unresolved` pour un fond complexe non détachable localement ;
- anchor bas-centre automatique ;
- ombre automatique ;
- miroir gauche/droite depuis `facingX` gameplay ;
- idle et bounce de marche purement visuels sans spritesheet ;
- préparateur d'image avec cache ;
- renderer Map Actor sans mutation gameplay ;
- visuel technique de démonstration unique en SVG transparent ;
- ancien cercle joueur supprimé dès qu'un MapActorVisual est déclaré.

Autorités :
- X/Y restent dans l'acteur gameplay ;
- Collision World reste propriétaire de la collision ;
- le préparateur ne produit que des pixels/metadata visuels ;
- le renderer ne possède ni stats, ni IA, ni interaction, ni mouvement.

Tests ajoutés :
- defaults one-image ;
- tailles automatiques par rôle ;
- crop alpha ;
- fond uniforme retiré ;
- fond complexe préservé et signalé ;
- asset sémantique ;
- miroir/ombre/animation sans mutation acteur ;
- sentinelles architecture sans seconde autorité ;
- bootstrap attend chargement + préparation avant runtime.

CI :
- run `37001394091` — **SUCCESS** sur le HEAD de tests d'architecture.

Prochaine gate :
publier une preview Pages depuis cette branche puis validation smartphone du héros Map Actor et des régressions historiques.


## Preview Map Actor Visual System v1 — 2026-10-02

Infrastructure main uniquement :
- main SHA : `aba0cc604fe9867eb5a88ab5ba28b1810dfed61f` ;
- Pages run : `37001556953` — **SUCCESS** ;
- artifact Pages : `11223847222`.

Artefact réellement inspecté :
- `index.html` charge `main.js?rev=map-actor-visual-v1` ;
- `map_actor_demo_hero.svg` est bien présent ;
- `map-actor-visual-model.js` est présent ;
- `map-actor-image-analysis.js` est présent ;
- `map-actor-visual-preparer.js` est présent ;
- `map-actor-renderer.js` est présent ;
- le bootstrap charge et prépare l'asset Map Actor avant démarrage ;
- l'ancien cercle joueur n'est plus l'autorité visuelle.

Gate restante :
validation smartphone utilisateur du Map Actor, du miroir gauche/droite, du mouvement visuel, et des régressions pont/bâtiment/Portal.

Le lot reste non GREEN jusqu'à cette validation.
