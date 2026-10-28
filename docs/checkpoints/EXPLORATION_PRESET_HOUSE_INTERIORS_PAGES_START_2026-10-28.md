# START — Publication isolée des intérieurs de présets et passages gardés

Date : 2026-10-28.
Base publication : 909d8d9abf020ebe93c0cc1a967fcc580c95646b (workflow unique Pages, V80 immuable).
Checkpoint départ : checkpoint/exploration-start-preset-house-interiors-pages-2026-10-28.
Branche : work/exploration-preset-house-interiors-pages-2026-10-28.
Source gameplay : 13f6254e8825b33edda59e6ed6b5edc4c021e419 (PR #281).
Périmètre : épingler ce source uniquement sous /preview/encounters-v80 ; conserver V80 prod exact 933c852c41c4511cb0eed0717c246cc6b19aeddc et sources Combat/Capture immuables.
Checks requis avant merge : Core Node 880/880, npm check, Combat, Chromium mobile réel avec création et ouverture de maison préset et marche, comparaison byte-for-byte V80, HTTP Pages live.
URL cible : https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/preview/encounters-v80/world-assembler.html?v=world-prefab-homes-8
Attention : ne pas merger branche gameplay en prod, preview isolée seule ; anciens présets déjà instanciés restent intacts.
