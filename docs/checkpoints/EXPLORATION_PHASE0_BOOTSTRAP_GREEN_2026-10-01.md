# Checkpoint GREEN — Exploration Phase 0 Bootstrap

Date : 2026-10-01

## Branche source
`work/exploration-phase0-bootstrap-2026-10-01`

## Baseline initiale
`main` : `a911c54dab360d4b8a4738564e8a869c58dbda73`

## Périmètre validé
- mouvement continu en coordonnées monde X/Y ;
- aucune case comme autorité de déplacement ;
- normalisation diagonale ;
- collisions simples déterministes ;
- limites monde ;
- caméra de suivi ;
- stick tactile smartphone ;
- monde de démonstration plus grand que l'écran ;
- séparation core / collision / input / world / renderer DOM ;
- CI automatisée.

## Validation automatique
- tests core Node : GREEN ;
- vérification syntaxe JS : GREEN ;
- GitHub Actions CI : GREEN au dernier lot avant checkpoint.

## Validation utilisateur
Test smartphone réel le 2026-10-01 :
- stick tactile répond correctement ;
- déplacement validé ;
- comportement général validé par l'utilisateur : « Parfait, ça répond bien ».

## Preview
La publication GitHub Pages est gérée par l'infrastructure présente sur `main`.
Le code du prototype reste sur la branche de travail et n'est pas fusionné dans `main`.

## Régressions connues
Aucune régression bloquante connue à ce checkpoint.

## Étape suivante autorisée
Phase 1 — Exploration Core.

Objectifs :
- consolider les paramètres de déplacement ;
- accélération/freinage légers configurables ;
- préparer les couches monde/culling ;
- conserver X/Y comme autorité unique.
