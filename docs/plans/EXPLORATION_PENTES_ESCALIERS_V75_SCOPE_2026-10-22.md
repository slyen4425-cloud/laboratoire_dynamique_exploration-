# Prochain lot distinct V75 — Pentes et escaliers 2,5D

**Décision utilisateur du 22 octobre 2026 :** les passages des ponts sont validés ; une fois le nettoyage d'assets V74 terminé, développer des **pentes de terrain** et la **pose d'escaliers** afin de rejoindre naturellement un niveau supérieur, même lorsque les falaises adjacentes demeurent infranchissables.

## Audit avant lot

- Le relief sculpt actuel stocke des niveaux **entiers 0 à 7** dans `src/world/sculpt-height-model.js` ; le rendu des parois lit ce même modèle. Le lissage actuel est surtout **visuel** et ne crée pas automatiquement de traversée physiquement inclinée.
- La navigation Sculpt lit `sculptNavigationSample()` et refuse toute variation de niveaux dépassant `maxStepUp/maxStepDown` ; c'est Collision World qui décide via le même propriétaire `sculptNavigationRoute()`, non le Renderer.
- **Trois modèles d'escaliers existent déjà** dans `src/objects/object-definition-catalog.js` : `stairs.stone.simple`, `stairs.wood.porch`, `stairs.stone.grand`, avec leurs références visuelles. Ils ne sont pas actuellement placables par la palette Sculpt (`validKinds` ne contient pas `stairs`) et n'ont pas de contrat de montée physique déclaré.
- Le pont V69 a déjà prouvé la séparation des couches (au-dessus/en-dessous), mais la pente n'est PAS un pont flottant : elle doit rester raccordée à deux vraies altitudes du terrain.

## Objectif du lot V75 (à ouvrir séparément après V74)

1. **Outil Pente** dans Terre : définir le pied (niveau bas), le sommet (niveau haut), l'orientation, la largeur et la longueur ; créer une transition progressive, traversable sans saut ni blocage, avec raccord au terrain sur les deux bords.
2. **Outil Escalier** dans Objets : rendre les trois assets existants sélectionnables, rotatifs et redimensionnables ; connecter le bas et le haut à deux niveaux réels, et exposer cette élévation de façon contrôlée au système de navigation.
3. **Même autorité** World/Collision : la donnée sérialisée du relief/objet décrit les deux niveaux et le corridor, puis Collision World calcule une altitude effective progressive le long de cet axe. L'adaptateur de rendu suit l'altitude déjà autorisée (pas de téléportation verticale). Un objet décoratif placé ailleurs ne doit jamais rendre une falaise franchissable.
4. **Règles configurables :** différence maximale de niveaux admissible, pente maximale, sens des escaliers, largeur, liaison aux vrais pieds/sommets, marche sur l'ouvrage, connexion aux plateaux.
5. **Tests réels obligatoires :** montée/descente bas→haut et haut→bas, déplacement latéral bloqué hors raccord, escaliers mal placés non franchissables, diagonales, collisions lorsque la caméra passe de 35° à 90°, petit/grand héros, natation/falaise, tactile Pixel, export/import, undo, absence de régression sur les ponts V73 et les anciens niveaux.

## Gouvernance

- **V75 ne démarre qu'après la prévalidation de V74 et son checkpoint.**
- Créer son propre checkpoint START, sa branche `work/`, mettre à jour `LAB_CURRENT_WORK` avant de modifier le moteur.
- Examiner WorldDocument/WorldObject, le contrat des escaliers existants et la politique de migration avant de choisir l'endroit où stocker les pentes.
- Ne pas « résoudre » la montée en passant `maxStepUp` à 7 globalement : cela rendrait toutes les falaises franchissables et casserait les jeux existants.
- GREEN = CI complète + vérification smartphone, montée et descente en conditions réelles.
