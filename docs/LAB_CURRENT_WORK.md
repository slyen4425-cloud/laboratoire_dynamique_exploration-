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
