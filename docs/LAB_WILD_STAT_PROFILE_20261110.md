# 2026-11-10 — WorldArea wild NPC stat profile

Checkpoint START: checkpoint/exploration-wild-stat-profile-start-2026-11-10.
One authoring source: `WorldDocument.areas[].encounters.wildStatProfile`. World Builder exposes pointsPerLevel, guaranteed minimum HP/defense/speed percentages, and elemental-specialty multiplier. Optional field leaves all older WorldAreas unchanged.
EncounterController -> CaptureEncounterSnapshot v1 -> CombatHandoff v1 -> Exploration native bridge carry the strictly validated profile. Only explicit author level activates wild NPC growth; otherwise historical Tester's behavior remains.
Combat main is the exclusive stat calculation/effects authority. No alternate stat engine, edited species, player wallet or game saves. Rollout is dependent on Combat PR #287 GREEN and the canonical packaged Combat main being refreshed.
