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
