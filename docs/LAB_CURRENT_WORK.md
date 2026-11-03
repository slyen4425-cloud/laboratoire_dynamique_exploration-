# Lot en cours — Saccades visuelles du Tester PC, cadence du rendu (3 novembre 2026)

- **Signal** : en mode Tester, mouvement de carte très désagréable sur PC avec impression de « sauts de lignes », moins perceptible sur mobile.
- **Cause démontrable dans le code** : simulation `navigationTick` sur RAF écran, mais ancienne demande de rendu bloquée par un intervalle fixe de **33 ms pendant la marche** (~30 FPS max, indépendamment des 60/120/144 Hz de l'écran). Ancien indicateur « FPS » mesurait la simulation, non les Canvas réellement peints. Ceci constitue une source certaine de *judder*, mais ne permet pas d'exclure un tearing matériel/pilote sans essai PC.
- **Autorité unique** : `requestAnimationFrame` reste l'horloge visuelle et `scheduleDraw` reste le seul propriétaire des rendus Canvas, avec demande dédoublonnée via `framePending`. Fonction pure `shouldPaintSculptNavigationFrame` ne calcule pas le mouvement : elle autorise la demande d'image chaque RAF si acteur mobile ou altitude en transition et à ~55 ms seulement au repos.
- **Instrumentation** : compter les appels `draw()` effectivement terminés durant Tester ; afficher `Rendu N FPS · Calcul M FPS`, exposer `window.__sculptNavProbe().renderFps`. Cela permettra une recette PC vérifiable, pas un ressenti seul.
- **Base / gouvernance** : PR #337 `work/exploration-author-presets-forest-plain-2026-11-03@c4d084ad1cb4f807e34c084d3d32f44ddc9ad270`; checkpoint START `checkpoint/exploration-test-navigation-frame-pacing-start-2026-11-03`; branche `work/exploration-test-navigation-frame-pacing-2026-11-03`, PR draft #338. TDD RED `6c00c15b1371505c2ea464a7a2e0630ba0b6a397`.
- **Tests** : `tests/sculpt-navigation-frame-pacing.test.js` simule 60/120/144 Hz marche, altitude, repos ; smoke Chromium mesure une vraie fréquence des paints distincte des rafales RAF. CI de tête exacte et essai réel PC à obtenir avant GREEN. Aucun changement collisions, mouvements, données, commandes, performance du cache, moteur Combat ou World Builder.
- **Blocage de publication** : pas de fusion `main`, pas de Pages ni de raccord GenSRPG avant que les nouveaux assets moulin/éolienne soient présents et que la correction soit validée sur PC et Pixel.

---

# Lot en cours — Forêt 1 et Plaine 1 intégrées aux données du jeu (3 novembre 2026)

- **Demande** : rendre les deux cartes d'auteur disponibles dans les presets de tous les appareils, sans import manuel ni localStorage. Attendre les nouveaux assets `moulin` / `éolienne` avant publication commune, puis validation du raccord vers l'application.
- **Source** : `map.zip` contenant un WorldDocument utilisateur avec les zones `foret-1` et `plaine-1`. Données figées dans `src/builder/sculpt-author-map-snapshots.js` : Forêt 1 80×60 / 142 objets / 5 routes ; Plaine 1 80×60 / 64 objets / 14 routes / 7 rampes. Les autres zones et les six Portal ne sont pas des presets et ne sont pas copiés.
- **Base** : PR #335 filtre de passabilité (SHA `c7e42cb35f37b2bb38c5943b84755a9b8f46e938`) reposant sur la candidate unifiée PR #329. Départ figé `checkpoint/exploration-author-presets-start-2026-11-03`; branche `work/exploration-author-presets-forest-plain-2026-11-03`, PR draft #337.
- **TDD** : test RED introduit au SHA `26369193d735e89496ea2d62be89d50e8041a7a3`, `tests/sculpt-authored-presets-shared.test.js`. Intégration ensuite via `createSculptMapPreset` et `listAvailableSculptMapPresets`. Les huit anciens presets procéduraux (IDs 101–108) sont supprimés du catalogue et leur générateur est retiré du code ; seuls les deux presets fournis Forêt 1 et Plaine 1 (IDs 109 et 110) sont distribués. Les anciens WorldDocuments déjà sauvegardés ne sont ni effacés ni migrés. La bibliothèque personnelle demeure indépendante. Checkpoint GREEN uniquement après réussite CI SHA exact.
- **Sécurité / suspension** : aucune fusion vers `main`, aucun remplacement V80, aucune publication Pages et aucun raccord Combat/GenSrpg tant que le lot des assets et la validation finale ne sont pas terminés. Les sauvegardes utilisateur ne sont pas migrées ou écrasées.
- **Rectification après retour utilisateur du 03/11** : le maintien des huit modèles génériques était contraire à sa demande. Correctif sur #337 : suppression réelle de leur génération dans `sculpt-builtin-map-presets.js`, remplacement des tests obsolètes par les deux cartes auteur, aucune autre source ou masquage UI.
- **Prochaine étape** : ajouter les assets moulin/éolienne sur une source unique vérifiée, puis contrôle des versions et du raccordement Minds/GenSRPG sur navigateur PC + Pixel paysage, avant publication à la demande.

---

# Lot — Filtre visuel de passabilité dans l'éditeur 2,5D (2 novembre 2026)

- **Demande** : bouton facultatif en mode Éditer pour voir le terrain réellement franchissable avant l'essai de déplacement, particulièrement autour des objets, murs, lacs, falaises et chemins/pentes.
- **Autorité unique** : lire `isBlocked` de `src/core/collision.js`, et le **même** `navigationWorld()` + `navigationContext()` que `stepMovement`. Le nouveau `src/core/sculpt-passability-diagnostics.js` calcule des échantillons read-only au centre des cases avec le rayon 5 du héros test. Aucun nouveau moteur de collision, tableau de navigation sauvegardé, grille de déplacement ou masquage.
- **Affichage** : sur le canvas Sculpt existant, vert = centre passable, rouge = centre bloqué, orange = transition vers une case libre voisine limitée par une règle de déplacement (falaise, pente, etc.), pas une promesse de chemin complet jusqu'à un Spawn. Fonction désactivée par défaut, indisponible pendant Tester, état strictement éphémère et absent des exports. Calcul en cache par identités de scène pour éviter les rescans à chaque frame.
- **Branche** : départ `work/exploration-unified-main-v80-replacement-2026-11-01@77607520574c8509becf91a6dc55783e29c1570c` ; branche de travail `work/exploration-passability-overlay-2026-11-02`, checkpoint START `checkpoint/exploration-passability-overlay-start-2026-11-02`. TDD RED test `tests/sculpt-passability-overlay.test.js`, checkpoint `checkpoint/exploration-passability-overlay-red-2026-11-02` SHA `0f3903eaf28c1388e31803353d4773fbc1c68b65`.
- **Gates** : Node `npm test` + `npm run check`, Chromium terrain/recharge, non-modification import/export, affichage correct sous angle caméra et sur Pixel paysage, essai de montée 7→16, cascade et anciennes cartes. Puis integration dans #329 après validation et publication de la vraie version main par son workflow unique. Si une sample indique « limité », le jeu réel reste autoritaire.
- **Hors périmètre** : aucun changement de collision physique, Spawn, sauvegarde, Engine Combat, GenSrpg, terrain V80 de production ; pas de GREEN avant preuves CI, URL de test et visuel mobile.

---

# Lot — Rencontres calmes héritées du monde, exceptions opt-in par zone (2 novembre 2026)

- **Clarification utilisateur** : une base générique *calme* doit supprimer toute obligation de régler chaque zone ; les joueurs peuvent personnaliser la fréquence et distance d'une WorldArea individuellement, sans affecter les autres.
- **Source** : branche `work/exploration-calm-global-zone-2026-11-02` créée depuis candidat natif unifié PR329 SHA `92a68a41555d4f41a0d83707b43b9e6915a3b9f6` ; checkpoint `checkpoint/exploration-calm-global-zone-start-2026-11-02`. Aucun développement sur main.
- **Réemploi autorité unique** : transplant des 11 fichiers exacts de PR315 par patch sans écraser les améliorations #329. Le profil du monde `WorldDocument.encounterConfig` est la seule autorité des chances par terrain, éléments, rareté Capture et distance globale. Le contrôleur de rencontres reste seul compteur de déplacements / tirage ; `WorldArea.encounters` contient seulement `randomEnabled` et au besoin les exceptions `checkDistance` (80–2000) et `chanceMultiplierPercent` (0–300). Pas de copie de profils par zone.
- **Héritage** : exception absente → règles mondiales. Action explicite « Hériter du monde » supprime les champs locaux ; l'export/import du WorldDocument sauvegarde exactement la sélection. Éditeurs Builder et Sculpt proposent les mêmes réglages, avec zone sélectionnée. Base calme des nouveaux documents : monde 300 points, chances 5–10 % selon terrain, routes 0 % ; un monde ancien configuré n'est pas modifié automatiquement ; bouton d'application globale volontaire disponible. Les créatures restent celles de Combat/Capture main et rareté intacte.
- **RED/critères** : test dédié `tests/encounter-global-calm-area-overrides.test.js` créé en premier (SHA `c8e694a1b52b7f67e86b932506aa33341c43f89c`) ; vérifier normalisation, sélection de zone, roundtrip, multiplicateur et UI. Reprendre CI complète + Chromium, corriger les quatre tests anciens en échec de PR315 sans supprimer les assertions de déplacements réels ; vérifier la séparation des sauvegardes et publication Pages.
- **Statut** : développement en branche, **pas encore GREEN**, aucune fusion sur PR329 ni publication V80/main. Garder PR315 historique pour traçabilité.

---

# Consolidation du Labo Exploration vers une version stable unifiée (1 novembre 2026)

- **Clarification utilisateur** : l'écran noir concerne le raccord GenSrpg, pas le Labo Exploration ; ne PAS intégrer PR327 dans le moteur Labo. Fermeture PR328 sans merge (prévisualisation inutile). La demande prioritaire du Labo était le terrain 16 niveaux sur cartes anciennes et les cascades sur eau.
- **Objectif** : une seule version officielle moderne remplace V80 après preuves, sans masquer les commandes ni inventer un deuxième WorldDocument, un deuxième catalogue Combat ou un second publisher.
- **Départ** : main `ba0701224b764f4c60d4294c9729a49ade5869ad`, checkpoint `checkpoint/exploration-unified-v80-replacement-start-2026-11-01`, branche `work/exploration-unified-main-v80-replacement-2026-11-01`.
- **Consolidation à deux parents** : commit `813cf8c0058e391cef080ba1c0846e1136fe92d6` conserve les 16 commits main récents (workflow, charte, tests, URLs) et apporte le code natif complet du SHA PR325 `d4b9d8c804e592392c5b7a2ec7cc2f160291a076` (lignée PR301, 313, 316, 318, 320, 325), exactement 52 chemins de code/tests modifiés. Aucune copie du correctif PR327. Les deux propriétaires des mêmes données ne sont pas lancés en parallèle.
- **Gates** : TDD RED pour la recette de publication stable, CI Node + Chromium du SHA consolidé, contrôle réel d'une ancienne carte de niveau 7 qui passe à 16, route sur pente non élargie, cascades eau, portes/intérieurs, round-trip sauvegarde, audio et raccord Combat main. Déploiement Pages et contrôle HTTPS exact puis validation mobile de la release complète.
- **Publication** : le seul workflow `.github/workflows/publish-v81-main.yml` doit faire du moteur source `main` la version canonique du site `/sculpt-lab.html` et du World Builder `/world-assembler.html`. V80 conserve le statut de checkpoint historique/retour arrière seulement, jamais autorité runtime. Les previews immuables ne sont pas la source du moteur canonique.
- **Statut** : candidat non validé ; ne pas déclarer GREEN, ne pas fusionner/promouvoir sur main avant les preuves complètes, et préserver les sauvegardes existantes. Les branches divergentes restantes font l'objet d'un audit de portée/validation avant toute prise en charge.

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
