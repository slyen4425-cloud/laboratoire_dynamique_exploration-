# Exploration V76 R11 — Collision légère, herbe plus claire en hauteur et bordures plus profondes

Date : 23/10/2026 — **PRÉVALIDATION, NON GREEN Pixel**

## Retour utilisateur et portée

Après V76 R10, le créateur confirme une nette amélioration mais demande trois finitions : (1) léger ajustement de collision devant le relief, (2) assombrissement plus fort et progressif du pourtour, (3) herbe du haut éclaircie pour mieux distinguer les niveaux. La création des **très petits sommets reste volontairement hors périmètre** : le créateur souhaite la peaufiner ultérieurement, sans rallonger indéfiniment V76.

## Référence charte et branches

- Dernier GREEN confirmé par le créateur : V75 R2 `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`. La V76 R10 n'est pas validée GREEN.
- SHA de base V76 R10 publiée : `0a568f9a6f1483069a21bbe8607d365c20f52958`.
- Checkpoint START immuable : `checkpoint/exploration-start-sphere-depth-v76-r11-2026-10-23`.
- Branche unique de travail : `work/exploration-sphere-depth-v76-r11-2026-10-23`.
- Le World Model reste seul propriétaire des hauteurs et des rayons ; Collision World de la collision ; Renderer des lumières ; Material Registry/Asset Adapter des matériaux. Pas de second système, de rustine CSS, de mutation de l'éditeur dans le runtime.

## Travail réalisé et choix techniques

1. **Collision World** : le blocage du sommet projeté dispose désormais d'une marge de sécurité **limitée à 4 unités monde et à 60 % du rayon de l'acteur**. Le profil reste échantillonné dans `sculptSphereDisplacementAt`, sans recourir aux pixels, sans agrandir le relief dans le World Model. Les exceptions vol/pont restent protégées par la porte canonique et la retraite depuis une position déjà en conflit reste possible.
2. **Renderer sphérique** : pour les collines avec plateau, appliquer **une seule passe lumineuse** sur l'herbe haute, d'intensité .09 à .22 selon la hauteur 1–7 ; le motif de gazon du registre reste inchangé. Le rebord herbeux utilise un **dégradé radial** qui assombrit de façon douce la périphérie du disque sans cercle dur ni disque secondaire. Ajouter une seule passe progressive d'ombre de contact au pied du cône afin de mieux détacher le volume. Les contours communs sommet/roche R8/R10 restent identiques.
3. **Cache téléphone** : incrémenter uniquement les URLs des modules de collision, du renderer et du script d'entrée, pour garantir le chargement des correctifs sur GitHub Pages sans migration de données.
4. **Performances** : au maximum 9 remplissages Canvas par relief conique, gradient créé une fois par relief. Cache raster/maillage R5 préservé ; pas de rebouclage permanent.
5. **Gels stricts** : World Model et JSON, taille/forme des petites colonnes, V75, ponts V74, 20 cascades V3, eau/nage/vol, caméra, Builder/Combat ; V77 pentes et V78 escaliers toujours gelés.

## Critères de sortie

- Tests Node : luminosité de l'herbe sur 1/3/7 niveaux, ombre radiale bornée sur la périphérie et aucun trait noir, nombre de passes limité, marge de collision faible et aucun blocage latéral/fly.
- Chromium réel : mesurer les pixels RGB au centre des sommets à +1 / +3 / +7 (luminance croissante), et rejouer Sculpt/Builder/Combat, l'export et les tests de cache précédents.
- CI sur SHA **final**, diff R10→R11 limité à Collision World, Renderer, imports de cache, tests et docs ; aucune modification d'asset/World Model.
- Pages via PR **uniquement infrastructure de version épinglée** sur main, jamais merge métier. Checkpoint de prévalidation avant publication ; **GREEN final requiert essai visuel sur Pixel**.
