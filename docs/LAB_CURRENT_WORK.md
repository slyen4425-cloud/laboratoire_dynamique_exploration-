## 2026-11-27 — Correctif pont Combat Aventure IndexedDB (NON GREEN)
- START e471f4e2c6dc4fd492495db2ef30b701f2694c49 ; checkpoint `checkpoint/exploration-before-indexeddb-encounter-bridge-20261127`, branche `work/exploration-indexeddb-encounter-bridge-20261127`.
- PWA #693 CI 46041483079 : le vrai duel démarre mais le pont propriétaire Exploration lit encore localStorage historique et refuse le monde. Remplacer uniquement ce lecteur par la composition officielle release, asynchrone et scopée univers, avec refus propriétaire non durable. Tester historique conserve import lazy. Aucun changement Combat, carte, ressources ni sauvegarde.
- La branche main comprend maintenant #566 routes pour test labo uniquement (pas d'autorisation PWA routes). Ne pas promouvoir ce nouveau main dans PWA sans accord sur ce périmètre. CI et Pages exactes requises.

## 2026-11-26 — Bibliothèque graphique : import universel et sélecteur hiérarchique (NON GREEN)
- Demande auteur : importer directement depuis l'application les textures statiques et sprites animés, puis ranger les sélecteurs d'objets en cases dépliables par catégorie / sous-type (maisons standard/neige, arènes, décors eau/urbain, végétation arbres standard/neige/fleurs/buissons, etc.).
- START main a7b9d535880719cd50fd8935a5876e02219f2495, checkpoint `checkpoint/exploration-before-graphic-library-20261126`, branche unique `work/exploration-graphic-library-20261126`. #562 fusionnée, statut Pages exact SUCCESS, auteur a testé et validé le rendu eau/lave; PWA #683/#684 en cours. Ne pas modifier leurs pins. #561 stockage encore ouvert : intégrer sa version finale avant raccord des imports/exports de mondes; préserver ses modifications de sculpt-lab et journal.
- Audit : Builder 2D possède déjà `user-material-library.js` / `user-material-store.js`, `user-object-library.js` / `user-world-object-store.js`, résolveurs et catalogues composés; le Sculpt 2.5D filtre au contraire ses définitions natives statiques et le renderer des 5 atlas eau/lave a des IDs fermés. **Réutiliser et étendre ces propriétaires**, pas de troisième bibliothèque de blobs ou nouvelle autorité de placement/terrain.
- Phase A : arbre de présentation dérivé de la taxonomie existante, sélecteur natif details/summary, catégories et sous-catégories, une seule sélection et aucun renommage d'ID. V80 historique inchangé. Recherche locale et vignettes chargées à la demande; pas de préchargement de tous les assets.
- Phase B : point d'entrée bibliothèque unique pour importer PNG/JPEG/WebP statique, planche sprites, images multiples, ZIP de frames et GIF; extraction/validation des dimensions, aperçu de boucle, vitesse, échelle, type, nom et dossier personnalisable. Extension versionnée des modèles/stores existants, identifiant généré et contenu dédupliqué, intégration catalogue/résolveur et rendu natifs, zéro dépendance GitHub en jeu. Ne pas stocker les images en localStorage ni les dupliquer dans chaque carte.
- Phase C : autoriser les références personnelles dans SculptTerrain/WorldObject et leurs serializers canoniques (ne jamais filtrer silencieusement un ID inconnu, signaler asset manquant et préserver données). Support des matériaux animés de sol/eau/lave, navigation indépendante. Raccord backup externe/IndexedDB #561 par contrat après stabilisation, import/restore atomique et vérification des assets utilisés. Préserver anciens IDs et fichiers historiques, pas de suppression.
- Gates : test unitaire arbre exhaustif sans doublons; Chromium sélection catégories/variantes, PC et paysage mobile; import réel puis pose/peinture, sauvegarder, recharger, jouer, exporter/restaurer, fichier corrompu et quota sans perte; mesurer cache et poids; preview et validation auteur avant fusion; CI exacte et Pages HTTPS; pas de PWA depuis ce labo.

- Incrément B : formulaire Sculpt 2.5D, prévisualisation partagée, choix objet/texture, dossier technique natif et famille de terrain. Écriture dans les deux stores IndexedDB existants, validation avant écriture, relecture, insertion sans écrasement et déduplication d’imports techniquement identiques y compris anciens IDs. Tests concurrence et quota ajoutés. Pose/peinture 2.5D encore non raccordées, signalées dans le formulaire. Ponts personnels hors contrat existant. Aucune nouvelle base, aucun changement de main ou PWA. NON GREEN jusqu’à phase C, tests et validation auteur.

- Incrément C1 : injection explicite des catalogues composés dans les opérations de placement, édition et sérialisation de scène, ainsi que dans les peintures sol/route. Références personnelles absentes refusées explicitement sans suppression silencieuse, règles natives inchangées. Tests de round-trip et validation de ressources. Pas encore de raccord runtime des sélecteurs ni du rendu des textures importées ; eau personnelle et backup #561 à traiter. NON GREEN.

- Incrément C2 : composition en lecture seule des catalogues existants et des résolveurs locaux, mêmes définitions personnelles pour rendu/collision, chargement des deux stores et libération des URL Blob. Adapter WorldArea lecture/sauvegarde/récupération accepte le catalogue injecté, validation WorldBuilder avec ce même catalogue. Tests de round-trip et absence explicite. Le montage dans Sculpt/Jouer et les sélecteurs restent à raccorder ; frange, intérieurs, presets et sauvegarde externe devront être traités avant activation. Aucun nouveau stockage ni changement PWA. NON GREEN.

- Incrément C3 : sauvegarde portable des deux bibliothèques personnelles dans le panneau Import, identifiants historiques et atlas conservés. Contrôle intégral des empreintes et décodage réel avant écriture, refus des conflits, ajout seul et reprise idempotente si quota/interruption. Limite provisoire 64 Mio d’images par export ; catégories et cartes non incluses, raccord de sauvegarde WorldDocument #561 restant. Tests ajoutés. CI précédente : core et pixels HTTPS réussis, test musical Chromium a échoué sur la preuve Resource Timing (timeline audio avançait). Pas de modification audio ni neutralisation du test. NON GREEN.

- Incrément C4 : Sculpt autonome charge les bibliothèques IndexedDB avant lancement, rafraîchit après import/restauration, place et édite les objets personnels via les mêmes commandes, catalogue visuel/collision et rendu atlas natif en Tester ; export/import scène accepte le catalogue composé. Aucun second modèle. Pose personnelle volontairement bloquée dans World Builder, frange et intérieurs tant que les propriétaires de sauvegarde et de transfert ne sont pas raccordés. Reste peinture/animation des textures, Jouer et transport WorldDocument #561, tests navigateur. NON GREEN.

- C4a : CI 45865934363, 1515/1518 tests réussis. Trois sentinelles textuelles attendaient encore le catalogue natif en dur ; vérifier désormais le même appel de politique et catalogue injecté, sans retirer les tests fonctionnels des ponts/escaliers. Échec audio indépendant : état playing, readyState 4 et timeline >0.15 mais Resource Timing vide pendant le streaming. Le serveur du smoke atteste désormais la réponse MP3 réellement servie pour la piste exacte ; geste natif, progression et arrêt restent requis. Aucun changement audio runtime ni contournement des gates. NON GREEN.

- C5 : textures personnelles statiques de sol/route ajoutées au sélecteur existant (groupe Mes textures) dans Sculpt autonome, même registre pour image, famille, base, peinture/effacement, undo/redo, raster et export scène. Les textures animées ne sont pas présentées comme utilisables tant que la couche dynamique n’est pas prête ; import d’une scène contenant ces textures explicitement refusé sans modification. Frange, intérieurs et World Builder gardent leur garde-fou. Recharge contrôle les références utilisées et invalide les caches dérivés. CI et test navigateur encore requis. NON GREEN.

- Audit files 26/11 22h16 CET : main Exploration a7b9d535, PR #564 HEAD 9763645c, run push 45895563639 annulé par concurrence, run PR 45895570946 terminé en échec core (2 sentinelles textuelles de l'ancien registre en dur), pixels HTTPS ET musique native réussis ; publication 45895570923 bloquée par les mêmes tests. Mise à jour des sentinelles pour exiger l'appel au registre composé, sans suppression des tests de comportement. Aucun run actif Exploration relevé. #561 HEAD 1ff0250f CI 45869970966 et assemblage 45869970990 verts mais DRAFT ; ne pas fusionner à sa place. Combat main dcb464e5, gh-pages cb9befb1, #404 HEAD cca99ce9 CI verte, deux runs anciens 37642387886/37642387764 sur e87a6acc ancêtre main (3292 commits derrière) ; PWA main 24a3653c déploiement 45861284965 réussi, onze runs anciens sur de2e03d6 de #396 déjà fusionnée (HEAD final 475986fa) : 43098722616,43098722620,43098722624,43098722558,43098722568,43098722566,43098722779,43098722659,43098689492,43098689487,43098689513. Aucun outil d'annulation Actions disponible dans le connecteur ; ne pas supprimer de branche ni workflow. Pas de preuve que ces runs anciens bloquent la CI récente. Aucun autre dépôt modifié. NON GREEN.

- C6 : sauvegarde graphique portable étendue au classement personnel via son store existant, format v1 rétrocompatible (champ facultatif layout). Fusion additive, IDs et ordre local conservés, conflits et cycles refusés avant écriture des images ; CAS du classement après relecture des images, reprise idempotente sans écrasement en cas de concurrence. Rechargement du sélecteur après restauration. Tests de hiérarchie, conflit, anciens fichiers et concurrence. NON GREEN avant CI exacte ; placement World Builder, textures animées et raccord #561 restent ouverts.

- C7 : le serializer et l’archive WorldDocument natifs peuvent transporter une référence personnelle dont l’ID généré est valide, même avant restauration locale de la bibliothèque ; validation explicite avec catalogue composé stricte, et montage Sculpt refuse toujours la ressource manquante. Aucun faux objet ni fallback, aucun blob dans les cartes. Test d’aller-retour avec archive native, restauration des mêmes IDs, validation stricte et refus d’ID forgé hors namespace/kind. Garde-fous UI de placement World Builder maintenus jusqu’au raccord de tous les consommateurs/stockage #561 et tests réels. NON GREEN.

- C9 : raccord du catalogue composé aux montages WorldArea, transitions, save et snapshot de secours. Prévalidation de toutes les références personnelles du monde avant ouverture et avant remplacement du catalogue, refus explicite sans mutation en cas de bibliothèque absente. Pose et peinture sur cartes extérieures autorisées dans la branche, lecture Jeu avec base personnelle ; frange, intérieurs et eau personnelle restent gardés. Test de références manquantes et conservation des octets. Gate navigateur et intégration #561 encore requises. NON GREEN.

### Dépôt auteur reçu — 27/11
- L'auteur a déposé le pack complet de test (blob f2665b93e98aa28abd791234d14b7c754c4ef54e, SHA256 b03e2098c7b38d6a2406c6a64657df3e15d3a6f9cfc3411d992d59f5188b6978), plutôt que le ZIP réduit prévu. Le même blob est renommé GenSRPG_heros_vert_complet_test_jeu.zip pour exclusion Pages, sans perte ni duplication. Le script utilise directement les huit archives directionnelles approuvées, une réduction isotrope commune 512→156 centrée sur 128×160 (2 px vertical), aucun recadrage individuel. Vérification locale des 48 images et des deux miroirs exacts. Ce choix de conversion diffère légèrement du ZIP réduit précédemment préparé, mais conserve les poses et le cadrage. L'Idle demeure dans le ZIP source uniquement. Le script précédent est remplacé, pas de second importeur. Vérifier ensuite CI exacte et publication. Les copies IndexedDB installées restent à traiter séparément avant de promettre une mise à jour en place des parties.

- C8 : textures surface/path animées dans Sculpt autonome et Tester : découpe à la lecture dans un seul canvas de frame réutilisé, sélection atlas native, alpha nettoyé, invalidation du raster terrain seulement au changement de frame, cache sans persistance supplémentaire. Activation des options et import scène avec références déjà disponibles ; test unitaire boucle/dimensions/alpha/absence de redraw inutile. Rendu pleine carte à profiler sur mobile avant validation, World Builder et eau personnelle non activés. NON GREEN.

- Réconciliation #561 : main 5d8a08b certifié Pages ; intégration du propriétaire durable, du ZIP auteur et des gates navigateur sans retrait. CI combinée obligatoire ; aucune publication PWA avant certification.

## 2026-11-26 — WorldDocument : stockage durable IndexedDB (NON GREEN, DRAFT)
- START main c3dd13358b1f4f3c8a2e8b29e40a1b5134061901 (quota #560, CI 45759990513 / Pages 45759990509 HTTPS exact) ; checkpoint `checkpoint/exploration-before-world-indexeddb-20261126`, branche `work/exploration-world-indexeddb-20261126`. Raccord PWA immédiat #677 distinct, ne pas bloquer sa validation.
- Objectif : remplacer la limite localStorage des gros WorldDocuments par un backend IndexedDB transactionnel **du propriétaire Exploration**. Ne pas modifier le schéma WorldDocument, son serializer, les IDs, les héros/PNJ/médias, les parties Core ou les données des autres modules. Le backend en préparation n'est pas branché : aucun double écrivain actif. Aucun nettoyage automatique.
- Étape 1 : stockage transactionnel versionné, validation des octets par le serializer officiel, sauvegarde précédente, comparaison de révision anti-écrasement multi-onglets, import du JSON historique ou du codec #560 sans suppression des originaux. Pas de fallback silencieux en Web Storage.
- Étape 2 (bloquante avant activation) : inventorier et rendre asynchrones tous les lecteurs/écrivains du draft, archive, projets par univers, Sculpt, Jouer, handoff et Capture. Même autorité/contrat, handoff par référence plutôt que nouvelle copie de carte, migration atomique/idempotente et provenance par univers ; bloquer les anciens writers après bascule ; libérer l'ancien stockage seulement après vérification et export explicite, sans effacer de mondes. Afficher état réel de sauvegarde, quota et erreurs; ne jamais annoncer un succès avant commit. Autosave au point de commande avec debounce et flush explicite avant navigation.
- Tests obligatoires : transactions et réouverture IndexedDB réelle, migration JSON/compressée, interruption/échec, plusieurs univers indépendants, grosses cartes multiples 80×64, écritures répétées, concurrence et relecture, Android PWA paysage, export/restauration, preview HTTPS, source Capture et publisher unique.
- Hors lot : format de partage univers complet, distribution des assets personnalisés, version des parties existantes (issue Capture #508 à compléter). La vitrine doit être un modèle officiel immuable ; les modifications de l'éditeur ne doivent jamais invalider une partie par changement silencieux de révision. Ne pas changer les contrôles de fingerprint pour contourner le problème.
- Ajouts : inventaire strict des clés historiques et migration par lot, détection des modifications concurrentes avant bascule, test navigateur réel de transaction/rollback/reload et gros WorldDocument 64 cartes 80×64 (>5 Mio JSON brut). Gates inchangés.
- Extension 26/11 demandée par l'auteur : test de capacité peuplé (64 cartes 80×64, 18 176 placements catalogue, 768 références d'acteurs, 512 tracés de surface, 64 passages, deuxième sauvegarde et contrôle de révision précédente). Mesurer octets UTF-8 et durée ; ce test ne charge pas les médias personnalisés ni ne mesure le rendu en jeu. Résultat attendu, non certifié avant CI exacte.
- Extension sauvegarde externe demandée par l'auteur : primitives de sélection explicite du dossier PC, préférence de handle IndexedDB (sans document), vérification permission, copies natives `.world.json` append-only, relecture exacte après fermeture, lecture de la révision IndexedDB confirmée, tests refus/réautorisation/échec/conflit/restauration. Préparation, pas de bouton actif ni de sauvegarde automatique tant que l'autorité IndexedDB n'est pas raccordée. Le package univers complet (Combat, héros, PNJ, médias, règles et parties optionnelles) reste du propriétaire Capture #508 ; pas de promesse de backup complet avec ces seuls fichiers de cartes.
- Session éditeur asynchrone : commandes dirty/pending, debounce local, flush transactionnel, validation de la révision et sérialisation unique, édition pendant écriture, erreurs sans effacement, callback de sauvegarde externe après commit distinct de l'acquittement primaire. Tests des courses et quotas. Aucun branchement des pages avant migration coordonnée de tous les lecteurs/écrivains.
- Raccord de la copie externe aux panneaux Monde et Carte 2,5D (même sérialiseur/importeur). Opt-in dossier, contrôle permission, cadence 5 min pendant l’édition seulement, comparaison du contenu, arrêt sur erreur et reprise explicite, désactivation sans supprimer les fichiers. Copie de secours validée du document en mémoire, même si la sauvegarde primaire est en échec ; n’acquitte jamais la sauvegarde principale et ne remplace jamais l’autorité de jeu. Snapshot 2,5D réutilise exactement le chemin canonique de commit sans mutation ; exclusion de Jouer/Tester. Tests du vrai dossier physique via adaptateur Node et contrôles d’UI à compléter. La PR reste DRAFT, les anciens lecteurs/écrivains ne sont pas encore migrés vers IndexedDB.
- Correctif de sécurité du vrai World Assembler : une erreur de stockage ne doit plus être remplacée par un message d’opération réussie, ni autoriser navigation vers Sculpt avant sauvegarde. Test de câblage des contrôles externes en Chromium avec handle natif OPFS isolé (pas un vrai dossier PC, test Node disque distinct), lecture du WorldDocument et désactivation sans effacement.
- Commandes natives sous transaction IndexedDB : réutilisation exacte de la bibliothèque et allocation projets historiques sur vue mémoire strictement confinée à la transaction (pas de cache persistant), documents/indexes ensemble, retrait explicite avec conservation des octets précédents, migration documents et métadonnées sans effacement, protection de brouillon par comparaison de version. Test navigateur réel création de deux univers, archive, activation, rollback et conflit. Ne pas activer en production avant bascule coordonnée des consommateurs Capture/Exploration.
- CI 45817598694 : core-tests et native-https-pixels GREEN ; la preuve réelle Builder/Encounter est GREEN mais le nettoyage du profil Chromium a échoué ENOTEMPTY (job 139901377103). Fermeture CDP, groupe de processus dédié et attente du nettoyage, sans masquer les assertions ni relancer les tests en boucle.
- CI exacte a62c3833 : 45818241409 + 45818241475 GREEN, preuve transaction native et contrôles copies externes (OPFS test seulement). Raccord asynchrone des commandes de World Assembler : une instance d'accès par page, file d'écritures acquittées, comparaison du dernier document, transitions après commit, archive et index via le propriétaire natif, handoff IndexedDB par référence versionnée. La construction par défaut garde le seul propriétaire legacy jusqu'au raccord Sculpt/Jouer/Capture ; aucune double écriture ni activation partielle de production. Tests de la référence durable et conflits à compléter.
- Test navigateur additionnel : réinstalle le vrai World Assembler sur propriétaire IndexedDB dans profil Chromium isolé (pas de flag public), ajoute une zone via formulaire natif, archive via bouton Mes mondes et relit les deux documents après réouverture du backend, sans copie localStorage. Avertissement avant fermeture si sauvegarde non confirmée.
- Correction CI ad95d005 : cinq sentinelles de code suivent désormais la vraie chaîne UI → accès natif → bibliothèque/handoff (contrôles d'identité et confirmation conservés). Le smoke Chromium attend la confirmation effective de l'enregistrement et la NOUVELLE page après reload au lieu de lire un probe périmé. Aucun test désactivé, aucune bascule de stockage.
- Correction CI e37209bd : sentinelle de suppression suit le vrai propriétaire via access.remove, confirmation inchangée. La sélection de zone après ajout/préset/import est désormais immédiate après validation du document en mémoire, avant acquittement async (et jamais annoncée sauvegardée avant commit). Cela évite de naviguer vers l'ancienne zone lors d'un clic immédiat Carte 2,5D ; le smoke intérieur conserve précisément cette séquence et ajoute une assertion de sélection + diagnostics. Aucun test neutralisé.
- CI 7209a064 : 45826941836 / 45826941808 GREEN, navigateur réel World Builder IndexedDB ajout/archive/relecture, référence handoff et sauvegarde 22,8 Mo. Synchronisation de la branche avec main 7dd03a1a (#563 ergonomie) via arbre de fusion GitHub vérifié e2960bff, deux parents exacts. Aucun changement sur main ni sur la publication PWA ergonomie.
- 2,5D : transitions maison/étages/retour Monde/destination via coordinateur unique, attente du commit avant montage, protection contre écriture concurrente, conservation du document précédent sur échec, flush synchrone legacy au pagehide seulement si aucune transaction. Tests unitaires du coordinateur (attente, concurrence, échec, reprise) ; backend legacy encore seul actif, raccord IndexedDB à finaliser. Ne pas fusionner avant CI exacte et raccord complet.
- 2,5D et Jouer utilisent désormais le même accès asynchrone que World Assembler pour lecture, enregistrement et handoff. Suppression des appels directs WorldDocument dans Sculpt (presets et progression inchangés), aucune écriture de secours legacy si propriétaire durable choisi, vérification du transfert périmé, tests sentinelles mis à jour pour le chemin réel. Entrées de production encore legacy, activation coordonnée avec Capture à terminer.
- CI cec900a : native-https-pixels et modern-combat-encounter GREEN ; unique assertion Hero ancienne lecture corrigée sans changer collision/caméra. Autosave 2,5D pour propriétaire durable : délai 1,2 s après interaction, maximum 15 s, aucun enregistrement en Jouer/Tester, état de sauvegarde distinct, avertissement fermeture si travail non confirmé, transitions verrouillées, pas d'écriture IndexedDB en pagehide. Tests de concurrence et d'échec. Activation de production toujours différée jusqu'au raccord Capture/migration.
- Preuve navigateur de bout en bout 2,5D sur IndexedDB : composition injectée exclusivement dans le serveur localhost du smoke (pas de flag public), vrai handoff par référence, vrais contrôles Rencontre, autosave et relecture native, retour Monde sur même propriétaire. Départ explicitement confirmé n'affiche pas d'avertissement de fermeture obsolète. CI requise ; pas de publication ni de bascule legacy.
- CI 809680a : core-tests et pixels GREEN ; navigateur durable atteint le vrai Sculpt mais catalogue Combat absent dans ce smoke de stockage. Le test utilise à présent une vraie règle WorldArea indépendante du catalogue, contrôle inversion, révision et relecture ; les gates Combat restent inchangés. Ajout du marqueur de migration transactionnel SHA-256 des octets legacy (documents et index) : réouverture sans rejouer les copies historiques, détection de modification d'ancien onglet, conservation des deux versions ; test IndexedDB réel. Pas encore branché en production, pas de garantie de clôture forcée d'un onglet ancien.
- CI 45840568666 exacte f8250d2 : core-tests, pixels HTTPS et navigateur GREEN ; preuve réelle du 2,5D durable, relecture et retour Monde, 22,8 Mo, migration et protection des versions. Synchronisation avec main a7b9d535 (eau/lave) : application exacte de tous les hunks de main sur les trois fichiers communs, tous les autres fichiers de main conservés. Nouvelle CI obligatoire.
- Raccord migration : point de composition natif `openMigratedWorldDocumentOwnerV1`, migration atomique et contrôle des octets legacy avant/après chaque commande et handoff durable. Aucun fallback, blocage de la commande en cas d'ancien writer détecté. Test réel du propriétaire clôturé, menu Jouer lit désormais par le même accès async. Activation différée : le propriétaire Capture doit encore migrer sa bibliothèque, orchestrateur univers et préflight/événements/rooms (révision source constatée db574eeb) ; les deux garde-fous de navigation de World Assembler ne seront retirés qu'au raccord coordonné. Aucun changement de parties ni de PWA dans ce commit.
- CI 45865588197 : core/pixels GREEN ; smoke audio réel joue et avance (0,187 s), mais Resource Timing ne contient pas la requête MP3 (buffer partagé avec assets). Le serveur HTTP isolé relève désormais les lectures MP3 réussies et non vides ; les assertions geste réel, piste et progression restent obligatoires. Nouvelle CI requise.
- NON GREEN : aucune mise en production du backend de préparation avant raccord et tests réels, aucun effacement localStorage.

- Sécurité du handoff asynchrone : contrôler la référence sessionStorage observée avant/après attente IndexedDB, refuser l'ancienne lecture/écriture si un transfert plus récent est arrivé ; ne jamais consommer ni écraser le nouveau transfert. Trois tests de concurrence et consommation unique. Pas de bascule production ni modification du contrat WorldDocument. NON GREEN jusqu'au raccord Capture et CI exacte.

- Contrat de raccord Capture : l’accès WorldDocument expose sur sa composition non scoped les sept commandes asynchrones natives de projets (list/load/createBlank/addBlank/copy/save/activate) via le même run transactionnel, sans réimplémenter d’allocation ni de stockage. Test de délégation intégrale et absence de fallback. Aucun changement de l’autorité active avant adoption coordonnée de ce contrat. NON GREEN.

- Raccord de composition commun aux entrées Monde, Sculpt, Jouer et ancien Builder : un seul choix de propriétaire compilé (legacy jusqu'au raccord Capture), retrait des blocages artificiels de navigation après commit, conservation de l'identité univers dans Jouer/retour et accès asynchrone au transfert. Le smoke déclenche désormais le vrai bouton Carte depuis le monde durable et non un handoff synthétique. Aucun fallback après échec de migration. NON GREEN jusqu'à CI et activation coordonnée.

- Import explicite d’un WorldDocument de salon dans l’univers invité via propriétaire natif : identité et octets du document hôte conservés, refus de divergence ou d’attribution à un autre univers, ajout idempotent sans activation ni modification du brouillon. Archive/index dans la même transaction IndexedDB, accès `importShared` distinct de l’archive auteur. Tests d’isolation, confirmation, refus d’écrasement. Raccord Capture restant. NON GREEN.

- Candidat d’activation : propriétaire de release IndexedDB sélectionné dans le code (aucun fallback localStorage). Les smokes navigateur de Jouer, monde/portails, carte/relief et PNJ lisent et préparent désormais les documents via le même propriétaire natif. Le smoke maison démarre sur un origin de test vierge, injecte uniquement un ancien document avant tout boot puis ouvre la vraie page Sculpt et vérifie migration et conservation de la source historique. Le harness transactionnel historique garde son mode legacy isolé du produit. CI exacte et adoption Capture #685 obligatoires avant publication PWA. Pas de fusion anticipée.

### Dépôt auteur reçu — 27/11
- L'auteur a déposé le pack complet de test (blob f2665b93e98aa28abd791234d14b7c754c4ef54e, SHA256 b03e2098c7b38d6a2406c6a64657df3e15d3a6f9cfc3411d992d59f5188b6978), plutôt que le ZIP réduit prévu. Le même blob est renommé GenSRPG_heros_vert_complet_test_jeu.zip pour exclusion Pages, sans perte ni duplication. Le script utilise directement les huit archives directionnelles approuvées, une réduction isotrope commune 512→156 centrée sur 128×160 (2 px vertical), aucun recadrage individuel. Vérification locale des 48 images et des deux miroirs exacts. Ce choix de conversion diffère légèrement du ZIP réduit précédemment préparé, mais conserve les poses et le cadrage. L'Idle demeure dans le ZIP source uniquement. Le script précédent est remplacé, pas de second importeur. Vérifier ensuite CI exacte et publication. Les copies IndexedDB installées restent à traiter séparément avant de promettre une mise à jour en place des parties.

## 2026-11-27 — Héros vert, remplacement des 8 marches (NON GREEN)
- Reprise du lot audit héros du 26/11 sur la branche existante `work/exploration-hero-sprite-repair-20261126` (START historique a7b9d535880719cd50fd8935a5876e02219f2495, audit 45895947897 réussi, 576 sprites). Intégration du main courant `98f76585c6109e46558d364e6ac697ed4319963e` sans écraser les autres lots.
- Auteur valide le cadrage et les miroirs SW=SE et NE=NW; demande remplacement direct du héros existant pour test en jeu, sans modification éditeur. Pack 48 PNG RGBA au canevas actuel 128x160 par transformation commune des frames HD, aucune modification du catalogue, ID, portraits, FPS, ni autre héros. ZIP source SHA256 0d531bab839d711db6c28dc842aaa8ce6bb26db9e91e9c43b2ca7926aae1d3ac; nom GenSRPG_heros_vert_remplacement_20261127.zip (exclu de Pages par règle GenSRPG_heros_*.zip). Idle distinct hors lot. Le workflow de branche vérifie et remplace uniquement les 48 chemins canoniques. Pas de fusion automatique ni publication avant CI exacte.
- Attention: les héros déjà installés dans IndexedDB conservent leurs blobs; une mise à jour conservatrice de ces copies (IDs et réglages inchangés, sprites personnalisés jamais écrasés) est à traiter avant d'affirmer que les anciennes parties sont corrigées. Aucun changement du stockage ou de l'éditeur dans ce lot assets. Prochaine étape: dépôt du ZIP auteur, vérification du commit des PNG, CI, test en jeu, publication distincte si autorisée.

## 2026-11-26 — Eau vivante peignable, matériaux animés (NON GREEN)
- START `c3dd13358b1f4f3c8a2e8b29e40a1b5134061901`, checkpoint `checkpoint/exploration-start-living-water-20261126`, branche `work/exploration-living-water-20261126`. Lot visuel distinct du chantier sauvegardes. Pas de modification du stockage, des collisions, des ponts, du WorldDocument ni des autres dépôts. Une extension facultative compacte de SculptTerrain conserve les identifiants de matériaux d'eau par cellule dans le serializer existant (pas de clé de stockage supplémentaire). Coordination requise avant fusion avec le chantier sauvegardes.
- Quatre matériaux existants, pinceau Remplir et Peindre l'eau; sprites de surface générés en atlas déterministe et mis en cache, rivage turquoise et écume animée automatique, profondeur, rendu statique natif conservé. Une seule boucle de rendu, réutiliser le raster du terrain, masquer l'animation selon l'ordre réel du terrain. Conserver V80 et les anciennes cartes; aucun ajout d'assets dupliqués.
- Tests : héritage des anciens JSON, peinture sans changer niveaux, undo/export/import via WorldArea, rendu des rives, boucle atlas, coût mobile et test navigateur réel. CI exacte, preview et validation auteur, taille Pages et SHA HTTPS obligatoires avant GREEN. Pas de PWA sans validation.

### 2026-11-26 — validation artistique et dépôt auteur
- Les cinq GIF ont été validés visuellement par l'auteur puis déposés dans `Genesis_textures_animees_eau_lave.zip` (blob Git `cd1535c7211f80efb378f7ea57c68dab23c21c7d`). Remplacement complet de l'ancien sprite procédural par atlas de 9 frames dessinées, 168×126 par frame, générés hors navigateur par `npm run build:water`. Les rives sont encore calculées par le renderer unique; lave chaude sans écume blanche, aucun changement de gameplay.
- Le ZIP source est conservé dans le dépôt et exclu du site assemblé. Les cinq PNG canoniques produits par le build sont les seules ressources d'animation runtime. L'intégrateur GenSRPG devra exécuter `npm run build:water` sur la révision source épinglée avant de copier les assets et exclure le ZIP. Aucun double dépôt de fichiers ni modification PWA par Exploration.
- Validation locale indépendante des 45 frames : bords opposés exactement égaux après lissage de 12 px; estimation PNG 1 088 654 octets (build CI exact à confirmer). Chargement des atlas à la demande et cache d'un seul canvas de frame par matériau. Le test de raccord réel et la mesure PC/Android restent nécessaires. `main@7dd03a1aa718e6e71ecfb95519db430a002e0bff` a été intégré à la branche uniquement, sans écraser l'inspecteur intérieur ni le chantier sauvegardes.

## 2026-11-25 — World Builder : quota de sauvegarde « Monde_alpha » (NON GREEN)
- Signalement utilisateur : `Failed to execute 'setItem' on 'Storage': Setting the value of 'gensrpg.world-assembler.document.v1' exceeded the quota` dans Sculpt World Builder ; copie `Monde_alpha.world-recovery.json` téléchargée mais NON validée. **Ne jamais effacer localStorage, les autres mondes, les projets, les assets ou les parties.** Conserver l'onglet/la copie de secours jusqu'à validation.
- START Exploration `main@afb8d878f4c0b60c61aef4bf59306d518481efe6` ; checkpoint `checkpoint/exploration-world-quota-before-20261125`, branche `work/exploration-world-quota-safe-storage-20261125`. Aucun chantier #559, PWA #676, Combat ou asset modifié.
- Cause observée : le serializer officiel produit un WorldDocument JSON pouvant dépasser le quota Web Storage, notamment lorsqu'il coexiste avec le même monde archivé et d'autres archives. Le navigateur limite localStorage indépendamment de l'espace disque.
- Correctif : encodage compact LZW12 réversible sous préfixe versionné à la frontière Web Storage, avec lecture automatique du JSON historique et de l'encodage compact. Le WorldDocument, ses WorldAreas/Portals/Spawns/objets/terrains et son serializer canonique restent strictement inchangés. Compression uniquement si le texte est suffisamment grand et que le bénéfice est mesurable ; vérification exacte des bytes originaux avant toute écriture. Si quota lors de l'enregistrement du brouillon : comprimer facultativement **l'archive de ce même monde** seulement après lecture/validation de sa version complète, puis réessayer ; aucune suppression ni réécriture d'un autre monde. Handoff de session également compact, transfert consommé après validation.
- Tests attendus : gros terrain 80×64 (limite native) + Unicode, import/export identiques, ancienne archive JSON, copie compacte, quota simulé et impossibilité totale avec ancien brouillon conservé, bibliothèque/univers indépendants, CI complète/Chromium mobile, preuve du SHA Pages et validation de récupération manuelle du fichier utilisateur avant déclaration GREEN.
- **NON GREEN** jusqu'aux résultats de PR, revue, CI et vérification HTTPS ; pas de repin PWA automatique sans source certifiée ni confirmation que la sauvegarde de l'utilisateur est récupérable.

## 2026-11-25 — PNJ vaincus et interaction dresseur en Jouer (NON GREEN)
- Signalement : créature errante vaincue encore dessinée et réengageable ; Gorille PNJ n'engage plus de duel, sans message. Base `main@da445a85caa11d3d0503a3fc1227cad4e6b11471` (#558 85 décors), checkpoint `checkpoint/exploration-wild-victory-before-20261125`, branche `work/exploration-wild-victory-play-20261125`.
- Exploration ne possède ni récompense ni victoire : lire uniquement `wildVictories` du contrat `AdventureSession` Capture dans la projection same-session/same-world/same-area ; filtrer les acteurs vaincus dans l'unique projection native utilisée par le rendu, le dialogue et le contact sauvage. Le WorldArea éditeur, le placement, les IDs, les patrouilles validées et les monstres d'autres sauvegardes restent intacts.
- Dresseur sans duel : laisser visible l'action de dialogue même si équipe/session invalide, afin d'afficher la cause déjà fournie par `sculptTrainerChallengeNotice`. Aucun combat artificiel, aucune autorité concurrente.
- Tests : projection par zone, validation stricte session, acteurs non sauvages inchangés, non-régression des contacts, combat et NPC ; CI et navigateur sur SHA exact, Pages HTTPS avant fusion/pin Capture. Ne pas empiéter sur PR patrouille #549, Combat/PWA ni V80.

## 2026-11-25 — Lot décors Genesis Fantasy Diorama (NON GREEN)
- START `8a0b5c531834f5b55f766a999e973b3490debfa5`, checkpoint `checkpoint/exploration-start-decor-assets-20261125`, branche `work/exploration-decor-assets-20261125`. Dix ZIP source déposés sur main par l'auteur; préserver les 77 images originales, les réserves et tous les anciens IDs.
- Périmètre: uniquement assets décoratifs, taxonomie et registres natifs existants. Détourage alpha, découpe des composants réellement séparables, WebP optimisé, manifeste de provenance et contrôles de taille; aucun assemblage occulté découpé artificiellement. Fleurs/herbes franchissables, collisions paramétrées via contrat existant pour mobilier/clôtures. Aucun changement des moteurs, sauvegardes, V80, Combat ou PWA.
- Gate: contrôle visuel planche sur fond neutre, alpha, dimensions, empreintes, résolution catalogue, CI exacte et preview navigateur avant fusion; Pages exact et checkpoint GREEN avant raccord PWA. Aucune publication de ZIP source ni duplication de bibliothèque.
- Import terminé et vérifié : run 45668310218 SUCCESS, commit des 85 WebP `c01d13f70bd61f4c197fdcfff509ce12525d10ad`, 4 298 742 octets, 85 empreintes distinctes, 77 sources et 10 ZIP conservés. Test natif spécifique réussi; 21 sources non retenues conservées. Validation explicite auteur des découpes le 25/11 (« tes decoupage sont parfait »). Workflow temporaire retiré après réussite (aucune suppression d'asset).
- Les runs 45669268010 / 45669268027 / 45669268069 du commit bot ont conclu action_required sans jobs; nouvelle CI du commit de finalisation initiée depuis le connecteur. Aucun contournement des gates. Main a avancé via #557, diff disjoint (sculpt-lab.html et test porte), conserver ces modifications. Statut NON GREEN jusqu'aux preuves de CI, preview réelle et Pages.

## 2026-11-25 — Extension explicite auteur du lot #555 : éclairage et ambiance (NON GREEN)
- Même branche et START; auteur demande de développer les effets maintenant, avant validation du lot visuel. Un seul réglage facultatif `WorldDocument.lighting` via normaliseur, scène autonome via export existant. Panneau repliable dans réglages de sculpture, pas de stockage supplémentaire. Direction commune (repère monde), couleur/opacité de défaut, AO optionnelle, lumière chaude et nuages optionnels. Exceptions d’objet/modèle conservées, aucune mutation des placements. Réutiliser masque alpha, relief et boucle RAF existants. V80 sans contrôles ni effets, aucun changement de collisions, PWA, autres PR. Tester valeurs historiques, rendu, sauvegarde et mobile. CI exacte et validation visuelle obligatoires.

## 2026-11-25 — Orientation des ombres d'objets et de modèles (NON GREEN)
- START main `55aac7cef63134e6f92355bf530c8967d08d0d10`, checkpoint `checkpoint/exploration-start-shadow-direction-20261125`, branche `work/exploration-shadow-direction-20261125`. Statut Pages main success; liste exhaustive des runs non accessible via le connecteur. PR #554/#551/#549 indépendantes, aucun changement ni annulation sur ces lots.
- Propriétaire: réglages visuels canoniques `world-object-shadow-settings-v1` et unique `drawWorldObjectContactShadowV1`, panneau Objet > Ombre existant. Rotation facultative autour du pied, 0° conserve la projection historique, par objet ou modèle; héritage et miroir existants conservés. Pas de nouvelle autorité, ID, cache, asset, stockage ou moteur. Anciennes cartes inchangées. Aucune modification gameplay, collision, profondeur, terrain, V80, PWA ou autre dépôt.
- Tests: normalisation/égalité/rotation et ancrage, profils, sauvegarde/import, CI Node + Chromium, contrôle visuel Pixel/PC; pas de fusion ni publication sans gates. Orientation commune à la carte, teinte/ambiance et nuages sont hors périmètre de ce premier candidat.

## 2026-11-25 — Publication #551/#554 : compatibilité gate HUD Combat main (NON GREEN)
- #551 fusionnée main e272279c560be19f32d8475b5dd78195ee6c7786. Runs 45621439981/45621439830 et #554 45621540376/45621540356 échouent tous au même smoke HUD : `layout-or-slot-missing:none:true`. Le checkout Combat live est désormais b4488fccae19dc6e8c921f700c2338a4a3be225a (#396) et son propriétaire convertit les anciens offsets en rectangles absolus, sans translate. Vérifier dans le navigateur le même noeud natif, marqueur de rectangle, coordonnées/dimensions réellement mesurées et bornes de l'arène; conserver le contrôle des compétences et de la disposition historique non modifiée. Aucun changement de moteur HUD ni gate désactivée. Refaire la CI/revue exacte de #554; certifier le main cumulatif avant raccord Capture #661.

## 2026-11-25 — Marchand dans Tester (C2, NON GREEN)
- START 55aac7cef63134e6f92355bf530c8967d08d0d10, checkpoint `checkpoint/exploration-start-merchant-editor-test-20261125`, branche dédiée `work/exploration-merchant-editor-test-20261125`. Ne pas mélanger #551 portes.
- Le mode Tester n'a pas d'AdventureSession. Héberger l'unique commerce Capture en iframe corrélé par nonce et origine, dans le même univers ; simulation et transactions dans le propriétaire Capture #661, aucun inventaire ni stock Exploration. Mode partie inchangé. Test de contrat puis CI/preview et test navigateur Capture avant repin PWA.

## 2026-11-25 — Reprise #551 après marchand #552 (NON GREEN)
- Main marchand afdd45a4ab4065c0921b160a38a948ca3663e62f, CI 45569743090 et Pages HTTPS 45569743151 SUCCESS. Réconciliation des deux fichiers Sculpt par hunks exacts du lot porte sur main, aucun retour arrière marchand. Revue #551 : raccorder le World Builder historique au même endpoint ; updatePortal marque les déplacements réels, contrôles/rendu lisent resolvePortalWaypoint, changements visuels conservent la géométrie. Test du placement et de l'aller-retour. Nouveau SHA à certifier avant fusion.

## 2026-11-25 — #551 réconciliation après #553 (NON GREEN)
- Conserver les trois changements main #553 (dialogue marchand, test et journal). Corriger les deux observations restantes : champs de coordonnées Sculpt au point effectif, action Modifier l’arrivée vers le Portal inverse, pas le Spawn historique. Pas de modification du stock ou de la logique marchande. Revue et CI du SHA exact avant fusion.

## 2026-11-25 — Marchand : dernier dialogue ouvre le commerce existant (NON GREEN)
- START afdd45a4ab4065c0921b160a38a948ca3663e62f, checkpoint `checkpoint/exploration-start-merchant-dialogue-trade-20261125`, branche `work/exploration-merchant-dialogue-trade-20261125`. #552 main CI 45569743090 / Pages 45569743151 SUCCESS. #551 portes et #549 hors périmètre.
- Le bouton Terminer d'un dialogue marchand pouvait fermer le dialogue sans ouvrir l'échange. À la dernière ligne, le bouton principal devient Commercer et appelle l'unique requestNpcMerchantShop, après fermeture du dialogue. Le raccourci n'est présent que pendant les lignes intermédiaires, Fermer reste une annulation. Marchand silencieux, dresseurs et dialogues ordinaires conservés. Aucune modification de PNJ enregistré, liaison, stockage, moteur, stock, prix ou transport. Test de contrat et navigateur Capture avec vrai PNJ parlant requis avant publication PWA. Correction visuelle des stocks côté propriétaire Capture dans #657.

## 2026-11-25 — Porte de bâtiment : passage manuel et repère partagé (C2, NON GREEN)
- CI 45555652346 : Chromium modern-combat et native pixels verts, deux sentinelles de rendu rouges. Revue Codex d36967a8 : préserver discriminant `kind:point` pour porte intérieure. Corrigé au raccord du renderer ; sentinelle architecture vérifie le résolveur canonique, test rendu compare le point réellement interactif au canvas. Pas d'exception ni de seuil relâché.
- Reprise du run 45554840137 et revue Codex a4e9e2b : 2D historique utilise l'entrée par mouvement uniquement pour les passages automatiques et le bouton Interagir pour les portes; rendu au point effectif. Scènes Sculpt autonomes historiques hors WorldDocument gardent leurs coordonnées et comportements d'origine. Rayon par curseur, tests présets adaptés à la position partagée sans supprimer les tests historiques. Nouvelle CI exacte requise.
- START `46654efe2b7d084d8ae891362e5d4e2999c3ab8c` (raccord #550 fusionné, CI/Pages du main en validation), branche `work/exploration-building-door-waypoints-20261125`. Lot préparé sans fusion avant certification du précédent. Préserver toutes les références Portal, Spawn, bâtiment et WorldArea, ainsi que les étages.
- Le couple est retrouvé via l'ancre bâtiment existante et le Spawn de retour ancré. Une seule position par côté : arrivée historique sûre par défaut, ou le Portal.trigger lorsque l'auteur le déplace. Le Spawn historique est conservé pour compatibilité ; le franchissement du couple utilise la position du repère, pas une seconde position active. Les passages inter-cartes gardent le déclenchement sur contact; portes extérieur/intérieur sur clic à proximité.
- Réutilisation de Passages : un repère par côté, déplacement, rayon, cercle/ombre/texture/invisible. Tests de l'aller-retour, anciens mondes, marqueurs, pas d'auto-entrée, export/import ; contrôle Chromium PC/mobile et CI/Pages exact SHA avant GREEN. Pas de PWA/Capture/Combat ni d'asset modifié. Aucun run annulé.

## 2026-11-25 — Compatibilité marchand
- Aligner la normalisation des références PNJ sur la limite canonique Capture de 130 caractères (#654). Test de conservation du placement. Aucun ID réécrit.

## 2026-11-25 — C2 : configuration marchand directe, pas de liste de boutiques
- START 46654efe2b7d084d8ae891362e5d4e2999c3ab8c, checkpoint `checkpoint/exploration-start-npc-merchant-single-form-20261125`, branche `work/exploration-npc-merchant-single-form-20261125`. Capture #654 en parallèle chez son propriétaire. #551 indépendant non fusionné, ne pas le réintroduire.
- Retirer les sélecteurs de boutique concurrents dans la fiche carte et la bibliothèque PNJ. Ouvrir le même formulaire Capture dans chaque contexte; lier par référence automatiquement, conserver l'ancien ID si existant, réserver le nouvel ID de placement via le générateur existant. Réutilisables: la fiche définition reste propriétaire, la carte référence la définition, pas de duplication de données.
- Gardes source/origine/nonce/PNJ/carte; aucune copie d'articles/prix/stocks, aucune modification gameplay, inventaire, images, sauvegardes historiques. Tests sentinelles adaptés au parcours direct sans relâcher les invariants, CI + réel navigateur Capture puis publication source et PWA après certification.

## 2026-11-25 — #386 · Transport du HUD de l'univers vers le combat natif
- START Exploration `52c0736f16b4bf75209a3839255135786719188c`, checkpoint `checkpoint/exploration-start-combat-hud-386-20261125`. #548 GREEN CI 45491305221 / Pages 45491305075. #549 en attente à la demande auteur, exclue du lot.
- Combat #391 fusionné `45e8ccd7a8002ff10ab06d6ed63157cbe56d90d4`, PR CI 45546879226 / 45546873264 et revue Codex OK; Pages 45547415427 réussi, CI main 45547416368 encore en cours. Pas de fusion Exploration tant que Combat exact non certifié.
- Transmettre uniquement `authorBundle.hudLayout` issu de la base officielle de l'univers à `mountCoop2v2Test`. Aucun propriétaire de disposition, stockage, modèle ou DOM dupliqué. Test Chromium du HUD déplacé réellement dans l'univers Aventure et Tester, vitrine sans réglage préservée. Publication PWA séparée.
- Reprise CI `45547648917`, job `138981041436` : V66 mesurait 866,6 ms RAF bruts pour 39 px, avec plafonnement natif des pas à 250 ms et risque de bord de carte. Le diagnostic compte désormais uniquement les pas effectivement soumis à Collision World ; le clavier est relâché dans Chromium après au moins 80 ms simulées, sans changer le seuil de 25 %, la vitesse ni le moteur. RED observé sur CI précédente ; GREEN à vérifier sur ce commit. Aucun autre lot ni PWA modifié.

## 2026-11-24 — #527/#528 · Fuite sauvage et patrouille native (complément)
- 26/11 : synchronisation non destructive avec main a7b9d535, chaque hunk du delta #549 appliqué exactement une fois sur la source récente (six fichiers). Tous les autres fichiers conservés par arbre de base main. Commit à deux parents, aucune réécriture d'historique. Nouvelle CI et preuve navigateur requises, puis raccord Capture/PWA distinct. NON GREEN.
- START `52c0736f16b4bf75209a3839255135786719188c`, checkpoint `checkpoint/exploration-start-wild-flight-patrol-2026-11-24`, branche `work/exploration-wild-flight-patrol-527-20261124`. #548 GREEN CI 45491305221 / Pages 45491305075. Capture #648 transport du SHA précédent en cours ; ne pas le modifier. Pas de nouveau ticket concurrent.
- Compléter le critère fuite de #527 avec une politique `flee` additive dans l'unique contrat sauvage et la même boucle Movement/Collision World ; bornée au territoire, retour facultatif, jamais de combat automatique. Test des trajets des sauvages, pause, terrain bloqué et absence de téléportation. Anciennes données inchangées. Aucun nouveau moteur, store ou média.
- CI/Chromium et preuve HTTPS avant GREEN. Validation physique auteur différée à sa demande.


## 2026-11-24 — #529 · Comportement des créatures sauvages placées (C2)
- START `bdac9bade51cb908fe0e7a5fc8d06ac3f2a8d874` ; checkpoint `checkpoint/exploration-start-wild-behavior-529-2026-11-24` ; branche `work/exploration-wild-behavior-529-20261124`. #547 GREEN CI 45484426362 / Pages 45484426128, HTTPS ; transport Capture #646 séparé en cours.
- Comportement facultatif dans le contrat PNJ existant, ancien sauvage pacifique par défaut. Réutiliser le runtime de déplacement placé et le raccord `npc-wild`, sans modifier SpawnZone aléatoire ni Core Combat/Capture. Détection, contact, poursuite, désengagement, retour et cooldown sur la même boucle native ; aucune seconde position persistée. UI dans les réglages existants, sans dupliquer l’autorité de définition.
- Tests : compatibilité anciens fichiers, comportement de proximité, collision, retour, absence de relance et contrôle navigateur. Queue : anciennes exécutions PWA/Combat d'autres SHA relevées, aucune annulée ; CI checkpoint et Capture #646 protégées. Aucun GREEN avant exact CI/Pages.

## 2026-11-24 — #527 · Raccord natif des créatures sauvages placées (C2)
- START `bd808c05400c6f9e54480e1f2aa0d8e385a26e51` ; checkpoint `checkpoint/exploration-start-wild-encounter-527-2026-11-24` ; branche `work/exploration-wild-encounter-527-20261124`. Jalon édition #546 GREEN (CI 45481920998, Pages 45481919949, HTTPS).
- Réutiliser EncounterController, snapshot/handoff v1, constructeur de combat officiel et interaction de proximité ; source distincte `npc-wild`, un seul adversaire, aucune victoire de dresseur. Stats/compétences restent Combat, loot/XP Capture. Préserver anciennes rencontres et portails, aucune nouvelle sauvegarde ni moteur.
- Tests : source -> snapshot -> handoff -> Combat natif Tester et Aventure, garde de déclenchement unique, anciennes rencontres, Chromium et provenance Pages. Le comportement configuré #529 dépend de ce raccord et reste à développer après certification.

## 2026-11-24 — #527 · Créature sauvage : premier lot, édition de l’instance Combat (C2, NON GREEN)
- START `46e2e1e11cfd841232998d452dbf4f235f2b482c` ; checkpoint `checkpoint/exploration-start-wild-instance-527-2026-11-24` ; branche `work/exploration-wild-instance-527-20261124`. Base CI 45466487382, Pages 45466487438 ; publication PWA #645 GREEN (4f0ff386, 45473989957, 45474749499).
- Périmètre : réutiliser le formulaire d’instance Combat déjà utilisé pour les dresseurs dans le rôle sauvage, conserver les overrides pour la même espèce lors d’une édition World Builder. Le contrat `normalizeNpcCombatInstanceTransportV1` et le catalogue Combat restent les seules autorités ; aucun calcul de stats ni copie d’espèce. Ne pas réutiliser des overrides d’une autre espèce.
- Tests : sauvegarde/export/import PNJ sauvage, conservation au placement et lors d’une édition, non-régression dresseur, navigateur PC/mobile. Pas de changement du runtime de rencontre, de collision, des patrouilles ou de Capture dans ce lot. #527 reste ouvert : lancement natif de rencontre sauvage et #529 (agressivité) seront traités après validation de ce lot. Aucun déploiement avant CI et revue.

## 2026-11-24 — #385 Combat · Catalogue utilisé par les rencontres d’un univers
Départ `860df6c8a9cf853b7570f0e44b11990c5b2f4a7e`, checkpoint `checkpoint/exploration-start-universe-encounters-385-20261124`. L’exploration et le combat lancé depuis la carte doivent lire le même catalogue du projet Combat. Vérifier les statistiques, le monde et la reprise de session ainsi que le parcours vitrine existant.

## 2026-11-24 — #528 · Déplacements des acteurs de carte
Checkpoint `checkpoint/exploration-start-npc-patrol-528-20261124`, base `1ef71e18d2244e96a752f0266f1ed6b429a76c3a`, CI 45435313260. Le volet Trajet du PNJ sélectionné sauvegarde des points relatifs au placement. La fiche partagée reste propriétaire du PNJ. Les modes boucle, aller-retour et trajet unique passent par le mouvement natif. Le rayon de la zone d’errance est indépendant du rayon physique. Vérifier dessin à la souris et au doigt, import/export, pause et retour au comportement partagé.

## 2026-11-24 — Valider le mouvement sur le parcours de publication
Base `b61ad0308a5eacce4c2ee5f95a428b930b676e45`, checkpoint `checkpoint/exploration-start-navigation-smoke-encounters-20261124`. Le run 45433309432 a relevé 3,65 unités avant retour à l’arrêt lors du test clavier qui suit le toucher. Ce scénario charge le vrai catalogue dans le site assemblé. Le test désactive les rencontres aléatoires de sa zone via le volet auteur puis rétablit son état. Les distances de 8, 20 et 35 unités, le gel de 190 ms et les tests de combat restent exigés. Aucun changement du moteur.

## 2026-11-24 — #530 · Support explicite pour franchir l’eau
Départ `d55dd4d4f565baefc66bc5ccbde2f10e501f67fe`, checkpoint `checkpoint/exploration-start-water-passage-530-20261124`, branche `work/exploration-water-passage-530-20261124`. Le même outil Navigation doit accepter une passerelle entre deux berges sèches. SculptTerrain possède les deux points, Collision World possède le déplacement sur le tablier natif. Vérifier les bords, les ancrages, le trajet retour, la restauration, l'import/export et les anciens corridors.

## 2026-11-24 — Marchand sans boutique associée (C1, en validation)
- START `main@35dbe475e53abcc7ba8f4c5ee3be972390232584`, checkpoint `checkpoint/exploration-start-merchant-missing-reference-20261124`, branche `fix/exploration-merchant-missing-reference-20261124`. Suite du ticket Capture #629, complément distinct de Capture #639.
- Exploration possède uniquement proximité, PNJ et référence. Le test de proximité existant excluait un marchand sans dialogue ni merchantId, donc aucune interaction. L'UI native affiche le message de liaison à réparer dans le dialogue original; pas de boutique, pas de requête ni de mutation de règles. Les marchands liés et autres PNJ gardent le chemin existant.
- Test unitaire écrit avant correctif, test navigateur existant étendu au changement de définition dans la bibliothèque canonique, sans modifier le placement. RED non exécuté séparément. Gates npm test/check, Chromium et Pages exact SHA. Aucun changement Combat, PWA, assets, collisions, sauvegardes. Ne pas annoncer réparation du parcours utilisateur complet avant raccord Capture et validation réelle.

## 2026-11-23 — Transition automatique et habillage des passages World Builder (C2, en validation)
- Base officielle Exploration `main@1b69d62a88e77c545ab9a476a6a2b7f81ad4dd90`, branche unique `work/exploration-auto-portals-markers-20261123`. Aucun dépôt Capture/Combat/PWA modifié.
- Cause : la collision et `findTriggeredPortal` existent déjà, mais le Tester/Jouer 2,5D dépendait encore de l'action « Entrer ». Le rendu Sculpt dessine des cercles jaune/bleu sans respecter d'apparence choisie.
- Correction : déclenchement uniquement en entrant dans le vrai disque de collision, depuis les positions mouvement avant/après, sans nouvelle physique ni timer. Le Spawn situé dans le disque du Portal inverse ne crée pas de rebond automatique. La destination reste soumise au validateur natif avant le chargement ; la réparation des cartes anciennes reste explicite.
- Visuel canonique dans `Portal.visual` : cercle historique, invisible en jeu, ombre noire en dégradé, texture **du registre de matériaux officiel**. Dans Objets > Départ/Entrées/Sorties, un repère masqué reste sélectionnable et repositionnable en édition. Les anciennes cartes conservent leurs modes et IDs.
- World Builder classique utilise la même donnée et le même Material Texture Loader. L'import d'image libre est hors de ce premier lot : seules les textures déjà enregistrées sont proposées, pas de chemins externes, URL ou base64 dans WorldDocument.
- Aucun changement de coordonnées de Portal/Spawn, aucun système d'assets doublé, aucune suppression d'assets, de presets ou de sauvegardes.
- Gates : `npm test`, `npm run check`, navigateur Chromium réel mobile/PC sur la PR, tests de parcours aller-retour au SPAWN cible, budget Pages <900 Mio, publication HTTPS du SHA exact avant GREEN. Intégration PWA distincte et postérieure à certification.

## 2026-11-22 — 5 textures de terrain : raccord du ZIP auteur (en validation)
- Source : `GENSRPG_Exploration_5_textures_2026-11-22.zip` déposée sur `main` (Git blob `48291d3db737a75423fb257e0a6d73bfc9c681af`).
- Branche unique : `work/exploration-5-terrain-textures-20261122`. Extraction des cinq WebP 128×128 vérifiés par SHA256 dans les assets canoniques. Aucun sprite, matériau ou ID historique n’est supprimé/remplacé.
- Matériaux additionnels dans `materialPackV1`, Asset Adapter inchangé dans son rôle, palette Sculpt « Texture à peindre » et « Sol de base » ; World Builder utilise le registre natif. Pas de nouveau système de texture ni d’autorité de rencontres.
- Familles sémantiques par défaut : forest, forest, snow, plain et volcano ; famille personnalisée explicitement choisie conservée. ZIP auteur gardé dans Git, exclu du site Pages pour éviter la duplication.
- Validation requise : suite `npm test`, `npm run check`, CI SHA de PR, tests navigateur Android paysage/PC et preuve HTTPS du SHA publié. Aucun raccord automatique Combat/PWA.

## 2026-11-22 — PNJ marchand : configurer la boutique Capture depuis l’éditeur PNJ (DRAFT, non GREEN)
- Base `main@abe51d7f0634684d29772e0730719b2eb347fa98`, checkpoint `checkpoint/exploration-npc-shop-start-20261122` ; branche `work/exploration-npc-shop-delegated-20261122`, PR #518.
- Périmètre autorisé : `npc-editor.html`, `src/actors/npc-editor-v1.js`, test de délégation. Propriétaire : Exploration pour la présentation du PNJ et la référence `merchantId` uniquement ; AdventureRules/AdventureSession Capture restent maîtres des offres, stocks, taux, inventaire, commerce et sauvegardes.
- Modification : bouton marchand délégué au Shell Capture same-origin, refuse de quitter un formulaire PNJ non enregistré. Pas de système économique, boucle, duplicat ou jeu supplémentaire.
- Correctif contextuel : la demande de configuration transporte uniquement les références `npcId` (PNJ enregistré) et `merchantId` (boutique liée). La PR Capture #595 présélectionne la boutique et renvoie vers ce même PNJ (`?edit=<npcId>`). Aucune mutation d’offres, stocks ou inventaire dans Exploration.
- Tests : `tests/npc-merchant-configuration-delegation-20261122.test.mjs`, sentinelles existantes NPC/World Builder, tests navigateurs Android paysage/PC; coordination propriétaire Capture PR #595, issue principale GenSRPG #594. CI Exploration réussite au SHA de préparation, mais pas de GREEN/publication avant raccord PWA et test réel.

## 2026-11-19 — Retour auteur : échec Save WorldArea + teinte artificielle en hauteur (C1 correctif isolé)
- Signal réel : capture 19:25, après PR #502 pourtant GREEN, routes/sols de relief toujours décolorés, et « Enregistrement bloqué · WorldArea invalide : portal-invalid-or-duplicate » en quittant l'éditeur ; perte d'une heure de dessin. Ne pas décrire cela comme corrigé par l'ancienne livraison.
- START Exploration officiel `main@0128e69c290b43014a5a899804c588d805e2b4b0`, checkpoint `checkpoint/gensrpg-before-world-save-textures-20261119`, branche unique `work/gensrpg-world-save-textures-20261119`. Gel des autres agents, Capture/PWA, Combat/Donjon, assets, WorldDocument persistant, Portals/Spawns existants et service worker.
- Diagnostic : `saveSculptWorldArea` soumet une modification de surface au validateur global de WorldDocument : un Portal devenu invalide bloque toute la carte ; le code d'origine ne sauvegarde aucun brouillon de secours en cas de refus. Le renderer appliquait encore, après le matériau canonique, un voile coloré translucide **par case** élevé. La correction précédente d'alignement des pixels ne retire ni ce voile ni le délavage observé.
- Mesures : tout objet bâtiment lié à un Portal/Spawn ne peut plus être supprimé ou remplacé dans l'édition Objets (y compris annuler/rétablir) sans prévenir immédiatement. En cas d'échec de sauvegarde, téléchargement immédiat d'un **snapshot de secours brut de WorldDocument** avec relief/surfaces/objets/acteurs/décor actuels, Portals originaux inchangés et étiquette `.world-recovery.json`. Le fichier est explicitement non validé ; il n'est pas injecté dans le stockage et ne devient pas une deuxième source d'autorité. Ne jamais supprimer automatiquement un Portal invalide. L'écran reste ouvert si Save échoue.
- Sol haut : suppression du voile de teinte par case au-dessus du matériau natif, mais conservation des reliefs, des vraies ombres de contact, des bords de falaises, du calcul d'altitude du héros et des textures réellement peintes. Aucune modification des données de carte ni du moteur WorldSurface.
- Gates : test de sauvegarde d'un monde lié avec plateau, test de snapshot en présence de doublon Portal, sentinelle UI et absence de nouvelle clé storage ; test rendu 1,5 DPR sans tints par case, suites historiques relief/portails/peinture et CI navigateur sur SHA exact. Ne PAS fusionner ni déclarer livré avant GREEN et validation des résultats. Publication Capture/PWA séparée par pin propriétaire après certification.

## 2026-11-19 — Déco sud devant le héros, quadrillage des routes sur hauts plateaux (C1 rendu)
- START officiel Exploration `f17e4aea75a49da42f7c9b945cc26e8934fc1424`, checkpoint `checkpoint/gensrpg-start-fringe-tree-road-grid-2026-11-19`, branche unique `work/gensrpg-fringe-tree-road-grid-20261119`. Signal : captures auteur du 19 novembre, forêt 2,5D, sapins placés hors zone jouable apparaissant dessous ; trame rectangulaire visible dans route de terre sur plateau élevé.
- Cause arbre : les objets `WorldArea.decorativeFringe.objects` nord **et** sud étaient composités avant les objets de jeu / le héros, sans distinction par base Y. Séparer le même lecteur d'objets en passe nord *back* et sud *front*, celle-ci après le héros, jamais deux moteurs ni duplications. Les objets de frange sont en coordonnées locales de chunk ; exclure le culling viewport qui compare actuellement ces coordonnées à un viewport global et peut faire disparaître des arbres. La séparation ne change pas de géométrie, d'identité, ni de collisions.
- Cause route : `drawSculptGroundReliefLighting` re-tintait chaque case élevée avec un `fillRect` translucide 28×21 non aligné aux pixels réels. À DPR fractionnaire, les joints de ces tints révélent un quadrillage là où les routes et zones peintes doivent être continues. Employer les **mêmes bornes arrondies au pixel** que `sculptPaintCellClipV1` avec la fonction pure `sculptPaintCellBoundsV1`, mais remplir directement sans créer des milliers de clips Canvas ; pas d'overscan, d'opacity doublée, ni modification du propriétaire `WorldSurface`. Contrôle Chromium V21 de fluidité requis pour écarter une surcharge de rendu.
- Sont protégés : WorldDocument, Portals/Spawn, surface/zones/routes, relief, collision/passage, caméra 200 % PR #501, export préset PR #500, V80, Combat, Dungeon, sauvegardes, assets, autres agents, PWA publisher PR #541.
- Test RED/GREEN `tests/sculpt-fringe-road-height-layer-20261119.test.mjs` : 8×8 plateau élevé à 1.5 DPR, cellules adjacentes jointives et tint unitaire sans clips supplémentaires, base level 2 inchangée ; north<hero<south, bonne culling de la frange, aucune deuxième autorité ; suites historiques `sculpt-road-cell-seams`, `sculpt-decorative-fringe`, `sculpt-natural-edges-painted-fringe`, collision/Portal et parcours navigateur natif. Fusion seulement si CI + vraie preview GREEN ; contrôle visuel auteur Pixel séparé.
- Les anciennes PR #316/#318 sont de **vieux travaux sur la peinture d'une pente native** : ne pas les fusionner en bloc, ni confondre leur maillage de pente avec l'effet de tuiles du plateau visible sur cette capture.
- Prochaine étape : vérifier CI SHA exact et preview, checkpoint GREEN, fusion Explorer main ; adoption par Capture/PWA seulement via nouveau pin SHA immuable et contrôles de provenance, sans régression du patch PNG/World Builder.

## 2026-11-19 — Caméra Jeu Vitrine : dézoom maximum 200 % (C1 localisé)
- START Exploration `main@e0175760e686c4c911e0b91d5614aab2d0b708fe`, checkpoint `checkpoint/gensrpg-start-game-camera-200-dezoom-20261119`, branche `work/gensrpg-game-camera-200-dezoom-20261119`. Concurrence : PR World Builder export distincte #500, aucune modification de ses fichiers.
- Dans le vrai mode `navigationTesting` (vitrine et aventure), limiter la réduction de la carte à une échelle de `0.5`, soit **200 % de dézoom au maximum** par rapport à 100 %. Le zoom avant garde sa borne `2.4`. Appliquer la politique au wheel et au curseur `zoom` pour ne laisser aucun contournement ; conserver le même projecteur/caméra et recalcul du pan centré sur le héros.
- Éditeur : conserve l'échelle min `.32`, le Fit et sa fonction de dézoom pour dessiner les grandes zones. Les réglages initiaux `cameraZoom` 100–240 % et `cameraAngle` dans les sessions Adventure restent inchangés, tout comme les sauvegardes et les coordonnées gameplay.
- Périmètre : `src/render/sculpt-camera-projection.js`, `src/sculpt-lab-main.js`, test de non-régression `tests/sculpt-play-camera-max-dezoom-20261119.test.mjs` et journal. Aucune branche autre agent, aucun WorldDocument/préset, texture, collision, Combat/Dungeon/PWA. CI et browser natif sur HEAD exact ; checkpoint GREEN, merge main seulement après validation, et raccord PWA par son propre SHA.


## 2026-11-19 — World Builder : exporter une carte jouable comme préset JSON autonome (C2)
- START propriétaire Labo Exploration `main@e0175760e686c4c911e0b91d5614aab2d0b708fe`, checkpoint `checkpoint/gensrpg-start-world-assembler-map-preset-export-20261119`, branche `work/gensrpg-world-assembler-map-preset-export-20261119`.
- Demande auteur : depuis le plan où l'on positionne les cartes présets, exporter **la WorldArea sélectionnée** dans un seul fichier utilisable ensuite pour créer les présets officiels viables. Le menu « Fichiers » propose une action distincte de « Exporter le monde complet » : le préset contient relief, peinture, objets, acteurs, ombres par objet et décor hors limite ; le monde complet conserve les passages/spawns/identités sans les injecter dans un préset.
- Autorité : export dérivé en lecture seule de `WorldDocument.areas[id]` via `sculptWorldAreaScene`, puis **format natif** `gensrpg-sculpt-map-preset` déjà utilisé par le Labo, validé à l'export et importé par le même éditeur ; aucune deuxième base locale ni ID utilisateur. La frange décorative optionnelle doit rester validée et survivre au round-trip natif, sans élargir l'autorité des Portals/Spawns.
- Zone historique incompatible : erreur explicite et export complet disponible ; aucune conversion destructive, aucun écrasement d'un monde ou d'un préset existant. Pas de suppression des 3 présélections officielles actuelles dans ce lot ; audit/nettoyage en chantier distinct lorsque les nouveaux fichiers auteur auront été reçus et testés.
- Tests prévus : cible `tests/world-assembler-map-preset-export-20261119.test.mjs`, existants `tests/world-map-presets-portal-action.test.js`, `tests/sculpt-map-preset-authoring-20261115.test.mjs`, tests complet Node, CI/Pages/Chromium paysage et chemins officiels SHA exact ; checkpoint GREEN avant merge et raccord PWA distinct par pin, pas de copie runtime.
- Périmètre : `world-assembler.html`, `src/builder/world-assembler-main.js`, `src/builder/world-assembler-map-preset-export-v1.js`, `src/builder/sculpt-map-preset-library.js`, test cible et journal. Gels Combat/Dungeon/Survie/PWA, WorldDocument, anciens presets, V80, sauvegardes, autres branches.

## 2026-11-19 — Rectification sentinelle Chromium post-merge des visuels natifs (C2.1)
- Base officielle `main@c9baf53402b678e83f9fab4b7770ab800f1a5f6c`; checkpoint `checkpoint/exploration-start-native-art-probe-gate-20261119`; branche isolée `work/exploration-native-art-probe-gate-20261119`.
- Le lot fondu #498 a été fusionné après CI PR GREEN, mais CI `main` #44533099222 échoue sur V20 : `PerformanceResourceTiming` ne liste pas le WebP d'une maison dont l'image peut déjà être en cache ou décodée, alors que la scène et les objets ne sont pas supprimés. `__sculptObjectsProbe` expose déjà `visualAssetReady` en lisant la véritable Image du peintre natif, sans modifier WorldDocument, renderer ni média.
- Correction strictement *test-only* : la sentinelle `scripts/smoke-sculpt-terrain-lab.mjs` demande désormais que la maison officielle, sa variante arrière, le sapin enneigé, le moulin animé et l'arène élémentaire soient réellement décodés dans le cache Image utilisé pour dessiner, avec attente bornée de 4 s pour chaque objet. Les anciennes assertions de variantes et de WorldDocument restent strictes. Ce contrôle est plus strict qu'une trace réseau et ne modifie ni source asset, ni volume, ni moteur.
- Périmètre autorisé : sentinelle V20, présent journal. Aucun changement des cartes, sauvegardes, textures, UI, Combat, Donjon, PWA, ou branches des autres agents. CI source complète, publisher et réel Chromium sur SHA exact, checkpoint GREEN puis merge main ; ne pas promouvoir dans GenSRPG sans `main` GREEN.

## 2026-11-19 — Galerie de chargement : fondu universel 10 s (Exploration, C2)
- Demande auteur : plusieurs illustrations successives sur un MÊME chargement, y compris quand les textures d'une zone ou d'un Combat natif mettent plus de dix secondes à charger. Galerie partagée, aucun changement de règles ni de durée du chargement.
- START `main@42d0f9608c17f6d56d65038ac895564252126d5e`; checkpoint `checkpoint/exploration-start-loading-crossfade-20261119`; branche `work/exploration-loading-crossfade-20261119`.
- Propriétaires : les overlays Combat et Portal déjà existants restent gérés par `immersive-encounter-host-v1.js` et `sculpt-lab-main.js`. Le petit `mountCaptureLoadingArtCrossfadeV1` de `src/play/exploration-loading-art-v1.js` ne gère que les calques de présentation (10 s, fondu 700 ms). Il n'a aucun accès au moteur, à l'inventaire, au journal Combat, au cache PWA ni aux sauvegardes.
- Si moins de deux images auteur : aucune animation de rotation ; image native inchangée. Sinon cycle ordonné des URI approuvées déjà passées par Capture, décodage avant fondu, image complète `contain`, aucune duplication sur fond `cover`, minuterie arrêtée lors du vrai READY/annulation/retrait de l'overlay, récupération des styles originaux. Réduction du mouvement respectée. L'asset auteur PNG nouvellement déposé sur le Labo Combat `main@61f704ac24f828721ff7ec24baed351078a409aa` reste hors lot, aucun remplacement d'image implicite ni écriture sur la bibliothèque de l'autre agent.
- Réconciliation du CI : le test V18 des textures était intermittent sur les `PerformanceResourceTiming` de 4 fichiers WebP (les pixels réellement mesurés étaient distincts, le WorldDocument inchangé). La sentinelle navigateur existante `scripts/smoke-sculpt-terrain-lab.mjs` attend désormais le `Image.decode()` réussi de ces quatre **ressources officielles exactes**, puis conserve les mêmes assertions de pixels et immutabilité. Pas de timeout rallongé, retries, image de substitution ou changement du renderer. Runs précédents : CI #44526797157 (tentatives 1 et 2 : V18 RED), Gate publisher #44526796969 SUCCESS ; nouveau SHA à certifier.
- Fichiers autorisés : `src/play/exploration-loading-art-v1.js`, `src/encounters/immersive-encounter-host-v1.js`, `src/sculpt-lab-main.js`, `tests/exploration-loading-crossfade-v1.test.js`, `scripts/smoke-sculpt-terrain-lab.mjs` (sentinelle uniquement), ce journal. Gel V80, cartes, reliefs, textures, World Builder, Combat, autres branches, PWA root.
- Validation : tests Node + navigateur portrait/paysage et Combat READY, règle zéro de copies/poids, CI Explore sur SHA exact, checkpoint GREEN puis merge main. Source Capture et publisher PWA requièrent des PR et pins séparés pour adoption ; état non publié dans GenSRPG tant que ces validations ne sont pas faites.

## 2026-11-19 — Combat PWA : préchauffage discret et jingle de résultat natif (C2)
- Retour auteur Pixel : premier chargement de combat nettement plus lent que les suivants ; musique de victoire présente dans l'éditeur Combat officiel, mais absente du combat lancé depuis la PWA. L'image de chargement sera remplacée par un asset auteur séparé ; aucun redimensionnement de l'illustration dans ce lot.
- BASE propriétaire Exploration `main@1efa72151701a144687fbece77aad8e4a1052d42`, checkpoint `checkpoint/exploration-start-combat-warmup-audio-20261119`, branche isolée `work/exploration-combat-warmup-audio-20261119`.
- Diagnostic : l'Exploration `integration/combat-bridge/exploration-encounter.js` utilise déjà `SoundtrackSession` officielle mais ne transmet pas le rappel `onBattleOutcome` de `mountCoop2v2Test`, que l'éditeur Combat utilise pour passer de `capture:combat:normal` à `capture:combat:victory/defeat`. Le projet officiel possède déjà la musique de victoire, mais ne contient pas de piste de défaite par défaut : ne pas en inventer.
- Correction audio limitée au bridge : notifier le seul `SoundtrackSession` des scènes officielles à l'issue native du combat (appel unique), y compris parcours de test, avec arrêt inchangé lors de la fermeture de la fiche et aucune modification du calcul de résultat. Les SFX restent propriété du moteur Combat.
- Préchargement : compléter l'EXISTANT `createCaptureCombatWarmupV1` déjà démarré en session Jouer/Tester par de simples requêtes `fetch` à priorité faible, après idle, vers quatre fichiers statiques officiels de l'iframe Combat. Pas d'exécution anticipée, pas de nouveaux liens à des assets de créature, pas de boucle/retry/cache concurrent. `saveData` reste respecté ; le premier combat doit toujours faire les vrais contrôles de disponibilité.
- Second incident sur run Publisher #44510455155 : échec **après validation des tests de règles et navigations**, en fermant Chromium lors du smoke réel (ENOENT/ENOTEMPTY du profil temporaire encore écrit par les sous-processus). Harnais uniquement : lancement du Chromium dans son groupe de processus isolé et arrêt de ce groupe, attente de sortie avant suppression du profil temporaire. Aucune relance artificielle du navigateur, aucun changement au temps d'attente READY ni au code de production.
- Incident CI sur HEAD `3e0f79f4`: `modern-combat-encounter` RED au tout premier sondage CDP, avant que Chromium crée `documentElement` (`Cannot read properties of null (reading 'dataset')`), après tous les précédents tests verts ; aucun échec d'asset ou de session Combat démontré. Correction test-only : accès facultatif aux métadonnées de `documentElement` **durant le sondage initial uniquement** ; boucle bornée et toutes les assertions de rendu réel, SKILL, audio, plein écran, HTTPS intactes. Aucun allongement de délai ni fallback métier.
- Fichiers autorisés : `integration/combat-bridge/exploration-encounter.js`, `src/encounters/capture-combat-warmup-v1.js`, test cible, `scripts/smoke-modern-combat-preview.mjs` (harnais de test uniquement), présent journal. Fichiers protégés : Combat main, sprites, icônes, capacités, Exploration renderer / World Builder / WorldDocument, sauvegardes, PWA Shell, Dungeon, service worker et branches d'autres agents.
- Gates : tests Node du warmup et du bridge, CI complète de PR sur SHA exact, test réel victoire/défaite (défaite silencieuse faute de jingle officiel) avec arrêt au résumé, Chrome Android paysage / PC, contrôle taille Pages <=900 Mio et duplication, checkpoint GREEN puis fusion Exploration main. Intégration PWA uniquement par PR source/publisher séparées avec pins exacts et preuves HTTPS ; état NON PUBLIÉ tant que ces gates ne sont pas passées.

## 2026-11-19 — Pixel : chargements non étanches et lignes entre textures (lot source Exploration)
- Retour réel auteur en PWA Capture, Android paysage : Combat visible avant achèvement de l’image d’arène ; titre de l’illustration préservé mais bandes noires latérales ; Inventaire/Retour Capture encore sur l’écran de chargement de zone ; joints verts/terre réguliers dans la peinture neige/route sur smartphone (PC OK).
- START propriétaire Exploration main@4df91fdc4d5eedcf421e4767e175cba80e469bb1 ; checkpoint `checkpoint/exploration-before-pixel-loading-seams-20261119` ; branche `work/exploration-pixel-loading-seams-20261119`. Les corrections d’interface Capture/Shell et le pin PWA sont un lot séparé sur le dépôt propriétaire.
- Combat : son bridge natif `integration/combat-bridge/exploration-encounter.js` attend l’image CSS de l’arène du catalogue Combat officiel ET deux vrais frames navigateur avant son unique signal `combat-ready.v1`. Aucun timeout, nouveau moteur ou redémarrage. Texture indisponible = échec de chargement explicite, pas combat sur décor incomplet.
- Chargements : illustration entière centrée `contain`, second plan rempli avec la **même image** en `cover` uniquement derrière, sans étirer ni rogner le titre de premier plan. Concerne boot, Portal et Combat ; pas de nouvel asset, rotation locale préservée.
- Zone : l’overlay Portal Exploration conserve l’autorité de son cycle. Un événement `gensrpg.exploration.play.loading.v1` même origine / session expose seulement visibilité à Capture, sans toucher à son inventaire ni à la navigation Shell.
- Textures : sur DPR Android fractionnaire, le tampon vert apparaissait aux limites de clips opaques/translucides par cellule. Le peintre WorldSurface officiel sous-peint les joints avec le **même pattern autoritaire**, en alpha 1 ; la passe translucide garde le clip raster strict, sans réintroduire l’ancien double stamping .65 px. Reliefs, collisions, sauvegardes, hauteur, rendu V80, assets et Catalogs inchangés.
- Gates : tests de régression Pixel existants mis à jour, tests readiness/zone/seams ajoutés ; Node, Chromium Pixel/PC, publisher PR, poids ≤900 Mio, SHA exact & HTTPS avant publication main. Validation visuelle finale téléphone à confirmer par l’auteur.

## 2026-11-18 — Nettoyage de l’atelier Monde / cartes : une seule sélection visible (C2, avant CI)
- Retour auteur sur la nouvelle galerie : chargement des mondes trop volumineux ; régions déjà présentes sur le graphe répétées dans la barre de gauche ; doublon liste déroulante + cartes visuelles ; cartes fournies et personnelles trop rapprochées. Consigne explicite : **ne pas masquer un doublon, le retirer**, sans deuxième autorité ni duplication de code.
- START Exploration source unique `main@bce54e45b4b1e33e68c2a89fa6e9e0477574aa67` ; checkpoint `checkpoint/exploration-start-world-library-ux-cleanup-20261118` ; branche `work/exploration-world-library-ux-cleanup-20261118`. Lot exclusivement interface World Assembler et Sculpt 2,5D, sans intervention Combat, PWA, Dungeon, V80 gelée, textures, héros, géométrie ou sauvegardes.
- "Charger" : les vrais contrôles existants Enregistrer / Choisir / Ouvrir / Supprimer un monde sont **conservés** sous un élément natif `details` fermé par défaut. Aucune archive n’est effacée ou modifiée.
- Inventaire à gauche : suppression réelle du rendu `area-list` et de son DOM redondant. Le graphe WorldAssembler est l’unique moyen de sélectionner une région ; le compteur subsiste. **Exception justifiée** : les instances orphelines n’apparaissent pas sur la carte du monde, leur accès de réparation reste dans un `details` dédié, fermé.
- Presets : retrait réel des deux contrôles `select` (Sculpt + World Assembler), y compris les options fallback qui dupliquaient les cartes. La galerie partagée `sculpt-map-preset-choices-ui-v1.js` est le seul sélecteur interactif, avec un seul `gallery.dataset.selectedId` et un événement natif `change` ; elle ne crée aucun autre stockage. Les deux sources de cartes existantes sont présentées en **deux `details` indépendants**, fermés au départ : cartes proposées par l’éditeur et créations de l’appareil. L’ouverture peut être conservée après rafraîchissement, et la création/suppression/applicateur utilise le modèle WorldDocument/SculptScene officiel.
- Tests : statiques anti-doublons, validité HTML/native détails, navigateurs Chromium vrais clics (Charger, accordéons, carte, WorldGraph, créations, suppression locale), suite Node, npm run check, CI, publisher de PR, puis SHA publié en HTTPS. Budget Pages ≤900 Mio; aucun raccord vers GenSRPG et aucune suppression automatique des presets locaux.

## 2026-11-18 — Cartes vitrines / créations personnelles, atelier 2,5D repliable (C2, en validation)
- Demande : effacer les PRESETS DE TEST enregistrés par l'auteur, distinguer les cartes fournies par le projet pour vitrine et celles des joueurs, remplacer les grands menus déroulants par une bibliothèque ludique et des sections à ouvrir. Ne PAS toucher au Labo Combat en cours ni publier dans GenSRPG.
- Autorité : Exploration `main@ea336f885fa7fb7e1ea43ebf95c58504874d852a`, checkpoint `checkpoint/exploration-start-map-library-ui-20261118`, branche `work/exploration-map-library-ui-20261118` ; sources des cartes fournies = `sculpt-author-map-snapshots.js` et `sculpt-author-snow-map-snapshot.js` (3 modèles ; candidats vitrine, non automatiquement promus), modèles joueurs = un seul stockage local `gensrpg.exploration.map-presets.v1` déjà utilisé.
- Interface : galerie de cartes par origine, en commun pour l'éditeur 2,5D et le World Builder. Toutes les cartes affichent leur nom/taille et peuvent être sélectionnées au toucher, une action dédiée applique/crée réellement la zone ; liste déroulante conservée seulement en accessibilité. Aucun ID de carte codé en dur dans l'UI ; impossible de promouvoir un joueur dans le catalogue officiel via un simple bouton.
- Purge ciblée : boutons « Supprimer la création sélectionnée » et « Supprimer toutes mes créations locales », confirmations explicites, désactivés sans sélection personnelle ou sans cartes locales. Les 3 cartes fournies, WorldDocuments, Portals, sauvegardes, univers étrangers, assets et les presets exportés sont hors portée. ATTENTION : les fichiers de cartes sur le téléphone vivent dans le storage du navigateur : GitHub ne peut pas les vider à distance. Le déploiement ne supprime aucune donnée automatiquement ; l'utilisateur déclenche la purge une seule fois depuis son appareil et le même univers.
- Atelier ergonomique : commandes principales Terre/Eau/Objets/Textures/Tester et Quickbar inchangées. La zone « Atelier » contient désormais relief, eau, pinceaux et matériaux/caméra en panneaux natifs `details`; ouvrir automatiquement le bon panneau quand le type Terre/Eau change. La géométrie, physique, hero, JSON, moteur, V80 gelé, PWA et les chantiers parallèles ne changent pas.
- Gates : `node --test` et `npm run check`, navigateur réel Chrome dans l'éditeur et le World Builder, export/import round-trip, appareil mobile paysage, CI SHA exact et workflow publisher en validation PR. Mesurer Pages 900 Mio, préserver les 3 cartes Forêt 1 / Plaine 1 / Neige 1 ; aucun merge ni déploiement main sans tous les tests GREEN et recette visuelle auteur. Si une CI échoue, diagnostiquer sans modifier les sources Combat/GenSRPG.

## 2026-11-18 — Bordure sud grise/verte sous le terrain 2,5D (C2, validation en cours)
- Retour réel Android de l'auteur : en mode Tester dans la PWA principale, une bande grise/vert foncé oblique reste visible sous l'herbe au bord sud ; les précédentes corrections de la falaise extérieure et de la peinture de la frange ne la masquent pas.
- START propriétaire Exploration `main@13bbd8230d8dfcef612586974b2dcb54e18e16c4`, checkpoint `checkpoint/exploration-start-south-texture-continuity-20261118`, branche isolée `work/exploration-south-texture-continuity-20261118`.
- Cause vérifiée dans `src/render/sculpt-height-renderer.js` : la surface arrière de `drawSculptTerrain` reste remplie en couleur unie `baseColor`, même pour `drawOuterSouthRim:false`. À la dernière rangée surélevée, les tops texturés sont décalés vers le haut, laissant visible le rectangle arrière uni sous eux. La pente 2,5D rend la bande oblique et très visible sur mobile. Cette fonction est la source unique de rendu pour la carte et les chunks de frange nord/sud.
- Correction ciblée dans le renderer officiel : quand `drawOuterSouthRim:false` ET la texture officielle existe, la surface arrière utilise le même pattern de Material Registry que les tops. Le mode historique de falaise externe `drawOuterSouthRim:true` et le fallback image absente conservent la couleur originale. Les couches de peinture WorldSurface et la frange explicite continuent de recouvrir cette base via leurs propriétaires existants.
- Zéro mutation : terrain, hauteur, collisions, caméra, objets, zones peintes, jeux sauvegardés, pin, PWA, V80 gelée, Combat et Dungeon restent intacts. Aucun nouveau sprite, texture, matériau ou moteur.
- Régression automatique : tests du rendu natif herbe/neige/terre avec sommet surélevé, conservation du rendu du bord historique et fallback absent, tests actuels de frange peinte neige/forêt, CI du SHA exact ; contrôler en navigateur mobile/PC le bas de la carte en éditeur et Tester sur Forêt 1 / Plaine 1 / Neige 1 avant GREEN et raccord GenSRPG. Respect du budget Pages 900 Mio et preuve HTTPS exigés par la charte. Aucune fusion/promotion sans gates requis.

## 2026-11-17 — Cadrage sans recadrage des chargements Monster InvoC (EN TEST)
- START propriétaire Exploration `main@a339764834921a2f388b31a78bcc99e8794b26d5`, checkpoint `checkpoint/exploration-start-loading-art-safe-frame-20261117`, branche `work/exploration-loading-art-safe-frame-20261117`.
- Retour Pixel : le bord supérieur de l'illustration de chargement est coupé ; le titre fait partie de l'image source. Cause : `background-size:cover` dans les trois chemins natifs de chargement (entrée Carte, transition Portal, overlay Combat).
- Correction pure présentation : `contain` sur fond sombre, dégradé couvrant toute la surface sur le seul overlay Combat ; conserver le même asset, la rotation, le message, le spinner, Annuler, les erreurs et la libération de l'audio officiel. Aucun overlay supplémentaire, aucun changement de gameplay, Hero, WorldDocument, terrain, collision, sauvegardes, V80, Combat ni PWA.
- TDD : test `tests/exploration-loading-art-safe-frame-20261117.test.js` vérifiant les trois consommateurs et le contraste. Gates : suite Node, Chromium paysage/PC, CI et Pages SHA exact, budget ≤900 Mio, preuve HTTPS et recette visuelle auteur avant promotion Capture/GenSRPG.
- Dernier GREEN confirmé avant chantier : `main@a339764834921a2f388b31a78bcc99e8794b26d5` ; aucun déploiement GenSRPG implicite.

## 2026-11-16 — Calibration des 12 héros officiels sur silhouette verte (AUDIT, NON PUBLIÉ)
- Demande auteur : héros bleu et un autre paraissent trop grands. Héros vert = taille de référence ; ne pas modifier les PNG, ne pas réécrire d'anciens profils personnalisés.
- START main@`20228fdc2be728d52d02a6f37421f206d4849d0a`, checkpoint `checkpoint/exploration-start-hero-size-audit-20261116`, branche `work/exploration-hero-green-visual-calibration-20261116`. Autorité visuelle : catalogue officiel + MapActorVisual natif, aucun changement de mouvement/collision.
- Audit objectif : silhouette réelle RGBA de chacune des 6 images S des 12 héros, étalon vert. Les 12 silhouettes sont quasiment égales (145,67 à 150,33px vs vert 147,5px), mais l'ancien héros bleu peut rester installé à 35 alors que l'officiel est déjà à 30.
- Correctif prudent : diagnostic des tailles persistantes de la bibliothèque réelle et bouton « Taille étalon » sur le héros sélectionné, qui utilise le catalogue unique (bleu 30, vert et autres 35) puis exige Enregistrer ; aucun héros édité ni sauvegarde réécrit silencieusement. Aucun asset source réécrit.
- Invariants : sauvegardes des héros personnalisés, unique UserHeroStore, directions 8×6, V80, niveau 16, WorldObject, Combat, Dungeon, PWA.
- Gate : Node/Chromium Pixel PC + CI, Pages SHA exact, validation auteur avant GREEN.


## 2026-11-16 — Miroir horizontal WorldObject et ombre (CANDIDAT, NON PUBLIÉ)
- Demande auteur : inverser horizontalement les images dans Carte 2,5D/World Builder, l'ombre officielle suit la même transformation.
- START main@`20228fdc2be728d52d02a6f37421f206d4849d0a`, checkpoint `checkpoint/exploration-start-object-mirror-20261116`, branche `work/exploration-object-mirror-shadows-20261116` ; aucune écriture sur main avant gates.
- Propriétaire unique : `WorldObject.transform.flipX` optionnel, absent des anciennes sauvegardes ; Canvas silhouette+sprite dans le même contexte, sans nouveau moteur ni duplication d'images.
- Contrôles de sélection dans les deux éditeurs ; pose, édition, copie, export/import ; les décalages collision et les ancres de portes suivent le visuel.
- Gel : ordre de dessin des arbres/falaises restauré pré-#468, géométrie et collisions C2, niveau 16, 2048 objets, V80, Combat, Dungeon, Survie, PWA.
- Tests : contrat, rendu, scènes, copie, suite Node, navigateur PC/Pixel, budget 900 Mio, CI/Pages/HTTPS sur SHA exact et recette auteur avant GREEN.

## 2026-11-16 — Retour ciblé au rendu pré-#468 des arbres/falaises (EN COURS, NON LIVE)
- Demande auteur du 16 novembre : les ajouts successifs de masquage des arbres/acteurs par les reliefs ont dégradé le rendu. Retrouver le chemin de dessin stable **avant le premier masque**, sans revenir sur tous les changements d'éditeur des 15-16 novembre.
- Référence historique vérifiée : Exploration `main@f90ef6abe7aad6fba689820fdd78e71f6b05a3f6` (15 novembre, avant PR #468). Depuis #468 : masque alpha après objets; #474 : replay selon pied; #477/#479 : replay du héros; #482/#484 : découpe des objets sous les plateaux. Le retour vise **ces seuls composites visuels** et non une régression générale de main.
- START propriétaire Exploration `main@4f1f742002661401bcb8606f27eb034acaeb64cc`, checkpoint immuable `checkpoint/exploration-before-visual-depth-rollback-20261116`, branche unique `work/exploration-restore-pre-468-render-order-20261116`.
- Fichiers autorisés : `src/sculpt-lab-main.js`, tests ciblés d'ordre d'affichage (préexistants et nouveau témoin), ce journal. Restaurer le dessin terrain → objets/acteurs du chemin antérieur, sans repasse du raster des falaises et sans clip des capots supérieurs; ne pas restaurer une autre caméra, renderer, carte ou catalogue.
- Invariants **intouchables** : collision physique C2 latérale/coins jusqu'au niveau 16, 2 048 objets, textures de neige/herbe continues aux bords (#483), aucun rebord sud fictif, ombres globales, intérieurs/portails, assets et leur index, WorldDocument/sauvegardes, V80, Combat, Capture, Dungeon, Survie, PvP, audio, Peer, publisher PWA. Conserver les helpers historiques seulement hors chemin actif en attendant vérification (pas de double moteur actif).
- Critères : tests de régression terrain/objets et héritage des fonctionnalités, suite Node complète, Chromium/Firefox éditeur/Testeur Forêt/Plaine/Neige, performance, CI+Pages de ce SHA exact et poids ≤900 Mio. Ne pas fusionner/publi­er ni épingler dans Capture avant GREEN; preuve HTTPS et recette Pixel/PC requises. Le correctif de profondeur recherché pourra être repris ultérieurement dans un nouveau lot après validation auteur.

## 2026-11-16 — C5 : profondeur des objets, la colline derrière ne masque plus l'arbre DEVANT (CANDIDAT)
- Retest auteur : arbres posés sur le sol devant les collines disparaissent ou sont coupés sous les capots rocheux. Cause C4 confirmée dans `sculptObjectRaisedCapOcclusionV1` : les caps plus hauts sont sélectionnés selon leurs rectangles de projection, sans trier selon leur position Y monde par rapport au pied de l'objet. Ainsi une colline NORD/DERRIÈRE pouvait masquer l'arbre SUD/DEVANT.
- START main@382f1566b46b1d980782acb885a906bf38aa6fe4, checkpoint `checkpoint/exploration-start-foot-ordered-upper-caps-20261116`, branche `work/exploration-foot-ordered-upper-caps-20261116`; lot pur de profondeur WorldObject. Les capots plus hauts ne sont admissibles au masque que lorsqu'ils sont **au sud (devant)** de la ligne du pied de l'objet. Une colline derrière reste dessinée derrière ; une colline au premier plan masque toujours correctement la silhouette. Le renderer officiel, les vrais murs et les union rects restent uniques.
- Pas de modification de collision réelle, niveau 16, héros, positions, sauvegardes, WorldDocument, textures/ombre/portes, animations, Combat, Dungeon, Survie ni PWA. Tests C4 existants rebasés pour une colline effectivement en avant et nouveau test rouge/vert d'une colline derrière, sans dupliquer le moteur.
- Correctif des bordures et peinture extérieure en PR Exploration #483 **indépendante**, à rebaser proprement si fusionné. Gates Node, Pixel/PC navigateur, PR/CI/Pages SHA exact, budget <=900 Mio, validation auteur. Le chantier collisions physiques sera diagnostiqué sur la carte réelle ; ne pas rétrograder la protection anti-traversée de murs sans preuve.
- Raccord prépublication sur Exploration main@f973d2ab2835688141b7c644b0dcefb7f0d7fbd6 contenant la PR #483 déjà fusionnée ; les textures et bords du Labo sont conservés octet pour octet, tandis que C5 reste un lot distinct.

## 2026-11-16 — Rendu naturel des bords et continuité neige/forêt (CANDIDAT, NON LIVE)
- Retest auteur sur cartes 2,5D herbe/neige : paroi rocheuse artificielle au sud même sans vraie falaise, bande vert/gris sous neige peinte. Objectif : surface continue jusqu'au bord, sans collision hors terrain.
- START `main@382f1566b46b1d980782acb885a906bf38aa6fe4`, checkpoint `checkpoint/exploration-start-natural-edges-painted-fringe-20261116`, branche `work/exploration-natural-edges-painted-fringe-20261116`, propriétaire rendu Sculpt uniquement. Préserver WorldDocument, V80, sauvegardes, instances, intérieurs, niveau 16, Hero, collision C2, profondeur C4, ombres, images, portails, Combat, Dungeon, PWA.
- Causes vérifiées : `drawOuterSouthRim` V52 ajoutait une falaise fictive externe ; le pourtour de 8 cases tirait `currentTexture` herbe même lorsque `WorldSurface.zones` peignait la neige au bord. Fausse bordure supprimée seulement à ses deux points de rendu et au cache du masque ; véritables faces de falaise inchangées. Le pourtour lit le WorldSurface canonique, prépare des bandes transitoires de matériau officiel sans stockage; peinture du pourtour déjà sauvegardée reste prioritaire. Cache invalidé sur changement de WorldSurface, image unique via asset loader officiel.
- Collisions/collines : lot de diagnostic distinct après celui-ci ; aucun ancien contrôleur de collision restauré aveuglément. Gates Node, navigateur éditeur/tester, presets Forêt/Plaine/Neige, budgets ≤900 Mio, PR/CI/Pages/HTTPS SHA exact et validation visuelle Pixel paysage/PC. Aucune publication GenSRPG implicite.

## 2026-11-16 — C4 complément de validation : union sans trous + test C1 rebasé
- La première série C4 était verte sur ses nouveaux tests, mais le test statique C1 attendait la syntaxe `faces:cached.depthFaces}` alors que le C4 passe désormais le rayon réel `footRadius:navActor.radius` à C3 : actualisation stricte du contrat de test en conservant la condition de replay et sa source unique, sans neutraliser de test.
- Le clip Canvas ne peut **pas** utiliser directement plusieurs trous chevauchants, que le fill-rule soit evenodd ou nonzero : ces chemins réouvrent des pixels à l'intersection. `sculptCapUnionRectsV1` produit une union en bandes sans recouvrement avant clip, avec test explicite d'absence de recouvrement. La géométrie reste tirée des mêmes caps du même monde, aucune copie terrain.
- Les prérequis restent CI Node, Chromium/Firefox, Pages SHA exact et test auteur. Aucun statut de publication anticipé.

## 2026-11-16 — Relief : objet à l'altitude basse masqué par le sol supérieur, héros au bord (C4, NON PUBLIÉ)
- Retest utilisateur Pixel : C3 résout presque l'occlusion du héros, mais un petit morceau dépasse la lèvre rocheuse ; un arbre traverse un plateau supérieur en neige. Le cache C3 contient uniquement la **face verticale**, pas le capot de terrain élevé. Un WorldObject dessiné après ce capot reste par-dessus celui-ci, quelle que soit l'altitude de son pied.
- START officiel Labo Exploration `main@2b318c1462d9723c8f9e5386aaecccec8c5e3c2f`, checkpoint `checkpoint/exploration-start-cap-object-occlusion-20261116`, branche unique `work/exploration-cap-object-occlusion-20261116`. Nouveau lot de rendu : pas de changement des données, sauvegardes, collision, Atlas, décor, Ombres, Combat, Capture, Audio ou autres modes.
- `sculpt-cliff-object-depth-v1.js` dérive les rectangles de **caps supérieurs** du terrain canonique au-dessus du niveau réel du pied de chaque WorldObject. `sculpt-lab-main.js` clippe uniquement ce sprite et son ombre, dans son renderer préexistant, y compris lors du replay C3 ; aucun nouveau masque terrain, aucun moteur ni double source. Exemptions explicites : rampe, escalier, pont, périphérie décorative et héros. Le plan C3 du héros tient maintenant compte de son rayon de pied natif au rebord sans élargir le collider.
- Tests ciblés : terrain plat, objet sur hauteur inférieure (occlusion), objet au sommet (pas d'occlusion), caps voisins qui se chevauchent (nonzero), rien sur un autre côté de carte, héros presque au bord et héros bien derrière. Vérifier l'éditeur et Tester sur Pixel paysage/PC, Chrome/Firefox, CI Node, budget Pages ≤900 Mio, HTTPS SHA exact et régression Forêt/Plaine/Neige. Publication GenSRPG **seulement** par source staging Capture et publisher pin-only après certification du labo, sans modifier les originaux.
- Statut : en validation, pas de nouveau statut LIVE et validation visuelle finale réservée à l'auteur. Repli exact : `2b318c1462d9723c8f9e5386aaecccec8c5e3c2f`.

## 2026-11-16 — Combat : art de chargement personnalisé et libération audio sur résumé (EN VALIDATION)
- START `main@5d5d39b35afc8f9794866f1ad0a3008916219846`, checkpoint `checkpoint/exploration-start-combat-loading-art-20261116`, branche `work/exploration-combat-loading-art-20261116`. Dernier GREEN = base main, nouveau lot non certifié.
- Propriétaire Explorateur : affichage du même art Monster InvoC reçu de Capture par l'overlay natif de combat, plus rotation des URL Blob validées et autorisées de la bibliothèque locale Capture pour combats et Portals ; aucune source d'art dupliquée.
- À la réception du CombatResult Core persistant, garder uniquement l'iframe *terminée* cachée jusqu'à la fermeture du dialogue XP/récompenses Capture ; message versionné de fermeture validé même origine/session, disposal `SoundtrackSession` officiel et déchargement de l'iframe, nettoyage pagehide/cancel et refus de signaux non corrélés. Aucun calcul ni état de combat modifié.
- Tests : contrat URL same-origin, rotation, Combat overlay, fenêtre du résultat (victoire, défaite, fuite, cancel), sécurité inter-frame, Play Android/PC ; CI/Pages/HTTPS SHA exact + poids <=900 Mio. Capture et son publisher ne seront mis à jour qu'après GREEN. Aucun changement falaise C3, carte/collision, Hero, audio moteur, sauvegarde, Survie, Dungeon ou PWA.

## 2026-11-16 — C3 falaises Pixel : héros encore caché malgré C1/C2 (EN VALIDATION)
- Capture Pixel du 16 novembre après publication de GenSRPG `main@e587bdc57fd27a7ee6ec80fe9c9853ef12247940` : jambes visibles, torse masqué par une falaise. Preuve utilisateur que le lot C2 sur Collision World ne suffit PAS. Ne pas accuser le cache PWA sans preuve.
- START propriétaire Exploration `main@297cb5fd4db08fd84ed3cbc5ebdc1cfef6080ead`, checkpoint `checkpoint/exploration-start-cliff-mixed-depth-20261116`, branche `work/exploration-cliff-mixed-depth-20261116` ; aucun changement au moteur de collision canonique C2 (déjà publié).
- Cause vérifiable : `sculptObjectInFrontOfCliffV1` retourne `wallBehindFoot&&!wallInFrontOfFoot` pour le héros ; dans un relief en escaliers mêlant murs devant/derrière, une face devant annule le replay entier et le cache rocheux masque le corps, bien que le pied soit devant un autre mur.
- Correction circonscrite au propriétaire existant `src/render/sculpt-cliff-object-depth-v1.js` et compositing `src/sculpt-lab-main.js` : plan par face depuis `sculptFaces` et la même géométrie que le masque, rejouer le renderer héros natif une fois si une face est derrière son pied ; réappliquer uniquement les rectangles des faces réellement devant par clipping du raster de falaise existant. Conserver l'ordre des objets et l'ancienne API WorldObject. **Pas de nouveau moteur/masque, collision, hauteur, sauvegarde, asset, PWA, Combat, Dungeon ni Survie.**
- Gate : nouveau test rouge sur l'ancien cas mixte puis vert sur rendu du héros/mur avant/arrière, tests Node et Chrome/Firefox de l'éditeur Tester avec relief mixte, CI/Pages sur SHA exact, mesures taille ≤900 Mio, aucune source doublée. Ne pas publier GenSRPG avant reprise source+publisher C3 indépendantes et validation de la PR Exploration. Validation visuelle Pixel de l'auteur encore requise, ne jamais annoncer C3 visuellement réussi avant test.

## 2026-11-16 — Falaise traversable sur les côtés et coins malgré C1 (C2, EN VALIDATION)
- Retour utilisateur Pixel avec deux captures enneigées : le personnage peut entrer latéralement dans les panneaux de falaise et disparaît dans la paroi. Le premier correctif C1 ne traitait que la couche d'affichage du héros, sans revoir la collision.
- START exact `main@9e0a196c740d3449f1583068b145b32d14cfaffd` (C1 fusionné, CI `43807268210`, Pages `43807268189` GREEN), checkpoint `checkpoint/exploration-start-cliff-side-collision-20261116`, branche `work/exploration-cliff-side-collision-20261116`. TDD RED : test indépendant sur les côtés, les coins, la silhouette projetée est à 16 niveaux, le retrait d'une ancienne position sous paroi, et la route native de `stepMovement`.
- Cause racine : le routeur `sculptNavigationRoute` validait les centres des cellules, pas le cercle du joueur aux changements de hauteur ; `sculptNorthCliffProjectionBlock` ne regardait que 7 × rise, et les facettes est projetées n'étaient pas bloquées.
- Correction dans l'unique `src/core/sculpt-navigation-collision.js` : rayon réel des pieds contre les cellules de hauteur canonique, côtés est sous projection en X/Y sans recopier le mesh/sprite, anticipation nord jusqu'au niveau officiel 16, retrait autorisé si l'ancien pied chevauche déjà le relief. Exemptions existantes pont/escaliers porteurs et vol, tolérances `maxStepUp/maxStepDown` conservées, pas de téléportation de correction.
- Aucun nouveau hitbox sauvegardé ni doublon moteur ou asset. WorldDocument, acteurs, caméra, art, relief, Hero, V80, Combat, Capture, Dungeon, Survie et éditeur restent protégés.
- Gate : tests du nouveau lot, suite Node complète, Chromium/Firefox des vrais parcours et 3 presets, poids Pages ≤900 Mio, PR green au SHA, fusion Exploration main, CI + Pages/HTTPS du SHA exact. Déploiement Capture/GenSRPG uniquement via lot source+publisher séparés après validation ; essai auteur Pixel/PC final requis. Aucun état GREEN déclaré ici.

## 2026-11-16 — Personnage caché par une falaise malgré son pied devant (C1, EN VALIDATION)
- Screenshot Pixel : les pieds du héros dépassent au bas d'une paroi rocheuse, mais le reste du sprite est recouvert par le rendu de la falaise. Diagnostic : la passe de profondeur hero derrière `cliffOcclusionImage` est conditionnée à `nearObjects.length` et à l'existence d'un WorldObject derrière le héros. Sur map vide, elle ne se déclenche jamais.
- START exact Exploration `main@71c50f7d9ed61d7d36f46d19265d000b5e5a3d76`, checkpoint `checkpoint/exploration-start-hero-cliff-depth-20261116`, branche `work/exploration-hero-cliff-depth-20261116`. Dernier GREEN = main de départ ; le chantier n'est pas encore GREEN.
- Correctif localisé dans `src/sculpt-lab-main.js` : le héros est indépendamment testé par `sculptObjectInFrontOfCliffV1` (pied X/Y officiel), même s'il n'existe aucun arbre ni objet à proximité. Conserver l'ordre des objets devant/derrière l'acteur et ne repeindre le héros que lorsqu'il recouvre une falaise derrière lui. Toujours le même renderer d'acteur et le même masque rock, aucune nouvelle autorité.
- Tests : pied avant/arrière sans objets, isolation des passes et absence de double renderer ; Node, vrais scénarios navigateur Tester, CI, Pages main SHA exact et revue visuelle Pixel/PC avant GREEN. Pas de changement des falaises, collisions, matériaux, WorldDocument, décor, sauvegardes, V80, hub PWA, Combat, Dungeon, Survie, PvP, ni des médias.

## 2026-11-15 — Simplifier les passages directement depuis la Carte 2,5D
- Retour utilisateur : création des passages/arrivées trop complexe et doublonnée avec le World Builder malgré la PR #460 fusionnée. Audit : la Carte 2,5D impose encore de créer les liaisons dans World Builder, de manipuler coordonnées X/Y et deux listes de repères.
- START : `main@6c80be9bfaf56fb607e049daaeb8741c70ab3308`, checkpoint `checkpoint/exploration-passages-simple-start-20261115`, branche `work/exploration-passages-simple-20261115`.
- Périmètre : éditeur Carte 2,5D uniquement, connexion via `connectWorldAreas` officiel, `WorldDocument.portals` et `WorldArea.spawns` existants ; création d'un aller-retour depuis l'éditeur, placement tactile de sortie puis édition du Spawn d'arrivée réel dans la carte cible. Regrouper coordonnées/noms/Spawns experts sous un panneau avancé replié. Garder les vieilles données et outils. Aucun identifiant manuel, état persistant supplémentaire, double liaison ni modification Combat/Capture/Survie/Dungeon.
- Gate : tests création/réutilisation des Portals, liens aller/retour, préservation de Spawns, sauvegarde/import, lancement tactile, navigateur PC/mobile, CI GREEN et contrôle Pages SHA exact avant fusion.

## 2026-11-15 — Remplacement fidèle des 7 bâtiments nettoyés par l'auteur
- START `main@f09038257e529b2756d2a343bd89a0cb61b62c87`, branche `work/exploration-user-clean-house-webp-20261115`, périmètre exclusivement images canoniques enneigées et leurs index. Validation explicite auteur : remplacer les modèles déjà nommés, sans redessiner, détourer à nouveau, créer un assetId ou modifier le moteur.
- 7 WebP fournis, **6 remplacements stricts des octets utilisateur** et 1 fichier `building_house_snow_alpine_timber_2p5d_side_01.webp` **déjà strictement identique**, conservé sans changement. Toutes les vues 384×384 RGBA avec transparence contrôlées. Conformité des blobs Git à la signature SHA-1 de chaque image vérifiée lors de l'import et des SHA-256 inscrits dans le catalogue.
- Source unique maintenue : `assets/exploration/objects/buildings`, 30 vues et 10 modèles inchangés; `manifest.snow-houses.v1.json` et `SHA256SUMS.snow-houses-v1.txt` actualisés sans modifier les 24 autres fichiers. Sous-lot : 577562 → 132070 octets (-445492 octets). Aucun collage, réencodage, détour supplémentaire ou double bibliothèque.
- Pas de changement collision, chargement, WorldDocument, Portals, V80, Capture, Dungeon, Combat, ombres ou publication inter-dépôts. Gates : CI Node et Chromium, publication Pages du commit exact sur `main`, contrôle HTTPS, vérification visuelle PC/Pixel par l'auteur avant statut artistique GREEN.

## 2026-11-15 — Reprise utilisateur : reliefs tronqués aux bordures nord/sud (lot isolé)
- Retour auteur : la carte enneigée montre encore une coupure franche des reliefs en haut et en bas malgré le lot « profondeur du relief » déjà fusionné.
- START : `main@6c80be9bfaf56fb607e049daaeb8741c70ab3308`, checkpoint `checkpoint/exploration-north-south-edge-start-20261115`, branche `work/exploration-north-south-edge-20261115`.
- Diagnostic : `WorldArea.decorativeFringe` stocke déjà 8 cases sur quatre côtés, mais `drawDecorativeFringeTerrain` et `drawDecorativeFringeObjects` filtrent exclusivement le nord ; les bornes du cadrage édition ne prennent pas le sud en compte. Un simple `paddingY=16*rise` ne corrige pas les bords.
- Périmètre : réutiliser uniquement les chunks du WorldDocument et le renderer de terrain natif pour rendre et éditer les bandes nord/sud ; aucun nouveau terrain jouable, sauvegarde, collision, Spawn/Portal, moteur ni copie d'assets. Les extensions latérales restent hors lot.
- Gate : tests de rendu au nord/sud pour dimensions multiples de 8 et irrégulières, compatibilité anciens WorldDocuments, non-régression Tester/caméra, suite Node et navigateur mobile, contrôle du déploiement HTTPS au SHA exact. PR isolée, aucune fusion avant GREEN et revue visuelle.

## 2026-11-15 — Remplacement fidèle des 7 bâtiments nettoyés par l'auteur
- START `main@f09038257e529b2756d2a343bd89a0cb61b62c87`, branche `work/exploration-user-clean-house-webp-20261115`, périmètre exclusivement images canoniques enneigées et leurs index. Validation explicite auteur : remplacer les modèles déjà nommés, sans redessiner, détourer à nouveau, créer un assetId ou modifier le moteur.
- 7 WebP fournis, **6 remplacements stricts des octets utilisateur** et 1 fichier `building_house_snow_alpine_timber_2p5d_side_01.webp` **déjà strictement identique**, conservé sans changement. Toutes les vues 384×384 RGBA avec transparence contrôlées. Conformité des blobs Git à la signature SHA-1 de chaque image vérifiée lors de l'import et des SHA-256 inscrits dans le catalogue.
- Source unique maintenue : `assets/exploration/objects/buildings`, 30 vues et 10 modèles inchangés; `manifest.snow-houses.v1.json` et `SHA256SUMS.snow-houses-v1.txt` actualisés sans modifier les 24 autres fichiers. Sous-lot : 577562 → 132070 octets (-445492 octets). Aucun collage, réencodage, détour supplémentaire ou double bibliothèque.
- Pas de changement collision, chargement, WorldDocument, Portals, V80, Capture, Dungeon, Combat, ombres ou publication inter-dépôts. Gates : CI Node et Chromium, publication Pages du commit exact sur `main`, contrôle HTTPS, vérification visuelle PC/Pixel par l'auteur avant statut artistique GREEN.

## 2026-11-15 — Révision de contrôle du détourage (14 vues conservées après inspection)
- Précision de synchronisation : les 6 vues rondes non retouchées par ce lot suivent les WebP canoniques déjà publiés sur `main` ; les empreintes/taille ont été réalignées sur ces pixels existants (aucune réédition ou copie).
- **Le traitement intermédiaire de 20 vues ci-dessous a été invalidé visuellement** : des pixels isolés / trous apparaissaient près des façades et lanternes des pagodes. Il ne doit PAS être présenté comme version finale, même si son audit SHA était vert.
- Correctif sur **14 vues précisément délimitées** (5 familles, 3 orientations selon disponibilité), en restaurant d'abord les WebP approuvés du commit `b44b7e25b67f647a85cf27fecc1c67feee3de65d` avant de produire le masque révisé ; l'exécution est entièrement réversible par Git.
- Périmètre : **14 WebP modifiés, 16 vues strictement conservées** (les 10 déjà protégées + 6 des modèles ronds non validés dans la seconde revue). Chalet manuel strictement identique. Les masques tracent les abords des murs, gardent les entrées, la maçonnerie et les lanternes ; sur la pagode le fond gris parasite est supprimé seulement dans les régions extérieures, sans supprimer les ombres internes.
- Run one-shot [43737574344](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/43737574344) réussi, workflow temporaire retiré, script canonique seul `scripts/cleanup-house-environment-pixels.py`. Audit : **14 fichiers ; 54 350 pixels parasites rendus transparents**, masse alpha restante minimale 92,89 %, aucun pixel RGB repeint ; manifeste officiel et `SHA256SUMS.snow-houses-v1.txt` synchronisés. Prévisualisation avant/après jointe à l'artefact du run.
- Les maisons tempérées portant de la végétation devant les murs restent **non modifiées** : les retirer nécessite de reconstruire le mur caché, sinon création d'un trou. Aucune suppression de l'historique, duplication des assets ou modification du moteur.
- Gates avant livraison GREEN : tests PR Node/Chromium + validation d'assemblage, fusion main, Pages HTTPS au SHA exact, puis contrôle visuel auteur PC/Pixel ; la CI n'atteste pas à elle seule du détourage artistique.

## 2026-11-15 — Régression : murs, étages et retour des intérieurs de maison
- Cause prouvée : après maison → « Lier / modifier intérieur », une vraie WorldArea officielle est créée mais l'inspecteur masquait tous les outils lorsque `activeInteriorId` n'était pas un ID de l'ancien tableau `sculptInteriors`. Les murs et étages refusaient en conséquence tout ajout, et le retour était dans le panneau Passages.
- START source `main@73996dd3e9a53c93766871a68ea916a2d4cf6e6b`, checkpoint `checkpoint/exploration-start-world-interior-ui-20261115`, lot isolé `work/exploration-restore-world-interior-tools-20261115`.
- Réparation : même inspecteur 2.5D pour la carte WorldArea intérieure officielle ; murs, textures, forme validée, porte et retour vers extérieur ; niveaux associés aux WorldAreas via métadonnée facultative `interiorFloor`, vrais Portal/Spawn de montée/descente, sans deuxième autorité. L'ancienne voie autonome Sculpt conserve son code. Dimensions des cartes du World Builder restent verrouillées dans ce panneau pour protéger les anciens portails et placements, sans rescaling destructeur.
- Anti-régression : tests maison liée → pièces, étages, murs, aller/retour, sauvegarde/import, anciens mondes, édition clavier/tactile, même WorldDocument, pas de suppression ou nouvelle sauvegarde. CI native/Chromium/Firefox, publication main et contrôle HTTPS avant raccordement dans GenSRPG. Ombres globales présentes et non modifiées.
---

## 2026-11-15 — Découpe réelle des abords des maisons (retour auteur)
- START `main@b44b7e25b67f647a85cf27fecc1c67feee3de65d`, branche `work/exploration-building-ground-props-removal-20261115`. Retour : retirer pierres, éléments extérieurs et fonds gris parasites derrière les lanternes, pas seulement adoucir l'alpha.
- Révision par masques géométriques et zones grises opaques. **20 WebP enneigés remplacés** à chemin/ID et dimensions 384×384 identiques ; seuls les pixels d'alpha changent (RGB inchangé). Réfection des pieds neige/pierres autour des murs et suppression du fond foncé non architectural derrière les lanternes de la pagode.
- **10 vues protégées**, dont le chalet corrigé par l'auteur et trois vues de chacun des types glace/cristaux/tente, pour ne pas détruire cristaux, cordages ni éléments distinctifs. Fichiers tempérés et végétation incrustée aux murs non modifiés : essai d'inpainting non satisfaisant refusé, besoin de reconstruction localisée ultérieure.
- Script reproductible `scripts/cleanup-house-environment-pixels.py`, run unique réussi [43734052744](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/43734052744) ; les deux workflows temporaires supprimés après exécution. Manifestes SHA256 et octets synchronisés : sous-lot de 20 fichiers 2 188 586 → 2 188 334 octets (-252), aucune copie supplémentaire.
- Garde-fous : aucun changement aux moteurs, au rendu, aux ombres, collisions, sauvegardes, V80, Capture/Combat/Dungeon/Survie. Critères GREEN : tests Node/Chromium, PR, publication Pages de main au SHA exact, HTTPS et essai visuel PC/Pixel.

## 2026-11-15 — Ombres par modèle visuel dans l'éditeur de carte 2.5D
- Demande : régler l'ombre d'un modèle d'arbre une fois pour ses centaines d'instances, au lieu de déplacer les ombres arbre par arbre. Conserver les exceptions individuelles et la vue du panneau d'ombres repliable.
- START `main@ce59c71d60d233ed3354fd945c96b31423f95c44`, checkpoint `checkpoint/exploration-start-shadow-model-profiles-20261115`, branche `work/exploration-shadow-model-profiles-20261115`.
- Source unique : profils optionnels `WorldDocument.objectShadowProfiles` indexés par `assetId` officiel résolu, normalisés dans `world-object-shadow-settings-v1` ; aucun ID manuel, aucune duplication du catalogue d'objets, de `WorldObjectPlacement`, du renderer alpha ni de sauvegarde locale. Le standalone Sculpt conserve le même format uniquement en import/export scène et préset ; WorldBuilder reste seul propriétaire des mondes jouables.
- Panneau `Objet > Ombre` déjà repliable : portée Cet objet / Tous les objets du même visuel ; les curseurs sont partagés, aperçu temporaire, appliquer en une fois à toutes les instances identiques, ancien objet personnalisé prioritaire ; annuler/rétablir global dédiés dans ce panneau. Les futures instances du même visuel suivent aussi le profil.
- Tests : rétrocompatibilité monde sans profil, sauvegarde WorldDocument, une seule entrée par modèle et 400+ instances, import/export scène et préset, priorité overrides individuels, undo, styles PC/tactile, aucune modification collision/Portals/Monster InvoC/Dungeon. CHARTE : pas de deuxième système ni de suppression, checkpoint avant merge, CI Chromium/Firefox + Pages green exact SHA, preuve HTTPS de source puis raccordement pin GenSRPG dans PR distincte. Contrôle visuel créateur requis.

---

## 2026-11-15 — Nettoyage alpha des autres maisons enneigées (10 modèles × 3 vues)
- START vérifié `main@f90ef6abe7aad6fba689820fdd78e71f6b05a3f6`, branche `work/exploration-snow-house-alpha-repair-20261115`. Périmètre UNIQUEMENT les images WebP canoniques de `assets/exploration/objects/buildings/` et leurs manifestes ; aucune création de catalogue parallèle, ni modification de rendu, collisions, moteur ou sauvegardes.
- Lot réalisé : **29 images nettoyées** parmi 30 références ; le fichier auteur `building_house_snow_alpine_timber_2p5d_side_01.webp` reste byte-identique et explicitement protégé. Conservation de l’identité graphique, silhouettes, orientations et dimensions 384×384 : correction des très petits îlots alpha, franges de détourage, halo RGB et fondu léger sur les 7–9 pixels de contact bas seulement.
- Intégrité : contrôle SHA-256 et taille de chacun des fichiers à l'entrée, puis synchronisation des 29 SHA-256 et tailles dans `manifest.snow-houses.v1.json` et `SHA256SUMS.snow-houses-v1.txt`. Audit : 616 686 octets avant, 3 193 392 après (+2 576 706 octets) ; encodage WebP **lossless** pour ne pas dégrader les détails ; ratio de masse alpha minimal 98,299 %, aucune perte du corps opaque hors pied. Budget Pages +2,46 Mio ; aucune nouvelle image ni ancien fichier supprimé.
- Script reproductible : `scripts/repair-snow-house-alpha.py` ; exécution one-shot GitHub Actions GREEN (run [43730565612](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/43730565612)), workflow temporaire supprimé après réalisation pour éviter une deuxième autorité ou ré-exécution. Planche avant/après et audit conservés en artefact de ce run (14 jours).
- Gates avant GREEN final : CI PR complète Node/Chromium, vérification des assets par manifest, publication Pages de `main` et HTTPS au SHA exact, contrôle visuel utilisateur sur carte PC/Pixel. Pas de déploiement ni validation visuelle revendiqués avant preuve.

## 2026-11-15 — Réparer les plafonds et la profondeur du relief (retour auteur)
- START officiel : `main@f90ef6abe7aad6fba689820fdd78e71f6b05a3f6`, checkpoint `checkpoint/exploration-start-relief-limits-occlusion-20261115`, branche `work/exploration-relief-limits-occlusion-20261115`. CI source et Pages de départ `43729541863` / `43729541834` GREEN.
- Périmètre propriétaire : Sculpt World model/Scene Preview existants, UI 2,5D, raster du renderer natif ; aucune édition des moteurs Combat/Capture, Survie, Dungeon, PvP ou du gel V80. Pas de seconde source d'objets, pas d'identifiants manuels, pas de suppression de carte. Rollback par le SHA de départ.
- Régressions avérées : le plafond de 2048 placements certifié PR #307 a rebasculé à 256 (message historique 128) ; les boutons rapides `adjustQuickLevel` utilisent encore 7 malgré `changeTarget` et le slider à 16 ; la marge nord du raster statique gardait `7*rise` et masquait les sommets élevés ; la paroi sud était désactivée dès qu'un décor périphérique existait ; objets/acteurs peints intégralement au-dessus du relief.
- Correction : 2048 placements, normalisation/import sans troncature silencieuse, compteur et erreur synchronisés ; 16 niveaux via borne partagée ; marge nord 16×rise et paroi sud native conservée ; profondeur visuelle par masque alpha des seules faces de falaise extraites du raster EXISTANT, réutilisé pour édition et Jouer. Le masque ne modifie pas terrain, collision, eau, sauvegarde, sprites, portes ni WorldDocument. Culling conservateur des objets hors écran pour smartphone.
- Tests : reprendre la suite PR #307 de forêt 513 arbres avec sauvegarde/import WorldDocument, plus test 16/16, cache nord/sud, rectangles d'occlusion, préservation du modèle ; CI `npm test`, `npm run check`, navigateur Chromium/Android paysage, publisher à SHA exact, HTTPS, poids site <=900 Mio. Checkpoint GREEN et publication GenSRPG uniquement une fois tous les contrôles validés ; recette visuelle utilisateur encore requise.

---

## 2026-11-15 — Remplacement fidèle du détourage chalet alpin (asset canonique)
- START `main@05ccc80874a27ab19f184897ac659c5b2abd1c4a`, branche `work/exploration-snow-house-clean-cutout-20261115` ; lot limité aux assets, aucune logique renderer, collision ou sauvegarde modifiée.
- Source : WebP RGBA 384 × 384, 24 320 octets fourni et nettoyé par l'auteur. Remplacement strict à chemin et assetId constants de `building_house_snow_alpine_timber_2p5d_side_01.webp` (vue side) ; aucune régénération et aucune copie concurrente.
- Intégrité : manifeste `manifest.snow-houses.v1.json` et `SHA256SUMS.snow-houses-v1.txt` synchronisés vers SHA-256 `a27851cd830ae9a7dba18ade9c6218bd218eceabbc34020d80a0ecdbd1f65467`. Les 29 autres vues conservent leurs sources et checksums.
- Validation : vérifier CI, image affichée côté éditeur et Aventure sur PC/Pixel, puis Pages au SHA exact avant déclaration GREEN. Extension du nettoyage aux autres bâtiments exclusivement après inventaire visuel, sans correction automatique destructive.

## 2026-11-15 — Ombres d'objets : édition compacte repliable (retour utilisateur)
- START certifié `main@4a8063e526ec7c00d41b4997eb8a758c4fd76f3a` (PR #464, ci et Pages GREEN), checkpoint `checkpoint/exploration-shadow-editor-start-2026-11-15`, branche `work/exploration-shadow-editor-collapsible-20261115`.
- Problème : plusieurs images de maisons aux pixels transparents variables donnent encore une impression de flottement après correction de la projection du masque. Autoriser une correction légère et **par objet placé** sans modifier les PNG, collisions ni le propriétaire du rendu.
- Un seul panneau natif `<details id="object-shadow-details">` dans la palette Objet : **fermé par défaut**, visible seulement pour une sélection de type objet avec ombre; mode Auto/Personnalisé, largeur/hauteur, décalages X/Y, opacité et Réinitialiser. Le mode Auto ne crée aucun champ supplémentaire dans un WorldDocument historique. Le déplacement de curseur redessine la même projection, l'événement `change` passe par `updateSculptPreviewObject`/`objectCommit` existants et **un seul undo/redo**. Sélectionner un autre objet referme le panneau.
- Les paramètres validés sont enregistrés uniquement en `WorldObjectPlacement.overrides.shadow` facultatif, passent par le normaliseur officiel, WorldArea/WorldDocument et export/import Sculpt. Aucun identifiant supplémentaire, aucune base/asset, aucune seconde ombre. L'unique `drawWorldObjectContactShadowV1` reçoit le champ (y compris pour la lecture hors éditeur) et module **la silhouette alpha réelle**, pas une nouvelle ellipse superposée. En dernier recours seulement si le masque alpha est illisible, même moteur rend une discrète empreinte au pied. Ponts, rampes, escaliers, eau, waterfalls restent exclus ; acteurs/terrain intacts.
- Protections : toutes cartes/presets/portails anciens inchangés, aucun effacement, V80 protégé ; pas de modification de Capture/Combat/Survie/Dungeon/PvP. Aucun effet de duplication sur la taille Pages. TESTS : précision du masque, compatibilité ancien JSON, auto/reset, undo/export/import, contrôles repliés, mobile/PC, CI et Pages exactes; validation visuelle sur la carte du créateur à demander après publication. Les nouveaux correctifs Capture #472/#473 demeurent une livraison distincte, à intégrer après certificats sans créer deux owners.
- GREEN seulement après CI SHA exact, mise en ligne de `main`, vérification HTTPS, compte des assets et test tactile ou retour auteur.

## 2026-11-15 — Jouer : oscillation repos, rendu chargé, et musique Aventure native
- START `main@7bd60b8dfeeb4eb0ba37f35a5e5a4e5ba93d11fa`, checkpoint `checkpoint/exploration-start-play-visual-readiness-idle-only-20261115`, branche `work/exploration-play-visual-readiness-idle-only-20261115`.
- Retour auteur : le héros ne doit plus osciller en marche (tous sprites), seulement au repos ; le masque de chargement ne doit se retirer qu'après textures, routes, décors et frame finale de la carte, y compris après Portal.
- Le seul `MapActorRenderer` désactive le bob vertical du rôle hero quand `moving===true` sans modifier la géométrie, les animations directionnelles, les réglages de sauvegarde, ni les PNJ. L'ancienne amplitude de marche reste lisible pour compatibilité mais ignorée.
- Le masque natif attend les Promises d'images déjà créées par Material Registry/Surface/ObjectRenderer, les images de roche (si disponibles), les rubans et la première peinture ; pas de cache ni de renderer bis. Erreurs d'images essentielles visibles, anciennes cartes/sauvegardes inchangées.
- Le lecteur natif `createExplorationSoundtrackV1` accepte une configuration `capture:exploration:map.music` du seul `SoundtrackProjectV1` Combat, mais conserve ses quatre fichiers audio et le lecteur existant. L'entrée ne contient que des IDs officiels, aucun URL/MP3 personnel ni stockage local supplémentaire. Sans configuration valide, comportement actuel inchangé.
- Garde-fous : V80, WorldDocument, collision, CPU mobile, Survie/Dungeon/PvP, Assets et Portal; tests Node+Chromium PC/Paysage, CI main exacte, Pages HTTPS, test auteur avant GREEN.

## 2026-11-15 — Régression ombres maisons : projection réelle rétablie
- START `main@3844e82814d81d4486575153fdcbd6160b1eee4e`, checkpoint `checkpoint/exploration-start-house-silhouette-shadow-fix-20261115`, branche `work/exploration-house-silhouette-shadow-fix-20261115`.
- Rapport utilisateur : après PR #461, la vraie ombre étirée des bâtiments a disparu et l'aplat au pied qui ressemble à une colline est resté. Cause vérifiée : `drawWorldObjectContactShadowV1` court-circuite la projection pour `building` en utilisant `contactCanvas`, bande artificielle indépendante du masque projeté.
- Correctif soustractif : bâtiments/arbres/rochers retrouvent la seule projection alpha existante, pied ancré à l'opacité basse du sprite; retirer le canvas de bande supplémentaire et sa génération, sans toucher au terrain, aux sprites, au WorldDocument, aux portails, au cache des images ni aux ombres des acteurs. Une seule autorité WorldObject. V80 et autres modes protégés.
- Tests : vraie silhouette et pied, absence de bande, exclusion pont/eau, tests Node et navigateur/CI, puis Pages sur `main` et contrôle utilisateur PC/Pixel. Pas de GREEN avant validations.

## 2026-11-15 — Illustration Monster InvoC dans les transitions Capture (aucune copie asset)
- START `main@cd5778f2e2480a16966841530aad0eade9ffa706`, checkpoint `checkpoint/exploration-start-capture-loading-art-20261115`, branche `work/exploration-capture-loading-art-20261115`.
- Périmètre : les **deux overlays existants** `#sculpt-play-boot-mask` et `#play-area-loading` reçoivent, uniquement si l'hôte officiel Capture fournit le paramètre `loadingArt`, son URI SVG de marque. L'image est servie par le dépôt propriétaire GenSRPG Capture sur la même origine, sous `assets/gensrpg/capture-v2/branding/` ; l'ancien mode standalone sans paramètre reste inchangé.
- Invariants : zéro nouvelle copie PNG, 0 nouveau loader, 0 nouveau state/Portal/Combat, pas d'impact sur world save, cache, moteur ou autres modes. Tests : validation stricte URL de même origine, non régression des masques et des valeurs défaut, CI + publication HTTPS depuis main. Le vrai essai auteur sur téléphone reste à effectuer.

---

## 2026-11-15 — Retours test auteur : ombre maison, combat interrompu et intérieur WorldBuilder unique
- START: `main@ee858722d06ef0772adfb5a978865d28a9f35ffd` (PR #460 fusionnée après GREEN), checkpoint `checkpoint/exploration-start-interior-door-shadows-combat-recovery-20261115`, branche `work/exploration-interior-door-shadows-combat-recovery-20261115`.
- Maison : la prévisualisation Sculpt `sculptInteriors` avait son propre Portal uniquement pour une scène autonome, alors que le jeu WorldBuilder exige le `WorldDocument` officiel. En mode WorldAssembler, le bouton 2,5D appelle maintenant `createBuildingInteriorLink` (unique propriétaire déjà présent dans World Builder), avec une nouvelle WorldArea, deux Portals, Spawns automatiques et validation des références. La carte courante est enregistrée AVANT l'association, et le monde entier dans la clé canonique (pas de seconde sauvegarde). L'entrée est traversée par `findTriggeredPortal` / `applyPortalTransition` existants ; un bouton de retour à la maison permet d'éditer sans naviguer dans deux menus. Le standalone Sculpt historique conserve ses anciens intérieurs séparés de ce nouveau workflow WorldBuilder, sans conversion destructive.
- Combat : un journal `Combat handoff pending` représente un résultat non acquitté et **ne doit jamais être effacé aveuglément**. L'ancien Tester ne relisait pas ce journal au démarrage ; si résultat enregistré, il est acquitté dans le mode Test (sans récompense Aventure). Si interruption, son snapshot est restauré dans le contrôleur de rencontre et proposé à reprendre ; Aventure conserve son propriétaire exclusif de commit Core (aucun journal remplacé).
- Ombres : supprimé le second grand aplat d'ombre « toit projeté » sous les bâtiments ; le même masque alpha officiel couvre leurs pieds, toute la façade et la paroi latérale avec une bande de contact de 2,5 % maximum en dessous. L'ombre directionnelle entière des arbres est conservée. Aucune nouvelle texture, asset, collision, caméra ou terrain ; le liseré du bord avant de la carte, distinct de l'ombre maison, reste à contrôler visuellement sur le PC de l'auteur.
- Invariants : aucune suppression ou changement des original PNG, sauvegardes, WorldAreas existantes, portails déjà liés, bibliothèques, V80, Survie, Dungeon ou PvP. Une branche = un lot, propriétaire de la map = WorldDocument/Exploration, moteur Combat = officiel. Les visites, contenus et arènes du bâtiment restent inchangés.
- Gates : tests des deux Portals traversables, idempotence IDs, sérialisation de WorldDocument, silhouette alpha et reprise du handoff ; CI Node complète + Chromium et Pages SHA exact. Test final sur téléphone et carte de l'utilisateur encore à réaliser.

---

## 2026-11-15 — Cartes présets : extérieur texturable, panneaux dégagés, Portals/Spawn éditables (retour auteur)
- START vérifié : `main@b02523be8871013e26340cddd419e0957e798913` (CI + Pages GREEN), checkpoint `checkpoint/exploration-map-preset-authoring-start-20261115`, branche `work/exploration-map-preset-authoring-20261115`.
- Diagnostic : la ligne jaune est l'ancien repère de limite jouable ; les huit cases extérieures `decorativeFringe` autorisaient relief/objets mais aucun `WorldSurface` dessiné, ce qui empêchait les textures au nord. Le panneau `Mes cartes présets` flottait en haut à gauche du canvas et masquait les outils.
- Correction : réutiliser les features `SculptSurface` du moteur existant dans les chunks `WorldArea.decorativeFringe` (optionnel, migration additive) ; elles ne deviennent jamais collisions, rencontres ou `WorldArea.surface`. Les images sont résolues par le cache texture existant ; choix Terre/Eau/Texture/Objet dans le même mode hors carte. Masquer la ligne jaune en édition normale, l'afficher seulement lors de l'édition décorative.
- Confort : déplacer physiquement (sans copier le DOM) les commandes de présets dans le seul inspecteur de droite en mode World Builder. Sorties, arrivées et départs sélectionnables sur les repères officiels ; coordonnées validées via terrain, navigation vers la zone cible avec sauvegarde de la carte courante. Si départ historique ancré à une porte, conserver le Spawn de la porte et créer un Spawn libre à ID automatique, puis définir `initialSpawnId` dans le seul WorldDocument.
- Invariants : aucune duplication de document, terrain, portail, renderer ou sauvegarde ; ne pas supprimer de présets, objets, portes, WorldAreas ; pas de changement du runtime Combat, Dungeon, Survival, PvP, progression ni des règles de rencontre. Un même fichier source par propriétaire `main`, pas de V80 historique modifiée.
- Gate : tests décor/collisions, coordonnées Portals/Spawn, CLI Node, CI/Chromium, publication main Pages et test tactile réel à effectuer après GREEN ; aucun statut de livraison tant que HTTPS SHA et essai téléphone/PC ne sont pas certifiés.

---

## 2026-11-15 — Exploration: afficher les noms des autres joueurs et leur saluer (lot C6 visuel)
- START: main `b323abb7ce10cb271f2836ffbfc49485e02fdf30`; checkpoint `checkpoint/exploration-start-multiplayer-peer-identity-20261115`; branche `work/exploration-multiplayer-peer-identity-20261115`.
- Propriétaire unique: Explorer MapActorRenderer dessine les sprites et noms; la projection réseau ne peut accepter que les positions/identités en lecture seule et le salon Capture authentifie l'identité réseau.
- Périmètre: nom des pairs depuis `displayName` du salon Supabase, affichage natif sur canvas; « Saluer » à proximité (70 unités monde), notification transitoire limitée à la partie, réception du nom sur anciennes sauvegardes sans skin sélectionné. Aucun nouveau déplacement, collision, WorldDocument, combat ou Save.
- Tests: `scoped-adventure-hero-v1.test.js`, `exploration-play-peer-visual-projection-v1.test.js`, tests navigateurs réels, non-interférence NPC et portails, CI+Pages SHA et version pin GenSRPG vérifiés. Joueur distant conserve son sprite démo tant que l'image personnalisée n'est pas partagée officiellement (chantier distinct).
- Protections: pas de duplication de ressources, pas de modification des 576 sprites, V80 et source unique maintenues, aucune suppression, aucune copie Lab vers Capture. Exiger GREEN + test appareil avant clôture.

---

## 2026-11-14 — Ombres de contact pour les WorldObjects natifs
- Retour test créateur : les objets sur la carte Aventure (arbres, maisons, rochers) paraissent sans ancrage au sol. Audit : le MapActorRenderer possède une ellipse d'ombre pour les acteurs, et SculptTerrain gère les falaises, mais le chemin natif `drawPreviewObject` n'avait aucun appel d'ombre sous les WorldObjects.
- START main@3d773ecd, checkpoint `checkpoint/exploration-world-objects-shadow-start-20261114`, branche `work/exploration-world-objects-shadow-20261114`. Autorité de dessin : `src/render/world-object-renderer.js`, fonction unique appelée aussi par Sculpt pour la carte Aventure. Les ombres précèdent les sprites, sont ancrées aux pieds et suivent la perspective ; pas de shadow pour ponts, escaliers, rampes, eau ou passages.
- Ne pas ajouter une couche de collisions, un WorldObject artificiel ni un second moteur de lumière ; ne pas modifier les PNG/WorldDocument/objets sauvegardés. Rendu léger : une ellipse alpha, sans flou ou texture supplémentaire, de façon à limiter l'impact FPS.
- Critères GREEN : tests de formes et de non-duplication, CI Node/Chromium et vérification visuelle smartphone/PC (placement, opacité et relief). Le commit ne prouve pas encore la qualité du rendu réel.

---

## 2026-11-14 — Fluidité des objets sur carte Aventure (cache de rendu dérivé)
- START main@3d773ecd, checkpoint `checkpoint/exploration-object-frame-cache-start-20261114`, branche `work/exploration-object-frame-cache-20261114`.
- Dans le chemin de rendu existant, `drawPreviewObjects` recalculait `resolveWorldObjectPlacements + filter + sort` à chaque dessin 2.5D, même sans changement de la liste immuable en Jouer. On conserve un seul ordre visuel trié en cache lecture seule pour l'identité courante de `placedObjects`. Le modèle WorldArea, les positions, Collisions, WorldSurface et le moteur de dessin restent propriétaires uniques ; l'éditeur recalcule toujours à chaque dessin.
- Test dédié : la référence et le nombre d'appels au résolveur restent constants entre images de Jouer, changent après nouvelle zone/liste, et l'éditeur reste frais. CI + validation navigateur téléphone requises ; ne pas présenter cette optimisation seule comme une solution prouvée à toute la latence ou au chargement Combat.
- Aucun changement de HP, combats, rencontres, sauvegardes, caméra, assets ou timers gameplay.

---

## 2026-11-14 — Nettoyage du HUD Jouer, un menu natif sans seconde autorité
- Retour smartphone : bouton Menu Explorer, inventaire Capture, panneau Dernier combat et Plein écran, notification Arrivée et diagnostics réseau encombraient l'image de jeu.
- START `main@3d773ecd9653700750d6de3f62d2255199490a17`, checkpoint `checkpoint/exploration-play-ui-clean-start-20261114`, branche `work/exploration-play-ui-clean-20261114`.
- Le seul bouton Menu Explorer en mode Capture émet `gensrpg.exploration.play.open-menu.v1` avec le `sessionId` et l'origine de l'iframe ; seul Capture présentera les commandes existantes. Standalone Explorer conserve l'ancien retour direct. L'iframe ne possède ni plein écran, ni résultat de combat, ni inventaire.
- La zone inscrite en haut et la notification de sauvegarde automatique disparaissent en jeu Capture, sans supprimer les erreurs de sauvegarde. Le passage garde son bouton Portal unique ; arrivée réussie sans deuxième bandeau persistant, erreurs de passage visibles.
- Invariants : mêmes sauvegardes, mêmes Portal/Spawn, pas de calcul Gameplay ni nouveau titre/Menu ; vérification de liaison parent source Capture avant promotion, CI et test téléphone, aucun faux GREEN.

---

## 2026-11-14 — Héros : taille 35, 16 images/s, oscillation 1 (retour test auteur)
- START `main@d9d1840952b8ecb10f9baed162d167d62750c17c`, checkpoint `checkpoint/exploration-hero-defaults-start-20261114`, branche `work/exploration-hero-defaults-35-16-1-20261114`.
- Source unique : `DEFAULT_HERO_VISUAL_SETTINGS_V1` dans `src/actors/map-actor-visual-model.js` ; `UserHeroDefinitionV1`, éditeur officiel et installation des 12 presets utilisent cette base : hauteur 35, 16 FPS, amplitudes repos/marche 1 dans les trois modes.
- Les 576 PNG d'origine sont strictement conservés, comme les UserHeroDefinition déjà enregistrés (notamment ceux de taille 58/25). Aucun remplacement ni migration silencieuse de leurs paramètres.
- Déduplication : le même preset reconnu par la signature de sa première image n'est plus réinstallé parce que sa taille/FPS d'origine diffèrent ; aucune suppression automatique.
- Unique MapActorRenderer pour mouvement/oscillation, aucune deuxième animation et aucun masquage de l'original. Preview « Essayer 25 » réversible conservée.
- Tests : `hero-authoring-defaults-35-16-1-20261114.test.js`, anciens tests héros/déduplication, CI et Chromium tactile ; publication Pages/HTTPS sur SHA exact avant livraison.

---

## 2026-11-14 — Dialogue PNJ après fusion de l'étiquette nom de héros
- START `main@8c7f11830aef7701d05881670df7942a00d8d76b`, branche `work/exploration-npc-dialog-after-nickname-20261114`.
- La PR #445, testée GREEN sur sa branche empilée, a été reportée à périmètre identique après la fusion du nom de héros pour préserver le journal et les deux écrans. Son propriétaire est uniquement le placement des widgets NPC dans le moteur de projection existant.
- « Parler », dialogues de PNJ, duel et commerce restent inchangés fonctionnellement ; leurs positions lisibles sont maintenant projetées près de l'acteur en 2,5D et bornées au viewport du téléphone.
- Gate : test natif actor-screen, Chromium PNJ/dialogues, CI, Pages HTTPS SHA et vérification visuelle utilisateur. Aucun autre moteur ni sauvegarde modifié.

## 2026-11-14 — Étiquette du nom du héros au-dessus du sprite en mode Jouer
- START `main@69d3780052cbea397e7edd5cc9e3bb78f6a2560a`; branche `work/exploration-scoped-hero-nameplate-20261114`.
- Seul le grant officiel de héros Capture est lu : `gensrpg.capture.v2.hero-selection.v1` avec champ facultatif `displayName` vérifié, les vieux grants sans nom restent valides.
- Le nom du joueur est peint au-dessus du sprite par la caméra et le renderer natifs Exploration, sans toucher au modèle de héros partagé, au monde, aux collisions ni au moteur multijoueur.
- Les autres avatars réseau ne sont pas encore émis par ce lot ; leur affichage réclame la source unique du peer renderer, à ne pas simuler.
- Gate : tests de grant rétrocompatible, validation UI et navigateur tactile + publication SHA HTTPS.

## 2026-11-14 — Caméra : PR #442 reportée après la correction bibliothèque héros
- Source du lot caméra vérifié : PR #442, START `checkpoint/exploration-camera-south-follow-start-20261114` et tests CI verts ; changement indépendant des assets/du Hero Editor.
- Après fusion de la bibliothèque héros PR #441 sur `main@9a2c64b`, les deux PR ont ajouté des entrées en tête du même journal : conflit documentaire sans conflit des moteurs. Lot reporté sur `work/exploration-camera-south-after-hero-library-20261114` sans écraser la bibliothèque.
- La seule projection sud du suiveur de héros et les contrôles zoom/scroll éditeur réutilisent le clamp natif ; pas de modification des collisions, du terrain, de la frange nord ou des sauvegardes.
- Gate : tests 35/55/75/90 degrés et tests navigateur canonique ; fusion, checkpoint GREEN et Pages HTTPS sur SHA exact uniquement.

## 2026-11-14 — Bibliothèque des héros : rendre les enregistrements visibles et éviter les doublons involontaires
- START canonique `main@8dce5bc8b7b2c3a50494b260468a6125eaba5c0c` ; checkpoint `checkpoint/exploration-hero-library-start-20261114`, travail `work/exploration-hero-library-dedupe-20261114`.
- Bug de lisibilité : `HeroEditor` initialisait systématiquement la liste sur `Nouveau héros…` malgré les `UserHeroDefinitionV1` enregistrés en IndexedDB. Afficher au chargement une définition existante, son nom/date, le nombre d'enregistrements et les noms répétés. Le choix explicite `+ Nouveau` existe toujours.
- Doublon : la galerie officielle recréait un UUID et 49 PNG sur chaque clic. Le propriétaire natif `installOfficialHeroPresetV1` réutilise maintenant un modèle déjà installé si nom / signature du preset et premier PNG sont identiques ; ne touche ni aux autres héros ni aux modifications personnelles.
- Suppression manuelle : confirmer nom et date de **ce seul enregistrement** et avertir qu'une partie référencée pourra perdre son apparence. Aucun nettoyage/déduplication automatique (sans consentement), aucune suppression de fichiers d'origine, branche, sauvegarde ou source d'autorité.
- Gate : tests d'idempotence de l'installateur, contrôle UI, vrai navigateur/mobile, CI Exploration et Pages HTTPS avant verdict GREEN.
- Autres lots isolés : clamp sud de caméra, nom de héros en aventure/multijoueur, dialogues près des PNJ, audit alpha du pack 2.

## 2026-11-14 — Clarifier « préset choisi » vs carte vraiment chargée
- START : `main@e6c2cacbbae382cce2b95bd9a687843851b81314` ; checkpoint `checkpoint/exploration-map-load-ux-start-20261114` ; branche `work/exploration-map-load-ux-20261114`.
- Aucun changement de contrat WorldArea/WorldSurface ni à la sauvegarde : le modèle choisi dans la liste reste un candidat jusqu'au clic explicite « Charger ». La carte affichée possède un état lisible distinct ; après chargement, indiquer le nom du modèle vraiment appliqué et expliquer que passages/rencontres/héros liés au monde ou à la partie ne sont pas remplacés.
- UI seule, statut dérivé du chemin de chargement déjà canonique ; pas de nouvelle autorité, pas de changement de héros, terrain, objets, collisions ni portails.
- Gate : test de chargeur + CI navigateur Exploration et vérification Pages SHA exact. Réserve à l'utilisateur les contrôles de compréhension et de cohérence visuelle.

## 2026-11-14 — Éditeur Héros : modification des presets, sprites et oscillation
- **START** : `main@e6c2cacbbae382cce2b95bd9a687843851b81314`, branche `checkpoint/exploration-hero-editor-repair-start-20261114`, travail `work/exploration-hero-editor-repair-20261114`.
- **Propriétaire unique** : Exploration `HeroEditor` -> `UserHeroDefinitionV1` -> `UserHeroStoreV1` et `MapActorRenderer`. Le catalogue des 12 modèles et les 576 PNG restent intacts, aucun duplicata dans Capture/GenSRPG.
- **Cause et correctifs** : les imports de directions 8×6 étaient absents de l'éditeur malgré les assets officiels. Les champs d'oscillation étaient désactivés pour les sprites et le renderer écartait toute oscillation en mode sprites, même au repos. Import partiel des six images d'une direction, conservation des autres, base canonique = S/0 ; lecture de vérification après `put` ; oscillation au repos uniquement, aucune oscillation artificielle lors des déplacements sprites. Prévisualisation interactive de taille 25 sans changer d'office les 12 tailles.
- **Invariants gelés** : fichiers officiels, identifiants automatiques, stockages et sauvegardes, locomotion/collision/position, FPS/mouvements validés, animations de marche, WorldBuilder, Combat, Dungeon/Survie.
- **Tests** : définition 49 assets, interpolation du renderer, test tactile Chromium de choix officiel -> modification -> import de six PNG -> sauvegarde -> reload IndexedDB ; CI, Pages et contrôle HTTPS avant validation.
- **Autre lot à traiter séparément** : présentation des presets/cartes chargés (réglages WorldDocument indépendants) et audit alpha du pack 2, sans toucher les PNG sans preuve visuelle.
- **État** : branche de travail, non publiée ; attendre CI GREEN, checkpoint et test visuel auteur.

## 2026-11-13 — Correctif neige : soubassement de la sculpture 2,5D
- Base canonique : main `fa8106f61643e7ff6a8c36c64d96e7d7dd94abd9` ; START `checkpoint/exploration-start-snow-underlay-20261113` ; branche `work/exploration-snow-sculpt-underlay-20261113`.
- Reproduction Neige 1 : WorldSurface est de famille `plain` mais les zones peintes sont `ground.snow`. Le renderer commence par une plaque `baseColor=#536247`; quand le relief est relevé de 2 cases ou plus, des fenêtres en bas laissent voir cette herbe verte, surtout depuis la suppression de la frange sud.
- Propriétaire unique : `src/render/sculpt-height-renderer.js`, pinceau natif `sculptPaintByCell` ; réutilisation des zones de neige sur le support visuel à hauteur zéro **avant** les toits/les falaises. Pas de seconde texture, terrain, collision, limite caméra ni sauvegarde.
- Gel : frange nord seule, clamp caméra, original Neige 1, WorldArea/WorldSurface, Combat, Survie, Dungeon et héros intacts.
- Gate : test `sculpt-snow-painted-underlay-20261113.test.js` + tests généraux + Chromium 2,5D, PR CI et Pages SHA HTTPS ; visuel PC/Android à confirmer par le créateur.
- Ne pas annoncer une publication avant CI GREEN + vérification Pages.

## 2026-11-13 — 12 héros officiels / 8 directions × 6 frames — raccord modèle et sélection
- Base main `191b018476005b3802739566f30a5597da23b1c0` ; checkpoint `checkpoint/exploration-start-heroes12-20261113` ; branche `work/exploration-heroes-12-assets-20261113`.
- Trois ZIP auteur conservés sans modification. Source unique publiée : `assets/exploration/actors/official/catalog.json` + 12 jeux de PNG individuels (576 frames et modèle face/dos). Aucun spritesheet dérivé ni copie de moteur Combat.
- `MapActorVisual.animation.mode='directions'` est un mode additif de l'unique renderer et un déplacement XY du seul moteur Exploration. Huit orientations, six frames par orientation, pivot constant, fps 8 et repos sur frame 0.
- `Hero Editor` affiche la galerie officielle ; clic « Utiliser ce modèle » installe une définition `hero.user.<UUID>` via le `UserHeroStore` existant (mêmes données que la sélection Aventure). Les anciens héros à image fixe ou animation simple restent compatibles.
- Tests de bibliothèque (comptage, PNG RGBA 128×160, unicité des 576 assets), configuration/renderer directionnel, véritable Chromium sur éditeur et persistance IndexedDB. CI sur SHA exact et Pages main requis avant annonce d'une livraison.
- Publisher : les ZIP auteur ne doivent jamais être inclus dans le dossier Pages. Cette politique ne supprime aucun ZIP de la source Git.
- Aucun raccord direct vers Dungeon, Survie, moteur de combat ou sauvegardes existantes. Aucun nom/ID de héros à saisir manuellement.

---

## 2026-11-13 — Frange décorative sculptable : intégration au seul Labo Exploration
- START `main@144d614ace99387cc77a995ed6459bde806a4189`, checkpoint `checkpoint/exploration-start-sculptable-fringe-20261113`, branche `work/exploration-sculptable-fringe-model-20261113`.
- `WorldArea.decorativeFringe` est un champ facultatif, uniquement sur la WorldArea déjà autoritaire. Sa sculpture passe par les pinceaux `applySculptBrush` du **même** SculptTerrain, en fragments 8×8 (jusqu'à huit cases au-delà des quatre côtés). Les objets utilisent le modèle WorldObject existant, sans IDs manuels.
- La limite originale `WorldArea.width/height/boundary` et `WorldArea.sculptTerrain` reste la SEULE référence Collision World, rencontres, Portals, Spawn et navigation. Aucune extension du monde jouable, aucun moteur parallèle, aucune migration des cartes historiques.
- La branche contient désormais l'affichage par le renderer natif `drawSculptTerrain`, une commande **Décor hors zone jouable** dans le Sculpt de la WorldArea et un pinceau tactile de relief/eau, avec placement/retrait d'objets du catalogue existant. Le noyau jouable conserve sa caméra, ses collisions, ses Portals et ses Spawns ; seule la vue éditeur affiche le pourtour en mode sculpture, tandis que Tester/Jouer le rendent en décor visible non franchissable.
- Décision utilisateur : garder **8 cases de frange**, même sur la limite canonique 80×64, sans option 16/24 pour ce lot. La caméra Jouer arrête son déplacement vers le bas à la huitième rangée décorative et peut garder une bande de **ciel naturel au nord** (12% de la hauteur de fenêtre, maximum 120 px). Présentation uniquement ; terrain, acteurs, collisions et passages ne changent pas.
- Validation : CI de base, rendu Chromium et test navigateur spécifique de peinture hors des bords (quatre côtés / limites 36×24) ajoutés à la barrière du labo. Avant promotion sur `main`, requérir GREEN sur le SHA exact. Après livraison, vérifier sur le matériel cible les jonctions des fragments et les performances paysage. **Aucune publication GenSRPG globale**. Les bâtiments à étages et le scintillement Combat demeurent indépendants.

---

## 2026-11-13 — Caméra 2,5D bornée aux vrais contours du terrain en Jouer
- START `main@62c717c4f6a568733c50452a6c7c64a386afa31f`, checkpoint `checkpoint/exploration-start-native-camera-edge-clamp-20261113`, branche `work/exploration-native-camera-edge-clamp-20261113`.
- Cause : les cartes montées en WorldArea activaients le suivi du héros sans borne, bien que le mode Tester simple borne déjà la caméra. Sur PC grand écran et plein écran, un bord du monde pouvait sortir du cadre et montrer le vide.
- Correction sans second moteur : `clampSculptNavigationCameraToTerrainV1` applique à la caméra existante les limites déjà calculées par `sculptCameraBounds`. Les intérieurs restent sur leur suivi natif ; les extérieurs montés et le Tester simple utilisent la même fonction de projection, sans affecter collision, hitboxes, mouvements, arènes ni sauvegardes.
- Ce lot limite le cadrage ; il ne crée pas de nouvelle surface sculptable ni de zone non jouable. Si la carte est plus petite que le viewport à un zoom donné, la vue reste centrée sans agrandir artificiellement les textures. Tests bornes latérales/verticales/zoom et garde de la logique jeu.
- CI GREEN et vérification visuelle PC plein écran et Android paysage requises. Ne pas déclarer le scintillement Combat global résolu par ce réglage.

---

## 2026-11-13 — Rétractation du prototype de bordures automatiques (choix du créateur)
- START `main@62c717c4f6a568733c50452a6c7c64a386afa31f`, checkpoint `checkpoint/exploration-start-retire-auto-borders-20261113`, branche `work/exploration-retire-auto-borders-20261113`.
- L'ancien générateur décoratif 2,5D ne s'active plus par défaut. Son code source historique et ses réglages d'essai ne sont pas supprimés (pas de perte d'assets), mais les cartes n'affichent plus ces fausses bordures automatiquement.
- Ce lot ne prétend **pas** fournir la nouvelle surface sculptable + limites jouables ; elle nécessite un contrat unique de WorldArea / Collision World et caméra, à valider séparément sur PC et téléphone. Aucun terrain, collision ou sauvegarde modifié ici.
- Tests `tests/sculpt-border-scenery-v1.test.js` adaptés (désactivation par défaut, opt-in explicite), CI et Chromium requis avant validation.

---

## 2026-11-13 — Types de rencontres issus du Bestiaire Combat publié (Builder)
- START `main@62c717c4f6a568733c50452a6c7c64a386afa31f`, checkpoint `checkpoint/exploration-start-live-encounter-elements-20261113`, branche `work/exploration-live-encounter-elements-20261113`.
- Cause vérifiée : `src/builder/world-builder-main.js` utilisait le catalogue historique `CAPTURE_CREATURE_CATALOG_PREVIEW_V1` figé sur un commit de septembre. L'éditeur 2,5D consommait déjà le bundle officiel Combat.
- Correction : le World Builder lit le même bundle `capture-author-encounter-bundle-v1` produit depuis la source Combat `main` ; les types `ice` (Glace), `nature` et tous les futurs types publiés sont déduits des éléments réellement présents, sans liste secondaire. Lecture `no-store` en édition pour éviter les espèces anciennes en cache. En cas d'échec, expliquer la provenance manquante et ne pas masquer avec une vieille liste.
- Aucun changement de probabilités, WorldSurface, gameplay, sauvegardes, moteur, IDs, captures ou assets. Tests ciblés `tests/world-builder-live-encounter-elements-20261113.test.js` ; CI/Pages/validation PC + Android nécessaires avant livraison.
- Ce lot ne modifie ni les chances neige/route (PR distincte #429), ni les récompenses PNJ, ni la caméra/decor, ni le Combat. Publication GenSRPG distincte, pas automatique.

---

## 2026-11-13 — Habillage extérieur 2,5D par biome (prototype visuel, lot isolé)
- Départ : Exploration officiel `main@0c1727f86a62bd8dc428b50bf73d2a4163b30225`. Lot `feat/sculpt-decorative-map-edges-v1`, PR #426 ; uniquement le Labo Exploration. Aucune modification du Hub GenSRPG, du Combat ou de WorldDocument.
- Objectif validé par le créateur : masquer l’effet de plateforme flottante sur les quatre bords, en priorité l’avant et les côtés, avec différentes variantes selon le biome et personnalisation indépendante.
- Autorité : une **surcouche de rendu Canvas** dans `src/render/sculpt-border-scenery-v1.js`. Aucun terrain jouable supplémentaire, aucun objet, collision, Spawn, Portal, ID ni système de sauvegarde parallèle. La surface, le mouvement et le terrain sculpté restent natifs.
- Éditeur de test : « Habillage des bordures » depuis les options de navigation de `sculpt-lab.html`, biome automatique ou choisi, côté avant/gauche/droite/arrière, style, densité et bouton de régénération. Les variantes utilisent une graine déterministe par aire/côté, avec protection de la bande supérieure du ciel. Les options ne persistent **pas** encore après rechargement ; première validation du rendu avant l’ajout de données pérennes.
- Respect des versions anciennes : les commandes nouvelles sont optionnelles et ne s’initialisent pas dans `sculpt-lab-v80.html`. La suppression du publisher V80 est **un chantier indépendant**, et non une seconde source moteur pour l’habillage.
- Tests : `tests/sculpt-border-scenery-v1.test.js` pour les invariants, `scripts/smoke-sculpt-terrain-lab.mjs` pour le vrai parcours Chromium des commandes, restauration éditeur et scène inchangée ; CI + assemblage Pages du commit exact avant fusion. Pas de publication avant GREEN.
- Critère manuel : vérifier sur PC en mode Tester des cartes Plaine, Forêt, Neige, avec premiers plans naturels, météo/ciel intact, contours sans trou et performances mobiles. Ne jamais supprimer les cartes ou présélections d’essai dans ce lot.

---

## 2026-11-12 — Errance native des PNJ sur les cartes 2,5D (lot isolé)
- START `main@46e4e3559c17dfb6bd3d7afbdb1f3d8caed93048`, certifié CI `43301155708` et Pages `43301155674`; checkpoint `checkpoint/exploration-start-npc-wander-20261112`, branche `work/exploration-npc-wander-2026-11-12`.
- Propriétaire : Labo Exploration, **une seule boucle RAF de navigation et un seul Core Movement/Collision World**, partagé avec le héros. Le composant `npc-wander-runtime-v1.js` est une projection **temporaire** de `WorldArea.actors[].npc.movement` (déjà enregistré dans la fiche PNJ unique) : rayon autour de l'ancre, repos, déplacement, orientation, obstacles et terrain natifs.
- Aucun mouvement sauvegardé, aucun changement de modèle WorldArea, aucune copie de scène, aucun identifiant technique nouveau. Les modes statiques restent inchangés. L'éditeur retrouve les ancres exactes après Tester/Jouer ; Porter/Retirer des PNJ ou traverser un Portal réinitialise uniquement la projection.
- Le renderer natif existant reçoit le drapeau `moving`, le dialogue et le dresseur agressif consomment la position temporaire ; un PNJ errant peut approcher un héros immobile. Pause pendant un dialogue ou un combat. Évitement simple du héros avant le déplacement ; la physique est seulement celle de Collision World.
- Protection absolue : V80 figé, Combat, Spawn, sauvegardes, PNJ fixes, monstres, récompenses/objets et or, World Builder, éditeurs, PNJ marchands/quête/dresseur, publication du hub et quatre modes de jeu.
- Tests : nouveau Node `tests/npc-wander-native-20261112.test.js` (leash, collisions, immutabilité, reset, pause et intégration), l'ensemble des tests, vrais parcours Chromium PNJ, Tester, Jouer, sauvegardes et combats, puis CI et Pages sur le SHA exact avant fusion. L'UI Android paysage mérite validation manuelle même après Chromium GREEN.
- La publication vers le hub reste un lot séparé d'adoption d'un SHA Exploration certifié, et ne doit jamais dupliquer le moteur.

---

## 2026-11-12 — Reprise CI après fusion récompenses PNJ, sans changer le gameplay
- START : Exploration `main@2c22a2044af9218eb21a0904cfc25f6edb044894` (PR #423), checkpoint `checkpoint/exploration-start-ci-recovery-20261112`, branche `work/exploration-ci-recovery-2026-11-12`.
- La CI main `43299342649` a échoué dans deux smokes Chromium, alors que la CI candidate récompenses `43297566524` était GREEN : `smoke-sculpt-remote-pixels.mjs` (reprise de session Aventure non active dans la fenêtre d'attente), `smoke-world-assembler-authoring-layout.mjs` (profil Chromium `ENOTEMPTY` avant arrêt réel du processus).
- Lot limité aux scripts de test : attente bornée du vrai moteur Jouer après Continuer, diagnostic de page/erreur, fin effective du navigateur avant suppression du profil et retries uniquement sur cette suppression. Les assertions d'intégrité des sauvegardes, du Canvas et du World Builder ne sont pas assouplies.
- Protégés : `WorldArea.actors[].npc`, Catalogues Combat, Capture et GenSRPG, sauvegardes, monnaie/objets, V80, assets, exports/imports, index, PWA, menus, quatre modes et gameplay.
- Porte de sortie : `npm test`, Chromium, CI Exploration, assemblage Pages, SHA unique et checkpoint GREEN avant fusion. Aucun déploiement revendiqué par la seule présence d'une PR.

---

## 2026-11-12 — Récompenses de dresseur dans la fiche native Explorer (C2, candidat)
- START sur `main@f8d670a838cb224660c9d5ca3f8508e8c34b2b93`, checkpoint `checkpoint/exploration-start-trainer-rewards-20261112`, branche `work/exploration-trainer-rewards-2026-11-12`. La fenêtre PNJ unique PR #422 est fusionnée avec checkpoint `checkpoint/exploration-npc-modal-green-20261112` ; la CI du main est verte (#43296071090).
- L'instance `WorldArea.actors[].npc` garde seulement `trainerReward={currency,items:[{itemId,quantity}]}`, aucun inventaire, portefeuille ou catalogue : les objets sont sélectionnés par NOM via le pont read-only GenSRPG Capture officiel.
- Le même `CaptureEncounterSnapshot.context` transporte facultativement ce réglage de la carte vers le résultat Combat ; la récompense et son anti-double restent la propriété exclusive de `AdventureSession` et `applyAdventureCombatResultV1` (source Capture candidate PR #410). Aucun gain dans Explorer ou dans Combat.
- Jeu sans parent GenSRPG : les pièces configurées et le transport peuvent être testés, mais le sélecteur d'objets ne fabrique pas de catalogue de secours ni d'ID manuel. Les objets devenus indisponibles restent des références inertes dans les cartes.
- Protégés : combats natifs, PNJ historiques, autres rôles (marchand/quête/monstre errant), V80, cartes, Portal, sauvegardes, contrôle du combat et menus, autres modules, médias.
- Tests du candidat C2 sur code `6b499542f9d26e16de099e34150bf029e01b880f` : Exploration CI #43297566524 **SUCCESS** (unités, rendu PNJ et Combat en vrai Chromium, intégrité des autres parcours) ; assemblage/contrôle de prépublication Pages #43297566634 **SUCCESS**. Le snapshot réel inclut la monnaie du PNJ après passage par le handoff officiel et sa relecture, sans nouvelle autorité. La première CI rouge a été corrigée sur l'adaptateur propriétaire avant validation.
- Reste à fusionner PR #423 sur main, vérifier CI Pages/HTTPS sur SHA final, puis épingler ce SHA dans la source Capture et publisher GenSRPG. Le test utilisateur sur smartphone reste distinct des tests Chromium. Aucun octet de média ni moteur hors Exploration modifié.

---

## 2026-11-12 — Fenêtre native unique de configuration des PNJ (C1, candidat)
- START : `main@0c0f12c37ff994fd9783b7170fe288e7513db3c6`, checkpoint `checkpoint/exploration-start-npc-modal-20261112`, branche `work/exploration-npc-modal-2026-11-12`.
- Propriétaire : Labo Exploration / interface Sculpt 2,5D. Le formulaire `actor-npc-settings` est déplacé dans un SEUL `<dialog>` natif, pas cloné. La donnée reste `WorldArea.actors[].npc` ; équipes et bestiaire officiels, récompenses, moteur Combat et sauvegardes restent auprès de leurs propriétaires.
- Comportement : poser un acteur ou toucher un acteur déjà placé ouvre la même fiche, bouton « Configurer ce PNJ » pour la rouvrir, fermeture/ESC sans perdre de données. Fenêtre à défilement avec hauteur adaptée au paysage smartphone et retour à la carte. Aucun ancien éditeur ou ancien contenu V80 modifié.
- Tests : sentinelle Node sur unicité des IDs et trois ouvertures ; vrai Chromium `scripts/smoke-sculpt-npc-v1.mjs` sur placement/édition/dialogue/duel Tester/Jouer ; `npm test`, `npm run check`, CI, budget Pages, provenance HTTPS, validation Android. Revenir au checkpoint START si régression.
- GREEN/fusion de la fenêtre PNJ : PR #422 fusionnée sur `main@f8d670a838cb224660c9d5ca3f8508e8c34b2b93`, checkpoint `checkpoint/exploration-npc-modal-green-20261112`, CI main #43296071090 et Pages #43296071086 **SUCCESS**. La fenêtre native conserve les contrôles uniques ; elle reste indépendante du lot de récompenses #423.

---

## 2026-11-12 — Déclencher les duels depuis les cartes du Builder

- START `checkpoint/exploration-start-trainer-test-paths-2026-11-12` sur `main@e2e5b2861b41fc868412e2c7f06197e904f9cbf0`. Branche `work/exploration-trainer-test-paths-2026-11-12`. Base Exploration certifiée par la CI `43254533593` et Pages `43254533640`.
- Le créateur peut ouvrir la carte par Tester ou par Jouer dans le World Builder. Exploration réutilise l’équipe officielle d’essai pour les duels de ces deux parcours. GenSRPG Aventure conserve son équipe et ses résultats persistants.
- Sur la base, un dresseur créé depuis le formulaire affichait « Terminer » et « Fermer » en mode Tester. En Chromium paysage, la candidate propose le duel, ouvre la réserve native, puis revient à la carte après la fuite. Le bouton Jouer du World Builder lance aussi le combat direct au premier déplacement quand le départ est à portée.

---

## 2026-11-12 — Choisir comment un dresseur déclenche son duel
- START `checkpoint/exploration-start-trainer-engagement-2026-11-12` sur `main@48f90925a0b9ce051cbd2769c26fde2afda9932b`. Branche `work/exploration-trainer-engagement-2026-11-12`. CI `43234471581` et Pages `43234471518` sur la base.
- Exploration enregistre le déclenchement dans la fiche du PNJ placé. La proposition laisse le joueur accepter ou refuser. Le comportement agressif se déclenche lorsque le joueur entre dans le rayon d'interaction.
- Combat reçoit la même équipe et le même décor qu'auparavant. Aventure conserve l'autorité sur les résultats et les dresseurs déjà battus. Les mondes existants utilisent la proposition de duel par défaut.
- Vérifier le choix en 2,5D, l'export et l'import, l'acceptation et le refus, le lancement en marchant, ainsi que la reprise après combat dans GenSRPG.

---

## 2026-11-12 — Lancer les combats des PNJ dresseurs depuis Jouer

- START `checkpoint/exploration-start-capture-trainer-encounters-2026-11-12` sur `main@02bb3844bdeb1277e615026617cdf6b41857f320`. Branche `work/exploration-capture-trainer-encounters-2026-11-12`.
- Exploration transporte l’équipe du PNJ déjà enregistrée dans la WorldArea. Le dialogue précède le défi quand il est renseigné. La sélection de décor utilise la même règle que les rencontres sauvages.
- Combat résout les participants via sa réserve native. GenSRPG Aventure enregistre la victoire et projette la liste des dresseurs battus. Les autres types de PNJ et la règle de rencontre sauvage restent protégés.
- Combat PR #301 fusionnée sur `main@b700d477565fef69f79f5e36fcf16cb71a268c97`. En Chromium paysage, la candidate lance le vrai combat depuis le dialogue, montre la réserve et permet de gagner. Après recharge, la sauvegarde Aventure bloque un nouveau défi contre ce PNJ.
- Vérifier la composition exacte, le journal à la reprise et la sortie vers l’exploration. Tester le dialogue et la véritable réserve adverse avant publication.

---

## 2026-11-12 — Décors de combat par monde, zone et bâtiment

- START `checkpoint/exploration-start-combat-arena-overrides-2026-11-12` sur `main@393fa6371732b8c72faface7765ce027b6751af7`. Branche `work/exploration-combat-arena-overrides-2026-11-12`. Base publiée et certifiée par les runs Exploration CI `43201349450` et Pages `43201349264`.
- Exploration enregistre les références sur le WorldDocument, la WorldArea et le bâtiment placé. Le passage ancré à sa porte identifie son intérieur. Le catalogue et le rendu du décor appartiennent au Labo Combat `main` (`9b8fe770b531abf4f8191a746e0fdcc43f7abbae`, CI `43103011400`).
- Les anciens mondes et combats en attente conservent leur format. Les règles de rencontre, les sauvegardes Aventure et les arènes élémentaires placées restent protégées.
- Vérifier la conservation à l’export/import, l’ordre de priorité et le parcours Chromium paysage World Builder → Jouer → décor natif. Publier depuis Exploration `main` après CI et preuve HTTPS, puis épingler le SHA certifié dans Capture V2.

---

## START — 12 novembre 2026 · Catalogue officiel PNJ rechargé à la demande
- Base `main` exacte : `373b104100bd4aecd5da1d457bac3b45f923237f`; checkpoint `checkpoint/exploration-start-npc-catalog-retry-20261112`.
- Lot unique : interface de l'éditeur de PNJ 2,5D et recharge manuelle du catalogue publié Combat après erreur réseau. Aucune source de créatures alternative.
- Propriétaire : Labo Exploration pour les interactions UI ; Bestiaire et publication toujours Labo Combat.
- Protégés : sauvegardes, monde, combats, navigation, acteurs placés, URL V80, ressources et autres modes GenSRPG.
- Validation : test de non-régression sélection/équipe, état désactivé en échec, CI Exploration, gate Pages, SHA HTTPS et test manuel mobile.
- Pas d'intervalle de retry, d'identifiant saisi à la main, de copie d'assets ou de changement de données persistantes. Ne pas annoncer GREEN avant publication exacte.

## 2026-11-11 — PNJ : sélection immédiate après pose (C1, branche de préparation)

- **Signalement** : après avoir posé un PNJ de type dresseur, « Ajouter à l'équipe » reste grisé ; la liste exige un acteur sélectionné, mais la pose laissait l'outil en mode « placer ».
- **START** : Exploration `main@e514548025eb359edecdeef60bf455f78f599b3b`, checkpoint `checkpoint/exploration-start-npc-auto-select-2026-11-11`, branche temporaire `work/exploration-npc-auto-select-2026-11-11`. Publication et autorité uniques : `main`.
- **Responsabilité** : Sculpt 2,5D gère exclusivement la sélection UI après insertion ; `WorldArea.actors` reste l'unique source des instances PNJ. Les créatures sont toujours lues du bestiaire Combat publié.
- **Périmètre** : `src/sculpt-lab-main.js`, `tests/sculpt-npc-placement-dialogue-v1.test.js`, cette note. Après la pose, choisir l'acteur qui vient d'être créé, passer au mode sélection et ouvrir sa fiche ; aucune deuxième équipe ou catalogue.
- **Protégés** : Sculpt V80 gelé, sauvegardes de scènes, comportement d'errance, PNJ marchands, dialogues, géométrie, combat, objets, Capture et GenSRPG, assets et versions historiques.
- **Tests** : sentinelle du parcours réel « placement → sélection → édition équipe », unité PNJ existante, CI et test Chromium, vérification smartphone. Ne pas annoncer GREEN ni fusionner avant preuve de la CI sur SHA exact et HTTPS après `main`.
- **Hors lot** : déclenchement combat dresseur, arènes par zone, système de loot, éditeur d'objets ; traitement séparé sous l'autorité de Capture/GenSRPG.

---

## 2026-11-10 — PNJ marchands : sélecteur sans ID et ouverture dans Capture (C2, CANDIDAT)
- **START** main `f0203b0787aaa2dd1272e58e9c9cf76b9efade2b` post-PNJ #409 ; checkpoint `checkpoint/exploration-npc-merchant-bridge-start-2026-11-10`, branche `work/exploration-npc-merchant-bridge-2026-11-10`.
- **Propriétaire et périmètre** : Exploration maintient les instances `WorldArea.actors[].npc` et le rayon de proximité 65 unités. En mode éditeur GenSRPG, un message strictement same-origin vers son parent demande la liste **en lecture seule** des marchands nommés par Capture ; le créateur choisit un nom dans un menu, jamais un ID à recopier. L'ancien `npc.merchantId` reste stable et est conservé au renommage ; un lien disparu ne supprime ni la carte ni la donnée originale.
- **Mode Jouer** : interaction native à proximité d'un PNJ marchand, même sans dialogue. Seul `merchantId`, l'ID interne d'acteur et la session corrélée partent par message au parent Aventure ; Capture est le SEUL module qui réalise et sauvegarde des achats, sous un verrou. Messages ACK/fermeture pour suspendre/reprendre la marche ; aucun commerce calculé dans Explorer.
- **Invariants** : aucun autre PNJ, dialogue, WorldDocument, stat, Combat, catalogue d'objets ou runtime d'un autre module modifié ; pas de copie de marchandises, monnaie, fragments, inventaire ni sauvegarde. Labo V80 préservé. La page Exploration autonome sans parent GenSRPG n'invente pas de boutiques.
- **Tests** : `tests/sculpt-npc-merchant-bridge-v1.test.js` pour normalisation, proximité et transport ; CI Exploration propriétaire, navigateur Sculpt et publication Pages exigés avant fusion. Dépend du candidat GenSRPG source `work/gensrpg-capture-npc-commerce-2026-11-10`; rollout des deux dépôts via SHA immuables.
- **Contrôles vérifiés sur code `bb83a5cbb47036227f6b842e417cbb8c3972e0db`** : `core-tests`, `modern-combat-encounter`, `native-https-pixels`, `detect-upstream` et `verify-and-assemble` SUCCESS, `deploy` skipped normal pour une PR ; anciens jobs cancelled d'un essai supersédé, non considérés comme tests verts. Checkpoint GREEN sur le SHA final après contrôle de cette mise à jour documentaire.
- **État** : source fonctionnellement validée pour la revue, mais non publiée ; fusion `main` puis Pages HTTPS et référence Capture immuable restent requises.

---

## 2026-11-10 — PNJ v2 : édition visuelle des équipes et monstres errants (CANDIDAT, NON GREEN)
- **START :** `main@f4188ecb14b3cee60a011e950c0926793b30ced7`, lot `work/exploration-npc-visual-authoring-v2-2026-11-10`, checkpoint de départ `checkpoint/exploration-npc-v2-start-2026-11-10`.
- **Demande :** retirer les champs d'identifiants techniques de l'UI, donner des menus visuels aux PNJ avec équipes et monstres errants, sans catalogues dupliqués.
- **Source de vérité :** `WorldArea.actors[].npc` existant reste l'unique fiche de scénario des instances PNJ. `npc.trainerRoster` (0 à 6 références `creatureId/level`) et `npc.wildCreature` (référence + niveau) sont facultatifs, versionnés, conservés à l'export/import ; **aucune copie** des caractéristiques, attaques, sprites, règles Combat, ou état du joueur. Les créatures proposées sont chargées depuis le **bundle de publication Combat officiel**, jamais depuis le catalogue historique local de septembre. Ni table d'équipes parallèle, ni faux catalogue GenSRPG.
- **Interface :** type Dresseur → ajouter, retirer, réordonner et régler les niveaux, copier volontairement une composition d'un autre PNJ placé ; type Monstre errant → sélectionner espèce publiée et niveau ; aucune saisie d'identifiant technique. Les anciennes références `trainerTeamId`, `questId`, `merchantId` restent chargées et exportées sans changement des données ; le champ texte manuel est supprimé.
- **Limites honnêtes :** ces compositions de PNJ sont des intentions de rencontres, **pas encore des équipes globales GenSRPG**. Le déclenchement des combats, la création/sélection de véritables équipes GenSRPG réutilisables, l'éditeur de quêtes et l'éditeur de boutiques restent dans les modules propriétaires et ne sont **pas** simulés. La marche errante effective reste hors de ce lot, sans libellé trompeur. Un catalogue Combat indisponible ferme le sélecteur sans inventer des espèces.
- **Protection :** V80 immutable, cartes/objets/Portals, scènes historiques et anciennes références, moteur Combat/GenSRPG et assets, publisher unique. La présente PR ne modifie aucun autre dépôt.
- **Gates :** test Node (normalisation, export/import et invariants), vrai Chromium (pose, sélection, édition d'équipe via boutons, dialogue, V80), `npm run check`, CI SHA exact, Pages budget et previews préservés ; checkpoint GREEN, fusion `main`, puis contrôle HTTPS et commit servi. **NON GREEN** avant ces preuves.

---

## 2026-11-10 — PNJ de carte 2,5D : fiche d'instance et dialogue (CANDIDAT, NON GREEN)
- **START immuable :** `main@448b6608c469238983ab9b330aa79d34016365ca`, branche `work/exploration-npc-placements-v1-2026-11-10`; lot isolé Exploration.
- **Demande :** cliquer un acteur placé, définir sa catégorie (dialogue, quête, dresseur, créature errante, marchand), nom, comportement statique/errance et dialogue ; préparer les raccords ultérieurs.
- **Autorité :** `WorldArea.actors[]` conserve les placements ; champ optionnel `npc` versionné limité aux réglages *locaux à l'instance*. `actorDefinitionId` reste la seule référence visuelle ; tous les combats, créatures, équipes, quêtes, inventaires et boutiques restent dans leurs propriétaires. Aucun nouvel EventStore, WorldDocument, moteur de collision ou moteur de mouvement.
- **Fonctionnel dans ce lot :** pose/sélection/édition via l'onglet Acteurs de Sculpt, nom + texte de PNJ, formulaire et références futures, conversation de proximité en mode Tester/Jouer (proximité 65 unités, texte multiligne, pause de déplacement). Visuel PNJ générique depuis l'asset Explorer existant, visuels Capture par référence.
- **Non implémenté volontairement :** mouvement errant actif, quêtes et récompenses, équipes de dresseurs et combats scénarisés, marchandises, import de visuel personnel PNJ, combats de monstres errants. Ces paramètres restent des intentions et ne doivent pas être présentés comme gameplay actif.
- **Protégés :** placements hérités sans champ npc identiques, héros, Monster Capture, collisions/Portals/sauvegardes, Sculpt V80, assets et previews ; aucun chemin binaire ou autorité externe modifiés.
- **Gate :** `npm test` + `npm run check`, CI du SHA candidat, tests navigateur édition/interaction sur mobile/paysage, contrôle Pages et budget, checkpoint GREEN puis `main` uniquement après validation. Aucun statut publié annoncé avant les preuves.

---

## 2026-11-09 — World Builder : lot 1 compacité paysage (en validation)
- START `main@73bf5e2d7538e785f35856ed106f87129ce09601` ; checkpoint `checkpoint/exploration-mobile-compact-start-2026-11-09` ; WORK `work/exploration-mobile-compact-2026-11-09`.
- Objectif : priorité à la carte du monde sur smartphone paysage. Structure accessible par un volet réversible, import/export dans un menu Fichiers, actions secondaires du graphe dans un menu Outils, titre et hauteurs réduits. Aucun contrôle supprimé ; aucun modèle de monde, carte, asset, Portal ou sauvegarde modifié.
- Le raccord « Événements → Sculpt 2,5D » est un **second lot séparé**, non réalisé ici. Le lien existant vers le Builder historique reste actif jusqu'à une migration réellement testée ; pas de nouvel EventStore ni de perte de fonctions.
- Gate : CI Node, Chromium réel avec viewport paysage, vérification des menus et de l'export/import, préflight Pages, checkpoint GREEN et main exact. Aucun déploiement avant GREEN. Android physique à valider séparément.

---

## 2026-11-09 — World Builder : navigation rapide des contenus et passages (lot isolé, CANDIDAT)
- **START exact** : `main@ac563b2072b7518ff929db78d5f6fcdeb1493ba7` ; checkpoint START `checkpoint/exploration-area-content-navigation-start-2026-11-09` ; branche WORK `work/exploration-area-content-navigation-2026-11-09`.
- **Motif** : PR #402 et #403 ont déjà livré déplacement graphique et unique fenêtre de zone. Complément strictement ergonomique : filtrer les objets affichés (bâtiments, arènes, salles, donjons, décors), ouvrir les zones reliées par les vrais Portal sans revenir au tableau, ouvrir une destination depuis la liste des passages, confirmation avant suppression manuelle.
- **Autorités inchangées** : aucun nouveau WorldDocument, catalogue, modèle, Portal, source de sauvegarde ou coordonnées gameplay. Navigation calculée depuis `draft.portals` existants ; listes d'objets depuis `area.objects` et `objectDefinitionCatalogV1`. Pas de déduction de filiation depuis la position graphique.
- **Fichiers concernés** : `world-assembler.html`, `src/builder/world-assembler-main.js`, `src/builder/world-assembler.css`, test ciblé, smoke Chromium du World Assembler et ce journal. Aucun asset, presét, V80, Combat, GenSRPG, publisher ou jeu modifié.
- **Gate avant fusion** : `npm test`, `npm run check`, vrai Chromium clic / filtre / navigation / ESC / drag / rechargement, test des mondes/Portals préexistants, CI au SHA exact, budget Pages/V80 et checkpoint GREEN. Après fusion : CI + Pages sur le SHA `main` exact ; validation physique Android séparée. **Statut : NON GREEN avant preuves.**

---

## 2026-11-09 — World Builder : une SEULE fenêtre « Modifier la zone » (lot isolé)
- **Demande** : cliquer sur une carte WorldArea ou son bouton « Modifier » ouvre une fenêtre dédiée, désengorge le plan et rassemble les réglages NATIFS existants : niveaux mini/maxi, bâtiments/arènes décoratives, intérieurs/donjons, événements, passages, accès éditeur de carte.
- **Pas de deuxième affichage** : déplacer les vrais formulaires et IDs DOM du panneau latéral dans le dialogue modal, supprimer le panneau droit originel ; garder une seule instance des formulaires de niveaux / passages / création d’Area. Le formulaire de création déjà existant rejoint aussi le dialogue, avec accès depuis « Nouvelle zone ».
- **Textures = autorité des rencontres** : les probabilités et les familles de terrain restent exclusivement dans `WorldDocument.encounterConfig.families[].encounterChancePercent`, éditées dans le Builder natif ; le niveau `WorldArea.encounters.minLevel/maxLevel` ne change PAS le déclenchement. Une route peut rester 0 %, les herbes être dangereuses. Aucune deuxième table/chance par Area.
- **Cartes de combat** : ne PAS inventer de liste d'arènes indépendante dans Exploration. La seule liste réelle actuelle de fonds de combat est `demoPresentationAssets.arenaOptions()` de Combat (forest/cave/snow/city/lava), séparée des 10 objets « arènes élémentaires » placés sur l'exploration. Raccord de sélection par zone/bâtiment = lot contrat Combat/GenSRPG distinct ; garder le panneau explicitement informatif et ne pas enregistrer un réglage mort.
- **START immuable** : `main@4a4fc9ceece748cd0923840a11ba5c44ee959b12` ; checkpoint `checkpoint/exploration-area-editor-modal-start-2026-11-09` ; WORK `work/exploration-area-editor-modal-2026-11-09`. CI + Chromium + Pages exigés avant promotion ; état initial = première version officielle du drag-persistence GREEN.
- **Protégés** : moteur/WorldDocument/Portals/spawns/encounters, cartes, maisons, arènes, événements, avatars, textures, presets, V80 figée, Combat et GenSRPG, PWA. Aucun fichier binaire, script assets ou sauvegarde supprimé. Une seule autorité pour chaque réglage, aucun UI bis.
- **Recette** : click et bouton ouvrent un unique dialogue, fermeture ESC et bouton, édition min/max native, création d'intérieur existant, liste événements de la vraie WorldArea, accès réglages du terrain dans Builder, navigateur paysage/mobile, tests import/export et vérification d'un `main` réellement publié.

---

## 2026-11-09 — World Builder : plan de zones déplaçables et contenu natif par Area (lot isolé)

- **Départ certifié** : `main@9ae6a89c870cf001b540207e2dc7889ec930d518` ; checkpoint immuable `checkpoint/exploration-world-assembler-layout-contents-start-2026-11-09` ; travail `work/exploration-world-assembler-layout-contents-2026-11-09`.
- **Demande auteur** : organiser librement les WorldArea du plan (glisser-déposer PC et tactile), sauvegarder cet agencement à l’export/import et dans la bibliothèque de mondes ; depuis une Area, inventorier les vraies maisons, arènes, autres objets et instances/donjons liés ; lancer le placement via l'éditeur de carte natif.
- **Propriétaire unique** : `WorldDocument` reste la seule autorité des `areas`, `objects`, `portals` et `spawns`. Une métadonnée facultative `authoringLayout`, purement graphique et sans effet dans le jeu, porte les positions; données nettoyées et bornées lors de l'import. Aucun moteur de bâtiment, carte ou passage bis.
- **Périmètre strict** : `src/world/world-document-model.js`, `src/builder/world-builder-draft.js`, `src/builder/world-assembler-main.js`, `world-assembler.html`, `src/builder/world-assembler.css`, tests ciblés. L'éditeur 2,5D déjà existant reste l'unique point d'ajout de décor/maison/arène, et l'éditeur d'intérieurs le seul créateur de liens de porte.
- **Protégés** : 20 arbres enneigés, 10 arènes élémentaires, moulins/éoliennes, maisons et Portals, Sculpt V80 gelé, sauvegardes historiques, rencontres, niveaux par WorldArea, Play, Combat, GenSRPG/PWA, catalogues et ZIP sources. Aucune suppression ou déplacement des médias ni modification d'autre dépôt.
- **Gate** : tests unitaires sérialisation et non-régression portails/objets, `npm run check`, `npm test`, CI au SHA exact, World Builder navigateur/tactile, checkpoint GREEN puis seulement promotion `main` et Pages. CI seule ≠ validation physique Android.

---

## 2026-11-09 — Aventure : signal unique de visibilité Combat pour libérer les PV adverses
- **START** : `main@9ae6a89c870cf001b540207e2dc7889ec930d518`, checkpoint `checkpoint/exploration-start-capture-combat-hud-2026-11-09`, lot `work/exploration-capture-combat-hud-2026-11-09` ; aucune autre branche de publication et aucun déplacement des autorités.
- **Observation** : l'overlay Combat natif est dans l'iframe Exploration mais le HUD Capture parent (Sac, Personnage/Équipe, plein écran) reste au-dessus et cache la barre de vie des adversaires sur téléphone.
- **Propriétés** : Exploration est seule propriétaire de l'ouverture/fermeture de `createImmersiveEncounterHostV1`; elle émet à son parent un **signal purement visuel** `gensrpg.exploration.combat.visibility.v1` (`sessionId`, `encounterId`, `visible`). Capture conserve l'autorité exclusive pour masquer puis réafficher son propre HUD. Aucun accès au DOM d'un autre moteur, aucune duplication de PV, aucun état combat ou sauvegarde muté.
- **Cas couverts** : ouverture, annulation du chargement, retour normal après reçu CombatResult, défaite et remontage ; le standalone Tester n'envoie aucun signal de Capture. Tests ajoutés au `tests/immersive-encounter-host.test.js` natif.
- **Gates** : tests locaux/CI, Chromium et contrôle Pages, checkpoint GREEN après CI avant promotion `main`, puis mise à jour du pin immuable Exploration dans la seule source Capture et le publisher GenSRPG. Aucune déclaration « disponible » tant que le SHA final n'est pas prouvé en HTTPS.

---

## 2026-11-09 — Niveaux sauvages configurables par WorldArea (lot candidat)
- **START immutable** : `main@6129365d8e31c8254305d3264bfa1bad8274b956`; checkpoint `checkpoint/exploration-start-worldarea-encounter-levels-2026-11-09` ; lot `work/exploration-worldarea-encounter-levels-2026-11-09`.
- **Propriétaire** : World Builder crée `WorldArea.encounters.minLevel/maxLevel` optionnels, 1–9999, sur la zone sélectionnée. `normalizeWorldArea` conserve les documents anciens sans inventer des limites, refuse seulement un couple partiel/invalide. `Encounter Controller` garde son déclenchement par terrain et ses probabilités existantes ; après rencontre confirmée, il tire uniformément un entier min..max. Une plage 1–5 distribue donc 20 % par niveau **parmi les rencontres déclenchées**, indépendamment de leur taux de déclenchement.
- **Raccord officiel** : champ optionnel `opponents[0].level` du `CaptureEncounterSnapshot v1`, conservé par `combat-handoff-store`, consommé en jeu par l'adaptateur natif `integration/combat-bridge/exploration-native-source-v1.js`. Les statistiques sont encore calculées uniquement par `buildCaptureEncounterCombatSourceV1` du moteur Combat; aucun moteur de stats, catalogue, sauvegarde ou taux supplémentaire créé.
- **Portée** : WorldArea sélectionnée, UI inspecteur World Assembler, commande existante du draft, lecteur Encounter, contrat et bridge existants. Aucun changement des sorts, XP, KO ou du code source Combat main. Les presets/monde existants gardent leur comportement tant que la plage n'a pas été enregistrée.
- **Gate** : test `tests/worldarea-encounter-levels-20261109.test.js`, `npm test`, `npm run check`, jeux anciens, vrai navigateur/WorldBuilder puis publication principale et preuve Pages exacte. CI strictement requise avant fusion, checkpoint GREEN et publication de la révision Explorer dans GenSRPG séparée. Risque résiduel : raccorder le SHA Explorer publié au publisher GenSRPG via son unique pin après CI, pas de double copie ni d'import de branche candidate.
- **Chantier distinct** : Sac/Équipe qui disparaît après combat ; candidate PR Explorer #396 non fusionnée, à réconcilier avec `main` et à tester sur mobile. Les deux correctifs ne se mélangent pas dans ce lot.

---

## 2026-11-08 — Embedded Capture fullscreen owner : préserver Sac/Équipe (candidat)
- **START :** main Explorer `bb358ee38410f9590d5f80fa116e0286c23f6216`; checkpoint `checkpoint/exploration-start-capture-fullscreen-owner-2026-11-08`; branche `work/exploration-capture-fullscreen-owner-2026-11-08`. Pas de nouvelle autorité ni de modification au main public avant CI.
- **Reproduction :** Capture Jeu charge Explorer en iframe ; le plein écran natif demandé depuis l'enfant masque l'HUD parent (Sac/Équipe). **Propriétaire :** Capture doit posséder le fullscreen parent ; Explorer conserve son unique renderer/caméra, n'affiche pas le bouton fullscreen éditeur et refuse de prendre le fullscreen natif en mode Aventure intégré. Tester autonome et outils Exploration restent inchangés.
- **Contrôles :** test du garde, CI Exploration, revue paysage Android iframe (Sac cliquable au-dessus, retour titre, refus permission), CI site assemblé GenSRPG. Couplage avec le candidat Capture PR #344 ; aucune publication isolée de l'un sans validation de l'autre.
- **Performance :** deux fortes saccades signalées sur carte ; diagnostic séparé de cette livraison (profil métriques rendu/calcul, transition, re-raster terrain, sauvegarde et décors), sans modifier aveuglément la boucle de jeu.

---

## 2026-11-08 — Jouer natif : micro-freezes, écrans de transitions et warmup équipe sauvée (C3 / candidat)
- **START main certifié :** `d30465b9653a1ad90730af0caae4ace21d16a23c`, checkpoint `checkpoint/exploration-start-play-transitions-stutter-2026-11-08`, branche `work/exploration-play-transitions-stutter-2026-11-08`. Seule autorité graphique et navigation : Exploration main ; source Capture `8f7bc6b` et publisher GenSRPG `8156b54` inchangés avant les gates.
- **Régression observée dans le code :** `navHeight` re-projetait toutes les pentes `sculptTerrainRampProjections(terrain)` à chaque échantillonnage du déplacement sur escalier malgré le cache natif `resolvedSculptTerrainRamps`, désormais réutilisé. En Jouer Aventure, le warmup Combat lisait encore `party.preview.v1.json` (héros Tester au lieu de l'instance sauvegardée) ; il précharge désormais le combatant actif canonique, dont l'identité vient du grant AdventureSession GenSRPG, et une seule fois par paire combattant/adversaire.
- **Transitions :** voile GenSRPG avant le premier rendu réel de `sculpt-lab.html?play=1`, non visible dans l'éditeur standalone ; signal de première frame via `postMessage` exact et scoped. Overlay chargé de la zone déjà existant conserve son propriétaire et reçoit le branding. Combat charge sous voile genSRPG (avec annulation qui ne consomme ni CombatResult ni save), jusqu'à la notification `gensrpg.capture.combat-ready.v1` émise seulement après le montage officiel du renderer Combat. Échecs notifiés, sans timeout magique.
- **Tests :** `tests/exploration-play-loading-party-20261108.test.js`, anciens `capture-combat-warmup-v1`, `immersive-encounter-host`, `sculpt-stairs-dynamic-height-v78`, `npm test`, `npm run check`, browser/SHA, V80 et budget Pages ≤900 Mio. Mesurer les microstutters sur le vrai Pixel reste nécessaire ; pas de promesse FPS avant ce test.
- **Politique :** pas de moteur, screenshot, asset ou bibliothèque dupliqués ; pas d'effet sur Builder, Dungeon, Survie ou SAVES, pas de mutation directe d'une partie par un écran de chargement. Diffusion sur Exploration main après GREEN, puis repin par publisher GenSRPG en lot distinct.

---

## 2026-11-08 — Régression de fluidité 2,5D : prévisualisation du Portal (C1 / EN COURS)
- **Signalement réel :** ralentissements importants de carte Android dans GenSRPG Monster Capture. Aucun chronométrage Pixel disponible dans ce lot : seule une cause CPU répétitive concrète a été repérée et corrigée ; la disparition complète des freezes nécessite un essai Android.
- **START :** Exploration main `bb358ee38410f9590d5f80fa116e0286c23f6216`, checkpoint `checkpoint/exploration-start-capture-map-stutter-2026-11-08`, branche unique `work/exploration-capture-map-stutter-2026-11-08`, dernier main GREEN identique.
- **Cause ciblée :** `updateNavigationInfo` se répète sur chaque déplacement, appelle `updateSculptWorldPortalAction` qui, dès que le héros entre dans un trigger, exécutait `sculptWorldAreaScene(target)` à CHAQUE frame. Cette fonction reparse le terrain complet, normalise tous les objets/acteurs et peut générer une longue interruption sur grande carte. `navigationContext` allouait également de nouvelles rampes à chaque simulation.
- **Correctif propriétaire :** cache UI en lecture seule par identité `WorldDocument` / `WorldArea` pour le statut du bouton ; validation intégrale native **inchangée** lors du vrai passage ; ramps projetées une fois par terrain immuable, recalcul automatique après nouveau terrain. Aucune règle gameplay, image, sauvegarde ou boucle de navigation modifiée.
- **Tests :** `tests/sculpt-play-portal-readiness-perf-20261108.test.js` démontre 120 frames → une validation, erreur invalidante conservée, invalidation sur nouveau monde et vérification explicite du chemin canonique à la traversée. Exécuter `npm test`, `npm run check`, CI + smoke Chromium ciblé, publication main + SHA public exact ; refaire test Android réel avec cartes dont plusieurs Portals, même vitesse/zoom/décors.
- **Invariants :** LE reste propriétaire du rendu, du WorldDocument et des Portals ; Combat + GenSRPG + Builder V80 + PWA + Survie/Dungeon intacts ; pas de seconde autorité, pas de bibliothèques dupliquées et budget Pages 900 Mio.
- **État :** candidat, pas de GREEN ni de publication présumée. Prochaine étape : gates réels, checkpoint GREEN, PR main, Pages certifié puis repin via GenSRPG si nécessaire.

---

## 2026-11-08 — Optimisation transition Portal/Jouer Capture Android (C1/C2, validation en cours)
- **Retour utilisateur :** deux gros ralentissements de carte observés après intégration Monster Capture ; aucun chronométrage réel Pixel 10a disponible dans la CI. Un coût superflu est néanmoins vérifié dans le propriétaire Exploration : `traverseSculptWorldPortal` appelait jusqu'à trois fois `sculptWorldAreaScene` pour la même zone de destination à chaque transition, avant/après le montage. Chaque projection reconstruit la scène 2.5D, coûteuse sur smartphone.
- **START :** Exploration main `bb358ee38410f9590d5f80fa116e0286c23f6216`, checkpoint `checkpoint/exploration-start-capture-map-stutter-2026-11-08`, branche `work/exploration-capture-map-stutter-2026-11-08`. Dernier main GREEN connu : CI `42506481003`, Pages `42506477244`.
- **Correction localisée :** première projection de destination validée AVANT quitter la zone, réutilisée en Jeu si le WorldArea visé est inchangé ; l'éditeur ou une réparation recalculent la scène si le document a changé. `mountWorldSculptArea` accepte une projection déjà validée sans changer le renderer. Aucun moteur, matériel, formule, collision, save, Spawn, HUD, texture ni boucle d'animation n'est dupliqué.
- **Test :** `tests/sculpt-play-portal-projection-once-20261108.test.js`, `npm test` et `npm run check`, smoke navigable Portal/Spawn et régressions V80/Forêt/Plaine/Neige, CI+Pages exactes. Une optimisation démontrée de transitions n'est pas une preuve que les deux saccades signalées ont disparu : un test Android réel reste nécessaire.
- **Prochaine étape :** vérification CI puis mise à jour du seul `main` Exploration, nouveau pin immuable GenSRPG dans un publisher unique après certification, et test Android de la même carte.

---

## 2026-11-08 — Transport Jouer des 1–6 créatures vers la réserve Combat (owner Exploration)
- **Base START :** `main@6915526c5ea2f96265bbd4cfbe6bd081ebea0ec2`, checkpoint `checkpoint/exploration-start-capture-wild-reserve-2026-11-08`, branche `work/exploration-capture-wild-reserve-2026-11-08`.
- **Périmètre :** `adventure-playing-party-v1.js` lit le grant transitoire signé de la vraie AdventureSession, accepte le champ facultatif `reserve` (0–5), valide identité, ordre, PV, stat allocations et Bestiaire officiel. Le pont `exploration-native-source-v1.js` transmet directement `localReserve` au seul `buildCaptureEncounterCombatSourceV1` propriétaire ; le pont retour associe les PV du seul `RosterSession` aux IDs sauvegardés et produit un `CaptureCombatResult` v1 enrichi facultativement.
- **Frontières :** Explorer ne sauvegarde ni HP ni XP, ne crée aucun combattant, ne détermine aucune victoire, ne maintient aucune équipe concurrente. Les événements scénarisés / cap d'actifs feront l'objet d'une configuration versionnée ultérieure, sans changer la rencontre sauvage existante (1 actif + banc).
- **Tests :** `tests/adventure-native-reserve-20261108.test.js` vérifie 1–6, doublons d'instances refusés, KO, invalides rejetés sans réécriture, transit natif. Exploration CI `42504934607` GREEN avant documentation ; gate final nouveau commit puis Pages `main` + preuve HTTPS/Android/PWA avant repin GenSRPG.

---

## 2026-11-08 — B1 transport figé : correctif d'assemblage
- **CI PR #393 réellement bloquée** dans le smoke de la preview PR318 : le Combat embarqué restait sur « Chargement du moteur Combat officiel… ». Diagnostic : le fichier de pont importait un module nouveau situé dans `src/encounters/`, alors que les previews historiques ne transportaient que quatre fichiers de bridge. L'ancien browser smoke n'avait donc pas toutes les dépendances.
- **Correction de cause racine** : déplacer l'unique fonction `officialAdventureCombatRequestV1` vers `integration/combat-bridge/exploration-native-source-v1.js`, déjà transporté par tous les scripts de packaging (sans ajout de fichier ou copie lourde). Le fichier supplémentaire non utilisé est supprimé. Smoke exécute la véritable fonction sur le pont livré, assure URL unique et `no-store` scoped ; vieux Tester inchangé.
- **Gates conservés** : PR #393 CI complète, Chromium PR318 historique obligatoire, publication main et HTTPS ; SHA Combat strict, pas de fallback, ni changement de sauvegardes.

---

## 2026-11-08 — Correctif B1 : ancien bundle Combat dans l'iframe (incident réel)
- **Reproduction utilisateur** : après Bestiaire OK puis Exploration OK, l'iframe du combat affiche « Combat indisponible : Adventure publication does not match official Combat author/engine sha ». La dernière chaîne n'appliquait pas l'isolation de cache : `integration/combat-bridge/exploration-encounter.js` utilisait toujours `fetch(url)` pour ses JSON.
- **Cause** : ancien worker PWA Android peut servir le bundle d'un ancien Combat SHA au moment où Combat revalide la même autorisation Adventure. Le contrôle est correct et demeure obligatoire.
- **Correction Exploration propriétaire** : un UUID éphémère de lancement pour toutes les ressources du vrai Combat scoped, URLs uniques + `cache:'no-store'`; aucune source alternative, aucun assouplissement de SHA, aucun changement au Combat main ; Tester reste inchangé.
- **START** main@`f743ae9d0df5e1aa2c24ed009a551435e5cc8e04`, checkpoint `checkpoint/exploration-start-adventure-combat-version-2026-11-08`, lot `work/exploration-adventure-combat-version-2026-11-08`. CI Node et réel Chromium, publication Pages exacte, puis repin Capture GenSRPG main et preuve HTTPS obligatoires.
- **Partie/équipe** : pas de reset ; AdventureSession détient ses 1–6 créatures ; seule la créature active du combat est envoyée au moteur 1v1. Vérifier le menu Équipe en jeu et le passage carte→combat→carte.

---

## 2026-11-08 — Caméra de départ Aventure, sans seconde autorité
- **Demande** : cadrage plus près du sol + plus zoomé avant démarrer ; réglage explicite, zoom toujours libre en jeu.
- **Exploration propriétaire** : interpréter le paramètre scoped `cameraZoom=100..240` par pas de 5 (ancien lien sans valeur conserve le 175 % natif), l'appliquer **à la réglette existante** au chargement avant le rendu. L'angle `cameraAngle` natif 35–90° reste indépendant ; 45° est plus oblique, plus proche du sol que 55°.
- **START** main@`f743ae9d0df5e1aa2c24ed009a551435e5cc8e04`, checkpoint `checkpoint/exploration-start-adventure-camera-2026-11-08`, lot `work/exploration-adventure-camera-2026-11-08`.
- **Gates** : CI Node + Chromium, publisher unique / HTTPS SHA. Le consentement et la configuration avant la partie restent dans Capture (raccord séparé) ; aucun nouveau moteur caméra, aucune altération du WorldDocument ou des sauvegardes.

---

## 2026-11-08 — Android C2, écran « Partie indisponible » SHA Combat (8 novembre)
- **Symptôme prouvé :** après la réparation du Bestiaire, Exploration affiche « Adventure publication does not match official Combat author/engine sha » lors de l’entrée en monde.
- **Cause :** le loader propriétaire `loadCaptureAuthorEncounterBundleV1` demande encore le JSON de Combat par URL historique `force-cache`. Une PWA installée peut fournir des anciens octets, alors que Capture a désormais son manifeste Combat frais.
- **Correctif propriétaire :** Exploration uniquement, lecture `no-store` avec URL unique UUID pour une vraie session scoped `play=1&adventureSession`, sans changer les données et la comparaison SHA. Tester et éditeur conservent leur charge originale.
- **START** `main@7a4f4b3e198e6fe3b5707c4b5b6dfed5d17007b9`, checkpoint `checkpoint/exploration-start-capture-grant-cache-2026-11-08`, branche unique `work/exploration-capture-grant-cache-2026-11-08`.
- **Validation :** tests de cache historique, CI Exploration, Chromium de l’artefact assemblé, Pages/HTTPS ; raccorder ensuite Capture source puis GenSRPG publisher sur SHA exact sans second moteur.
- **Protections :** sauvegardes, positions, WorldDocument, créatures et Combat main intacts ; V80 figée, site sous 900 Mio, aucune copie d’assets.

---

## 2026-11-08 — Publisher Exploration : vrai Combat smoke déterministe (C2)
- Départ protégé `main@0c52b5602d157e89d437d9a933da78a6bdb6aee1` ; checkpoint `checkpoint/exploration-start-combat-smoke-choice-2026-11-08`, travail `work/exploration-combat-smoke-choice-2026-11-08`.
- Incident : Pages main run `42460042393` rouge au test `scripts/smoke-builder-encounter-validation.mjs` malgré 1 050 tests Node verts, car le driver cliquant la première capacité disponible consommait parfois l'énergie sur une défense/auto-buff au lieu d'assurer une séquence offensive ; à 108 secondes le Combat réel n'avait pas encore résolu le KO (38/100 PV).
- Correctif exclusivement côté smoke : consulter les dégâts des vraies capacités du même bundle Combat main certifié, cliquer seulement une attaque réellement activable, par priorité de dégâts ; Combat garde sa simulation et la décision KO. Aucun faux résultat, aucun timeout/retry supplémentaire, aucun changement moteur/HP/skills/WorldDocument/asset/sauvegarde.
- Gates : CI du SHA exact, vrai Combat intégré avec retour KO dans Chromium, publication du seul `main` sur GitHub Pages, provenance HTTPS, V80 figée et budget 900 Mio ; si encore rouge, investiguer sans contourner.
---
## 2026-11-08 — En cours : transition de zones et vitesse Jouer (Monster Capture)
- START `main@58bb25863d2b3f981436426a3183f7ca5297de84`, checkpoint `checkpoint/exploration-start-play-transition-speed-2026-11-08`, branche `work/exploration-play-transition-speed-2026-11-08` ; `main` public conservé jusqu'à tests et gate.
- Vitesse native : Aventure délègue le réglage 90–360 par palier de 10 ; 90 par défaut pour les nouvelles parties sans réglage, éditeur Tester inchangé. Exploration conserve `stepMovement`, collision, cadence et joystick.
- Portal/Spawn : en mode Jouer uniquement, afficher un vrai voile « Chargement de la zone… » avant le montage de la scène, attendre une frame visible, garder le voile jusqu'au premier rendu officiel ; ne jamais créer de fausse carte, déplacer les spawns ou modifier les sauvegardes WorldDocument.
- Menu : la sortie du mode Jouer valide le checkpoint de navigation puis notifie le parent officiel GenSrpG en same-origin ; le consommateur seul retourne au titre. Projection d'équipe relue sans deuxième sauvegarde et uniquement hors combat.
- Préserver V80, les assets source, les mondes, les sauvegardes et les URL, sans duplications. Valider npm test/check, smoke Chromium Portal+Spawn/paysage et CI de main avant tout nouveau pin dans GenSrpG.
- Statut : code candidat non certifié, attente de tests et publication.
---

## 2026-11-08 — Aventure : mondes « Test 1 » autorisés et PV d'entrée bornés au maximum Combat
- START : Exploration main certifié `d9f90f5bf48b8c42699f0db2f2f797f1ebf17fa1`, checkpoint `checkpoint/exploration-start-world-spaced-id-2026-11-08`, branche `work/exploration-world-spaced-id-2026-11-08`.
- Retour Android : écran de préparation affichant le WorldDocument « Test 1 » et `Invalid WorldDocument identity for Adventure hero selection`. Cause : le propriétaire bibliothèque WorldDocument autorise espaces/accents dans ses IDs, mais 3 lecteurs de grants Aventure/Exploration avaient une expression régulière limitée aux slugs ASCII. Uniquement l'identité **WorldDocument** est alignée sur une unique validation exportée par Exploration ; IDs session, héros, créatures et SHA restent stricts. Aucune réécriture de monde ou sauvegarde.
- PV historique : pour une partie réglée à 25 %, un HP ancien de 46 peut excéder le maximum Combat officiel 35. `projectAdventureInitialCombatHpV1` borne les HP transitoires lors de l'entrée en combat à `fighter.maxHp` (calculé par Combat), conserve le 0 KO et ne modifie pas le stockage Core.
- TDD `tests/adventure-world-spaced-id-20261108.test.js` : Test 1/Forêt 1 entre Hero, Bestiaire et Party, refus de mauvais monde, sauvegarde non modifiée, PV 46/35 et KO ; `npm test` sous CI + navigateurs. Aucun moteur, Renderer ni nouveau WorldDocument.
- Publication/consommation GenSRPG : seulement après la CI source/Pages exacte GREEN et pin Exploration certifié.

---

## 2026-11-07 — Caméra Aventure réglée par le créateur (PR #388)
- **Base publiée / START** : Exploration main@c18b34cacf6d9d157d62e7e507c4c155d6e1b11c, checkpoint/exploration-start-creator-game-camera-angle-2026-11-07, branche work/exploration-creator-game-camera-angle-2026-11-07.
- **Propriétaire** : seule la caméra 2.5D du Labo Exploration utilise l’angle transmis par l’aventure GenSRPG via `?play=1&adventureSession=...&cameraAngle=...`, jamais un second renderer. Validation fondée sur `SCULPT_GAME_CAMERA_ANGLE` officiel (35..90°, pas 5).
- **Effet** : uniquement en mode Jouer avec session active, angle verrouillé dans le HUD même après entrée/sortie d’intérieur, zoom 100–240 % restant au joueur. Tester et World Builder inchangés.
- **TDD** : test RED initial `tests/exploration-creator-camera-policy-v1.test.js`, helper propriétaire `src/play/exploration-creator-camera-v1.js`. Validation npm test/check, vraie page Chromium PC/mobile, CI de ce SHA, Pages officielle et checkpoint GREEN requis avant que GenSRPG consomme ce main.
- **Interdits** : toucher WorldDocument, gameplay, collision, sprites, sauvegardes, PWA, V80 ou autres propriétaires.

---

## 2026-11-07 — Spawns du Builder et traversée native Jouer (lot LE propriétaire)

- **BASE LE main** : `66ec19c6da9124a936702d96915d6c89b6b4d31c` ; START `checkpoint/exploration-start-play-portal-spawn-panel-2026-11-07` ; branche `work/exploration-play-portal-spawn-panel-2026-11-07`.
- **Retours** : trois Spawns visibles dans le WorldDocument mais seulement deux contrôlables en 2,5D ; suspicion de passages liés non traversables dans Monster Capture alors que Tester fonctionne.
- **Cause du décalage d'affichage** : `refreshSculptWorldPanel()` excluait les Spawns ancrés à une porte car ils n'avaient pas de X/Y bruts. Le contrôle affiche maintenant TOUS les Spawns, y compris les ancrés en lecture seule, et la vraie position résolue par `resolveWorldAreaSpawnPoint` du propriétaire WorldArea, avec guidance vers bâtiment/porte. Aucun déverrouillage de pose libre d'un Spawn ancré.
- **Preuve parcours** : test du contrat officiel Portal et du checkpoint persistant de session, et nouveau vrai Chromium paysage `scripts/smoke-world-portal-scoped-play.mjs` lançant `sculpt-lab.html?play=1&adventureSession`, traversant un Portal aller-retour par le **bouton réel**, vérifiant `WorldDocument` et la sauvegarde `createExplorationPlayProgressWriter`. Pas de second téléporteur ou logique GenSRPG.
- **Invariants** : uniquement propriétaire LE ; pas de modification Combat, GenSRPG, mode Dungeon/Survie, assets ou publication de copies ; pas de transition silencieuse entre WorldDocuments différents. Gate `npm test`, `npm run check`, 3 jobs CI, vrai navigateur, test Pixel avant GREEN, puis publication officielle et promotion GenSRPG seulement sur LE main certifié.
- **Statut** : CI exacte à suivre, aucun GREEN annoncé sans résultats.

---

## 2026-11-07 — World Builder : activation explicite des rencontres sur cartes vierges (lot indépendant / START)

- **Diagnostic** : une zone vierge peut autoriser des rencontres aléatoires avec probabilités de familles/éléments à 0 %, et donc n'émettre aucun monstre ; ne jamais inventer de créatures ni modifier le moteur Combat.
- **Point de départ** : main après la bibliothèque de mondes `4c5490e0bd877c2369bf084959fd36a5d9d9452d`, checkpoint `checkpoint/exploration-start-encounter-setup-main-2026-11-07`, branche `work/exploration-encounter-setup-main-2026-11-07`. Backport strict du lot autoritaire original PR #384 (`a1bb29b6e2f7b751384c72f4459369d40137b37b`) sans code des avatars multijoueurs PR #382.
- **Contrat** : World Builder officiel seul utilise `encounterConfigNeedsExplicitInitialization` et `initializeWorldPresetEncounters`; la probabilité est totalement éditable et l'activation demande un accord explicite. Les configurations personnalisées restent intactes; l'éditeur informe clairement si tout est à 0 %. La bibliothèque de mondes et la sauvegarde historique restent intactes.
- **CI** : tests `tests/exploration-world-encounter-setup-v1.test.js`, `npm test`, navigateur Chromium et gate publication propre sur SHA exact ; pas de fusion ni GREEN avant les succès.
- **Intouchés** : Survie, Dungeon, Duel, Combat, créatures publiées, WorldDocument sérialisé, navigation 2,5D, PWA et V80.

---

## 2026-11-07 — World Builder : bibliothèque officielle de plusieurs mondes (lot de publication indépendant, START)

- **Livraison isolée** : base main `556922f8a2347e95088233ceee2cd56617d77208`, checkpoint `checkpoint/exploration-start-world-library-main-2026-11-07`, branche `work/exploration-world-library-main-2026-11-07`. Backport strict des CINQ fichiers métier/test validés sur Exploration PR #383 (SHA `bca1ac3eb8832c5a13b9b508ecaea6cc5b616c16`). Ne contient PAS les avatars multijoueurs PR #382, non validés sur deux navigateurs.
- **Propriétaire** : World Builder officiel/WorldDocument `serializeWorldBuilderDraft` + `importWorldBuilderDocument`; les parties Capture et les autres modules ne possèdent ni ne recopient cette archive. Brouillon historique `gensrpg.world-assembler.document.v1` préservé sans suppression. Deux mondes sauvegardés restent indépendants; activation explicitement confirmée.
- **Garantie** : pas de remplacement caché des cartes, pas de migration destructrice, pas de changement Survie, Dungeon, Combat, cache ou V80. Tests TDD officiels `tests/exploration-world-document-library-v1.test.js`, suite CI Exploration et navigateurs avant GREEN / main. Le lot rencontres C7 reste séparé.
- **Statut** : branche de publication et PR à valider ; pas déclaré GREEN avant SHA exact et CI.

---

## 2026-11-06 — Contrat officiel de notification navigation Jouer (Capture réseau, START)

- **START** : `checkpoint/exploration-start-capture-peer-nav-event-2026-11-06` sur `main@a2db1825f0a1a833fadcd02d7804f887c864a1d2`. Branche isolée `work/exploration-capture-peer-nav-event-2026-11-06` ; main/published Pages restent inchangés.
- **Contrat inter-dépôts** : GenSrpg Monster Capture PR #296 attend un événement versionné au moment où l'Exploration officiel a **déjà validé les collisions / la zone et enregistré son checkpoint**. Source unique du mouvement : `createExplorationPlayProgressWriter`. Aucune seconde position calculée, aucun moteur ou renderer en double, aucune lecture de sauvegarde hors Exploration.
- **Périmètre LE** : petit helper dans `src/play/` et un seul hook dans `persistPlayNavigationCheckpoint` de `src/sculpt-lab-main.js`. Événement local `window` (iframe même origine), exclusivement lorsque `adventureSession` existe ; detail = navigation officiellement enregistrée. Pas de serveur, de compte, de salle, de `postMessage('*')`, de timer, de `Storage.prototype`, de capture des clics ou de nouvelles ressources.
- **TDD** : RED import/helper absent, puis tests emitter success/fail closed, déclenchement après writer, isolation éditeur standalone/V80, CI Exploration. Tester la vraie page/Browser au SHA final avant promotion ; la CI de PR seule ne vaut pas publication GREEN (charte Règle 0).
- **Coordination** : le code GenSrpg ne consomme QUE le futur main Exploration vérifié (pin source `a2db...` actuel immuable). Jamais de référence au work branch Exploration dans l'application livrée ; pas de fusion main non validée, autres chantiers LE (assets, Pages) intacts.

---

## 2026-11-05 — URGENT : publication Pages sans copies redondantes, règle 0

- Base : main@c6432654cb86cb57f75995e3be6460cbb888f286, PR #378 (trois cartes auteur) fusionnée, CI 3/3 et préflight success ; mise en ligne échouée : workflow main #42081258974, deploy Pages timeout pendant syncing_files.
- Preuve : artefact Pages 6 984 337 485 octets ; cinq previews complètes copient Combat main et Capture global-assets cinq fois, sans partage, alors que la source officielle des cartes est sur main.
- Branche : work/exploration-pages-dedupe-charter-2026-11-05. Périmètre : uniquement gouvernance documentaire, packaging et tests de publication. AUCUN changement des assets originaux, des cartes, des sauvegardes, du moteur, de GenSRPG ni de Combat.
- Invariant : V80 de production inchangée ; trois cartes visibles dans le World Builder moderne ; anciens liens d'entrée préservés ou redirigés explicitement ; pas de prétention de préservation des vieux comportements si une preview est redirigée ; contrôle HTTP et preuve SHAs.
- Checkpoint START : `checkpoint/exploration-pages-dedupe-start-2026-11-05` pointe sur main@`c6432654cb86cb57f75995e3be6460cbb888f286` ; branche de travail dédiée, PR #380 DRAFT ; PR de diagnostic #379 indépendante, jamais fusionnée.
- Mesure du paquet initial par GitHub Actions #42104751247 : cinq previews d'environ 1,4 Go ; 84 Mo de Combat et 1,3 Go de Capture par preview, soit environ 6,7 Go de site complet. Cause racine : copies de déploiement redondantes, pas taille du World Builder ou des trois cartes.
- Test du catalogue officiel Capture réussi dans le run #42108895951 : **306 assets référencés, 332 fichiers pour 202 039 135 octets (195 Mio sur disque)**, sans ZIP de travail ni suppression en source ; contrôles des animations Hériplante et du catalogue passés. Le workflow de diagnostic lourd a été retiré de la branche après cette preuve.
- La compression retire quatre anciennes previews complètes **après** leurs tests Chromium, et conserve leurs liens d'entrée sous forme de redirects documentés vers l'éditeur moderne unique. La fonctionnalité historique indépendante à ces anciennes URL n'est pas conservée ; les SHAs archivés restent disponibles dans Git. V80 en racine inchangé.
- Publication encore **NON GREEN** : taille finale de l'artefact, CI exacte, préflight puis déploiement Pages main et provenance HTTPS non encore prouvés ; ne pas annoncer le lien comme livré.

- Tests : taille et structure du payload, détection duplication, tests Chromium avant publication, validation des dépendances runtime, smoke HTTPS sur le SHA exact après GitHub Pages. GREEN interdit avant toutes les preuves ; garder la PR de diagnostic #379 séparée et non fusionnée.
- La taille diagnostiquée sera documentée AVANT/APRÈS et les exclusions seront explicites, non destructrices.

---

## 2026-11-05 — Réconciliation des moulins et éoliennes animés après intégration arènes

- Source approuvée PR #374 `8b2937b995b6034b578619648ff4f99bfaba16eb` ; base actuelle `main@62318b0737c37f0a34a6d6c4da0dc2673d8f1300` incluant 20 arbres et 10 arènes.
- Lot unique `work/exploration-wind-animated-reconcile-after-arenas-2026-11-05` : 6 ZIP source, 72 PNG RGBA et 6 atlas WebP copiés au SHA Git identique ; deux définitions natives et six variantes visuelles, 10 images/s via animateur existant.
- Manifeste courant ENRICHI et non remplacé pour conserver les 10 arènes et maisons enneigées ; les corrections antérieures des arbres ne sont pas modifiées.
- Test utilisateur nécessaire : sélection, vraie rotation animée des deux moulins en 3 vues, import/export et rendu paysage smartphone.
- **NON GREEN** avant CI 3/3, préflight Pages, fusion vers main actuel et publication du SHA exact.

---

## 2026-11-05 — Réconciliation croisée : arbres enneigés + arènes élémentaires

- Base actuelle `main@7ad545f04cdc911b42be9c2490217440f4962e7b` après fusion des arbres et de la restauration de leurs tests. La PR #373 réconcilie ses fichiers par merge commit deux parents.
- Préservation des 20 arbres, de leur test dédié, de leur placement tactile et des 30 vues de maisons enneigées.
- 10 arènes 2,5D `Bâtiments > Arènes élémentaires`, visuels PNG/WebP source et manifest.
- Le smoke Chromium sélectionne explicitement une maison existante puis teste l'arène Glace dans le vrai Canvas, avec un point de placement déjà prouvé et restauration de la scène.
- CI exacte 3/3, préflight Pages et publication exigés avant GREEN, autres modules intacts.

---

## 2026-11-05 — Rétablir la sentinelle test du lot Arbres #372

- Après la fusion #372 sur `main@57360da785d59802678070e66728b020833f8763`, les 20 WebP, 20 définitions et le smoke tactile sont présents, mais la reconstruction de l'arbre Git avait omis le fichier de test RED dédié (suppression constatée avant clôture).
- Correction ciblée : réinstaller **le même** `tests/snow-tree-assets-v1.test.js` de #364, sans toucher à aucun asset ni code runtime, et le checkpoint START original.
- Une nouvelle CI sur ce SHA doit prouver les 20 résolutions dans le catalogue, 20 WebP RGBA dimensionnés/empreintes, préservation des anciens arbres, ainsi que le navigateur.
- Cause racine : mauvais `base_tree` lors de la première réconciliation après le RED. Tous les prochains lots conservent explicitement les tests du parent.
- **NON GREEN** tant que CI et publication du commit ne sont pas confirmées.

---

## 2026-11-05 — Réintégration des 20 arbres enneigés validés

- Base certifiée `main@7155516b51db9892183cc043837037c4c87a0315`, PR source #364 `77b358c2bcf815372b112a1982518535906641a3`, TDD RED `9aa7c6fc8ca746e76a5c85105b219a988958db27`.
- Lot isolé : 20 WebP RGBA réutilisés byte-for-byte, 20 définitions natives, 20 résolutions via l'Asset Adapter officiel, manifeste auteur et sommes SHA-256.
- Catégorie existante `Végétation > Arbres`, sélection/placement tactile et requête du vrai WebP testées par le smoke Chromium intégré.
- La PR historique #364 en conflit n'est pas fusionnée en masse ; aucun ajout à Combat, Jouer, Dungeon ou aux règles gameplay.
- Publication conditionnée aux 3 jobs CI + Pages et au contrôle HTTPS du SHA fusionné (PRÉVALIDATION tant que manquants).

---

## 2026-11-05 — Réconciliation du plafond libre avec le nouveau HP policy main (PR #370)
- **Conflit de base constaté** : pendant la validation de la PR #370, Exploration `main` a intégré la politique Combat HP (PR #369), commit officiel `2b27339a5706fcdb436558aeebd4f8b6b0ce9d85`, CI #41945445069 SUCCESS. L'ancienne PR #370 fondée sur `4e7abd15` est devenue `dirty`, donc **pas de merge direct**.
- **Reprise sûre** : checkpoint `checkpoint/exploration-freecap-rebase-start-2026-11-05` au nouveau main certifié, branche auxiliaire de réconciliation `work/exploration-freecap-rebase-2026-11-05`, puis mise à jour par lease de la branche PR #370. Réappliquer uniquement son test et sa validation de niveau, sur le code qui conserve `combatHpMultiplier` optionnel et tous les contrôles du pont HP. Aucun changement au HP, Combat, Explorer, PWA ou au World Builder.
- **TDD** : cas >100 et entiers invalides déjà RED sur le nouveau main (l'ancien validateur refuse 101/250), tests historiques de grant maintenus et corrigés pour rejeter un entier non sûr. Refuser de qualifier GREEN tant que les trois jobs du nouveau SHA de la PR #370 ne sont pas SUCCESS.
---

## 2026-11-05 — Aventure : PV × 0,25 en partie réelle, Tester inchangé (raccord source officielle)
- Demande auteur : les PV configurés pour le test au niveau 20 rendent le mode Jeu niveau 1 trop long. Nouvelle règle globale de vitrine GenSrpG : 25 % des PV au début d'un combat réel, 100 % en mode Test, sans retoucher chaque créature.
- BASE `main@4e7abd15d7b57909524ba697b74f63a193fce839`; START `checkpoint/exploration-start-adventure-hp-policy-2026-11-05`; WORK `work/exploration-adventure-hp-policy-2026-11-05`.
- Le seul contrat existant `adventure-playing-party-v1.js` accepte un **champ additionnel facultatif** `combatHpMultiplier`, borné (0,1], et restitue 1 pour les enveloppes historiques. Ne change ni `active.hp` ni `active.level`, l'autorisation Bestiaire, la corrélation des parties, ni le modèle de sauvegarde GenSrpG.
- Le pont d'intégration `integration/combat-bridge/exploration-native-source-v1.js` transmet `hpMultiplier:adventureParty.combatHpMultiplier` au builder natif **Labo Combat main**, qui est seul propriétaire du calcul. La route Tester ne transmet rien et garde la prévisualisation niveau 20. Aucune copie de moteur, pas de nouveau registre PV.
- TDD RED dans `tests/adventure-hp-policy-v1.test.js`, sentinelle historique `tests/adventure-playing-party-v1.test.js` actualisée pour ancien contrat. CI officielle, checkpoint GREEN et fusion main uniquement après avoir vérifié le builder ajouté au **Combat main** sous PR #249 GREEN ; publication/HTML en lot indépendant GenSrpG.

---

## 2026-11-04 — Jouer relit les PV exacts du Combat officiel

- START `checkpoint/exploration-start-adventure-exact-combat-hp-2026-11-04` sur `main@725eef49ab18e4f051b24fd2e4a5ded703e5529a` (#366, CI #41894554158, Pages #41894554147). Branche `work/exploration-adventure-exact-combat-hp-2026-11-04`.
- Le vrai duel Chromium Lumilo/Noctigriffe a produit des PV décimaux. Le propriétaire GenSRPG doit conserver leur valeur exacte et le lecteur Jouer doit accepter la projection correspondante. Combat main admet déjà des PV initiaux finis strictement positifs jusqu’au maximum du combattant.
- TDD lecteur officiel sur une fraction, maintien des données historiques et du rejet de PV invalides. Ni arrondi, ni changement du Tester, de l’acquittement, de la sauvegarde Core ou du journal. Certifier Exploration avant le nouveau pin GenSRPG.
- La révision main `5165ea46` apporte les maisons enneigées de #367. Les deux lots sont conservés et la CI contrôle leur combinaison avant fusion.

# Lot assets 04/11/2026 — 10 maisons enneigées, 30 vues 2,5D (EN COURS, NON GREEN)

- **Validation auteur :** le concept des dix maisons et leurs vues front/side/back a été approuvé ; archive déposée sur main `GENSRPG_LaboExploration_Maisons_Enneigees_10x3.zip` (8 911 652 octets). Aucun changement dans les dépôts Combat ou GenSRPG.
- **Base immuable :** Exploration `main@f8b6cf7564e9a24721292310c56f104064d3860a`, branche `work/exploration-snow-houses-10x3-assets-2026-11-04` ; tests TDD RED `tests/snow-house-assets-v1.test.js` créés avant extraction.
- **Autorité unique :** 10 nouveaux WorldObject `building`, chacun à trois variantes visuelles dans `src/objects/object-definition-catalog.js`, avec `library: buildings/houses/snow`, et 30 résolutions dans `src/assets/world-object-asset-adapter.js`. Rien dans la sauvegarde ni dans la logique de navigation. Empreintes/collisions via `footprint` existant, porte ancrée selon contrat du World Builder ; aucun intérieur fabriqué.
- **Import :** extraction ponctuelle **dans la branche uniquement**, copie exacte des 30 WebP 384×384 transparents depuis le ZIP, test SHA256/Riff/alpha/dimensions ; sauvegarde du manifeste sous `assets/exploration/objects/buildings/manifest.snow-houses.v1.json` sans toucher au manifeste des maisons tempérées. Supprimer workflow d'import à la fin.
- **Critères :** aucune perte d'ancienne maison, 10 × 3 vues à l'édition, Scene export/import stable, collisions/portes sous autorité ObjectDefinition, tests Node et vraie Chromium 2,5D, CI d'un SHA exact, publication Pages de ce SHA seulement après review/fusion. Ne pas annoncer GREEN sans preuve.
- **Concurrence :** ne pas annuler la CI/Pages de `main` ni les PRs d'autres lots. Les exécutions `main` 41893909409 (CI) et 41893909266 (Pages) étaient in_progress au démarrage ; diagnostic isolé.


---

## 2026-11-04 — Duel sauvage natif avec l’instance Aventure

- START `checkpoint/exploration-adventure-native-duel-start-2026-11-04` sur main `12759a802f57b83127aef46884763ef53e13b481`, arbre identique à #365 CI 3/3 et prévalidation Pages. Branche `work/exploration-adventure-native-duel-2026-11-04`. Combat officiel `46b4efede522f3410778271fddec872a36f1c54b`, arbre certifié #241 CI 5/5.
- Périmètre : l’entrée Combat d’Exploration reconnaît une vraie AdventureSession, lit les permissions et le combattant de GenSRPG, utilise le nouveau port Combat officiel 1v1, transmet les PV et journalise son résultat natif. Le Tester autonome conserve son équipe et ses niveaux de prévisualisation. Aucun calcul de récompense ou de règle Combat ajouté.
- TDD : source officielle en cas d’espèce miroir, niveau de départ, projection des capacités du niveau réel, refus de l’équipe Tester, PV et issue via Combat natif. L’activation sur la carte appartient au même raccord : port de reçu GenSRPG versionné, verrou de partie, retour à la position persistée et reprise d’un journal non acquitté.
- Prévalidation Pages : [PR318 sur l’artefact assemblé](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41883538491/job/126761936339) arrêtée au démarrage du Tester. Sa source gelée `0dc90b97` ne contient pas les lecteurs équipe/Bestiaire Aventure. RED sur les imports statiques ; chargement des lecteurs uniquement lors d’un duel rattaché à une partie. Les sources gelées, leurs routes, leurs médias et le port Aventure restent sous leurs propriétaires.


## 2026-11-04 — Jouer : journal durable de CombatResult par AdventureSession

- START `checkpoint/exploration-adventure-combat-journal-start-2026-11-04` sur main `0f9d9ffc18396f911e5460b439786949185905d4` (intégration #363, même arbre que sa CI 3/3 SUCCESS et prévalidation Pages). Branche `work/exploration-adventure-combat-journal-2026-11-04`.
- Cause : `sessionStorage` disparaît à la fermeture de l’onglet. Le journal existant doit utiliser le stockage durable avec une clé par partie pour Jouer. L’enveloppe, le propriétaire du retour à la carte et le mécanisme d’acquittement restent uniques. La preuve Core devient obligatoire au point de consommation, y compris hors iframe. Le Tester conserve son journal de session historique.
- Périmètre : journal/transport de l’identité entre Sculpt et l’iframe Combat. TDD sur fermeture/reprise du contexte, isolation par partie, mauvais partyRef, lecture/écriture et acquittement avec preuve Core. Pas d’activation des combats, de règle XP/loot ni de sauvegarde dupliquée. Le rétablissement du parcours et l’appel au Core sont les suites dépendantes.

## 2026-11-04 — Réintégration des prérequis Jouer sur la base Exploration courante

- Base immuable `a890625b059a15465de4b8c6721fa7723e41bedf`, checkpoint START `checkpoint/exploration-adventure-prerequisites-start-2026-11-04`, branche `work/exploration-adventure-prerequisites-2026-11-04`. Les dépôts ZIP déjà intégrés à main restent intacts.
- Périmètre unique : réintégrer les propriétaires Exploration déjà testés pour préparer le vrai Jouer GenSRPG. Sources : lecteur d'équipe #354, héros #355–#358, nouvelle carte #360, préservation et acquittement #361–#362. #358 corrige le scénario Chromium RED de #357. Les branches et historiques restent traçables via les parents. Les conflits de réunion concernent uniquement les notes de suivi et les entrées des différents lots sont conservées.
- Validation de la combinaison : suite Node, syntaxe, Chromium héros et Combat/Exploration, prévalidation Pages et CI au SHA exact. Le vrai déclenchement et le raccord au Core GenSRPG restent un lot séparé. Le Tester, les archives utilisateur, Combat main et la sauvegarde Core sont protégés.

# Lot 04/11/2026 — lecture du vrai combattant d'Aventure (TESTS NATIVE GREEN, LECTEUR SEUL, NON ENCORE RACCORDÉ AU COMBAT)

- **Source** : Labo Exploration `main@a5c02440d7b5b5e0c136b3161036c50ffe15be6f`, START `checkpoint/exploration-adventure-active-party-reader-start-2026-11-04`, branche `work/exploration-adventure-active-party-reader-2026-11-04`. Les PR #350/#351 sur main demeurent immuables, V80 et Tester gelés.
- **Fait authentifié** : l'entrée Combat intégrée `integration/combat-bridge/exploration-encounter.js` charge encore `party.preview.v1.json` et `previewLevel:20`. Le vrai Jouer GenSRPG a un autre `partyRef` et des instances `instanceId/speciesId/level/hp`; utiliser l'équipe du Tester attribuerait un faux résultat et de fausses récompenses.
- **Propriétaires** : GenSRPG Aventure écrit seul une projection temporaire de sa vraie `AdventureSession` via `sessionStorage` sur la même origine, format `gensrpg.capture.v2.active-party.v1:<sessionId>` et contrat `{schema,version,sessionId,worldId,combatSha,partyRef,active:{instanceId,speciesId,level,hp}}`. Exploration est seulement lecteur/validateur du contrat public, conserve EncounterController et le WorldDocument ; Combat main reste le seul propriétaire des statistiques, niveaux d'instances et résultat Combat. Aucune lecture de la sauvegarde GenSRPG par le Labo.
- **Frontière** : `partyRef === 'adventure-party:'+sessionId`, session/world/Combat SHA cohérents avec la whitelist Bestiaire déjà validée, espèce publiée autorisée, instance et niveau valides, HP optionnels `null|entier >=0`; rejet des champs additionnels, données périmées ou corrompues sans effacer l'écrit ni replier vers la fiche démo. Pas de création de joueur fictif si la permission est absente.
- **TDD RED→GREEN** : test pur du lecteur de transport, incohérences session/World/Combat, fake species/unpublished, partyRef fixe du Tester, doublons/identifiants douteux, corruption conservée ; compatibilité avec vrai lecteur Bestiaire. Test publication/CI native Node/HTTPS et vrai Chromium de garde. **Ce lot ne retire PAS le verrou `sculptPlayActive`** ni ne lance le Combat, car celui-ci ne consomme toujours pas les niveaux des instances.
- **Hors périmètre** : GenSRPG UI/règles, Labo Combat, récompenses, écrans héro, WorldDocument, caméra, équipes de Tester, remise à zéro de sauvegarde, PWA et tout contenu créé à la main.
- **Premières preuves** : tests d'identité/monde/Combat SHA/species dans `tests/adventure-playing-party-v1.test.js`; le commit test seul `589e42709e65f311789db5cb39c7dd8b78781359` précède l'implémentation (TDD RED). Lecture pure `src/encounters/adventure-playing-party-v1.js` au SHA `cd1c8dc230bf7161d931a5affdda0e30515aeca8`, [Exploration CI #41815471016](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41815471016) **SUCCESS sur 3 jobs** (moteur, combat et vrai Chromium HTTPS), [preflight Pages #41815470858](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41815470858) en attente de clôture lors de ce jalon. Sans branchement au moteur Jouer, la vraie partie conserve son verrou : **aucune victoire simulée ni récompense attribuée**.

---

# 04/11/2026 — Héros Jouer : vraie carte sculptable dans le test navigateur (CI À RECERTIFIER)

- **Problème prouvé** : CI Explorer [#41848268552](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41848268552) sur PR #357 : core-tests SUCCESS, native-https-pixels SUCCESS, modern-combat-encounter FAILURE dans `scripts/smoke-hero-play-browser.mjs`. La suite créait explicitement `2400×1600` WorldArea alors que `sculptWorldAreaScene` n'accepte que des dimensions exactes multiples de `28×21`, dans `8..80×8..64` cases. La sauvegarde était refusée *avant* l'import HeroDefinition : aucune preuve de bug moteur Héros.
- **Isolation** : base PR #357 `df913e74eba3457e0d531e43d3b5ed6688c2accc` (non GREEN), checkpoint START `checkpoint/exploration-hero-play-valid-world-start-2026-11-04`, branche `work/exploration-hero-play-valid-world-2026-11-04`. Dernier état de repli pour l'éditeur Héros : PR #356 (core CI SUCCESS). Aucun changement de `main` ni V80.
- **Correction limitée au vrai test navigateur** : carte neuve créée depuis le véritable `createBlankWorldBuilderDraft` avec la conversion canonique `worldAreaSizeFromTiles(36×24)`, comme le World Assembler ; mêmes APIs de Spawn, Play checkpoint, IndexedDB Hero, sélection de session, renderer 2.5D, recharge et erreur visible si héros supprimé. Pas de terrain simulé/adapter alternatif.
- **Protection explicite conservée** : le même test construit aussi une carte auteur non supportée `2400×1600` et exige le refus du Play checkpoint **sans création de sauvegarde** ni réduction silencieuse des dimensions. L'ancien modèle WorldBuilder/document auteur reste intact : le mode Jouer n'a pas le droit de tronquer des cartes existantes. Compatibilité des anciennes cartes grandes = sujet distinct dans #235, pas un correctif graphique du héros.
- **Preuves attendues** : tests Node complets, Chromium mobile `modern-combat-encounter`, navigateur Hero Editor `native-https-pixels`, non-régression World Builder et comparaison avec la branche #357. Pas de promotion sans CI sur SHA exact ni validation physique du visuel.

---

# 04/11/2026 — HeroDefinition officielle dans le Jouer 2.5D (LOT EMPILÉ, NON GREEN)

- **Demande** : un créateur GenSRPG doit pouvoir choisir un héros parmi ses définitions Explorateur (image fixe à mouvement simulé OU frames de marche/repos) ; la carte doit rendre CE héros sans toucher au mouvement/collision/caméra. Aucun héros n'est un combattant Capture par défaut.
- **Base et protection** : Exploration `work/exploration-hero-authoring-2026-11-04@cef548c7af5286193c4f42d9f94e78e95efa263a` (PR #356), checkpoint START `checkpoint/exploration-hero-play-handoff-start-2026-11-04`, work `work/exploration-hero-play-handoff-2026-11-04`. PR empilée sur #356, elle-même sur #355, aucune modification du main/V80. L'écran authoring et ses tests navigateur restent protégés.
- **Frontière unique** : GenSRPG Aventure (futur consommateur) possède la sélection `heroDefinitionId` dans sa session et délivre un grant de session éphémère strict `gensrpg.capture.v2.hero-selection.v1:<sessionId>` ; Exploration **lit et valide** {schema,version,sessionId,worldId,heroDefinitionId} sur même origine, ouvre sa véritable `UserHeroStore` IndexedDB et rend avec le même MapActorRenderer/Preparer existant. Pas de lecture du stockage GenSRPG depuis Exploration ; aucune définition copiée, aucun chemin distant de sprite dans une sauvegarde. Retour/refresh/reprise utilisent session et WorldDocument officiels.
- **Refus contrôlés** : sessionId/worldId/données contradictoires, héros supprimé, sprites incomplets, IndexedDB indisponible, media non décodable : **Jouer doit montrer une erreur** sans remplacer silencieusement par le héros demo si un ID a été explicitement demandé. Sans grant (standalone et sauvegardes anciennes), comportement demo inchangé. Tous les fichiers doivent être réellement préparés avant que le visuel sélectionné devienne actif.
- **Périmètre** : nouveau lecteur versionné de grant, un port asynchrone dans `src/sculpt-lab-main.js` qui ne possède que le visuel, lifecycle dispose et tests de la source réelle. Ne pas déclencher les rencontres Jouer, ni envoyer un faux combat, ni inventer une liste de héros. Le choix UI appartient à GenSRPG, hors de ce lot, après main Exploration certifiée.
- **TDD RED→GREEN** : exactitude schema/scope, validateur, absence de fallback, renderer prêt, refresh et identité, non mutation du navActor/caméra/WorldDocument ; tests Node et Chromium réel puis CI. Smartphone paysage requis avant GREEN produit. Base officielle non mutée.

---

# Lot 04/11/2026 — Héros : éditeur natif images et sprites, fichiers locaux IndexedDB (TDD EN COURS)

- Besoin : le créateur importe une image fixe (mouvement visuel automatique MapActorVisual) ou plusieurs frames PNG/WebP de marche/repos. Depuis la restructuration le personnage Jouer utilise encore l'avatar de démonstration ; l'éditeur de visuel appartient aux définitions Héros, pas au World Builder.
- Source : branche et checkpoint démarrent sur 1f00c8473990b59509ce7ee4abd39c772102d752 de la PR Exploration #355. START checkpoint/exploration-hero-authoring-start-2026-11-04 ; work/exploration-hero-authoring-2026-11-04 ; PR empilée sur #355, aucun main ni V80 muté.
- Propriétaire : Actor Definition Editor Exploration enregistre une HeroDefinition v1 et ses blobs dans un IndexedDB propre au domaine; MapActorVisual/Preparer/Renderer existants dessinent le modèle. GenSRPG sauvegardera une référence de héros seule, jamais les blobs ou une copie des frames. Aucun moteur de déplacement, caméra, collision, combat ni XP dans cet éditeur.
- Périmètre : page hero-editor.html indépendante; nom auteur, image base, option de frames idle/walk avec cadence et contrôle du mouvement simulé; import PNG/WebP et limites taille/dimensions; identifiants émis automatiquement; catalogue versionné; preview sur renderer existant; enregistrement/réouverture réelle.
- Tests : TDD RED puis GREEN contrat de médias, choix image/sprites, source asset unique, validation de dimensions/doublons, IndexDB persistant (pas data URL en Core), reprise Chromium écran paysage, sauvegardes et World Builder intacts. Pas de compétence ou fiche de héros ici; raccord GenSRPG Adventure et Jouer restent des lots séparés.

---
# Lot 04/11/2026 — Héros 2.5D : image fixe OU séquence de sprites (CI GREEN, VALIDATION VISUELLE UTILISATEUR RESTANTE)
- **CI sur code exact** : Exploration Node [#41840125765](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41840125765) SUCCESS et Pages preflight [#41840125546](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41840125546) SUCCESS sur `79868de9be4039f959a8c3485de7ad4f368bb783` ; déploiement Pages SKIPPED sur PR, ne pas confondre avec production. Les tests image fixe existants et nouveau mode 3 frames sont verts. Aucun asset utilisateur/selection GenSRPG n'est livré par ce seul contrat, et recette visuelle Pixel physique non faite.


- **Décision utilisateur** : au choix du créateur, avatar à image unique avec l'oscillation existante ou images d'animation pour repos/marche. Aucune contrainte d'import de visuel supplémentaire pour le mode image seule. Sélectionner un héros ne doit pas déplacer sa position, changer la caméra/collision, ni figer le smartphone.
- **Base immuable** : Exploration main `a5c02440d7b5b5e0c136b3161036c50ffe15be6f`, checkpoint START `checkpoint/exploration-hero-visual-modes-start-2026-11-04`, work `work/exploration-hero-visual-modes-2026-11-04`. Main Exploration et V80 site intacts.
- **Propriété** : seul `src/actors/map-actor-visual-model.js` décrit le visuel et les références d'assets; seul `src/render/map-actor-renderer.js` choisit l'image de la frame selon `actor.moving` et le temps de rendu déjà fourni ; seul `Map Actor Visual Preparer` fournit les images préparées et les ancrages. Ne pas créer de nouveau moteur d'animation, de mouvement ni de parseur sprite à importer. Les frames sont références vers des assets déjà enregistrés par les catalogues d'images; aucun chemin libre/inventé dans le WorldDocument.
- **Périmètre exact** : extension additive du `MapActorVisual` existant avec option facultative `animation` : mode `image` (défaut historique, bob sinusoïdal inchangé) ou `frames` avec séquences d'asset IDs `idle/walk` et cadence de lecture auteur, support du miroir existant. Fallback image principale uniquement pour l'animation non configurée, sans charger une créature ou un sprite dupliqué; si une image déclarée manque, fail-closed visuellement sans faux rendu.
- **TDD** : tests RED puis GREEN pour rétrocompatibilité image fixe, sélection de frame marchée/arrêtée, tailles et cadences, miroir et ancrage, tailles invalides, non-mutation de x/y/actor, invariants renderer. CI tests + publication preview exacte avant fusion, recette PC et Pixel paysage avant GREEN produit.
- **Hors périmètre** : uploader d'assets, catalogue de héros et UI GenSRPG, Combat, compétences/XP, refonte caméra ou mouvements, WorldDocument et service worker. Un lot consommateur suivant sélectionnera une définition de héros officiellement publiée, puis fournira sa référence au moteur Explorer. Pas de bouton de sélection fictif avant catalogue.

---

# Lot 04/11/2026 — World Builder classique : « Nouvelle carte » immédiatement jouable en 2,5D (CI EN COURS, NON GREEN)

- **Besoin et bug constaté** : l'UI `world-builder-main.js`, au clic sur « Nouvelle carte vierge », appelait `createBlankWorldBuilderDraft()` sans dimensions ; son défaut historique `2400 × 1600` ne satisfait pas la contrainte native `sculptWorldAreaScene` (8..80 × 8..64 cases, une case = 28 × 21 unités). Une carte créée par cette entrée échoue dans le Jouer natif. L'autre entrée, World Assembler, utilise déjà `worldAreaSizeFromTiles({width:36,height:24})`.
- **Charte/isolement** : Exploration `main@699c87f83ac6b87fb77fb7ca340008b97d538e02` relevée avant le lot ; checkpoint START `checkpoint/exploration-worldbuilder-blank-playable-start-2026-11-04` à ce SHA ; branche `work/exploration-worldbuilder-blank-playable-2026-11-04`. Projet GenSRPG/Combat, racine `main`, V80 et autres PR héros inchangés. Source unique WorldDocument + seule conversion `worldAreaSizeFromTiles`, aucun second modèle de taille.
- **TDD RED d'abord** : `tests/world-builder-new-blank-playable-v1.test.js` ajouté au commit `3aee642d0035dc9923e68aa9a4974edaf63136cf`, échappements de regex Node corrigés `b81a728a087a14aa8200775ec476fa26cdfa8371` ; sur la base de départ, import/usage de `worldAreaSizeFromTiles` dans l'UI absent, donc le premier contrôle de contrat est rouge. Le test vérifie aussi création de vrai `WorldDocument` via le Builder, adaptation Sculpt terrain, checkpoint/réouverture natifs `createNewExplorationPlay/readExplorationPlay`, et refus explicite **sans écriture** de la carte héritée `2400 × 1600`.
- **Correction propre** : le seul bouton « Nouvelle carte vierge » du World Builder appelle `createBlankWorldBuilderDraft({...worldAreaSizeFromTiles({width:36,height:24})})` au commit `8f6401ffb8f0356eefcdb547dbe5e285fefcab83`. Aucun changement des valeurs par défaut de l'API de création historique, des cartes importées, du contrôle de limites Sculpt, des sauvegardes, de la navigation, des rencontres ni du moteur Combat. Aucune migration automatique.
- **Preuves et gate avant promotion** : Node `npm test` (dont le nouveau test), `npm run check`, véritable navigateur Chromium/Android paysage, Jobs Exploration CI, Pages préflight au SHA exact ; recette utilisateur. Le lot ne peut être déclaré GREEN/publication qu'après certification et vérification du SHA servi. Les CI de la PR héros #358 restent distinctes/à surveiller ; ne pas les annuler pour gagner de la place.

---

# Lot 04/11/2026 — Combat terminé : Explorer attend l'acquittement du seul Core GenSRPG (CI EN ATTENTE)

- **Cause racine prouvée dans le code natif** : `src/encounters/immersive-encounter-host-v1.js` consommait la seule copie de `CombatResult` immédiatement si le callback `onCompleted` ne répondait pas `false`. Or `src/sculpt-lab-main.js` retourne `true` après avoir restauré l'acteur/la caméra sans avoir persisté XP/HP/loot dans le Core GenSRPG. Le Jouer scoped n'autorise pas encore ces combats (garde de publication et d'équipe) : ne pas lever ce garde avant d'avoir raccordé le véritable Core.
- **Source/lot isolé** : branche `work/exploration-adventure-combat-ack-2026-11-04` issue de la base certifiée CI `f64de8a58cc8619e9492899dfeaf3a20236d0592` (PR #361) ; checkpoint START `checkpoint/exploration-adventure-combat-ack-start-2026-11-04`, PR empilée sur le propriétaire des handoffs. Aucune modification de GenSRPG, de Combat main, de `main` Exploration, des cartes/visuels ni de la publication.
- **Frontière de propriété** : Combat détermine le résultat réel; GenSRPG `commitAdventureCombatResultV1` possède seul la sauvegarde durable et retourne déjà `{persisted,session,award}`; Exploration n'en recalcule ni le résultat ni XP/loot. Seul le `ImmersiveEncounterHost` décide d'enlever l'iframe et de `consumeCombatResult`. Pour un `snapshot.player.partyRef` official scoped `adventure-party:<sessionId>`, il doit recevoir du callback existant `persisted:true`, le **même** `session.sessionId` et la preuve exacte `processedEncounterKeys.includes(encounterId+':'+returnToken)` avant consommation. Une réponse `true`, `undefined`, `false`, Promise, mauvaise partie ou absence de preuve laisse le résultat et l'iframe intacts. Le Tester autonome conserve exactement son comportement préexistant.
- **TDD** : test de message Chromium à portée Node dans `tests/immersive-encounter-host.test.js`, ajouté en premier au commit `494be664`; il démontre les faux acquittements et le refus de consommer puis l'autorisation avec une vraie preuve corrélée. Correction du propriétaire `src/encounters/immersive-encounter-host-v1.js` `fbc9efed`. Les tests de la PR #361 protègent également les JSON corrompus, versions futures et overwrites de pending. Ne pas fabriquer un ack dans Explorer : il devra être réellement fourni par le port GenSRPG à intégrer dans le lot suivant.
- **Gates** : tests Node + `npm run check`, vrai navigateur Chromium (Tester intact, Play fail closed), 3 jobs CI Exploration au HEAD exact, préflight publication, puis recette complète du Jouer GenSRPG/Pixel après raccord des grants. Ce lot doit rester DRAFT/non publié jusqu'à certification ; aucun GREEN produit revendiqué pour la boucle Exploration→Combat→XP/loot→retour.

---

# Lot 04/11/2026 — ne jamais perdre un CombatResult non acquitté lors de la reprise de partie (CI NON GREEN)

- **Motif métier** : une partie Monster Capture doit pouvoir résister à une reprise, à un handoff partiellement écrit ou à un résultat Combat d'une version future. La source officielle Exploration `src/encounters/combat-handoff-store.js` effaçait *silencieusement* sa seule copie de `sessionStorage['gensrpg.capture.combat-handoff.v1']` si JSON/contrat invalide et permettait un nouvel `saveCombatHandoff` écrasant une rencontre/récompense non acquittée.
- **Source vérifiée** : Exploration `main@699c87f83ac6b87fb77fb7ca340008b97d538e02`; checkpoint START `checkpoint/exploration-combat-handoff-preservation-start-2026-11-04` au même SHA ; branche de lot `work/exploration-combat-handoff-preservation-2026-11-04`. Charte LAB : un propriétaire `CombatHandoffStore`, aucun changement Combat main, GenSRPG Core Storage, moteur de déplacement, caméra ou PWA; pas de rustine de `try/catch` qui masque les invalidités.
- **TDD RED→GREEN** : tests d'abord `tests/combat-handoff-store.test.js` commit `4854aece` : JSON malformé, chaîne vide, snapshot invalide et handoff d'une version future doivent déclencher une erreur explicite *en conservant les octets originaux*; `consumeCombatResult` ne peut pas acquitter. Source corrigée au commit `08d08b24` : version strictement vérifiée, erreur explicite avec `cause` sans suppression. Deuxième test RED `30c1d635` : une nouvelle rencontre ou une position de retour différente ne peut remplacer un handoff existant, un résultat terminal ne peut être changé de victoire à fuite ; correction `64000e2e` dans le seul écrivain officiel, avec contrôle de même snapshot/returnState et résultat non mutable. Les écritures idempotentes du même résultat restent autorisées.
- **Critères de validation** : `readCombatHandoff` `null` seulement si clé absente, refus sans perte des formats inconnus, écriture autorisée quand aucun handoff ou attachement du résultat de même rencontre, consommation exacte une seule fois, aucune suppression ni gain d'XP sur lecture invalide. Exécuter Node `npm test` + `npm run check`, Chromium réel et CI Exploration au SHA exact, publication/Pixel séparés. Périmètre **GREEN CI** seulement après les trois jobs réussis ; ne pas fusionner/déployer sur un résultat partiel. La responsabilité de l'attribution XP au Core GenSRPG reste exclusivement dans `commitAdventureCombatResultV1`.
- **Risque résiduel explicite** : un handoff non acquitté corrompu bloque les combats suivants plutôt que de perdre les données ; le parcours utilisateur de récupération/backup doit être conçu dans le lot Jeu complet, sans effacer les données d'office. Les PR de Héros #358, carte #360 et arènes élémentaires restent séparées.

---

# Lot 04/11/2026 — autorisation des rencontres du Jouer GenSRPG par Bestiaire Combat OFFICIEL (EN COURS, NON GREEN)

- **Source immuable / checkpoint** : Exploration `main@ecfb3276d494540a59d3e70f5c6702dce4cbf72f`, checkpoint START `checkpoint/exploration-scoped-published-encounters-start-2026-11-04`, branche `work/exploration-scoped-published-encounters-2026-11-04`.
- **Constat** : `sculptEncounterStep()` refuse toute rencontre `sculptPlayActive` malgré l'existence du même vrai `EncounterController` et du contrat Combat. Ce verrou protège contre les transferts de créatures non publiées; il ne peut être retiré sans preuve provenant du Bestiaire Combat.
- **Autorités** : Combat main = seule autorité de publication via `captureBestiaryCardsV1`; GenSRPG Aventure = sélection officielle de créatures jouables, identité `AdventureSession`, sessionStorage éphémère autorisant les seules espèces publiées (pas de nouvelle source de statistiques); Exploration = catalogue lecteur du Showcase Combat, choix de rencontre par familles de terrain et probabilité, réconciliation de `sessionId` et `worldId` avant d'utiliser cette liste. Aucune mutation du `WorldDocument`, aucune lecture du DOM d'un autre module.
- **Contrat de frontière** : enveloppe versionnée de transmission `gensrpg.capture.v2.published-encounters.v1` : `{schema,version,sessionId,worldId,combatSha,allowedCreatureIds}`. Validation stricte de tous les champs, et de `combatSha` contre le même bundle officiel `authorSha/engineSha`. Les candidats natifs (éléments/rareté) restent l'unique catalogue Exploration, filtré par la liste blanche Combat ; aucun ID manuel, ni clé globale de sauvegarde.
- **Compatibility** : Jouer standalone sans `AdventureSession` conserve ses rencontres désactivées. Jouer GenSRPG sans enveloppe valide garde déplacements/caméra/portails mais **ne déclenche aucune rencontre** (absence non masquée) ; le Tester historique reste inchangé. Ne pas activer les combats ou la distribution XP avant la réconciliation atomique du retour et l'injection en vraie UI Aventure.
- **TDD RED** : tests du contrat de session/bundle, rejet des ID non autorisés, doublons, SHA décalé et absent, et cache éphémère séparé ; test du filtrage dans le vrai `CaptureCreatureCatalogProvider`. Ensuite branchement unitaire au runtime Jouer + tests publication/Chromium. Preuve CI exacte Node/HTTPS/Combat + Pages avant toute promotion.
- **Hors périmètre** : GenSRPG source, Labo Combat main, écran de victoire et XP/loot, nouvelle carte, Camera/Movement, PWA, migration anciennes sauvegardes. Les futures données de liaison ne sont pas des créatures persistées et ne doivent jamais devenir une autorité parallèle.

---

# Lot 03/11/2026 — identifiants de rencontre non réutilisables après reprise GenSRPG (EN COURS, NON GREEN)

- **Signal d'audit** : `src/encounters/encounter-controller.js` produit actuellement `encounter-1:return-1` en mémoire après chaque chargement. Après Jouer → Menu → Continuer, le contrôleur réinitialisé peut réutiliser la même paire, alors que GenSRPG Aventure protège `processedEncounterKeys` par `encounterId:returnToken`. La seconde victoire serait considérée déjà traitée. Une référence d'une autre partie pourrait aussi se confondre.
- **Base** : Labo Exploration `main@2f492471471868f5808d3f73b5a5d15883b98059`, checkpoint START `checkpoint/exploration-capture-encounter-ids-start-2026-11-03`, branche `work/exploration-capture-encounter-ids-2026-11-03`; `main` inchangé.
- **Autorité** : Encounter Controller Exploration est seul responsable de produire les identifiants d'une rencontre. Ajouter une **stratégie facultative injectée** `createCorrelationIds` dans le constructeur existant, avec validation stricte. Par défaut, le Tester historique conserve les séquences déterministes ; pour `?play=1&adventureSession=...`, le même contrôleur peut recevoir des IDs opaques `crypto.randomUUID()` uniques au redémarrage. La stratégie n'écrit ni stockage ni règles GenSRPG.
- **TDD** : tests RED de collision après réinstanciation, corruption/duplicate ref, invariants legacy, puis code. CI Node/Chromium/Builder et Pages au SHA exact avant GREEN. Pas de second moteur Encounter ni d'appel au Combat.
- **Hors périmètre** : activation des rencontres Jouer (bloquée jusqu'au Bestiaire publié), retour Combat, allocation XP/loot, moteur Combat, génération de monde et PWA. Aucun changement de l'éditeur historique ni des paramètres de terrain.

---

# Correctif isolé 03/11/2026 — bouton Nouvelle partie visible malgré [hidden] dans Jouer GenSRPG

- **Signal CI consommateur** : GenSRPG [root-browser #41709236087](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/41709236087), ligne 179 : `#play-new` réellement visible lors d'une reprise GenSRPG. L'identité de partie est valide et la navigation 2.5D a démarré ; la première erreur apparaît au retour Menu.
- **Cause racine** : `src/play/exploration-play-entry.js` place `play-new.hidden=true` en scoped GenSRPG, mais `play.html` définit `button,a.link{display:flex}` qui réaffiche le bouton en dépit du style HTML `hidden`. Ce défaut n'était pas détecté par le test qui vérifiait seulement la propriété `.hidden`. Il ne s'agit ni d'un moteur manquant, ni d'un inventaire, ni d'une règle d'autorisation.
- **Source propriétaire** : Exploration `main@e36ed7a89f8a4179ea9ae05b2fff61aa1a86acaa`, checkpoint START `checkpoint/exploration-native-play-hidden-button-start-2026-11-03`, branche `work/exploration-native-play-hidden-button-2026-11-03`.
- **Périmètre** : CSS `play.html` exclusivement + test Chromium réel sur `getComputedStyle()/getClientRects()`; la politique `hidden` de tous les boutons reste celle de la sémantique HTML. Jouer standalone n'est pas affecté. Ne toucher ni moteur Sculpt, ni WorldDocument, ni session/XP/combat, ni GenSRPG.
- **TDD** : RED d'abord test qui détecte le rendu du bouton, GREEN ensuite règle CSS ciblée. Tester un Jouer scoped et un Jouer autonome, JS/Node/Chromium et publication du SHA exact. Pas de contournement du test consommateur.
- **Garde de publication** : aucune promotion GenSRPG avant PR Exploration sur main au SHA officiel et revalidation du vrai navigateur. Recette mobile avant GREEN produit.

---

# Lot 03/11/2026 — liaison de navigation Jouer par identité de partie GenSRPG (EN COURS, NON GREEN)

- **Demande** : poursuivre le raccordement Monster Capture depuis GenSRPG, sans refaire le moteur Jouer.
- **Base immuable** : Exploration `main@d999e8e6ab57c3f891edc5b0d79d8c40192c90a9` (PR #345), checkpoint START `checkpoint/exploration-adventure-session-scope-start-2026-11-03`, branche `work/exploration-play-session-scoped-owner-2026-11-03`.
- **Propriétaire unique** : Exploration `src/play/exploration-play-session.js` stocke seulement la navigation WorldDocument/Area/X/Y et sa clé. GenSRPG possède identifiant de session, progression, bestiaire et sauvegarde de partie. La clé historique sans session reste strictement inchangée et doit être compatible.
- **Périmètre** : API versionnée facultative `{sessionId}` sur create/read/write; stockage isolé par session et validation stricte de l'identifiant; `play.html?adventureSession=...` et `sculpt-lab.html?play=1&adventureSession=...` transportent uniquement le contexte opaque de navigation. Aucune copie de carte, aucun déplacement/caméra/collision/rencontre ou import de règles Combat.
- **TDD** : RED d'abord pour l'isolation de deux parties, les identifiants invalides, la non-réinitialisation de l'ancien checkpoint et la reprise multi-Area; ensuite code; tests réels Node et navigateur requis, CI exacte.
- **Limites** : aucun monde du Labo localStorage ne peut être lu automatiquement depuis l'origine GenSRPG : le World Builder consommé dans GenSRPG devra fournir son vrai WorldDocument. Les sauvegardes restent sur l'origine du site. Aucun déploiement ni promotion sur main avant les gates.
- **Hors périmètre** : GenSRPG source, Labo Combat, récompenses, IA, whitelist, options vitesse/caméra, Service Worker, versions V80 et Publisher.
- **Gate** : vérifications historiques `play` autonome + scénarios GenSRPG sessionScoped/legacy, rendu Chromium, CI, preuve mobile utilisateur si changement perceptible. NE PAS déclarer GREEN produit avant partie complète GenSRPG.

---

# Introduction de Jouer dans Labo Exploration (03/11/2026)

- **Demande** : après validation qualitative de la fluidité PC et la correction du World Builder, ouvrir une vraie partie **Nouvelle partie / Continuer**. Base : `main@2f20cbac59685889c3b00918479d068ca8bae134`, Pages GREEN `41647191660`, checkpoint `checkpoint/exploration-native-play-intro-start-2026-11-03`, branche `work/exploration-native-play-intro-2026-11-03`, issue [#343](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/issues/343).
- **TDD RED premier** : `tests/exploration-play-session.test.js` SHA `cc56c5d5246416e71047f69a560637fff28aa12e`, puis test rendu/publication `tests/exploration-play-publication.test.js` SHA `0510a34186e3117f97389d84cfdbd54525037076`.
- **Livrable du lot** : `play.html` (Nouvelle partie / Continuer), WorldDocument v3 uniquement, session native `sculpt-lab.html?play=1`, vrais sprites/caméra/Collision World/portals, sauvegarde légère area+X/Y (pas de world modifié), HUD jeu sans éditeurs, arrêt au menu, route via le World Builder. Tout défaut de Spawn ou d'édition du monde bloque proprement la reprise.
- **Publication** : mettre `play.html` et modules en `/preview/encounters-v80/`, avec URL première partie `/play.html` à la racine via le seul workflow GitHub Pages. Préserver V80 octet par octet, la preview unifiée et les autres branches.
- **Autorités** : Exploration = monde/navigations ; Combat main = bestiaire publié/combat ; GenSRPG Aventure PR233 = sauvegardes et XP/capture/loot. Dans ce premier lot, les rencontres non filtrées sont désactivées **uniquement pour Jouer**, pas pour Tester. Aucun faux combat ni inventaire/XP local ajouté.
- **Tests requis** : Node, check, vrai Chromium entrée nouvelle partie -> Canvas héros -> déplacement -> menu/sauvegarde -> Continuer à même position, et CI combat/Pages HTTPS pour le SHA exact. Pas de GREEN de publication avant les preuves.

---

# Lot — rétablir l'accès World Builder depuis le lien officiel (03/11/2026)

- **Signal utilisateur** : correctif fluidité PC satisfaisant, mais lien direct `/sculpt-lab.html` semble supprimer l'accès au constructeur de mondes.
- **Diagnostic précis** : le hub `index.html` pointe « World Builder » vers `builder.html` (ancien éditeur 2D) ; le lien correct `world-assembler.html` est caché avec le header en mode plein écran de l'éditeur Sculpt autonome. Le bouton flottant existant n'est présent que si la carte a été ouverte depuis World Builder.
- **Lot isolé** : `main@d5309570ea0f31afd31fd5ebcf41e104e74498fd` déjà publié, checkpoint `checkpoint/exploration-world-assembler-entry-start-2026-11-03`, branche `work/exploration-world-assembler-entry-2026-11-03`, PR #342.
- **Correctif** : hub « World Builder » → `world-assembler.html` ; lien flottant « 🌍 Monde » visible dans le plein écran **autonome hors Tester**, masqué dans une zone déjà ouverte depuis World Builder afin de préserver la sauvegarde/retour canonique. Aucune modification des cartes, imports, sauvegardes, outils ou moteurs.
- **TDD RED** : `tests/world-builder-entry-accessibility.test.js` commit `7d665afb1d830bf713e388b02452de7de2b3dd68`. CI Node, check, Chromium, publication Pages HTTP au SHA exact avant GREEN et test utilisateur.

- **Défaut CI supplémentaire démontré** : run 41641768939, test `native-https-pixels` initialisait la page du SHA exact sur `raw.githack.com` mais le module JS n'était jamais exécuté (Canvas par défaut 300×150, `window.__sculptLabProbe` absent, aucun pixel rendu). Ce service tiers est précisément celui où l'utilisateur ne voyait pas la carte et n'est pas une autorité de publication. Suppression de cette **dépendance du test**, sans affaiblir les assertions : nouveau serveur HTTP 127.0.0.1 depuis le checkout au SHA immuable, vrai Chromium canvas et screenshot compositeur, vérification effective du lien flottant visible en immersif standalone et caché en Tester/session World Builder. Le workflow Pages unique reste responsable de vérifier **HTTPS public**, CSS et assets de la version publiée. 
- **Suite distincte** : mode « Jouer une partie » dans Labo Exploration, en conservant l'onglet Tester comme harnais ; lancement GenSRPG Nouvelle partie/Continuer raccordé plus tard, sans doubler les autorités de combat ou sauvegarde.

---

# Lot isolé — fluidité du Tester publiée sur main du Labo uniquement (03/11/2026)

**Demande utilisateur** : le lien alternatif sur la branche PR #338 n'affichait aucune carte. Reprendre la correction sur le laboratoire officiel déjà fonctionnel, afin de tester sur PC avec le lien habituel. Autorisation explicite de publier **ce seul correctif** ; ne pas intégrer la candidate globale #329, ni les cartes personnelles #337 avant le lot moulin/éolienne, et ne pas toucher à GenSRPG ni au futur « Jouer une partie ».

- Départ `main@9d5b198f193b73c1912dd21881311786415ba113`, checkpoint `checkpoint/exploration-render-fluidity-main-start-2026-11-03`.
- Branche lot `work/exploration-render-fluidity-main-2026-11-03`, PR ciblant directement `main`. TDD RED `tests/sculpt-navigation-frame-pacing.test.js` créé à `1bbfbf072f2a80c7c0ea461520921854f795307d`.
- Modifications : dessin complet à chaque RAF durant marche / suivi d'altitude, cadence ralentie seulement à l'arrêt, mesure `Rendu N FPS / Calcul N FPS`, invalidation du cache `sculpt-lab.html`.
- Gate Chromium : dessin du vrai Canvas 2,5D chargé depuis la page officielle, acteur en marche et FPS de rendu observables, ajoutée à `scripts/smoke-sculpt-terrain-lab.mjs`.
- Réutiliser **uniquement** `.github/workflows/publish-v81-main.yml` après CI du SHA exact et checkpoint GREEN ; vérification live GitHub Pages requise avant lien au testeur.
- Les autres branches restent isolées ; aucune action GenSRPG.

---

# Publication d'une UNIQUE preview mobile du candidat Exploration unifié (2 novembre 2026)

- **Motif** : l'utilisateur demande de poursuivre conformément à la charte après validation Node+Chromium de la base calme #333 et consolidation dans #329. Les tests mobiles exigent un lien autonome sur Pixel paysage avant toute promotion de V80.
- **Périmètre du lot** : publication *test-only* dans `/preview/unified-candidate/`, depuis le SHA exact PR329 `77607520574c8509becf91a6dc55783e29c1570c`. Le publisher `.github/workflows/publish-v81-main.yml` reste la SEULE autorité GitHub Pages. L'ancien V80 reste à la racine et byte-for-byte ; le chantier ne modifie aucun gameplay, aucune donnée Combat, aucun raccord GenSrpg.
- **Checkpoint START** : `checkpoint/exploration-unified-mobile-preview-start-2026-11-02`, SHA main `ba0701224b764f4c60d4294c9729a49ade5869ad`. Branche `work/exploration-unified-mobile-preview-publish-2026-11-02` issue du même main. Checkpoint TDD RED `checkpoint/exploration-unified-mobile-preview-red-2026-11-02` au SHA `ed96091ed1c02ce03442515981dd21867705dcd6`.
- **Preuves prévues** : test RED `tests/exploration-unified-trial-preview.test.js` ; CI Node, réel Chromium du dossier Pages assemblé (pas une page simulée), contrôle que le terrain monte à 16 via UI, cascades sur eau, portail/route et contrôles de rencontre global/local. Publication uniquement via PR sur main après CI et statut candidat validé. HTTPS `sculpt-lab.html`, `world-assembler.html`, `builder.html`, JS, provenance 4 SHA et sentinelle V80 inchangée.
- **Règles** : la preview N'EST PAS une nouvelle autorité runtime ; elle est une copie figée de la future release candidate, uniquement accessible via lien de test. Aucune nouvelle PWA/runtime parallèle et aucun changement du moteur officiel sur main avant recette tactile + GREEN. La future PR #329 changera la racine, puis cette preview de validation pourra être retirée lors du nettoyage contrôlé.
- **Statut** : en cours, ne pas appeler GREEN avant CI SHA exact, publication HTTPS, puis essai tactile Pixel paysage. Pas de lien prétendu actif avant preuves.

---

# GenSrpg / Exploration : défaillance de dépendance Combat isolée du renderer — 01/11/2026 (NON GREEN)

- **Preuve HTTPS en vrai Chromium** : [run Exploration #41332822279](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41332822279) atteint le HTML officiel `sculpt-lab.html`, mais l'import top-level `loadCaptureShowcaseEncounterSourceV1()` échoue sur le bundle Combat officiel absent (`combat-preview/data/capture/showcase/encounter-bundle.v1.json`, HTTP 404), empêchant l'initialisation du canvas (300×150). L'erreur antérieure `sculptWorldCurrentInterior` TDZ est protégée par l'ordonnanceur de premier dessin du lot précédent ; le 404 restant est **distinct et doit rester signalé**.
- **Règle d'autorité** : Combat seul fournit le catalogue des créatures et les données Showcase ; si leur bundle n'est pas monté sur l'origine attendue, les rencontres ne peuvent pas démarrer. Mais le terrain 2.5D ne doit pas exiger les données Combat pour peindre son sol.
- **Correctif localisé** : recueillir l'erreur de source officielle pour les rencontres, **ne créer aucun catalogue de remplacement**, présenter le motif dans la rubrique Rencontres, empêcher `sculptEncounterStep()` d'exécuter sans source. Autoriser le reste du bootstrap visuel à terminer et dessiner le terrain, avec renderer, scène, caméra et WorldArea inchangés. Comportement normal avec bundle présent = strictement le même catalogue initial que précédemment.
- **Tests** : test statique de source unique + garde de rencontres, test de premier frame et pixels 2.5D sur URL de la PR au SHA exact. Ce jalon est uniquement visuel : **il ne certifie pas les rencontres, ni le raccord Combat**. L'assemblage final devra inclure le bundle dérivé des données Combat `main` exactes via le script officiel Exploration ; aucun moteur ou catalogue local alternatif.
- **Gouvernance** : PR Exploration #327 encore DRAFT et `main` Exploration inchangé ; GenSrpg #225 consomme `main` seulement. Pas de GREEN produit, pas de promotion avant CI et validation mobile.

---

# GenSrpg noir : barrières d'initialisation du rendu natif 2.5D — 1 novembre 2026 (NON GREEN produit)

- **TDD navigateur RED exact** : [run GenSrpg #41326099323](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/41326099323) `framePending` TDZ + canvas noir 300×150 ; en validant la vraie URL HTTPS et en franchissant l'avertissement standard de l'hébergeur, [run Exploration #41332547648](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41332547648) montre ensuite `ReferenceError: Cannot access 'sculptWorldCurrentInterior' before initialization` dans `cameraView`. Cause commune : les images terminent pendant le `top-level await` de la source Capture et `requestAnimationFrame(draw)` démarre alors que l'ES module n'a pas fini de déclarer les propriétaires WorldArea/caméra.
- **Correction au propriétaire unique** : `src/sculpt-lab-main.js` crée `framePending` et `sculptBootReady=false` avant tout callback ; `scheduleDraw` ne programme pas de RAF pendant la phase de construction ; **une seule transition** `sculptBootReady=true;fit()` après les autres initialisations et abonnements ; aucun mécanisme de retry, copie, masque, nouveau rendu ou changement de gameplay.
- **Gates obligatoires** : test statique de déclaration et transition unique ; vrai Chromium local dessinant les pixels de terrain et interactions ; preuve HTTPS sur la même branche à SHA immuable (en respectant la confirmation d'hébergement) ; CI et publisher non fusionnés ; validation tactile ultérieure. PR [#327](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/327) DRAFT, main Exploration non modifié. GenSrpg PR #225 continue à n'utiliser QUE main ; ne pas transférer ce code dans GenSrpg.

---

# Correctif : image préchargée avant ordonnanceur de rendu 2.5D (01/11/2026)

- **Signal réel** : GenSrpg PR #225 prévisualisation Android présente un canvas 2.5D noir. Reproduction Chromium externe [run #41326095665](https://github.com/slyen4425-cloud/Zombicide-40k/actions/runs/41326095665) : `ReferenceError: Cannot access 'framePending' before initialization` lors de `pic.onload → scheduleDraw`; canvas 300×150 pixels entièrement noirs.
- **Propriétaire et périmètre** : Labo Exploration seul, `src/sculpt-lab-main.js`. Le gestionnaire de trames doit exister avant l'enregistrement des callbacks d'image. Aucun changement des moteurs de terrain, collision, caméra, sauvegarde, assets, Combat, ou édition de la scène.
- **Point de départ** : main `ba0701224b764f4c60d4294c9729a49ade5869ad`, checkpoint `checkpoint/exploration-start-frame-pending-image-load-2026-11-01`, branche `work/exploration-image-onload-before-sculpt-frame-2026-11-01`.
- **TDD RED** : test `tests/sculpt-frame-initialization-order.test.js`, [run #41326367421](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41326367421) : contrôle `core-tests` FAIL à la bonne assertion, callback trop précoce.
- **Correction** : déplacer la déclaration unique `let framePending=false;` avant les premiers `Image.onload`, sans modifier le moteur de dessin ; conserver le test statique et le navigateur à pixels GenSrpg. GREEN à confirmer uniquement après CI Explorer et prévisualisation réelle ; aucune promotion sur main avant les contrôles et la validation utilisateur.

---

# Publication isolée — cascades sur eau et terrain 16 niveaux (1 novembre 2026)

- **Demande de test** : Cascades V3 refusées sur les cellules humides alors que les présets les posent, et relief du terrain plafonné à 7 niveaux. Rehausser la sculpture et permettre les cascades de la rive haute vers le plan d'eau. Ne PAS modifier la hauteur des sprites cascade.
- **Base du publisher** : `main` `e692854e4588dc23b2a99e34bccac96a0cdb262a`, checkpoint `checkpoint/exploration-waterfall-height-preview-start-2026-11-01`, branche `work/exploration-waterfall-height-preview-publish-2026-11-01`. Le moteur corrigé est épinglé en lecture seule au SHA `c6ab2df548f5bcb0fe797d3f851d5ca10b1a1c1d` (branche PR320).
- **Autorité unique** : seul `.github/workflows/publish-v81-main.yml` produit l'artefact Pages. Ajouter `/preview/waterfall-height-pr320/` à l'assemblage complet déjà contenant V80, encounters-V80, PR301 et PR318 ; garder les versions précédentes byte-for-byte.
- **Contrôles** : tests TDD RED `tests/waterfall-height-preview-publisher.test.js`, CI Node + Chromium sur le SHA de PR320, CI du publisher, vérification en vrai Chromium dans le dossier **assemblé**, puis SHA exact testé par HTTPS (provenance + éditeur + `sculpt-height-model.js` + `sculpt-scene-preview.js`). GREEN utilisateur seulement après essai mobile.
- **Gel** : aucune fusion du nouveau moteur dans main, aucun changement au moteur Combat, aux présets personnels, ni aux chemins approuvés. Ne pas écraser /preview/ramp-pr316/ qui porte la correction des routes sur pentes approuvée.

---

# Publication test de la pente avec routes étroites PR318 (1 novembre 2026)

- **Demande après retour utilisateur** : la prévisualisation `/preview/ramp-pr316/` est disponible mais peint une route sur **toute** la largeur d'une pente. Publier la révision corrigée en conservant exactement le même lien de test, sans toucher à V80, aux autres aperçus ou à la logique du Combat.
- **Départ** : `main` SHA `8dc6f23792cbad9d4ac65bc3825c60de0ffcd32c`, checkpoint `checkpoint/exploration-ramp-pr318-preview-start-2026-11-01`, branche unique `work/exploration-ramp-pr318-preview-publish-2026-11-01`.
- **Correctif épinglé** : PR318 `work/exploration-ramp-road-width-2026-11-01`, SHA `0dc90b9778b0a9e530adf7e90ac6d2506599c952` à promouvoir dans la recette Pages seulement **après** son CI vert. `WorldSurface v3` reste seule source de vérité.
- **Publication** : seul workflow `.github/workflows/publish-v81-main.yml`; remplacer le `ramp-source` épinglé précédemment, garder `/preview/ramp-pr316/` pour qu'un rechargement affiche le correctif, contrôler le chemin découpé `ctx.clip()` dans les fichiers archivés et sur HTTPS.
- **Validation renforcée** : tests TDD RED `tests/ramp-pr318-road-width-publisher.test.js`, CI Node+Chromium de PR318 et du publisher, exécution **du test Chromium de la pente réelle avec pixels** dans l'artefact complet Pages (zone forestière préservée des deux côtés à 90/55/35), provenance HTTPS correspondant au SHA attendu, puis test tactile Pixel utilisateur. Aucune promotion de PR318 au `main` du moteur, seul le workflow de publication change.
- **Hors périmètre** : carte personnelle, présets intégrés, rencontres, intérieurs, V80 stable, PR301 et Combat main non modifiés. Pas GREEN utilisateur sans retour visuel.

---

# Publication de la prévisualisation dédiée PR316 (1 novembre 2026)

- Demande utilisateur : fournir un lien de test pour vérifier la pente forestière corrigée au plus tôt, **sans** promouvoir PR316/PR301 sur main ni modifier le site stable V80.
- État de départ : `main` `312131b393b11a88bee481c43df66573a09f04c9`, branche `checkpoint/exploration-ramp-preview-publish-start-2026-11-01`, lot `work/exploration-ramp-pr316-preview-publish-2026-11-01`.
- Source correcte : PR316 CI `41288365269` `success` au SHA exact `c8d689796bddeccd4e772e4c17fd6893818c84fe`. Le test Chromium et les sentinelles de terrain ont déjà été exécutés sur ce SHA.
- Mutation d'un **seul propriétaire de publication** : `.github/workflows/publish-v81-main.yml`, préset /preview/ramp-pr316/ supplémentaire et entièrement séparé ; SHA épinglé, code/assets/Combat main montés dans le même assemblage, validation provenance SHA exact sur HTTPS. Le site V80 et /preview/rich-presets-pr301/ conservent leurs propres SHA et leur contenu ; le cron publie toujours les trois prévisualisations dans le même artefact.
- Test RED `tests/ramp-pr316-preview-publisher.test.js` avant correctif. Les contrôles CI du workflow, publication Pages et HTTPS sont exigés avant de communiquer un lien comme actif.
- GREEN **non prononcé** tant que le dernier commit main de publication, le run Pages, le HTTPS et le test visuel/tactile utilisateur ne sont pas constatés.

---

# Publication du correctif des intérieurs — SHA PR301 épinglé (31 octobre 2026)

- La PR313 a corrigé l'éditeur intérieur World Builder complet (murs, formes/dimensions, portes, modèles, étages/escaliers), sans UI masquée ni double WorldDocument. Merge sur PR301 vérifié à `40955a7838beb8fb76e74fd4b941ce4bb7cd1505`, Core/Chromium PR313 GREEN.
- La PR312 a installé sur main le seul publisher Pages à deux sous-dossiers stables. Ce lot met à jour strictement son pin PR301 de `1c2160fa34b3ee3ffcf349424b87df162d4378e4` vers `40955a7838beb8fb76e74fd4b941ce4bb7cd1505`, dans checkout, provenance et validation live.
- Checkpoint: checkpoint/exploration-preview-pin-room-editor-start-2026-10-31 ; branche work/exploration-preview-pin-room-editor-2026-10-31 ; base main@1f513d551287822812b7399578a6ee25805ab25a. Aucun fichier de gameplay ni V80 sur main n'est modifié.
- Gates: tests pages-main-pr301-preview-coexistence, CI Core et Chromium, assemblage stable + rich, déploiement Pages en succès, vérification HTTPS des deux HTML et provenance exactement égale au pin. Pas de lien utilisateur avant test HTTP.

---
# Incident publication — preview PR301 supprimée par cron main (31 octobre 2026)

- Constat: PR301@1c2160fa avait publié /preview/rich-presets-pr301/ (CI Core 954/954 + Chromium + publication). Le cron main run 41226998902 à 17:57 UTC a déployé un artefact Pages complet sans ce dossier, supprimant l'URL de test (404); vérification finale du run en échec.
- Autorité unique: chaque artefact Pages main assemble dorénavant le main stable inchangé, la V80 gelée et une preview isolée depuis le SHA approuvé PR301@1c2160fa34b3ee3ffcf349424b87df162d4378e4. Ne jamais promouvoir le gameplay PR301 sur main sans validation.
- Lot: base main@474aa42674c9bd976a8a5a8af684d65cbe848b61, checkpoint checkpoint/exploration-pages-coexistence-start-2026-10-31, branche work/exploration-pages-persistent-pr301-preview-2026-10-31. Uniquement le workflow de publication, sentinelle et journal.
- Preuves: tests pages-main-pr301-preview-coexistence, CI Core/Chromium, publication main suivie du contrôle HTTPS des deux pages et du manifeste de provenance. Ne pas dire GREEN sans ces preuves.
- Évolution: changer le SHA pinned seulement après validation d'une nouvelle PR301, jamais brancher directement une work/* mutable sur le publisher automatique.

---
# Lot correctif — source Combat main exclusivement (30 octobre 2026)

- Branche `work/exploration-combat-main-only-2026-10-30`, départ `main@200025735bb49145f4a60258ba6d63a7a4aea774`.
- Exigence utilisateur : Exploration ne peut consommer aucune définition de compétence ou de créature venant de Combat `gh-pages` ; seule la promotion explicite sur Combat `main` autorise sa prise en compte.
- Avant : moteur Combat `main`, mais données auteur `gh-pages@4fd0821545eaa41ce1d3115e56f3574db6273426`, non conforme.
- Après : moteur et données auteur du même SHA Combat `main` contrôlé à l'assemblage. Un changement incompatible échoue explicitement la CI : aucune dégradation ni retour silencieux à `gh-pages`.
- Le catalogue graphique `global-assets` est une branche média dédiée préexistante, non une autorité de règles Combat ; séparation à traiter explicitement si la politique `main` doit aussi inclure les binaires médias. Ne pas casser les visuels sans migration validée.
- Tests requis : CI Node/Chromium native, publication de l'artefact compilé, preuves HTTPS ; V80 protégée tant que non-promue.
- L'absence actuelle de la réaction Défense de Moussados dans les données de Combat `main` n'autorise pas sa copie depuis `gh-pages`.

---

# LAB_CURRENT_WORK — promotion de l'Exploration 2,5D validée vers main (30 octobre 2026)

## Autorité et périmètre
- Lot : `work/exploration-main-source-promotion-2026-10-30`.
- Départ main : `1aee007a1f7493512c4ed6416581d4f5953d5fdf`.
- Source unique validée : `checkpoint/exploration-audio-playback-gesture-green-2026-10-30` (`3a0a6ec4bad257f28577d54cd3e23e557e05d9b4`).
- Validation utilisateur du comportement audio Exploration faite le 30 octobre 2026.
- Promouvoir dans `main` le code complet (`src`, `assets`, Builder, World Assembler, Exploration 2,5D, contrats, tests) sans dupliquer l'autorité Combat ; les documents principaux récents de `main` restent autoritaires.

## Raccord de publication
- Le seul publisher Pages est `.github/workflows/publish-v81-main.yml`.
- Build Explorer depuis le SHA exact du `main` publié (ou de la tête PR pendant revue), jamais depuis une branche de travail oubliée.
- Moteur Combat : dépôt Combat `main` officiel ; catalogue visuel : `global-assets`.
- Données auteur : snapshot officiel vérifié `gh-pages@4fd0821545eaa41ce1d3115e56f3574db6273426` pour cette version validée. Le `gh-pages` plus récent contient `force_reserve_switch` que le contrat moteur `main` n'accepte pas encore. Les nouvelles mécaniques auteur ne sont **pas** dégradées ni supprimées pour faciliter la publication : elles nécessitent une version Combat main compatible et un nouveau GREEN avant promotion.
- V80 historique `933c852c41c4511cb0eed0717c246cc6b19aeddc` strictement protégée.
- Les 4 copies MP3 d'exploration correspondent aux binaires approuvés et testés, les masters restent privés.

## Critères de clôture
- PR avec diff contrôlé et unique source `main`, aucun deuxième publisher.
- CI Node + vrais tests Chromium, dont lecture réelle d'un MP3 sur clic Tester, passage Combat retour, World Builder et sauvegardes.
- Assemblage Pages + 4 SHA256 MP3 + vérification HTTP + preuve V80 identique.
- Checkpoint final GREEN avec SHA et runs ; pas de déclaration GREEN sans preuve.


## 2026-11-22 — Sculpt 2,5D : ergonomie des textures et familles (branche isolée)
- Branche : `feat/sculpt-editor-terrain-palette-20261122` depuis `main` ; **pas de fusion tant que les gates ne sont pas validés**.
- Référence détaillée : [SCULPT_TERRAIN_PALETTE_20261122.md](plans/SCULPT_TERRAIN_PALETTE_20261122.md).
- Autorités réutilisées : `WorldDocument.terrainFamilies`, `WorldDocument.encounterConfig`, `WorldSurface`, `MaterialPack` ; zéro nouveau stockage ou gestionnaire de rencontres.
- Tests : unité/contrat + CI, navigateur smartphone et PC ; vieux V80, géométrie, collisions, monde et PWA protégés.
- Statut : implémentation en PR, checkpoint GREEN non acquis ; aucun déploiement revendiqué.

## 2026-11-25 — Charte graphique Genesis Fantasy Diorama 2.5D V1.0 (documentation, NON GREEN)
- START main `e272279c560be19f32d8475b5dd78195ee6c7786`, checkpoint `checkpoint/exploration-start-graphic-charter-v1-20261125`, branche `work/exploration-graphic-charter-v1-20261125`.
- Validation auteur : intégrer la charte graphique V1.0 à `docs/LAB_CHARTE.md`, sans le prompt de génération. Périmètre documentaire exclusivement, propriété Exploration ; aucun asset, ID, registre, moteur, contrat, sauvegarde, workflow ou autre dépôt modifié.
- Contrôles : préservation intégrale de la charte précédente, six liens vers les références visuelles canoniques vérifiés, diff documentaire, CI du SHA exact avant fusion et checkpoint GREEN selon la charte. Aucun changement fonctionnel nécessitant une nouvelle preview spécifique.
