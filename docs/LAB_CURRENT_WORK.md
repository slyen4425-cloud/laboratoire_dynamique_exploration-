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
