# Exploration — Mobile Landscape & Area Navigation UX v1 — Prévalidation R4

Date : 2026-10-07

## Retour utilisateur à l'origine de R4

R3 améliore nettement le mode paysage plein écran, mais le bas de la map et le coin de redimensionnement Area restent trop difficiles à atteindre.

## Cause

Le viewport Builder clampait encore la caméra exactement aux limites de la WorldArea.
Le coin bas-droit, qui porte la poignée de redimensionnement, pouvait donc rester collé au bord physique du canvas.

## TDD

- RED : `04f2581d9fbb4e18392b0d07272472eff4403131`
- CI RED : `37669650021` — FAILURE attendue
- viewport overscan : `7e3f6fdfcaf47ba47e36a246127e87bac95fdc4c`
- raccord Builder : `1df9c3ee55ce2ae3e5ca6af1008290c590150a1a`
- cache R4 : `be277f5a51208dc9bac5691109e020cb05fcd2af`
- CI R4 : `37669996552` — SUCCESS

## Correctif

- marge de pan écran : 96 px ;
- possibilité de déplacer visuellement la map au-delà de ses quatre bords ;
- aucune modification des coordonnées ou dimensions persistées ;
- rendu, hit-test, wheel zoom et pinch zoom utilisent la même marge ;
- le coin bas-droit peut être ramené à l'intérieur de l'écran pour saisir la poignée Area.

## Autorités inchangées

- WorldDocument unique ;
- WorldArea unique ;
- Portal unique ;
- Renderer lecture seule ;
- aucune seconde caméra persistée ;
- aucun changement Encounter / Combat ;
- aucun changement dans Zombicide-40k.

## Révision publique

`mobile-landscape-area-navigation-ux-v1-r4`

## Gate manuel

Sur smartphone paysage :
1. entrer en mode map focus ;
2. utiliser Déplacer et tirer la carte vers le haut/bas/gauche/droite ;
3. vérifier que les quatre bords peuvent être ramenés à l'intérieur de l'écran ;
4. passer sur Taille Area ;
5. atteindre et déplacer le coin bas-droit ;
6. vérifier que le plein écran R3 reste ergonomique ;
7. vérifier Intérieur → / ← Extérieur.

Statut : PREVALIDATION uniquement. GREEN FINAL interdit avant validation utilisateur.
