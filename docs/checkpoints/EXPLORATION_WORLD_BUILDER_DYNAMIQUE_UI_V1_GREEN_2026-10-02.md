# Checkpoint GREEN — World Builder Dynamique UI v1

Date : 2026-10-02

## Branche source
`work/exploration-world-builder-dynamique-ui-v1-2026-10-02`

## Checkpoint de départ
`checkpoint/exploration-start-world-builder-dynamique-ui-v1-2026-10-02`

## Base GREEN
`745b13bd550893b5ae21c351fa1f511acb2bdc16`

## SHA technique validé avant documentation de fermeture
`8f6700d182aecb65a81b7b2dcba55e0baa44fb16`

## Preview validée
- main : `ee116709d49fc85281e49a5402fd0096fccd6ede`
- Pages run : `37041673850` — SUCCESS
- artifact : `11242812433`

## Validation utilisateur
Smartphone : **GREEN** le 2026-10-02.

Validé notamment :
- manipulation directe WorldObjects ;
- gizmos scale/rotation ;
- resize WorldArea ;
- peinture terrain ;
- routes/rivières canoniques ;
- largeurs pinceaux ;
- import/export WorldDocument ;
- handoff Builder -> runtime -> Builder sans perte ;
- Spawn de retour Building ancré dynamiquement ;
- pinch zoom tactile ;
- rivière dessinée bloquante depuis `WorldArea.surface.rivers[]` ;
- pont traversable via référence à la feature rivière canonique ;
- aucune géométrie collision rivière dupliquée.

## Autorités protégées
- Builder -> Draft Model -> normalizeWorldDocument -> WorldDocument ;
- World Surface Model possède routes/rivières/zones ;
- Collision World consomme la géométrie canonique ;
- Renderer reste lecture seule ;
- Portal reste l'unique autorité des liens entre Areas ;
- aucune structure BuilderMap/PreviewWorld concurrente.

## Suite autorisée
Ouvrir un nouveau lot depuis ce checkpoint GREEN exact :
**Map Actor Editor v1**.

Le lot suivant doit réutiliser :
- Map Actor Visual System v1 GREEN ;
- WorldDocument / WorldArea existants ;
- World Builder Draft Model ;
- renderers existants.

Il ne doit pas recréer de position, collision, stats, IA ou moteur visuel concurrent.
