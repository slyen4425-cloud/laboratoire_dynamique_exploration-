# GenSrpG Exploration — Charte permanente

Cette charte applique au laboratoire Exploration les règles de gouvernance du projet principal GenSrpG.

Source de référence relue le 2026-10-01 :
- `docs/GENSRPG_CHARTE.md`
- `docs/GENSRPG_DEVELOPMENT_RULES.md`
- `docs/GENSRPG_CHECKPOINT_POLICY.md`
- `docs/GENSRPG_COORDINATION.md`
- `docs/GENSRPG_TECHNICAL_GUARDRAILS.md`

Branche GenSrpG de référence lors de l'alignement :
`work/gensrpg-phase8-tactical-consolidation-preaudit-2026-10-01`.

Si la charte principale évolue, le laboratoire doit être réconcilié avant le prochain lot fonctionnel.

## 1. Position dans GenSrpG

Exploration n'est pas un nouveau module principal.

Le moteur développé ici est destiné à devenir un sous-système de **Monster Capture**. Il doit donc pouvoir s'intégrer sans prendre l'autorité sur :
- Shell/navigation ;
- Core stats ;
- Core storage ;
- resolver d'assets ;
- combat Capture ;
- Survie ;
- Dungeon ;
- Tactical ;
- PvP.

## 2. Un système validé ne doit pas être recréé

Avant d'ajouter une fonction, vérifier si GenSrpG ou le laboratoire possède déjà le service correspondant.

Pour l'intégration future :
- stats -> Core stats ;
- stockage -> Core storage ;
- assets -> resolver central ;
- navigation -> Shell ;
- combat Capture -> moteur Capture public ;
- exploration -> moteur Exploration propriétaire de son monde.

Le laboratoire peut simuler un service absent pour un prototype, mais ce simulateur doit être isolé derrière un adapter et ne jamais devenir une seconde autorité lors de l'intégration.

## 3. Une responsabilité critique = un propriétaire unique

Propriétaires du laboratoire :
- position exploration : Exploration Core ;
- mouvement : Exploration Core ;
- collisions : Collision World ;
- état du monde : World Model ;
- génération : World Generator ;
- caméra : Camera ;
- rendu : Exploration Renderer ;
- input tactile/clavier : Input Adapter ;
- déclenchement d'une rencontre : Exploration Encounter Controller ;
- données éditées : Builder/Data layer ;
- passage au combat : Encounter Bridge contractuel.

Si deux composants pensent posséder la même responsabilité, le développement s'arrête jusqu'à clarification.

## 4. Une source de vérité unique

La position monde est `x/y` flottante et appartient à l'état Exploration.

Une grille peut exister pour générer, indexer ou partitionner le monde, mais elle ne devient jamais une deuxième position autoritaire du joueur.

Même règle pour :
- collisions ;
- seed ;
- configuration ;
- entités ;
- zones ;
- spawns ;
- état de rencontre.

L'UI affiche ; elle ne possède pas le gameplay.

## 5. Pas de pollution globale

Interdits par défaut :
- `MutationObserver` sur `body/html` ;
- heartbeat global ;
- `setInterval` permanent pour réparer l'état ;
- retries longs pour reprendre une autorité ;
- monkey-patch global ;
- scan DOM d'un autre module ;
- listener capture général qui bloque la propagation ;
- `location.reload()` comme navigation ;
- auto-install caché d'un module complexe.

Tout comportement temporaire fournit un cycle explicite `install()/dispose()` ou équivalent.

## 6. Contrats explicites

Le raccord futur doit suivre un contrat comparable à :

```text
Capture Exploration -> startCaptureCombat(CaptureEncounterSnapshot v1)
Capture Combat      -> CaptureCombatResult v1
Capture Exploration -> applyCaptureCombatResult(result)
```

Exploration prépare le contexte de rencontre.
Combat ne relit pas arbitrairement l'état interne du monde.
Exploration applique ensuite le résultat.

## 7. Les éditeurs produisent des données

Flux obligatoire :

```text
Builder/éditeur -> données validées -> sauvegarde -> runtime Exploration
```

Interdit :

```text
Builder -> modification directe du runtime actif
```

## 8. Pas de gameplay important codé en dur

Les valeurs de gameplay doivent venir d'une configuration normalisée :
- vitesse ;
- accélération/freinage ;
- taille/collision ;
- densité de spawn ;
- rayon de détection ;
- chances de rencontre ;
- paramètres de biome ;
- règles de génération ;
- rareté ;
- comportement IA configurable.

Les valeurs du prototype Phase 0 sont des **valeurs techniques de démonstration**. Le premier lot fonctionnel qui en fait des règles de jeu doit les sortir vers une configuration.

## 9. Moteur pur, UI explicative

Le cœur de mouvement, collision, génération et règles doit rester testable sans DOM.

Le renderer et les contrôles tactiles sont des adapters/UI.

Aucun calcul métier important ne doit être dupliqué dans l'interface.

## 10. Base connue avant tout changement

Avant chaque chantier :
1. identifier le dernier SHA GREEN ;
2. créer `checkpoint/exploration-start-<chantier>-YYYY-MM-DD` sur ce SHA ;
3. créer la branche `work/exploration-<chantier>-YYYY-MM-DD` depuis exactement ce SHA ;
4. déclarer le périmètre dans `LAB_CURRENT_WORK.md` ;
5. ne jamais développer directement sur `main`.

## 11. Périmètre déclaré avant codage

Chaque lot déclare :
- domaine concerné ;
- propriétaire ;
- systèmes réutilisés ;
- fonctions gelées ;
- fichiers attendus ;
- tests ;
- risques ;
- frontière inter-module ;
- hors périmètre.

Si le travail déborde, on arrête et on ouvre un autre lot.

## 12. Tests du vrai chemin

Un test ne doit pas injecter la réponse attendue à l'endroit même où le raccord doit être vérifié.

Exemples :
- input -> mouvement -> collision -> position ;
- seed/config -> generator -> world model ;
- zone -> encounter -> snapshot ;
- sauvegarde -> rechargement -> position/monde identiques.

## 13. Tests sentinelles

Les fonctions déclarées GREEN deviennent protégées.

Sentinelles minimales à construire progressivement :
- mouvement 360° ;
- normalisation diagonale ;
- collisions ;
- limites monde ;
- caméra ;
- stick tactile ;
- seed déterministe ;
- save/reload ;
- absence de double autorité de position ;
- absence de globals interdits ;
- contrat rencontre ;
- non-interférence avec les autres modules lors de l'intégration.

## 14. Mobile d'abord

Le smartphone/PWA est la cible prioritaire :
- tactile ;
- DPR élevé ;
- mémoire limitée ;
- coût DOM raisonnable ;
- reprise ;
- cache ;
- longue session.

Un test Node GREEN ne remplace pas une validation navigateur/mobile lorsque l'UI ou la performance est concernée.

## 15. Régression : pas de rustine

En cas de régression :
1. revenir au dernier checkpoint sûr ;
2. identifier le premier changement responsable ;
3. reproduire par un test ;
4. retirer/isoler l'autorité fautive ;
5. préférer un correctif soustractif ;
6. conserver le test comme garde permanent.

## 16. Refactor progressif uniquement

Pas de big-bang.

Ordre :
documenter -> protéger par tests -> identifier le propriétaire -> déplacer une responsabilité -> retirer l'ancienne autorité -> comparer -> checkpoint GREEN.

## 17. Diff minimal

Un lot homogène modifie le minimum de fichiers nécessaires.

Un lot qui commence à toucher plusieurs domaines doit être stoppé et recadré.

## 18. Compatibilité et migrations

Toute donnée persistante est versionnée.

Un changement de schéma fournit si nécessaire :
- migration ;
- idempotence ;
- test ancien -> nouveau ;
- test sauvegarde/reprise.

## 19. Publication / preview

Une CI rouge bloque la publication.

Pour un comportement utilisateur :
- preview séparée ;
- lien stable ;
- test ciblé ;
- validation utilisateur ;
- seulement ensuite checkpoint GREEN.

La production GenSrpG n'est jamais modifiée depuis ce dépôt.

## 20. Critère de fin d'un chantier

Un chantier n'est GREEN que si :
- autorité unique ;
- tests unitaires verts ;
- vrai raccord testé ;
- tests de frontière requis verts ;
- documentation à jour ;
- CI verte ;
- preview fonctionnelle si nécessaire ;
- test utilisateur ciblé validé si nécessaire.

## 21. Règle finale

La charte prime sur la solution la plus rapide.

Choisir la solution qui réduit les autorités, les effets globaux et la dette, réutilise les contrats existants, reste testable et facilite l'intégration future à GenSrpG.
