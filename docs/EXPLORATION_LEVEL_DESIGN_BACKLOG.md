# GenSrpG Exploration — Backlog de level design et direction artistique 2,5D

**Statut : À prévoir / planification uniquement — aucun asset ou moteur livré par ce document.**  
**Origine : demandes du créateur du 17 octobre 2026.**  
**Dépôt propriétaire :** laboratoire Exploration Monster Capture.  
**Référence technique :** branche de départ `work/exploration-interior-floor-brush-2026-10-17`, SHA `6fb5aa394ee4769a34df60e34ce83d0f0a57c4d2`.  
**Checkpoint de planification :** `checkpoint/exploration-start-level-design-backlog-2026-10-17`.

## 0. État constaté et but

Le catalogue natif contrôlé avant planification présente **4 bâtiments, 3 arbres, 3 rochers, 4 ponts, 3 entrées/portes extérieures et 3 escaliers**. Les **5 revêtements intérieurs** (2 bois, 2 carrelages, 1 béton) et le pinceau dédié sont en prévalidation technique, non GREEN utilisateur final.

Le monde dispose d'un WorldDocument avec WorldAreas (extérieur/intérieur), surfaces, objets, collisions et passages. En revanche, il ne possède pas de pack natif étoffé de **mobilier, cloisons intérieures, végétation de détail, éléments de ruines/grottes, décorations de cascade, objets à états gameplay**.

**But produit :** rendre possible la construction d'une maison meublée, d'un village, d'une forêt, d'une grotte et de ruines avec des packs réutilisables, dans une interface smartphone fluide en paysage. Ne pas lancer tous les lots en parallèle.

## 1. Backlog par lots

| Priorité | Lot futur | Première tranche de livrables | Dépendances / validation |
|---|---|---|---|
| **P0** | LD01 — Mobilier intérieur | 15–20 définitions : tables ronde/carrée/longue ; chaises, tabourets, bancs ; comptoir droit/angle ; coffre décoratif ; tonneau, caisse, sac ; armoire, étagère ; lit ; tapis ; cheminée ; établi ; éclairage | Registre WorldObject existant ; collisions adaptées ; placement tactile, échelle, rotation ; pas d'interaction fictive |
| **P0** | LD02 — Architecture intérieure | Portes, cadres/seuils, ouvertures, cloisons/murs et coins, fenêtre, arche, colonne, poutre, escaliers/échelle, trappe, plafond/toit masquable | Conservation de la géométrie WorldArea, entrées/Portal et Collision World ; test visibilité ; pas de faux étages avant contrat |
| **P1** | LD03 — Végétation et petits décors | Fleurs multicolores, herbes hautes, touffes, fougères, roseaux, buissons, champignons, racines, souches, troncs couchés ; rochers plats/fissurés/moussus/enneigés/cristallins ; clôtures et panneaux | Distinction `decal` (cosmétique) / `WorldObject` (collision/interaction) ; densité et culling smartphone |
| **P1** | LD04 — Kit de grottes, caches et ruines | Entrées de grotte, cave/cache, mine, souterrain, crypte, catacombes, ruines de temple/château/tour ; sols, parois, angles, colonnes et éboulis | Réutiliser WorldArea + Portal ; nouveaux matériaux/objets ; zones sans construction d'un 2e moteur |
| **P1** | LD05 — Interactions de level design | Coffre ouvrable/butin, portes ouvertes/fermées/verrouillées, levier, interrupteur, plaque, ressource récoltable, objet de quête, panneau, repos, passage secret | Démarrer par contrat d'interaction/état persistant. `WorldEvent` actuel permet surtout l'action `message`; ne pas prétendre que butin/récolte existent déjà |
| **P2** | LD06 — Eau et ambiance | Cascades 3 dimensions, écume, bassin, remous, rive rocheuse, source, étang, ponton, geyser/vapeur, sons spatialisés facultatifs | Décor composite et animation légère sans dupliquer surface eau ou collision |
| **P2** | LD07 — Outils de création | Pinceau de décors (densité, taille, variantes/rotation), groupes copiables, grille/alignement, kits de salle, ordonnancement des couches, contrôle accessibilité | Écrire dans le WorldDocument existant ; éviter objets de détail individuels très coûteux ; performance contrôlée |

### Familles détaillées à garder dans la future bibliothèque

- **Intérieur / Mobilier :** tables, chaises, bancs, tabourets, comptoirs, lits, armoires, bureaux, bibliothèques, établis, rayonnages, coffres, caisses, tonneaux, sacs, cheminées, tapis, lanternes, chandeliers, ustensiles.
- **Intérieur / Construction :** cloisons, murs, angles, portes et cadres, seuils de porte, fenêtres/volets/vitraux, arches, piliers, poutres, échelles, escaliers, trappes, garde-corps, toit à occultation.
- **Extérieur / Végétation :** fleurs, herbes, buissons, fougères, lianes, roseaux, champignons, souches, arbres morts/fruitiers/géants.
- **Extérieur / Relief :** rochers variés, formations, falaises, éboulis, parois, talus, crêtes, cristaux.
- **Extérieur / Eau :** cascades, bassins, écume, ruisseaux, étangs, sources, remous, quais, pontons.
- **Lieux spéciaux :** grotte naturelle/inondée/volcanique ; cache souterraine ; cave ; mine ; cryptes ; tombeaux ; ruines ; égouts ; sanctuaires ; repaires.

## 2. Exigences communes aux futurs assets

1. **Même style artistique** sur tous les packs ; silhouettes claires à l'échelle smartphone, fond transparent pour les objets, ombres/points d'ancrage cohérents et dimensions calibrées. Prévoir les variantes utiles sans exiger 4 vues pour chaque petite décoration.
2. **Données éditables, listes de sélection** plutôt que références à saisir librement (assetId choisi depuis la bibliothèque). Échelle, rotation et placement doivent rester modifiables ; copier peut réutiliser un préréglage de transformation.
3. **Collision/interaction déclarées** dans WorldObject et dans les contrôleurs propriétaires ; aucune collision inférée des pixels. Détails purement visuels -> decals.
4. **Arborescence bibliothèque catégorisée** : Intérieur/Mobilier, Intérieur/Architecture, Extérieur/Végétation, Extérieur/Rochers, Extérieur/Eau, Lieux spéciaux/Grottes/Ruines, Interactifs. Ajouter ces catégories par le contrat de bibliothèque existant, sans second catalogue.
5. **Assets contrôlés** : nommage sémantique, Asset Adapter, manifeste taille/SHA-256 pour binaires et CI, aucun hotlink runtime ; respect des droits/licences des images de référence.
6. **Optimisation** : culling, batching/cache si justifié par mesures, densité des décals limitée, rendu mobile stable sur carte chargée, aucun nouveau micro-freeze.
7. **Gates par lot** : checkpoint START, branche unique, diff minimal, tests réels édition → sauvegarde JSON → rechargement → exploration, CI GREEN, validation smartphone du créateur, puis checkpoint GREEN final.

## 3. Étude de direction artistique future — AR01, vue 2,5D cartoon à relief

### Inspiration du créateur (image fournie le 17/10/2026)

Paysage forestier stylisé **vu obliquement du dessus** : arbres lisibles, palettes pastel, chemins sable, grands escarpements rocheux, eau turquoise, cascades, îlots/plateaux à différentes hauteurs et ombrages simples. Référence **artistique et de composition**, non pack d'assets fourni ; ne pas recopier ni publier l'image source sans permission/droits adaptés.

### Étude technique par degrés, à lancer seulement après les garde-fous de fluidité

**AR01-A — Prototype cosmétique (priorité d'étude)**

- Conserver **WorldDocument X/Y**, caméra et collisions actuelles ; tester une petite carte pilote avec décors 2,5D peints (falaise, plateau inaccessible, cascade animée, sentier, arbres).
- Composition de calques (sol / falaises / décors / eau / objets au premier plan), ombres et tri de profondeur ; rendu de relief simulé sans hauteur physique.
- Tester en paysage sur smartphone, avec plusieurs couches et avec déplacement continu pour repérer les problèmes d'occlusion, de lisibilité et de fluidité.
- **Ne pas présenter la falaise décorative comme une zone de hauteur jouable.**

**AR01-B — Verticalité jouable (chantier distinct / complexe)**

- Spécifier un **modèle de hauteur canonique** pour plateaux, rampes, franchissements, escaliers, ponts et chutes ; connexion explicite des niveaux jouables.
- Définir propriétaire unique de la géométrie, collisions, traversée, tri d'affichage, déplacements/IA, objets/spawns, portail et caméra.
- Fournir authoring/preview dans le Builder, sécurité de traversée, sérialisation versionnée et tests de collisions/étages sur smartphone.
- Aucun `z` visuel ne doit devenir une seconde position gameplay non gérée.

**AR01-C — Moteur 3D complet : non recommandé** pour l'objectif actuel. Coût important, faible bénéfice au regard du prototype 2,5D.

### Critère de choix

Si AR01-A rend déjà le monde lisible et séduisant, intégrer des packs de falaises/cascades et améliorer le renderer **sans toucher au moteur de mouvement**. Ne lancer AR01-B que si le besoin explicite est de monter/descendre physiquement les plateaux sur une même carte.

## 4. Garde-fou d'ordre de chantier

Le créateur a auparavant fixé un prérequis : **fluidité éditeur + jeu smartphone/PC avant grosse finition graphique**, y compris les micro-freezes observés sur carte riche. Ce backlog est **à planifier**, pas un feu vert pour démarrer immédiatement les 7 lots ou refondre la caméra.

**Prochain lot proposé après validation du chantier actif : LD01 mobilier intérieur.** Une validation produit est requise avant génération/import des sprites ou modification des moteurs.
