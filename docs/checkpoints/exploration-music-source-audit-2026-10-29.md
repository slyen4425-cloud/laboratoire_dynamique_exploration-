# Exploration — musique et disponibilité des médias (29 octobre 2026)

## Sources vérifiées

Le dépôt privé `slyen4425-cloud/GenSrpG_audio_prive` possède les **quatre** fichiers d'auteur :
`audio/musiques/exploration/Exploration_1.mp3` à `Exploration_4.mp3`.
Ce dépôt n'est pas un CDN public. Les URL brutes GitHub privées, tokens,
liens `raw` ou chemins secrets ne doivent pas être inclus dans le PWA public.

Le dépôt Combat public livre **six Battle** et les SFX, mais **aucun des quatre
MP3 d'exploration**. Un catalogue avec IDs logiques sans binaires jouables
n'est pas un raccordement effectif.

## Comportement requis

- `🚶 Tester` : unique geste utilisateur autorisant le démarrage de la musique
  de l'aire, sans contrôle `Activer le son` additionnel ;
- quatre pistes `Exploration_1..4`, ordre aléatoire évitant deux titres identiques
  consécutifs, volume défini, boucle de playlist ;
- entrée combat : arrêt/pause d'Exploration avant démarrage de Battle par le
  propriétaire Combat ; retour validé : reprise de l'ambiance de l'aire ;
- quitter Tester / navigation : nettoyage de la voix musicale et des événements ;
- test Android réel : l'autoplay sans geste préalable n'est pas garanti ;
- distribution : copies explicitement autorisées sous un chemin public stable
  ou stockage local propriétaire approuvé par l'auteur. Ne jamais rendre
  publics les masters privés implicitement pour faire passer un test.

## État de ce lot

- Les correctifs audio Combat / images se valident dans un lot séparé, sans
  réintroduire de bouton artificiel ni inventer une autorité musique.
- Les quatre fichiers privés sont connus, mais le connecteur GitHub de la
  session ne fournit **aucun contenu binaire** utilisable à publier. Le
  raccordement audible Exploration ne peut pas être revendiqué GREEN avec
  seulement ce catalogue.
- Prérequis avant publication : livraison des quatre MP3 autorisés,
  résolveur et tests de lecture sur vrai site HTTPS, session musicale reliée
  au geste Tester, CI et checkpoint GREEN. La production V80 reste gelée.
