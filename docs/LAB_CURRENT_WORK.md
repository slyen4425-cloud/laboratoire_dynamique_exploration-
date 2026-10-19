# Lot actif — 19/10/2026 — V37 vraie arête arrière des collines, liseré manquant

- **Retour créateur / diagnostic réel :** la capture smartphone de V36 ne permet toujours pas de lire la séparation du haut de la colline avec l'herbe derrière. Les tests V35/V36 mesuraient uniquement un liseré **sud** ; `drawSculptGroundReliefLighting` n'implémentait effectivement que les orientations sud et est, alors que `sculptGroundReliefLighting` donne aussi les bords nord et ouest. Ces arêtes arrière/latérales réelles restaient non dessinées.
- **Base technique :** V36 source publiée `682b3958412a66b1ef924daa7aaeaff941c6d7aa`, [CI source verte #39291173873](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39291173873), [Pages verte #39291544230](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39291544230) ; checkpoint de départ `checkpoint/exploration-start-sculpt-rear-rim-v37-2026-10-19`, branche `work/exploration-sculpt-rear-rim-v37-2026-10-19`.
- **Propriétaire / périmètre :** renderer `src/render/sculpt-height-renderer.js`. Compléter le liseré sombre **sur les bords nord et ouest** de la tuile supérieure au voisinage d'un véritable sol sec plus bas, sans changer les bords sud/est V36. Tests Chromium du Canvas pour le bord arrière, le côté gauche, un plateau uniforme (pas de fausse ligne) et l'eau (pas d'arête). Seule l'autorité existante `exposedEdges` décide de ce qui doit être dessiné.
- **Fraîcheur du correctif sur téléphone :** la page utilise encore `sculpt-brush-shapes-v31` comme révision de chargement et le renderer est importé sans paramètre de version. Mettre à jour **uniquement les URLs de module de cette page Sculpture** (`sculpt-lab.html`, import renderer de `src/sculpt-lab-main.js`) avec une révision V37 fixe afin que la publication ne serve pas le code V36 encore conservé dans le cache navigateur. Aucune modification métier de l'UI ; le reste des imports et les autres pages restent gelés.
- **Gel / exclusions :** géométrie du terrain, hauteur, eau, écume, roches et leurs ombres, couches terrain, matériaux/textures, collisions, gameplay, pinceaux, contrôles, zoom/navigation, acteurs, Builder, Combat et GenSrpG ; **aucune génération d'image**. Comparaison de la vraie vue de dessus avec la référence trois-quarts enregistrée comme **futur chantier séparé** (projection/caméra puis matériaux des faces rocheuses), sans modifier la projection dans ce lot.
- **Critères :** liseré lisible sur chaque côté en cas de vrai décroché sec, cohérent avec la texture, aucun trait sur un terrain plat ou une cellule mouillée, pas de bord artificiel entre deux cases d'égale altitude. Tests Node, vrai rendu Chromium, CI et déploiement Pages sur SHA épinglé avant validation visuelle mobile.
- **Statut :** en cours, **non GREEN créateur**.

---

# Lot actif — 19/10/2026 — V36 lisibilité renforcée de l'arête supérieure des collines

- **Signal utilisateur :** capture de la preview Labo Sculpture montrant un dessus de colline en herbe encore peu distinguable du sol vert derrière, bien que les parois et leurs ombres soient satisfaisantes. La V35, publiée et testée en Chromium, possède déjà une lèvre sombre mais trop faible en pratique.
- **Base immuable :** V35 source `d22a538b65cbe2cbead38f239f413c8b59397bea` ; CI [39279724144](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39279724144) SUCCESS ; Pages [39286835566](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39286835566) SUCCESS ; checkpoint départ `checkpoint/exploration-start-sculpt-upper-rim-contrast-v36-2026-10-19` ; travail `work/exploration-sculpt-upper-rim-contrast-v36-2026-10-19`.
- **Propriétaire / périmètre :** exclusivement renderer Sculpture (`drawSculptGroundReliefLighting` dans `src/render/sculpt-height-renderer.js`), avec renforcement mesuré du filet assombri et de son fondu **dans la tuile supérieure**, seulement en présence d'un vrai voisin sec plus bas (`sculptGroundReliefLighting().exposedEdges`). Sentinelle pixel Chromium dans `scripts/smoke-sculpt-terrain-lab.mjs` ; documentation du lot.
- **Invariant gelé :** conserver les pixels des parois rocheuses et leurs ombres existantes, le matériau/texture herbe, les dalles d'altitude égale, les transitions eau/terre/écume, le modèle des hauteurs, les collisions et la navigation, les pinceaux, les assets, l'UI, les acteurs, les sauvegardes, les autres laboratoires et GenSrpG. Aucune géométrie/autorité gameplay ajoutée.
- **Validation attendue :** terrain plat sans faux trait, vrai rebord sud visiblement assombri, préservation eau et peinture ; tests Node + navigateur Chromium réel, CI verte, preview épinglée et validation esthétique sur téléphone **avant GREEN créateur**.
- **Risques / rollback :** contour trop marqué sur certains zooms ou textures ; éviter un trait noir dur, privilégier une bande courte et dégradée ; rollback exact sur V35.
- **Statut :** lot ouvert, en cours de réalisation.

---

# Lot actif — 19/10/2026 — V35 assombrissement discret de la lèvre supérieure des creux

- **Retour validé du créateur :** l'ombrage général du relief V34 rend bien. Il souhaite seulement que la **bordure juste avant le creux**, sur le dessus de la terre haute, soit un peu plus foncée. Il n'a jamais demandé une génération d'image.
- **Diagnostic :** le renderer V34 `drawSculptGroundReliefLighting` calcule déjà `exposedEdges` à partir de `sculptHeightAt` ; mais dessine une lèvre **claire** (blanc jaunâtre) au sud et à l'est. L'inverser en un fin filet sombre avec une légère pénombre de 2-3 pixels à l'intérieur est purement esthétique et non géométrique.
- **Base immuable CI + Pages :** V34 source `8e323a91850bc74031728e00c10a6b1aa3f8a8df`, CI [39274050150](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39274050150) SUCCESS, Pages [39274138608](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39274138608) SUCCESS ; checkpoint START `checkpoint/exploration-start-sculpt-dark-upper-lip-v35-2026-10-19` ; branch `work/exploration-sculpt-dark-upper-lip-v35-2026-10-19`.
- **Périmètre/propriétaire :** uniquement `src/render/sculpt-height-renderer.js`, rendu visuel du dessus des cases sèches `drawSculptGroundReliefLighting`. Réutiliser `sculptGroundReliefLighting` et ses exposedEdges existants ; remplacer le trait clair au bord de plateau haut par le trait sombre léger et fondu, dessin limité à l'intérieur de la même tuile, le reste de l'ombre V34 inchangé.
- **Invariants gelés :** niveaux et eau, créateur de scène, `sculptHeightAt`, `sculptFaces`, collisions/stepMovement/hauteur et caméra V21-V29, écume V28/V33, pinceaux V31, objets/acteurs, UI et panneaux flottants, WorldSurface, Asset Loader, Builder/Combat, sauvegardes.
- **Tests :** V34 pure geometry tests unchanged, nouveau test pixels Canvas Chromium visible sur plateau et sol plat, vraie CI Node + navigateur et non-régressions ; publication seulement CI GREEN sur source SHA verrouillé. L'intensité de la lèvre attend validation esthétique smartphone.
- **Risques :** trait trop visible à grande échelle, effets de bord entre zones peintes ; opacité faible et contour strictement aux véritables marches sèches, rollback V34 disponible.
- **Statut :** V35 en développement.

---

# Lot actif — 19/10/2026 — V34 lisibilité des hauteurs du sol sans changer la texture

- **Retour du créateur (avec capture) :** le sol sculpté en herbe manque de profondeur lisible : hauteurs voisines semblent identiques ; il souhaite une petite ombre au contact ou un léger dégradé, **dans le vrai éditeur**, surtout pas d'image générée.
- **Base réelle GREEN publiée :** V33 `4b66b9f362d8c194146314c89fc5e05e0e1144a6`, CI [39250930918](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39250930918) SUCCESS, Pages [39251034944](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39251034944) SUCCESS ; START `checkpoint/exploration-start-sculpt-ground-depth-v34-2026-10-19`, work `work/exploration-sculpt-ground-depth-v34-2026-10-19`. PR infra #167 en cours de validation, ne pas confondre avec la version Pages effectivement épinglée.
- **Contrat / propriétaire :** uniquement rendu du **dessus des cases** dans `src/render/sculpt-height-renderer.js` qui lit les hauteurs canoniques du heightfield : nuance colorimétrique très discrète par altitude, ombrage de contact localisé **sur une case sèche plus basse** au contact d'une case plus haute (nord/sud/est/ouest), ombre dégradée et limité dans la cellule pour ne pas générer de fausses arêtes. Texture et matériaux originaux conservés sans transformation du sprite.
- **Gels :** pas de création d'image/asset, pas de deuxième moteur, aucune modification de terrain, pinceaux V31, WorldSurface, eau+écume V33, Renderer de roche et contact, navigation/collision/sauts, actifs Capture et panneaux flottants, Builder/Combat.
- **Tests :** fonctions d'éclairage pur vérifier terrain plat -> aucune ombre, élévation locale -> ombre uniquement coté bas, pas d'ombre sur eau et pas de teinte démesurée ; vrai Chromium rendu du relief, tests CI sentinelles, contrôle publication avant smartphone. Comparaison esthétique réelle attendue.
- **Risques / retour arrière :** dégradé trop voyant ou perf éditeur (pas de redraw supplémentaire par frame) ; pilot V33 rollback direct.
- **Statut :** tests Node et Chromium réels réussis [39273539400](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39273539400) au commit `c4272ea60bb11e5da75b7a0c6254822296c7ca1b` (palette herbe inchangée, ombre au contact d'un vrai relief, eau/terre et vieux outils vérifiés). Prévalidation technique, publication à réaliser avec pin immuable et validation esthétique smartphone encore nécessaire.

---

# Lot actif — 19/10/2026 — V33 régression eau-terre après nouveau pinceau (reprise du screenshot créateur)

- **Échec validation utilisateur V32 :** image créateur 19/10 09:42 : eau déplacée après sculpture du sol carré, bandes bleues verticales sous l'eau et éclats rocheux flottants. V32 prévalidation `69ebbc0f79fc1deadffee1e66eafd902aee43ec0`, CI [39223049526](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39223049526) SUCCESS, mais ***NON VALIDÉE par le créateur*** malgré publication via PR #165/Pages [39223128981](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39223128981).
- **Base et garde-fou :** départ `checkpoint/exploration-start-sculpt-water-land-seams-v33-2026-10-19` et travail `work/exploration-sculpt-water-land-seams-v33-2026-10-19` sur V32 ; **une seule autorité physique** : `sculptWaterAt` et Collision World, le renderer ne définit aucune traversée. Ne pas retoucher vitesse/zoom/caméra, pinceaux V31, écume, placements MapActor, Builder, gameplay Combat, outils flottants.
- **Cause démontrable :** `drawWaterVolume` dessine une `visibleWall` à chaque fois qu'une cellule d'eau surplombe le terrain *sec* au sud ; cela peint un rectangle d'eau suspendu devant de la terre, alors que ce bord est une **berge** et non une chute entre deux cellules réellement mouillées. `sculptRockToeSegments` filtrait la case sous la paroi mais non l'immersion du segment rocheux lui-même, laissant des dalles rocailleuses isolées post-compositing.
- **Contrat correctif :** paroi d'eau verticale uniquement entre cellules voisines **toutes deux immergées**, lorsque leur **surface absolue** diffère, jamais vers une berge sèche ; écume déterministe d'origine préservée sur contacts sec/mouillé ; un pied de falaise ne se dessine pas dans une cellule immergée ni dans la cellule humide en contrebas. Pas d'ajustement artificiel des hauteurs canonique : si une vraie différence > maxStep reste bloquante, le signaler.
- **Tests :** Node invariants bords eau/terre, interpolation d'élévation et clipping pied roche ; Chromium réel : poser sol, déplacer eau avec pinceau carré, sauvegarde JSON et rendu sans bande bleue suspendue, rejouer sentinelles V21/V31/V32, CI GREEN ; capture visuelle smartphone demandée avant GREEN utilisateur.
- **Risques/rollback :** scènes existantes non modifiées ; seulement projection 2.5D, rollback checkpoint V31/V32 si la côte paraît vide. **Statut :** CI complète **SUCCESS** [39250617652](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39250617652) sur source `380bf9885d693ea4e025a8c6c3aaa4d02a1b55c1` : Node, vraie page Chromium avec rendu pixel et scénarios de pinceau carré/pose d'eau/déplacement d'eau, Builder et Combat. Ancien test intermédiaire rouge [39250415853] corrigé immédiatement avant ce GREEN ; publication prévalidation à effectuer, validation réelle smartphone en attente.

---

# Lot actif — 19/10/2026 — V32 raccords rocheux sans débordement

- **Retour :** petites arêtes/artefacts lors du raccord entre cases de sol sculptées, gêne visuelle pouvant laisser croire à une collision invisible. Diagnostic de code V30 : `rockFace` déborde volontairement de la largeur de sa paroi via `toe` ; les parements `east` commencent 3 pixels avant le bord et s'étendent 4.5 pixels, donc recouvrent les cases voisines malgré la grille canonique. De plus les pieds `deferredToes` se projettent jusqu'à 15 pixels sur les zones en contrebas ; V28 prévient déjà leur dessin au-dessus de l'eau.
- **Base :** V31 source `f42ef16ed17b9916d465928b38116f2273bd7c65` CI [39222163358](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39222163358) SUCCESS, checkpoint `checkpoint/exploration-sculpt-brush-shapes-v31-prevalidation-2026-10-19`. START `checkpoint/exploration-start-sculpt-rock-seams-v32-2026-10-19`, branche `work/exploration-sculpt-rock-seams-v32-2026-10-19`.
- **Périmètre / propriétaire :** uniquement renderer de `sculpt-height-renderer.js` ; clips au rectangle exact de paroi pour empêcher le débordement rocheux sur des cases non concernées, bords est contenus dans leur colonne, pieds au sol raccourcis pour éviter les pointes ; maintenir l'écume, le rendu eau et les zones peintes.
- **Invariant critique :** ne jamais changer `sculptHeightAt`, `stepMovement`, Collision World ni seuil maxStepUp/Down pour cacher les rochers : les vraies parois de deux niveaux restent volontairement bloquantes. La forme carrée V31 permet des bords réguliers, et le pinceau Lisser existant traite les anciennes bosses.
- **Tests :** CI complète Node + vrai Chromium en conservant V28 berges, V31 formes et fonctionnalité de navigation ; vérifier screenshot créateur sur preview (acceptation smartphone).
- **Risque :** une découpe stricte peut rendre l'extrémité de falaise plus anguleuse ; petits pieds réservés aux contacts secs ; rollback V31. **Statut :** source V32 `e1b526d12c637ddc5e786deb204136792c7fb018` CI [39222767835](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39222767835) **SUCCESS**, incluant tests de géométrie, terrain, Collision World, MapActor et navigateur Chromium. Prévalidation technique seulement : contrôle visuel et du ressenti de passage demandé au créateur avant GREEN utilisateur. Le blocage d'une véritable marche supérieure à `maxStepUp` reste une règle de gameplay voulue.
---
# Lot V31 — choix de forme de pinceau (prévalidation technique réussie)

- CI [39222163358](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39222163358) SUCCESS. Formes rond, carré plein, croix reliées aux empreintes terre/eau et prévisualisation. Validation smartphone en attente.

---

# Lot actif — 19/10/2026 — V31 pinceaux carrés, ronds et en croix

- **Demande créateur :** pinceau rond actuel pixellisé/croix avec excroissances, voudrait explicitement carrés pleins (uniquement cases entières), ronds, croix et choix de forme, avec prévisualisation réelle.
- **Base CI+Pages :** V30 source `406eea79b15f9b5cbc8edef8ebc2b8d7455fff40` CI [39206219779](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39206219779) SUCCESS, Pages [39206376270](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39206376270) SUCCESS, checkpoint `checkpoint/exploration-sculpt-capture-actor-v30-prevalidation-2026-10-19`. START `checkpoint/exploration-start-sculpt-brush-shapes-v31-2026-10-19`; branche `work/exploration-sculpt-brush-shapes-v31-2026-10-19`.
- **Périmètre :** une autorité pure `footprintWeights` dans `sculpt-height-model.js` consommée par effets terre, eau et **aperçu**, forme `circle` (historique compatible), `square` (bloc carré plein de cases, sans diagonales) ou `cross` (axes seuls); sélection visible et persistante en session (non sauvegardée dans données de carte). Geler données terrain version1, histoire undo/redo et contrats collision.
- **Tests :** unitaires formes et identité preview/application réel, eau protégée, vieux defaults et tailles fractionnaires, navigateur Chromium mobile et CI. Vérifier zoom/immersive/perf/panels, aucune mutation hors labo.
- **Hors périmètre :** artefacts de transition rocheuse et nav = lot ultérieur rendu/collision, sans masquer un blocage gameplay réel ; textures WorldSurface et objets intactes.
- **Statut :** démarrage. 

---

# Lot actif — 19/10/2026 — V30 raccord des placements Map Actor comme le premier Builder

- **Retour créateur :** « On peut raccorder les acteurs comme dans première version ? ». Contrat déjà disponible : Builder dynamique `createCaptureActorPreviewProviderV1` -> `createMapActorAssetResolver` -> `createImageAssetLoader` -> `createMapActorVisualPreparer` -> `createMapActorRenderer`, placement natif `WorldActorPlacement v1`. Les assets publiés proviennent des checkouts officiels Combat et Capture du workflow Pages.
- **Base GREEN CI :** V29 `208a4c3978302404f56fa72198c9d159058f9d58`, [39205007907](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39205007907) SUCCESS, checkpoint `checkpoint/exploration-sculpt-smooth-step-v29-prevalidation-2026-10-19`; publication isolée PR #163. START `checkpoint/exploration-start-sculpt-capture-actor-v30-2026-10-19`, branche `work/exploration-sculpt-capture-actor-v30-2026-10-19`.
- **Périmètre / propriétaires :** dans le pilote sculpté, palette flottante « Acteurs » pour choisir une **définition du catalogue Capture disponible** (actuellement showcase Loup), placer/supprimer ses références `WorldActorPlacement v1` sur la surface, miroir gauche/droite et affichage idle par **MapActorRenderer natif**. Les réglages visuels intrinsèques restent propriété de la définition Capture, pas de ce Builder. Le JSON `sculpt-preview-scene v1` conserve un champ `actors` facultatif sans changement de version et sans altérer anciens exports; `Nouvelle carte` efface aussi les références acteur.
- **Hors lot :** générateur IA de PNJ, déplacement autonome des créatures, comportement Combat, raccord exhaustif des créatures GenSrpG, éditeur intrinsèque de MapActor ; pas de nouvelle collision. Le personnage de navigation et ses paramètres validés restent inchangés.
- **Tests :** Node placement v1 normalisé + scène roundtrip ancienne/nouvelle ; Chromium chargement réels assets du catalogue de démonstration, place/efface, undo/redo et export/import ; CI sentinelles et preview sur GitHub Pages réelle. Si catalogue indisponible, panneau acteur explicitement indisponible, aucun fallback visuel mensonger.
- **Risques :** capture-assets et combat-preview ne sont pas dans le dépôt pilote mais disponibles sur Pages ; tests navigateur des assets via workflow Preview obligatoire, et aucune prévalidation publique sans assets vérifiés.
- **Statut :** tests complets Node/Chromium/Builder/Combat **SUCCESS** [39206102863](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39206102863), code `0d2ece36c04544efe21e01a5e58c0c9818ab61f0`. Le catalogue source a été contrôlé au SHA Capture épinglé : Loup volcanique, asset WebP de 27 384 octets présent au chemin déclaré. Checkpoint V30 et Pages à publier en prévalidation. Test visuel smartphone requis, pas encore GREEN utilisateur; le catalogue complet des créatures GenSrpG n'est pas branché.

---

# Lot actif — 19/10/2026 — V29 adoucir les franchissements de petites hauteurs en navigation

- **Signalement smartphone :** saccade occasionnelle surtout au passage d'une petite marche, bien que la vitesse et la caméra générales aient été validées V21. Analyse : `navHeight()` retourne le niveau de cellule immédiatement (0–7) et est soustrait d'un coup (`*rise=18`) dans le dessin du héros ET la position cible panY ; traverser une frontière de cellule crée donc un saut visuel d'au moins 18 unités malgré un FPS stable.
- **Base :** V28 source `3a97cfb76afcceeb3fb94feaae9ab091f4028a20`, CI [39204482422](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39204482422) SUCCESS, checkpoint `checkpoint/exploration-sculpt-shore-foam-v28-prevalidation-2026-10-19`. START `checkpoint/exploration-start-sculpt-smooth-step-v29-2026-10-19`, branche `work/exploration-sculpt-smooth-step-v29-2026-10-19`.
- **Propriétaire unique :** adapter de rendu du pilote ; calcul pur `sculptVisualHeightStep` avec durée d'amortissement fixée, application à l'ancrage visuel et suivi caméra (même hauteur visuelle). `stepMovement` et Collision World restent les seuls responsables de x/y, vitesse, franchissement et collision ; aucune interpolation dans l'état de navigation canonique. Repainting uniquement tant que niveau visuel converge.
- **Gels :** V21 comportement joystick/vitesse/caméra horizontale et zoom, V22 collisions, V26 MapActor idle, V27 panneaux/peinture, V28 rendu eau/écume, Builder et Combat ; aucun changement des contrôles utilisateur.
- **Tests :** échantillons de step 16/30/190ms, convergence monotone et sans overshoot, absence de changement de niveau sur terrain plat, CI Node + Chromium terrain/collision/navigation.
- **Risque :** amortissement trop visible sur transitions rapides ; à ajuster après validation utilisateur ; rollback V28.
- **Statut :** CI [39204818306](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39204818306) **SUCCESS** sur source `7c8d1065aea686b9abc349292ad0cef8e1a4ed37` ; checkpoint technique et publication prévalidation à finaliser. Validation smartphone de la sensation de passage d'une marche attendue.

---

# Lot actif — 19/10/2026 — V28 raccords visuels eau/roche et écume

- **Retour smartphone du créateur :** capture V27 : mer peinte puis sculpture terre, berges très carrées et petites excroissances de roche semblant flotter à la surface ; demande d'écume légère contre les rochers. Panneaux flottants et repliables appréciés : totalement gelés.
- **Base :** V27 `0fb3d577dc9188dd8412f6293b664088ce333e73`, CI [39168433703](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39168433703) SUCCESS, preview [39168475354](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39168475354) SUCCESS, checkpoint `checkpoint/exploration-sculpt-surface-paint-v27-prevalidation-2026-10-18`. START `checkpoint/exploration-start-sculpt-shore-foam-v28-2026-10-19` ; branche `work/exploration-sculpt-shore-foam-v28-2026-10-19`.
- **Périmètre / autorité :** uniquement le renderer 2.5D `sculpt-height-renderer.js`. Le `sculptWaterAt` canonique détermine les contacts mouillés secs ; supprimer les protrusions `deferredToes` lorsqu'elles peignent sur la cellule mouillée en contrebas, conserver les pieds rocheux devant terrain sec ; bord mousse/écume légère anti-crénelage aux quatre contacts eau/terre, dessin déterministe, couches limitées. Pas d'asset ajouté, pas d'autorité de collision ou de passage.
- **Gels :** heightfield/eau, WorldSurface/materials, Navigation V21/V26 et performance, collision V22, objects V23, panneaux/pinceaux V27, Builder/Combat/GenSrpG et sauvegardes. Aucun déplacement de textures, aucun changement de logique gameplay.
- **Tests :** tests purs des segments de roche secs et contacts mouillé/sec ; validation visuelle Chromium mobile en carte créée, eau peinte puis relief, capture, CI sentinelles complètes ; validation finale esthétique créateur requise.
- **Autres demandes reçues (lots distincts) :** micro-saccade quand l'acteur franchit une marche, à diagnostiquer mesure FPS/caméra/hauteur sans toucher à la vitesse ; raccord des acteurs depuis la première version via contrat MapActor définitions et placements, sans recopier l'éditeur d'acteur intrinsèque.
- **Risques :** effet visuel trop dense ou coût des parcours ; contour purement cosmétique sur cases d'eau, les limites géométriques restent discrétisées. Rollback V27.
- **Statut :** CI V28 [39204482422](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39204482422) **SUCCESS** sur `3a97cfb76afcceeb3fb94feaae9ab091f4028a20`, checkpoint `checkpoint/exploration-sculpt-shore-foam-v28-prevalidation-2026-10-19`. En attente d'avis visuel smartphone.

---

# Lot actif — 18/10/2026 — V27 pinceau de vraies routes et zones peintes

- **Demande :** ancienne carte vierge conservait une fausse route ; absence de pinceau pour peindre les routes et une texture différente sur l'herbe (fleurs/détails plus tard). La route décorative est corrigée dans V25 ; l'idle/marche native est raccordée dans V26.
- **Base :** V26 source `83b3e8ade681529fe9532831732fa2157db15901`, CI [39167488794](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39167488794) SUCCESS, checkpoint `checkpoint/exploration-sculpt-native-actor-motion-v26-prevalidation-2026-10-18`. START `checkpoint/exploration-start-sculpt-surface-paint-v27-2026-10-18`, branche `work/exploration-sculpt-surface-paint-v27-2026-10-18`.
- **Périmètre et autorité :** `normalizeWorldSurface` reste **unique autorité** des géométries de route (`routes[]`), zones (`zones[]`) et matériaux sémantiques. Un petit adapter exclusif au labo sculptable permet d'ajouter/retirer des strokes WorldSurface v3 et les range dans `sculpt-preview-scene` v1, propriété facultative `surface`. Le type enregistré est réutilisable par WorldDocument mais ce prototype **n'est pas le Builder canonique**. Aucune route fictive dérivée d'une texture. Le rendu sur hauteur 2,5D consomme le matériau via Material Registry et Asset Adapter, sans influer sur les collisions; les futures fleurs sont des decals, pas un nouveau sol.
- **UX :** palette `🎨 Textures` visible aussi smartphone : route de terre, herbe, terre forestière, sable, neige, sol rocheux ; largeur de tracé, effacer au toucher, annuler/rétablir, aperçu pendant le geste ; JSON scène exporte/réimporte les features avec validations. `Nouvelle carte` efface routes/zones, sans altérer les formats anciens. La bande `Route exemple` reste uniquement visuelle sur la carte de démonstration et désactivée sur carte vierge/importée.
- **Gels :** V21 caméra/vitesse/performance validés, V22 collisions/eau, V23 objets/visuels, V24 New Map, V26 MapActor natif, Builder/WorldDocument existants, Combat/Encounter, matériaux/images officiels, aucune intervention dans main code fonctionnel.
- **Tests :** Node normalisation native et roundtrip, invalides protégés ; Chromium smartphone événements souris réels, zone et route visibles avec assets natifs, undo/redo, export/import et nouvelle carte sans anciennes textures ; full CI sentinelles et règles de gouvernance. Vérification esthétique/tactile manuelle du créateur attendue.
- **Risques / rollback :** rendu raster des strokes 2.5D et mapping terrain/perspective encore expérimentaux ; limites 80 features, 512 points/tracé pour préservation performance. Le passage de route sur un obstacle n'implique pas autorisation de traverser une falaise ; Collision World reste propriétaire. V26 checkpoint demeure rollback.
- **Statut :** prévalidation CI V27 du SHA final en cours ; pas de publication si rouge.

---

# Lot actif — 18/10/2026 — V26 rétablir idle/marche sur avatar de navigation sculpté

- **Retour :** déplacement du héros dans labo sculpture ressemble à du glissement, pas d'idle ni de marche simulée contrairement au moteur précédent.
- **Base :** V25 `237974a489a1d1c1f9c05fefdb770474a3c09753` (CI [39167226760](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39167226760) SUCCESS), START `checkpoint/exploration-start-sculpt-native-actor-motion-v26-2026-10-18`, work `work/exploration-sculpt-native-actor-motion-v26-2026-10-18`.
- **Cause :** labo sculpté dessinait un SVG fixe à x/y, tandis que le moteur officiel possède déjà `normalizeMapActorVisual`, `createMapActorVisualPreparer` et `createMapActorRenderer` (ancre, miroir, ombre, idleAmplitude/Frequency, walkAmplitude/Frequency).
- **Implémentation :** réutilisation exclusive des trois composants natifs ; sprite préparé une fois à l'onload ; mouvement visuel idle/marche piloté par `navActor.moving` du vrai `stepMovement`; repaint idle 18fps environ, marche 30fps environ, terrain toujours mis en cache. Aucun nouveau contrat d'animation, ni modification de vitesse, entrée clavier/joystick, collisions, caméra ou objet.
- **Tests :** Chromium vrai viewport : visage natif chargé, horloge idle après départ, marche durant la touche, retour idle après relâchement, V21 smartphone jank et V24 carte vierge, CI tous domaines. Le rythme exact et sensation esthétique restent soumis à validation utilisateur.
- **Hors lot :** pinceau de textures et véritables routes/zones doit réutiliser le modèle `WorldSurface`, éviter la création d'un deuxième modèle de monde. Le SVG seul ne fournit pas un vrai sprite sheet de pas.
- **Statut :** CI du SHA final à vérifier avant publication.

---

# Lot actif — 18/10/2026 — V25 corriger la route de démonstration sur une carte vierge

- **Retour utilisateur :** V24 « Nouvelle carte » laisse une route visible. Source du défaut : `SCULPT_PREVIEW_RIBBONS.road` trace un ruban décoratif fixe indépendant des données terrain ou scene ; `show-road` restait activé sur nouvelle scène ou import. La route fantôme n'a pas d'autorité gameplay et ne doit pas être confondue avec une route éditable.
- **Base :** V24 `4dafbfc8b8ae0d6355b066342a7fd31ce77aeaed`, CI [39158959574](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39158959574), Pages [39159097263](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39159097263) SUCCESS ; départ `checkpoint/exploration-start-sculpt-real-blank-v25-2026-10-18`, branche `work/exploration-sculpt-real-blank-v25-2026-10-18`.
- **Périmètre :** la bande route fixe est uniquement démo et ne figure jamais sur carte vierge/importée ; l'ancien bouton de visibilité n'autorise pas à réapparaitre spontanément une route dans la scène nettoyée ; « Exemple » réactive seulement la démo. Vérification vraie Chromium.
- **Propriétaire :** uniquement adapter UI/rendu temporaire du Labo sculpture ; les géométries WorldArea.surface, collisions et `WorldDocument` ne changent pas.
- **Gel :** déplacement/caméra V21, eau/collisions V22, maisons/objets V23, nouvelle carte V24, Builder 2D, assets, Combat.
- **Prochaines étapes séparées :** pinceau de zones/routes réelles avec persistance sans fausses routes ; idle/marche en réutilisant la motion native `map-actor-visual-model`. Pas de simple fake de gameplay.
- **Statut :** CI et publication à confirmer, validation utilisateur à venir.

---

# Lot actif — 18/10/2026 — V24 création explicite d'une carte vierge

- **Retour créateur :** « on a plus carte vierge / nouvelle map ? » ; diagnostic : `Sol plat`, caché dans ⚙, utilise `createSculptTerrain()` (36×24 par défaut), laisse les objets du monde précédent et n'est pas une vraie nouvelle scène.
- **Base validée CI :** V23 source `92690f80ace8a84d988bdb26d8f6fe2fc12c0e65`, CI [39157408224](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39157408224) SUCCESS, checkpoint `checkpoint/exploration-sculpt-object-variants-v23-prevalidation-2026-10-18` ; version V23 publiée par pin source immuable via PR #160. START `checkpoint/exploration-start-sculpt-new-blank-map-v24-2026-10-18` ; branche `work/exploration-sculpt-new-blank-map-v24-2026-10-18`.
- **Contrat / propriétaire :** bouton visible `Nouvelle carte` ouvre les contrôles dimensions de l'éditeur sculpté (8–80 colonnes, 8–64 lignes), nouvelle heightfield issue de l'unique `createSculptTerrain` canonique (sol plat, eau absente) et tableau des WorldObject placements vide. Confirmation explicite avant suppression ; fermeture sans mutation ; remise à zéro des deux historiques et de la sélection, vue et mode de test contrôlés. `Sol plat` conserve les dimensions et objets de la scène courante (aplatit à dimensions identiques et efface l’eau comme le comportement V23 ; objets préservés). Pas de nouveau format, pas de stockage parallèle.
- **Gel :** Monster Capture, Builder 2D, Combat, runtime Exploration, Camera V21 validée, vitesse/perf, Collision World V22, Object catalog/variants V23, import/export JSON V1 et palettes matières.
- **Tests :** Node contrat création heightfield, Chromium réel avec ouverture/annulation puis confirmation sur scène non vierge, dimensions, eau et objets effacés, historique nettoyé, export/import scène, navigation toujours fonctionnelle et toutes sentinelles CI. Ne pas déclarer validation utilisateur avant essai.
- **Risques / rollback :** suppression de scène exige confirmation ; sauvegarder par « Exporter scène » avant création ; ancien JSON en textarea remis à zéro pour éviter confusion ; V23 reste rollback.
- **Statut :** CI complète [39158882527](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39158882527) **SUCCESS**, source `0b9871b4458b5cedcdea1bb6eccdb72505412d41` (Node + Chromium mobile, nonrégressions Builder/Combat, véritable création carte vierge et annulation). Prévalidation GREEN technique ; validation réelle smartphone encore à obtenir. Publication Pages à faire sur un pin immuable, `main` sans code métier.

---

# Lot actif — 18/10/2026 — V23 vues maisons et édition d'objets déjà placés

- **Demande :** permettre de choisir les vues face/dos/côté des maisons existantes, rendre la rotation plus précise et modifier un objet déjà posé. Conserver V21 navigation/caméra validées et V22 contacts/protection de l'eau.
- **Base vérifiée :** V22 source `fb640ea69743ffb00f5f0cf2fd4250b94d828c0b`, CI [39156714686](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39156714686) SUCCESS, checkpoint `checkpoint/exploration-sculpt-collision-fidelity-v22-prevalidation-2026-10-18`. START `checkpoint/exploration-start-sculpt-object-variants-v23-2026-10-18`, branche `work/exploration-sculpt-object-variants-v23-2026-10-18`.
- **Périmètre :** raccord au `visual.variants` préexistant du catalogue `objectDefinitionCatalogV1` pour toit bleu, toit rouge et auberge. Les trois images Avant/Côté/Arrière restent fournies par l'Asset Adapter existant. Le `WorldObjectPlacement v1` garde sa structure intacte et son `overrides.visualVariantId`. Pose avec variante choisie ; mode « Sélectionner / modifier » pour une maison déjà posée ; rotation au degré (0–359) et boutons ±45°, changement d'échelle et variant sur sélection ; undo/redo et export/import scène v1 roundtrip. Aucun faux rendu 3D : une rotation plane ne remplace pas une vue latérale.
- **Propriétaires :** Object Definition Catalog/Asset Adapter seuls propriétaires images et variantes ; WorldObject placements seuls propriétaires objet enregistré ; renderer lit la variante résolue ; input/éditeur ne modifie pas de données de relief ni WorldDocument.
- **Gels :** navigation V21 acceptée, collisions pilotes V22, relief/eau, objets gameplay hors preview, Bridge, Builder 2D, Combat/Encounter, sauvegarde officielle et contrats.
- **Tests :** Node validations variantes réelles / placements / formats legacy ; Chromium tactile avec pose maison vue côté, sélection, rotation 137°, passage vue arrière, asset chargé, export/import, tests anciens Builder/Combat/terrain. Validation graphique des visuels par utilisateur requise.
- **Hors périmètre :** revoir le rendu d'arbres trois-quarts (sens artistique à préciser) ; ponts franchissables demandent le prochain lot de traversal, pas de pont visuel mensonger. Rochers standards déjà disponibles.
- **Statut :** CI finale et publication prévalidation à confirmer, ne pas déclarer GREEN utilisateur.

---

# Lot actif — 18/10/2026 — V22 précision des contacts dans labo sculpté

- **Retour créateur :** vitesse et caméra V21 validées ; collisions rochers jugées trop larges, eau accessible trop loin par rapport au visuel, contact arbres/maisons bancal ; conserver une petite lisière accessible pour les créatures aquatiques. Autres demandes (vues maisons, rotation/arbres, ponts) = lots visuels/fonctionnels séparés après collision.
- **Base :** source V21 `e9efec53680fd2a777cbee467260ded06142e6db`, CI [39153739660](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39153739660) et Pages [39153861190](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39153861190) SUCCESS ; START `checkpoint/exploration-start-sculpt-collision-fidelity-v22-2026-10-18`, branche `work/exploration-sculpt-collision-fidelity-v22-2026-10-18`.
- **Périmètre / propriétaires :** Collision World reste seul décideur ; nouvelles règles pilotes de profil via `collisionContext.objectCatalog` (catalogue natif dérivé sans modifier les ObjectDefinitions du jeu) et `sculptNavigation.shoreEntryFraction`. Les formes d'objets sont rapprochées du pied visible : blocs de roches plus étroits, maisons et arbres contact de sol seulement. Approche dans une faible bordure d'eau (14% d'une cellule depuis un bord sec), puis blocage natation : les créatures capables de nager traversent, vol inchangé. Aucun autre chemin collision affecté en l'absence du contexte explicite.
- **Gels :** déplacements/horloge/caméra/perf V21, editor surface et eau v16, Builder 2D, WorldDocument, vrais ObjectDefinitions, props Asset Adapter, matériaux, sauvegardes et formats, Combat/Encounter, autres modules.
- **Tests :** Node profils obstacles canoniques vs preview, étroite lisière, centre océan bloqué, nager/voler, contrepropriété 2D inchangé, sentinelles générales et Chromium mobile. Validation du ressenti mobile par utilisateur attendue avant GREEN utilisateur.
- **Hors lot :** silhouettes d'arbres trop en trois-quarts, vues face/dos/côté existantes à exposer et rotation, remise en place des ponts avec vrai contrat traversable.
- **Statut :** tests et CI en cours ; publication interdite si rouge.

---

# Lot actif — 18/10/2026 — V21 navigation performance et cadrage de caméra sur téléphone

- **Retour réel utilisateur :** la vitesse V19/V20 reste ressentie comme extrêmement lente, possiblement des saccades ; la caméra paraît trop haute/éloignée de l'ancien éditeur. Aucune validation utilisateur pour V20 objets. Diagnostic précis : le callback `navigationTick` bornait chaque frame à **32 ms**, perdant le temps écoulé dès que le rendu durait plus longtemps, et `draw()` recomposait le terrain complet pour chaque pas du personnage. Le test V19 ne vérifiait que >8 unités après 420ms, sans simulation d'un vrai gel mobile.
- **Base protégée :** V20 source `b6663a329cf84f2670dce5b1cfa392c9f011d35a`, GREEN technique et Pages preview [39149814213](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39149814213) SUCCESS ; START `checkpoint/exploration-start-sculpt-navigation-perf-camera-v21-2026-10-18`, branche `work/exploration-sculpt-navigation-perf-camera-v21-2026-10-18`.
- **Périmètre :** uniquement contrôleur temporel de la navigation expérimentale, fond visuel de sculpture mis en cache durant navigation, cadrage/zoom test et diagnostics FPS + allure ; aucune modification du contrat WorldDocument, moteur partagé `stepMovement`, collisions existantes, Asset Adapter, sauvegarde, édition du terrain, lot objets V20, Combat/Encounter, Builder 2D, 2D stable, matériaux V18.
- **Correction :** `sculptNavigationFrameSteps` répartit l'intégralité du temps réel par pas ≤20ms (borne de reprise 250ms), puis appelle exclusivement `stepMovement` et Collision World ; l'image fixe du relief est pré-rasterisée lors de la navigation, invalidée si une texture/hauteur/matériau change. La caméra du test est réglable 100–240%, défaut **175%** contre 125%, avec FPS et vitesse réelle visibles. La projection 2,5D est inchangée, aucune fausse caméra 3D.
- **Tests / exigences :** `npm test`, `npm run check`, Chromium réel petit viewport clavier/joystick, colision montagne et eau, 190ms de gel du thread principal simulé et distance minimale, pose d'objet V20/export, fermeture sans altération JSON, tests anciens Builder/Combat. Pas GREEN utilisateur avant essai sur son smartphone.
- **Risques / rollback :** cache canvas temporaire détruit à la sortie de Tester, terrain raster sans nouvelle autorité ; V20 demeure rollback. Le réglage d'angle de perspective proprement dit n'est pas fourni par l'actuel renderer 2,5D.
- **Statut :** CI V21 à vérifier sur dernier SHA incluant l'épreuve jank ; ne pas publier si rouge.

---

# Lot actif — 18/10/2026 — V20 palette de bâtiments, arbres et rochers sur relief sculpté

- **Retour utilisateur :** ne trouve pas où placer bâtiments/objets ; V18 ne raccordait que des matériaux, et V19 corrige l'allure du mode Tester. Le chantier objets est distinct du correctif V19.
- **Base protégée :** V19 `397ed378802d24da9442feaee2eb2a772cb1a45f` (CI 39148741222 SUCCESS, publication Pages 39148876783 SUCCESS), START `checkpoint/exploration-start-sculpt-object-palette-v20-2026-10-18`, branche `work/exploration-sculpt-object-palette-v20-2026-10-18`.
- **Fonction :** troisième mode explicite `🌳 Objets` dans le même laboratoire sculptable, palette flottante Bâtiments/Arbres/Rochers, pose et retrait au toucher, échelle 25–120 %, rotation 0–355°, annuler/rétablir spécifiques aux objets. Le catalogue vient de `objectDefinitionCatalogV1.list()` (hors vieilles falaises et décors fixes), l'image de `resolveWorldObjectAsset`, la forme et la collision de `resolveWorldObjectPlacements` consommés par Collision World. Aucun nouveau asset, pas de duplication de règle gameplay ni de moteur de personnage.
- **Données :** l'objet reste un `WorldObjectPlacement schemaVersion:1`, terrain reste `SculptTerrain schemaVersion:1`. Nouveau **format de prévisualisation seulement** `sculpt-preview-scene` v1 combinant ces deux formats existants, volontairement distinct de `WorldDocument` et sans en inventer un concurrent de runtime. Bouton « Exporter scène (terrain + objets) », import reconnaît scènes V20 et hauteurs legacy ; « Exporter hauteurs JSON » conserve strictement l'ancien format. Aucun placement n'est écrit dans `levels`, `waterLevels` ou `roundness`.
- **Test navigation :** `navigationWorld().objects` fournit les mêmes WorldObject placements à Collision World pour bloquer un bâtiment/arbre/rocher. Spawn évite les colliders canoniques. La vitesse V19 et les contrôles restent identiques.
- **Gels :** Builder 2D, Source WorldDocument/Shell, objets/résolveurs du jeu normal, Surface Traversal, Encounter/Combat, mécanique d'eau Terre V16, terrain JSON legacy, la CI et la publication main hors pin immuable. Aucun placement d'objet à la place d'une falaise sculptée.
- **Risques connus / scope V20 :** rendu simple de sprites ancrés au pied sur les hauteurs, tri par profondeur selon y, sans insertion derrière toutes les facettes rocheuses du relief ; pas de pont traversable sur étendue d'eau sculptée (nécessite un contrat distinct). Palette pilote, non Builder officiel. Assets artistiques à revoir plus tard si nécessaire.
- **Tests :** Node tests V20 sérialisation, format V1 conservé et collision via WorldObject ; navigateur réel sur mobile : déplacement V19, placement souris, export JSON scène, annuler/rétablir, suppression, réimport et téléchargement d'un visuel bâtiment natif ; autres sentinelles Builder/Encounter/Combat/sculpt ; CI [39149617538](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39149617538) SUCCESS pour code `8ebc4dc854aed4b3a6020a948f9ef48b03134b45` (inclut pose tactile réelle, transition Objets → Tester et suppression ciblée sur la silhouette).
- **Statut :** GREEN technique, validation mobile tactile et qualité visuelle par le créateur en attente avant GREEN utilisateur. Source V19 publiée doit rester comme rollback et `main` ne reçoit aucun code V20 directement ; faire pin Pages de source checkpoint V20 après CI dernière version.

---

# Lot actif — 18/10/2026 — V19 correctif allure navigation mobile

- **Retour réel créateur :** mode Tester avance à peine (« millimètre par millimètre »), manque de lisibilité des contrôles ; question simultanée sur placement des bâtiments. Diagnostic code : allure démonstrateur V17 fixée à 83 unités/s, zoom smartphone plancher 0,8, pas d'option de réglage. Les bâtiments ne sont **pas intégrés** dans le labo sculpture V18 : seulement textures de sol/eau.
- **Base :** V18 prévalidation publiée `830c8604e77eb5bee4b2d2eda7f6fb57552a83fa` (CI 39138285255, Pages 39138338924 SUCCESS), START `checkpoint/exploration-start-sculpt-navigation-comfort-v19-2026-10-18`, branche `work/exploration-sculpt-navigation-comfort-v19-2026-10-18`.
- **Propriétés gelées :** WorldDocument, Collision World / navigation cliff-water V17, mouvement X/Y partagé `stepMovement`, capacités réelles, sculpture, JSON, objets du Builder 2D, Combat, assets. Les visuels V18 et l'interface d'import/export restent identiques.
- **Changement :** correctif d'ergonomie local au banc d'essai : allure par défaut 220 au lieu de 83, curseur de vitesse 90–360 dans HUD, zoom minimum pendant test 1,25 au lieu de 0,8, explication des obstacles et de l'utilisation du stick. Aucune règle de collision changée. Config uniquement éphémère pour tests, jamais injectée dans stats Capture.
- **Validation attendue :** Node/check complet, vrai Chromium téléphone testant vitesse par défaut, curseur fonctionnel, clavier, stick, collisions falaise/eau, sortie vers édition, Builder et Combat, CI GREEN, prévalidation Pages épinglée SHA immutable. Test physique du créateur requis avant GREEN utilisateur.
- **Lot suivant séparé :** créer une palette **Objets** (arbres/rochers/bâtiments) intégrée au labo sculptable via WorldObject placement model / asset adapter existants, avec sauvegarde versionnée *distincte* du JSON hauteur v1, contrôle des collisions et test placement/suppression. Ne pas présenter les seules textures comme des objets placés.

---

# Lot actif — 18/10/2026 — V18 assets visuels natifs du nouveau relief

- **Demande :** après test de navigation V17, raccorder les visuels déjà exploitables sans forcer la réutilisation des assets inadaptés. Référence de compatibilité : [LAB_SCULPT_VISUAL_COMPATIBILITY_V18.md](LAB_SCULPT_VISUAL_COMPATIBILITY_V18.md).
- **Base :** V17 `babb31eff6bafc8423f06af6a833e1b5a41ba0c8` ; START `checkpoint/exploration-start-sculpt-visual-materials-v18-2026-10-18`, branche `work/exploration-sculpt-visual-materials-v18-2026-10-18`. V16 et V17 ont leurs checkpoints prévalidation, rollback de l'éditeur 2D V6 intact.
- **Périmètre homogène :** choix de six surfaces déjà déclarées (herbe, sol forêt, montagne, neige, sable, volcan) et quatre matériaux d'eau (bleue, turquoise, rivière forestière, marais) dans le laboratoire sculptable. Textures via Material Registry + Asset Adapter seulement ; chargements d'images protégés contre les retours asynchrones inversés. Le héros SVG du test V17 reste le visuel acteur officiel du laboratoire, sans nouvelle autorité.
- **Responsabilités :** Material Registry/Asset Adapter possèdent identifiants, visuels et fichiers ; renderer rend les volumes à partir du modèle ; `sculpt-height-model` conserve sol/eau, aucun matériau ne définit la collision. La navigation est la version V17 sans modification de règle.
- **Gels :** fichiers `index.html`/`builder.html`, WorldDocument, Collision World et stepMovement V17, structures de données, sauvegarde JSON, waterLevels, roundness, historique, Combat/Encounter, routes canoniques, WorldObjects et faux contacts hauteur issus des sprites.
- **Validation :** `npm test` + `npm run check`, vrai Chromium en 390×844 vérifiant les téléchargements des WebP et des pixels différents selon les textures, JSON inchangé, tests de navigation clavier/tactile V17, régressions eau/terre V16 et Builder/Combat. CI [39138102580](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39138102580) SUCCESS pour le SHA code `1e93bc10b8ec27472c9f90d57a4985e7b05ecd61`.
- **Décision :** falaises SVG historiques, cascade, arbres/rochers placés, matériau lave et eau vectorielle canyon ne sont pas raccordés naïvement : revoir selon leurs responsabilités, collision et règles de rendu. Le pack visuel actuel est volontairement `mobile-test-128`, pas une livraison artistique HD.
- **Statut :** GREEN technique source à consolider après dernier ajout documentaire ; prévalidation preview Pages possible via pin immuable et CI ; test sur téléphone et jugement artistique utilisateur encore attendus.

---

# Lot actif — 18/10/2026 — V17 Navigation sur terrain sculptable (prévalidation)

- **Base :** checkpoint V16 immuable `0c7bf54cba34178e56ffcd894f6daf5317060f43` ; START `checkpoint/exploration-start-sculpt-navigation-v17-2026-10-18` ; branche `work/exploration-sculpt-navigation-v17-2026-10-18`.
- **Demande utilisateur :** tester les déplacements sur le nouveau relief avant d’intégrer le catalogue visuel existant ; certaines textures/structures peuvent nécessiter une refonte artistique ultérieure. Décision : navigation **expérimentale** du labo sculpture, non raccord runtime Monster Capture et pas de deuxième WorldDocument.
- **Propriétaires réutilisés :** `stepMovement` reste seul propriétaire du mouvement X/Y ; `isBlocked` / Collision World applique le nouvel adaptateur de lecture pure `sculpt-navigation-collision` uniquement via `collisionContext.sculptNavigation` explicite ; input depuis l'existant `createVirtualStick` (dispose désormais explicite) et clavier ; `sculpt-height-model` reste seul propriétaire des hauteurs/eaux ; canvas lit l'acteur dans le modèle de navigation éphémère, texture et sprite via leurs adapters.
- **Fonctionnalité test :** bouton `🚶 Tester` / `✎ Éditer` dans le même labo, personnage SVG de démonstration (`actor.demo.hero.traveler.01`), joystick tactile, ZQSD/WASD/flèches, caméra suivant l'acteur, HUD hauteur/niveau/obstacle, locomotion simulée marche/nage/vol uniquement pour tests. Marche bloque hauteur de +1/-1 maximum par cellule et eau volumique, nage permet l'eau, vol franchit ces barrières mais jamais les limites de carte. Trajectoire échantillonnée contre le tunneling. Aucun état joueur exporté dans le JSON sculpture.
- **Gels :** Builder 2D, WorldDocument, Surface traversal gameplay, Encounter/Combat, assets du runtime, capacités réelles des personnages, V16 terre/eau, historique de sculpture, sauvegarde, collision hors contexte `sculptNavigation`.
- **Tests :** sentinelles Node, contrôle opt-in/hors contexte, diagonales, glissement, montée/descente, eau/nage/vol, limites et anti-tunneling. CI SHA `47c3ac74d1b21bec2687f50cb217d14ca657415c` : [39137825031](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39137825031) **SUCCESS** (Node + npm check + vrais navigateurs Builder/Encounter/Combat/sculpt, clavier et tactile en viewport mobile, sortie sans altération JSON).
- **Statut :** GREEN technique sur code de navigation, validation artistique/manuelle smartphone créateur requise avant GREEN utilisateur ; préparer checkpoint immuable et test Pages. **Lot suivant séparé :** variantes de matériaux visuels natifs réutilisées via Material Registry/Asset Adapter ; pas de duplication des assets.

---

# Lot actif — 18/10/2026 — V16 sculpture plein écran et isolation Terre/Eau

- **Retour créateur :** pinceau V15 précis et validé à l'usage, mais zone de sculpture encore trop petite ; demande d'un canevas plein écran avec petite palette flottante d'outils essentiels. Une montée rocheuse qui approche l'eau doit rester indépendante : en mode Terre, le pinceau ne doit jamais élever les cellules d'eau préexistantes.
- **Base exacte :** V15 `7985dcaaaf93715ee89532a39a013e88a23252bc`, CI [39135342315](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39135342315) SUCCESS ; START `checkpoint/exploration-start-sculpt-fullscreen-water-isolation-v16-2026-10-18`, branche `work/exploration-sculpt-fullscreen-water-isolation-v16-2026-10-18`. Rollback V15/V14/V13 et Builder 2D sûr conservés.
- **Responsabilités :** `sculpt-height-model` seul maître des cases de sol et de la surface d'eau absolue ; `sculpt-height-renderer` seul responsable de l'ordre des plans de rendu ; `sculpt-lab-main` arbitre les intentions, le mode plein écran et la palette ; HTML/CSS assurent l'affichage responsive. Un unique ensemble de contrôles, aucun moteur/canevas/carte supplémentaire.
- **Contrat produit V16 :** le pinceau Terre exclut par défaut toutes les cellules à niveau d'eau explicitement défini (`waterLevels[i] >= 0`), aussi bien dans le vrai geste que dans l'empreinte affichée. Le pinceau Eau peut modifier librement l'eau sans toucher `levels` et `roundness`. Le modèle conserve une option explicite `allowUnderwaterTerrainEdit` pour tests géologiques hérités, **non exposée dans l'éditeur**. L'eau est peinte par bandes de profondeur avant les rangées de terre au premier plan, et non sur la totalité du terrain déjà fini ; aucun niveau d'eau n'est recalculé depuis la sculpture de terre.
- **Plein écran :** bouton `Plein écran` et sortie, vraie API navigateur quand disponible avec repli `100dvh` ; canevas étendu sur la zone visible, palette flottante repliable, mode Terre/Eau, outil, hauteur, taille du pinceau, placement précis et Annuler/Rétablir toujours raccordés aux mêmes éléments. Volets avancés restent disponibles en sortie du mode ; pas de changement gameplay.
- **Gels :** Builder 2D, WorldDocument/WorldSurface, stockage/sauvegarde, assets/material registry, paramètres de mouvement/collision, combat, rencontres, démonstrations V13/V14/V15, origine et undo/redo.
- **Gates :** Node et `npm run check` ; tests de frontière eau/terre + empreinte ; Chromium vrai trajet UI avec chevauchement du pinceau, export JSON, Undo/Redo et viewport mobile 390 × 844 plein écran avec palette repliée/dépliée ; CI, checkpoint immuable et pin Pages seulement après GREEN technique. Le test physique sur téléphone du créateur reste distinct avant GREEN utilisateur.
- **Prévalidation technique V16 :** source `bd626a7bcfbdfe54f305b2e26ab2dfd08800c5cd`, [CI 39135820612](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39135820612) **SUCCESS** ; Node + `npm run check` + Chromium Builder/Encounter/Combat/sculpt, rendu eau au premier plan et sous-pinceau protégé, emulation mobile 390×844, mode immersif/palette repliable et Undo/Redo. **GREEN technique uniquement** ; checkpoint prévalidation à figer sur le prochain HEAD documentaire puis pin Pages. Validation réelle sur téléphone créateur nécessaire avant GREEN utilisateur.

---

# Lot actif — 18/10/2026 — V15 ergonomie mobile du labo sculpture

- **Retour utilisateur + capture mobile :** V14 précision excellente, mais toute la hauteur de l'écran occupée par les réglages, toile invisible sans scroll ; taille du pinceau limitée à 8 et peu accessible. Conserver absolument mode précis, eau V13, annuler/rétablir et arrondi par passage.
- **Base exacte :** source V14 publiée `b2d79530b6a7ede77d9b7a5c9478a0dcbce6bb01`, Pages `39124275467` SUCCESS, Node 545/545 et Chromium Builder/Encounter/Combat et tactile précédemment GREEN. Checkpoint START `checkpoint/exploration-start-sculpt-mobile-ui-v15-2026-10-18`, branche `work/exploration-sculpt-mobile-ui-v15-2026-10-18`. Rollbacks V14, V13 et version 2D V6 préservés.
- **Périmètre homogène :** réagencement des contrôles de `sculpt-lab.html` : canvas principal visible sans scroller au téléphone, barre compacte de domaine / outil / taille / niveau / visée et annuler ; flèches et appliquer accessibles pendant visée ; réglages avancés repliables. Plage pinceau 0,5 à 16 cellules avec un seul calcul canonique de l'empreinte, boutons +/- de taille, sans second moteur. Synchroniser les raccourcis avec les boutons existants.
- **Propriétaires :** modèle `sculpt-height-model` pour le rayon réel, `sculpt-lab-main` pour les événements, `sculpt-height-renderer` pour le masque fidèle ; HTML/CSS pour responsive. **Gels :** WorldDocument, WorldSurface, index.html, builder.html, collision, gameplay, eau/route, stockages des cartes, caméra gameplay, Combat/Encounter.
- **Gates :** cap du pinceau 16 réellement sculpté et aperçu cohérent, 0,5 une seule case, vraie interaction tactile 390px, preuve canvas visible avant défilement, confirmer et undo/redo, eau inchangée, CI complète, checkpoint immutable et publication unique via pin Pages. Validation mobile créateur distincte.
- **Implémentation V15 :** une seule barre mobile compacte commande Terre/Eau et l'outil actif, hauteur rapide +/- (terre/eau), pinceau toujours visible avec rayon 0,5 à 16 et boutons +/- par 0,5, mode placement précis, Annuler/Rétablir. Les panneaux Terre/Eau, force/bord, matériau, zoom, arrondi et options sont repliables dans `sculpt-settings`, placés **après la toile**. Le dock précis (flèches + Appliquer) est superposé dans le bas de la toile, pas au-dessus de la carte. Le moteur de hauteurs et d'eau partage un même cap de rayon 16 ; pas de format ou d'autorité nouvelle. Le résumé de prévisualisation reste accessible immédiatement.
- **Prévalidation technique :** [CI 39133668232](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39133668232) **SUCCESS** — **547/547 Node**, npm check et vrai Chromium Builder/Encounter/Combat/Sculture. Émulation `390×844` : sommet du canvas y=**272** et bas y=**720** sans défiler, volet avancé fermé ; boutons taille **15,5→16→15,5** ; sélecteur rapide affiche seulement outils du domaine Terre ou Eau ; zone précise à une seule case, une confirmation modifie uniquement cette case au niveau 3, Annuler/Rétablir exacts. Régression du matériau eau et du JSON conservée.
- **Statut :** GREEN technique, ergonomie réelle sur téléphone et validation artistique attendues avant GREEN final. Prochaine étape : checkpoint prévalidation exact et publication snapshot via seule PR infra Pages (ne pas merger source dans `main`).

---

# Lot actif — 18/10/2026 — V14 ergonomie Terre/Eau et placement de précision

- **Retour créateur :** V13 eau volumique et textures artistiquement validées ; panneau surchargé et mélange des outils Terre/Eau, pinceau trop approximatif au doigt malgré empreinte visible. Conserver impérativement la texture d'eau V13.
- **Base technique sûre :** V13 `fb2bc0e22f9998073564d93c869c3f2f9c5e0424` avec CI 39113426529 et Pages 39113483632 SUCCESS. Checkpoint START `checkpoint/exploration-start-sculpt-editor-precision-v14-2026-10-18` et travail `work/exploration-sculpt-editor-precision-v14-2026-10-18` sur SHA exact. Rollbacks V13, V12 et 2D V6 intacts.
- **Périmètre :** **switch Terre / Eau** exposant uniquement les commandes du domaine ; conserver contrôles communs (rayon, force, bord, annuler/rétablir) ; mode **Placement précis** permettant d'abord de viser sur le terrain (sans déformer), déplacement par flèches d'une cellule, puis bouton **Appliquer** ; taille du pinceau dès 0,5 cellule, visibilité de l'empreinte exacte, pas de nouveaux champs de sculpture.
- **Propriétaires :** `sculpt-height-model` et `sculpt-height-renderer` restent seuls détenteurs de la sculpture et du rendu ; `sculpt-lab-main` responsable UI, pointer et validation des gestes. Eau V13 et Material Registry inchangés.
- **Gels :** V13 eau `waterLevels`, texture, transparence, volumes, sauvegarde et démo ; `index.html`/`builder.html` 2D, WorldDocument, collisions, mouvement, caméra gameplay, Encounter/Combat ; pas de branche d'autorité parallèle ni de modification d'hydrologie.
- **Validation :** CI tests Node + npm check, contrôle navigateur souris (navigation panneaux et pinceau), vrai pointer tactile en mode précis, aucune mutation de hauteur avant confirmation, Annuler/Rétablir, eau inchangée en pixels après changement de mode ; tests réels Builder/Combat, checkpoint et Pages uniquement après GREEN technique, validation auteur encore nécessaire.
- **Réalisation V14 :** deux onglets exclusifs **Terre / Eau** et paramètres pertinents seulement ; outils communs de pinceau/Annuler/Rétablir conservés ; le dernier outil choisi de chaque domaine reste sélectionné. **Placement précis** activable (proposé automatiquement sur appareil tactile) : toucher/glisser déplace seulement l'empreinte, boutons flèches ±1 cellule, confirmation explicite **Appliquer** ; aucune modification avant confirmation. Pinceau demi-cellule pour modifier une seule case, même en volume d'eau. Barre de confirmation visible pendant le scroll sur téléphone.
- **GREEN technique source :** commit `16e50c99f50c004043d97a5e660625f049db8c89`, [CI 39124057619](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39124057619) **SUCCESS**, **545/545 tests Node**, npm check et navigateurs réels Builder/Encounter/Combat et laboratoire. Chromium émulation mobile **390 px**, vrai `Input.dispatchTouchEvent` : visée sans mutation, **1 case** après nudge droite + confirmation, hauteur exacte 3, undo/redo exacts ; sélecteur Terre/Eau masque le panneau opposé ; eau volumique V13 inchangée (13 cases mouillées dans gate de régression), export/import toujours verts.
- **Statut :** GREEN technique, validation de la précision **sur le vrai téléphone du créateur** attendue avant GREEN artistique. Publication uniquement après checkpoint prévalidation immuable et PR pin Pages ; version V13 sûre conservée.

---

# Lot actif — 18/10/2026 — V13 eau volumique et arrondi par passage + retour arrière

- **Demande :** l'arrondi doit être appliqué uniquement aux prochains gestes, sans modifier le terrain déjà sculpté ; l'eau doit être modelable en volume comme le sol ; retour arrière très visible et fiable.
- **Base :** V12 `90240ab035b4dd046e2749375d5f36bef7e83e94`, CI 39110032782 SUCCESS et Pages 39110139383 SUCCESS, validation artistique encore partielle. START `checkpoint/exploration-start-sculpt-water-volume-undo-v13-2026-10-18` et branche `work/exploration-sculpt-water-volume-undo-v13-2026-10-18` sur ce SHA exact. Rollback V12/V11/V6 maintenus.
- **Périmètre :** un réglage de rondeur enregistré cellule par cellule au prochain coup de pinceau, pas de filtre global rétroactif ; eau expérimentale avec propre carte de niveau de surface, profondeur par rapport au sol, ajout/retrait/montée/descente de niveau et pinceau à bord doux ; rendu d'eau sur les plateaux et parois eau/terre ; historique Annuler/Rétablir commun (sol, eau, rondeur) et export/import JSON réversible compatible anciens fichiers V1.
- **Propriétaires :** même source `sculpt-height-model.js` pour hauteur sol, surface eau, profil d'arrondi expérimental ; `sculpt-height-renderer.js` lit ces données sans mutation ; `sculpt-lab-main.js` contrôles et historique. Material Registry toujours propriétaire des textures.
- **Gels :** Builder 2D classique, WorldDocument/WorldSurface, collisions/mouvements/traversée, Encounter/Combat, caméra gameplay. L'eau V13 est un modèle de volume **expérimental non hydrodynamique**, aucune autorité gameplay ni simulation de courant promise.
- **Gates :** anciens JSON V1 acceptés, nouveau roundtrip complet ; 2 gestes d'arrondi n'affectent pas les précédents ; eau volumique indépendante, cellules sèches, profondeur et eau après creusage ; tests undo/redo et nouvelle action après undo ; tests Node, npm check, souris/tactile Chromium et rendu réel ; CI et Pages uniquement après GREEN technique.
- **Réalisation V13 :** `waterLevels` par cellule = altitude absolue de surface (−1 si sans eau, 0–10 autrement) ; profondeur uniquement si la surface d'eau dépasse le sol. Pinceaux `Remplir au niveau`, `Monter`, `Baisser`, `Effacer`, `Lisser l'eau`, sans modifier les hauteurs du sol. L'eau s'affiche en vraie masse transparente avec façade calculée depuis les altitudes, issue des couleurs et textures `water.clear_blue`. Démonstration initiale avec bassin. `roundness` 0–150 par cellule, fixée **au prochain passage** et non lors du déplacement du curseur. Annuler/Rétablir commun à terrain/eau/rondeur et import/reset, touches Ctrl+Z/Y et boutons visibles, branche redo invalidée au nouveau geste. Export JSON V1 désormais enrichi de deux tableaux optionnels ; import du JSON V1 ancien toujours accepté.
- **Prévalidation :** code `3e24ce50eafc4b0f6af4995e7c727b5c1e8e0abd`, [CI 39113256521](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39113256521) **SUCCESS** : **543/543 tests Node**, npm check, Chromium Builder/Encounter/Combat et vrai prototype. Terrain plat 0 paroi, relief 129 faces/35 sections, eau/route 21 188/5 525 pixels de changement, eau peinte 13 cases, undo exact, redo exact, branche redo vidée par nouveau geste, toucher CDP niveau 3, arrondi curseur 0 pixel rétroactif, export/import conservé. Première CI rouge sur ancienne sentinelle exigeant un arrondi global ; sentinelle corrigée pour vérifier la non-rétroactivité voulue, aucune régression masquée.
- **État :** GREEN technique, attente du test graphique et tactile du créateur ; checkpoint prévalidation et Pages V13 doivent encore être publiés.

---

# Lot actif — 18/10/2026 — V12 sculpture : pied de falaise, aperçu de pinceau et eau/route

- **Retour créateur :** sommet rocheux mieux arrondi en V11 mais pied toujours rectangulaire ; le pinceau ne montre pas quelles cases il modifie (particulièrement au doigt) ; besoin d'un essai eau et route sur un relief sculptable.
- **Base GREEN technique, artistique à confirmer :** V11 publiée `748d72f77b6450b96f66775d14830fe7601c5f3e` ; CI 39106968520 SUCCESS et Pages 39107021794 SUCCESS ; V6 2D `3b50137714d44c165b0ceca0538bea4b30501de3` reste sauvegardée. Checkpoint START `checkpoint/exploration-start-sculpt-river-road-v12-2026-10-18` sur la base exacte et branche `work/exploration-sculpt-river-road-v12-2026-10-18`.
- **Périmètre :** sans modifier le modèle de hauteur, profil visuel plus rond au pied des parois, notamment faces continues ; aperçu du pinceau dérivé du calcul de sa véritable empreinte, cellules centrales et bord doux visibles, pointeur tactile et hauteur cible ; projection facultative de rivière et de route **sur les surfaces rehaussées**, à partir de chemins de démonstration purement visuels et des matériaux existants Material Registry. Essai isolé dans `sculpt-lab.html` uniquement.
- **Propriétaires :** `sculpt-height-model` unique source hauteur/empreinte ; `sculpt-height-renderer` affiche roches, preview et overlays ; `sculpt-lab-main` porte entrées écran et visibilité de démo ; Material Registry et Asset Adapter fournissent eau/route. Aucun second modèle de WorldSurface/WorldDocument.
- **Gels :** `index.html`, `builder.html`, format de sauvegarde V1 heightfield, gameplay Collision/Traversal/Camera, couches Monde/Surface, mouvement, Encounter/Combat et chemins 2D sûrs. Eau et route sont d'abord **des aperçus graphiques expérimentaux** sans logique de baignade ou franchissement.
- **Gates :** vrais pixels de pied arrondi (0 vs max), empreinte dessinée identique au masque de la sculpture, clic souris et tactile via Chromium, zones eau/route visibles et interrupteurs fonctionnels, matériaux canonisés, performance, Node / npm check / CI Builder/Encounter/Combat, rollback et preview immutable ; avis esthétique sur téléphone obligatoire.
- **Réalisation :** faces rocheuses jointes en sections continues et pied en talus arrondi recomposé au-dessus du sol inférieur (évite que le sol masque l'arrondi) ; plafond d'arrondi porté à 150 %. Empreinte visuelle du pinceau calculée depuis les **mêmes poids** que la sculpture, marquage des cellules centrales et bord progressif, hauteur prévue sous le curseur et doigt. Eau et route expérimentales visibles/désactivables, projetées sur les surfaces selon la hauteur de chaque cellule, rendues avec les matériaux officiels `water.clear_blue` et `road.dirt`, **sans** nouvelles règles gameplay ni modification du WorldDocument.
- **Prévalidation technique :** code `33a392f4dd5db9cdb11b0e626f70e76503f5cfd9` ; [CI 39109949755](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39109949755) **SUCCESS** : 538/538 tests Node, npm check, Chromium Builder/Encounter/Combat et vrai laboratoire sculptable. Pixels navigateur : eau +9 015, route +5 525 ; hauteurs JSON identiques au changement d'affichage ; 129 petites faces groupées en **35** sections ; 1 198 pixels changés par arrondi sans altérer les hauteurs ; vrais clics et toucher `Input.dispatchTouchEvent` = hauteur 3 et sauvegarde/import conservés.
- **État :** V12 GREEN **technique seulement**. Validation artistique/UX au téléphone en attente. Aucun travail effectué dans `index.html`, `builder.html`, Collision World, caméra gameplay ou Combat. Preview à publier pour essai créateur.

---

# Lot actif — 18/10/2026 — V11 : pinceau niveaux précis et habillage de relief adouci

- **Retour auteur sur premier prototype :** volume jugé prometteur mais difficile de former au doigt un plateau lisse d'exactement trois niveaux ; rochers et relief trop cubiques et artistiquement faibles.
- **GREEN technique source :** V10 prototype isolé `76cef5d3239b8988db95a0b7cf7d731820d5336d` (CI 39104710331 SUCCESS et Pages 39104818988 SUCCESS) ; auteur a validé l'approche volume, pas la finition.
- **Checkpoint de départ :** `checkpoint/exploration-start-sculpt-brush-smooth-v11-2026-10-18` sur SHA ci-dessus ; travail `work/exploration-sculpt-brush-smooth-v11-2026-10-18`.
- **Lot borné :** pinceau de hauteur cible 0–7 / mode plateau EXACT ; adoucissement réglable des bords, rayon/force, boutons tactiles +/- hauteur ; coups de pinceau stables sur un seul geste sans cumul intempestif ; lissage visuel indépendant des vraies hauteurs ; parois aux angles/bases moins cubiques et roche moins mécanique en utilisant le renderer sculpt existant.
- **Propriétaires :** `sculpt-height-model` unique autorité des niveaux, `sculpt-height-renderer` projection visuelle, `sculpt-lab-main` outils et entrée tactile, Material Registry pour sol. **Gels :** toute la 2D classique (`index.html`, `builder.html`, WorldSurface, WorldDocument, mouvements, collisions, Combat, Encounter), la CI générale et les archives V7–V10 ; ne pas créer de deuxième source de relief ni modifier gameplay.
- **Gates :** tests modèle plateau de niveau 3 stable, pression contrôlée/feathering, curseurs, undo/export/import, projection adoucie sans modifier le modèle canonique, vrai pinceau souris ET tactile Chromium, 2D existante non régressée, Node + check + CI complète + publication opt-in. Esthétique attend test créateur.
- **Réalisation V11 :** modèle `applySculptStroke` déterministe sur geste entier calculé depuis l'état initial (supprime l'empilement sur déplacements/repassages), mode plateau hauteur exacte 0–7, bords à douceur 0–100 %, taille et force préservées, +/- accessibles tactile, interpolation entre points de doigt, undo/JSON conservés. `sculpt-height-renderer` dessine lèvres arrondies, bases adoucies, strates/facettes minérales et variation visuelle 0–100 %, **sans changer les niveaux**. Vue 2D normale et données gameplay strictement inchangées.
- **CI source V11 :** `d1fe7754c85c82436563c6c07899253941d1c7b1` / [run 39106808409](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39106808409) SUCCESS ; **535/535 tests**, syntax check et navigateurs Builder/Encounter/Combat verts. **Vrai Chromium :** plateau exact 3, double appui reste 3, bord doux permet 5 niveaux distincts jusqu'au niveau 6, **914 pixels changés par arrondi visuel sans toucher aux hauteurs**, toucher CDP réel maintient niveau 3, import/export et matériau neige toujours verts. CI rouges intermédiaires réparées, tests non assouplis.
- **État :** V11 technique GREEN **en prévalidation uniquement**, attente du rendu et ergonomie mobile validés par le créateur. Suite : snapshot/checkpoint, PR de changement du seul pin Pages et essai utilisateur.

---

# Lot actif — 18/10/2026 — Prototype isolé de terrain sculptable (retour 2D sûr)

- **Décision créateur :** rejet des tentatives falaises décoratives V7–V10A, elles ne ressemblent pas à la référence. Revenir à la **vue 2D sûre** pour la carte normale. Les tests artistiques sont retirés de la publication active, pas détruits dans l'historique/checkpoints GitHub. Tester à part un relief obtenu en sculptant véritablement les hauteurs du sol.
- **Base de départ :** V6 2D `3b50137714d44c165b0ceca0538bea4b30501de3` ; CI `39055763723` SUCCESS et Pages `39061460146` SUCCESS. Checkpoint `checkpoint/exploration-start-sculptable-terrain-prototype-2026-10-18` créé au SHA exact ; branche `work/exploration-sculptable-terrain-prototype-2026-10-18`. V10A `f9fa02a1fa41f4a3033d33f60c29108788a50858` conservée uniquement pour histoire/rollback.
- **Périmètre :** nouvel espace autonome `sculpt-lab.html` et modules `sculpt-height-model.js` et `sculpt-height-renderer.js`. Un vrai modèle de hauteur cellulaire éditable, pinceaux creuser/surélever/égaliser, parois calculées à partir des dénivelés, changement du matériau de surface via Material Registry existant, zoom graphique expérimental. Une seule source de hauteur, export/import JSON séparé, aucun nouveau format WorldDocument tant que non approuvé.
- **Gels :** `index.html` et `builder.html` classiques, moteur et rendu 2D validés, WorldDocument/WorldSurface, mouvement/collisions/traversée, caméra actuelle et Combat/Encounter. Ne pas intégrer la sculpture au jeu avant validation esthétique, UX et décision ultérieure sur géométrie et collision de relief.
- **Gates :** tests modèle déterministe, opérations immutables + undo + roundtrip JSON, faces générées uniquement aux changements de hauteur, surfaces via Material Registry, preview autonome utilisable tactile et souris, Node/npm check, CI complète Browser Builder/Combat et contrôle réel de prototype Chromium avant publication.
- **Prototype réellement développé :** page autonome `sculpt-lab.html`, niveaux 0–7 sur grille 36×24, pinceaux creuser/surélever/aplanir/relisser, parois rocheuses calculées aux seuls écarts de hauteur entre cellules réelles, quatre thèmes de roche, texture de terrain issue du Material Registry (herbe/neige/sable/cendre), zoom expérimental, annuler, terrain plat, démo, export/import JSON. Aucun changement de `index.html`, `builder.html`, collision, mouvement, caméra gameplay ou WorldDocument.
- **Prévalidation réelle source :** SHA `ba9ac6abf344135b21a5d27b49bbe9d304b48ae3`, [CI 39104636551](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39104636551) SUCCESS : Node complet (531/531), npm check, Chromium Builder et Encounter/Combat ; **Chromium sculpt lab réel** : 129 faces/4 hauteurs au départ, 0 face sur carte plate, 14 parois après vrai clic de souris, 31 859 pixels terrain observés, changement au matériau neige et roundtrip 14/14 après import.
- **Validation :** prototype fonctionnel et isolé, qualité visuelle / ergonomie tactile à soumettre à l'auteur. Aucune intégration dans le jeu ni sauvegarde WorldDocument à ce stade.
- **Prochaine étape :** checkpoint de prévalidation + publication snapshot 2D V6+sculpt-lab pour essai du créateur ; aucun GREEN artistique avant son verdict.

---

# Lot actif — 17/10/2026 — Eau canyon 2,5D : reflets organiques V6

- **Verdict auteur :** V5 sans rectangles validée (« beaucoup mieux ») ; micro-vagues répétées jugées inesthétiques. Aucun changement de géométrie voulu.
- **Source publique de référence :** `preview/exploration-canyon-water-seamless-v5-2026-10-17` @ `c5b1af6e4cc8168628bce7f13a039ba8981dc047` (CI `39050092523` SUCCESS ; PR Pages #143). Cette V5 est le rollback, résultat artistique de l'animation toujours NON GREEN.
- **START exact :** `checkpoint/exploration-start-water-reflections-v6-2026-10-17` au SHA V5, branche unique `work/exploration-water-reflections-v6-2026-10-17`.
- **Cause :** `src/render/relief-water-overlay.js` dessine ~32 doubles arcs blancs répétés sur l'axe du courant et 2 × ~20 courtes lignes de rive, espacés régulièrement (séries artificielles). La forme du fleuve et sa teinte unie sont maintenant correctes.
- **Périmètre :** **un seul propriétaire du rendu animé** : modifier les fonctions existantes `reliefWaterMarks`, `drawReliefRiverGlints` et `drawReliefRiverBankFoam` pour produire des reflets plus longs, irréguliers, doux, translucides, dérivant avec le courant, écume rare et discrète uniquement sur les berges. Garder `drawReliefWaterfallGlints` inchangée. Pas de moteur WebGL, nouveau canvas global, filtre, texture carrelée, shader, effet visuel inline ou nouveau service.
- **Gel :** V5 couleur eau et matériau center=null ; WorldDocument/World Surface/Traversal/Collision World, vitesse, caméra, sprite cascade, objets, Combat/Encounter, input et Builder édition ; TerrainTileCache et pré-render statique inchangés. Runtime `requestAnimationFrame` préexistant seulement ; Builder toujours image statique à t=0.
- **Critères :** formes non identiques/non régulièrement espacées et position monde stable à caméra donnée, changements animés déterministes dans le temps, pas de répétition de sprites, aucun travail hors-champ massif, aucune altération du WorldDocument, carte classique inchangée. TDD/sentinelles Node, rendu Canvas réel dans Chromium Builder, npm check, CI Builder/Encounter ; prévalidation technique seulement puis test Pixel créateur avant GREEN final.
- **Prévalidation technique (17/10) :** dans l'autorité existante `relief-water-overlay.js`, les tildes doubles à écart régulier sont remplacés par des reflets organiques, chacun avec une longueur, un décalage latéral et un rythme pseudo-aléatoires **déterministes** ; les bords ne dessinent plus qu'un petit nombre de touches discrètes. 22 reflets et 18 touches de rive maximum par rivière (culling écran), chemin lissé mis en cache par objet, fond et géométrie inchangés. Le pilote n'ajoute aucun asset/texture ni moteur. 526/526 Node, npm check, Chromium Builder/Combat **SUCCESS** [CI 39055585619](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39055585619), test Chromium Canvas réel : 1085 échantillons de pixels différents entre t=0 et t=9 s, 7 reflets / 6 touches de rive dans le viewport-test ; échec RED antérieur des sentinelles de répétition puis correction. Ne pas prétendre à une validation esthétique : **Pixel créateur requis avant GREEN final**.
- **Risques :** davantage de reflets peut créer du bruit ou compromettre la fluidité ; nombre de traces strictement plafonné, opacités faibles, pas de re-raster terrain. Vérifier avant publication qu'aucune PR concurrente n'a modifié le pin Pages.

---

# Lot actif — 17/10/2026 — V5 : suppression totale des motifs répétés dans l'eau du canyon

- **Retour utilisateur / défaut à reproduire :** screenshot 18:25 du canyon montrant une rivière en alternance de blocs bleu turquoise et vert pâle, malgré les essais V2/V3. Le test de fluidité était OK mais le rendu artistique est **NON GREEN**.
- **Branche isolée :** `work/exploration-canyon-water-seamless-v5-2026-10-17` ; base snapshot V4 `76fb8b6d946be7bb06e8c7b854313059986733ac`, checkpoint START `checkpoint/exploration-start-canyon-water-seamless-v5-2026-10-17` au même SHA. Ne pas réconcilier les deux branches V3 expérimentales.
- **Diagnostic :** la V4 a déjà retiré les segments de berge rectangulaires dans le Surface Renderer, mais le matériau central garde `assets.center=texture.water.canyon.turquoise.01` (motif répétable de 256 px). V5 retire **uniquement cette dépendance d'affichage répétée** sur le matériau canyon et affiche la couleur opaque unie déjà déclarée dans son Material Registry, à l'aide des 4 strokes continus existants. Les effets de courant/écume restent via le renderer visuel actuel. Aucun autre mode de rendu, aucune géométrie parallèle.
- **Autorités/gels :** WorldArea.surface.rivers seul propriétaire des points/largeur/traversal ; Material Registry seul propriétaire de la couleur et des assets ; Surface Renderer existant pour eau/bords. Également gelés : Collision World, déplacement, caméra, Builder éditable, autres matériaux (y compris forêt), Encounter/Combat, cache des tiles, sprites de falaise, nouveaux assets binaires et audio. Aucun asset image encodé dans JS/HTML.
- **Gates :** sentinelles du vrai chemin canonique matériau → rasterisation avec zéro image/pattern central canyon ; même rivière/collision, eau classique non altérée, chargeur ne précharge plus le centre canyon ; tests Node/check/Chromium Builder/Encounter, snapshot immuable + PR Pages uniquement après CI verte, contrôle visuel smartphone avant GREEN final.
- **Risque :** couleur plus uniforme que la référence ; accepter ce compromis temporaire pour supprimer les blocs avant de réintroduire des détails riches sans répétition. Vérifier le cache navigateur avec une nouvelle révision.
- **Prévalidation source :** canyon `assets.center = null` et `assets.bank = null` dans le seul Material Registry, `ribbonMode = continuous-stroke` déjà propriété du même Surface Renderer. Aucun motif répété de 256 px n'est chargé ni peint, aucune découpe d'images sur la rivière ; l'eau est continue en couleur `render.waterColor`. Micro-animations existantes conservées. Sentinelles de vrai rendu et de non-régression classiques mises à jour. CI [39050009868](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39050009868) **SUCCESS** (tests Node/check + Chrome Builder/Encounter). Source GREEN technique, **publication et essai mobile encore attendus**, non GREEN artistique final.

---

# Lot actif — 17/10/2026 — Rivière canyon continue, anti-rectangles (V4)

- **Branche :** `work/exploration-canyon-continuous-river-2026-10-17` depuis le snapshot immutable prévalidé V3 `a11fe22b03f9027052f87bcb89ed7fb272a972a8`. Checkpoint START `checkpoint/exploration-start-canyon-continuous-river-2026-10-17` au même SHA. **Aucune fusion** avec les deux branches V3 concurrentes/expérimentales.
- **Retour auteur :** capture réelle smartphone V3 (17:24) : rivière encore constituée visuellement d'une rangée de rectangles/tuiles bleues, cassant la continuité ; esthétique eau **NON VALIDÉE**, fluidité positive sur les lots précédents.
- **Cause identifiée :** `drawWaterMaterialRaw` du propriétaire `src/render/surface-renderer.js` utilise `drawTexturedRibbon` sur l'asset de berge. Le ruban est rasterisé en de nombreux segments orientés de 16 unités (rectangles drawImage), ce qui matérialise les jonctions sur une bande quasi horizontale ; changer des SVG ne peut pas supprimer ces joints géométriques.
- **Correction restreinte :** stratégie `render.ribbonMode = 'continuous-stroke'` sur l'unique matériau `water.canyon_turquoise`, choisie par le Material Registry ; dans **le même Surface Renderer**, dessiner une seule courbe lissée par couche d'eau/berge au moyen de `strokePath` existant. Une texture centre SVG peut rester un motif world-anchored dans la courbe ; aucun `drawTexturedRibbon` pour la berge canyon. Les autres rivières/routes restent sur le code historique. Rendu statique cullé/cache exactement comme avant ; animation écume/reflèt existante inchangée.
- **Gel :** WorldDocument, tracé/largeur/traversalRule, collisions/Collision World, déplacement, caméra, générateur, Builder data layer, stockage, catalogue WorldObject, Encounter/Combat, style 2D classique. Pas de deuxième géométrie, matériau autoritaire, moteur renderer ou asset inline.
- **Gates :** sentinelle du chemin réel Material Registry → Surface Renderer, vérification absence de drawImage segmenté pour canyon mais conservation des segments sur autres matériaux, tests d'animation/collision, 520+ tests Node + npm check + Chromium Builder/Encounter, publication d'un snapshot Pages seulement si CI verte, essai smartphone avant GREEN final.
- **Risque :** rive trop uniforme vs couleur du sol : garder plusieurs couches translucides et l'écume animée existante ; qualité finale conditionnée au contrôle créateur.
- **Prévalidation technique :** correction intégrée au Surface Renderer d'origine avec 4 passes de courbe continue (berges externes/interne, eau texturée, reflet), aucun rectangle `drawImage` pour le matériau canyon, aucun cache statique invalidé à chaque frame. Ancien sprite de berge retiré des assets chargés mais conservé dans l'Asset Adapter pour compatibilité historique. Sentinelles V4 : 0 rectangle pour canyon, rendu historique des autres matériaux préservé, collision nage/marche inchangée, ancien état de carte non muté. CI [39045941561](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39045941561) **SUCCESS** (Node/check/Chromium). Les échecs de sentinelles intermédiaires ont été corrigés ; **pas de GREEN final sans contrôle smartphone**. Checkpoint snapshot et publication infrastructure Pages à figer après CI de cette documentation.

---

# Lot actif — 17/10/2026 — Canyon 2,5D, kit graphique V3 cohérent

- **Retour auteur :** captures du canyon V2 montrant eau en rectangles répétés et falaise composée d'assets séparés trop géométriques. La fluidité est bonne, le rendu artistique est **NON VALIDÉ**. Le créateur demande une véritable refonte visuelle plutôt qu'ajouter des couches d'effets.
- **Branche unique :** `work/exploration-canyon-visual-kit-v3-2026-10-17` depuis le snapshot vérifié V2 `1facaf42caf291ffb523bbd2b669638f8c5c27fc` (CI `39036100313` SUCCESS), checkpoint de départ `checkpoint/exploration-start-canyon-visual-kit-v3-2026-10-17`.
- **Périmètre :** remplacer les SVG externes **uniquement canyon** : eau *sans rupture de tuile* (couleur homogène + détails périodiques subtils), berge transparente/blendable, falaises moins polygonales avec arêtes herbeuses/strates et cascade rattachée au même langage graphique ; créer un second segment/angle de falaise réutilisable avec Asset Adapter et Object Definition Catalog s'il est requis pour rompre les répétitions. Ajuster le placement du WorldDocument pilote uniquement, sans modifier les positions gameplay ni le moteur.
- **Autorités réutilisées :** WorldDocument canonique -> Material Registry -> Material Asset Adapter -> renderer actuel ; WorldObject Definition Catalog -> WorldObject Asset Adapter -> renderer. SVG externes légers exclusivement ; aucune image encodée dans JS/HTML, aucun son.
- **Gel strict :** style classique, Camera, Core Movement, Collision World, footprints existants, rivière/traversalRule/Encounter/Combat, Builder mutations, persistances, terrain cache/culling/performances. Collision trop stricte sur le bord supérieur de falaise conservée pour un micro-lot indépendant.
- **Gates :** valider syntaxe et chargement navigateur des SVG, absence de couture horizontale/verticale de la texture, toutes les références du catalogue, import/export WorldDocument, tests antérieurs et smoke Builder + session de jeu, CI complète. Nouveau lien Pages sur snapshot immuable uniquement après CI, puis validation visuelle/performance mobile par auteur. **Pas GREEN final avant ce test**.
- **Risques :** imagerie SVG insuffisamment aboutie, coutures le long des rubans de rivière, transparence des berges, empilement et variation entre modules. Ne pas créer d'autorité de rendu concurrente.
- **Résultat technique (17/10) :** revue des captures mobile V2 ayant montré un damier dû à une source SVG avec dégradé non raccordé ; remplacement de la texture d'eau par fond homogène et motifs périodiques bord-à-bord, berge atténuée avec alpha nul aux limites. Remplacement des SVG de falaise longue, angle et cascade ; nouveau segment de falaise `cliff_broken_ledge_02.svg` enregistré dans les Asset Adapter / Object Definition Catalog, employé dans la même carte démo. Les 2 segments longs possèdent une **collision identique**, aucune modification de Collision World. Cache de textures et objets versionné `canyon-art-v3` dans Builder/jeu.
- **CI validée :** [39039454752](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39039454752) **SUCCESS** : 520/520 tests Node, npm check, Chromium Builder/canyon et Encounter. Un test de cascade ancien a été adapté au nouveau SVG ; aucun test rouge restant. **Prévalidation technique seulement**, sans verdict artistique/performance mobile final.
- **Prochaine étape :** figer branche de preview immuable après ce commit de documentation et sa CI, puis ne changer que le workflow Pages sur branche d'infrastructure via PR, sans fusionner la source de jeu dans main. Fournir lien de test et attendre validation smartphone de l'eau sans damier, falaise variée, cascade et fluidité.

---

# Lot actif — 17/10/2026 — Qualité graphique eau/cascade canyon, V2

- **Branche unique :** `work/exploration-canyon-water-art-v2-2026-10-17` ; base technique CI GREEN `ae57178e97ae4c582fb3943d02d0ff2d2a1865f4`, checkpoint START `checkpoint/exploration-start-canyon-water-art-v2-2026-10-17`.
- **Validation créateur :** eau V1 visible et fluide sur téléphone, mais **trop minimaliste**. Souhait : se rapprocher de l'image de référence par texture/palette/reflets/écume raccordés aux falaises. Collision falaise V1 légèrement stricte, **micro-lot différé** (ne pas toucher à Collision World ici).
- **Périmètre V2 :** améliorer exclusivement le canyon de démonstration (opt-in) : matériau de rivière `water.canyon_turquoise` distinct et canonique, texture centrale et berge SVG légères via Material Registry/Asset Adapter, rendu de cascade enrichi via son asset WorldObject existant, légère écume dynamique sans recomposition du sol statique. Même tracé de rivière, même traversalRule, mêmes objets/positions.
- **Propriétaires uniques :** WorldDocument référence un MaterialId ; Material Registry + Asset Adapter fournissent son apparence ; Surface Renderer et Relief Water Overlay affichent uniquement. WorldObject Asset Adapter fournit le sprite de cascade. Aucune nouvelle autorité de gameplay.
- **Gel :** style 2D, mouvement, collision, encounters, Combat, caméra, Builder mutations, génération, world save, culling et raster cache. Les surfaces visuelles ne déterminent jamais la traversée.
- **Tests/gates :** cohérence material ID / SVG, Material Registry + Asset Adapter, WorldDocument export/import identique, collision/terrain inchangés, overlays bornés et animation, Node/check, CI Chromium Builder/Encounter, validation Pixel paysage sur preview Pages **avant GREEN final**.
- **Risques :** raccord de berge artificiel, répétition de la texture, performances smartphone ; limiter les motifs et ne jamais redessiner le terrain par frame. Aucun import de nouvelle image binaire non vérifiée.
- **État technique (17/10) :** nouvelle texture eau turquoise 256×256 SVG et transition de berge 256×128 SVG, Asset Adapter et Material Registry dédiés au canyon ; cascade enrichie dans son sprite SVG canonique ; lignes d'écume bornées le long de la géométrie de rivière existante. Builder statique ; runtime animé ; river traversal, route, géométrie, collisions et style classique inchangés. Tests de non-régression et vrai navigateur CI [39035794102](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39035794102) **SUCCESS** (516/516 Node, npm check, Chromium Builder + Encounter). Les échecs intermédiaires de sentinelles de nombre de matériaux et de révision cache ont été réparés ; ancien manifeste WebP conservé inchangé et les nouveaux SVG sont des assets texte distincts. **Prévalidation technique seulement : essai Pixel paysage nécessaire avant GREEN final.**
- **Publication (17/10) :** checkpoint + snapshot immuables `checkpoint/exploration-canyon-water-art-v2-prevalidation-2026-10-17` et `preview/exploration-canyon-water-art-v2-2026-10-17` @ `ea3856230f4f981be011ae9f594dc2d209eb694d` ; PR infrastructure [#140](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/140) fusionnée (sources du jeu non fusionnées dans main). Déploiement Pages [39036009773](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39036009773) **SUCCESS**. **Lien de test :** `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?demo=relief-canyon-v1&rev=canyon-water-art-v2` ; Builder statique, « Tester en jeu » pour animation. **Statut : prévalidation technique seulement**, attend avis esthétique/fluide smartphone avant GREEN final ; micro-recalage falaise différé.

---

# Lot actif — 2026-10-17 — Effets d'eau légère pour le prototype canyon 2,5D

- **Branche unique :** `work/exploration-relief-water-fx-2026-10-17` depuis la prévalidation falaise `48d0ff48b03a7d786e6cebec23e61a0a2ddec587`, checkpoint de départ `checkpoint/exploration-start-relief-water-fx-2026-10-17`.
- **Retour auteur :** bord des falaises beaucoup mieux mais désormais légèrement trop restrictif ; c'est un micro-recalage futur distinct, pas une réouverture du Collision World. Style 2,5D proche de la 2D conservé et jugé encourageant. Demande suivante : expliquer/augmenter l'aspect vivant de l'eau et des cascades sans sacrifier la fluidité.
- **Périmètre :** fond de rivière du seul canyon en eau bleue déjà native, surcouche visuelle animée de courant/écume en jeu et filaments de chute d'eau animés au-dessus du WorldObject canonique. Builder conserve une prévisualisation statique lisible (pas de repaint continu en édition). Aucun asset lourd ajouté.
- **Propriétaire :** Renderer visuel en lecture seule ; WorldDocument et WorldObject Asset Adapter existants. Activation exclusivement sur le document démo `relief-canyon-pilot-v1` : le style classique reste strictement inchangé. Aucun moteur/collision/hauteur/état parallèle.
- **Gel :** mouvement, Collision World, falaises après correction validée, rencontres, Combat, caméra, éditeur de terrain, couches statiques/culling et cache, catalog d'assets binaires.
- **Gates :** tests purs de plans d'ondulation, filtrage de la démo, sérialisation/matériaux inchangés côté gameplay, CI Node/check/Chromium du Builder et Encounter, benchmark de surcharge visuelle à confirmer sur téléphone en mouvement. Pas de GREEN final sans contrôle auteur.
- **Risques :** sur-rendu des marques hors champ, surcoût du canvas mobile et lecture visuelle avec personnages. Garder le raster statique et limiter les motifs visibles. Une image de référence n'est pas un ensemble de sprites directement découpables.
- **État technique (17/10) :** CI [39031516266](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39031516266) **SUCCESS** (tests Node + check + Chromium réel : Builder, textures/pinceau intérieurs, carte relief opt-in et Encounter). Tests de courant, d'animation de chute, de non-mutation de WorldDocument/collision et de cache-busting. Un échec transitoire de sentinelle d'entrée HTML a été diagnostiqué et corrigé. **Prévalidation seulement** : attente de déploiement Pages et d'essai visuel/performance sur smartphone.
- **Point d'attention produit :** le retour « collision falaise légèrement trop stricte » est conservé comme micro-lot ultérieur indépendant des effets d'eau, sans toucher au Collision World.
- **Publication de prévalidation (17/10) :** snapshot immuable `preview/exploration-relief-water-fx-2026-10-17` @ `0a609e7dd88c3a866761203068dc7957e7a074b1`, checkpoint `checkpoint/exploration-relief-water-fx-prevalidation-2026-10-17`. PR infrastructure [#139](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/139) fusionnée, déploiement Pages [39031771255](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39031771255) **SUCCESS** ; sources de moteur non fusionnées dans `main`.
- **Lien d'essai :** `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?demo=relief-canyon-v1&rev=relief-water-fx-v1`. Le Builder montre les reflets fixes et le test en jeu anime courants/filaments de cascade/écume. **Prochaine action :** vérification esthétique et fluidité Pixel ; possible micro-recalage ciblé des deux falaises ultérieurement. Pas de GREEN final sans verdict créateur.

---

# Reprise active — 2026-10-17 — Prototype artistique 2,5D Canyon (opt-in)

- **Branche unique :** `work/exploration-relief-art-pilot-2026-10-17`; base documentaire et fonctionnelle `035fd01d0101036ea6c7dcaf66b1a7a5f2518f19`, checkpoint START `checkpoint/exploration-start-relief-art-pilot-2026-10-17`.
- **Périmètre :** trois premiers assets indépendants et transparents, `cliff_grassy_edge_01.svg`, `cliff_corner_01.svg`, `waterfall_blue_01.svg` dans `assets/exploration/objects/relief/`; Asset Adapter + catalog WorldObject canonique ; `src/world/relief-canyon-pilot-world.js` comme WorldDocument de démonstration éditable ; accès explicite `builder.html?demo=relief-canyon-v1&rev=relief-canyon-pilot-v1`.
- **Cohabitation des styles :** `builder.html` sans `demo` continue d'ouvrir la carte classique existante. La démo opt-in n'installe ni nouveau moteur, ni style global ; retour classique par lien visible dans la démo. Les 3 sprites de ce POC sont des placeholders dessinés vectoriellement cohérents, non la grande illustration générée en conversation (concept uniquement).
- **Autorités :** WorldDocument / WorldArea.surface / WorldObject Definition Catalog / WorldObject Asset Adapter / renderer existants ; les 2 falaises déclarent collision d'obstacle existante, la cascade est un décor non interactif. La rivière est la surface eau canonique ; aucune altitude traversable ou caméra 3D.
- **Gel :** Exploration Core/mouvement, collision resolver, caméra, surfaces/rivières et pont, capture encounter/combat, génération, persistance, dépôt principal ; aucune modification du style classique par défaut.
- **Gates :** tests unitaires de la démo opt-in, catalogue et roundtrip WorldDocument, Node/check, CI Chromium Builder et session de jeu, contrôle smartphone par le créateur avant GREEN final. Vérifier notamment si les SVG se chargent correctement sur Pages et si la profondeur des éléments est lisible.
- **Risques :** le relief est décoratif et n'offre pas encore de plateaux sur plusieurs hauteurs jouables ; le tri de profondeur des objets reste celui du moteur existant. Recharger le Builder via lien de démo change de carte en cours (exporter les changements d'abord).
- **Prochaine étape :** publier une preview via snapshot immuable Pages après CI. Tester visuellement sur smartphone et recueillir le retour esthétique avant tout chantier de hauteur jouable ou refonte du rendu.
- **Retour mobile créateur (17/10) :** esthétique jugée plutôt réussie, rendu toujours très proche de la 2D (vue simplement moins plongeante) ; falaises fonctionnelles sauf débordement d'environ 1–2 cm sur le haut de la paroi en arrivant de l'herbe. Le reste se comporte comme la version 2D. **Ce retour n'est pas une validation GREEN finale.**
- **Correction ciblée en cours dans la même branche :** checkpoint intermédiaire avant modification `checkpoint/exploration-relief-pilot-before-rim-collision-fix-2026-10-17` @ `4a28b71b1b92ac191568cde93101a13fac43daa6`. Les collisions canoniques des seules deux définitions de falaise ont été remontées au bord herbe/roche (grande : heightRatio .66, offsetY .08 ; angle : heightRatio .60, offsetY .08), sans changer le Collision World, la caméra, la hauteur jouable ni le style classique ; tests isBlocked et non-régression sur la rive supérieure ajoutés. Runtime et Builder rechargent le catalogue via `rim=relief-cliff-rim-v1`.
- **Suite :** confirmer Node/check + CI navigateur au SHA corrigé, figer prévalidation technique, repointer la preview Pages vers ce SHA immutable via PR infrastructure isolée ; nouvelle vérification smartphone des bordures avant GREEN final.
- **Gate correction confirmé :** CI [39026916723](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39026916723) SUCCESS (Node/check + Chrome réels) @ `5bc985237ad6db8fa59b21676b9cad1435fca21e`. Deux échecs transitoires de sentinelles de cache attendus ont été diagnostiqués puis corrigés ; nouvelle validation visuelle auteur requise avant GREEN final.

---

# Reprise active — 2026-10-17 — Pinceau et palette dédiés aux sols intérieurs

- **Branche unique :** `work/exploration-interior-floor-brush-2026-10-17` depuis le snapshot d'assets prévalidé `7ea8be2370d74256aa6dda8f0be0414a6d9d84b8`; checkpoint de départ `checkpoint/exploration-start-interior-floor-brush-2026-10-17`.
- **Retour utilisateur :** la liste « Area » ne montre que forêt/intérieur (normal : navigation entre zones) ; l'option « Texture du sol » ne règle que le fond entier ; absence de pinceau/palette intérieurs intuitifs.
- **Périmètre :** un onglet « Sol intérieur » visible uniquement sur WorldArea intérieur ; palette des 5 matériaux `floor.*`, fond de pièce et pinceau de taille distincte, couleur choisie sur plusieurs traits, annulation/suppression, accès direct depuis Area ; conserver WorldArea.surface.zones et Renderer existants.
- **Autorités :** WorldDocument surface zones / Material Registry / Asset Adapter, Builder éditant seulement le draft. AUCUN registre de matériaux concurrent, stockage parallèle, nouveau rendu ni déclencheur de traversée. Les zones de sol intérieures reprennent la famille de traversée du fond pour ne pas changer les vitesses en fonction des images.
- **Gel :** autres zones/extérieurs, routes/rivières, encounter/collision, combat, mouvement, bâtiments, entrées/portals, assets WebP.
- **Tests :** sélection des 5 sols, peinture à points/touch, couches multiples, sérialisation/rechargement, taille du pinceau, gate ancien terrain/mouvement, CI npm test/check/Chromium, contrôle smartphone avant GREEN final.
- **Risques :** UI masquée selon Area, pinceau ancien dirigé vers Terrain extérieur, persistances des calques, cache PWA. Publication sur preview isolée après succès des gates.
- **Résultat de vérification (17/10) :** CI réelle [39016961336](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39016961336) SUCCESS : 503/503 tests Node, npm check et Chromium. Le navigateur a changé le fond vers `floor.wood.dark`, activé le pinceau intérieur, peint une zone `floor.tile.light` de largeur 64, avec famille de traversée intacte (`plain`), bouton Undo opérationnel, onglet Terrain extérieur masqué ; tests Encounter Capture inchangés.
- **État :** GREEN technique / prévalidation, en attente de déploiement sur Pages et test smartphone auteur. Aucune fusion de sources de travail dans main.
- **Planification future uniquement (17/10) :** backlog d'objets/intérieurs/extérieurs/grottes/ruines et étude de style 2,5D enregistré dans [`EXPLORATION_LEVEL_DESIGN_BACKLOG.md`](./EXPLORATION_LEVEL_DESIGN_BACKLOG.md) par lot de documentation dédié `work/exploration-level-design-backlog-2026-10-17` (base/checkpoint START `6fb5aa394ee4769a34df60e34ce83d0f0a57c4d2`). Aucun travail moteur/asset engagé ; priorité fluidité et test mobile conservée.

---

# Reprise active — 2026-10-17 — Sols intérieurs : pack de 5 textures

- **Branche unique :** `work/exploration-interior-floor-texture-pack-2026-10-17` ; **base** `1b9524c06277efe1fd34263f0a0ed3f026c1a7e9` (CI technique GREEN, terrain-family-speed prévalidation toujours non final utilisateur).
- **Checkpoint de départ :** `checkpoint/exploration-start-interior-floor-texture-pack-2026-10-17`.
- **Périmètre :** assets purement visuels pour WorldArea intérieur : parquet chêne clair, parquet foncé, carrelage clair, dalles sable, béton gris. Images WebP 128×128 optimisées, manifest SHA-256/bytes, adaptation Material Pack et Asset Adapter existants ; choix dans le sélecteur existant « Texture du sol » ; sans moteur de rendu ni nouvelle source de vérité.
- **Autorités réutilisées :** WorldArea.surface.baseMaterialId → Material Registry → Material Asset Adapter → renderer. `floor.wood.house` existant conserve son ID et obtient son asset réel. Les quatre autres matériaux sont des IDs de surface dédiés ; pas de famille de terrain extérieure ajoutée.
- **Gel :** locomotion et terrain-family-speed, géométrie/bâtiments/portails, combats, collision, encounter, sauvegardes/WorldDocument, Game UI hors cache de modules.
- **Tests :** assetId/pack/adapter/manifest, hash et taille du binaire réellement commité, rétrocompatibilité floor.wood.house et sélection des 5 sols sur WorldArea intérieure, npm tests + check + CI GitHub + gate navigateur/smartphone avant GREEN final.
- **Risques :** binaire tronqué, vieux cache navigateur, matériaux intérieurs absents du sélecteur, collision avec chantier terrain speed encore en prévalidation.
- **État technique (17/10) :** 5 WebP de 128×128 déposés en binaire exacts (sha Git des originaux contrôlés), Material Pack + Asset Adapter + manifest avec SHA-256/bytes/WebP intégrés ; ancien ID `floor.wood.house` conservé ; choix des 5 sols dans le sélecteur d'Area intérieur (sans nouvelle UI). Tests Node 499/499, npm check et Chromium CI [39014881060](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39014881060) SUCCESS. Prévalidation technique seulement, smartphone en attente. Une sentinelle de cache existante a été mise à jour pour inclure `floors=interior-floor-textures-v1` après échec transitoire identifié et corrigé.
- **Prochaine action :** figer checkpoint technique ; publier une preview Pages depuis SHA immuable via branche infrastructure isolée, puis vérifier sur smartphone la sélection des 5 matériaux et leur rendu intérieur. Pas de GREEN final avant verdict utilisateur.

---

# Reprise active — 2026-10-17 — Réglages vitesse par famille de terrain

- **Branche unique :** `work/exploration-terrain-family-speed-editor-2026-10-17`
- **Base CI GREEN :** `ff3db58d6f7c065f7dc0b9fb556ce16c9115dd62` (Exploration CI SUCCESS), dernier socle Exploration ↔ Combat immersif ; aucune modification du labo Combat / dépôt principal.
- **Checkpoint de départ :** `checkpoint/exploration-start-terrain-family-speed-editor-2026-10-17` (SHA identique).
- **Constat :** le Builder n'expose plus la vitesse par terrain ; son modèle connait 8 familles mais le Traversal Rule Pack n'a que ground/road/water/bridge ; les zones peintes n'entrent pas dans le résolveur de vitesse.
- **Périmètre :** exposer les vitesses marche/nage/vol par famille dans le Builder, les sérialiser dans WorldDocument. Réutiliser le Traversal Rule Registry et le resolver central ; appliquer les zones peintes en jeu (priorité rivière > route > zone > fond ; bridge conserve son override).
- **Propriétaires :** Terrain Family Definitions (paramètres gameplay), Surface Traversal Registry/Resolver (traversée), Exploration Core (mouvement final), Builder (édition uniquement). Renderer, Material Registry, Encounter, Combat et interface de caméra sont gelés.
- **Compatibilité :** anciens mondes sans réglages gardent ×1.00 sol, ×1.25 route et ×0.75 nage. Zéro interdit un mode ; multiplication maximale 10. Le materialId ne décide jamais de la vitesse.
- **TDD :** sentinelles rétrocompatibilité, traversée réelle sur zone peinte, marche/nage/vol, route/mer, bridge, aller-retour Builder JSON et garde d'intégrité UI ; CI complète, puis gate smartphone avant GREEN final.
- **Risques :** migration de paramètres existants, priorité d'overlap des zones, cache JS PWA, mauvais point de départ. Aucun autre lot ni branche parallèle.
- **État :** CI technique GREEN — [run 38993188944](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/38993188944), core-tests + Chromium SUCCESS ; compatibilité legacy et vitesse réelle sur zones peintes vérifiées. **Prévalidation uniquement** ; attendre une publication isolée et le gate utilisateur smartphone avant GREEN final.
- **Checkpoint de prévalidation à figer :** `checkpoint/exploration-terrain-family-speed-editor-prevalidation-green-2026-10-17`.
- **Prochaine action :** publier une preview sans modifier les sources du labo Combat ni le dépôt principal, puis faire tester la rubrique « Familles de terrain » (Marche/Nage/Vol) et la traversée Route/Neige/Forêt/Mer sur smartphone.

---

## 2026-10-15 — Remplacement de la fausse vue Combat intégrée par l'interface Capture native

- Constat visuel utilisateur : raccord Combat précédent `c61798e` techniquement fonctionnel mais mauvaise page HUD ancienne ; les sprites de créatures inachevées sont provisoires **par choix de l'auteur**, ne pas les supprimer ni réinventer les assets.
- Base Explore `work/exploration-current-combat-refresh-2026-10-15@b36e4e4fbb9a4db34121e7ad550a641cfb0362f3`, checkpoint `checkpoint/exploration-start-native-combat-view-2026-10-15`, branche unique `work/exploration-native-combat-view-2026-10-15`.
- Version Combat retenue `work/lab-exploration-native-view-2026-10-15@85f5bc607266bfefdad233dcac50ff94797dfa18` : même template HTML, mêmes styles et même moteur que l'éditeur de combat récent. Snapshot, équipe, statut KO, résultat et retour conservent les autorités d'origine.
- Les audits d'intégration vérifient dorénavant que la page Encounter **consomme** réellement `capture-editor-v2.html > data-capture-preview-template` et `capture-editor-v2.css` au lieu d'accepter une copie de HUD ancienne ; test Chromium réel vérifie 16:9 paysage, dimensions des panneaux, bannière masquée en succès, acteurs et capacités.
- CI Explore `38791457656` et `38791457834` **SUCCESS** avant note de documentation ; CI Combat `38790911605` **SUCCESS**. Référence stable de code Explore `535b6d10b4b995edbc3e31ab2461d1dfd5a28ff0`.
- Aucun changement des rencontres par éléments cochés, rareté, WorldDocument, surface, collisions, Builder ou jeu principal. Déploiement public par PR infrastructure uniquement, une fois les gates verts ; prévisualisation précédente conservée comme rollback. Pas de GREEN FINAL avant vérification visuelle et combat jusqu'au retour sur le Pixel.

# LAB_CURRENT_WORK — Point de reprise unique

> ÉTAT ACTIF — 2026-10-13
>
> **Correctif de gate bloquant : Builder — familles de textures et performance mobile**
>
> Branche : `work/exploration-builder-terrain-texture-perf-gatefix-2026-10-13`
>
> Base du lot : `edfadb539fb53aacbf57dd91e79fe9a4efe374c1` (collision R2 prévalidation + gouvernance docs)
>
> Dernier GREEN FINAL utilisateur : `checkpoint/exploration-interior-geometry-authoring-v1-green-2026-10-10` (`11d1c4fe39b6bc8b587a3357dbca9e157a58bdab`)
>
> Collision v1 R2 : **toujours en attente de validation smartphone**, jamais GREEN FINAL.
>
> Gate correctif Builder : **GREEN technique, 435/435 tests ; Pages preview publiée / smartphone à valider**, pas de GREEN FINAL.
>
> Prochaine action : test smartphone du nouveau Builder Sable / familles / fluidité, puis verdict utilisateur ; ne pas ouvrir de nouveau lot avant validation.

> ÉTAT ACTIF — 2026-10-14
>
> Chantier : **Correctif prévalidation Builder — familles de peinture/texture éditables R2**
>
> Branche : `work/exploration-builder-terrain-texture-perf-gatefix-2026-10-13`
>
> Base GREEN protégée : Interior Geometry Authoring v1 ; Collision R2 en prévalidation distincte.
>
> Correctif performances R1 : fluidité mobile nettement améliorée, confirmé utilisateur le 2026-10-14. Corrections de palettes R2 : tests CI GREEN, preview/validation mobile nécessaires.
>
> Base GREEN exacte : `ab3ea4b761050977d181d424eb5bfb6439dd249e`
>
> Checkpoint précédent validé : `checkpoint/exploration-interior-geometry-authoring-v1-green-2026-10-10`
>
> Checkpoint de départ : `checkpoint/exploration-start-collision-boundary-worldobject-obstacles-v1-2026-10-10`

## Validation précédente

Le créateur valide le 2026-10-08 que la preview mobile R5 est **plus fluide** et demande de poursuivre le plan.

CI du commit de validation : `37741074814` — SUCCESS.
CI checkpoint GREEN UX : `37741136975` — SUCCESS.

## Besoin produit

L'édition d'une WorldArea intérieure doit permettre :
- régler sa **taille** ;
- régler sa **forme** ;
- conserver une édition simple sur smartphone ;
- poursuivre ensuite l'intégration des textures/assets, dans un lot séparé.

## Autorité canonique retenue

`WorldArea` reste l'unique propriétaire de la géométrie locale.

Contrat v1 :
- `width/height` restent l'étendue canonique et pilotent la taille ;
- nouvelle `boundary` canonique :
  - `{ kind: 'rectangle' }` ;
  - ou `{ kind: 'polygon', vertices: [{x,y}, ...] }` ;
- les vertices polygonales sont normalisées dans l'espace local 0..1 afin qu'un changement de width/height redimensionne la forme sans dupliquer les coordonnées ;
- absence de boundary dans une ancienne carte -> rectangle implicite ;
- aucun `shapePresetId` persistant : les presets Builder sont uniquement des commandes d'authoring vers la boundary.

## Formes Builder v1

Pour un intérieur :
- Rectangle ;
- L ;
- T ;
- Croix.

Une boundary polygonale importée qui ne correspond pas à un preset reste valide et sera affichée comme forme personnalisée ; le Builder ne la remplace pas silencieusement.

## Consommateurs obligatoires

La même boundary doit être consommée par :
- Collision World pour les limites de déplacement ;
- runtime renderer via un clip en lecture seule ;
- preview Builder via le même clip ;
- overlay Builder pour le contour ;
- taille Area existante pour redimensionner proportionnellement la boundary normalisée.

## Compatibilité / migration

- WorldArea schema v5 sans boundary -> WorldArea v6 rectangle ;
- round-trip import/export préserve la boundary canonique ;
- les anciennes WorldArea rectangulaires gardent exactement leur comportement ;
- pas de migration destructive.

## Périmètre fichiers attendu

- `src/world/world-area-model.js`
- nouveau helper pur de géométrie WorldArea si nécessaire
- `src/core/collision.js`
- helper render de clip WorldArea partagé runtime/Builder
- `src/main.js`
- `src/builder/world-builder-draft.js`
- `src/builder/world-builder-main.js`
- `builder.html`
- tests dédiés + sentinelles existantes
- docs architecture/ownership après GREEN technique

## Hors périmètre

- textures supplémentaires ;
- import de nouveaux assets ;
- génération procédurale d'intérieur ;
- éditeur libre de sommets polygonaux ;
- nouvelle collision d'objet ;
- Encounter/Combat ;
- Zombicide-40k.

## TDD obligatoire

RED avant implémentation :
1. schema v6 + migration v5 rectangle ;
2. polygon boundary normalisée/frozen ;
3. helpers point/cercle dans boundary ;
4. Collision World bloque le cutout d'une forme L ;
5. resize width/height conserve la forme normalisée ;
6. Builder intérieur expose Forme + taille sans seconde autorité ;
7. presets écrivent uniquement la boundary ;
8. runtime + Builder réutilisent le même clip read-only ;
9. les extérieurs/anciennes Areas restent rectangulaires.

## Gate

CI complète + preview + test smartphone obligatoire avant GREEN FINAL.


## TDD / implémentation — Interior Geometry Authoring v1

RED fonctionnel :
- commit : `4fbd40c9c44ba7896b0ea3ac01cc891622fc65e3`
- CI : `37741723179` — **FAILURE attendue**
- 409 tests : 400 GREEN, 9 RED ciblés sur schema v6, boundary, collision, Builder, presets et clip partagé.

Implémentation fonctionnelle :
- commit : `3d87e32892b7d145467cb9f32373473b3504e857`
- CI : `37742123865` — **SUCCESS**
- 409/409 tests GREEN.

Livré :
- WorldArea schema v6 ;
- ancienne Area sans boundary -> rectangle canonique ;
- boundary polygonale normalisée en coordonnées 0..1 ;
- helpers purs de géométrie WorldArea ;
- Collision World bloque hors boundary et respecte les cutouts concaves ;
- clip WorldArea partagé par runtime + preview Builder ;
- Builder intérieur : formes Rectangle / L / T / Croix ;
- forme importée non reconnue conservée comme Personnalisée ;
- width/height existants redimensionnent la forme proportionnellement ;
- aucune donnée `shapePresetId` persistée ;
- Taille Area directe continue d'écrire uniquement width/height.

TDD cache :
- RED : `867bd9102248adce1bd44758180b94750ba3ca18`
- CI : `37742252525` — **FAILURE attendue**, 409/410 GREEN, uniquement cache public ;
- code cache : `a8adfb4eb7652594c61aeab9f83aaaaabfa8b91c`
- sentinelles alignées : `5047f48ab9d283d24348130acb7513924f1cf349`
- CI : `37742615742` — **SUCCESS**, 410/410 tests.

Révision publique :
`interior-geometry-authoring-v1`

## Gate attendu

Sur smartphone :
1. ouvrir un intérieur ;
2. changer Rectangle -> L -> T -> Croix ;
3. vérifier que le sol et les objets/acteurs visibles sont bien clipsés à la forme ;
4. vérifier qu'on ne peut pas marcher dans les zones découpées ;
5. modifier Largeur/Hauteur puis Taille Area directe ;
6. vérifier que la forme se redimensionne sans se déformer arbitrairement ;
7. tester `← Extérieur` puis `Intérieur →` ;
8. vérifier que le Builder reste fluide comme en R5.

État : **GREEN TECHNIQUE — documentation + checkpoint/preview requis avant validation utilisateur.**


## Prévalidation publiée — Interior Geometry Authoring v1

- SHA gameplay/docs prévalidation : `085a2aa100274af1676b17b420359bc0b509ac4a`
- CI work : `37742782556` — **SUCCESS**
- checkpoint : `checkpoint/exploration-interior-geometry-authoring-v1-prevalidation-green-2026-10-08`
- CI checkpoint : `37742828444` — **SUCCESS**
- preview : `preview/exploration-interior-geometry-authoring-v1-2026-10-08`
- publication infrastructure uniquement : PR #105
- merge infra `main` : `faf4704d2489ff1f764804acf6ed2d9b77e4d642`
- Pages : `37742930654` — **SUCCESS**
- aucun gameplay du lot n'a été mergé dans `main`.

Lien de gate :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=interior-geometry-authoring-v1`

État : **GREEN TECHNIQUE / PREVALIDATION — attente validation smartphone de la forme/taille intérieure avant GREEN FINAL et avant le lot textures.**


## Gate smartphone prévalidation v1 — verdict NEGATIF

Retour utilisateur du 2026-10-09 :
- intérieur en forme T : à l'entrée, le personnage se retrouve bloqué entre le sol intérieur et la bordure noire, déplacement impossible ;
- rochers / objets : le personnage peut marcher dessus.

Verdict :
- **GREEN FINAL refusé** ;
- le défaut d'arrivée Portal est dans le périmètre Interior Geometry Authoring v1 ;
- la collision générique des WorldObjects est confirmée comme lacune distincte : le Collision World v1 ne bloque actuellement que les `building` dotés d'un footprint. Les `rock`, `tree`, `door`, `stairs` n'ont pas de footprint collision canonique dans leurs ObjectDefinitions.
- conformément à la charte, la collision générique d'objets n'est pas ajoutée en douce dans ce lot. Elle devient le prochain lot explicite après validation de la correction intérieure.

### Cause du blocage T

Le système historique de Building Interior plaçait la première entrée à :
- X = centre - 144 px ;
- Y = bas de l'Area - 104 px.

Pour une Area 720×560 en forme T, la tige basse commence vers X = 230.4.
La première entrée pouvait donc être placée vers X = 216 : **hors de la boundary jouable**.

Changer Rectangle -> T après création du Portal conservait également ces coordonnées rectangulaires devenues invalides.

### TDD regression

RED :
- commit : `d0c6b4857574d910251d3b34c705f973666ef823`
- CI : `38000127075` — **FAILURE attendue**
- tests du vrai chemin :
  - création Building -> intérieur ;
  - changement boundary -> T ;
  - Portal -> target Spawn ;
  - vérification clearance dans boundary ;
  - transition -> Collision World ;
  - mouvement immédiatement après l'entrée ;
  - liaison directe vers une Area T existante.

Correctif :
- helper pur `findWorldAreaBoundarySafePoint()` :
  `1ca80e92729c1f6105f6679757bd80a95dedfc49`
- raccord Draft / Portal / Spawn :
  `e3b414a3034892e6c29e31c67b53c35849e49734`
- correction du test pour respecter l'état Portal frozen :
  `c862ddaab959bd3fcae6d014a6eec6f15e14117e`
- CI : `38000304668` — **SUCCESS**.

Comportement corrigé :
- une liaison créée directement vers une forme T choisit un Spawn + trigger de sortie réellement praticables ;
- si la forme ou la taille d'une Area rend un Spawn/trigger Portal invalide, le Draft le replace vers le point praticable le plus proche ;
- la boundary WorldArea reste l'unique autorité ;
- aucun X/Y parallèle UI/Renderer n'est ajouté ;
- les autres points valides ne bougent pas.

### Cache/publication R2

Révision publique :
`interior-geometry-authoring-v1-r2`

- chaîne publique R2 : `3339b980592e91e2219a41f85c8ad67dd196cf29`
- sentinelles/imports imbriqués R2 : `77f255cb62cb0bee70676ec99a64eabc46229f3e`
- CI : `38000499216` — **SUCCESS**.

## Prochain lot confirmé — WorldObject Collision Footprints v1

À ouvrir uniquement après validation utilisateur de la R2 intérieure.

Objectif déjà audité :
- `building` : collision footprint existe déjà ;
- `rock` / `tree` : visuels/baseSize présents mais aucune collision canonique ;
- Collision World filtre actuellement explicitement `object.kind !== 'building'`.

Le prochain lot devra :
- déclarer la collision dans ObjectDefinition, pas dans le Renderer ;
- fournir des footprints adaptés par catégorie/définition ;
- faire consommer ces footprints par Collision World ;
- préserver Bridge traversal, Building footprint et objets volontairement franchissables ;
- tests vrais chemins héros + entités vivantes ;
- aucun calcul de collision depuis les pixels/assets.

État : **GREEN TECHNIQUE R2 / PREVALIDATION — publication + retest smartphone requis.**


## R2 publiée — gate smartphone correction entrée T

- SHA checkpoint/preview R2 : `62ee2defd343a4762bad1afb771a6894aaae521a`
- CI work documentée : `38000570123` — **SUCCESS**
- checkpoint : `checkpoint/exploration-interior-geometry-authoring-v1-prevalidation-r2-green-2026-10-10`
- CI checkpoint : `38000605260` — **SUCCESS**
- preview : `preview/exploration-interior-geometry-authoring-v1-r2-2026-10-10`
- publication infrastructure uniquement : PR #106
- merge infra `main` : `f295c12a34c0ce18a5914612976d362a7e670c0e`
- Pages : `38000677822` — **SUCCESS**
- aucun gameplay du lot n'a été mergé dans `main`.

Lien R2 :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=interior-geometry-authoring-v1-r2`

Gate demandé :
1. intérieur T ;
2. entrer depuis le Building ;
3. confirmer que le personnage apparaît sur la zone de sol et peut bouger immédiatement ;
4. sortir / rentrer ;
5. tester L et Croix ;
6. resize puis nouvelle entrée.

Le défaut rochers/objets franchissables reste volontairement **non corrigé dans ce lot** : il est déjà audité et réservé au prochain chantier `WorldObject Collision Footprints v1`.

État : **GREEN TECHNIQUE / PREVALIDATION R2 — attente validation utilisateur de l'entrée intérieure. GREEN FINAL interdit avant verdict.**


## Gate smartphone R2 — VALIDÉ utilisateur

Retour utilisateur du 2026-10-10 :
- correction entrée intérieur T : **validée** ;
- défaut résiduel observé : le haut du sprite du héros peut encore entrer dans le noir avant que son petit cercle de collision atteigne la boundary ;
- demande explicite : traiter en même temps les rochers/objets traversables.

Le lot **Interior Geometry Authoring v1** est fonctionnellement validé sur son objectif forme/taille/Portal.
Le problème visuel restant appartient au prochain lot Collision World : profil de clearance de silhouette contre les boundaries.

## Prochain lot — Collision Boundary & WorldObject Obstacles v1

Propriétaire unique : **Collision World**.

Périmètre :
- profil de collision de silhouette explicite pour acteur, indépendant des pixels/assets ;
- boundary WorldArea bloque la silhouette avant qu'une partie importante du corps ne soit clipsée dans le noir ;
- ObjectDefinition peut déclarer un comportement collision `obstacle` ou `passable` ;
- rochers et arbres livrés deviennent des obstacles canoniques avec footprint logique ;
- Collision World consomme le footprint générique, sans filtre codé en dur `kind === building` ;
- import d'objet utilisateur expose explicitement **Obstacle / Traversable** ;
- un import classé Obstacle reçoit une collision logique par défaut éditable ultérieurement ;
- Building footprint et Bridge traversal restent compatibles.

Interdits :
- déduire la collision depuis les pixels du sprite/image ;
- recopier l'objet dans `WorldArea.obstacles[]` ;
- collision dans Renderer ;
- modifier textures/assets dans ce lot.

Décision d'autorité :
- `WorldArea.obstacles[]` reste réservé aux obstacles géométriques autonomes ;
- un WorldObject classé obstacle conserve **sa propre collision dans son ObjectDefinition** ;
- le placement WorldObject reste la seule position/rotation/scale de cet obstacle.

Statut : Interior Geometry Authoring v1 -> **VALIDÉ utilisateur / checkpoint final à créer**, puis ouverture du lot Collision.


## Validation finale utilisateur — Interior Geometry Authoring v1 (base GREEN)

- Retour : « Ok je valide, tout est ok. »
- SHA final GREEN du lot antérieur : `11d1c4fe39b6bc8b587a3357dbca9e157a58bdab`.
- CI work `38033298058` SUCCESS ; checkpoint `38033337107` SUCCESS.
- Filiation historique à signaler : le checkpoint START de Collision avait été créé sur
  `ab3ea4b761050977d181d424eb5bfb6439dd249e` avant le commit
  documentaire de clôture GREEN `11d1c4f`. Les fichiers gameplay étaient
  déjà identiques. La prévalidation R2 réconcilie `11d1c4f` comme parent
  de merge sans supprimer les commits TDD existants ; le START historique
  reste néanmoins sur `ab3ea4b`.

# Lot actif — Collision Boundary & WorldObject Obstacles v1

Date : 2026-10-10

## Retour utilisateur déclencheur

- la R2 Interior Geometry est validée ;
- dans un intérieur, le haut du héros peut encore être clipsé par le noir car la boundary ne teste que le petit cercle de pieds ;
- rochers et autres objets décoratifs sont traversables ;
- demande produit : un modèle importé classé **Obstacle** doit automatiquement utiliser la collision moteur.

## Propriétaire

**Collision World**.

## Contrat acteur

Le renderer ne fournit aucune géométrie gameplay.

L'entité peut déclarer un profil gameplay :
`boundaryFootprint = { left, right, top, bottom }`.

Fallback :
- sans profil -> cercle historique `radius` ;
- avec profil -> la silhouette logique doit tenir dans la WorldArea boundary avant mouvement.

Le héros démo aura un profil explicite cohérent avec sa silhouette de jeu, sans lecture des pixels/alpha.

## Contrat WorldObject

L'ObjectDefinition peut déclarer :
`collision: { role: 'obstacle'|'passable', shape: 'box', widthRatio, heightRatio, offsetX, offsetY }`.

Règles :
- position/rotation/scale viennent uniquement du placement WorldObject ;
- Collision World transforme le footprint logique depuis la définition ;
- Renderer ne calcule jamais la collision ;
- aucun duplicata dans `WorldArea.obstacles[]` ;
- Building footprint historique reste supporté ;
- Bridge traversal reste prioritaire et traversable ;
- rock/tree natifs -> obstacle ;
- door/stairs/decor restent passables par défaut tant qu'une définition ne dit pas le contraire.

## Import utilisateur

Le panneau d'import expose :
- **Obstacle — bloque le passage**
- **Traversable**

Le record local versionné conserve cette intention.
Les anciens records sans ce champ sont migrés de façon compatible :
- rock/tree -> obstacle ;
- autres -> passable, sauf Building qui conserve son contrat historique.

## TDD RED obligatoire

1. silhouette acteur bloque avant le mur haut ;
2. mouvement vrai chemin ne peut pas pousser la tête dans la boundary ;
3. sans profil, cercle historique inchangé ;
4. rochers/arbres natifs déclarent obstacle ;
5. Collision World bloque leur footprint orienté/scalé ;
6. Building historique toujours bloquant ;
7. Bridge toujours franchissable selon traversal ;
8. import utilisateur Obstacle -> ObjectDefinition collision obstacle ;
9. import Traversable -> aucune collision bloquante ;
10. record v1 ancien -> migration déterministe ;
11. UI import expose Obstacle/Traversable ;
12. aucune dépendance asset/pixels dans Collision World ;
13. living creatures consomment le même Collision World.

## Hors périmètre

- rendu d'occlusion derrière les murs ;
- éditeur fin de footprint ;
- collision pixel-perfect ;
- nouvelles textures/assets ;
- combat ;
- Zombicide-40k.

## Gate

CI complète puis preview smartphone :
- mur haut intérieur ;
- rochers/arbres ;
- objet importé Obstacle ;
- objet importé Traversable ;
- Bridge/Building non régressés.


## TDD / implémentation — Collision Boundary & WorldObject Obstacles v1

### RED fonctionnel

- contrat TDD : `62698a345b1a39a78b276f877260698adab010ba`
- CI : `38023628937` — **FAILURE attendue**
- couverture :
  - silhouette acteur asymétrique contre boundary ;
  - déplacement vrai chemin au mur haut ;
  - fallback cercle historique ;
  - rock/tree natifs obstacle ;
  - footprint WorldObject orienté/scalé ;
  - Building historique / Bridge non régressés ;
  - import utilisateur Obstacle / Traversable ;
  - migration record utilisateur v1 ;
  - living runtime reste consommateur du même Collision World.

### Implémentation fonctionnelle

Acteur / boundary :
- `boxFitsWorldAreaBoundary()` : `422540987d26102d874ea57b81e430e4f97edfdb`
- profil joueur `boundaryFootprint` : `08fa32c4643fede65a7bd593690c53a40070ef54`
- normalisation config : `5578dad812688fcd00a40fd972717a5f4d8501e0`
- raccord runtime : `54ee99b9a74db3fbb3e7944e305e7cf6c248f324`

WorldObject obstacle :
- rock/tree natifs déclarés obstacle dans ObjectDefinition : `7237ba821fbf7a2000d006272d587203b108a0de`
- résolution placement -> collision définition : `cadb26fa0865ec0cea698ea5098a65b745424a06`
- footprint générique `worldObjectObstacleRect()` : `f3c2d4871d74326090da5e3ad242973467ee72e4`
- Collision World générique : `aff488ebbe947f3e106932018db1e6d96454142c`

Import utilisateur :
- record v2 + `collisionRole` + migration v1 : `4250cefae99e0bbb91094d18d851399388810e1e`
- UI Obstacle / Traversable : `022b3e8a1513d489818dd977a516196a965d0197`
- raccord Builder : `d0a12e192b8726cd349dc83f481784c06ff9c143`
- ajustement des nouvelles sentinelles géométriques : `a798a386c47ae18762b8e54ce5c3b7779ec314ca`
- CI fonctionnelle intermédiaire : `38023867529` — **SUCCESS, 425/425**.

### Cache public

- RED cache : `274622954da5f28b6360cd33e87b836496b32b1c`
- CI : `38023908679` — **FAILURE attendue**
- révision publique : `collision-boundary-worldobject-obstacles-v1`
- chaîne Builder/runtime/Core/WorldObject alignée ;
- sentinelles historiques réconciliées sans retirer leur couverture ;
- CI chaîne cache : `38024238259` — **SUCCESS, 426/426**.

### Vrai chemin import utilisateur

Un dernier audit avant publication a détecté que le Collision World utilisait encore par défaut le catalogue natif, alors que les imports sont résolus par le catalogue composé runtime.

TDD :
- RED : `f57cf1caac959cbe4c92081f608d3f6924b2c2e2`
- CI : `38024297618` — **FAILURE attendue**.

Correctif :
- injection explicite `collisionContext.objectCatalog` dans Collision World ;
- `stepMovement()` propage le contexte ;
- wildlife spawn + choix de cible + déplacement réel utilisent le même catalogue composé ;
- le catalogue runtime reste un resolver injecté, jamais une donnée persistée dans WorldDocument ;
- raccord final runtime : `4a8d51c0dc2b3a1d176d28085db5f38858d1b0ee`.

CI finale fonctionnelle :
- `38024391220` — **SUCCESS**
- **428/428 tests GREEN**
- `npm run check` GREEN.

## Comportement livré

- le héros est arrêté par la boundary avant que sa tête / haut de silhouette entre dans le noir ;
- sans profil de silhouette, une entité conserve le cercle historique ;
- rochers et arbres natifs bloquent le passage via leur ObjectDefinition ;
- footprint suit placement X/Y, rotation et scale ;
- Building conserve son footprint historique ;
- Bridge conserve son corridor de traversée et ne devient pas obstacle ;
- import utilisateur : choix explicite **Obstacle — bloque le passage** / **Traversable** ;
- anciens records utilisateur sans champ collision : rock/tree -> obstacle, autres -> passable ;
- aucun calcul de collision depuis PNG/WebP/alpha/pixels ;
- aucun WorldObject n'est recopié dans `WorldArea.obstacles[]`.

État : **GREEN TECHNIQUE — documentation/checkpoint/preview requis avant validation smartphone. GREEN FINAL interdit avant verdict utilisateur.**


## Prévalidation publiée — Collision Boundary & WorldObject Obstacles v1

- SHA checkpoint/preview : `5b1c456de5611890d77bf523de35f9ad60112d82`
- CI work documentée : `38024519933` — **SUCCESS**
- checkpoint : `checkpoint/exploration-collision-boundary-worldobject-obstacles-v1-prevalidation-green-2026-10-10`
- CI checkpoint : `38024549851` — **SUCCESS**
- preview : `preview/exploration-collision-boundary-worldobject-obstacles-v1-2026-10-10`
- publication infrastructure uniquement : PR #107
- merge infra `main` : `1776c54cb53be686660e5963812e6778b0a4b03a`
- Pages : `38024603684` — **SUCCESS**
- aucun gameplay du lot n'a été mergé dans `main`.

Lien de gate :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=collision-boundary-worldobject-obstacles-v1`

Gate smartphone :
1. entrer dans un intérieur et marcher vers le mur du haut : la silhouette doit être arrêtée avant que le haut du corps entre dans le noir ;
2. extérieur : tenter de traverser rocher et arbre natifs ;
3. vérifier Building + Portal ;
4. traverser un Bridge ;
5. importer un modèle avec Collision = Obstacle, le placer et tester le blocage ;
6. importer/classer un modèle Traversable et vérifier le passage ;
7. vérifier formes T/L/Croix et navigation intérieur/extérieur.

État : **GREEN TECHNIQUE / PREVALIDATION — attente du verdict smartphone. GREEN FINAL interdit avant validation utilisateur.**


## R2 — Correction d'architecture avant validation smartphone

Audit complémentaire du 2026-10-10 : le Collision World conservait
un cas spécial `object.kind === 'building'` malgré le nouveau résolveur générique.

- RED architectural : `da67d2fdb799109417e641af18129b28f203a998`
  / CI `38052251914` FAILURE ciblée.
- Fix générique : `9e7a68fa1a93614f42e47ec67615edaa8e1f31ec`
  + suppression du cas spécial `30d0d331120d788bb9c909866d34005cf7928f8f`.
- CI : `38052319049` SUCCESS — 429 tests.
- RED chaîne de cache R2 : `bf5b86abd06b2a81681334f1e2ef9de21bc83d78`
  / CI `38052396832` FAILURE attendue.
- Chaîne publique R2 : `bc196e6e794ec7592d295c4e28f3a94029f2face`.
- Trois sentinelles de révision exacte réalignées :
  `1e9c56b3f978cd66fb9043a2d82260dd5176b2f6`.
- CI R2 : `38052495858` SUCCESS — 430 tests + npm run check.
- `WorldObject.collision` explicite prévaut ; à défaut, le `footprint`
  historique de l'ObjectDefinition reste consommé par le résolveur générique.
- Le Collision World n'a désormais plus de branche bâtiment.
- Aucun pixel, renderer ni `WorldArea.obstacles[]` secondaire.
- Bridge, Portal, Import, Living et silhouettes restent protégés par tests.
- Révision navigateur R2 : `collision-boundary-worldobject-obstacles-v1-r2`.

Statut : **GREEN TECHNIQUE R2 ; nouvelle publication et gate smartphone requis.
GREEN FINAL interdit avant confirmation utilisateur.**


## Publication R2 — gate smartphone

- SHA checkpoint/preview R2 : `1a69029adb43e043f0f9fee06039ce09e173da73`.
- CI work docs R2 : `38052582560` — **SUCCESS**.
- Checkpoint :
  `checkpoint/exploration-collision-boundary-worldobject-obstacles-v1-prevalidation-r2-green-2026-10-10`.
- CI checkpoint : `38052600633` — **SUCCESS**.
- Preview :
  `preview/exploration-collision-boundary-worldobject-obstacles-v1-r2-2026-10-10`.
- Publication infrastructure **seule** : PR #108 (merge squash main
  `96dc06430e06e14ef182184e9c7e4f69c4637b01`).
- Pages R2 : `38052658975` — **SUCCESS**.
- Aucun gameplay Collision/Builder du lot n'a été mergé sur `main`.
- Vérification filiation : `11d1c4f` est ancêtre du checkpoint R2 ;
  comparaison GREEN -> R2 : 58 commits ahead, 0 behind.
- Lien de gate :
  `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=collision-boundary-worldobject-obstacles-v1-r2`.

Verdict : **GREEN TECHNIQUE / PREVALIDATION R2**.
Attente de validation smartphone utilisateur ; **pas de GREEN FINAL** avant verdict.
Les textures restent hors du présent lot.

## Correctif de gate — Peinture familles / fluidité Builder, 2026-10-13

Retour utilisateur : choisir Sable laisse souvent Herbe et l'éditeur mobile ralentit très fortement même avec peu d'objets. Priorité à la résolution avant d'ajouter textures ou mécanique.

- Lot séparé : `work/exploration-builder-terrain-texture-perf-gatefix-2026-10-13`
- Checkpoint start : `checkpoint/exploration-start-builder-terrain-texture-perf-gatefix-2026-10-13` au SHA `edfadb539fb53aacbf57dd91e79fe9a4efe374c1`.
- RED : `bd7b662a0689199566c0aa0dc01d7e22861441ca`, run `38472482630` FAILURE attendue.
- Cause 1 : la famille sémantique et le matériau visuel sont indépendants (bon ownership), mais le Builder ne liait pas leurs sélecteurs ; le matériau Herbe restait actif.
- Fix : catalogue visuel `terrain-family-materials.js` avec matériaux natifs classés par 8 familles, 2 surfaces de démonstration Mer et Route, filtrage de la liste par famille, défaut de texture associé au changement de famille. `WorldDocument` conserve les ids séparés sans seconde autorité gameplay.
- Import texture sol : champ famille explicite, records existants sans famille restent compatibles (Plaine par défaut dans la bibliothèque ; aucune réécriture silencieuse de leurs fichiers).
- Cause 2 : même une faible quantité de traits entraînait la copie du document à chaque échantillon tactile et la création de deux masques de la dimension du viewport en unités monde. Les masques sont maintenant paresseux, bornés aux traits visibles et réutilisent les tampons ; les points tactiles sont coalescés par frame.
- Préservation R2 : mouvements/collisions WorldObject, Bridge et Building inchangés. Aucun changement dans Zombicide-40k ou labo Combat.
- GREEN technique code : `f1e7da11a65921b3b0ad1c5f47f623147c983ab0`, CI `38473354843` SUCCESS, **435/435 tests** et `npm run check` SUCCESS.
- Recalage des sentinelles : uniquement la révision navigateur des entrypoints ; versions des autorités Collision et WorldObject continuent de pointer vers R2.
- **Pas de validation mobile ni mesure réelle FPS à ce stade.** La performance effective du Pixel et la lecture des textures devront être contrôlées par l'utilisateur.
- Prochaine étape : checkpoint technique + preview Pages ; verdict mobile puis GREEN FINAL. Le gate Collision R2 reste ouvert et sera couvert par ses propres contrôles.

## Publication du correctif de gate Builder — 2026-10-13

- Prévalidation SHA : `76ee8373c6e4a312b8bab1bcc5326c244d437b75`.
- CI sur work : `38473569718` SUCCESS ; checkpoint CI `38473624249` SUCCESS.
- Checkpoint technique : `checkpoint/exploration-builder-terrain-texture-perf-gatefix-prevalidation-green-2026-10-13`.
- Branche preview : `preview/exploration-builder-terrain-texture-perf-gatefix-2026-10-13`.
- Publication Pages par PR infra **#110** (seul `.github/workflows/pages-preview.yml` modifié).
- Merge infra-only `main` : `9ad28978d5b98236126fd27a5e5bd8919d583d84`.
- Pages run `38473845161` : **SUCCESS**.
- Lien officiel de test : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=terrain-family-perf-gatefix-v1`.
- Aucun code Builder / SurfaceRenderer / Material Registry du lot n'a été mergé dans `main`.
- **Toujours PREVALIDATION : verdict smartphone Sable / imports / performance requis.**
- **Collision R2 toujours non validé manuellement**, GREEN FINAL interdit pour ce lot également.


## Prévalidation R2 — classement des familles de peinture entièrement éditable (2026-10-14)

Retour créateur après test Pixel en paysage : **grosse amélioration de fluidité validée** ; trois défauts visuels/UX restaient bloquants : herbe cartoon retirée de Forêt, familles Route/Mer proposées sous Sol, Plaine manquante dans les choix visibles. L'ancienne table de correspondance native fixée dans le code était incompatible avec la gouvernance GenSrpG : tout doit rester éditable.

- Même branche de gatefix, sans nouveau moteur graphique et sans toucher aux collisions ni à Combat : `work/exploration-builder-terrain-texture-perf-gatefix-2026-10-13`.
- RED ciblé `4ce3685`, run `38479770652` FAILURE attendue.
- Matériaux natifs déclarent une **famille visuelle indicative** dans Material Pack (Forêt propose d'abord Herbe cartoon, puis Sol de forêt ; Plaine propose Terre ; Sable garde Sable).
- Le classement `surfaceMaterialIds[]` est **éditable dans la famille du WorldDocument** ; c'est une liste de présentation du Builder, jamais une règle gameplay ou un alias de collision. Les imports réutilisent l'autorité User Material Library et rejoignent explicitement cette liste si elle a été personnalisée.
- Les familles ont un rôle d'outil `paintKind` éditable, valeurs Sol/Route/Rivière ; le pinceau Sol ne propose plus Route ni Mer, mais propose Plaine. Compatibilité d'anciens documents et zones existantes conservée.
- La table fixe `NATIVE_SURFACE_FAMILIES` a été supprimée : plus de routage par identifiants de matériau dans la logique UI. Les presets restent **des données initiales configurables**, pas des règles moteur immuables.
- Le moteur des rencontres, WorldSurface, Collisions et le rendu haute qualité du jeu ne sont pas modifiés. La performance mobile déjà confirmée est préservée.
- Commits fonctionnels `659c345a`, `d2550a8e`, cache `91d786e5`, sentinelles `f4940ade`, CI `38480643515` SUCCESS, **438/438 tests** et `npm run check` SUCCESS au SHA `1623614534bddf2729f6222bdf0f5cb259ccfc95`.
- Checkpoint documentaire : `docs/checkpoints/EXPLORATION_BUILDER_TERRAIN_FAMILY_PALETTE_EDITABLE_R2_PREVALIDATION_2026-10-14.md`.
- Prochaine action : checkpoint prévalidation R2 + publication Pages **infra-only** ; test smartphone des palettes puis GREEN FINAL. Collision R2 reste à valider indépendamment.


## Publication R2 — familles et peinture éditables (2026-10-14)

- SHA checkpoint technique : `d03675a391dabda6bb13567fc11cd5305d9ed4c7`.
- CI checkpoint : `38480850396` SUCCESS, 438/438 tests et npm run check.
- Ref checkpoint : `checkpoint/exploration-builder-terrain-family-palette-editable-v2-prevalidation-green-2026-10-14`.
- Ref preview : `preview/exploration-builder-terrain-family-palette-editable-v2-2026-10-14`.
- PR infra-only : **#111**, merge `main` `8a46beac33230f3b616fcb4f0a206fe6745aed46` ; un seul fichier modifié : `.github/workflows/pages-preview.yml`.
- Pages `38480939249` **SUCCESS**.
- URL officielle de gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=terrain-family-palette-editable-v2`.
- Aucun code de gameplay ni Builder n'a été mergé sur `main` ; R2 **PREVALIDATION uniquement**.
- Validation utilisateur déjà recueillie : forte amélioration de fluidité R1. **Nouvelle validation du classement R2 et gate Collision R2 encore nécessaires**, GREEN FINAL interdit.


## Activation du test avec carte vierge / export — 2026-10-14

Retour créateur : la fluidité est nettement meilleure, souhait de démarrer les tests R2 sur une **carte vierge** et d'exporter son monde pour le reprendre.

- Branche dédiée : `work/exploration-builder-blank-world-export-2026-10-14`.
- Départ / prévalidation héritée : `f7a7e72ffcedfc48f1de862becf52eb13a838cf0`, checkpoint start `checkpoint/exploration-start-builder-blank-world-export-2026-10-14`.
- RED `1ab0b132` : exigences vierge jouable / export import / UX mobile.
- Code `5243527a` : fabrique World Builder Draft canonique (une Area + spawn, aucun objet/tracé/portail/événement/rencontre), commande Nouvelle carte avec confirmation, export WorldDocument visible en en-tête et dans JSON, contrôles d'état/UI remis à zéro ; données et familles toujours éditables.
- Navigation de test/reprise et chaînes de cache réalignées sans toucher aux autorités Collision et WorldDocument.
- CI `38515546118` **SUCCESS — 441/441 tests + npm run check**.
- Export = fichier `.world.json` réimportable ; images importées par l'utilisateur toujours locales, non empaquetées dans JSON.
- Checkpoint de lot : `docs/checkpoints/EXPLORATION_BUILDER_BLANK_WORLD_EXPORT_PREVALIDATION_2026-10-14.md`.
- État **GREEN TECHNIQUE / PREVALIDATION** : publication Pages + verdict smartphone requis avant GREEN FINAL. Le gate Collision R2 reste indépendant.


## Publication Builder « carte vierge / export » — 2026-10-14

- Checkpoint de prévalidation : `checkpoint/exploration-builder-blank-world-export-prevalidation-green-2026-10-14` au SHA `1edfdf017acd06a7a9d933f4381485f12e06afe2`.
- CI du work `38515703439` SUCCESS (441/441, npm run check) ; CI du checkpoint SUCCESS.
- Preview : `preview/exploration-builder-blank-world-export-v1-2026-10-14` au même SHA.
- PR infrastructure seule #112 mergée dans `main`, SHA `b89d8fae6e3d4fe08ad9dc792c7a951889a1084f`.
- Workflow Pages `38515826673` SUCCESS.
- URL de test : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=builder-blank-world-export-v1`.
- Aucun Builder/moteur WorldDocument mergé dans `main`.
- Reste en **prévalidation** en attente du verdict smartphone pour carte vierge, export/import, R2 palettes et Collision R2 (ce dernier séparé). Aucun GREEN FINAL anticipé.

## Correction bloquante : pinceau carte vierge et accès aux textures — 2026-10-14

- Retour créateur : après création de carte vierge, pinceau inutilisable et réglages de textures peu clairs ; le chantier caméra distinct est suspendu pour traiter ce blocage.
- Branche `work/exploration-builder-paint-workflow-fix-2026-10-14` ; checkpoint start `checkpoint/exploration-start-builder-paint-workflow-fix-2026-10-14` à `4918a98f`.
- Cause exacte : `refreshTerrainControls` utilisait la constante `paintableTerrainFamilies` avant sa déclaration JavaScript (TDZ), interrompant les commandes de peinture.
- Fix : ordre d'initialisation corrigé ; accès direct Type/Famille/Texture/Pinceau ; réglages complexes repliables sans perdre l'éditabilité ; pinceau tactile sans passage obligatoire plein écran ; touche simple et tracés successifs autorisés.
- TDD RED `1588834ba`, fix `834b8f8c`, CI validée `38543603277` au SHA `81e1f737522f07dcd7006cea8259bd48bec8f321` avec npm test et npm run check SUCCESS.
- Checkpoint documentaire : `docs/checkpoints/EXPLORATION_BUILDER_PAINT_WORKFLOW_FIX_PREVALIDATION_2026-10-14.md`.
- Prévalidation technique uniquement : la publication Pages puis le verdict utilisateur sur Pixel paysage (Forêt/Herbe, Sable, Route, Mer, point et tracé, undo, export/import) sont obligatoires avant GREEN FINAL.
- Aucun changement de collision, de rendu gameplay, de Combat, ni fusion du Builder sur main.

## Publication du correctif pinceau — 2026-10-14

- CI work GREEN technique `38544153721` SUCCESS ; CI checkpoint `38544200368` SUCCESS.
- Checkpoint et branche de prévisualisation au SHA `50c73f10e934430d47792d6416a1c57e81ab26c4` :
  `checkpoint/exploration-builder-paint-workflow-fix-prevalidation-green-2026-10-14` et
  `preview/exploration-builder-paint-workflow-fix-v1-2026-10-14`.
- PR d'infrastructure seule #113 (un fichier `.github/workflows/pages-preview.yml`) mergée dans main `3f0e5f0ac38174c1bb6eb28b7050d50beeb23f2b`.
- Pages run `38544307188` **SUCCESS**.
- Test mobile : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=builder-paint-workflow-fix-v1`.
- Le Builder modifié n'a pas été mergé dans main. Gate utilisateur carte vierge/peinture/sauvegarde et non-régression fluidité en attente ; GREEN FINAL interdit avant validation.

## Prévalidation — Objets par touches directes et fluidité plein écran (2026-10-14)

- Retour utilisateur : la peinture au sol marche plutôt bien mais poser/déplacer des objets sur téléphone est trop difficile ; poignées de taille/rotation activées accidentellement ; latences importantes en plein écran. Priorité donnée à l’ergonomie et à la performance.
- Branche de lot : `work/exploration-builder-object-stamp-mobile-perf-2026-10-14` ; checkpoint départ `checkpoint/exploration-start-builder-object-stamp-mobile-perf-2026-10-14` basé sur `1539ef847093377003b417d7e1fe9ccf7ba99f1b`.
- Nouveau bouton Placer objet, sélecteur d’objet disponible en plein écran, touche répétée = nouvel exemplaire placé à la position du doigt. Un zoom/pinch annule le tap. Déplacer = sélection + glisser. Poignées taille/rotation désactivées sauf case explicite. Champs numériques conservés.
- Corrections de coût mobile : DPR fixe <= 1 pour prévisualisation plein écran tactile ; mouvements WorldObject coalescés par animation frame, commit final au relâchement ; préserve `WorldDocument` et rendu jeu.
- RED `7ff3994e`, code et sentinelles SHA `ef26323ea23058ed76eb0d9bb2d83a1f06519afd` ; CI `38584062418` SUCCESS : 448 tests, npm run check SUCCESS.
- Checkpoint documentaire : `docs/checkpoints/EXPLORATION_BUILDER_OBJECT_STAMP_MOBILE_PERF_PREVALIDATION_2026-10-14.md`.
- Prochaine étape : checkpoint/preview et publication Pages infra-only ; validation manuelle smartphone incontournable avant GREEN FINAL. Les performances FPS réelles restent non mesurées.
- Chantier caméra de jeu configurable **conservé et suspendu** sur `work/exploration-configurable-game-camera-2026-10-14`, jamais intégré dans le lot objets ; reprise après résolution complète des difficultés de carte. Collision R2 toujours gate séparé.

## Publication — placement d’objets et fluidité tactile (2026-10-14)

- Prévalidation ref `preview/exploration-builder-object-stamp-mobile-perf-v1-2026-10-14` et checkpoint `checkpoint/exploration-builder-object-stamp-mobile-perf-prevalidation-green-2026-10-14`, SHA `e45a0f77d07d1046206121137ed1f9eb5f7b4d03`.
- CI checkpoint `38584415404` SUCCESS — **448/448** tests ; `npm run check` SUCCESS.
- PR infra-only **#114**, un fichier `.github/workflows/pages-preview.yml`, merge `main` `7bd909aaf11dca3a7675dd13ae27e1b0e97b9a18`.
- GitHub Pages `38584554184` **SUCCESS**.
- Lien de test manuel : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=builder-object-stamp-mobile-perf-v1`.
- Aucun code Builder / runtime / gameplay mergé dans main. Le nouveau placement répété des objets, le déplacement tactile verrouillé et la stabilisation du DPR restent en **prévalidation** jusqu’au verdict réel smartphone ; aucun FPS mesuré ni GREEN FINAL.
- Caméra configurable : lot précédent **suspendu et conservé**, ref `work/exploration-configurable-game-camera-2026-10-14`. Reprendre uniquement après résolution du gate mobile.

## Lot actif — Copier objet vers pinceau de placement (2026-10-14)

- Demande créateur : remplacer « Dupliquer » par « Copier » ; copier les réglages d’un rocher (scale/rotation) puis poser autant d’exemplaires identiques que voulu par taps, même en plein écran.
- Branche `work/exploration-builder-object-copy-stamp-2026-10-14` issue de `8051c31c195fcd30a5dd733b89492778168a4aa1` ; checkpoint start `checkpoint/exploration-start-builder-object-copy-stamp-2026-10-14`.
- Propriétaire : World Builder UI pour le presse-papiers de placement, helper pur de snapshot ; mutations de WorldDocument par `addWorldObject` uniquement.
- Contrat : Copier ne crée pas d’objet immédiatement ; mémorise définition/scaleX/scaleY/rotation et variante visuelle éventuelle, pas de coordonnées, ID, Portal ou références spatiales ; poser = nouveaux IDs à la position touchée. Sélection d’un autre modèle rétablit le placement standard ; carte vierge / import / démo réinitialisent le preset éphémère.
- Fichiers attendus : `src/builder/world-object-stamp-preset.js`, `src/builder/world-builder-main.js`, `builder.html`, tests ciblés, documentation/checkpoint. Pas de refonte du catalogue ni du moteur.
- Gate : tests du parcours copier → changer source → poser x2 → exporter/importer, conservation du placement simple, intégrité des anciens WorldDocuments, CI + test smartphone en paysage. Publication Pages seulement en prévalidation, jamais GREEN FINAL avant retour utilisateur.
- Hors périmètre : caméra configurable suspendue, performance/Collisions/rencontres/Combat/production.

## Prévalidation technique « Copier » -> pinceau objets (2026-10-14)

- RED `f42c1b49` ; implementation `src/builder/world-object-stamp-preset.js` + raccord de `world-builder-main.js` ; bouton Dupliquer remplacé par **Copier** sans création immédiate.
- Snapshot des réglages du WorldObject choisi (modèle, rotation, scaleX/scaleY, variante visuelle), sans ID, position ou référence spatiale. Les taps créent de nouveaux placements canoniques à leur propre position ; autre modèle = échelle standard ; statut visible en plein écran.
- Passage carte vierge, import JSON, retour démo : preset temporaire annulé ; champs WorldDocument inchangés. Les objets posés se réexportent normalement.
- CI `38592981758` SUCCESS au commit `05f33cf8e3d92796663d3939a8c70c55998bff7f` : **452/452** tests, `npm run check` SUCCESS.
- Checkpoint lot : `docs/checkpoints/EXPLORATION_BUILDER_OBJECT_COPY_STAMP_PREVALIDATION_2026-10-14.md`.
- Prochaine étape : checkpoint technique, ref preview, publication Pages infrastructure seule, test mobile avant GREEN FINAL. Caméra configurable toujours suspendue et isolée.

## Publication — Copier objet / empreinte répétée (2026-10-14)

- Checkpoint technique `checkpoint/exploration-builder-object-copy-stamp-prevalidation-green-2026-10-14` et preview `preview/exploration-builder-object-copy-stamp-v1-2026-10-14` au SHA `4cf20ac353a05714653bbbf1fbe96c0b3e23083e`.
- CI work `38593206676` SUCCESS au checkpoint source ; 452/452 tests, `npm run check` SUCCESS. CI du code `38592981758` SUCCESS.
- PR infrastructure seule #115 (un seul fichier `.github/workflows/pages-preview.yml`) mergée dans `main` au SHA `95da650bbf4b361908ac1a6077ca0f373a0522b4`, aucun code Builder/jeu poussé sur main.
- Publication GitHub Pages `38593425593` **SUCCESS**.
- Lien de test manuel : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=builder-object-copy-stamp-v1`.
- Gate utilisateur en attente : rocher réglé à ×1.5 puis Copier, trois touches de placement et orientation/scale conservées, changements sur une copie indépendants, autre modèle taille ×1, export/import, ergonomie plein écran et fluidité. Prévalidation technique, **pas GREEN FINAL**.
- Caméra configurable toujours suspendue sur `work/exploration-configurable-game-camera-2026-10-14`.

## Lot actif — Builder Terrain Layer Compositor (2026-10-14)

- Créateur : ralentissements sévères même sur PC performant après quelques couches de peinture ; l’optimisation DPR mobile n’est pas une solution suffisante. Gate performance précédent **non validé**.
- Base prévalidation : `591cb2990e9961d0dea1ae053767dab9bb48802d`, checkpoint `checkpoint/exploration-start-builder-terrain-layer-compositor-2026-10-14`, branche `work/exploration-builder-terrain-layer-compositor-2026-10-14`.
- Diagnostic code : `renderPreview()` invoque `surfaceRenderer.draw` sur toutes les zones/voies/rivières et leurs masques `smooth-mask` floutés à chaque mouvement/coup de pinceau ; coût de composition croissant avec nombre de couches, indépendamment de la puissance machine.
- Périmètre : optimisation du **renderer de preview Builder** par composition de couches raster mémorisées et actualisation du seul trait actif ; extensions additives sans changer le rendu runtime. Propriétaire modèle WorldSurface/WorldDocument inchangé ; rendu toujours par Surface Renderer canonique.
- Gardes : respecter ordre base → zones → routes → rivières, clip WorldArea, normalisation, textures importées, zoom et pan ; libérer/recalculer les buffers lors des changements caméra/taille/document/Area/texture. Les couches ne deviennent jamais une nouvelle autorité persistante.
- Tests : compteur de reconstructions du fond vs nombre de frames, tracé actif et calques avant/après, pan/zoom/Area/surface edits, rendu/canonique et CI. Test physique PC et mobile obligatoire avant GREEN FINAL.
- Hors périmètre : caméra de jeu configurable (toujours suspendue), collisions/encounters, Combat, GenSrpG principal, animation assets, UX copie d’objet.

## Prévalidation technique — Terrain Layer Compositor (2026-10-14)

- Correction de cause : tous les masques de toutes les couches n'étaient pas remis en cache, recalculés à chaque mouvement de pinceau. Fond raster temporaire avec overscan de pan, séparation rendu avant/tracé actif/après ; le seul tracé actif recalcule les masques pendant sa création.
- Second goulot éliminé : append de point du pinceau par copy-on-write local, pas copie JSON de l'intégralité de la carte à chaque échantillon.
- Fichiers : `src/builder/builder-terrain-compositor.js`, `src/builder/world-builder-main.js`, `src/builder/world-builder-draft.js`, `src/render/surface-renderer.js` (option additive draw sans base, runtime défaut inchangé), entry Builder et sentinelles.
- CI `38603578445` **SUCCESS**, 457/457 tests + npm run check au SHA `8b612d054e6efc29196b2a99c6303b808b61c5c3`.
- Checkpoint document `docs/checkpoints/EXPLORATION_BUILDER_TERRAIN_LAYER_COMPOSITOR_PREVALIDATION_2026-10-14.md`.
- Reste publication preview infra-only puis test PC + smartphone sur 10-20 couches et export/import avant GREEN FINAL. Aucune valeur de FPS réelle prétendue.
- Caméra de jeu configurable conservée, en pause. Production et labo combat inchangés.

## Publication Terrain Layer Compositor — 2026-10-14

- Checkpoint prévalidation `checkpoint/exploration-builder-terrain-layer-compositor-prevalidation-green-2026-10-14` et ref preview `preview/exploration-builder-terrain-layer-compositor-v1-2026-10-14` créés au SHA `eca7b681be5f31fd8299b63137f84f102b913583`.
- CI work `38603832536` SUCCESS ; checkpoint `38603900451` SUCCESS. **457/457 tests et npm run check**.
- PR infra-only **#116**, diff vérifié d'un seul fichier `.github/workflows/pages-preview.yml` (3 ajouts / 3 suppressions), merge `main` `dedaf9e0dbc6ba1e2cd8c5480a0d8f3bfded3b33`.
- Publication Pages workflow `38604047996` **SUCCESS**. URL : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=builder-terrain-layer-compositor-v1`.
- Les sources Builder, renderer, WorldDocument, gameplay, caméra et Combat ne sont **pas** mergées sur main ; seule l'infrastructure de Pages a changé, qui checkout la preview.
- Gate manuel encore ouvert : carte vierge 15-20 traits multi-couches, pan/zoom en plein écran PC puis sur smartphone ; textures/lissage, routes/rivières, objets, export/import. Aucun FPS réel mesuré ni GREEN FINAL déclaré.
- Caméra de jeu configurable maintenue en attente, sans mélange avec cet audit performance.

## Lot actif — Cache de terrain runtime Exploration (2026-10-14)

- Test utilisateur : Builder nettement plus fluide avec cache des surfaces, MAIS « Tester en jeu » devient inutilisable à cause d'énormes ralentissements sur la même carte. Gate de performance en jeu explicitement ROUGE, ne pas confondre avec green technique du Builder.
- Cause code confirmée : `src/main.js:render()` appelle `drawGround()` à chaque frame, qui appelle `surfaceRenderer.draw()` sur TOUTES les couches WorldSurface, avec masque `smooth-mask` flouté par couche, même lorsque les terrains et leurs textures sont immuables. Le cache du Builder ne s'applique pas au runtime.
- Base propre : `aeb4b042374453ef84f6c27086edb24f79010e89` (Builder compositor publié, 457/457), checkpoint `checkpoint/exploration-start-runtime-terrain-cache-2026-10-14`; travail `work/exploration-runtime-terrain-cache-2026-10-14`.
- Propriétaire : adapter raster du Surface Renderer (lecture seule) ; `WorldDocument`, `WorldSurface`, `Material Registry`, `Collision World` et moteur de jeu inchangés. Réutiliser la composition raster existante, sans créer un format ou algorithme concurrent.
- Périmètre : rendre le terrain canonique une seule fois par fenêtre de caméra visible, réutiliser le raster lors des frames suivantes, recharger par Area/viewport/zoom/pan au-delà de la marge, libérer le cache sur resize/pagehide. Personnage, PNJ et rencontres restent dynamiques par dessus.
- Fichiers prévus : extraction du composant de cache partagé sous `src/render/`, shim Builder conservant ses tests; `src/main.js` pour la consommation; tests runtime permettant de compter les appels réels au renderer, revue du graphe des révisions script, documentation.
- Sûreté : ordre des surfaces et transitions inchangés, culling et clip WorldArea conservés; moteurs de mouvement/rencontres/collisions/Combat intacts ; caméra configurable séparée et toujours en attente.
- Validation : tests RED → GREEN, CI architecture, preview publique par PR infra-only, test PC sur 10–20 couches + téléphone sur la même carte, export/import. Aucune prétention de FPS réel sans mesure utilisateur.

## Prévalidation technique — Terrain cache dans le jeu Exploration (2026-10-14)

- L’utilisateur confirme Builder **nettement plus fluide** mais jeu « catastrophique » après plusieurs couches. Le Builder conserve son cache ; la cause runtime identifiée : `frame() → drawGround() → surfaceRenderer.draw()` recomposait toutes les textures/zones, les masques floutés, routes/rivières à 60 Hz.
- Refactor propriétaire du rendu : extraction du compositor en `src/render/terrain-raster-compositor.js`, réexport de compatibilité pour le Builder. Un seul mécanisme, surfaces canoniques inchangées.
- `src/main.js` réutilise le raster statique par frames et petites translations caméra (marge 130–240 px), invalidation Area/resize/sortie de marge, nettoyage pagehide ; Actors, WorldObjects, Portals et animations restent dynamiques.
- `index.html` recharge le JS runtime via version query ; contrôles de graphes de révisions ajustés sans modifier le runtime des rencontres.
- TDD RED `54aff8734`; CI `38611409304` **SUCCESS** au SHA `b62aa916e3247fb254af62c3d2c3ac0dae3bf8ee` : **461/461 tests** et `npm run check` SUCCESS.
- Checkpoint documentaire `docs/checkpoints/EXPLORATION_RUNTIME_TERRAIN_CACHE_PREVALIDATION_2026-10-14.md`. CI et tests ne mesurent pas de FPS réel.
- À faire : checkpoint/ref preview et Pages infrastructure seule ; test manuel sur PC et Pixel pour plusieurs couches + déplacement caméra/transition/objets avant GREEN FINAL. Caméra configurable toujours suspendue.

## Publication — Terrain cache runtime Exploration (2026-10-14)

- Checkpoint technique `checkpoint/exploration-runtime-terrain-cache-prevalidation-green-2026-10-14` et preview `preview/exploration-runtime-terrain-cache-v1-2026-10-14` au SHA `0a2a0d8fd307a5761098ff96df9e257b72631021`.
- CI work `38611669643` et checkpoint `38611734915` SUCCESS (461/461 tests, npm run check).
- PR infra-only **#117** mergée sur `main` à `a98a7099e55f8740cc33aee9285a2b3112278378` ; diff vérifié limité à `.github/workflows/pages-preview.yml` (3 ajouts/3 suppressions). Aucun changement gameplay/Builder/WorldDocument sur main.
- Workflow Pages `38611854472` **SUCCESS** : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=runtime-terrain-cache-v1`. Tester depuis le Builder par « Tester en jeu » pour utiliser la carte en cours.
- Exigence manuelle : test sur PC/paysage smartphone avec le même monde chargé, pan/rencontres/animation, 15+ couches. Gate runtime en attente, **pas GREEN FINAL** ni promesse de FPS chiffré.
- Caméra configurable maintenue en attente ; aucun travail sur labo Combat ni dépôt production.

## Chantier prioritaire — Ultra-fluidité Builder et jeu, déblocage caméra (2026-10-14)
- Rapport créateur : amélioration sensible du Builder après les caches, mais le Builder redevient lent avec nombreuses couches ; en jeu, micro-freeze régulier ~toutes les 2 secondes en déplacement. Route : transition fondue devenue peu visible/absente ; **demande de réglage configurable enregistrée**, à traiter après restauration de la fluidité et avant caméra configurable.
- Priorité absolue : fluidité du Builder et runtime **avant** caméra de jeu configurable. Cette dernière reste volontairement suspendue, ne pas mélanger les lots.
- Branche active `work/exploration-terrain-render-hitch-culling-2026-10-14` basée sur `4908af931948cf265255c8a7d2b86ea6ab563edf` (preview runtime terrain cache) ; checkpoint `checkpoint/exploration-start-terrain-render-hitch-culling-2026-10-14`.
- Diagnostic de code : le raster plein écran + marge de 130–240 px est entièrement reconstruit *synchroniquement* quand la caméra dépasse la marge. Avancer de ~200 px conduit à un nouveau traitement massif ; les masques floutés coûtent de plus en plus cher avec les couches. L’éditeur réinitialise également son cache lorsqu'une couche est modifiée.
- Périmètre lot : pipeline de rendu statique des terrains, culling spatial par zone/route/rivière et raster découpé/préparé progressivement pour supprimer les re-rasterisations massives en cours de déplacement. Partage de la même autorité SurfaceRenderer / WorldSurface ; tests comptant les vrais appels à renderer et leur distribution par image.
- Fichiers prévus : `src/render/surface-renderer.js`, nouveau cache de tuiles renderer-only pour runtime `src/render/terrain-tile-cache.js`, raccord `src/main.js`, tests de charge/rendu/culling, documentation/checkpoint. Builder réutilise les optimisations communes de surface.
- Aucun changement de la géométrie ou de la sémantique des couches, monde, objets, rencontres, collisions, export/import, ni code de l’autre dépôt ; caméra configurable et éditeur de lissage route sont hors périmètre du lot.
- Risques : coutures visuelles des tuiles aux transitions, tuiles absentes pendant préchargement, mémoire et écrans retina ; gardes requis : tests de source-crop/ordre, taille limite de cache, fallback en cas de canvas indisponible, contrôle manuel PC/Pixel, pas de GREEN FINAL sans test utilisateur.

## Prévalidation technique — Rendu des terrains par tuiles et culling (2026-10-14)
- Changements : runtime crée un cache de tuiles monde de 384px (bord 128px pour lissage). Limite de calcul par image : PC 2 nouvelles tuiles / mobile tactile 1 ; mémoire 48/28 tuiles, LRU. Camera qui dépasse l'ancien overscan ne provoque donc plus le recalcul synchronisé de la scène entière.
- `SurfaceRenderer` élimine maintenant les traces de terrain, routes et rivières éloignées de l'écran *avant* de calculer les masques ; les bornes géométriques sont mémorisées par identité immuable. Le Builder bénéficie de ce culling lors du recalcul de fonds chargés.
- Compatibilité Builder préservée par l'ancien compositor partagé ; WorldDocument, encounters, collisions et scripts Combat inchangés.
- RED sentinelle `c22b4624`, suite réelle de culling + tuile `tests/terrain-tile-hitch-culling.test.js`. CI code `38615336474` SUCCESS au SHA `e6a82a526406e737f9339cc9de96f61cf41717ae` : **466/466**, npm run check vert. Budget mobile / roadmap / checkpoint ajoutés ensuite.
- Checkpoint : `docs/checkpoints/EXPLORATION_TERRAIN_RENDER_HITCH_CULLING_PREVALIDATION_2026-10-14.md`.
- Attente publication prévalidation Pages et test utilisateur *réel* : mouvement continu PC + Pixel sur carte 15–20 couches, qualité des transitions, trous de chargement temporaires, zoom et édition. Pas de GREEN FINAL avant confirmation.
- Lissage des routes réglable **noté comme futur lot** après la fluidité ; caméra configurable suspendue jusque-là sur sa branche distincte.

## Publication prévalidation — Tuiles terrain, micro-hitches et culling (2026-10-14)
- Work source code + checkpoint technique `7016e240f7a65df8fcfe81a59abf23aa84bfbd16`, refs `checkpoint/exploration-terrain-render-hitch-culling-prevalidation-green-2026-10-14` et `preview/exploration-terrain-render-hitch-culling-v1-2026-10-14`.
- CI source `38615684501` et checkpoint `38615764168` **SUCCESS** : 466 tests, npm run check GREEN.
- PR infra-only **#118** merge `main` au SHA `879fbe14d50b88f25a4acd37088dd48b08f06028`, diff un seul fichier `.github/workflows/pages-preview.yml` (3 ajouts/3 suppressions) ; le code Builder/runtime/jeu n'est PAS mergé sur `main`.
- Pages `38615886108` **SUCCESS**, URL : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=terrain-render-hitch-culling-v1`.
- Test manuel : depuis le Builder, même carte avec 15–20 couches, puis bouton « Tester en jeu » et déplacement continu PC + Pixel 1–3 min ; vérifier disparition des hitches périodiques, temps de remplissage visuel des tuiles, superpositions terrain/route/rivière, objets et import/export.
- Statut **GREEN TECHNIQUE / PRÉVALIDATION** seulement : aucune mesure FPS réelle ni validation visuelle encore ; ne pas annoncer ultra-fluidité garantie.
- Ordre de backlog figé : fluidité (jusqu'au retour vert utilisateur) → transition de routes configurable → caméra de jeu configurable conservée en pause sur branche séparée.

## Retour créateur — Performances utilisables, optimisation maintenue au backlog (2026-10-14)

- Verdict après le lot « tuiles + culling » : **« carrément mieux, pour le moment ça va »**. La fluidité redevient acceptable en usage courant ; ce verdict n'est **ni** une mesure FPS **ni** la confirmation que les cartes plus chargées/longues sessions sont entièrement optimisées.
- **Optimisation supplémentaire conservée comme chantier futur explicite** : PC + Pixel, cartes très denses avec nombreuses couches, longues sessions peinture/déplacement, éventuelles micro-saccades résiduelles, mémoire des caches / tuiles, qualité et visibilité des transitions, budget de préparation et absence de trous visuels. Déclencher ce lot sur un nouveau test reproductible ou avant une validation finale de robustesse mobile.
- Ne pas réouvrir sans raison le lot en boucle : conserver le gain obtenu, poursuivre les priorités prévues, et traiter les défauts de performance observés avec mesures/cas reproduits et checkpoint propre.
- Séquence maintenue : **stabilisation et optimisation supplémentaires si besoin → transition de routes réglable (effet disparu signalé) → caméra configurable en jeu**. La caméra reste isolée sur `work/exploration-configurable-game-camera-2026-10-14`.
- Statut du jalon actuel : **retour fonctionnel positif, validation partielle/provisoire**, tests PC/Pixel sur cartes lourdement chargées et durée prolongée non exhaustifs ; ne pas déclarer « optimisation définitive » ou GREEN FINAL sur cette seule phrase.

## 2026-10-14 — Nouveau lot : actualisation du raccord Combat Capture (audit de compatibilité)

- Demande créateur : le mode Exploration renvoie vers un ancien combat ; actualiser vers le moteur Combat récent **sans perdre la rencontre, l'équipe, les objets/compétences, le KO et le retour à la position exacte**. Après ce raccord, l'ordre des deux lots différés reste **transition des routes réglable**, puis **caméra de jeu configurable**. L'optimisation lourde complémentaire demeure au backlog.
- Branche isolée : `work/exploration-combat-runtime-refresh-2026-10-14` ; checkpoint de départ `checkpoint/exploration-start-combat-runtime-refresh-2026-10-14` ; base `4fe529603528c6e7806eaf404275c13d8b3a8875`, issue de la prévalidation terrain tile/culling du 14 octobre (466 tests au checkpoint `7016e240f7a65df8fcfe81a59abf23aa84bfbd16`).
- Domaine : **Encounter Bridge et validation du contrat inter-dépôts uniquement**. Autorité Exploration : création du `CaptureEncounterSnapshot v1`, stockage temporaire, retour d'Area/position et application du résultat exactement une fois. Autorité Combat : session/combat, roster, fin réelle de combat, `CaptureCombatResult`. Aucun moteur de combat copié ou recalculé dans Exploration.
- Source actuellement publiée dans `.github/workflows/pages-preview.yml` : Combat `preview/lab-exploration-battle-end-return-v1-2026-10-05` (`8f4b5ee033b444b75033a7fcb4aff2e835805f8e`), obsolète. Source Combat examinée au 14 octobre : `gh-pages` (`c527e9ae578aa4bd07209f7fa2d69acecf372420`). **Ne pas utiliser le nom de branche mouvant comme preuve de version** : pinner un SHA après qualification.
- Problème confirmé : le snapshot Combat récent ne contient plus la page `exploration-encounter.html`, son entrée JS, son adaptateur d'Encounter ni certains contrats de handoff ; de plus `mountCoop2v2Test` ne reçoit plus `onBattleEnd` tandis que le nouveau HUD exige des sélecteurs supplémentaires (ex. orbes d'énergie). Un simple remplacement de ref dans Pages casserait l'expérience.
- Statut : **audit confirmé, compatibilité pas encore GREEN, aucune nouvelle version combat publiée**, pas de déclaration de tests moteur réussis sur ce raccord. L'ancienne preview reste intacte et utilisable pendant l'étude.
- Périmètre autorisé de ce lot : documenter le contrat et les écarts, ajouter un contrôle de compatibilité automatisable, préparer la migration du raccord Exploration, puis uniquement après disponibilité et vérification d'une API publique de fin de combat côté Combat, publier une preview isolée et tester le vrai flux rencontre -> combat -> retour sur PC/Pixel.
- Hors périmètre : modification du dépôt Combat depuis Exploration, modification de `Zombicide-40k`, collision, terrain, compositor/cache, Builder, récompenses/XP nouvelles, fondu route, caméra configurable. Les changements nécessaires **dans** Combat doivent suivre un **lot dédié à ce dépôt** sous sa propre charte, avec son propre checkpoint et sa propre CI, jamais une copie locale du moteur dans Exploration.
- Critères de validation : snapshot v1 et `partyRef` corrects ; créature adverse réelle ; chargement des compétences/FX récents ; KO/fin réel issus de Combat ; résultat corrélé par `encounterId` et `returnToken` ; retour exact `areaId/x/y` ; pas de double application, pas de freeze ni de fallback silencieux ; test desktop et mobile ; CI verte ; checkpoint GREEN seulement après preuve.
- Audit détaillé : `docs/LAB_COMBAT_RUNTIME_REFRESH_AUDIT_2026-10-14.md`.

### Avancement technique du lot Combat Runtime Refresh — 2026-10-14

- Première étape réalisée sans toucher aux dépôts tiers : `src/encounters/combat-handoff-navigation.js` dispose d'une page Combat locale configurable (`combatPage`) avec ancien point d'entrée conservé par défaut ; chemin contenu obligatoirement sous `./combat-preview/`, URL externe ou traversée rejetée.
- Nouveaux contrôles : `scripts/audit-combat-preview.mjs` refuse les ponts incomplets, une API moderne qui ignore `onBattleEnd`, un HUD ne fournissant pas les orbes d'énergie et l'absence d'écriture du résultat ; 4 fixtures de tests dans `tests/combat-preview-audit.test.js`. `tests/combat-handoff-navigation.test.js` protège la nouvelle sélection et le rejet de chemins dangereux, en plus du flux historique.
- Code prévalidé `9eb3761eb197eba035948420b246d6b9ce08ec8d`, CI Exploration [38628078834](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/38628078834) **SUCCESS** (`npm test`, `npm run check`).
- Ticket de raccord public créé dans le dépôt propriétaire Combat : [#19](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/issues/19). Ce ticket demande l'événement de fin natif et une page Encounter compatible sans modifier le moteur Combat depuis Exploration.
- **ÉTAT DU CHANTIER : bloqué sur l'API publique de Combat**, pas de bascule de la preview ; pas de revendication de combat mis à jour, ni de GREEN FINAL. Ancien combat encore servi par Pages. Cette étape permet une migration ultérieure testable, sans faux résultat, polling ou double autorité. La source Combat avance par ailleurs sur d'autres branches ; réserver un SHA final après publication d'un point d'entrée stable.
- Prochain jalon après restitution Combat #19 : assembler un paquet préversionné, passer le script de compatibilité **contre les vrais fichiers**, exécuter la vraie navigation Exploration → Combat moderne → résultat → retour, puis CI + test PC et Pixel. Les lots de route et caméra restent en attente et dans l'ordre existant.


## 2026-10-15 — Correctif de gate : erreur de répartition des rencontres Builder

- Signalement Pixel paysage lors de « Tester en jeu » : `Impossible de tester : encounter-element-total:forest`. Le contrôle du WorldDocument empêche le test lorsque les pourcentages d'éléments d'une famille de rencontre active ne font pas 100 %. Le moteur Combat n'est pas lancé : la défaillance est l'ergonomie de diagnostic et d'accès aux champs, pas le contrat Combat.
- Base technique Exploration/Combat : preview `def7aaaa4b0d24317d0f4dc4544da20c26b35b19` ; checkpoint départ `checkpoint/exploration-start-builder-encounter-validation-guidance-2026-10-15` ; branche isolée `work/exploration-builder-encounter-validation-guidance-2026-10-15`.
- Propriétaire : Builder UI (message, orientation dans le panneau Terrain) ; validateWorldBuilderDraft/WorldDocument conservent leurs règles et leur autorité. Ne jamais renormaliser silencieusement les pourcentages de l'auteur, ni ignorer la validation à l'export/test.
- Périmètre : helper pur de présentation des erreurs, guidance depuis « Tester en jeu », lisibilité en paysage, tests régressions TDD, cache public Builder. Hors périmètre : Combat, Encounter, règles de probabilités, import, données du monde, code production, transition routes, caméra.
- Gate : tests RED puis GREEN + CI et preview isolée + test Pixel. GREEN FINAL interdit avant validation utilisateur.


### 2026-10-15 — Prévalidation technique guidance rencontres

- Cause observée : `encounter-element-total:forest` émis avant lancement du Combat, car répartition d'éléments d'une famille active différente de 100 % ; démo initiale valide, carte utilisateur modifiée non corrigeable depuis message opaque.
- Helper de présentation pur ; affichage du total réel, famille exacte et consigne, activation automatique onglet Terrain et sélection de famille au clic invalide. Validation canonique inchangée, pas de renormalisation ni masquage.
- TDD RED `38663295703`, CI GREEN `38664200206`, **475/475**, test Chromium réel de saisie Forest Nature 50→40, bouton Tester intercepté, bonne navigation, Encounter Combat moderne inchangé, navigateur GREEN.
- Test CI Browser utilise les deux sources externes pinées, Combat `3f612ec0cf4adf4bf5aa0a2594131613ce16ceec` et global-assets `e55fea3b559c348be596d7c16250808a39c315a1`. Aucun artefact Capture recopié sous Exploration.
- Checkpoint technique : `docs/checkpoints/EXPLORATION_BUILDER_ENCOUNTER_VALIDATION_GUIDANCE_PREVALIDATION_2026-10-15.md`. Publication Pages puis validation smartphone requises ; pas de GREEN FINAL.


### Publication Pages — 2026-10-15

- Source de prévalidation figée : `74d354f76ecc4900e709d62eb302780879b47eb4` ; refs `checkpoint/exploration-builder-encounter-validation-guidance-prevalidation-green-2026-10-15` et `preview/exploration-builder-encounter-validation-guidance-v1-2026-10-15`.
- PR #121 infrastructure GitHub Pages uniquement ; merge main `080babfa3ff29d1dc3df98751cdf2118636514e5` ; **aucun runtime fonctionnel fusionné sur main**.
- Pages run `38664465798` **SUCCESS**, tests 475, smoke Chrome Builder 90/100 & navigation et smoke Combat moderne validés avant upload.
- Preview : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=builder-encounter-validation-guidance-v1`.
- Gate utilisateur : régler le total des rencontres Forêt à 100 % sur la carte existante, exporter son WorldDocument avant de changer de preview (Builder ne garantit pas de sauvegarde automatique), importer dans la nouvelle preview puis Tester en jeu. **GREEN FINAL en attente** de retour Pixel et du flux combat complet.


### 2026-10-15 — R2 guidance rencontres : ouverture réelle du panneau (gate correctif)

- Anomalie résiduelle trouvée lors de la revue de la prévalidation v1 : le clic invalide sur « Tester en jeu » sélectionnait l’onglet Terrain et la famille, mais la section `<details class="terrain-advanced">` restait repliée. L’utilisateur ne voyait pas les champs malgré un message exact.
- Branche isolée `work/exploration-builder-encounter-guidance-r2-2026-10-15`, checkpoint de départ `checkpoint/exploration-start-builder-encounter-guidance-r2-2026-10-15` depuis `76e2bcda236f328c5c726404b5ce424a94b000ab`. Domaine : navigation UI du Builder uniquement.
- TDD Chromium RED `38676659327` : le vrai Builder affichait Forêt 90/100 % et choisissait le bon onglet, mais `advancedOpen=false` bloquait l’accès visible.
- Correctif `9a0775769bc2cdd6256b6b1cb98a0425abb256e9` : ouvre explicitement le `details` canonique avant de sélectionner/afficher l’éditeur ; n’altère aucune chance de rencontre. CI `38676714073` **SUCCESS** avec parcours Chromium et cœur de tests.
- Cache module public R2 `26462b7931bdbb691a0f0f0653c1d250b2802abe` ; nouvelle preview/Pages à publier sur SHA contrôlé après CI.
- Aucun changement du validateur, du WorldDocument, du moteur Combat, des réglages de pourcentage, du mode Capture ou du dépôt principal. GREEN FINAL soumis au test Pixel et à la validation du combat complet.


### 2026-10-15 — Publication R2 et stabilisation du test navigateur

- Correctif UI R2 validé : `9a0775769bc2cdd6256b6b1cb98a0425abb256e9`, onglet Terrain + `details.terrain-advanced` ouvert, famille concernée sélectionnée, pourcentages conservés. Preuve RED `38676659327` (`advancedOpen=false`), GREEN `38676714073`.
- Cache public JS mis à jour ; sentinelles vérifient exactement le nouveau module JavaScript et l’ancien CSS inchangé. CI GREEN `38676922695` au checkpoint/preview R2 `5c681adf6d8969ac4c192c8349e9689b3ec3a5f3` (475 tests + navigateur).
- Publication Pages infra-only PR #122 sur `main@38b8b29e5f102cc31b8b90ab61316d167c89417d`, workflow `38677056491` **SUCCESS**. URL : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=builder-encounter-validation-guidance-r2`.
- Une CI de la même source a révélé un défaut non fonctionnel de nettoyage Chromium (`ENOTEMPTY` à la suppression du profil après tests réussis), corrigé par attente du processus enfant et nettoyage déterministe `dcf0f15f4e45d6ebcedf725164dcc59445b0342c`; CI `38677193279` SUCCESS. Le système de validation gameplay n’a pas été affaibli.
- Verdict Pixel toujours nécessaire pour la carte utilisateur, export/import, navigation et jeu Combat complet. GREEN FINAL interdit avant retour du créateur.


## 2026-10-15 — Lot correctif Builder : configuration simple des rencontres et lancement valide

- Signalement Pixel : Forêt chance de rencontre 100 %, sélection de Terre (23 créatures dans le catalogue), mais « Tester en jeu » ne démarre pas. Le compteur d'espèces n'est pas une chance de répartition ; modifier un seul champ pourcentage ne rééquilibre pas les autres. On ne doit ni attribuer la panne au Combat sans trace ni demander un calcul manuel ambigu.
- Base contrôlée : `6376a940953428d6f490ab75d2267bca5d2561d4` ; checkpoint départ `checkpoint/exploration-start-builder-encounter-quick-setup-2026-10-15` ; branche `work/exploration-builder-encounter-quick-setup-2026-10-15`.
- Propriétaire : **Builder Draft Model** pour la commande atomique explicite « 100 % d'un élément » dans `encounterConfig.families[].elementChances`, et **Builder UI** pour la lisibilité et l'interaction. Source de vérité WorldDocument inchangée. La sélection du catalogue Capture reste lecture seule.
- Invariants : jamais de normalisation silencieuse ; ne pas modifier les règles de rencontres, de déplacement ou les autres familles ; validation 100 % toujours obligatoire ; aucune copie du moteur Combat ; code principal et caméra/routes gelés.
- Tests obligatoires : modèle canonique (sélection Terre seule 100 % sans toucher aux autres familles), expérience Builder vraie dans Chromium (clic commande, validation, lancement réel de la carte `index.html?builderTest=1`), sentinelles complètes, audit et smoke Combat existants. Prévalidation Pages isolée, Pixel manuel avant GREEN FINAL.
- Risque principal : un autre blocage au démarrage après une configuration rendue valide ; l'identifier dans le vrai runtime, ne pas masquer une erreur de navigation/chargement.


### 2026-10-15 — Prévalidation technique terminée : rencontres Terre seules et lancement réel

- Réponse au problème créateur : « Terre · 23 créatures » est une taille de catalogue, pas une probabilité ; une chance de rencontre à 100 % est indépendante de la répartition d'éléments qui doit totaliser 100 %. Ancienne édition numérique pouvait donc créer un document invalide.
- UI explicite dans Terrain → Réglages avancés → Rencontres : choisir un élément possédant des créatures, puis « 100 % de cet élément ». L'action volontaire remplace seulement `encounterConfig.families[familyId].elementChances` par `[{elementId, chancePercent:100}]` et laisse `encounterChancePercent` ainsi que toutes les autres familles intacts. Aucun équilibrage silencieux.
- Base : `6376a940953428d6f490ab75d2267bca5d2561d4`. Source technique GREEN `53b74309a28623f3baef3a9f8e2708d9d64908fa` ; CI `38714863355` et checkpoint CI `38715042972` SUCCESS, **476/476** tests, `npm run check` GREEN.
- RED ciblés `38714314991` (fonction canonique absente), `38714404929` (vrai chemin validé absent), suivis de correction UI/modèle. Cinq sentinelles cache mises à jour vers la nouvelle révision sans contournement ni désactivation.
- Preuve Chromium : ancienne saisie Forêt Nature 40 % bloque à 90 % et ouvre le bon panneau ; commande explicite Terre seul donne chance de rencontre 100 %, Terre 100 % / tous les autres 0 %, document valide, clic « Tester en jeu » et démarrage réel `/index.html?builderTest=1` avec coordonnées `forest-exterior x:220 y:220`. Smoke Combat moderne inchangé GREEN.
- Checkpoint `checkpoint/exploration-builder-encounter-quick-setup-prevalidation-green-2026-10-15` et preview `preview/exploration-builder-encounter-quick-setup-v1-2026-10-15` figés au SHA source ci-dessus.
- PR publication infra-only #124 ; main fonctionnel inchangé et deux sources externes Combat/Capture conservées au SHA antérieur. Pages `38715142361` (résultat à confirmer avant annoncer publiée).
- Test utilisateur Pixel obligatoire : faire 100 % Terre via bouton explicite, cliquer Tester en jeu, se déplacer, lancer rencontre, faire un combat complet puis revenir. Si carte personnelle en cours, conserver/exporter le WorldDocument depuis la session corrigée avant de changer de preview ; les cartes invalides ne peuvent pas être exportées sans correction préalable. **GREEN FINAL refusé avant validation réelle**.

- Publication vérifiée : Pages `38715142361` **SUCCESS**, source épinglée `53b74309a28623f3baef3a9f8e2708d9d64908fa`. Preview publique : https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=builder-encounter-quick-setup-v1 . Contrat Combat et catalogue Capture inchangés. Validation Pixel et bataille jusqu'au retour toujours en attente.


## 2026-10-15 — Lot bloquant : activer les rencontres sur cartes vierges (ticket #123)

- **Base vérifiée / dernière CI GREEN :** `work/exploration-builder-encounter-quick-setup-2026-10-15@005b90a223df35477fb2a69ecbd5a9f71b92f243` (CI `38715313145` SUCCESS), prévalidation rapide publiée `53b74309a28623f3baef3a9f8e2708d9d64908fa`.
- **Checkpoint START** : `checkpoint/exploration-start-blank-world-encounter-enable-2026-10-15` ; **branche unique** : `work/exploration-blank-world-encounter-enable-2026-10-15`. Le lot « 100 % d'un élément » est conservé intégralement sans modifier sa branche.
- **Défaut confirmé :** `createBlankWorldBuilderDraft` définit `Area.encounters.randomEnabled=false`, pendant que le `Encounter Controller` refuse systématiquement un tirage si ce booléen vaut false. L'éditeur ne permet pas de le changer. Une famille Forêt 100 % chance / Terre 100 % ne peut donc jamais produire de combat.
- **Ownership unique :** `WorldArea.encounters.randomEnabled` reste la politique persistante canonique ; Builder Draft écrit ce champ par une commande explicite ; Builder UI projette ce champ. `Encounter Controller` garde l'unique autorité de tirage (distance de 160 unités), le `terrain-family-resolver` garde celle du terrain effectif. Aucune seconde règle « hasard » ou timer.
- **Contrat de correctif :** nouvelles cartes vierges extérieures créées avec rencontres autorisées mais sans chance active par défaut (0 % des familles) ; réglage activable/désactivable clairement pour l'Area courante dans le panneau rencontres ; cartes préexistantes avec `false` restent explicitement désactivées jusqu'au choix utilisateur ; intérieurs restent OFF par défaut ; aucun ajustement automatique des chances.
- **UI :** préciser différence entre fréquence (tirage à distance), éléments (répartition sur 100 %), et famille effective (sol de base ou zone peinte ; route et eau prioritaires). Afficher un avertissement pour une Area désactivée.
- **Tests obligatoires :** TDD RED de création vierge, écriture canonique Area, export/import false conservé ; vrai contrôleur de rencontre 100 % Terre après déplacement avec `CaptureEncounterSnapshot` ; négatifs Area OFF / Route sûre / intérieur ; Chromium Builder source réelle : carte vierge + activation + test. CI totale, audit Combat, checkpoint technique et Pages preview isolée, validation Pixel requise avant GREEN FINAL.
- **Gel / hors lot :** moteur Combat/Capture, Zombicide-40k, mouvement/collision/WorldSurface, rendu, XP, caméra, fondu des routes, performance. **Aucune rustine ni masquage, pas de fusion gameplay sur main.**


### 2026-10-15 — Prévalidation technique : carte vierge -> rencontre native réelle

- Correctif WorldArea/Builder en branche isolée : nouvelles cartes vierges extérieures `encounters.randomEnabled=true` (sans augmenter les chances de 0 %), case de contrôle de la politique de l'Area courante (importe et conserve les `false` explicites) et aide claire sol de base / peintures / routes / rivière / tirage chaque 160 unités.
- Tests TDD RED `38735926497`, GREEN final du code `7cce25026e611709fe8e4665ca28d9a1cbcfd6ed` / CI `38737222106` SUCCESS : **480/480**, `npm run check`, audit et Chromium réels.
- Chromium a créé une vraie carte vierge Forêt/Terre 100 %, démarré Exploration, fait marcher le personnage jusqu'à x=1357.1 et observé le panneau natif `Lavabête · élément earth · famille forest`. Un test séparé prouve la case OFF/ON canonique et le maintien des chances ; aucune injection artificielle de combat.
- Checkpoint documentaire : `docs/checkpoints/EXPLORATION_BLANK_WORLD_ENCOUNTER_ENABLE_PREVALIDATION_2026-10-15.md`.
- **Prochaine action** : épingler checkpoint et source preview, CI checkpoint, publier Pages par PR infrastructure seule, vérifier le déploiement. Puis exiger validation Pixel et vrai combat complet avant **GREEN FINAL**.
- Ticket source `#123` ; ne pas fusionner gameplay sur `main`, ne pas toucher au lot Quick Setup déjà qualifié, ni Combat / Capture / Zombicide-40k.


### 2026-10-15 — Preview publiée / validation réelle en attente

- Code source immuable et documents : `46b5fc42b3475963b03999473ad9f3dc130318c4`. Work CI `38737515958` SUCCESS ; checkpoint `checkpoint/exploration-blank-world-encounter-enable-prevalidation-green-2026-10-15`, CI `38737578493` SUCCESS ; preview ref `preview/exploration-blank-world-encounter-enable-v1-2026-10-15` au même SHA.
- PR #125 **infrastructure seule** fusionnée sur main `2d495525f3b9650ca394157bade8ef4455fe25db` ; **aucun code de moteur ni Builder fusionné dans main**, checkout Explore + Combat/Assets fixes et tests verrouillés.
- GitHub Pages `38737750320` **SUCCESS**, y compris tests 480/480, audit Combat et Chromium marche réelle -> encounter.
- URL publiée : https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=blank-world-encounter-enable-v1
- **Gate Pixel utilisateur toujours ouvert** : sur ancienne carte, activer explicitement `Autoriser les rencontres aléatoires dans l'Area actuelle` ; sur nouvelle carte vierge, base Forêt + chance 100 % + élément Terre 100 %, tester déplacement → rencontre → combat réel → retour. Ancien JSON avec `false` reste OFF sans réécriture cachée. Pas de GREEN FINAL avant verdict du créateur ; ticket #123 conservé ouvert.


## 2026-10-15 — Lot : cases à cocher des éléments de rencontres
- Base contrôlée `4887dc24288413f87ec130e18f7aeb4857307850` CI GREEN `38737997448`. Départ `checkpoint/exploration-start-encounter-element-selection-2026-10-15`; branche unique `work/exploration-encounter-element-selection-2026-10-15`.
- Demande : conserver uniquement la probabilité de rencontrer une créature dans la famille et une sélection de plusieurs éléments par cases à cocher. Une fois le jet de rencontre réussi, piocher dans **un unique pool de créatures distinctes** appartenant à au moins un élément coché, pondéré seulement par leur rareté Capture `spawnChance` (zéro exclu). Ne pas choisir d'abord un élément par pourcentages.
- Autorités : Encounter Controller déclenche selon déplacement ; resolver Encounter choisit une créature unique ; Capture Catalog fournit éléments et rareté ; WorldDocument demeure unique configuration ; Builder est adapter. Pour compatibilité des sauvegardes historiques, les `elementChances` v1 non nulles restent interprétées comme **sélection d'éléments**, leurs valeurs n'ont plus d'influence sur le tirage ; tout nouveau choix de checkbox écrit un marqueur positif. Ne pas créer un deuxième système de hasard.
- Couverture : vraie UI de checkbox sans pourcentages, validation si aucune case et chance positive, import/export anciens documents, multi-élément présent une seule fois, pondération sur pool global, zéro chance exclu, vraie rencontre carte vierge, navigateur Chromium + smoke Combat, cache/CI/checkpoint/preview, Pixel pour GREEN FINAL.
- Gel : Combat repo, main GenSrpG, collisions, monde/terrain, mouvement, caméra, routes. **Lot distinct requis pour actualiser le moteur Combat** dans la preview publiée : aucune mise à jour implicite sans intégration de contrat et tests.

## 2026-10-15 — Compatibilité Combat actuel, prévalidation inter-dépôts

- Demande : faire utiliser au labo Exploration le Combat récent sans perdre les nouvelles rencontres (cases d'éléments/rareté), le roster, les KO et le retour exact. Base Exploration `fca3f161f1ad33fa515577776193895e9a91d7f4` ; checkpoint `checkpoint/exploration-start-current-combat-refresh-2026-10-15` ; branche `work/exploration-current-combat-refresh-2026-10-15`.
- Domaine/ownership : aucun moteur de combat modifié ou copié dans Exploration. Le dépôt propriétaire Combat travaille depuis `gh-pages@d89766513821b933b2b74283dfcced996c06662f`, sur `work/lab-exploration-bridge-current-combat-2026-10-15`, et porte seul la remise en compatibilité de la fin de bataille et de la page Encounter. Les deux versions restent séparées par un SHA immuable, avec `CombatResult` corrélé au snapshot/returnToken.
- Portée de ce lot Exploration : valider le checkout du Combat récent avec l'audit fermé, la CI existante, le vrai Chromium Builder + Encounter, puis **uniquement si les gates passent** mettre à jour la référence Combat de l'infrastructure Pages par PR distincte. Conserver le checkout Capture-assets épinglé. Aucun changement WorldDocument, Builder, encounter pool, terrain, caméra, routes, combat motorisé, ou Zombicide-40k.
- Vérifications : tests + check Exploration, audit des fichiers et de `onBattleEnd`, Chromium réel du démarrage Encounter, lancement Builder ; côté Combat, trois jobs CI dont 2 Chromium. Pas de déclaration GREEN FINAL sans vrai combat terminé et retour smartphone du créateur.
- Référence Combat candidate initiale : `c61798e78fa6cc454aeb5f25294e997e398729f7` ; ce SHA devra être remplacé explicitement si une correction intervient. Ancienne preview demeure rollback sans perte de données.


## 2026-10-16 — Encounter jouable + vrai plein écran, gate Chromium du raccord
- Retour Pixel : interface canonique conforme, mais aucune capacité utilisable et aucun plein écran navigateur. Sprites génériques non terminés acceptés. Source Exploration GREEN prévalidation `7a8dae3452a0ce9b566424e479e2c00de833bf99` ; Combat preview ancien `85f5bc607266bfefdad233dcac50ff94797dfa18` ; Pages `701a680d6b4063e4816a433c52aa12deee8d3ff8`.
- START `checkpoint/exploration-start-encounter-playable-fullscreen-2026-10-16`, branche `work/exploration-encounter-playable-fullscreen-2026-10-16`. Aucun changement au runtime Exploration/Builder/rencontres. Autorité Combat seule modifie l'interprétation présence des slots sans roster, l'IA, KO et la page de fullscreen.
- Nouvel artefact propriétaire Combat candidat `ae8ff1c5995522ed497cbaf64d1fcf25fdf498e7`, CI 3/3 SUCCESS `38846780448`. Ici, extension de la gate Chromium réelle : exige Griffe utilisable + clic qui lance une préparation native, et bouton plein écran présent dans la page officielle. Le contrôle doit échouer sur l'ancien SHA, aucun faux GREEN statique.
- Conserver le template visuel Capture officiel, le fallback des créatures non terminées, les anciennes sauvegardes, le contrat Snapshot/Result, le cache assets, le retour exact et 16:9. Pour publier : CI Exploration + Chromium réels SUCCESS, checkpoint prévalidation et PR infra seule pour pins Exploration/Combat ; gate utilisateur Pixel (capacité, mode immersif autorisé, fin KO et retour) distincte avant GREEN FINAL.
- Aucune modification de `main` gameplay, Zombicide-40k, ou autre dépôt ; vérifier le navigateur si plein écran système refusé.


### 2026-10-16 — Validation vraie capacité et fullscreen en Chromium
- Source Combat `ae8ff1c5995522ed497cbaf64d1fcf25fdf498e7` ; CI Combat 3 jobs `38846780448` **SUCCESS**. Gate Chromium étendue : attendre la capacité Griffe disponible, déclencher son véritable clic dans Encounter, vérifier `se prépare sur` du moteur, bouton plein écran visible et ancien contrôle 16:9/HUD conservé.
- CI Exploration `38846986665` : `core-tests` + `modern-combat-encounter` **SUCCESS**, vrai Chromium + audit, Builder validé ; ce test aurait rejeté l'ancien Combat aux cibles désactivées.
- Publier uniquement par PR d'infrastructure Pages distincte, Combat et Exploration figés par SHA ; vérification Pixel des capacités/plein écran/KO/retour requise avant GREEN FINAL.


## 2026-10-16 — Encounter Ombrelot / deuxième combat, image cache chaude
- Auteur Pixel confirme premier combat et retour exact VALIDÉS, puis deuxième rencontre avec Ombrelot (`crea_ombre_1`) échoue : `can't access property "profile", actor is null`. Les espèces sans sprite officiel doivent rester jouables en fallback ; aucun changement de leur catalogue ou de la rareté.
- Base Exploration `ad053808be37f59ae38864730ff3e89f2227197a`, Pages main `7784cd860bd6a7708197480868a28a3d2bfbd204` ; checkpoint `checkpoint/exploration-start-encounter-ombrelot-2026-10-16`, branche `work/exploration-encounter-ombrelot-2026-10-16`.
- Cause côté Combat propriétaire : dans `demo-app.js`, `loadRuntimeAsset` peut déclencher `markReady` synchroniquement lorsque l'image est déjà complète, mais `actor.profile` n'existe pas avant `rebuildActor`. Correctif minimal Combat branche `work/lab-encounter-cached-image-2026-10-16`, sur pin ancien `67097ee7db70a1e9662059fc905e6a5fd08fe436` et test RED/CI. Aucun moteur Combat copié dans Exploration.
- Gate Explorer : Chrome Browser 1er Encounter, plus variante contre `crea_ombre_1` (vrai chargement fallback) avec lancement et clic réel sur Griffe, absence d'erreur JS, HUD canonique, 16:9. Reconduire Builder/sentinelles, puis CI vérifiée sur nouveau SHA Combat figé, checkpoint technique et PR infrastructure seule pour Pages. Pixel finale distincte, prévalidation seulement. Routes/terrains/WorldDocument/GenSrpG protégés.


### 2026-10-16 — Gate deuxième espèce, prévalidation technique
- Combat fixé `b3414add2c187547aca1d6cf56cbae6629f00da6` : `rebuildActor` précède `loadRuntimeAsset`, supprime le risque de callback image synchrone avec acteur nul. Tests RED antérieurs `38866490976`, CI Combat GREEN `38866529110` (3 jobs).
- CI Exploration `38866734765` **SUCCESS** : tests/check, audit du pont, Chromium Builder, deux vrais démarrages Encounter adversaires Ancêtronc puis Ombrelot non édité, vrai clic Griffe, affichage 16:9 et HUD canonique conservés. Source `766984575537fab9902fedef06d29c7154723575`.
- Livraison : figer checkpoints, CI sur SHA final et publier pins immuables par PR **infrastructure uniquement**. Ancien Pages reste rollback et Pixel auteur doit vérifier deuxième rencontre + retour ; pas de GREEN FINAL utilisateur anticipé.


## 2026-10-16 — Immersion automatique du parcours Exploration ↔ Combat (PWA installée)
- Retour auteur Pixel : plusieurs combats et retours successifs parfaits ; demande de plein écran automatique sans cliquer au début de chaque combat. Base Exploration source `081073f98940ff555dd94236b2e33937c07d8406` (CI et déploiement Pages `38867165455` SUCCESS), Combat `18946be813eef6bc06d2b976db41c5b24da36ecc`, assets `e55fea3b559c348be596d7c16250808a39c315a1`.
- Checkpoint START `checkpoint/exploration-start-immersive-pwa-2026-10-16`, branche `work/exploration-immersive-pwa-2026-10-16`. Propriétaire : **enveloppe web publiée Exploration**, aucun moteur Combat/Builder/Encounter modifié ; URL de publication `/laboratoire_dynamique_exploration-/` comme racine de scope.
- Contrainte navigateur vérifiée : `Element.requestFullscreen()` requiert une activation utilisateur transitoire ; les navigateurs normaux ne permettent pas de forcer le plein écran au chargement / après navigation. Il serait faux de promettre son activation automatique via JS. Solution robuste : manifest PWA installable `display:fullscreen`, `orientation:landscape`, scope racine englobant Builder, Exploration et combat-preview ; passage entre pages sous **la même application installée** sans demander le plein écran à chaque rencontre. L'installation depuis Chrome/Firefox demeure une action initiale utilisateur ; le mode browser garde son bouton de secours.
- Périmètre : manifest + icônes statiques installables + liens manifest depuis `builder.html` et `index.html` (aucun nouveau moteur, aucune nouvelle source de données). Tests : scope relatif, vrais chemins d'entrée, icônes PNG valides, `display=fullscreen`, absence d'import Combat ou de changement d'état/rencontres ; tests/check/CI + Chromium de l'ancien raccord ; checkpoint prévalidation et PR infrastructure Pages-only. Aucune modification `main` gameplay ; validation Pixel installée requise avant GREEN FINAL.
- Risque connu : une installation/shortcut créée avant mise à jour peut conserver son ancien `display` selon navigateur Android. Le mode immersif n'est pas garanti dans un navigateur intégré (ChatGPT, onglet Firefox/Chrome non installé) ; ce n'est pas une panne du moteur. Ne pas forcer `requestFullscreen` sur un timer ni contourner la politique navigateur.


### 2026-10-16 — PWA immersive installable : prévalidation navigateur
- `manifest.webmanifest` au scope relatif `./` couvre Builder, `index.html` et `combat-preview/examples/dom-demo/exploration-encounter.html`. Display `fullscreen`, orientation `landscape`, deux icônes PNG réellement dimensionnées en 192 et 512 px, départ `builder.html` ; liens manifest dans les deux points d'entrée.
- TDD : première CI du test manifest `38894876277` FAILURE attendue ; correction du manifeste + HTML/icônes puis CI `38895098746` **SUCCESS** (core tests, real Chromium Builder/Encounter, audit du bridge, vrai clic compétence, deux adversaires). Ancien pont Combat `18946be813eef6bc06d2b976db41c5b24da36ecc` et assets immuables inchangés.
- Respect des limitations utilisateur : **dans un onglet web normal le plein écran automatique sans geste est interdit**. L'installation de la PWA sur l'écran d'accueil via le navigateur est à faire une seule fois. Lancement depuis cette icône permet l'immersion automatique pour les navigations internes sous même scope. Le bouton de secours du combat normal reste fonctionnel ; la prise en charge finale dépend de l'OS/navigateur et reste à vérifier sur Pixel.
- Prochaine étape : figer le SHA immutable de la branche, checkpoint prévalidation, CI finale, PR publication d'infrastructure seule et Pages ; pas de GREEN utilisateur avant installation et confirmation sur Android.


## 2026-10-16 — Combat plein écran sans navigation : overlay propriétaire Exploration
- Demande Pixel : Exploration plein écran déjà sans installation ; combat aussi doit s'ouvrir immédiatement plein écran depuis le bouton existant Lancer le combat, sans action supplémentaire. Les combats/KO/retours répétés sont validés par l'auteur ; **ne pas réécrire les moteurs**. Le manifest PWA ajouté au lot précédent reste facultatif.
- Base publiée Explore `e7aefa3316aba2801e0ad23789a5bc9d4ac4c982`, Combat `18946be813eef6bc06d2b976db41c5b24da36ecc`, assets `e55fea3b559c348be596d7c16250808a39c315a1`. Checkpoint `checkpoint/exploration-start-seamless-combat-overlay-2026-10-16`, branche `work/exploration-seamless-combat-overlay-2026-10-16`.
- Cause démontrée : `src/encounters/combat-handoff-navigation.js` réalise `globalThis.location.assign(url)`, ce qui détruit le document Explore / son mode plein écran. Le Combat termine par une seconde `window.location.assign(returnUrl)`. CSS seule ne peut préserver la vraie Fullscreen API entre pages.
- Réparation au **propriétaire du passage Encounter** : utiliser le même contrat handoff sessionStorage et un iframe same-origin `position:fixed;inset:0` comme surface de Combat au-dessus du runtime toujours vivant, sans dupliquer Combat. La requête Fullscreen API se fait directement depuis le clic existant, sans bouton supplémentaire ; si refus du navigateur, CSS occupe tout le viewport. Combat notifie par `postMessage` (origine + source + encounterId + returnToken stricts) après avoir écrit le vrai CombatResult, le parent lit/valide/consomme via contrat existant puis libère encounterController et garde carte et coordonnées exactes **sans recharger**. Reste en place le fallback historique de navigation directe pour un Combat ouvert seul.
- Domaine Combat propriétaire (branche séparée) : modifier uniquement `examples/dom-demo/exploration-encounter.js` pour publier la notification de fin si parent same-origin, jamais Combat Rules/FX/creatures/UI, sinon garder `location.assign`. Aucun cross-origin command ni result non authentifié.
- Tests RED puis GREEN : contrat in-page et postMessage, anti-spoof source/origin/correlation, lecteur CombatResult, lancement de 2 rencontres successives et retour sans navigation parent, clic capacité réel et HUD identique, contrôle navigateur/CSS, CI des deux dépôts. Checkpoints prévalidation avant PR Pages épinglée ; validation Pixel continue requise avant GREEN utilisateur. `main` infrastructure-only. Zombicide-40k protégé.


### Validation technique — 16/10/2026 : retour en-place, deux rencontres réelles
- `src/encounters/immersive-encounter-host-v1.js` propriétaire unique de l'overlay same-origin et de la Fullscreen API : ouverture synchronisée avec clic existant, iframe 100dvh, parent Explorer toujours vivant. Filtrage strict `event.origin`, `event.source`, `encounterId`, `returnToken`, vrai `CombatResult` venant du stockage, puis lecture/validation `resolveExplorationCombatReturn`, libération Encounter et suppression iframe sans navigation/reload. Navigation standalone toujours disponible côté Combat.
- SHA Combat prévalidé `11a9f70b5f6cf6850fc4bedfd876d799635c33db`, CI Combat `38913808346` **SUCCESS 3/3**. CI Exploration `38914705946` **SUCCESS** (tests/check, audit, Chromium Builder, Explorer, vraie page Combat).
- Logs probants Chromium : Noctigriffe rencontré via déplacement réel, Combat DOM intégré 800/800 px avec 5 boutons compétences, bouton fullscreen secondaire masqué, résultat contractuel simulé côté Combat pour tester transport, retour 1 x1361.0 et second combat puis retour 2 x1203.8 **sans changer le document `/index.html`** ; sessionStorage consommé. Ne pas présenter ce test transport comme un vrai KO joué automatiquement ; utilisateur a déjà validé combats/retours sur Pixel auparavant. Fullscreen API sur clic réel Pixel doit être vérifiée.
- Test initial sur terre a révélé un cas préexistant hors lot : `duplicate creature draft id: crea_mossback` si même créature présente dans roster joueur et adversaire. Gate overlay ciblée sur l'élément Ombre non configuré ; ne pas masquer le problème ni modifier catalogue/spawns à l'occasion du plein écran, consigner au backlog.
- Checkpoint prévalidation technique, PR infrastructure Pages seule pour références immuables, rollback ancien PIN. Pas de GREEN final utilisateur tant que Pixel non testé.
