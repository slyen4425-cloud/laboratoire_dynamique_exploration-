# LAB_CURRENT_WORK — Rencontres par famille de terrain (reprise V80)

Date : 2026-10-27
Branche : `work/exploration-v80-encounters-terrain-owner-20261027`
Base : `work/exploration-restart-from-v80-20261027`
Checkpoint : `checkpoint/exploration-start-v80-encounters-2026-10-27`.
Ce checkpoint a été créé après les premiers commits de travail mais référence bien la base V80 intacte. Il n'est pas présenté comme ayant précédé les modifications.
Dernier GREEN reconnu : V80 fonctionnelle par retour utilisateur ; CI du chantier en cours, pas de nouveau GREEN déclaré.

## Objectif et périmètre
Raccorder les rencontres de créatures aux familles de terrain canoniques, indépendamment des textures. Respecter la chaîne existante du moteur 2D et corriger le pinceau de la scène sculptée 2,5D sans créer de contrôleur bis. Les rencontres du laboratoire 2,5D ne sont pas encore branchées au déplacement réel : ce volet reste à réaliser via le contrat officiel, sans simuler un deuxième moteur.

## Responsabilités et autorité
- `WorldSurface` possède la famille `terrainFamilyId` ainsi que les tracés. `materialId` ne commande jamais les rencontres.
- `Encounter Controller` existant possède la cadence, l'état de rencontre et le verrou. Le `Terrain Family Encounter Resolver` lit le catalogue Capture et sa `spawnChance` : aucun clone.
- `Encounter Bridge` possède le contrat avec Combat Capture.
- `sculpt-surface-paint` et son UI éditent directement `WorldSurface` ; ils ne possèdent aucune règle indépendante. `sculpt-scene-preview` exporte/importe ces mêmes données.
- Le moteur de mouvement et Collision World restent propriétaires des positions et obstacles. Aucun renderer ne peut lancer une rencontre.

## Mesures réalisées
Suppression du sélecteur doublon créé au début de ce lot. Rejet des rencontres sur Area périmée et famille manquante. Séparation famille/texture du pinceau 2,5D. Correction de sauvegarde pour la famille du sol de base même sans tracés. Tests RED puis correctifs de cause racine. Correction de la sentinelle V80 des 20 véritables portes PNG (ancien test V79 n'en reconnaissait que 4 WebP).

## Tests requis et état
- `npm test` et `npm run check` sur la tête exacte.
- CI Chromium : Builder, scène sculptée, vrai geste de peinture, export/import et retour moteur de rencontre.
- Prévisualisation smartphone paysage et parcours de combat validés avant GREEN.
- Une CI antérieure `bb612163` a réussi mais elle précède le raccord du pinceau ; elle ne vaut pas validation finale.
- État actuel : NON GREEN, PR #256 brouillon, aucun merge ni publication.

## Risques et suite
Vérifier que les pages V80 gelées chargent encore le script partagé. Ne pas changer la V80 publiée. Diagnostiquer toutes les erreurs CI de la tête, puis raccorder le contrat de déplacement 2,5D vers Encounter Controller seulement une fois la source de configuration de rencontres identifiée, sans double autorité.
