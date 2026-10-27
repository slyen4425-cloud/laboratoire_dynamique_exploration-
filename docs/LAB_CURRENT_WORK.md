# LAB_CURRENT_WORK — World Builder : assemblage des zones et instances

Date : 2026-10-28
Branche : `work/exploration-world-assembler-2026-10-28`
Base technique GREEN : `ed2d7bc3a4fe31879a8cf0426c461b908015661d`.
Checkpoint START créé **avant** toute modification : `checkpoint/exploration-start-world-assembler-2026-10-28`.
Checkpoint technique CI (sans validation manuelle finale) : `checkpoint/exploration-world-assembler-ci-verified-2026-10-28`, SHA `2f2686d2ce78b498e92f894e861e750f6f4c1d64`.
PR code dédiée : #263 (DRAFT). Déploiement indépendant via Pages PR #264. V80 stable épinglée à `933c852c41c4511cb0eed0717c246cc6b19aeddc`.

## Demande et interface
Nouvelle page `world-assembler.html`, distincte de l'éditeur 2,5D et de `builder.html`, inspirée de l'assemblage visuel du constructeur de donjon : liste des régions/instances, cartes reliées, inspecteur, liens aller/retour, choix du départ, ajout/suppression protégée, édition détaillée d'une Area, export/import JSON, sauvegarde locale.
Un lien `🌍 World Builder` depuis le labo sculpté ouvre cet écran.

## Autorité unique
- Le **seul** document persistant est `WorldDocument v3`, édité par `src/builder/world-builder-draft.js`.
- `WorldArea`, `Portal`, `Spawn`, `EncounterConfig`, Actor Catalog et World Events conservent leurs propriétaires existants ; les liaisons du graphe sont de vrais `portals[]`.
- Le diagramme dessine une projection éphémère des Areas/Portals, **aucun** `WorldGraph`, aucune grille de navigation concurrente.
- Les nouvelles commandes addWorldArea, removeWorldArea, setWorldInitialArea, connectWorldAreas vivent dans le Builder canonique et réutilisent addPortal.
- `world-assembler-handoff.js` transporte un WorldDocument intégral validé à consommation unique vers `builder.html?worldAssembler=1` et retour. Sauvegarde locale : JSON de WorldDocument validé, sans table de liens séparée.
- L'ancien Builder 2D est réutilisé pour l'édition fine. L'éditeur de hauteur 2,5D possède encore un format expérimental `sculpt-preview-scene` différent : **aucune promesse de conversion automatique ni fusion silencieuse** de ces données dans ce lot.
- Aucun changement du moteur de collisions/Combat, de Capture, de GenSrpg ni de la V80 stable.

## Preuve RED -> GREEN
- Tests RED initiaux sur `5ea694b8` (Actions `40600053674`) avant ajout des commandes/handoff.
- `tests/world-assembler-graph.test.js` : 7 tests (création région+instance, IDs automatiques, vrais Portals traversables via runtime, suppression protégée, départ/Spawn, transfert édition, import malformé).
- CI `40600943150` et `40601042612` sur `2f2686d2...` : 849/849 tests Node PASS, check syntax PASS, tests Chromium PASS (Exploration, Monster Capture et nouveau parcours graphique).
- Chromium mobile paysage : démarre d'un monde à 1 zone, crée forêt + château (3), pose 2 Portals, déclare château comme départ, ouvre le Builder détaillé, change sa largeur à 850, revient au graphe et recharge sans perdre les 3 Areas ni les 2 Portals.
- Les événements PNJ/quêtes, marchand, objets de récompense, réglages Hero et raccord complet au heightfield sculpté ne font **pas** partie de ce jalon.

## Publication et sortie
- Source d'assemblage Pages pinnée sur `2f2686d2...` ; production V80 reste byte-identique, les nouvelles pages sont isolées sous `/preview/encounters-v80/`.
- Déploiement HTTP du nouveau World Builder et des dépendances détaillées/Combat à contrôler avant lien utilisateur.
- Pas de checkpoint **GREEN final** avant validation réelle smartphone paysage par l'utilisateur.
- Suite : une fois la navigation visuelle et le transfert 2D acceptés sur téléphone, définir le contrat d'édition d'une scène sculptée depuis un WorldArea canonique sans conversion/multi-autorité, puis PNJ et événements sur les mêmes WorldAreas.
