# LAB_CURRENT_WORK — Point de reprise unique

> ÉTAT ACTIF — 2026-10-07
>
> Chantier : **Mobile Landscape & Area Navigation UX v1**
>
> Branche : `work/exploration-mobile-landscape-area-navigation-ux-v1-2026-10-07`
>
> Base technique GREEN exacte : `66586150bcbebc731a0f72b5dc5b6607ae321c85`
>
> Checkpoint de départ : `checkpoint/exploration-start-mobile-landscape-area-navigation-ux-v1-2026-10-07`

## Validation précédente conservée

Le créateur confirme le 2026-10-07 : **aucun combat aléatoire à l'intérieur** sur la preview r2.
Les sentinelles automatiques du lot précédent couvrent aussi le retour des rencontres en extérieur et l'indépendance des combats explicites.
Ce chantier UX ne modifie pas Encounter Controller, WorldArea.encounters ni Combat Bridge.

## Problème produit

Le moteur WorldArea / Portal fonctionne, mais le Builder expose trop directement sa structure technique :
- la map reste enfermée dans la grille de panneaux sur smartphone ;
- le parcours extérieur -> intérieur passe par Objets -> bâtiment -> Entrée et intérieur -> Ouvrir l'intérieur ;
- le retour intérieur -> extérieur exige de comprendre les Areas / Passages ;
- le jeu et l'éditeur ne guident pas clairement vers l'usage smartphone paysage.

## Contrat UX v1

1. **Carte prioritaire**
   - toucher/sélectionner la map sur mobile ouvre un mode carte plein écran ;
   - bouton explicite plein écran disponible ;
   - sortie explicite du mode carte ;
   - le mode CSS reste fonctionnel si l'API Fullscreen native est indisponible.

2. **Paysage mobile**
   - le mode carte tente le verrouillage `landscape` uniquement via l'API navigateur depuis un geste utilisateur ;
   - échec de Fullscreen/orientation = fallback visuel, jamais blocage moteur ;
   - jeu + Builder affichent un conseil de rotation en portrait étroit.

3. **Navigation Area simple**
   - barre contextuelle directement sur la map ;
   - extérieur + bâtiment sélectionné relié -> raccourci `Intérieur →` ;
   - intérieur -> raccourci `← Extérieur` résolu depuis les Portals existants ;
   - le sélecteur Area et les réglages Portal détaillés restent disponibles comme réglages avancés.

## Autorités / invariants

- WorldDocument = unique état persistant de carte ;
- WorldArea = unique autorité des Areas ;
- Portal = unique autorité des raccords ;
- WorldObject + doorAnchor = entrée bâtiment canonique ;
- `selectedAreaId` reste un état UI éphémère autorisé par la charte ;
- aucun `building.portalRef`, aucune coordonnée d'entrée dupliquée, aucun format Navigation parallèle ;
- aucun changement de schéma WorldDocument attendu ;
- Renderer reste en lecture seule ;
- aucun changement dans `Zombicide-40k`.

## Fichiers attendus

- `builder.html`
- `src/builder/world-builder.css`
- `src/builder/world-builder-main.js`
- helper UI pur de navigation Area si nécessaire
- `index.html` / `src/style.css` uniquement pour la guidance paysage du runtime
- tests sentinelles dédiés

## TDD attendu

RED avant implémentation :
1. navigation bâtiment extérieur -> intérieur depuis le Portal canonique ;
2. navigation intérieur -> extérieur depuis le Portal canonique ;
3. aucun stockage/navigation parallèle ;
4. présence du mode carte plein écran et de sa sortie ;
5. fallback portrait/paysage mobile ;
6. cache-bust public Builder/runtime aligné si fichiers d'entrée modifiés.

## Risques

- API Fullscreen / Screen Orientation variables selon navigateur : elles restent un bonus progressif, jamais une dépendance gameplay ;
- changement de taille du canvas pendant Fullscreen : le Renderer doit continuer à lire `clientWidth/clientHeight` et recalculer la vue ;
- ne pas transformer la simplification UI en seconde autorité de Portal.

## Gate

CI + test smartphone réel requis.
GREEN FINAL interdit avant validation ergonomique utilisateur.


## TDD / implémentation — état technique

RED :
- commit tests : `9c08c403a157dce30afa6ec42ce809de977cbc0e` ;
- CI `37643376000` — **FAILURE attendue** ;
- 394 tests, 387 GREEN, **7 RED ciblés** sur le contrat UX absent.

Implémentation :
- commit fonctionnel : `3b9bba858f94a80387335b029ee841d2b8a903ca` ;
- CI `37644652710` — **SUCCESS** ;
- **394/394 tests GREEN** + `npm run check` GREEN.

Livré techniquement :
- helper `world-builder-area-navigation.js` en lecture seule sur les Portals ;
- barre contextuelle map avec `Intérieur →` et `← Extérieur` ;
- sélection d'Area centralisée dans `selectAreaForEditing()` ;
- tap carte sur pointeur tactile -> mode carte plein écran ;
- bouton plein écran et sortie explicite ;
- tentative progressive Fullscreen + verrouillage paysage, avec fallback CSS plein viewport ;
- guidance paysage en portrait dans Builder et runtime ;
- cache revisions Builder/runtime alignées ;
- ancienne sentinelle Building Interiors découplée proprement : cache d'entrée Builder nouveau, cache interne WorldObject historique conservé.

## Prévalidation à publier

Créer un checkpoint/preview depuis le HEAD technique GREEN après documentation, puis publier via l'infrastructure Pages séparée.

Gate smartphone demandé :
1. ouvrir le Builder sur téléphone en portrait puis toucher la map ;
2. confirmer que la carte devient plein écran et que le passage paysage est naturel ;
3. sélectionner une maison reliée et utiliser `Intérieur →` ;
4. depuis l'intérieur utiliser `← Extérieur` sans ouvrir l'onglet Passages ;
5. quitter le mode plein écran ;
6. lancer `Tester en jeu` et vérifier l'affichage paysage/rotation ;
7. vérifier qu'aucun comportement terrain/Portal/rencontre n'a régressé.

État : **GREEN TECHNIQUE — gate ergonomique smartphone requis avant GREEN FINAL.**


## Prévalidation publiée

- HEAD technique/documenté : `86a9df8e43484894e5980aaeaff38a3ea92ab5fd`
- CI work : `37644941107` — **SUCCESS**
- checkpoint prévalidation : `checkpoint/exploration-mobile-landscape-area-navigation-ux-v1-prevalidation-green-2026-10-07`
- CI checkpoint : `37645005712` — **SUCCESS**
- preview : `preview/exploration-mobile-landscape-area-navigation-ux-v1-2026-10-07`
- publication infra PR #99 puis PR #100, sans merge gameplay vers `main`
- premier run Pages `37645194072` : échec d'infrastructure artefact ; la relance du même run a créé deux artefacts `github-pages`, donc elle ne doit pas servir de retry pour ce cas
- nouveau run Pages frais : `37645576186` — **SUCCESS**
- `main` ne contient que l'infrastructure de publication ; le code UX reste sur la branche de preview/work.

Preview de gate :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=mobile-landscape-area-navigation-ux-v1`

État : **GREEN TECHNIQUE / PREVIEW PUBLIÉE — attente du verdict ergonomique smartphone avant GREEN FINAL.**


## Prévalidation R2 — chaîne de cache mobile complète

Interception avant gate utilisateur :
- le Builder R1 ouvrait encore `index.html?builderTest=1` sans révision publique ;
- un smartphone pouvait donc réutiliser un ancien HTML runtime malgré les nouveaux CSS/JS ;
- correction traitée en TDD, sans modification des autorités moteur.

TDD R2 :
- RED cache : `adc151e601efd2e20c49b06ec078fb0c57efff2a`
- CI RED : `37646009673` — **FAILURE attendue**, 392/394 GREEN, 2 RED ciblés ;
- correction cache : `160236129348bce4e2d43af10b46a84827dd2840` ;
- réalignement de la sentinelle historique handoff : `e190e72c76be5803729427f747d0e00578d4209e` ;
- CI R2 : `37646264782` — **SUCCESS**.

Révision publique R2 :
- Builder HTML -> CSS/JS : `mobile-landscape-area-navigation-ux-v1-r2`
- Builder -> Tester en jeu : `index.html?builderTest=1&rev=mobile-landscape-area-navigation-ux-v1-r2`
- runtime HTML -> CSS : `mobile-landscape-area-navigation-ux-v1-r2`

La preview R1 reste un historique technique et ne doit plus être utilisée pour le gate ergonomique.
Créer un checkpoint + preview R2 depuis le HEAD documenté R2, puis publier un nouveau run Pages frais.

État : **GREEN TECHNIQUE R2 — publication R2 puis gate smartphone avant GREEN FINAL.**


## R2 publiée — gate smartphone actif

- HEAD R2 documenté : `b6e4e8647fd9d846c888a296d2fb5576e529d69c`
- CI work R2 documenté : `37646399188` — **SUCCESS**
- checkpoint : `checkpoint/exploration-mobile-landscape-area-navigation-ux-v1-prevalidation-r2-green-2026-10-07`
- CI checkpoint : `37646466092` — **SUCCESS**
- preview : `preview/exploration-mobile-landscape-area-navigation-ux-v1-r2-2026-10-07`
- publication infra : PR #101 uniquement
- merge infra main : `253764c2b02a3ad6dd926fdf62f7a22c36f8bd91`
- Pages : `37646605273` — **SUCCESS**

Lien de gate smartphone R2 :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=mobile-landscape-area-navigation-ux-v1-r2`

Le lot reste **GREEN TECHNIQUE / PREVALIDATION R2** jusqu'au verdict utilisateur. Ne pas créer le checkpoint GREEN FINAL avant cette validation.


## Gate smartphone R2 — verdict NEGATIF utilisateur

Test réel smartphone paysage reçu le 2026-10-07.

Verdict :
- la map est bien visible ;
- le mode focus/paysage n'est pas encore acceptable ;
- le bandeau de zone, la rangée des 4 outils et la barre `Vue Area / Centrer sélection / aide zoom` consomment une trop grande part de la hauteur ;
- sur l'écran testé, la carte n'occupe qu'environ 40–45 % de la hauteur utile visible ;
- **GREEN FINAL refusé**.

Cause UX :
- `.preview-panel.is-map-focus` remplissait bien le viewport ;
- mais `.map-area-context`, `.map-tools` et `.preview-tools` restaient des enfants flex qui réservaient de la hauteur avant le canvas ;
- le problème est donc de composition UI, pas de WorldArea/Portal/Renderer.

## Correction R3 — focus réellement immersif

TDD RED :
- test de régression ajouté : les commandes de focus doivent être des overlays, le canvas doit posséder le viewport ;
- commit : `8d4278fa8b68583be4740d16d092a582f90d1ec3` ;
- CI : `37666647255` — **FAILURE attendue**.

Correctif :
- commit : `55adc55c33b33ead1dc1ae9cdca9c8cc89811478` ;
- CI : `37666944802` — **SUCCESS** ;
- canvas en `position:absolute; inset:0` dans le mode focus ;
- navigation Area en overlay compact en haut ;
- outils carte en overlay flottant en bas ;
- `Vue Area / Centrer sélection / aide zoom` masqués pendant le focus ;
- libellé `Zone active` masqué en focus, seul `Extérieur/Intérieur` reste visible ;
- contrôles pinceau décalés au-dessus de la barre d'outils ;
- aucun changement WorldDocument, WorldArea, Portal, Encounter ou Renderer ;
- révision publique passée à `mobile-landscape-area-navigation-ux-v1-r3`.

Gate R3 requis sur smartphone paysage :
1. ouvrir la map ;
2. entrer en mode focus ;
3. vérifier que la map occupe presque toute la hauteur disponible sous le chrome navigateur ;
4. vérifier que les commandes flottantes ne masquent pas excessivement la zone de travail ;
5. tester `Intérieur →` puis `← Extérieur` ;
6. quitter le focus ;
7. vérifier peinture / déplacement / centrage hors focus.

État : **GREEN TECHNIQUE R3 — checkpoint + preview R3 à publier, puis nouveau verdict utilisateur obligatoire.**


## R3 publiée — nouveau gate smartphone

- SHA preview/checkpoint R3 : `6d14e045727524ece3c2df4d22c9756efd9aba16`
- CI work documentée : `37667075293` — **SUCCESS**
- checkpoint : `checkpoint/exploration-mobile-landscape-area-navigation-ux-v1-prevalidation-r3-green-2026-10-07`
- CI checkpoint : `37667136530` — **SUCCESS**
- preview : `preview/exploration-mobile-landscape-area-navigation-ux-v1-r3-2026-10-07`
- publication infrastructure uniquement : PR #102
- merge infra `main` : `458c21569d24583c714f1bd48ac7fe3930ea8d65`
- Pages : `37667317895` — **SUCCESS**
- aucun code gameplay du lot n'a été mergé dans `main`.

Lien de gate R3 :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=mobile-landscape-area-navigation-ux-v1-r3`

Attendu en paysage focus :
- canvas derrière toute la surface utile du Builder ;
- contexte Area compact flottant en haut ;
- outils carte flottants en bas ;
- aucune barre `Vue Area / Centrer sélection / aide zoom` consommant de hauteur ;
- navigation `Intérieur →` / `← Extérieur` toujours issue des Portals canoniques.

État : **GREEN TECHNIQUE / PREVALIDATION R3 — attente du nouveau verdict smartphone. GREEN FINAL interdit avant validation utilisateur.**


## Gate smartphone R3 — amélioration validée partiellement, navigation map encore bloquante

Retour utilisateur du 2026-10-07 :
- le plein écran R3 est **nettement meilleur** ;
- mais le bas de la map / les bords de l'Area restent difficiles à atteindre ;
- le redimensionnement Area n'est pas utilisable confortablement tant que le coin bas-droit reste collé au bord du viewport ;
- le créateur demande de pouvoir faire défiler/déplacer la map au-delà de ses limites visuelles.

Cause :
- `computeBuilderView()` clampait encore la caméra exactement dans les limites de l'Area ;
- le handle de resize situé sur le coin bas-droit pouvait donc rester au bord physique du canvas.

TDD :
- RED : `04f2581d9fbb4e18392b0d07272472eff4403131`
- CI RED : `37669650021` — **FAILURE attendue**
- correctif viewport : `7e3f6fdfcaf47ba47e36a246127e87bac95fdc4c`
- raccord Builder : `1df9c3ee55ce2ae3e5ca6af1008290c590150a1a`
- CI fonctionnelle : `37669802667` — **SUCCESS**

Correction R4 :
- ajout d'une marge de pan écran de 96 px ;
- la caméra peut dépasser visuellement les quatre bords de l'Area sans modifier aucune coordonnée du WorldDocument ;
- le coin bas-droit peut être ramené à environ 96 px à l'intérieur du canvas ;
- rendu, hit-test, wheel zoom et pinch zoom utilisent la même marge ;
- cache du module `world-builder-viewport.js` versionné en R4 ;
- aucune nouvelle autorité de map/navigation.

Révision publique R4 :
`mobile-landscape-area-navigation-ux-v1-r4`

État : **GREEN TECHNIQUE R4 — checkpoint/preview R4 requis puis nouveau gate smartphone.**


## R4 publiée — gate smartphone pan / Taille Area

- SHA checkpoint/preview R4 : `82e3eb5096bb0c6e3379b65b6fb77e6c7fe40899`
- CI work R4 : `37670072319` — **SUCCESS**
- checkpoint : `checkpoint/exploration-mobile-landscape-area-navigation-ux-v1-prevalidation-r4-green-2026-10-07`
- CI checkpoint : `37670146123` — **SUCCESS**
- preview : `preview/exploration-mobile-landscape-area-navigation-ux-v1-r4-2026-10-07`
- publication infrastructure uniquement : PR #103
- merge infra `main` : `c1baa3175eb90d324df1e1ac1423e1ae688622a4`
- Pages : `37670272396` — **SUCCESS**
- aucun gameplay du lot n'a été mergé dans `main`.

Lien R4 :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=mobile-landscape-area-navigation-ux-v1-r4`

Gate demandé :
- en mode focus paysage, utiliser Déplacer et tirer la map au-delà de ses bords ;
- confirmer que le bas et le coin bas-droit peuvent être ramenés à l'intérieur de l'écran ;
- activer Taille Area et saisir la poignée bas-droite ;
- vérifier que le comportement R3 plein écran reste bon ;
- vérifier Intérieur → / ← Extérieur.

État : **GREEN TECHNIQUE / PREVALIDATION R4 — attente du verdict smartphone. GREEN FINAL interdit avant validation utilisateur.**


## Gate smartphone R4 — ergonomie meilleure, performance insuffisante

Retour utilisateur du 2026-10-07 :
- navigation/pan R4 : **beaucoup mieux** ;
- plein écran globalement satisfaisant ;
- problème restant : le Builder **rame sensiblement** pendant les interactions ;
- demande suivante enregistrée : édition intérieure avec **forme + taille**, puis poursuite de l'intégration textures.

Le lot UX reste actif : la performance mobile doit être corrigée avant GREEN FINAL et avant ouverture du chantier géométrie intérieure.

## Correction performance mobile — R5

Audit :
- `renderPreview()` revalidait le WorldDocument à chaque redraw ;
- les événements `pointermove` pouvaient provoquer plusieurs redraws complets dans une même frame ;
- le canvas plein écran mobile utilisait jusqu'à DPR 2 pendant le drag, augmentant fortement le nombre de pixels à redessiner.

TDD :
- RED performance : `e9ec9f5157770343eb228e92f45cea9a45870852`
- CI RED : `37672557775` — **FAILURE attendue**
- scheduler preview : `80649a6a16b27f87c4cc915c279cce7a83214606`
- implémentation performance : `5c5ed28488d88fe6bab05c1e960237738c745ca7`
- première CI d'implémentation : `37672714822` — 400/401 GREEN, une sentinelle de format trop stricte ;
- sentinelle rendue indépendante du format : `4a613f3501ef906f0bf724d801d26284d9f65c4d`
- CI finale performance : `37672859410` — **SUCCESS**, 401/401 tests.

Correctif :
- cache de validation par identité immuable de `draft` ;
- scheduler `requestAnimationFrame` : plusieurs mouvements tactiles dans une frame -> un seul redraw ;
- pointermove / pinch / zoom haute fréquence utilisent le scheduler ;
- en plein écran mobile/coarse pointer :
  - interaction active -> DPR max 1 ;
  - repos -> DPR max 1.5 ;
  - desktop/non-focus conserve le DPR historique max 2 ;
- résolution visuelle seulement : aucune donnée persistante n'est modifiée.

Révision publique R5 :
`mobile-landscape-area-navigation-ux-v1-r5`

## Prochain chantier enregistré — Interior Geometry Authoring v1

À ouvrir **après validation du lot UX R5**, pas en parallèle.

Contrat produit demandé :
- édition intérieure : réglage simple de la **taille** ;
- édition intérieure : réglage de la **forme** ;
- WorldArea doit rester l'unique autorité géométrique ;
- interdiction d'un masque purement visuel ou d'une seconde géométrie Renderer ;
- les Portals/Spawns/objets doivent consommer la même géométrie canonique ;
- les textures intérieures continueront ensuite sur cette géométrie.

État actuel : **GREEN TECHNIQUE PERFORMANCE R5 — checkpoint + preview R5 puis gate smartphone requis.**


## R5 — alignement cache final

Le premier commit de préparation R5 a volontairement fait échouer la CI publique car l'import interne du viewport conservait encore la révision `r4`.

- préparation publique R5 : `6fda9595c36bc61f4fbc2a8c29d89e40d28945f4`
- CI `37673079083` — **FAILURE attendue**, 400/401 GREEN, uniquement cache viewport stale ;
- correction : `ede4c28a46fb3e1d390e48f0ffa3111124321cef`
- CI `37673219066` — **SUCCESS**, 401/401 GREEN.

La chaîne publique est maintenant cohérente :
- Builder HTML -> CSS/JS : `mobile-landscape-area-navigation-ux-v1-r5`
- Builder Main -> Viewport : `mobile-landscape-area-navigation-ux-v1-r5`
- Builder -> runtime test : `mobile-landscape-area-navigation-ux-v1-r5`
- runtime HTML -> CSS : `mobile-landscape-area-navigation-ux-v1-r5`.

État : **GREEN TECHNIQUE R5 — checkpoint/preview à figer sur l'état documenté, puis gate smartphone performance.**


## R5 publiée — gate smartphone performance

- SHA checkpoint/preview R5 : `61163b6df74835cdf76047956a8431a2535b7b5b`
- CI work documentée : `37673307292` — **SUCCESS**
- checkpoint : `checkpoint/exploration-mobile-landscape-area-navigation-ux-v1-prevalidation-r5-performance-green-2026-10-07`
- CI checkpoint : `37673386581` — **SUCCESS**
- preview : `preview/exploration-mobile-landscape-area-navigation-ux-v1-r5-2026-10-07`
- publication infrastructure uniquement : PR #104
- merge infra `main` : `909d0c3c5b08dfdf5136e44c14575fcf6c313c9a`
- Pages : `37673534036` — **SUCCESS**
- aucun gameplay du lot n'a été mergé dans `main`.

Lien R5 :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=mobile-landscape-area-navigation-ux-v1-r5`

Gate demandé :
- refaire le même pan paysage qui ramait en R4 ;
- pinch zoom ;
- Taille Area ;
- drag objet/acteur ;
- peinture continue ;
- vérifier que l'image redevient nette dès la fin du geste ;
- vérifier Intérieur → / ← Extérieur.

Prochain lot après validation :
**Interior Geometry Authoring v1**
- taille intérieure ;
- forme intérieure canonique WorldArea ;
- puis poursuite textures/assets.

État : **GREEN TECHNIQUE / PREVALIDATION R5 — attente du verdict smartphone performance. GREEN FINAL interdit avant validation utilisateur.**


## Gate smartphone R5 — VALIDÉ utilisateur

Retour créateur du 2026-10-08 :
> « Oui c'est plus fluide. continue en respectant la charte et le plan »

Verdict :
- le point bloquant performance mobile du Builder R4 est corrigé ;
- la R5 est acceptée pour poursuivre le plan ;
- les sentinelles automatiques restent GREEN sur navigation Area, plein écran, pan, Taille Area, Portal et cache public.

Le lot **Mobile Landscape & Area Navigation UX v1** peut être fermé GREEN.
Aucun merge gameplay vers main n'est demandé par cette validation.

Prochain lot autorisé :
**Interior Geometry Authoring v1**
- taille intérieure ;
- forme intérieure canonique WorldArea ;
- compatibilité anciennes WorldArea ;
- aucun masque Renderer parallèle ;
- textures/assets après cette géométrie, dans un lot séparé.
