# Audit Capture — récompenses, XP, progression et capture v1

Date : 2026-10-04

## Objet

Auditer les règles Monster Capture historiques avant toute réécriture de la boucle :

```text
Combat Capture
 -> résultat public
 -> capture / récompenses / XP
 -> progression de la créature
 -> retour Exploration
 -> sauvegarde
```

Ce document est un audit. Il ne rend aucune ancienne formule obligatoire.

## Sources relues

### GenSrpG historique — dépôt principal gelé

Dépôt :
`slyen4425-cloud/Zombicide-40k`

Référence relue :
`main @ e8681f9823573ced8aec59c8ddc47a72b02bc663`

Le dépôt principal est **lecture seule pour ce chantier**.

### Labo Combat Capture

Dépôt :
`slyen4425-cloud/GenSrpg_labo_combat_dynamique`

Référence relue :
`preview/lab-player-party-recall-runtime-fix-v1-2026-10-03`

## Constat 1 — l'ancien Capture possédait déjà une progression XP

Formule historique de gain d'XP par ennemi vaincu :

```text
base = 10 + enemyLevel * 4
ratio = enemyLevel / allyLevel
difficulty = clamp(ratio, 0.18, 2.25)
trainerBonus = trainerBattle ? 1.20 : 1
xp = round(base * difficulty * trainerBonus)
```

Puis un multiplicateur global configurable était appliqué :

`xpMultiplier` — défaut historique : `1`.

### Courbe historique XP -> niveau

XP nécessaire au niveau suivant :

```text
35 + level * 18 + level² * 4
```

L'instance de créature conservait :
- level ;
- xp restant dans le niveau courant ;
- statPoints ;
- talentPoints ;
- statAlloc ;
- compétences connues / en attente ;
- évolution éventuelle.

### Règles historiques configurables

Le profil Capture exposait :
- `xpMultiplier` — défaut 1 ;
- `statCap` — défaut 300 ;
- `statPointsPerLevel` — défaut 5 ;
- `talentEvery` — défaut 5 niveaux ;
- `maxMoves` — défaut 4 ;
- `moveRelearn` — défaut `free`.

Ces valeurs étaient stockées comme données de configuration, pas comme état du combat.

## Constat 2 — le comportement XP historique doit être revalidé

L'ancien `captureAwardBattleXp` additionnait l'XP de tous les ennemis pour chaque créature alliée présente dans le roster du combat.

Ce comportement ne doit pas être recopié sans décision produit :
- XP complet pour chaque participant ;
- XP seulement pour les créatures réellement actives ;
- partage de l'XP ;
- bonus/malus de différence de niveau.

Le moteur futur doit rendre cette politique configurable.

## Constat 3 — le labo Combat actuel ne possède pas encore de vraie courbe XP

Le contrat actuel `capture-progression-rules-v1` du labo Combat couvre uniquement :
- nombre maximum de compétences actives ;
- déblocage des slots par niveau.

Valeurs actuelles :
- niveau 1 -> 2 slots ;
- niveau 10 -> 3 slots ;
- niveau 20 -> 4 slots.

Il n'existe pas encore dans ce contrat :
- formule de gain XP ;
- courbe XP -> niveau ;
- points de stats par niveau ;
- politique de distribution XP ;
- récompenses de combat.

Conclusion : **ne pas considérer le labo Combat actuel comme autorité XP complète**.

## Constat 4 — récompenses historiques

Après une victoire, l'ancien Capture pouvait produire :
- or ;
- un objet aléatoire.

Règles historiques :
- combat dresseur :
  - or basé sur le niveau moyen ennemi ;
  - objet : 25 % ;
- combat sauvage :
  - or : 45 % de chance ;
  - objet : 18 %.

Ces probabilités et formules étaient en grande partie codées en dur.

Décision d'architecture :
**ne pas recopier ces constantes dans le moteur**.
Elles deviennent des données éditables de règles/récompenses.

## Constat 5 — objets de capture historiques

Objets intégrés retrouvés :

| Objet | Niveau | Bonus capture | Prix historique |
| --- | ---: | ---: | ---: |
| Capsule simple | 1 | +0 % | 20 |
| Capsule renforcée | 2 | +10 % | 50 |
| Capsule avancée | 3 | +25 % | 100 |
| Capsule suprême | 4 | +50 % | 250 |

Ces valeurs sont des **presets historiques**, pas des constantes obligatoires.

## Constat 6 — deux formules de capture concurrentes existaient

### Formule générique historique

Elle utilisait :
- `creature.captureRate` ;
- pourcentage de PV restant ;
- `item.captureBonus` ;
- plafond final 95 %.

Bandes retrouvées :
- PV <= 30 % : +30 points ;
- PV <= 50 % : chance de base ×0,35 ;
- PV > 50 % : chance de base ×0,10.

### Formule utilisée dans l'ancien combat Capture

Une autre formule existait :
- `captureRate * 0,65` ;
- bonus progressif lié aux PV perdus ;
- bonus objet parfois déduit du **nom de l'objet**.

Cette divergence est une double autorité et ne doit pas être restaurée.

Décision :
**une seule Capture Rule Authority devra calculer la chance**, à partir de données explicites. Aucun sniff du nom d'un objet.

## Constat 7 — contrat de résultat déjà prévu

Exploration et Combat possèdent déjà `CaptureCombatResult v1` avec :
- `outcome` ;
- `partyState` ;
- `rewards[]` ;
- `capture` ;
- `worldEffects[]`.

Mais le bridge Combat actuel de la preview intégrée ne transmet à la fin que :
- `outcome`.

Les champs récompense/capture ne sont donc pas encore alimentés sur le vrai chemin.

## Ownership cible

### Capture possède
- collection / réserve / party ;
- instances de créatures ;
- XP / level ;
- points de stats ;
- évolution ;
- inventaire Capture ;
- objets de capture ;
- règle de capture ;
- tables de récompenses ;
- application des récompenses.

### Combat possède
- résolution du combat ;
- état combat temporaire ;
- événement de fin ;
- faits nécessaires au calcul du résultat.

### Exploration possède
- position monde ;
- rencontre consommée ;
- effets monde explicitement déclarés ;
- retour sur la carte.

Exploration **ne calcule jamais l'XP ni le loot**.

## Cible de refonte configurable

Le futur contrat de progression doit rendre éditables au minimum :

### XP de victoire
- activation XP ;
- base fixe ;
- coefficient du niveau ennemi ;
- prise en compte du niveau allié ;
- ratio minimum / maximum ;
- multiplicateur dresseur ;
- multiplicateur global ;
- politique de distribution :
  - chaque participant ;
  - actifs seulement ;
  - partagé ;
  - autre règle explicitement versionnée.

### Courbe de niveau
Deux formes acceptables à étudier :
- formule paramétrique ;
- table de seuils éditable.

La règle ne doit jamais être dispersée entre UI et runtime.

### Progression par niveau
- points de statistiques ;
- cadence de points de talent ;
- slots de compétences ;
- niveaux requis des compétences ;
- évolution.

### Loot
- activation ;
- monnaie ;
- formule ou table ;
- chance d'objet ;
- tables de loot ;
- quantité ;
- filtre par type de rencontre / niveau / famille / créature.

### Capture
- taux de base par créature ;
- modificateurs de PV ;
- bonus des objets ;
- plafond/plancher ;
- types de combat où la capture est autorisée ;
- consommation de l'objet ;
- destination équipe/réserve si équipe pleine.

## Décision pour le prochain lot fonctionnel

Ne pas implémenter l'XP dans Exploration.

Le prochain raccord fonctionnel devra d'abord fournir une **Capture Result Authority** côté Capture capable de produire/appliquer un résultat versionné, puis Exploration ne consommera que ce résultat public.

Le lot Rappel / Invocation reste gelé et n'est pas une dépendance de cet audit.
