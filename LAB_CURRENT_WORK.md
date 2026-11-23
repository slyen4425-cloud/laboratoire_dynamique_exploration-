# Lot en cours — Escaliers de profil nettoyés (#525)

- **Base exacte de `main` :** `57ca20e6647cc49ad16fdd8f02c88f8aca3ebe1a`
- **Périmètre de ce lot :** raccorder la variante d'asset déjà enregistrée `side_alt` au profil physique de traversée `side` du même escalier (Terre / Rondins).
- **Propriétaire unique :** `src/core/sculpt-stair-traversal.js` (couloir utilisé par Collision World et par la projection visuelle).
- **Édition des objets et sauvegardes :** aucune réécriture d'ID, de WorldDocument, de paramètres de carte, de positions de héros, de PWA ni de moteur Combat.
- **Profil adopté :** `side_alt` hérite exactement du couloir de la vue `side` déjà certifiée, sans analyse alpha, aucune nouvelle géométrie indépendante. Orientation, miroir et échelle restent déterminés par les transformations originales.
- **Tests :** `tests/sculpt-perspective-stairs-foret01-20261119.test.js` étendu à `side_alt` pour direction, pied/sommet, visualisation, miroir, montée/descente via `stepMovement` sur falaise 2→8 et blocage adjacent. CI complète requise.
- **Fonctions gelées :** vue de face V78, variantes originales, collisions de l'eau, ponts, entrées/sorties, navigation multijoueur.
- **Reste du ticket #525 :** édition facultative du couloir pied→sommet par l'auteur + validation visuelle mobile et plusieurs niveaux : **non livrées par ce lot**. Ne pas clôturer #525.
- **Publication :** branch + PR + CI SHA exacte + checkpoint `main` puis laboratoire. Publication GenSRPG/PWA dans un lot distinct après validation.
