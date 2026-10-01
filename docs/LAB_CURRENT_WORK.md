# LAB_CURRENT_WORK

Date d'ouverture : 2026-10-01

## Lot actif
Phase 0 — Bootstrap / socle mouvement fluide.

## Branche de travail
`work/exploration-phase0-bootstrap-2026-10-01`

## Baseline
`main` initial au SHA `a911c54dab360d4b8a4738564e8a869c58dbda73`.

## Objectif
Valider un prototype autonome avec :
- déplacement continu ;
- caméra de suivi ;
- collisions avec obstacles ;
- monde plus grand que l'écran ;
- contrôles tactiles smartphone ;
- aucune case visible.

## Hors périmètre
- génération procédurale complète ;
- IA créatures ;
- combat ;
- raccord au dépôt principal ;
- raccord au laboratoire Combat Dynamique.

## Validation Phase 0
- déplacement 360° : GREEN ;
- stick tactile smartphone : GREEN ;
- diagonales normalisées : GREEN ;
- collisions : GREEN ;
- caméra : GREEN ;
- absence de freeze signalé au test mobile : GREEN ;
- tests core automatisés : GREEN ;
- CI GitHub : GREEN ;
- preview GitHub Pages : GREEN.

## Retour utilisateur
2026-10-01 — test smartphone validé : « Parfait, ça répond bien ».

## État
Phase 0 prête pour checkpoint GREEN.

## Étape suivante autorisée
Phase 1 — Exploration Core :
- consolider le modèle mouvement ;
- ajouter accélération/freinage léger configurables ;
- préparer couches monde/culling sans modifier l'autorité X/Y.
