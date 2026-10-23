# Exploration V76 R4 — prévalidation textures, plein écran et guide (23/10/2026)

## Retour Pixel et gate
Après V76 R3, capture utilisateur : atlas roche en mosaïque carrée; commandes largeur sommet + matériau absentes du panneau flottant repliable en plein écran; aucun guide avant édition précise mais cercle noir toujours peint sur le relief. **V76 R3 REJETÉE**, pas de GREEN Pixel V76. V77 et V78 gelées.

## Charte et source
- Dernier GREEN utilisateur : V75 R2, SHA `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`.
- Source V76 R3 incluant cascades V3, ponts V74, collisions V75 et volume V76 : `94d2ffca9a8340f20720f7f7b90e41974143f07e`.
- Checkpoint START immuable : `checkpoint/exploration-start-sphere-visual-v76-r4-2026-10-23`.
- Une branche travail : `work/exploration-sphere-visual-v76-r4-2026-10-23`. Pas de merge moteur dans main.

## Changements du lot
1. Renderer `src/render/sculpt-sphere-mesh.js` : abandon du motif atlas rock posé sur chaque quad et des fragments rectangulaires; matériau roche/terre/herbe en dégradés de couleur CONTINUS en coordonnées monde et ombre directionnelle partagée, projection et profondeur identiques à World Model. Aucun cercle de bord noir permanent; seulement une ombre de contact (colline), cavité toujours découpée à son vrai rayon. Les falaises historiques peuvent toujours utiliser l'atlas sous leur propriétaire.
2. Un seul jeu de réglages `sphere-summit-ratio` + `sphere-wall-material`, déplacé dans la barre rapide existante `sculpt-quickbar`, laquelle flotte et peut être repliée en mode immersif. Aucun contrôle ni état cloné.
3. Guide de placement en surimpression uniquement : cercle clair pointillé visible avant l'application (même si option générique aperçu désactivée), rayon de sommet intérieur indiqué quand non nul; sur mobile en placement précis, première empreinte centrée prête à ajuster. Après application, guide masqué; le prochain toucher ou nudge le réactive. Aucun trait ajouté dans l'état terrain.

## Autorités et gel
- Géométrie persistante propriétaire : `sculpt-height-model`, inchangée (plateaux + profil sphérique).
- Collisions propriété de Collision World, **inchangées**. Les petits reliefs marchables seront traités dans V77 uniquement après GREEN R4.
- Vol/nage, V75 falaises, ponts, cascades, caméra, Builder/Combat et historiques JSON : inchangés.
- Avant publication : tests Node, Chromium réel (cercle avant/après, placement précis, panneau plein écran ouvert/fermé, matière/rayon), CI finale sur SHA exact, comparaison aucun asset modifié, prévisualisation Pages par PR infra séparée.

**NON GREEN créateur jusqu'à test visuel Pixel.**
