export const traversalRulePackV1 = Object.freeze({
  schemaVersion: 1,
  id: 'exploration-surface-traversal-v1',
  rules: Object.freeze([
    Object.freeze({
      id: 'terrain.ground',
      modes: Object.freeze({
        ground: 1,
        fly: 1
      })
    }),
    Object.freeze({
      id: 'terrain.road',
      modes: Object.freeze({
        ground: 1.25,
        fly: 1
      })
    }),
    Object.freeze({
      id: 'terrain.water',
      modes: Object.freeze({
        swim: 0.75,
        fly: 1
      })
    }),
    Object.freeze({
      id: 'terrain.bridge',
      modes: Object.freeze({
        ground: 1,
        fly: 1
      })
    })
  ])
});
