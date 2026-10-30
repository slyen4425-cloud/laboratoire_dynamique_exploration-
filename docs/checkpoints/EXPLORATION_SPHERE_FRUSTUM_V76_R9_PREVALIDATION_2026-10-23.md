# Exploration — V76 R9 : profils coniques, plateau 100 % et exclusion visuelle de la marche (23 octobre 2026)

## Décision et retour utilisateur
Après test de V76 R8, le créateur constate trois défauts :
1. Le joueur paraît marcher sur la texture du dessus de la colline, alors qu'il est censé rester **en bas** : la collision historique ne couvrait que le cercle physique au sol, pas la partie supérieure projetée vers le nord.
2. Avec un plateau, la forme doit avoir **un pied arrondi en demi-cercle apparent et des flancs coniques montant vers le sommet**, plutôt qu'un second disque sphérique indépendant ; une vraie sphère sans sommet reste acceptée.
3. Largeur du sommet réglable **jusqu'à 100 %** pour obtenir une colonne / hauteur ronde à face supérieure entièrement plane, sans bosse.

**R8 est NON GREEN utilisateur. R9 NON GREEN Pixel tant que le créateur ne valide pas visuellement.**

## Gouvernance
- Dernier GREEN utilisateur : V75 R2 `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`.
- Base de travail R8 (Pages public) : `356bdfb83b19fa10ee4f06db3612fe0f036cbeab`.
- START checkpoint : `checkpoint/exploration-start-sphere-frustum-v76-r9-2026-10-23`.
- Unique branche : `work/exploration-sphere-frustum-v76-r9-2026-10-23`.
- **Un propriétaire** : World Model calcule les élévations; Exploration Renderer se contente de projeter; Collision World protège les positions au sol dans les volumes hauts; Input/UI édite `summitRatio` (sans recalcul parallèle de la physique). Aucun changement dans `main` hors PR infra Pages, aucun duplicat de moteur, aucune rustine timer, aucun contournement du test.
- Pentes marchables V77 et escaliers V78 toujours gelés. R9 corrige seulement le passage impossible du joueur SUR une élévation pendant qu'il marche réellement au niveau bas. L'accès en pente ne devient pas implicitement autorisé.

## Changement de profil canonique
- `summitRatio=0` : ancienne sphère pure (précédentes sauvegardes compatibles).
- `0<summitRatio<1` : cap plat à hauteur `h` jusqu'au rayon intérieur `r⋅summitRatio`, puis pente **linéaire** jusqu'au cercle au sol de rayon `r` : tronc de cône à pied circulaire, pas de seconde sphère.
- `summitRatio=1` : plateau rond intégral, paroi verticale sur le périmètre exact ; adapter de rendu ajoute une fine bague intérieure (0,1 % du rayon), sans modifier la hauteur physique.
- Même calcul World Model pour trous (en négatif), limites de validité `[0,1]`, import/export JSON et annulation inchangés. L'interface en plein écran offre bien 0–100 %.

## Passage à pied / visuel
- Le blocage physique historique `sculptSphereAt` reste géré par Collision World. Ajout de `sculptSphereProjectionBlock` dans le MÊME module de Collision World.
- La zone interdite de projection est échantillonnée **directement dans `sculptSphereDisplacementAt`**, à x physique du personnage et après décalage vertical de l'élévation : elle n'est ni tracée à partir de pixels/alpha ni sauvegardée comme collision secondaire.
- Un personnage au sol derrière la face nord d'une colline ne peut plus traverser sa surface supérieure visuellement projetée ; retraite vers le nord ou latéralement vers l'extérieur permise pour les positions héritées coincées. Vol et ponts gardent leurs exceptions. Spawn du mode Tester n'est pas placé sous la projection des collines.
- Coût de calcul limité au voisinage du cercle et à 19 échantillons par profil proche ; renderer conserve le cache R5 et les 36 secteurs × 10 bandes.

## Gel
- Assets et textures HD V49 / grass / forest floor, ponts V74 (28 WebP), cascades V3 (20 WebP), lumière R7, guide R6 et ombre arrière, navigation V75 autres falaises, caméra, sauvegardes existantes, builder et combat.
- Aucun nouveau module autonome, collision calculée depuis le World Model seulement.

## Gates
1. Node : legacy sphère exacte, pente conique réelle, plateau vertical 100 %, import/export, collision projetée avec marche/mouvement réel, retraite, vol et itinéraires plats.
2. Chromium : max slider 100 %, label 100 %, forme JSON rechargée, hauteur jusqu'au bord intérieur puis niveau 0 exactement au bord extérieur, exclusion au sol sous l'élévation ; smokes Sculpt, Builder, Combat complets.
3. Vérifier SHA final, CI verte et fichiers modifiés confinés à model/rendu/Collision World/UI/tests/docs, aucun asset ou capacité connexe modifiée.
4. PR infrastructure distincte pour épingler sur Pages le SHA immuable. Pas de merge de code métier sur main. **GREEN seulement après validation visuelle et navigation sur smartphone par le créateur.**
