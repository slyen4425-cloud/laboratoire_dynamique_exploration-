# LAB_CURRENT_WORK — Options de test et entrées/sorties des cartes préconstruites

Date : 2026-10-28.
Base GREEN : `81304cc6d4bc3151f24673c218c70e2196621e86` — 8 présets natifs, retour monde.
Branche : `work/exploration-map-test-options-edge-portals-2026-10-28`.
START : `checkpoint/exploration-start-map-test-options-edge-portals-2026-10-28`.

## Cause racine
Le mode Tester superposait un panneau fixe de réglages ouvert sur le terrain. Une WorldArea issue d'un préset avait un Spawn centré, tandis que les présets extérieurs créés dans World Builder n'avaient aucun Portal vers la zone sélectionnée. Une action de traversée sans Portal activé ou hors du cercle ne peut pas fonctionner.

## Propriétaire et corrections
- HUD Tester : contrôle natif repliable « ⚙ Options du test », fermé par défaut, réglages conservés.
- Création d'une WorldArea depuis un préset : Spawn réel à l'entrée côté gauche du chemin, Portal de sortie réel côté droit du chemin ; lien aller-retour créé avec la zone hôte sélectionnée (extérieurs et donjons) via `connectWorldAreas`.
- Le retour vers la zone hôte utilise un Spawn dédié sur son bord d'entrée. Le Spawn initial du monde et les anciens Portals ne sont pas déplacés.
- Un préset reste un snapshot SculptTerrain/Surface/Objects sans Portals ni Spawns ; WorldDocument est l'unique autorité.

## Invariants / validations
V80 production immuable ; ni format parallèle ni migration des mondes existants ; création nouvelle seule.
Tests : `tests/world-map-test-edge-portals.test.js`, suite Node, CI et smoke Chromium mobile réel préexistant (traversée Portal réelle et retour d'Area). Corriger toute régression avant publication.
Validation manuelle smartphone paysage de l'ergonomie et du parcours restant demandée.
