# Exploration — Mobile Landscape & Area Navigation UX v1 — Prévalidation R3

Date : 2026-10-07

## Origine

La preview R2 a été testée sur smartphone en paysage. Verdict utilisateur : **NEGATIF**.
La carte était visible mais les contrôles réservaient trop de hauteur et rendaient le plein écran inutile.

## TDD

- RED : `8d4278fa8b68583be4740d16d092a582f90d1ec3`
- CI RED : `37666647255` — FAILURE attendue
- correction : `55adc55c33b33ead1dc1ae9cdca9c8cc89811478`
- CI correction : `37666944802` — SUCCESS

## Correctif

Le mode focus devient réellement immersif :
- canvas = viewport du panneau ;
- navigation Area = overlay haut ;
- outils carte = overlay bas ;
- barre de preview secondaire masquée ;
- contexte compact ;
- peinture flottante repositionnée pour éviter le chevauchement.

## Autorités inchangées

- WorldDocument unique ;
- WorldArea unique ;
- Portal unique ;
- selectedAreaId UI éphémère seulement ;
- aucun changement Encounter/Combat ;
- aucun changement de schéma ;
- aucun changement dans Zombicide-40k.

## Révision publique

`mobile-landscape-area-navigation-ux-v1-r3`

## Gate manuel obligatoire

Le lot reste en prévalidation jusqu'à nouveau test smartphone paysage.
