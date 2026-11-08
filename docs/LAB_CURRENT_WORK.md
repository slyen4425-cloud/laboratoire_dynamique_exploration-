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
