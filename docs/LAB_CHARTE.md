# LAB_CHARTE — GenSrpG Exploration

## 1. Mission
Créer et valider le moteur d'exploration libre de GenSrpG, d'abord pour Capture Monster, sans dépendre du moteur Dungeon ni du laboratoire Combat Dynamique.

## 2. Isolation stricte
- Ne jamais développer directement sur `main` après l'initialisation.
- 1 lot = 1 branche de travail.
- Ne jamais modifier le dépôt principal GenSrpG depuis ce laboratoire.
- Ne jamais modifier le laboratoire Combat Dynamique depuis ce laboratoire.
- Les raccords inter-dépôts sont documentés avant intégration.

## 3. Gouvernance
Chaque lot doit avoir :
1. un état de départ identifié ;
2. un périmètre déclaré dans `LAB_CURRENT_WORK.md` ;
3. des critères de validation ;
4. des tests ;
5. un checkpoint GREEN avant le lot suivant.

## 4. Principes techniques
- Déplacement continu en coordonnées monde X/Y.
- Aucune grille imposée au joueur.
- Une grille logique ou des cellules de génération peuvent exister en interne.
- Collision déterministe, sans timers globaux de réparation.
- Caméra séparée du modèle de déplacement.
- Carte et monde sérialisables par données.
- Générateur déterministe avec seed.
- Priorité smartphone/PWA et performance stable.

## 5. Interdictions
- Pas de rustine globale.
- Pas de double autorité de position.
- Pas de logique de collision dupliquée.
- Pas de dépendance directe au DOM dans le cœur du moteur.
- Pas de fusion vers un autre dépôt sans validation explicite.
