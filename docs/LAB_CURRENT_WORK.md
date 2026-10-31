# Lot régression — Forêt 1 : accès portes + intérieurs réellement indépendants (31 octobre 2026)

- **Signal utilisateur après PR #309/#310** : impossible d'entrer dans les maisons, et impression d'être contraint d'affecter un seul modèle d'intérieur à toutes. Cas reproductible avec les deux placements exacts issus du fichier utilisateur `foret_1` : bois/pierre 85 %, maison terre cuite vue côté 90 % rotation 9°. La carte personnelle n'est jamais importée dans le catalogue public ni remplacée.
- **Base / isolement** : PR #301 `32857faa8e9aec048167b15b119a04ed81164704` ; checkpoint `checkpoint/exploration-houses-entrance-start-2026-10-31` ; travail `work/exploration-houses-entrance-and-independent-rooms-2026-10-31` ; TDD RED `test/red-forest1-houses-entrances-room-independence-2026-10-31`.
- **Cause racine complémentaire constatée dans l'UI** : le bouton « créer/modifier intérieur » du panneau Objets continuait à utiliser `sculptInteriors`, stockage temporaire *standalone*, même lorsque `sculptWorldDraft` (WorldDocument canonique) était actif. Dans World Builder, il semblait créer un intérieur sans raccorder les vrais Portals, puis le mode Tester cherchait un autre graphe. Cette double voie est supprimée pour les mondes liés.
- **Revue de code PR #311 — correction de l'éditeur canonique** : le premier raccord chargeait la bonne WorldArea mais désactivait les anciens contrôles car `activeInteriorId` vaut null dans le World Builder. `currentInteriorAuthoringArea()` lit directement la vraie `sculptWorldDraft.areas[sculptWorldAreaId]` en mode monde ; dessin des murs, suppression, undo/redo, texture des murs et revêtement du sol modifient cette même WorldArea et sa seule sauvegarde. Les contrôles propres aux prototypes Sculpt (étages, forme, modèles, porte visuelle) sont masqués en mode World Builder jusqu'à raccordement canonique explicite, et non montrés comme actifs alors qu'ils ne fonctionnent pas. `#interior-area-bar` reste visible, de même que les outils fonctionnels des murs et du sol. Chromium parcourt l'intérieur d'une maison officielle, change son sol et la texture des murs, vérifie la sauvegarde WorldDocument, teste la navigation, puis revient à sa zone hôte. Pas de deuxième modèle persistant.
- **Raccord final** : dans World Builder, le bouton d'une maison sélectionnée suit son `Portal` `object-anchor` existant vers la `WorldArea` unique ; en absence de lien sur une maison nouvellement placée, `createBuildingInteriorLink` crée l'Area et les deux Portals directement dans ce `WorldDocument`. Un bouton « Retour à la carte de cette maison » revient par la même référence parent, après validation/sauvegarde. La liste de modèles Sculpt autonomes est masquée dans le World Builder afin de ne pas simuler un partage de modèle non pris en charge ; chaque pièce reste intégralement éditable séparément. Pas de mutation des données personnelles hors session.
- **Causes identifiées** : (1) `src/core/sculpt-preview-object-collisions.js` substituait silencieusement pour les bâtiments une petite ancienne empreinte `0,66×0,27` décalée `-0,13`, alors que le catalogue natif corrigé possède l'empreinte réelle `0,9×0,68` décalée `-0,34`. (2) Les nouvelles portes World Builder restaient à un rayon déclencheur 32, peu tolérant pour l'approche oblique ; portails anciens conservaient ce petit rayon dans le document local. (3) Dans le mode Sculpt autonome, le select `object-interior-template` conservait le choix de la maison précédente, et `openSelectedSculptInterior()` appliquait **implicitement** ce choix à une pièce déjà liée, écrasant son décor.
- **Correction aux autorités existantes** : (1) suppression de la seule redéfinition de collision bâtiment dans Sculpt, en utilisant `ObjectDefinition.footprint` directement ; arbres/rochers inchangés. (2) rayon canonique d'approche des portes 52 unités (identique à la porte autonome Sculpt), Spawn extérieur reste à +20 ; migration ciblée des `Portal` générés encore à 32 vers 52 lors de `importWorldBuilderDocument`, sans toucher à des Portals volontairement personnalisés. (3) le modèle facultatif ne s'applique que lors de la **création** d'une nouvelle pièce, la sélection se réinitialise en changeant de maison, et tout changement d'une pièce existante exige le bouton explicite `Appliquer` dans son éditeur.
- **Tests et preuves** : `tests/forest1-house-entrances-and-room-independence.test.js` : deux modèles, scale/rotation, empreintes identiques pour Sculpt/WorldArea, chemin accessible depuis 42 unités devant le seuil, rayon 52 et import/migration, deux Portal/WorldArea différents, aucun écrasement implicite de modèle. Régression Core + vrai Chromium sur le SHA exact et publication preview Pages PR #301. La charte exige encore essai tactile Pixel et feu vert utilisateur avant la promotion `main`/V80.
- **Hors périmètre** : aucun partage automatique de décoration, aucune réécriture des scènes personnelles, aucune modification des combats et aucun nouveau graphe Portal/Spawn, pas de publication sur `main`.

---

# Correctif de sûreté — Portals automatiques hérités vs action manuelle Sculpt (31 octobre 2026)

- **Constat d'usage utilisateur :** dans le test 2,5D Sculpt, l'entrée/sortie se valide avec le bouton « Entrer/Sortir ». Aucun risque de boucle automatique dans ce mode ; ne pas reculer le Spawn dans la route ni modifier son comportement manuel.
- **Revue PR #309 :** dans l'ancien runtime `src/main.js`, `applyTriggeredPortal()` détectait **automatiquement à chaque frame** les Portals. Un Spawn généré de retour à 20 unités, à l'intérieur d'un trigger d'entrée rayon 32, pouvait produire un renvoi immédiat.
- **Responsable** : garder le contrat canonique `Portal/Spawn`, préserver le seuil proche de la façade ; ajouter une barrière éphémère *automatique seulement* via `createAutomaticPortalTraversalGate()` dans le même `portal-model.js`. Après un passage auto, exiger une sortie physique des zones de détection avant d'autoriser une nouvelle entrée auto. Sans timer, sans deuxième géométrie ou état persisté, sans toucher au bouton Sculpt.
- **Preuves attendues** : test RED forêt `sculpt-object-141` avec rayon 32 et retour 20, re-détection d'entrée, sortie de zone et retour possible volontaire ; CI Core + Chromium sur SHA exact ; intégration à la PR #301 isolée seulement. Checkpoint départ `checkpoint/exploration-portal-reentry-start-2026-10-31`, branche `work/exploration-portal-reentry-2026-10-31`, RED `work/exploration-portal-reentry-red-2026-10-31`. Aucune modification de `main` ou du fichier personnel.

---

# Lot — Seuils de maisons 2,5D et collision selon leur taille (31 octobre 2026)

- **Cas utilisateur réel** : préset personnel inachevé `foret_1`, 80 × 60, 142 placements (128 pins, 11 rochers, 2 maisons, 1 escalier). Maison bois/pierre `sculpt-object-129` : scale 0,85, x780.49/y550.93. Maison terre cuite trois-quarts `sculpt-object-141` : scale 0,9, rotation 9°, x1507.58/y669.81. Ce fichier est une **fixture de référence locale**, jamais promu en préset intégré ni utilisé pour effacer le brouillon du joueur.
- **Signal** : détection de porte et retour au milieu de la route, impression de passer sous les maisons ; les `doorAnchors` des définitions prenaient Y=+0,38/0,46 de la hauteur visuelle depuis le pied tandis que Sculpt rend les maisons au-dessus de leur ancre ; les Spawns générés ajoutaient +72 unités. Les empreintes centrées vers le pied laissaient le mur arrière traversable.
- **Périmètre** : autorité native `ObjectDefinition.footprint` et `doorAnchors` (10 bâtiments) + seul `createBuildingInteriorLink` pour le décalage de sortie et migration des anciens retours générés. Aucun obstacle invisible supplémentaire, pas de clonage Portal/Spawn, pas de modifications Combat/GenSrpg, pas d'écriture dans la sauvegarde locale du téléphone.
- **Réglage** : empreinte solide orientée/scalée du bâtiment couvrant 90 % de la largeur et 68 % de la hauteur depuis le pied ; seuil à Y=.10 hauteur et décentré de X=-.10 largeur sur la terre cuite 3/4 ; nouvel offset de retour 20 unités. Migration uniquement si ancien Spawn `<buildingId>-return-<num>` + Portal aller-retour cohérent + `offset===72`. Tout autre retour personnalisé conserve son décalage.
- **Procédure** : START `checkpoint/exploration-building-thresholds-start-2026-10-31`, branche `work/exploration-building-thresholds-2026-10-31`; test RED `tests/forest1-building-door-and-collision.test.js`, branche de preuve `work/exploration-building-thresholds-red-2026-10-31`; test du vrai déplacement Collision World et import/export WorldDocument, sentinelles historiques maintenues.
- **Gate** : CI Core + Chromium sur SHA final, preview Pages isolée PR #301 puis validation tactile Pixel de la marche autour des murs, de la porte et du retour. Pas de GREEN final avant ce dernier retour.
- **Sauvegardes** : `WORLD_ASSEMBLER_DRAFT_KEY` persiste automatiquement le **monde entier** dans `localStorage`; `SCULPT_MAP_PRESET_KEY` contient les **cartes nommées** (relief/objets/texture) ; export `.world.json` conserve intérieurs/Portals/Spawns. Ne jamais remplacer silencieusement un monde local par un préset inachevé. Un éventuel assistant d'import explicite constitue un lot UI distinct.

---

# Lot UI — Masquer les réglages d'objets pendant la pose (31 octobre 2026)

- **Signal utilisateur / preuve :** capture réelle Pixel paysage, mode Objets, inspecteur droit « Escaliers » recouvrant des arbres et maisons de la forêt ; le toucher sous le panneau ne peut pas atteindre le canevas.
- **Base :** PR #301 `b6c21b65573e1d003d00d4895ca954b6c9ecce6d`; checkpoint START `checkpoint/exploration-object-panel-start-2026-10-31`; branche isolée `work/exploration-object-panel-collapse-2026-10-31`. `main` et V80 inchangés.
- **Propriétaire :** uniquement `sculpt-lab.html` (DOM/CSS de l'inspecteur Object Palette) et le probe existant dans `src/sculpt-lab-main.js` ; aucun modèle, Spawn/Portal, caméra, hitbox, ObjectDefinition, combat, sauvegarde ou asset modifié.
- **Comportement :** panneau Objet natif `details/summary` initialement ouvert, repliable en un petit onglet au même emplacement (sous Passages) ; réglages restent montés et inchangés, `objectEditing` et action de placement ne changent pas ; touche et clavier via `summary`. Repliement conservé lors du passage temporaire à Textures/Terre puis retour Objets.
- **RED :** `tests/sculpt-object-palette-collapse.test.js` exige le panneau repliable + présence unique des contrôles + état indépendant. **Chromium vrai** dans `scripts/smoke-sculpt-terrain-lab.mjs` : panneau réellement bloquant avant, `elementFromPoint` montre le canevas découvert après repli, pose par pointeur natif et undo, rouvrir conserve arbre/taille/mode.
- **Critères :** CI Core/Chromium GREEN sur SHA précis, déploiement HTTPS isolé PR #301 après intégration, puis essai tactile Pixel paysage réel par l'utilisateur. **Pas de checkpoint GREEN final** sans validation manuelle de l'ergonomie.

---

# Lot correctif — forêt dense, plafond 128 objets (31 octobre 2026)

- **Signal créateur :** `foret-1.map-preset.json`, relief 80 × 60, 128 placements natifs de `objectdef.tree.forest.pine_dense.01` ; impossible d'ajouter arbre/maison/objet #129. La sauvegarde n'était pas en cause.
- **Base :** PR #301 `9fc1cc58770e60eefc8795a78e373448364a744b` ; START `checkpoint/exploration-forest-density-start-2026-10-31` ; lot isolé `work/exploration-forest-density-2026-10-31`. Aucune mutation de la carte personnelle.
- **Cause racine :** `SCULPT_OBJECT_LIMIT=128` dans le seul `src/world/sculpt-scene-preview.js` limitait simultanément pose, normalisation, import et export ; message UI « Limite de 128 objets atteinte ». Le fichier partagé contenait exactement 128 arbres.
- **Correction :** budget de sécurité 2048 placements par scène, sans second modèle ni troncature silencieuse ; au-delà, erreur explicite à l'import/normalisation. La même limite est affichée dans l'éditeur ; le WorldDocument et les fichiers `.map-preset.json` réutilisent les contrôles canoniques. Le rendu met en cache la liste triée jusqu'à mutation réelle et écarte les objets hors écran avec marge conservative dans la projection caméra 2,5D ; aucun changement de collisions, mouvements ou hit tests.
- **TDD :** `tests/sculpt-dense-forest-object-budget.test.js` reproduit le 129e arbre, 513 arbres export/import du préset, sauvegarde WorldArea + WorldDocument 513 objets, et rejet explicite au-dessus du budget. Branche RED indépendante `test/red-forest-density-2026-10-31` au commit test initial `051d959d`.
- **Gates :** CI et vrai Chromium sur SHA exact, tests de rendu et confort Pixel paysage lors d'une forêt dense ; vérifier le chargement/sauvegarde du préset existant intact. Maintenir `main`, Combat main, la V80 stable et les huit présets standards inchangés. Livraison possible uniquement sur preview PR #301 après intégration du lot validé ; ne pas annoncer GREEN mobile avant retour utilisateur.

---

# Lot — Enregistrer, partager et importer ses présets sans JSON brut (31 octobre 2026)

- **Demande :** enregistrer un préset personnel simplement sur Pixel paysage, le retrouver dans World Builder, récupérer un vrai fichier transférable à ChatGPT et permettre son intégration ultérieure au catalogue officiel après réception et validation.
- **Base :** PR #301 `74f383475a1285c54c46a9a6f1141c0d4a2b5ce2`. Checkpoint START `checkpoint/exploration-preset-save-share-start-2026-10-31`. Branche `work/exploration-preset-save-share-2026-10-31`.
- **Autorité :** exclusivement `SCULPT_MAP_PRESET_KIND` v1, `saveSculptMapPreset`, `importSculptMapPreset` et `SCULPT_MAP_PRESET_KEY` ; pas de second inventaire, pas de WorldDocument dans les présets. Le World Builder demeure propriétaire des vrais passages, spawns et pièces.
- **UI :** une bibliothèque visible, nom lisible sans ID ni taille imposée ; sauvegarder en local, action explicite « Télécharger/Partager » du préset validé, fichier `.map-preset.json`, import simple depuis un fichier, compteur de cartes personnelles. Ne plus afficher des centaines de chiffres de terrain dans le chemin utilisateur ; conserver l'outil de diagnostic dans un volet avancé.
- **Protection des données :** jamais d'effacement par erreur ; remplacement d'un préset homonyme après confirmation ; import valide avant toute écriture ; fichier partageable même si le stockage local n'est pas disponible ; sauvegarde courante intacte lors de l'import d'un préset en bibliothèque.
- **Limites annoncées :** exporter un préset de carte (relief, texture, objets) n'est pas exporter un monde complet avec ses Portals, rencontres et intérieurs personnalisés. Pour cela, utiliser l'export WorldDocument existant.
- **Tests requis :** TDD RED des contrats de fichier, de la bibliothèque sur le même localStorage (éditeur et World Builder), remplacement explicite, import/export round trip, bouton mobile sans textarea, vrais tests Chromium du site, CI du SHA exact ; checkpoint GREEN uniquement après preuves et revue mobile.
- **Hors périmètre :** refonte du moteur, déplacement de Portal, changement de l'autorité de WorldDocument, retouche des présets générés, fusion main, changement Combat.

---

# Correctif — matériaux de sol isolés par Area (31 octobre 2026)

- **Signal utilisateur :** Area principale en herbe initialement, passage en montagne rocheuse, retour à Area principale qui affiche la roche. Les présets actuels ne sont pas à modifier : l'utilisateur créera ses propres modèles plus tard.
- **Base / travail :** `work/exploration-area-ground-material-isolation-2026-10-31` depuis `dfc17b6e5a5f448d89bc90a47a162414dfd3dae5` (PR #301). Checkpoint START `checkpoint/exploration-area-ground-material-start-2026-10-31`.
- **Cause constatée :** `#material` (choix « Sol réel ») ne modifiait que le bitmap affiché, pas `WorldSurface.baseMaterialId` sérialisé. L'éditeur lisait ensuite à nouveau la valeur DOM globale lors du montage d'une autre Area, introduisant une autorité visuelle transversale.
- **Correction cause racine :** `WorldSurface.baseMaterialId` est la seule source du matériau rendu ; le choix UI modifie cette valeur via `normalizeSculptSurface` + `surfaceCommit`, avec historique. Au montage de chaque Area, le sélecteur est restauré depuis `surface`. Les anciennes textures sont immédiatement désactivées avant chargement async de la suivante, avec révision anti-race et invalidation du raster existant.
- **Portée :** uniquement adaptation Sculpt rendu/éditeur ; modèles WorldArea/Portals/Spawn, rencontres, Combat, cartes utilisateur, présets, échelle de terrain, caméra, `main` et V80 inchangés.
- **TDD :** sentinelle vrai Chromium `scripts/smoke-sculpt-terrain-lab.mjs` (choix de roche → sauvegarde → réouverture → choix d'herbe → sauvegarde → réouverture), et test du vrai modèle avec Portals A→B→A et JSON `tests/world-area-ground-material-isolation.test.js`.
- **Validation finale requise :** CI Node + Chromium du SHA corrigé, puis vérification de publication isolée `/preview/rich-presets-pr301/` et essai utilisateur Pixel paysage. Ne pas annoncer GREEN final ni fusionner main avant ces contrôles.

---

# QA intégrée — World Builder mobile, liaisons A/B et audio (30 octobre 2026)

- **Branche QA :** `work/exploration-three-fixes-qa-2026-10-30` issue de PR #301 `a7a100f545ef1f7930c7c1185a0767a207b85435`. Les lots distincts #302, #303 et #304 sont copiés dans un état de test combiné, jamais dans main.
- **Propriétaires inchangés :** WorldDocument/Portal/Spawn unique, musique Exploration unique, Combat et sons Combat depuis son main.
- **Zones :** A sortie → B entrée, B entrée → A sortie, B sortie → C entrée ; Spawn d'arrivée sur la vraie route, sans rebond.
- **Mobile :** graphe central pleine largeur, panneaux Zones/Détails officiels repliables en mode paysage.
- **Audio :** fondu Exploration 600 ms vers Combat, reprise douce 900 ms après le résultat, même MP3 ; jingles futurs non fournis, trois emplacements vides.
- **Gates :** Core + Chromium au SHA combiné, assemblage et HTTPS, test tactile Pixel. Ne pas annoncer GREEN final ni promouvoir main avant validation.
- **Provenance :** #302 `0bac823af3025467e04be61aef19148e436b9b07`, #303 `9b1944d910fc6a52b80c0331bb46753766e62c41`, #304 `35a843466fb5a0b333bf9c33bbdcf3791e381700`.
- **Gel :** main/V80/Combat main inchangés ; sauvegardes et intérieurs conservés.

---

# Lot — Présets 2,5D riches, villages et paysages (30 octobre 2026)

- **Branche isolée :** `work/exploration-rich-village-landscapes-2026-10-30`.
- **Départ :** `main@474aa42674c9bd976a8a5a8af684d65cbe848b61` ; checkpoint START `checkpoint/exploration-rich-village-landscapes-start-2026-10-30`.
- **Signal utilisateur :** huit présets existants trop vides, trop peu de maisons, aucune cascade ni pont ; attentes : villages et paysages 2,5D plus riches, entrées de maisons avec véritables intérieurs.
- **Autorité :** présets natifs `src/builder/sculpt-builtin-map-presets.js`, aucun moteur secondaire de WorldArea, WorldDocument, collision, rendu, Portals, rencontres ou Combat.
- **Périmètre réalisé :** huit présets et IDs préservés ; 38 bâtiments dont auberges, étangs et plans d'eau sur les huit biomes, 7 ponts 2,5D et 7 cascades animées provenant des assets existants. Accès maisons/berges par les outils WorldSurface officiels ; instanciation par WorldArea et intérieurs liés indépendants via `createBuildingInteriorLink`.
- **Invariants protégés :** Spawn et Portal du WorldDocument, routes de bord à bord et collisions conservés, catalogues et bibliothèque personnalisée inchangés, V80 gelée, moteur Combat exclusivement depuis son main.
- **TDD RED puis correctifs cause racine :** `41103645764` : absence de densité sur les anciennes cartes ; `41104910246` : chemin de la clairière coupé par un étang ; `41105455220` : collision d'un pont avec l'accès principal. Corrigés par le placement des éléments et l'orientation des ponts, **sans** toucher au propriétaire des collisions.
- **Contrôles CI du commit `6028678ac19bb851e1be0054157b6a01ad27e2a8` :** `Exploration CI #41105841823` **SUCCESS** (`core-tests` : 921 tests, 0 échec ; `modern-combat-encounter` : vrais Chromium GREEN), `publish-v81-main.yml #41105841826` **SUCCESS** (`detect-upstream` + `verify-and-assemble` verts). Le job `deploy` est **skipped** sur PR, sans modification de la production.
- **Reste à valider :** rendu esthétique réel de chaque préset et confort/performance sur Pixel paysage, entrées/sorties des maisons, ponts/cascades, import/export et absence de blocage tactile. La CI n'est pas une validation manuelle. PR #301 reste **draft**, pas de checkpoint final GREEN et pas de fusion `main` avant validation de ce jalon.
- **Hors périmètre :** nouvelles images, nouvelles règles de rencontre, refonte relief, second publisher ou modification de GenSrpg/Combat.
- **Prochaine étape autorisée :** fournir une prévisualisation isolée réellement testable sans déroger à l'autorité Pages unique, puis recueillir la validation mobile. Si la preview nécessite une promotion, demander explicitement son feu vert au lieu de contourner le workflow.


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
