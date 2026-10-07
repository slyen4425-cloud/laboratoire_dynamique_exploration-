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
