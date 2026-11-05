# LAB_CHARTE — GenSrpG Exploration

## RÈGLE 0 — CRITIQUE : pas de doublons d'assets ni d'archive de publication ingérable (5 novembre 2026)

**Priorité bloquante pour tous les chantiers Exploration, Combat et GenSRPG.** Chaque dépôt doit appliquer cette règle à ses propres publications ; ce texte n'autorise pas Exploration à modifier les sources des autres dépôts.

1. **Une bibliothèque d'assets canonique par site** : interdiction de recopier intégralement les bibliothèques Combat/Capture, musiques, sprites et atlas dans plusieurs previews. Les anciennes versions peuvent rester accessibles via des chemins/redirects versionnés, sans créer de bibliothèque lourde concurrente. Les ZIP source restent dans les dépôts sources, pas dans le site navigateur sauf besoin démontré.
2. **Mesure obligatoire AVANT mise en ligne** : rapport automatique des octets par preview, bibliothèque Combat, bibliothèque Capture, assets et site complet, plus empreintes/SHA et nombre de copies. Budget bloquant interne GitHub Pages : **900 Mio non compressés pour le site assemblé** tant qu'un autre budget n'est pas explicitement documenté et validé.
3. **Correction de cause racine seulement** : interdiction d'augmenter les timeouts/retries ou de relancer aveuglément pour masquer la taille ; pas de seconde source d'autorité ni d'assets. Toute nouvelle preview complète doit démontrer son coût et son utilité.
4. **Aucune perte fonctionnelle silencieuse** : inventorier les anciennes URL, préserver l'éditeur V80 gelé, l'éditeur officiel, les accès Jeu et le raccord Combat/Capture ; fournir des redirections explicites pour les previews retirées et contrôler que chaque asset nécessaire se charge. Une redirection n'est pas une conservation de l'ancienne version fonctionnelle : ce changement doit être documenté. Aucun original, sauvegarde, branche, historique ou asset source ne doit être supprimé.
5. **Gate automatique permanente** : la CI vérifie la taille réelle, les copies, les chemins vers assets, les anciennes URL conservées, les imports/exports et un vrai navigateur. Vérifier le SHA effectivement servi en HTTPS après Pages et le trio Forêt 1 / Plaine 1 / Neige 1. État NON GREEN tant que le déploiement exact et les tests ne sont pas confirmés.
6. **Checkpoint obligatoire** : rapport de taille avant/après, SHA, workflow, décision sur les URL historiques, régressions, liens Pages et tests. Le simple succès des tests de PR ne vaut pas livraison.

**Cette règle prime sur les habitudes et anciens workflows** : aucune duplication ne bénéficie d'une dérogation implicite parce qu'elle fonctionnait auparavant.


## 1. Mission
Créer et valider le moteur d'exploration libre de GenSrpG, d'abord pour Capture Monster, sans dépendre du moteur Dungeon ni du laboratoire Combat Dynamique.

## 2. Isolation stricte
- Ne jamais développer directement sur `main` après l'initialisation.
- 1 lot = 1 branche de travail.
- Ne jamais modifier le dépôt principal GenSrpG depuis ce laboratoire.
- Ne jamais modifier le laboratoire Combat Dynamique depuis ce laboratoire.
- Les raccords inter-dépôts sont documentés avant intégration.

## 3. Gouvernance
Chaque lot doit avoir :
1. un état de départ identifié ;
2. un périmètre déclaré dans `LAB_CURRENT_WORK.md` ;
3. des critères de validation ;
4. des tests ;
5. un checkpoint GREEN avant le lot suivant.

## 4. Principes techniques
- Déplacement continu en coordonnées monde X/Y.
- Aucune grille imposée au joueur.
- Une grille logique ou des cellules de génération peuvent exister en interne.
- Collision déterministe, sans timers globaux de réparation.
- Caméra séparée du modèle de déplacement.
- Carte et monde sérialisables par données.
- Générateur déterministe avec seed.
- Priorité smartphone/PWA et performance stable.

## 5. Interdictions
- Pas de rustine globale.
- Pas de double autorité de position.
- Pas de logique de collision dupliquée.
- Pas de dépendance directe au DOM dans le cœur du moteur.
- Pas de fusion vers un autre dépôt sans validation explicite.

## Prévention des files GitHub Actions bloquées (30 octobre 2026)

Cette règle s'applique à **chaque chantier**, aux trois dépôts GenSrpg, Labo Combat et Labo Exploration, et à tout workflow susceptible de déclencher une publication.

1. **Avant un lot et avant de publier**, relever les SHAs des branches réellement publiées (`gh-pages` pour l'éditeur Combat ; `main` pour GenSrpg et Exploration), les PR ouvertes et les exécutions GitHub Actions des états `queued`, `pending`, `waiting`, `in_progress` et `requested`. Vérifier séparément le déploiement Pages, les CI de la branche et les runs du commit exact ; un ancien run d'une autre branche n'est pas un blocage prouvé.
2. **Trier par risque** : ne jamais interrompre un déploiement en cours, la CI du SHA actuel, un checkpoint utile, une PR active ou une synchronisation inter-dépôts sans identifier son propriétaire. Les échecs `completed/failure` ne sont **pas** des actions à nettoyer : diagnostiquer leur étape défaillante et corriger la cause. Ne pas supprimer de branche, historique, artefact ou workflow pour rendre un voyant vert.
3. **File suspecte** : une exécution sans progression depuis plus de 30 minutes est à examiner ; une exécution devenue inutile (branche/commit remplacé, PR fermée, ou ancien run après preuve d'un déploiement plus récent) peut être annulée après vérification. L'annulation doit cibler **l'ID exact du run** et être journalisée. Si l'accès disponible n'autorise pas l'annulation, le dire explicitement et transmettre son lien direct : interdiction d'annoncer un nettoyage non effectué.
4. **Concurrence** : pour une CI ordinaire, préférer une clé par workflow et par ref (`github.workflow` + `github.ref`) et l'annulation des précédentes exécutions **de la même ref seulement** ; limiter les jobs par un `timeout-minutes` adapté. Pour les publications Pages, conserver un seul propriétaire de déploiement, protéger le SHA cible et sérialiser les mises en ligne : ne jamais appliquer `cancel-in-progress: true` indistinctement à la publication.
5. **Preuve de fin** : relever les runs de CI et de Pages correspondant au commit publié, leurs conclusions, la révision réellement servie et les exécutions restant en attente. `GREEN` signifie tests requis + publication du bon SHA ; ni un ancien voyant orange ni un nouveau déploiement vert ne prouvent seuls la livraison. Refaire le contrôle de file après toute tentative de débloquage.
6. **Reprise** : inscrire dans le journal de chantier les ID des runs suspects, le motif de tri, l'action entreprise ou sa limite d'autorisation, le SHA protégé et le dernier statut connu. Toute nouvelle équipe ou conversation doit poursuivre le diagnostic à partir de ces preuves et non relancer aveuglément plusieurs workflows en parallèle.

Ces règles ne dispensent jamais des tests, checkpoints, revues et validations fonctionnelles déjà exigés par la présente charte.
