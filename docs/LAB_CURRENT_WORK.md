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
