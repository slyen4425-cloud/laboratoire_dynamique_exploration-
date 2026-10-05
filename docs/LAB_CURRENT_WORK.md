# LAB_CURRENT_WORK — Point de reprise unique

> ÉTAT ACTIF — 2026-10-05
>
> Chantier : **Road Speed Regression Audit v1**
>
> Branche : `work/exploration-road-speed-regression-audit-v1-2026-10-05`
>
> Base GREEN : `d5148acb6e9ebd8a7dd16e98aecf9d9f2290b55b`
>
> Checkpoint de départ : `checkpoint/exploration-start-road-speed-regression-audit-v1-2026-10-05`
>
> Dernier GREEN : `checkpoint/exploration-linear-smooth-transition-v1-green-2026-10-05`
>
> Signalement utilisateur :
> - les déplacements doivent être plus rapides sur Route ;
> - impression actuelle : le bonus Route ne semble plus actif.
>
> Autorités auditées :
> - règles : `Traversal Rule Registry` ;
> - résolution terrain : `Surface Traversal Resolver` ;
> - mouvement final : `Exploration Core / stepMovement()` ;
> - Builder : géométrie uniquement, via `surface.routes[]` ;
> - Renderer : lecture seule, interdit de modifier le gameplay.
>
> Invariants :
> - `terrain.road` doit rester ground ×1.25 ;
> - une route Builder doit ressortir du handoff normalisé avec `traversalRuleId: terrain.road` ;
> - `stepMovement()` doit appliquer ce multiplicateur sur la route ;
> - le smooth visuel ne doit jamais devenir autorité de vitesse ;
> - aucune rustine dans le Renderer/Builder UI ;
> - aucun changement `Zombicide-40k`.
>
> Plan de vérification :
> 1. vérifier Registry : `terrain.road.ground === 1.25` ;
> 2. vérifier Builder -> validation -> handoff -> runtime document ;
> 3. vérifier `resolveSurfaceTraversal()` au centre d'une Route créée dans le Builder ;
> 4. vérifier un pas réel `stepMovement()` Route vs sol ;
> 5. vérifier l'écart éventuel entre largeur gameplay `route.width` et enveloppe visuelle smooth ;
> 6. si le chemin réel reste GREEN, ne pas inventer de correctif ;
> 7. si une rupture est démontrée, TDD RED sur la cause puis correction au bon propriétaire.
>
> Résultat audit :
> - aucune régression gameplay démontrée ;
> - `terrain.road.ground` reste **1.25** dans le Traversal Rule Registry ;
> - `stepMovement()` applique toujours `maxSpeed × speedMultiplier` ;
> - une Route créée par `addSurfacePath()` ne duplique pas `traversalRuleId` dans le draft, puis la normalisation canonique restaure bien `terrain.road` ;
> - le handoff Builder conserve ce contrat ;
> - test bout-en-bout : sol `x=100 -> 200`, Route `x=100 -> 225` pour `maxSpeed=100`, soit **+25 %** ;
> - CI : `37329597565` — **SUCCESS**.
>
> Cause probable de l'impression utilisateur :
> - largeur gameplay de la Route : `82 px` dans l'exemple ;
> - enveloppe visuelle smooth historique : `82 + outerEdgePadding(18) = 100 px` ;
> - le smooth affiche donc environ **9 px de bord fondu par côté** en dehors du cœur gameplay ;
> - dans ce bord visuel, le resolver retourne volontairement `terrain.ground ×1.00` ;
> - ce comportement respecte la séparation stricte rendu/gameplay et existait déjà conceptuellement avec l'edge padding, mais le smooth rend la zone de transition plus perceptible.
>
> Sentinelle ajoutée :
> - test du chemin Builder -> validation -> handoff -> traversal -> mouvement ;
> - test explicite cœur Route x1.25 vs bord visuel smooth x1.00 ;
> - CI finale : `37329743230` — **SUCCESS**.
>
> Décision :
> - **aucun correctif gameplay appliqué**, car la régression signalée n'est pas reproduite ;
> - ne pas élargir la traversée à partir du matériau ou du renderer : cela créerait une autorité gameplay visuelle interdite ;
> - si un ajustement UX est souhaité plus tard, agir uniquement sur la lisibilité du bord/épaule visuelle ou sur l'intensité du bonus, dans un lot séparé.
>
> État : **GREEN AUDIT — bonus Route x1.25 confirmé, aucune régression moteur**.
>
> Checkpoint final prévu après CI documentaire :
> `checkpoint/exploration-road-speed-regression-audit-v1-green-2026-10-05`.

---


> ÉTAT ACTIF — 2026-10-05
>
> Chantier : **Linear Smooth Transition v1 — Route + Rivière/Mer**
>
> Branche : `work/exploration-linear-smooth-transition-v1-2026-10-05`
>
> Base GREEN : `3140b2d41faa9d88580727e71979abd6b2aa60d3`
>
> Checkpoint de départ : `checkpoint/exploration-start-linear-smooth-transition-v1-2026-10-05`
>
> Dernier GREEN : `checkpoint/exploration-builder-unified-paint-v1-green-2026-10-05`
>
> Besoin utilisateur :
> - appliquer aux Routes et aux Rivières/Mers le même principe de transition douce que les surfaces ;
> - éviter les bords nets sans imposer de textures de transition manuelles ;
> - conserver le système de peinture unique Sol / Route / Rivière-Mer.
>
> Audit réutilisation :
> - Route et Rivière sont déjà des géométries canoniques `surface.routes[]` / `surface.rivers[]` ;
> - elles sont déjà rendues par le même `Surface Renderer` ;
> - `Surface Feather v2` possède déjà le moteur `smooth-mask`, ses buffers réutilisables, le calcul pur du masque et le fallback par passes ;
> - les anciens assets `edge` / `bank` et paddings sont purement visuels et peuvent rester dessinés dans la couche avant composition ;
> - aucun nouveau moteur de transition n'est nécessaire.
>
> Mission unique :
> - généraliser la composition `smooth-mask` existante aux features linéaires `path` et `water` ;
> - dessiner le rendu Route/Rivière existant dans la couche temporaire ;
> - appliquer le même masque continu sur son enveloppe visuelle ;
> - recopier une seule couche compositée sur le canvas principal ;
> - conserver les textures de bord/berge, couleurs et highlights existants à l'intérieur de la couche ;
> - conserver l'ancien rendu direct comme fallback explicite si le smooth-mask n'est pas disponible.
>
> Autorités :
> - géométrie Route/Rivière : World Surface Model / WorldDocument ;
> - apparence + paddings : Material Registry ;
> - transition + composition : Surface Renderer ;
> - buffers offscreen : ressources temporaires du Renderer uniquement.
>
> Invariants :
> - aucune modification de `surface.routes[].points/width/materialId` ;
> - aucune modification de `surface.rivers[].points/width/materialId` ;
> - aucun masque ou bitmap sérialisé ;
> - aucune collision/traversée/rencontre déduite du visuel ;
> - aucun changement Builder/Draft dans ce lot ;
> - pas de second registry ni de second renderer ;
> - `Zombicide-40k` intact.
>
> Règle de largeur :
> - la géométrie gameplay reste `width` canonique ;
> - le masque visuel Route se borne à l'enveloppe déjà existante `width + outerEdgePadding` ;
> - le masque visuel Rivière/Mer se borne à l'enveloppe déjà existante `width + outerBankPadding` ;
> - aucun nouveau débordement visuel n'est créé au-delà de ces paddings déjà GREEN.
>
> TDD attendu :
> 1. RED : une Route sous `smooth-mask` ne doit plus dessiner ses strokes directement sur le canvas principal ;
> 2. RED : une Rivière/Mer sous `smooth-mask` ne doit plus dessiner ses strokes directement sur le canvas principal ;
> 3. RED : chacune doit être compositée une seule fois via le buffer réutilisable ;
> 4. RED : le masque Route doit être recoupé à `width + outerEdgePadding` ;
> 5. RED : le masque Rivière doit être recoupé à `width + outerBankPadding` ;
> 6. GREEN : edge/bank + center + highlight restent dessinés dans la couche ;
> 7. GREEN : fallback historique reste fonctionnel sans Canvas/filter ;
> 8. aucune mutation de la feature ;
> 9. CI complète ;
> 10. preview mobile + gate utilisateur.
>
> Hors périmètre :
> - nouveaux assets Route/Rivière ;
> - bruit/dithering organique ;
> - réglage utilisateur du smooth ;
> - changement collision/traversée ;
> - refonte Material Pack.
>
> Résultat technique :
> - TDD RED initial : `54b14f6eea2064e2431004226956e21d1dfe0b9c` ;
> - CI RED : `37322500717` — **FAILURE attendue** car Route/Rivière dessinaient encore leurs strokes directement sur le canvas principal ;
> - première implémentation : Route/Rivière rendues dans la couche temporaire puis compositées via le `smooth-mask` partagé ;
> - CI : `37322646224` — **SUCCESS** ;
> - refinement TDD : `ff70914294df1596989116cc6b448889c0e581e8` ;
> - CI RED refinement : `37322955508` — **FAILURE attendue** car le plan linéaire dédié n'existait pas encore ;
> - `linearFeatherMaskPlan(coreWidth, visualOuterWidth, transition)` ajouté :
>   - Route : cœur opaque = `width`, enveloppe = `width + outerEdgePadding` ;
>   - Rivière/Mer : cœur opaque = `width`, enveloppe = `width + outerBankPadding` ;
> - `drawSmoothMaskedLayer()` reste l'unique compositeur partagé pour Surface / Route / Rivière ;
> - les deux mêmes buffers Canvas sont réutilisés entre features et frames ;
> - edge/bank, center et highlight historiques restent dessinés dans la couche ;
> - aucune mutation de la feature ou du WorldDocument ;
> - CI refinement : `37323470861` — **SUCCESS** ;
> - cache-bust du helper `surface-feather.js?rev=linear-smooth-transition-v1` ajouté pour éviter un ancien module mobile ;
> - CI cache : `37323563216` — **SUCCESS**.
>
> Aucun changement :
> - schéma WorldDocument ;
> - géométrie Route/Rivière ;
> - Material Registry / IDs de matériaux ;
> - collision / traversée / rencontres ;
> - Builder/Draft ;
> - Combat / Portal / Events ;
> - `Zombicide-40k`.
>
> Gate restant :
> - publier une preview dédiée ;
> - sur smartphone, tracer une Route puis une Rivière/Mer sur Herbe/Neige/Sable ;
> - vérifier que le bord est progressif et non net ;
> - vérifier que le cœur reste bien opaque/lisible ;
> - vérifier qu'il n'y a pas de perte de fluidité perceptible ;
> - aucun GREEN final avant validation utilisateur.
>
> Validation technique finale avant preview :
> - HEAD prévalidation : `82132160383f778417fece77b4f121cfa9537ac7` ;
> - CI : `37323690227` — **SUCCESS**.
>
> Publication prévalidation :
> - checkpoint : `checkpoint/exploration-linear-smooth-transition-v1-prevalidation-green-2026-10-05` @ `82132160383f778417fece77b4f121cfa9537ac7` ;
> - preview : `preview/exploration-linear-smooth-transition-v1-2026-10-05` @ même SHA ;
> - PR infrastructure Pages : #86 — **MERGED** ;
> - main infrastructure : `300b5ad3424641df932c6d06d4fe2d4b6014492c` ;
> - Pages : `37323858657` — **SUCCESS** ;
> - lien gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=linear-smooth-transition-v1`.
>
> Gate utilisateur demandé :
> 1. peindre une Route sur Herbe, Neige ou Sable ;
> 2. peindre une Rivière / mer sur ces mêmes surfaces ;
> 3. vérifier que les bords ne coupent plus brutalement la texture dessous ;
> 4. vérifier que le centre Route/Eau reste opaque et lisible ;
> 5. vérifier que les anciennes bordures/berges visuelles restent présentes mais se fondent progressivement ;
> 6. vérifier qu'il n'y a pas de perte de fluidité perceptible sur smartphone.
>
> Gate utilisateur final — 2026-10-05 :
> - verdict utilisateur : « ok c bon » ;
> - smooth Route et Rivière/Mer validé visuellement ;
> - bord progressif accepté, cœur lisible, aucune régression visuelle signalée ;
> - nouvelle demande séparée : vérifier le bonus de déplacement Route.
>
> État : **GREEN FINAL — Linear Smooth Transition v1 validé utilisateur le 2026-10-05**.
>
> Checkpoint final prévu après CI documentaire :
> `checkpoint/exploration-linear-smooth-transition-v1-green-2026-10-05`.

---


> ÉTAT ACTIF — 2026-10-05
>
> Chantier : **Builder Unified Paint v1**
>
> Branche : `work/exploration-builder-unified-paint-v1-2026-10-05`
>
> Base GREEN : `e5d470d69dc7e3af05443ef39c6ac11980259d57`
>
> Checkpoint de départ : `checkpoint/exploration-start-builder-unified-paint-v1-2026-10-05`
>
> Dernier GREEN : `checkpoint/exploration-surface-feather-v2-antibanding-green-2026-10-05`
>
> Retour utilisateur :
> - les encadrés/boutons Route et Rivière dédiés ont été supprimés pour éviter les doublons ;
> - le sélecteur unique existe mais Route/Rivière donnent l'impression de ne plus pouvoir être peints ;
> - demande : un système unique, logique et mobile-first pour peindre Sol / Route / Rivière-Mer, sans seconde autorité.
>
> Cause racine :
> - `addSurfacePath()` et les contrats `surface.zones/routes/rivers` fonctionnent toujours ;
> - le sélecteur `terrain-draw-kind` change les réglages affichés ;
> - mais lorsqu'on est encore dans l'outil `Déplacer`, changer ce sélecteur n'active pas le mode de peinture ;
> - l'utilisateur doit ensuite deviner qu'il faut cliquer séparément sur `Peindre`.
>
> Mission unique :
> - garder un seul bouton global `Peindre` ;
> - garder un seul sélecteur interne de type de tracé ;
> - renommer les modes de façon explicite : `Sol / surface`, `Route`, `Rivière / mer` ;
> - choisir un type de tracé doit activer immédiatement le même outil de peinture canonique ;
> - le bouton global `Peindre` reprend le dernier type sélectionné ;
> - conserver la barre flottante mobile taille +/-/undo ;
> - aucune nouvelle géométrie ni nouveau format.
>
> Autorités :
> - géométrie : WorldDocument / World Surface Model ;
> - mutations : helpers existants du World Builder Draft (`addSurfacePath`, `appendSurfacePathPoint`, `deleteSurfacePath`) ;
> - type de tracé courant : état UI éphémère uniquement ;
> - preview : Surface Renderer en lecture seule.
>
> Invariants :
> - `terrain` écrit uniquement dans `surface.zones[]` ;
> - `route` écrit uniquement dans `surface.routes[]` ;
> - `river` écrit uniquement dans `surface.rivers[]` ;
> - aucune liste parallèle ;
> - aucune copie de géométrie ;
> - aucun changement Material Registry / Renderer dans ce lot ;
> - aucun changement collision / traversée / encounter / combat / portal / events ;
> - aucun changement `Zombicide-40k`.
>
> TDD attendu :
> 1. RED : changer `terrain-draw-kind` doit toujours appeler `setMapTool(selectedKind)` ;
> 2. RED : les trois options doivent être clairement exposées dans l'UI ;
> 3. GREEN : Route/Rivière passent par le même chemin `pending-draw -> beginSurfacePath -> addSurfacePath` que Terrain ;
> 4. GREEN : aucun bouton `data-map-tool=route/river` réintroduit ;
> 5. GREEN : undo reste par références `areaId/kind/pathId` ;
> 6. CI complète ;
> 7. preview mobile + gate utilisateur.
>
> Hors périmètre :
> - transitions visuelles Route/Rivière ;
> - nouveaux matériaux ;
> - refonte des familles terrain ;
> - Surface Feather.
>
> Résultat technique :
> - TDD RED : `9ada3f8e71aa0d223bd661a97de30e688c5d941e` ;
> - CI RED : `37315930233` — **FAILURE attendue** sur les libellés et l'activation automatique du mode sélectionné ;
> - cause confirmée : le sélecteur changeait les réglages mais n'activait pas le mode de peinture lorsqu'on était encore sur `Déplacer` ;
> - correction : choisir `Sol / surface`, `Route` ou `Rivière / mer` appelle maintenant directement `setMapTool(selectedKind)` ;
> - le bouton global reste unique et affiche le mode courant (`Peindre · Sol/Route/Rivière / mer`) ;
> - le pointer pipeline utilise `isPaintKind(mapTool)` puis le chemin canonique `pending-draw -> beginSurfacePath() -> addSurfacePath()` ;
> - aucune nouvelle liste, aucun nouveau format, aucun bouton Route/Rivière séparé ;
> - CI implémentation : `37316131863` — **SUCCESS** ;
> - cache navigateur Builder raccordé à `builder-unified-paint-v1` ;
> - CI après cache-bust : `37316212015` — **SUCCESS**.
>
> Aucun changement :
> - WorldDocument / schéma ;
> - Surface Renderer / Material Registry ;
> - collisions / traversée / rencontres ;
> - Combat / Portal / Events ;
> - `Zombicide-40k`.
>
> Gate restant :
> - publier une preview dédiée ;
> - sur smartphone : choisir Route puis tracer, choisir Rivière / mer puis tracer, revenir Sol / surface ;
> - vérifier que le même bouton Peindre reste actif, que +/- et Annuler fonctionnent pour les trois modes ;
> - aucun GREEN final avant validation utilisateur.
>
> Validation technique finale avant preview :
> - HEAD prévalidation : `dde25814be407266763158042e27a60924704baf` ;
> - CI : `37316286090` — **SUCCESS**.
>
> Publication prévalidation :
> - checkpoint : `checkpoint/exploration-builder-unified-paint-v1-prevalidation-green-2026-10-05` @ `dde25814be407266763158042e27a60924704baf` ;
> - preview : `preview/exploration-builder-unified-paint-v1-2026-10-05` @ même SHA ;
> - PR infrastructure Pages : #85 — **MERGED** ;
> - main infrastructure : `a7f7b143aa6791641be965f076c91d93b35da040` ;
> - Pages : `37316469893` — **SUCCESS** ;
> - lien gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=builder-unified-paint-v1`.
>
> Gate utilisateur demandé :
> 1. choisir `Route` dans Type de tracé puis tracer directement sur la map sans cliquer ailleurs ;
> 2. choisir `Rivière / mer` puis tracer immédiatement ;
> 3. revenir à `Sol / surface` et peindre ;
> 4. vérifier que le bouton global indique le mode courant ;
> 5. vérifier que taille + / - et Annuler fonctionnent dans les trois modes.
>
> Audit préparatoire du lot suivant :
> - Route et Rivière sont déjà rendues par le même `Surface Renderer` ;
> - elles utilisent actuellement des bords dédiés (`edge` / `bank`) ou des doubles strokes couleur ;
> - le prochain lot pourra donc réutiliser l'autorité du `smooth-mask` au niveau Renderer, sans modifier `surface.routes[]` ni `surface.rivers[]` et sans nouveau système de géométrie.
>
> Gate utilisateur final — 2026-10-05 :
> - verdict utilisateur : « ok, maintenant tu dois placer le smooth comme pour les autre texture » ;
> - le système de peinture unifié Sol / Route / Rivière-Mer est validé ;
> - Route et Rivière sont de nouveau accessibles depuis le sélecteur unique sans bouton concurrent ;
> - aucune régression signalée sur le gate réel.
>
> État : **GREEN FINAL — Builder Unified Paint v1 validé utilisateur le 2026-10-05**.
>
> Checkpoint final prévu après CI documentaire :
> `checkpoint/exploration-builder-unified-paint-v1-green-2026-10-05`.

---


> ÉTAT ACTIF — 2026-10-05
>
> Chantier : **Surface Feather v2 / anti-banding**
>
> Branche : `work/exploration-surface-feather-v2-antibanding-2026-10-05`
>
> Base GREEN : `084136b539900ebccf1f2aad26abad8752123a0b`
>
> Checkpoint de départ : `checkpoint/exploration-start-surface-feather-v2-antibanding-2026-10-05`
>
> Dernier GREEN : `checkpoint/exploration-surface-feather-v1-green-2026-10-05`
>
> Retour utilisateur :
> - Surface Feather v1 validé fonctionnellement ;
> - dette visuelle constatée : les 7 passes imbriquées restent visibles comme des traits/bandes ;
> - objectif V2 : lisser le dégradé maintenant, sans revenir à une coupure nette.
>
> Audit :
> - V1 est correctement possédée par Material Registry + Surface Renderer ;
> - la géométrie canonique `WorldArea.surface.zones[]` est correcte et reste gelée ;
> - les transitions dédiées route/herbe et eau/berge du lot GREEN `transition-decals-v1` restent indépendantes ;
> - aucun autre lot V2 / anti-banding n'existe.
>
> Mission unique :
> - conserver `mode: feather` et la compatibilité du rendu V1 par passes ;
> - ajouter une méthode explicite `method: smooth-mask` au Material Pack ;
> - produire un masque alpha continu dans des buffers Canvas éphémères ;
> - utiliser un blur continu du masque puis le recouper strictement à `zone.width` pour ne jamais agrandir la géométrie ;
> - composer la texture de la zone dans ce masque avant de la reporter dans le Surface Renderer ;
> - garder le rendu V1 `passes` comme fallback explicite lorsque le Canvas de masque n'est pas disponible.
>
> Propriétaires :
> - géométrie : World Surface Model / WorldDocument ;
> - politique visuelle : Material Pack / Material Registry ;
> - masque et composition : Surface Renderer ;
> - buffers offscreen : ressources temporaires du Renderer uniquement, jamais données persistantes.
>
> Invariants / fonctions gelées :
> - aucun changement de schéma WorldDocument ;
> - aucun masque/bitmap/zone de transition sérialisé ;
> - aucune extension au-delà de `zone.width` ;
> - aucune collision, traversée ou rencontre dérivée du masque ;
> - routes/rivières et leurs transitions GREEN inchangées ;
> - Builder ne calcule pas le feather ;
> - Encounter / Combat / Portal / Events inchangés ;
> - aucun changement `Zombicide-40k`.
>
> TDD attendu :
> 1. RED : Registry préserve une méthode explicite `smooth-mask` ;
> 2. RED : calcul pur du masque retourne largeur extérieure, largeur cœur et rayon blur bornés ;
> 3. RED : vrai chemin Registry -> Renderer utilise un buffer de masque avec blur et composition, pas 7 bandes visibles sur le canvas principal ;
> 4. GREEN : le masque est recoupé à la largeur canonique ;
> 5. GREEN : cœur opaque, bord progressif ;
> 6. GREEN : ancienne méthode `passes` reste compatible ;
> 7. GREEN : fallback `passes` explicite si aucun Canvas temporaire n'est disponible ;
> 8. aucune mutation de la zone ;
> 9. CI complète ;
> 10. preview mobile + gate utilisateur visuel avant GREEN final.
>
> Risques :
> - Canvas `filter: blur()` selon navigateur ;
> - buffers temporaires trop coûteux si recréés à chaque frame ;
> - texture légèrement adoucie si buffer mal dimensionné ;
> - performance avec beaucoup de zones.
>
> Garde performance :
> - deux buffers réutilisés par instance de Surface Renderer ;
> - aucune allocation de canvas par frame lorsque la taille ne change pas ;
> - pas d'analyse pixel CPU ;
> - fallback V1 conservé.
>
> Hors périmètre :
> - bruit organique/dithering supplémentaire ;
> - textures de transition par couple ;
> - transitions route/rivière ;
> - contrôle utilisateur du feather dans le Builder ;
> - import textures ;
> - Multi-Zone.
>
> Résultat technique :
> - TDD RED : `f349c9774d22009a808f3dd9e8dbd5fd0ec2b5bf` ;
> - CI RED : `37312679195` — **FAILURE attendue** sur méthode Registry absente, plan de masque absent et renderer encore en bandes ;
> - Material Registry conserve maintenant `method: smooth-mask`, `blurRatio` et un fallback explicite `passes` ;
> - calcul pur `surfaceFeatherMaskPlan()` : largeur externe canonique, cœur, largeur de feather et blur borné ;
> - Surface Renderer : deux buffers Canvas réutilisés, masque continu par blur, cœur opaque, clipping `destination-in` à exactement `zone.width` ;
> - la texture est composée dans le masque puis copiée une seule fois sur le canvas principal ;
> - aucune bande V1 n'est dessinée sur le canvas principal lorsque le smooth-mask est disponible ;
> - fallback V1 par passes conservé si Canvas/filter indisponible ;
> - buffers réutilisés entre frames, pas d'allocation Canvas par frame à taille constante ;
> - aucune mutation de la zone / WorldDocument ;
> - sentinelle historique Material Pack mise à jour uniquement parce que le contrat visuel du pack passe volontairement de V1 `passes` à V2 `smooth-mask` ;
> - CI implémentation : `37312991687` — **SUCCESS** ;
> - cache-bust Builder + Exploration raccordé à `surface-feather-v2-antibanding` ;
> - CI après raccord navigateur : `37313102025` — **SUCCESS**.
>
> Aucun changement :
> - schéma WorldDocument ;
> - `surface.zones[].points/width/materialId` ;
> - routes/rivières et leurs transitions ;
> - familles terrain / traversée / collision ;
> - Material Asset Adapter ;
> - Encounter / Combat / Portal / Events ;
> - `Zombicide-40k`.
>
> Gate restant :
> - publier une preview dédiée ;
> - comparer sur smartphone les mêmes raccords Herbe/Neige, Herbe/Sable et Neige/Montagne ;
> - vérifier disparition nette du banding/traits V1 ;
> - vérifier que la frontière reste douce et que la fluidité ne baisse pas perceptiblement ;
> - aucun GREEN final avant validation utilisateur.
>
> Validation technique finale avant preview :
> - HEAD prévalidation : `85b212f141bc6d13b6c889ad1fdc2db881e2aadd` ;
> - CI : `37313220132` — **SUCCESS**.
>
> Publication prévalidation :
> - checkpoint : `checkpoint/exploration-surface-feather-v2-antibanding-prevalidation-green-2026-10-05` @ `85b212f141bc6d13b6c889ad1fdc2db881e2aadd` ;
> - preview : `preview/exploration-surface-feather-v2-antibanding-2026-10-05` @ même SHA ;
> - PR infrastructure Pages : #84 — **MERGED** ;
> - main infrastructure : `96a26ca72eeb8609ce8213d4694d73750ad12a5d` ;
> - Pages : `37313396749` — **SUCCESS** ;
> - lien gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=surface-feather-v2-antibanding`.
>
> Gate utilisateur demandé :
> 1. peindre Neige sur Herbe ;
> 2. peindre Sable sur Herbe ;
> 3. peindre Montagne sur Neige ;
> 4. comparer avec V1 : les bandes/traits concentriques doivent avoir disparu ou être très fortement réduits ;
> 5. vérifier que la frontière reste progressive, le cœur lisible et la largeur du tracé inchangée ;
> 6. vérifier qu'il n'y a pas de baisse de fluidité perceptible sur smartphone.
>
> Gate utilisateur final — 2026-10-05 :
> - retour utilisateur : « ok, il faut la même chose pour route et rivière » ;
> - Surface Feather v2 est accepté comme nouvelle base visuelle pour les surfaces ;
> - aucune régression de fluidité ou de largeur signalée sur ce gate ;
> - demande suivante distincte : appliquer une transition douce cohérente aux routes/rivières et corriger l'accès peinture unifié.
>
> État : **GREEN FINAL — Surface Feather v2 validé utilisateur le 2026-10-05**.
>
> Checkpoint final prévu après CI documentaire :
> `checkpoint/exploration-surface-feather-v2-antibanding-green-2026-10-05`.

---


> ÉTAT ACTIF — 2026-10-05
>
> Chantier : **Surface Feather v1**
>
> Branche : `work/exploration-surface-feather-v1-2026-10-05`
>
> Base GREEN : `fb91e9ce62b162b87ebdddc3f91c80292fb9bb45`
>
> Checkpoint de départ : `checkpoint/exploration-start-surface-feather-v1-2026-10-05`
>
> Dernier GREEN : `checkpoint/exploration-builder-mobile-paint-ergonomics-v1-green-2026-10-05`
>
> Besoin utilisateur :
> - éviter la ligne nette entre deux textures de sol peintes ;
> - exemple cible : herbe ↔ neige ;
> - solution retenue : **feather / blend automatique**, sans texture de transition à placer manuellement ;
> - smartphone prioritaire : aucun besoin de délimiter ou peindre une bordure dédiée.
>
> Audit réutilisation :
> - le lot GREEN `transition-decals-v1` possède déjà les transitions dédiées des routes et rivières ;
> - `Surface Renderer` reste l'unique autorité de rendu ;
> - `Material Registry` possède l'apparence et les paramètres de transition ;
> - `WorldArea.surface.zones[]` est déjà l'unique géométrie des zones peintes ;
> - aucune seconde géométrie de transition ne sera ajoutée.
>
> Mission unique :
> - ajouter au Material Pack une politique générique versionnée de transition `surface -> surface` ;
> - faire exposer cette politique par le Material Registry ;
> - rendre chaque `surface.zones[]` avec un feather progressif au bord ;
> - préserver la largeur canonique de la zone : le feather se fait **vers l'intérieur** de la largeur existante, sans agrandir la géométrie ;
> - le matériau peint reste opaque au cœur du tracé ;
> - le matériau déjà rendu dessous reste visible progressivement dans la bande de transition ;
> - deux zones superposées se mélangent selon l'ordre canonique de rendu existant.
>
> Propriétaires :
> - géométrie : World Surface Model / WorldDocument ;
> - paramètres visuels de transition : Material Pack / Material Registry ;
> - calcul des passes de feather + dessin : Surface Renderer ;
> - Builder : aucune nouvelle autorité, il continue à écrire uniquement les zones canoniques.
>
> Invariants / fonctions gelées :
> - aucun changement de schéma WorldDocument ;
> - aucune zone secondaire / masque sérialisé ;
> - aucun changement de `terrainFamilyId` ou `traversalRuleId` ;
> - aucune collision ou gameplay déduit du feather ;
> - routes/rivières conservent leurs transitions GREEN existantes ;
> - Material Asset Adapter inchangé ;
> - Encounter / Combat / Portal / Events inchangés ;
> - aucun changement `Zombicide-40k`.
>
> TDD attendu :
> 1. RED : Material Registry doit exposer une politique `surfaceTransition` explicite ;
> 2. RED : une politique `mode: feather` doit produire plusieurs passes largeur/alpha déterministes ;
> 3. RED : le vrai chemin Registry -> Surface Renderer doit dessiner plusieurs passes pour une zone ;
> 4. GREEN : largeur extérieure maximale = `zone.width` canonique ;
> 5. GREEN : cœur du tracé opaque, bord partiellement transparent ;
> 6. GREEN : pack sans transition conserve l'ancien rendu opaque en une passe ;
> 7. GREEN : renderer ne modifie jamais la zone ni le WorldDocument ;
> 8. sentinelles routes/rivières/transitions existantes GREEN ;
> 9. CI complète ;
> 10. preview Builder + gate utilisateur visuel smartphone avant GREEN final.
>
> Paramètres v1 envisagés dans le Material Pack :
> - `mode: feather` ;
> - ratio de largeur de transition ;
> - largeur min/max en unités monde ;
> - nombre de passes ;
> - opacité du bord.
>
> Risques :
> - coût de rendu si trop de passes ou trop de zones ;
> - bord trop transparent sur les petits pinceaux ;
> - répétition visuelle des textures plus visible pendant le blend.
>
> Hors périmètre :
> - texture de transition spécifique par couple de matériaux ;
> - bruit organique / bord irrégulier ;
> - refonte des transitions route/rivière déjà GREEN ;
> - contrôle Builder utilisateur du feather ;
> - import textures utilisateur ;
> - Multi-Zone / World Assembly.
>
> Résultat technique :
> - TDD RED : `82152311edb7ae248475630dd5619f9e5a948f5e` ;
> - CI RED : `37291716247` — **FAILURE attendue** : Registry sans politique + zone rendue en une seule passe opaque ;
> - Material Registry expose désormais une `surfaceTransition` normalisée et immuable ;
> - pack `forest-core-v1` : `mode=feather`, ratio `0.18`, min `6`, max `64`, `7` passes, opacité bord `0.08` ;
> - nouveau calcul pur `surfaceFeatherPasses()` dans le domaine Renderer ;
> - la première passe utilise exactement `zone.width` : aucune extension visuelle au-delà de la géométrie canonique ;
> - les passes suivantes rétrécissent vers le cœur et augmentent progressivement l'opacité ;
> - le cœur est opaque ;
> - un pack sans politique garde exactement le rendu historique opaque en une passe ;
> - le vrai test Registry -> Surface Renderer vérifie les passes et l'absence de mutation de la zone ;
> - transitions route/herbe et eau/berge GREEN existantes inchangées ;
> - cache navigateur Builder + runtime raccordé à la révision `surface-feather-v1` ;
> - CI implémentation : `37291868649` — **SUCCESS** ;
> - CI après sentinelle pack + cache-bust : `37292014268` — **SUCCESS**.
>
> Aucun changement :
> - schéma WorldDocument ;
> - `surface.zones[].points/width/materialId` ;
> - familles terrain / traversée / collision ;
> - Material Asset Adapter ;
> - routes/rivières ;
> - Encounter / Combat / Portal / Events ;
> - `Zombicide-40k`.
>
> Gate restant :
> - publier une preview dédiée ;
> - sur smartphone, peindre notamment Herbe ↔ Neige, Herbe ↔ Sable, Neige ↔ Montagne ;
> - vérifier disparition de la ligne dure, lisibilité du cœur de texture et fluidité ;
> - aucun GREEN final avant validation utilisateur.
>
> Validation technique finale avant preview :
> - HEAD preview : `28417979a22b668b156935d51c57dc6cf7bd059d` ;
> - CI : `37292114374` — **SUCCESS**.
>
> Publication prévalidation :
> - checkpoint : `checkpoint/exploration-surface-feather-v1-prevalidation-green-2026-10-05` @ `28417979a22b668b156935d51c57dc6cf7bd059d` ;
> - preview : `preview/exploration-surface-feather-v1-2026-10-05` @ même SHA ;
> - PR infrastructure Pages : #83 — **MERGED** ;
> - main infrastructure : `09c4ac844262f899bc972d4e3c4d488030234d9a` ;
> - Pages : `37292248199` — **SUCCESS** ;
> - lien gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=surface-feather-v1`.
>
> Gate utilisateur demandé :
> 1. peindre une zone Neige sur Herbe ;
> 2. peindre Sable sur Herbe ;
> 3. peindre Montagne sur Neige ou inversement ;
> 4. vérifier que la frontière est progressive et non une ligne franche ;
> 5. vérifier que le centre du trait reste bien opaque/lisible ;
> 6. vérifier qu'il n'y a pas de baisse de fluidité perceptible sur smartphone.
>
> Gate utilisateur final — 2026-10-05 :
> - verdict utilisateur : « ça fait le taf » ;
> - amélioration validée par rapport à la coupure nette entre textures ;
> - limite visuelle explicitement signalée : les passes de feather restent perceptibles comme des traits/bandes ;
> - cette limite est acceptée pour la V1 et devient un chantier de polish séparé ; elle n'est pas masquée ni présentée comme résolue.
>
> État : **GREEN FINAL — V1 validée avec dette visuelle connue : banding du feather**.
>
> Backlog polish futur — **Surface Feather v2 / anti-banding** :
> - conserver exactement la même autorité Renderer/Material System ;
> - réduire la perception des bandes sans ajouter de géométrie au WorldDocument ;
> - étudier en priorité un vrai gradient alpha continu / masque hors-écran ou un dithering/bruit léger déterministe ;
> - ne pas revenir à des textures de transition obligatoires ;
> - mesurer le coût mobile avant toute augmentation importante du nombre de passes.
>
> Checkpoint final prévu après CI documentaire :
> `checkpoint/exploration-surface-feather-v1-green-2026-10-05`.

---


> ÉTAT ACTIF — 2026-10-05
>
> Chantier : **Builder Mobile Paint Ergonomics v1**
>
> Branche : `work/exploration-builder-mobile-paint-ergonomics-v1-2026-10-05`
>
> Base GREEN : `4a0dfa162627fb423f0dc00c01630e947385974a`
>
> Checkpoint de départ : `checkpoint/exploration-start-builder-mobile-paint-ergonomics-v1-2026-10-05`
>
> Dernier GREEN : `checkpoint/exploration-water-lava-materials-v1-green-2026-10-05`
>
> Retour utilisateur :
> - la barre directe possède des entrées séparées Peindre terrain / Tracer route / Tracer rivière alors que ces trois fonctions appartiennent au même espace Terrain ;
> - sur smartphone, annuler le dernier tracé impose trop de scroll/manipulations ;
> - le réglage du pinceau est pénible pendant la peinture ;
> - changer la taille du pinceau après un tracé modifie aujourd'hui la largeur du tracé sélectionné, alors que ce réglage doit servir uniquement aux prochains tracés.
>
> Mission unique :
> - remplacer les trois boutons directs Terrain/Route/Rivière par un seul outil **Peindre** ;
> - choisir le type de tracé dans l'onglet Terrain via un contrôle compact Terrain / Route / Rivière ;
> - afficher uniquement les réglages du type de tracé courant pour réduire les doublons et le scroll ;
> - ajouter sur mobile un bouton flottant **Annuler tracé** ;
> - l'annulation conserve seulement une pile éphémère de références `areaId/kind/pathId`, jamais une copie de géométrie ;
> - ajouter un réglage flottant rapide du diamètre/largeur pendant la peinture ;
> - rendre les sliders de largeur strictement prospectifs : ils règlent le prochain tracé et ne mutent jamais un tracé déjà créé.
>
> Propriétaires :
> - WorldDocument/draft : autorité unique des tracés ;
> - helpers `addSurfacePath/deleteSurfacePath/updateSurfacePath` : mutations canoniques ;
> - état outil / pile d'IDs d'annulation / taille outil : UI éphémère seulement ;
> - Renderer : lecture seule.
>
> Interdits :
> - aucune pile contenant des copies de WorldDocument ou de géométrie ;
> - aucun système Undo global concurrent ;
> - aucune mutation d'un path existant depuis le slider du pinceau ;
> - aucun changement de géométrie runtime, collisions, rencontres, Portals ou Combat ;
> - aucun changement `Zombicide-40k`.
>
> Tests :
> - RED : toolbar n'expose plus trois outils de peinture séparés ;
> - RED : contrôle de type + bouton flottant annulation + contrôle rapide pinceau exigés ;
> - RED : les sliders de largeur ne peuvent plus appeler `updateSurfacePath(... { width })` ;
> - GREEN : création terrain/route/rivière toujours via `addSurfacePath` ;
> - GREEN : undo supprime uniquement le dernier tracé référencé via `deleteSurfacePath` ;
> - tests Builder existants + CI complète ;
> - preview mobile + gate utilisateur avant GREEN final.
>
> Hors périmètre :
> - moteur de transition/feather ;
> - import de textures utilisateur ;
> - multi-zone / World Assembly ;
> - refonte générale des autres onglets Builder.
>
> Résultat technique :
> - TDD RED exploitable : `ea6e4ba84163dfcf46906487b45d90139651150c`, CI `37257830483` — **FAILURE attendue** ;
> - toolbar directe ramenée à un seul bouton **Peindre** ;
> - choix Terrain / Route / Rivière déplacé dans un sélecteur compact dans l'onglet Terrain ;
> - seuls les réglages du type de tracé courant restent affichés ;
> - contrôle flottant de peinture ajouté avec − / taille / + / Annuler ;
> - sur mobile, le contrôle est `position: fixed` et respecte `safe-area-inset-bottom` ;
> - Undo limité aux tracés : pile éphémère de références `areaId/kind/pathId` uniquement, suppression via `deleteSurfacePath` ;
> - aucune copie de WorldDocument ou de géométrie dans l'historique ;
> - les sliders de largeur sont désormais strictement prospectifs : ils ne modifient plus `selectedSurfacePathId.width` ;
> - sélectionner un ancien tracé ne remplace plus la taille courante du pinceau ;
> - premier passage implémentation : CI `37258004157` rouge uniquement sur deux sentinelles historiques qui exigeaient les anciens boutons Route/Rivière ;
> - sentinelles mises à jour selon le nouveau contrat UI, sans changement moteur ;
> - CI complète : `37258063195` — **SUCCESS**.
>
> Aucun changement :
> - `addSurfacePath/appendSurfacePathPoint/deleteSurfacePath` restent les mutations canoniques ;
> - format WorldDocument inchangé ;
> - renderer/collisions/rencontres/Portals/Combat inchangés ;
> - `Zombicide-40k` inchangé.
>
> Gate restant :
> - publier une preview dédiée ;
> - vérifier sur smartphone : changement de type de tracé, boutons −/+, Annuler, absence de scroll forcé ;
> - confirmer qu'un changement de taille n'épaissit plus les tracés déjà réalisés ;
> - aucun GREEN final avant validation utilisateur.
>
> Publication prévalidation :
> - checkpoint : `checkpoint/exploration-builder-mobile-paint-ergonomics-v1-prevalidation-green-2026-10-05` @ `8faeaddcc00c5be7fb5f40e791933c6ab6d71f12` ;
> - preview : `preview/exploration-builder-mobile-paint-ergonomics-v1-2026-10-05` @ même SHA ;
> - PR infrastructure Pages : #82 — **MERGED** ;
> - main infrastructure : `de82f122b80ab5877570ea505cc573d99133f2c9` ;
> - Pages : `37258184399` — **SUCCESS** ;
> - la même publication consomme la preview Combat `exploration-battle-end-return-v1`.
>
> Lien gate :
> `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=builder-mobile-paint-ergonomics-v1`.
>
> Gate utilisateur final — 2026-10-05 :
> - verdict utilisateur : « Parfait, je valide » ;
> - ergonomie mobile Terrain / Route / Rivière validée ;
> - contrôle flottant − / taille / + / Annuler validé ;
> - taille du pinceau prospective validée : modifier la taille n'épaissit plus les tracés existants ;
> - aucune régression signalée sur le gate réel.
>
> État : **GREEN FINAL — gate mobile utilisateur validé le 2026-10-05**.
>
> Checkpoint final prévu après CI documentaire :
> `checkpoint/exploration-builder-mobile-paint-ergonomics-v1-green-2026-10-05`.

---


> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **Water + Lava Materials v1**
>
> Branche : `work/exploration-water-lava-materials-v1-2026-10-04`
>
> Base GREEN : `924a35460eac27bed649c9d0be29f2408099b830`
>
> Checkpoint de départ : `checkpoint/exploration-start-water-lava-materials-v1-2026-10-04`
>
> Dernier GREEN : `checkpoint/exploration-stylized-terrain-surfaces-v1-green-2026-10-04`
>
> Mission unique :
> - conserver `water.forest_stream` comme choix existant ;
> - ajouter trois textures d'eau stylisées distinctes dans le même Material Registry ;
> - ajouter une lave visuelle utilisable avec l'outil Rivière / eau ;
> - ajouter un sol volcanique cendre + fissures de lave comme matériau `surface` ;
> - rendre automatiquement ces choix disponibles dans le Builder via les listes existantes `waterMaterials` / `surfaceMaterials` ;
> - conserver la géométrie rivière/zone et les familles gameplay séparées des matériaux visuels.
>
> Assets source validés :
> - eau claire bleue ;
> - eau turquoise ;
> - eau sombre / marais ;
> - lave fluide ;
> - sol cendre / lave.
>
> Propriétaires :
> - Material Pack / Material Registry : ids, labels, paramètres visuels ;
> - Material Asset Adapter : assetId -> fichier local ;
> - Material Texture Loader : chargement ;
> - Surface Renderer existant : rendu ;
> - Builder : projection des matériaux depuis le registry, aucune liste parallèle.
>
> Invariants / fonctions gelées :
> - `terrainFamilyId` et `traversalRuleId` restent indépendants de `materialId` ;
> - une lave choisie comme matériau de rivière ne crée aucune règle de dégâts/traversée implicite ;
> - aucune texture ne définit la collision ;
> - aucun second catalogue de matériaux ;
> - aucun nouveau renderer ;
> - géométrie routes/rivières/zones inchangée ;
> - Portals/Events/Combat/Encounter gelés ;
> - aucun changement `Zombicide-40k`.
>
> Tests :
> - sentinelle RED puis GREEN sur 5 nouveaux assetIds ;
> - Material Registry : 3 nouvelles eaux + 1 lave `water` + 1 sol volcanique `surface` ;
> - manifeste : dimensions, bytes et SHA-256 réels ;
> - les listes Builder continuent de provenir uniquement du Material Registry ;
> - CI complète ;
> - preview + gate visuel utilisateur avant GREEN final.
>
> Risques :
> - texture d'eau trop détaillée/repetitive à l'échelle du ruban ;
> - lave visuellement confondue avec une règle gameplay ;
> - sol volcanique trop chargé sur smartphone.
>
> Hors périmètre du lot :
> - gameplay lave/dégâts ;
> - nouveau type de géométrie ;
> - moteur de transition entre surfaces ;
> - import utilisateur de textures ;
> - multi-zone / World Assembly.
>
> Décision transition déjà validée pour un lot futur :
> - priorité à un **feather/blend automatique** au bord des zones peintes, adapté au smartphone ;
> - pas de textures de transition dédiées pour l'instant ;
> - ce futur raccord doit rester une responsabilité Renderer/Material System et ne jamais écrire de géométrie secondaire dans le WorldDocument.
>
> Résultat technique :
> - TDD RED : `ee6d5f18d944f6cbff0c6b2b1e2a8e9a3ecfe5d0`, CI `37232417357` — **FAILURE attendue** sur assets/matériaux absents ;
> - intégration initiale : `6ce4f9812377b1efa283e166c09f68b8fe97d478` ;
> - sentinelle d'intégrité binaire a bloqué deux écarts manifeste/binaire sur les assets turquoise puis marais ;
> - correction limitée au manifeste afin qu'il décrive les binaires réellement commités, sans toucher au renderer ni au gameplay ;
> - HEAD technique validé : `1820e8e0ec89f2a17b140d667d6cdf93348b02c7` ;
> - CI complète : `37232951773` — **SUCCESS** ;
> - 5 nouveaux assetIds derrière le Material Asset Adapter existant ;
> - 4 nouveaux matériaux `water` : Eau claire bleue, Eau turquoise, Eau sombre / marais, Lave ;
> - 1 nouveau matériau `surface` : Sol cendre & lave ;
> - l'ancienne `water.forest_stream` est conservée ;
> - Builder : aucune liste parallèle, les nouveaux choix proviennent automatiquement de `materialRegistry.list()`.
>
> Aucun changement :
> - géométrie rivière/zone ;
> - `terrainFamilyId` / `traversalRuleId` ;
> - Collision World ;
> - Encounter / Combat / Portal / Event ;
> - `Zombicide-40k`.
>
> Gate restant :
> - publication d'une preview dédiée ;
> - vérifier dans le Builder les 5 nouveaux choix ;
> - tracer une rivière avec chacune des 3 eaux et la lave ;
> - peindre une zone avec Sol cendre & lave ;
> - aucun GREEN final avant validation utilisateur.
>
> Publication prévalidation :
> - checkpoint : `checkpoint/exploration-water-lava-materials-v1-prevalidation-green-2026-10-04` @ `46f44169f73b617e2874a888b8a448a6bd583eec` ;
> - preview : `preview/exploration-water-lava-materials-v1-2026-10-04` @ même SHA ;
> - PR infrastructure Pages : #80 — **MERGED** ;
> - main infrastructure : `54921c3fb3776d99c064bf48399e35e8a18959f1` ;
> - Pages : `37233124149` — **SUCCESS** ;
> - lien gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=water-lava-materials-v1`.
>
> Gate utilisateur final :
> - retour utilisateur le 2026-10-05 : « les texture c est bon » ;
> - validation visuelle acceptée pour les 3 eaux, la lave rivière et le sol cendre & lave ;
> - aucune régression visuelle signalée sur ce gate.
>
> État : **GREEN FINAL — gate visuel utilisateur validé le 2026-10-05**.
>
> Checkpoint final prévu après CI documentaire :
> `checkpoint/exploration-water-lava-materials-v1-green-2026-10-05`.

---


> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **Stylized Terrain Surfaces v1**
>
> Branche : `work/exploration-stylized-terrain-surfaces-v1-2026-10-04`
>
> Base GREEN : `a399386dfc3f8dde7c128c6014a16555d38bd5d9`
>
> Checkpoint de départ : `checkpoint/exploration-start-stylized-terrain-surfaces-v1-2026-10-04`
>
> Dernier GREEN : `checkpoint/exploration-multicombat-revalidation-v1-green-2026-10-04`
>
> Mission unique :
> - intégrer cinq surfaces stylisées dans l'autorité Material Registry / Asset Adapter existante ;
> - remplacer visuellement la base `grass.forest` par une herbe plus cartoon, sans changer son ID ni sa sémantique ;
> - raccorder des textures réelles pour `ground.sand` et `ground.snow` ;
> - ajouter une surface forêt dédiée et une surface montagne rocheuse ;
> - rendre ces surfaces sélectionnables dans le Builder via les listes déjà alimentées par le Material Registry ;
> - conserver la géométrie `WorldArea.surface` et le pinceau terrain existants inchangés.
>
> Assets source du lot :
> - herbe cartoon ;
> - sous-bois / forêt ;
> - neige ;
> - sable ;
> - montagne / roche.
>
> Propriétaires :
> - matériau / label / assetIds : Material Registry / Material Pack ;
> - assetId -> fichier physique : Material Asset Adapter ;
> - chargement : Material Texture Loader existant ;
> - rendu : Surface Renderer existant ;
> - géométrie / famille terrain : World Surface Model ;
> - sélection : Builder, consommateur du Material Registry.
>
> Invariants / interdits :
> - aucune texture ne devient une géométrie ou une règle gameplay ;
> - `terrainFamilyId` reste séparé de `materialId` ;
> - pas de second catalogue de matériaux ;
> - pas de fallback silencieux ;
> - pas de nouveau renderer ni système de masque concurrent ;
> - routes/rivières/Portals/Events/Combat gelés ;
> - aucun changement `Zombicide-40k`.
>
> Tests :
> - sentinelle RED puis GREEN sur les nouveaux assetIds et matériaux ;
> - intégrité des binaires réellement commités : taille + SHA-256 + dimensions ;
> - Material Registry : cinq surfaces disponibles, IDs uniques ;
> - Builder : les nouvelles surfaces apparaissent via la projection existante du registry ;
> - tests matériau/Builder existants verts ;
> - CI complète ;
> - preview + gate visuel utilisateur avant GREEN final.
>
> Risques :
> - répétition trop visible d'une texture générée ;
> - texture trop détaillée à petite échelle ;
> - confusion forêt visuelle / famille terrain gameplay ;
> - régression de manifeste/Asset Adapter si les nouveaux binaires ne sont pas déclarés ensemble.
>
> Hors périmètre :
> - nouveau moteur de transition entre surfaces ;
> - refonte des masques/bords ;
> - import utilisateur de textures ;
> - multi-zone / composition de monde ;
> - XP/loot/capture.
>
> Backlog validé après ce lot :
> - **User Texture Import v1** : import simple d'images par le créateur, stockage local, métadonnées et injection dans la même autorité Material Registry/Asset Adapter sans second système ;
> - **Multi-Zone / World Assembly** : éditeur de zones réutilisables puis éditeur supérieur de raccord des zones, analogue Pièce -> Donjon.
>
> Résultat technique :
> - TDD RED : `140f64d1d4eea8ef98ecccd87072051928d44e00`, CI `37229823931` — **FAILURE attendue** ;
> - implémentation : cinq textures WebP 128 × 128 intégrées derrière les propriétaires existants ;
> - `grass.forest` conserve son ID mais utilise désormais l'herbe cartoon ;
> - `ground.sand` et `ground.snow` utilisent désormais une texture réelle ;
> - nouveaux matériaux `ground.forest_floor` et `ground.mountain_rock` ;
> - Builder : aucune liste parallèle, les nouveaux choix proviennent automatiquement du Material Registry ;
> - manifeste étendu avec bytes + SHA-256 des binaires réellement commités ;
> - première CI d'implémentation `37230250192` : 288/290, deux sentinelles obsolètes diagnostiquées ;
> - correction soustractive des sentinelles uniquement : compteur 8 -> 12 et regex de cache corrigée pour signifier réellement « non-espace » ;
> - HEAD technique validé : `ec42a09b4651150c595d548b7612e4c989ab2699` ;
> - CI complète : `37230407642` — **SUCCESS**.
>
> Aucun changement :
> - géométrie `WorldArea.surface` ;
> - `terrainFamilyId` / rencontres ;
> - Surface Renderer métier ;
> - routes/rivières/Portals/Events/Combat ;
> - `Zombicide-40k`.
>
> Gate restant :
> - publier une preview dédiée ;
> - vérifier visuellement dans le Builder : Herbe cartoon, Sol de forêt, Neige, Sable, Montagne rocheuse ;
> - vérifier base d'Area + pinceau terrain sur smartphone/desktop ;
> - aucun GREEN final avant validation utilisateur.
>
> Publication prévalidation :
> - checkpoint : `checkpoint/exploration-stylized-terrain-surfaces-v1-prevalidation-green-2026-10-04` @ `1c6a88808412b5ee28a4d9495cd68271f802aff1` ;
> - preview : `preview/exploration-stylized-terrain-surfaces-v1-2026-10-04` @ même SHA ;
> - PR infrastructure Pages : #79 — **MERGED** ;
> - main infrastructure : `25f784c4e9ee60e156b1ed73bcc6522e2b7fe6f0` ;
> - Pages : `37230562737` — **SUCCESS** ;
> - lien gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=stylized-terrain-surfaces-v1`.
>
> Gate utilisateur final :
> - retour utilisateur le 2026-10-04 : « Oui parfait » ;
> - validation visuelle acceptée pour Herbe cartoon, Sol de forêt, Neige, Sable et Montagne rocheuse dans le Builder ;
> - aucune régression signalée sur ce gate.
>
> État : **GREEN FINAL — gate visuel utilisateur validé le 2026-10-04**.
>
> Checkpoint final prévu après CI documentaire :
> `checkpoint/exploration-stylized-terrain-surfaces-v1-green-2026-10-04`.

---


> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **Multi-combat revalidation v1**
>
> Branche : `work/exploration-multicombat-revalidation-v1-2026-10-04`
>
> Base GREEN documentaire : `269e0a2c8792d7c00363e965f330da2a89a92c14`
>
> Checkpoint de départ : `checkpoint/exploration-start-multicombat-revalidation-v1-2026-10-04`
>
> Dernier GREEN fonctionnel : `checkpoint/exploration-world-event-message-v1-green-2026-10-04`
>
> Contexte :
> - le blocage « un seul combat puis équipe non reconnue » était explicitement externe à Exploration ;
> - le correctif Rappel / Invocation / changement de créature a été réalisé dans le laboratoire Combat ;
> - la preview Exploration publique charge encore l'ancien ref Combat `preview/lab-player-party-recall-runtime-fix-v1-2026-10-03`.
>
> Mission unique :
> - republier la preview Exploration avec le ref Combat corrigé `preview/lab-combat-tactics-switch-travel-v1-2026-10-04` ;
> - revalider le vrai chemin `Exploration -> Combat -> retour -> Exploration -> second Combat` ;
> - vérifier que l'équipe reste reconnue entre deux combats ;
> - lever la note FROZEN uniquement après gate utilisateur.
>
> Propriétaires :
> - équipe / Rappel / Invocation : Combat / Capture roster ;
> - position monde et rencontres : Exploration ;
> - transport : Encounter Bridge ;
> - Pages : infrastructure de test uniquement.
>
> Interdits :
> - aucun correctif Roster dans Exploration ;
> - aucun retry/reload ;
> - aucun cache gameplay ;
> - aucun second party state ;
> - aucun changement XP/loot/capture ;
> - aucun changement `Zombicide-40k`.
>
> Gate réel :
> 1. déclencher un premier combat depuis Exploration ;
> 2. utiliser si souhaité Rappel / Invocation / changement de créature ;
> 3. terminer/revenir à Exploration ;
> 4. continuer à marcher jusqu'à une nouvelle rencontre ;
> 5. lancer un second combat ;
> 6. vérifier que l'équipe est toujours reconnue et utilisable.
>
> Prévalidation technique :
> - Combat corrigé utilisé : `preview/lab-combat-tactics-switch-travel-v1-2026-10-04` @ `fc5cc99cf7050f7c8013de6ce2ca1998d769b8ba` ;
> - CI Combat : `37204391454` — **SUCCESS** ;
> - l'ancien ref `preview/lab-player-party-recall-runtime-fix-v1-2026-10-03` n'est plus utilisé par Pages ;
> - PR infrastructure Exploration #73 — **MERGED** ;
> - main infrastructure : `42f9257b83138848bb3088297b9fb4727c6a22ae` ;
> - Pages : `37213791805` — **SUCCESS** ;
> - aucun code gameplay Exploration/Builder modifié ;
> - aucun correctif Roster/Party ajouté dans Exploration.
>
> Lien gate :
> `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=multicombat-revalidation-v1`
>
> Gate utilisateur restant :
> 1. lancer « Tester en jeu » ;
> 2. déclencher un premier combat ;
> 3. vérifier Rappel / Invocation / changement de créature si utilisé ;
> 4. terminer et revenir à Exploration ;
> 5. continuer l'exploration jusqu'à une seconde rencontre ;
> 6. lancer le second combat ;
> 7. vérifier que l'équipe est toujours reconnue et utilisable.
>
> Après validation :
> - lever la note historique `Player Party / Rappel -> Invocation FROZEN` ;
> - clôturer ce lot en GREEN sans ajouter de code Exploration.
>
> Incident gate — 404 au lancement Combat :
> - reproduction utilisateur : validation de la rencontre -> GitHub Pages 404 ;
> - cause racine : la lignée Combat récente corrigée ne contenait plus `examples/dom-demo/exploration-encounter.html` ni les contrats Exploration/Party associés ;
> - le chemin construit par Encounter Bridge Exploration était correct ;
> - aucun correctif de navigation Builder/Exploration n'était requis.
>
> Convergence Combat réalisée dans :
> `work/lab-exploration-bridge-convergence-v1-2026-10-04`
>
> Base Combat conservée :
> `794b80d3deecac4705faf5c9d581f130074d5c0c`
> (correctifs récents Rappel/Invocation/zone, CI `37214761522` SUCCESS).
>
> Restauré côté Combat uniquement :
> - page/adaptateur public Exploration Encounter ;
> - `CaptureEncounterSnapshot v1` ;
> - `CaptureCombatResult v1` ;
> - `CaptureParty v1` + party data ;
> - catalogue ruleset requis ;
> - tests bridge/party/handoff/visual ;
> - sentinelle de présence de la page publique.
>
> Aucun changement :
> - Combat Runtime ;
> - Roster Session ;
> - Recall/Summon ;
> - logique de rencontre Exploration ;
> - Builder ;
> - `Zombicide-40k`.
>
> Combat convergence :
> - HEAD fonctionnel : `0b20b59c10a2b71d5653408c3d3bfdf2c5b4811c` ;
> - CI complète Combat : `37216176389` — **SUCCESS** ;
> - preview : `preview/lab-exploration-bridge-convergence-v1-2026-10-04`.
>
> Publication Exploration :
> - PR infra #74 — **MERGED** ;
> - main infra : `95591b29b4c9443a7cdd2c0c81e9d8924ea795a6` ;
> - Pages : `37216263793` — **SUCCESS** ;
> - `combat-preview` utilise désormais la preview Combat de convergence.
>
> Nouveau lien gate :
> `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=combat-bridge-convergence-v1`
>
> Gate utilisateur :
> 1. Tester en jeu ;
> 2. déclencher une rencontre puis lancer Combat — **plus de 404 attendu** ;
> 3. terminer le combat et revenir à Exploration ;
> 4. déclencher un second combat ;
> 5. vérifier équipe + Rappel/Invocation/changement de créature.
>
> Seconde correction bridge — gel avant apparition des créatures :
> - cause démontrée : `exploration-encounter.js` importait un ancien adaptateur `capture-runtime-presentation-assets-v1.js` absent de la lignée Combat récente ;
> - correction réalisée côté Combat uniquement : utilisation du propriétaire canonique existant `capture-skill-presentation-assets-v2.js` ;
> - aucun Combat Runtime / Roster / Recall / Summon modifié ;
> - sentinelle bootstrap : chaque import statique local de la page publique doit exister ;
> - Combat SHA publié : `b641b6c7836d04a174e6431e8be80e2532344801` ;
> - CI Combat : `37216711034` — **SUCCESS** ;
> - checkpoint : `checkpoint/lab-exploration-bridge-convergence-v1-bootstrap-green-2026-10-04`.
>
> Redéploiement propre :
> - PR infra #75 — **MERGED** ;
> - main infra : `5c037b7c01b624089c4830f602ad88da66037694` ;
> - Pages : `37216893988` — **SUCCESS** ;
> - le log Pages confirme le checkout exact de `b641b6c7836d04a174e6431e8be80e2532344801`.
>
> Nouveau gate :
> `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=combat-bridge-bootstrap-v2`
>
> Incident suivant observé — équipe inconnue :
> - message runtime : `unknown Capture partyRef: capture-party-preview` ;
> - cause racine : Exploration envoyait encore l'ancien identifiant de preview depuis `src/main.js` ;
> - le bridge Combat refusait correctement cette référence inconnue.
>
> Correction :
> - ID canonique CaptureParty confirmé côté Combat : `capture-party-player-v1` ;
> - Exploration transporte uniquement cette référence opaque via `CAPTURE_PLAYER_PARTY_REF` ;
> - aucun alias/fallback de party ;
> - aucune copie du roster dans Exploration ;
> - aucune modification Combat Runtime / Roster / Recall / Summon.
>
> TDD :
> - RED : `c2e5017fa33d0096a6c4f32099c32dda315f9757` ;
> - CI RED : `37221798981` — FAILURE attendue ;
> - HEAD fonctionnel : `df163a3295d19996de902206bd8075cf67962ac8` ;
> - CI fonctionnelle : `37221868131` — **SUCCESS**.
>
> Publication :
> - checkpoint : `checkpoint/exploration-multicombat-partyref-v1-prevalidation-green-2026-10-04` ;
> - preview : `preview/exploration-multicombat-partyref-v1-2026-10-04` ;
> - PR infra #76 — **MERGED** ;
> - main infra : `d122bad5644f2dc0f473c9d4166dd79299e3f58f` ;
> - Pages : `37221941656` — **SUCCESS** ;
> - Combat preview : `preview/lab-exploration-bridge-convergence-v1-2026-10-04`.
>
> Nouveau gate :
> `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=multicombat-partyref-v1`
>
> État : **GREEN FINAL — multi-combat / Player Party validé utilisateur le 2026-10-04**.
>
> Clôture finale du gate historique :
> - correction finale propriétaire côté Combat : `RosterController.ownsSlot(actorId)`, sans ID ennemi codé en dur et sans seconde autorité ;
> - preview Combat validée : `preview/lab-exploration-roster-target-availability-v1-2026-10-04` @ `1b7f20305ac47baabef6fabe06930566f09a973d` ;
> - CI Combat : `37224863232` — **SUCCESS** ;
> - infrastructure Pages Exploration : `main` @ `dd2898efd511a54a7116b440cbb9a37967345d06` ;
> - Pages : `37224937771` — **SUCCESS** ;
> - verdict utilisateur sur le vrai chemin : « ok ca marche » ;
> - chemin validé : Exploration -> rencontre -> Combat -> Rappel / Invocation / changement de créature -> retour Exploration -> second Combat ;
> - équipe reconnue et utilisable au second combat ;
> - aucune correction gameplay Exploration ajoutée pour contourner Roster/Party ;
> - la note historique `Player Party / Rappel -> Invocation FROZEN` est levée.
>
> Checkpoint final prévu après CI de cette clôture documentaire :
> `checkpoint/exploration-multicombat-revalidation-v1-green-2026-10-04`.

---

> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **World Event Contract v1**
>
> Branche : `work/exploration-world-event-contract-v1-2026-10-04`
>
> Base GREEN : `2dfe78980ec957cb2178cdc4783716270753b1d3`
>
> Checkpoint de départ : `checkpoint/exploration-start-world-event-contract-v1-2026-10-04`
>
> Dernier GREEN : `checkpoint/exploration-trigger-geometry-v1-green-2026-10-04`
>
> Mission unique :
> - introduire un contrat `WorldEvent v1` dans le WorldDocument ;
> - lier chaque événement à une Area + une géométrie Trigger GREEN ;
> - distinguer `on-enter` et `on-interact` ;
> - référencer une définition/action future par identifiant stable sans l'implémenter ici ;
> - authoring Builder : ajouter/éditer/supprimer un Event local sans runtime actif.
>
> Contrat cible :
> `id + enabled + sourceAreaId + activation + trigger + eventDefinitionId + repeatPolicy`.
>
> Propriétaires :
> - géométrie : World Trigger Geometry GREEN ;
> - binding local événement/zone : WorldDocument ;
> - définition/action métier : futur Event Definition/Action Authority, référencée seulement ;
> - état consommé/persistance : futur ExplorationSave, hors périmètre ;
> - input interaction/runtime Event Controller : hors périmètre.
>
> Invariants :
> - aucune géométrie Event parallèle ;
> - aucun calcul de trigger recopié ;
> - aucun listener/bouton runtime ajouté ;
> - aucun état `consumed` persistant dans la définition de carte ;
> - aucun Event ne modifie directement Capture/Combat/XP/loot ;
> - aucun type d'action métier codé en dur dans le moteur.
>
> TDD :
> - RED avant modèle ;
> - normalisation on-enter/on-interact ;
> - réutilisation `WorldTriggerGeometry` ;
> - validation Area/object-anchor ;
> - WorldDocument export/import conserve les bindings ;
> - Builder manipule le même draft canonique.
>
> Hors périmètre :
> - exécution d'Event ;
> - bouton Interagir ;
> - coffre fonctionnel ;
> - action catalog ;
> - persistance consumed ;
> - nouveaux assets ;
> - Capture/Combat/XP/loot ;
> - `Zombicide-40k`.
>
> Résultat technique :
> - `WorldDocument.schemaVersion = 3` avec `events[]` ;
> - `WorldEvent v1` : `id + enabled + sourceAreaId + activation + trigger + eventDefinitionId + repeatPolicy` ;
> - activation : `on-enter` ou `on-interact` ;
> - trigger : réutilise exclusivement `WorldTriggerGeometry` GREEN (`point` / `object-anchor`) ;
> - `repeatPolicy` : `once` ou `repeatable` ;
> - `consumed` n'est jamais sérialisé dans la carte ;
> - références Area/object-anchor invalides filtrées par le WorldDocument ;
> - suppression d'un WorldObject référencé par un Event object-anchor protégée ;
> - Builder > Événements : ajout, suppression, activation, Area, mode, trigger, rayon, objet/ancre, répétition, `eventDefinitionId` ;
> - preview Builder affiche la zone de l'Event sélectionné ;
> - aucun Event Controller/import runtime ajouté à `src/main.js`.
>
> TDD :
> - RED : `b0514d6d5b5d67416dfefa80eec703ccfe6b6186` ;
> - CI RED : `37201008275` — FAILURE attendue ;
> - HEAD fonctionnel : `2c643da48a2696e6c0c5dff15e50ccd3b8eb874d` ;
> - CI fonctionnelle/sentinelles : `37201249241` — **SUCCESS**.
>
> Prévalidation :
> - checkpoint : `checkpoint/exploration-world-event-contract-v1-prevalidation-green-2026-10-04` ;
> - preview : `preview/exploration-world-event-contract-v1-2026-10-04` @ `2c643da48a2696e6c0c5dff15e50ccd3b8eb874d` ;
> - PR infra Pages #70 — MERGED ;
> - main infra : `b04892c5244d38c7a2ce533ec20d21a9eeb22cd2` ;
> - Pages run : `37201323247` — **SUCCESS** ;
> - lien gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=world-event-contract-v1`.
>
> Gate utilisateur avant GREEN final :
> 1. ouvrir Builder > Événements ;
> 2. créer un événement ;
> 3. tester `Entrée dans la zone` avec Point / X / Y / Rayon ;
> 4. tester `Interaction` avec `Ancre objet`, maison + `main-door` ;
> 5. tester `Une fois` / `Répétable` et Activé ;
> 6. modifier `eventDefinitionId` ;
> 7. déplacer/rotationner/scaler la maison et vérifier que le cercle Event object-anchor suit l'ancre ;
> 8. vérifier le JSON : Event présent, aucun champ `consumed`.
>
> Important :
> - ce lot n'exécute volontairement encore aucun événement ;
> - `on-enter` / `on-interact` sont des bindings de données authorés ;
> - le prochain lot après gate sera `Interaction/Event Controller v1`, raccordé à ces données sans nouvelle géométrie.
>
> Hors périmètre confirmé :
> - exécution Event ;
> - bouton Interagir/Input ;
> - coffre fonctionnel ;
> - Event Action Catalog ;
> - persistance `consumed` ;
> - nouveaux assets ;
> - Capture/Combat/XP/loot ;
> - `Zombicide-40k`.
>
> Gate utilisateur — révision requise 2026-10-04 :
> - retour : l'interface est trop technique et pas assez explicite ;
> - décision produit : le Builder doit proposer au minimum un événement concret `Afficher un message`, avec texte éditable ;
> - `eventDefinitionId` ne doit pas être exposé au créateur pour ce cas simple ;
> - le test Builder -> jeu doit réellement déclencher la boîte de dialogue afin de valider le chemin complet.
>
> Révision de périmètre du même lot avant GREEN :
> - conserver une seule géométrie Trigger GREEN ;
> - introduire une action locale versionnée `message` dans WorldEvent ;
> - simplifier les libellés Builder en `Quand ? / Où ? / Que faire ? / Message / Fréquence` ;
> - ajouter un Event Controller runtime unique pour `on-enter` et `on-interact` ;
> - ajouter une boîte de dialogue runtime et un intent `Interagir` explicite ;
> - garder l'état `once` en mémoire runtime seulement dans ce lot, sans persistance save.
>
> Révision UX/fonctionnelle réalisée :
> - action locale v1 : `message` avec texte éditable directement dans le WorldEvent ;
> - `eventDefinitionId` retiré de l'interface créateur ;
> - Builder simplifié : `Quand ? / Où ? / Que faire ? / Message / Fréquence` ;
> - action visible : `Afficher un message` ;
> - déclenchement `on-enter` réel via Event Controller unique ;
> - déclenchement `on-interact` réel via bouton `Interagir` affiché seulement à portée ;
> - boîte de dialogue runtime avec bouton `Continuer` ;
> - déplacement/rencontres suspendus pendant le dialogue ;
> - `once` consommé en mémoire runtime uniquement ; aucune persistance ajoutée au WorldDocument ;
> - `repeatable` on-enter se réarme uniquement après sortie puis nouvelle entrée dans la zone ;
> - géométrie toujours fournie exclusivement par World Trigger Geometry GREEN.
>
> TDD révision :
> - RED : `676ce5531ec7fab7def9567bfd305868acb7a82b` ;
> - CI RED : `37206668034` — FAILURE attendue ;
> - HEAD fonctionnel révisé : `2d847ddec8f89aede3b7728d4b9d4fd935fc694a` ;
> - CI complète : `37206951303` — **SUCCESS**.
>
> Nouvelle prévalidation :
> - checkpoint : `checkpoint/exploration-world-event-message-v1-prevalidation-green-2026-10-04` ;
> - preview : `preview/exploration-world-event-message-v1-2026-10-04` @ `2d847ddec8f89aede3b7728d4b9d4fd935fc694a` ;
> - PR infra Pages #71 — MERGED ;
> - main infra : `5246c88d9dc7700d25aefd2098874e1d6f07c36e` ;
> - Pages run : `37207029640` — **SUCCESS** ;
> - lien gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=world-event-message-v1`.
>
> Gate utilisateur simplifié :
> 1. Builder > Événements > `+ Événement` ;
> 2. laisser `Le joueur entre dans la zone` + `Afficher un message` ;
> 3. écrire un texte dans `Message` ;
> 4. lancer `Tester en jeu` ;
> 5. marcher dans le cercle de l'événement ;
> 6. vérifier que le message apparaît et bloque le déplacement jusqu'à `Continuer` ;
> 7. optionnel : choisir `Le joueur interagit`, tester le bouton `Interagir`.
>
> Gate utilisateur — seconde révision requise 2026-10-04 :
> - ambiguïté confirmée entre « entrer dans une zone » et « entrer dans une maison » ;
> - décision produit : distinguer clairement `zone libre`, `entrée dans un lieu/bâtiment` et `interaction` ;
> - l'entrée dans un bâtiment doit consommer le Portal existant comme fait d'entrée, sans recréer une détection de porte ;
> - le cercle de zone libre doit être déplaçable directement au doigt/souris dans le Builder, comme les autres éléments, sans imposer X/Y.
>
> Révision du même lot avant GREEN :
> - ajouter une activation canonique `on-portal-enter` référencée par `portalId` ;
> - Event Controller observe uniquement `viaPortalId` produit par Portal ;
> - UI créateur : « Entrer dans une zone / Entrer dans un lieu ou bâtiment / Interagir » ;
> - sélection du lieu/bâtiment par Portal entrant, avec libellé lisible ;
> - cercle point sélectionné draggable directement dans la preview Builder ;
> - coordonnées X/Y conservées uniquement dans les détails avancés.
>
> Seconde révision UX/fonctionnelle réalisée :
> - choix créateur distincts : `Entrer dans une zone`, `Entrer dans un lieu ou bâtiment`, `Interagir` ;
> - `on-portal-enter` référence un `portalId` précis et ne possède aucune géométrie parallèle ;
> - l'entrée bâtiment consomme le fait `viaPortalId` produit par Portal après transition ;
> - validation : le Portal référencé doit réellement cibler l'Area associée à l'événement ;
> - Builder liste les entrées avec le label de définition de l'objet (ex. `Maison bois et pierre · forest-house-01`) ;
> - aucun cercle pour l'entrée bâtiment : le déclencheur est le franchissement du Portal ;
> - pour une zone libre, le cercle jaune sélectionné se déplace directement au doigt/souris ;
> - centre du cercle matérialisé par une poignée jaune ;
> - X/Y restent disponibles uniquement dans les détails avancés ;
> - traitement runtime déplacé immédiatement après Portal, avant rencontre/combat.
>
> TDD seconde révision :
> - RED : `bf401c4067322351ebb65c9b4e3168ef3132930d` ;
> - CI RED : `37209038792` — FAILURE attendue ;
> - HEAD fonctionnel : `7a5183ea9f6a2705436ed334391bf3180cc43b74` ;
> - CI complète : `37209472606` — **SUCCESS**.
>
> Nouvelle gate attendue :
> 1. créer un événement `Entrer dans une zone`, puis déplacer le cercle jaune directement sur la map ;
> 2. tester le message en jeu ;
> 3. créer un événement `Entrer dans un lieu ou bâtiment` ;
> 4. sélectionner `Maison bois et pierre · forest-house-01` ;
> 5. entrer réellement dans la maison via sa porte ;
> 6. vérifier que le message apparaît après la transition intérieure, sans cercle artificiel.
>
> Publication seconde révision :
> - checkpoint : `checkpoint/exploration-world-event-building-entry-drag-v1-prevalidation-green-2026-10-04` @ `7a5183ea9f6a2705436ed334391bf3180cc43b74` ;
> - preview : `preview/exploration-world-event-building-entry-drag-v1-2026-10-04` @ `7a5183ea9f6a2705436ed334391bf3180cc43b74` ;
> - PR infra Pages #72 — MERGED ;
> - main infra : `9653b848431ab05a5a112bfcab3a53551bbf3b8c` ;
> - Pages run : `37209570349` — **SUCCESS** ;
> - lien gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=world-event-building-entry-drag-v1`.
>
> Validation utilisateur — 2026-10-04 :
> - verdict : « Parfait tout fonctionne bien » ;
> - zone libre déplaçable validée ;
> - entrée lieu/bâtiment via Portal validée ;
> - message runtime validé ;
> - aucune régression signalée.
>
> Suite produit consignée (hors lot courant) :
> - personnaliser la présentation des messages sans toucher au moteur Event ;
> - exemples de profils visuels : `standard`, `parchemin`, `lettre`, `papier` ;
> - ce futur choix devra rester une donnée de présentation du message, jamais une seconde logique d'événement.
>
> Backlog dialogue générique consigné :
> - futur `Dialogue System` transversal réutilisable par Exploration / Dungeon / Capture ;
> - réponses multiples et embranchements ;
> - conditions et conséquences configurables ;
> - portraits/noms/pages de dialogue ;
> - les Builders déclenchent uniquement un `dialogueId` et ne deviennent jamais propriétaires de la logique de dialogue.
>
> Clôture :
> - CI finale : `37212315665` — **SUCCESS** ;
> - SHA GREEN validé : `b40152ed7d8b6760287062dfc4681135712c6e00` ;
> - checkpoint final : `checkpoint/exploration-world-event-message-v1-green-2026-10-04`.
>
> État : **GREEN FINAL**.

---

> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **Trigger Geometry v1**
>
> Branche : `work/exploration-trigger-geometry-v1-2026-10-04`
>
> Base GREEN : `2487923d67c6629b4fcd8668783b2d805b0fcc62`
>
> Checkpoint de départ : `checkpoint/exploration-start-trigger-geometry-v1-2026-10-04`
>
> Dernier GREEN : `checkpoint/exploration-object-catalog-placement-v1-green-2026-10-04`
>
> Mission unique :
> - extraire de Portal une géométrie de trigger commune ;
> - supporter au minimum un point libre et une référence d'objet/anchor ;
> - faire consommer cette autorité commune par Portal ;
> - préserver les anciens documents Portal `building-door` via migration normalisée ;
> - préparer le raccord futur Event/Interaction sans l'implémenter ici.
>
> Propriétaires :
> - géométrie de déclenchement : World Trigger Geometry ;
> - Portal : transition d'Area uniquement ;
> - WorldObject : transform + anchors intrinsèques résolus depuis Object Catalog ;
> - Input/Interaction/Event : hors périmètre.
>
> Invariants :
> - aucune seconde détection de zone ;
> - Portal ne possède plus sa propre formule distance/résolution anchor ;
> - aucune lecture de pixels/alpha PNG ;
> - aucun listener/timer/observer ajouté ;
> - aucune mutation Capture/Combat/XP/loot ;
> - `Zombicide-40k` intact.
>
> TDD :
> - RED avant runtime ;
> - point trigger commun ;
> - object-anchor trigger commun ;
> - migration `building-door -> object-anchor` ;
> - Portal conserve transition vraie Area/Spawn ;
> - tests Portal historiques GREEN.
>
> Résultat technique :
> - nouvelle autorité `src/world/world-trigger-geometry.js` ;
> - géométrie canonique v1 : `point` et `object-anchor` ;
> - anciens triggers Portal `building-door` migrés à la normalisation vers `object-anchor` ;
> - résolution d'ancre depuis le WorldObject résolu/Object Catalog, jamais depuis les pixels ;
> - test de distance possédé uniquement par World Trigger Geometry ;
> - Portal conserve uniquement validation de références + transition Area/Spawn ;
> - Builder édite désormais `point` ou `object-anchor` ;
> - suppression d'un objet référencé par un Portal object-anchor reste protégée.
>
> TDD :
> - RED : `749f2c3be694c889a46190ef7c3222fb944a9a9f` ;
> - CI RED : `37196766622` — FAILURE attendue ;
> - HEAD fonctionnel : `2028bcd4dc9de0806750b3be232c236708d40d21` ;
> - CI finale : `37196884803` — **SUCCESS** ;
> - sentinelle : Portal ne contient plus `buildingDoorAnchorWorld` ni sa propre formule de distance.
>
> Prévalidation :
> - checkpoint : `checkpoint/exploration-trigger-geometry-v1-prevalidation-green-2026-10-04` ;
> - preview : `preview/exploration-trigger-geometry-v1-2026-10-04` @ `2028bcd4dc9de0806750b3be232c236708d40d21` ;
> - PR infra Pages #69 — MERGED ;
> - main infra : `a0179bc3436ae9b13e395c370a1261862ecd640c` ;
> - Pages run : `37196966027` — **SUCCESS** ;
> - lien gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=trigger-geometry-v1`.
>
> Gate utilisateur avant GREEN final :
> 1. ouvrir Builder > Portals ;
> 2. vérifier qu'un trigger peut être `Point` ou `Ancre objet (porte)` ;
> 3. sélectionner la maison + `main-door` ;
> 4. déplacer/rotationner/scaler la maison et vérifier que le Portal suit toujours sa porte ;
> 5. lancer « Tester en jeu » ;
> 6. entrer dans la maison puis ressortir ;
> 7. vérifier qu'aucun comportement Portal n'a régressé.
>
> Hors périmètre confirmé :
> - Event Controller ;
> - onEnter/onInteract produit ;
> - bouton Interaction/Input ;
> - persistance d'événements ;
> - coffre fonctionnel ;
> - Capture/Combat/XP/loot ;
> - `Zombicide-40k`.
>
> Validation utilisateur — 2026-10-04 :
> - retour : « Ça a l'air de fonctionner » ;
> - aucun défaut Portal signalé ;
> - poursuite du plan autorisée.
>
> CI de clôture utilisateur :
> - run `37200896889` — **SUCCESS** ;
> - SHA validé : `d257f7c0f4479cc78eb4d3e5aef71a60998405f1`.
>
> Checkpoint final :
> `checkpoint/exploration-trigger-geometry-v1-green-2026-10-04`.
>
> État : **GREEN utilisateur + CI GREEN**.

---

> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **Object Catalog + Generic Placement v1**
>
> Branche : `work/exploration-object-catalog-placement-v1-2026-10-04`
>
> Base GREEN : `4ce31dfe5acb35ca492835383ed9c6bd2236c0d5`
>
> Checkpoint de départ : `checkpoint/exploration-start-object-catalog-placement-v1-2026-10-04`
>
> Prévalidation technique : `checkpoint/exploration-object-catalog-placement-v1-prevalidation-green-2026-10-04`
>
> SHA technique validé : `f659e89bb3275c188b1c2506edbdba944c9cf513`
>
> Résultat :
> - `ObjectDefinition Catalog v1` possède désormais les données intrinsèques des WorldObjects ;
> - `WorldArea.objects[]` persiste uniquement `objectDefinitionId + transform + overrides locaux` ;
> - aucun `visual/baseSize/footprint/doorAnchors/kind` n'est copié dans le placement ;
> - ponts/maison existants sont résolus depuis le catalogue ;
> - collision, traversée, rendu et Portal consomment l'objet résolu ;
> - Builder : sélection d'une définition, placement, X/Y, rotation, scale, duplication/suppression ;
> - Builder ne permet plus d'éditer asset, taille logique, footprint, anchors ou paramètres intrinsèques ;
> - seul override local v1 : ids de surfaces franchies par un placement de pont ;
> - WorldArea passe en schéma v4.
>
> TDD :
> - RED dédié : `c0c4afd7c1e3725944c66ba1784dda659f4d76b9`, CI `37193976216` — FAILURE attendue ;
> - migration des sentinelles Portal/collision/traversée/Builder/assets ;
> - CI technique finale : `37194847351` — **SUCCESS** ;
> - 261/261 tests + `npm run check` GREEN.
>
> Preview :
> - `preview/exploration-object-catalog-placement-v1-2026-10-04` @ `f659e89bb3275c188b1c2506edbdba944c9cf513` ;
> - PR infra Pages #68 — MERGED ;
> - main infra : `2c15cb874f1e7138c2f1d25ee0cbdccd53b2fb44` ;
> - Pages run : `37194940662` — **SUCCESS** ;
> - lien gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=object-catalog-placement-v1`.
>
> Gate utilisateur requise avant GREEN final :
> 1. ouvrir Builder > Objets ;
> 2. choisir une définition (pont ou maison) ;
> 3. « Placer l'objet » ;
> 4. déplacer directement sur la carte puis modifier X/Y ;
> 5. tester rotation + scale ;
> 6. dupliquer puis supprimer ;
> 7. pour un pont, vérifier que « surfaces franchies » reste éditable ;
> 8. vérifier qu'aucun réglage intrinsèque (asset/taille/footprint/anchors) n'apparaît dans le Builder ;
> 9. lancer « Tester en jeu » et vérifier que les mêmes objets sont rendus/collisionnés.
>
> Hors périmètre confirmé :
> - Trigger/Event runtime ;
> - coffre interactif fonctionnel ;
> - nouvel asset binaire ;
> - éditeur complet de définitions ;
> - XP/loot/Capture Rules ;
> - Combat/Roster ;
> - `Zombicide-40k`.
>
> Suite après validation : **Trigger/Event v1** (zones/anchors logiques + onEnter/onInteract + persistance), puis enrichissement du catalogue/Material Packs par assets contrôlés.
>
> Validation utilisateur — 2026-10-04 :
> - aucun défaut fonctionnel de placement signalé ;
> - retour utilisateur : la fonction semblait déjà présente, différence comprise comme une consolidation d'autorité ;
> - placement pont/maison accepté pour poursuite du plan.
>
> CI clôture utilisateur :
> - run `37196666420` — **SUCCESS** ;
> - SHA validé avant checkpoint : `e483c604348baedcad59b724c934e0c35f22c72c`.
>
> Checkpoint final prévu :
> `checkpoint/exploration-object-catalog-placement-v1-green-2026-10-04`.
>
> État : **GREEN utilisateur + CI GREEN**.

---

> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **Terrain Family Extensibility v1**
>
> Branche : `work/exploration-terrain-family-extensibility-v1-2026-10-04`
>
> Base GREEN : `e8fd5a6e1588ecf200fb03454e9f1be5ff47791e`
>
> Checkpoint de départ : `checkpoint/exploration-start-terrain-family-extensibility-v1-2026-10-04`
>
> Objectif atteint techniquement :
> - les 8 familles historiques sont des presets de données, pas une enum produit fermée ;
> - `WorldDocument.terrainFamilies[]` possède les définitions du monde ;
> - le Builder peut ajouter, renommer et supprimer une famille non utilisée ;
> - une famille utilisée par une Area/zone/route/rivière est protégée contre la suppression ;
> - route et rivière ont désormais une famille éditable ;
> - famille gameplay et texture visuelle sont découplées ;
> - les textures proposées dépendent du type de géométrie (surface/path/water), jamais du nom de famille ;
> - la config de rencontre suit automatiquement les familles du WorldDocument ;
> - les éléments restent fournis dynamiquement par le catalogue Capture ;
> - les anciens WorldDocuments sans `terrainFamilies` récupèrent les 8 presets.
>
> Autorités :
> - familles du monde : WorldDocument ;
> - usage local : World Surface Model ;
> - rencontres : Terrain Family Encounter Config ;
> - éléments/créatures : Capture en lecture seule ;
> - textures : Material Registry.
>
> CI :
> - premier HEAD complet : `37189367867` — FAILURE sur 2 sentinelles obsolètes ;
> - causes : révision Builder trop spécifique dans sentinelle Actor + test héritant des pourcentages démo ;
> - correction soustractive des sentinelles ;
> - HEAD technique : `72c51bdbbc5d3056f41ec00275bab43d3b936d00` ;
> - run `37189417237` — **SUCCESS** (`npm test` + `npm run check`).
>
> Gate utilisateur requise avant GREEN final :
> 1. ouvrir le World Builder > Terrain ;
> 2. ajouter une famille et la renommer ;
> 3. vérifier qu’elle apparaît pour le sol, terrain peint, route, rivière et rencontres ;
> 4. choisir la famille d’une route/rivière sans que sa texture soit forcée ;
> 5. utiliser la famille sur la carte puis vérifier que sa suppression est protégée ;
> 6. vérifier que les réglages de rencontre de cette famille restent éditables.
>
> Hors périmètre confirmé : XP / loot / capture, Combat, Roster, `Zombicide-40k`.
>
> État : **GREEN utilisateur**.
>
> Validation utilisateur — 2026-10-04 :
> - ajout / édition des familles de terrain jugés corrects ;
> - séparation famille / texture jugée cohérente ;
> - verdict : « ça a l'air bon ».
>
> Limite observée pendant le test :
> - impossible d'enchaîner plusieurs combats car le jeu ne reconnaît plus correctement l'équipe après le premier combat ;
> - ce défaut appartient au lot Player Party / Rappel -> Invocation déjà gelé ;
> - il n'est pas causé par Terrain Family Extensibility et n'est pas corrigé dans ce lot ;
> - aucun contournement, retry ou seconde autorité n'est ajouté.
>
> CI HEAD avant clôture : `37189669243` — **SUCCESS**.
>
> Publication preview :
> - preview : `preview/exploration-terrain-family-extensibility-v1-2026-10-04` ;
> - SHA preview : `5018ae4ba6936f13d4d88e671df9bb9c2202a25c` ;
> - checkpoint prévalidation : `checkpoint/exploration-terrain-family-extensibility-v1-prevalidation-green-2026-10-04` ;
> - CI fonctionnelle : `37189417237` — **SUCCESS** ;
> - CI docs prépublication : `37189487868` — **SUCCESS** ;
> - PR infra : #67 — **MERGED** ;
> - main infra : `c9bee8238a0c76ceb1a3c28dbb873795bb61a324` ;
> - Pages run : `37189621459` — **SUCCESS**.
>
> Lien gate :
> `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=terrain-family-extensibility-v1`
>
> Aucun code fonctionnel n'a été mergé dans main ; seule la référence Pages a changé.

---

> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **Modular Authoring Architecture v1 — documentation**
>
> Branche : `work/exploration-modular-authoring-architecture-v1-2026-10-04`
>
> Base GREEN : `480d6858f53170ed5ff6f1b82db13eb074ca791a`
>
> Checkpoint de départ : `checkpoint/exploration-start-modular-authoring-architecture-v1-2026-10-04`
>
> Périmètre : architecture documentaire uniquement ; séparer éditeurs de définitions, Level/World Builder, règles générales Capture et futurs éditeurs globaux.
>
> Décisions utilisateur validées :
> - XP / loot / capture = paramètres généraux Capture, hors Builder ;
> - création d'objets de monde = éditeur séparé du placement Builder ;
> - architecture ouverte à de futurs World Editor / Campaign Editor / autres surfaces ;
> - composition par références versionnées, jamais copie d'autorité.
>
> Document : `docs/LAB_MODULAR_AUTHORING_ARCHITECTURE_V1.md`
>
> Aucun changement gameplay/runtime. Aucun changement de `Zombicide-40k`.

> Validation architecture :
> - organisation validée par l'utilisateur ;
> - Object Definition Editor séparé du World Builder ;
> - schéma ouvert aux futurs World Editor / Campaign Editor ;
> - composition par références versionnées ;
> - presets extensibles, pas d'enum produit fermée pour les domaines créateur.
>
> CI : `37184264109` — **SUCCESS** (`npm test` + `npm run check`).
>
> État : **ARCHITECTURE DOCUMENTAIRE GREEN**.
>
> Suite : traiter séparément la note d'extensibilité du Builder (familles de terrain), puis construire l'autorité Capture configurable XP/loot/capture sans la placer dans Exploration.

---

> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **Capture Rewards / XP / Progression — audit de récupération v1**
>
> Branche : `work/exploration-capture-rewards-progression-audit-v1-2026-10-04`
>
> Base GREEN : `baec0fecede7b9117c3f58d801add3ea593d2796`
>
> Checkpoint de départ : `checkpoint/exploration-start-capture-rewards-progression-audit-v1-2026-10-04`
>
> Périmètre : audit uniquement des règles historiques Capture et des contrats actuels ; aucune mutation gameplay, aucun changement Combat Runtime/Roster Session, aucun changement Zombicide-40k.
>
> Lot Player Party / Rappel -> Invocation : **FROZEN — gate utilisateur échouée**, à reprendre après refonte côté labo Combat.
>
> Résultat audit : voir `docs/LAB_CAPTURE_REWARDS_PROGRESSION_AUDIT_V1.md`.
>
> Décision : XP/loot/capture appartiennent à Capture. Exploration ne doit ni calculer ni stocker une seconde progression.

---


Date : 2026-10-03

## Chantier actif
Actor Placement Catalog v1 — World Builder + sentinelle Loup volcanique.

## Branche
`work/exploration-actor-placement-catalog-v1-2026-10-03`

## Base GREEN
`806d9e9a78dbfdb4728b0344c8afcb6e3b8b9afc`

## Checkpoint de départ
`checkpoint/exploration-start-actor-placement-catalog-v1-2026-10-03`

## Objectif
Remplacer le banc de calibration Actor du World Builder par le flux produit validé :

```text
Actor Definition authority
 -> Actor Catalog
 -> World Builder : sélectionner + placer
 -> WorldArea.actors[] : actorDefinitionId + placement seulement
 -> résolution Actor Definition
 -> MapActorVisual dérivé
 -> Asset Adapter
 -> Map Actor Renderer
```

## Autorités
- placement monde : WorldDocument / WorldArea ;
- définition Héros/PNJ/Créature : module propriétaire de l'entité ;
- créatures Capture : CaptureDatabase/transfer provider lecture seule ;
- visuel intrinsèque : Actor Definition / présentation de l'entité ;
- asset physique : catalogue global / Asset Adapter ;
- préparation du visuel map : Map Actor Visual Preparer ;
- rendu : Map Actor Renderer, lecture seule.

## Périmètre
- ajouter un contrat minimal de placement acteur dans WorldArea ;
- Builder : catalogue + ajout + sélection + X/Y + direction + suppression ;
- supprimer du Builder les réglages intrinsèques Actor :
  - import image ;
  - asset manuel ;
  - rôle manuel ;
  - targetHeight ;
  - sourceFacing / miroir ;
  - anchor ;
  - ombre ;
  - animation ;
  - export MapActorVisual ;
- provider générique Capture -> Actor Definition ;
- preview loader lisant la vraie définition `crea-loup` depuis le dépôt Combat imbriqué ;
- résolution de son asset depuis le vrai catalogue global imbriqué ;
- placer `capture:creature:crea-loup` dans la map démo ;
- rendu Builder et runtime via le pipeline MapActorVisual GREEN existant ;
- tests anti-duplication de données visuelles.

## Hors périmètre
- édition des visuels Héros/Créatures ;
- création d'un second catalogue Capture ;
- vraie équipe joueur Capture ;
- IA/comportement du Loup placé ;
- collision/gameplay propre au placement ;
- modification de Zombicide-40k.

## Critères GREEN techniques
- WorldDocument conserve seulement actorDefinitionId + x/y/facingX ;
- aucun assetId/mapVisual dans le placement ;
- Builder ne propose plus aucun réglage visuel intrinsèque ;
- Loup placé résout son asset depuis la source Capture globale ;
- aucune URL physique du Loup codée dans le Builder ;
- Builder/runtime utilisent le même resolver de définition ;
- sentinelles historiques GREEN ;
- CI SUCCESS.

## Gate utilisateur
Sur la preview publique :
1. voir le Loup volcanique sur la map ;
2. ouvrir le Builder > Acteurs ;
3. vérifier que l'UI ne permet que choix/placement ;
4. déplacer le Loup via X/Y ou sur la map ;
5. lancer le test runtime ;
6. vérifier que le même visuel est conservé.

## Prévalidation technique — Actor Placement Catalog v1

Implémenté :
- `WorldArea.schemaVersion = 3` avec `actors[]` canonique ;
- placement strict : `id + actorDefinitionId + x/y + facingX` ;
- aucun `assetId` / `mapVisual` / réglage visuel sérialisé dans la map ;
- panneau Actor du Builder réduit à sélection / ajout / X-Y / direction / suppression ;
- suppression de l'import image, scale, anchor, ombre, animation, miroir, export MapActorVisual ;
- Builder et runtime résolvent tous deux le visuel depuis la définition d'acteur ;
- l'ancien handoff `builderTestSession.actorVisual/actorAsset` n'est plus consommé par le runtime ;
- sentinelle `capture:creature:crea-loup` placée dans `forest-exterior` ;
- provider Capture générique : presentation assetId -> catalogue visuel global -> MapActorVisual -> renderer ;
- aucune URL physique du Loup dans le WorldDocument ou le Builder.

TDD :
- frontière placement sans données visuelles ;
- provider Capture -> Actor Definition ;
- projection vers MapActor renderer ;
- mutations Builder add/update/delete ;
- présence Loup par référence seulement ;
- UI Actor placement-only ;
- handoff Builder/runtime sans autorité visuelle parallèle.

CI :
- premier run `37148172504` : FAILURE sur 2 sentinelles de contrat obsolètes ;
- causes corrigées :
  - wording UI du nouveau panneau ;
  - attente WorldArea v2 -> v3 ;
- run `37148318702` : SUCCESS ;
- après retrait définitif de l'ancien handoff actorVisual/actorAsset :
  run `37148360401` : SUCCESS.

État : **TECHNIQUE GREEN — publication preview et validation utilisateur restantes**.

## Publication preview — 2026-10-03

Preview fonctionnelle figée :
- branche : `preview/exploration-actor-placement-catalog-v1-2026-10-03` ;
- SHA : `ea6bf020618209cd6f77baab9cbc4fe195a9c8db` ;
- checkpoint : `checkpoint/exploration-actor-placement-catalog-v1-prevalidation-green-2026-10-03` ;
- Exploration CI finale : `37148500636` — **SUCCESS** ;
- push/checkpoint CI : `37148531984` — **SUCCESS**.

Publication Pages :
- PR infra : #57 ;
- main infra : `0e1ba866df511597decbb92bfd83a315037f091e` ;
- Pages run : `37148567676` — **SUCCESS** ;
- artifact : `11282993699` (~32,2 Mo).

Le workflow Pages embarque côte à côte :
- Exploration depuis la branche preview Actor Catalog ;
- Combat depuis la preview Loup configurée validée ;
- `global-assets` sous `capture-assets/`.

La sentinelle Loup ne possède aucun chemin physique dans le WorldDocument :
`capture:creature:crea-loup`
-> transfer Capture
-> assetId de présentation
-> catalogue global
-> asset physique
-> MapActorVisual dérivé
-> Map Actor Renderer.

Gate restante : **validation utilisateur visuelle/ergonomique** du Loup sur la map et du panneau Builder placement-only.

## Retour utilisateur — vue acteur placé — 2026-10-03

Validation utilisateur :
- le Loup volcanique est bien présent sur la map ;
- le chemin de résolution d'asset est validé ;
- le lien / placement est considéré correct.

Correction demandée :
- la map affichait la vue `player/back`, donc le Loup était vu de dos ;
- pour une créature placée dans le monde, utiliser la vue `opponent/front` en priorité.

Correction appliquée :
- le provider Actor Definition Capture choisit désormais `presentation.visual.front.assetId` ;
- fallback explicite vers `back` uniquement si `front` est absent ;
- aucune modification du WorldDocument, du placement, du renderer ou des assets ;
- aucun assetId du Loup copié dans la map.

TDD :
- fixture conserve bien deux vues distinctes : front=opponent, back=player ;
- les tests exigent maintenant que la définition et la vue placée utilisent l'asset opponent.

CI :
- run `37148839946` — **SUCCESS**.

Gate restante :
- revalidation visuelle rapide du Loup de face dans la preview publique.

## Incident preview — vue opponent toujours affichée de dos — 2026-10-03

Retour utilisateur après déploiement opponent/front :
- la map affichait encore visuellement la vue de dos.

Audit :
- binaire `global-assets` inspecté :
  - `loup_volcanique_opponent.webp` = vraie vue 3/4 face ;
  - `loup_volcanique_player.webp` = vraie vue 3/4 dos ;
- métadonnées globales cohérentes ;
- règle provider corrigée cohérente : `front` avant `back` ;
- Pages run précédent SUCCESS.

Cause racine :
- après la correction provider, les URLs publiques du graphe ES modules étaient restées identiques ;
- `index.html` chargeait toujours `main.js?rev=actor-placement-catalog-v1` ;
- `main.js` / Builder chargeaient le preview loader sans revision ;
- le preview loader chargeait le provider sans revision ;
- un navigateur pouvait donc continuer à réutiliser l'ancien module provider depuis son cache malgré le nouveau déploiement.

Correction :
- version publique unique `actor-opponent-view-v1` appliquée à :
  - `index.html -> main.js` ;
  - `builder.html -> world-builder-main.js` ;
  - runtime -> `capture-actor-preview-loader-v1.js` ;
  - Builder -> `capture-actor-preview-loader-v1.js` ;
  - loader -> `capture-actor-definition-provider-v1.js`.
- aucune stratégie de reload forcé ;
- aucun service worker ;
- aucun cache gameplay ;
- uniquement une révision d'URL d'asset/module, conforme au pipeline existant.

Sentinelle :
- nouveau test `actor-placement-public-cache.test.js` exige la révision sur toute la chaîne.

CI :
- HEAD fonctionnel `13a24f25fef384eb315ca68899f2fa88f1760b3c` ;
- run `37149293418` — **SUCCESS**.

Gate restante :
- republier Pages sur ce HEAD puis revalider visuellement le Loup opponent/front.

## Preview cache-bustée publiée — 2026-10-03

Publication finale de la correction opponent/front :
- preview SHA : `5603930d07274ea9f5c5ba52ffea72a7e81501f4` ;
- checkpoint : `checkpoint/exploration-actor-opponent-view-cachefix-v1-prevalidation-green-2026-10-03` ;
- CI : `37149329864` — **SUCCESS** ;
- PR infra : #59 ;
- main infra : `2e470c8e04a64c4fcd189547eec55aad2b335bb8` ;
- Pages run : `37149384770` — **SUCCESS**.

Le même lien public charge désormais des URLs versionnées `actor-opponent-view-v1` sur toute la chaîne runtime/Builder/loader/provider.

Gate restante : validation utilisateur visuelle du Loup volcanique en vue opponent/front.

## Validation utilisateur finale — Actor Placement Catalog v1

Retour utilisateur du 2026-10-03 :
- Loup volcanique présent sur la map ;
- placement / lien Builder -> runtime validé ;
- vue `opponent/front` correctement affichée après cache-bust du graphe ES modules ;
- verdict utilisateur : **good**.

Le lot est donc validé fonctionnellement, visuellement et ergonomiquement.

État final :
- placement monde : référence uniquement ;
- données visuelles : autorité Actor/Capture ;
- asset physique : global-assets ;
- Builder : sélection + placement uniquement ;
- runtime : même resolver que le Builder ;
- aucune seconde autorité visuelle ;
- aucune modification de `Zombicide-40k`.

CI du HEAD avant clôture :
- `37149427368` — **SUCCESS**.

État : **GREEN utilisateur**.



## Clôture audit Capture Rewards / Progression — 2026-10-04

Audit historique terminé sans mutation gameplay.

Constats structurants :
- l'ancien Capture calculait déjà l'XP depuis niveau ennemi + rapport niveau ennemi/niveau allié + bonus de type de combat ;
- le profil exposait déjà un multiplicateur XP et des paramètres de progression ;
- le labo Combat courant ne possède encore que le déblocage des slots de compétences par niveau ;
- loot et capture historiques comportent des constantes et, pour la capture, deux formules concurrentes ;
- la refonte doit donc centraliser XP / niveau / loot / capture dans une autorité Capture configurable ;
- Exploration reste hors calcul XP/loot.

CI audit :
- `37180318992` — SUCCESS ;
- `37180332902` — SUCCESS sur HEAD documentaire précédent.

État : **AUDIT TECHNIQUE GREEN**.
