import {
  resolveObjectLibraryFolder
} from './object-library-taxonomy.js?rev=collision-boundary-worldobject-obstacles-v1';

export const OBJECT_DEFINITION_SCHEMA_VERSION = 1;

function frozen(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  for (const child of Object.values(value)) {
    frozen(child);
  }

  return Object.freeze(value);
}

function libraryMetadataForDefinition(definition) {
  const explicit = definition?.library;
  if (
    explicit?.categoryId &&
    explicit?.folderId
  ) {
    return Object.freeze({
      ...explicit
    });
  }

  const id = String(definition?.id ?? '');
  let folderId = 'decor/general';

  if (definition?.kind === 'bridge') {
    folderId = 'bridges/general';
  } else if (definition?.kind === 'building') {
    folderId = id.includes('.inn.')
      ? 'buildings/inns/temperate'
      : 'buildings/houses/temperate';
  } else if (definition?.kind === 'tree') {
    folderId = 'vegetation/trees';
  } else if (definition?.kind === 'rock') {
    folderId = 'rocks/general';
  } else if (definition?.kind === 'door') {
    folderId = 'doors/general';
  } else if (definition?.kind === 'stairs') {
    folderId = 'stairs/general';
  }

  const folder =
    resolveObjectLibraryFolder(folderId);

  return Object.freeze({
    categoryId:
      folder?.categoryId ?? 'decor',
    folderId,
    folderLabel:
      folder?.label ?? folderId,
    provenance: 'native'
  });
}

function normalizeDefinition(definition) {
  if (!definition || typeof definition !== 'object') {
    return definition;
  }

  return {
    ...definition,
    library:
      libraryMetadataForDefinition(definition)
  };
}

// V71: the authentic 2.5D bridge has raised border rails on BOTH sides.
// Only the centered 35% of its short dimension is walkable; the actor's full
// collision radius must fit inside that strip. Outside it, the existing
// Collision World bridge-edge gate blocks lateral moves as a solid rail.
// No independent rail obstacle/alpha collider: one authored WorldObject truth.
// Preserve full length, variant rotation, scale and historical bridge styles.
const DEFINITIONS = frozen([
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.waterfall.front_wide.01',
    label: '2,5D · Cascade animée · Large de face',
    kind: 'decor',
    library: { categoryId: 'decor', folderId: 'decor/general', provenance: 'native' },
    visual: {
      assetId: 'object.waterfall.front_wide.forest_stream.flow.01',
      defaultVariantId: 'forest_stream',
      variants: [
        { id: 'forest_stream', label: 'Ruisseau', assetId: 'object.waterfall.front_wide.forest_stream.flow.01' },
        { id: 'clear_blue', label: 'Bleu clair', assetId: 'object.waterfall.front_wide.clear_blue.flow.01' },
        { id: 'turquoise', label: 'Turquoise', assetId: 'object.waterfall.front_wide.turquoise.flow.01' },
        { id: 'canyon_turquoise', label: 'Canyon', assetId: 'object.waterfall.front_wide.canyon_turquoise.flow.01' },
        { id: 'swamp', label: 'Marais', assetId: 'object.waterfall.front_wide.swamp.flow.01' }
      ]
    },
    baseSize: { width: 260, height: 350 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.waterfall.side_narrow.01',
    label: '2,5D · Cascade animée · Étroite de côté',
    kind: 'decor',
    library: { categoryId: 'decor', folderId: 'decor/general', provenance: 'native' },
    visual: {
      assetId: 'object.waterfall.side_narrow.forest_stream.flow.01',
      defaultVariantId: 'forest_stream',
      variants: [
        { id: 'forest_stream', label: 'Ruisseau', assetId: 'object.waterfall.side_narrow.forest_stream.flow.01' },
        { id: 'clear_blue', label: 'Bleu clair', assetId: 'object.waterfall.side_narrow.clear_blue.flow.01' },
        { id: 'turquoise', label: 'Turquoise', assetId: 'object.waterfall.side_narrow.turquoise.flow.01' },
        { id: 'canyon_turquoise', label: 'Canyon', assetId: 'object.waterfall.side_narrow.canyon_turquoise.flow.01' },
        { id: 'swamp', label: 'Marais', assetId: 'object.waterfall.side_narrow.swamp.flow.01' }
      ]
    },
    baseSize: { width: 170, height: 355 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.waterfall.three_quarter.01',
    label: '2,5D · Cascade animée · Trois-quarts',
    kind: 'decor',
    library: { categoryId: 'decor', folderId: 'decor/general', provenance: 'native' },
    visual: {
      assetId: 'object.waterfall.three_quarter.forest_stream.flow.01',
      defaultVariantId: 'forest_stream',
      variants: [
        { id: 'forest_stream', label: 'Ruisseau', assetId: 'object.waterfall.three_quarter.forest_stream.flow.01' },
        { id: 'clear_blue', label: 'Bleu clair', assetId: 'object.waterfall.three_quarter.clear_blue.flow.01' },
        { id: 'turquoise', label: 'Turquoise', assetId: 'object.waterfall.three_quarter.turquoise.flow.01' },
        { id: 'canyon_turquoise', label: 'Canyon', assetId: 'object.waterfall.three_quarter.canyon_turquoise.flow.01' },
        { id: 'swamp', label: 'Marais', assetId: 'object.waterfall.three_quarter.swamp.flow.01' }
      ]
    },
    baseSize: { width: 280, height: 340 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.waterfall.tiered.01',
    label: '2,5D · Cascade animée · Paliers',
    kind: 'decor',
    library: { categoryId: 'decor', folderId: 'decor/general', provenance: 'native' },
    visual: {
      assetId: 'object.waterfall.tiered.forest_stream.flow.01',
      defaultVariantId: 'forest_stream',
      variants: [
        { id: 'forest_stream', label: 'Ruisseau', assetId: 'object.waterfall.tiered.forest_stream.flow.01' },
        { id: 'clear_blue', label: 'Bleu clair', assetId: 'object.waterfall.tiered.clear_blue.flow.01' },
        { id: 'turquoise', label: 'Turquoise', assetId: 'object.waterfall.tiered.turquoise.flow.01' },
        { id: 'canyon_turquoise', label: 'Canyon', assetId: 'object.waterfall.tiered.canyon_turquoise.flow.01' },
        { id: 'swamp', label: 'Marais', assetId: 'object.waterfall.tiered.swamp.flow.01' }
      ]
    },
    baseSize: { width: 310, height: 340 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.wood_rustic_2p5d.01',
    label: 'Pont en bois rustique 2,5D',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.wood_rustic_2p5d.horizontal.01',
      defaultVariantId: 'horizontal',
      variants: [
        { id: 'horizontal', label: 'Horizontal', assetId: 'object.bridge.wood_rustic_2p5d.horizontal.01' },
        { id: 'vertical', label: 'Vertical', assetId: 'object.bridge.wood_rustic_2p5d.vertical.01' },
        { id: 'diagonal_left', label: 'Diagonale gauche', assetId: 'object.bridge.wood_rustic_2p5d.diagonal_left.01' },
        { id: 'diagonal_right', label: 'Diagonale droite', assetId: 'object.bridge.wood_rustic_2p5d.diagonal_right.01' }
      ]
    },
    baseSize: { length: 170, width: 96 },
    traversal: { enabled: true, lengthRatio: 0.92, widthRatio: 0.35, edgeAssistRatio: 0.15, traversalRuleId: 'terrain.bridge',
      viewAxesDeg: { horizontal: 0, vertical: 90, diagonal_left: -45, diagonal_right: 45 } }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.stone_arch_2p5d.01',
    label: 'Pont en pierre voûté 2,5D',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.stone_arch_2p5d.horizontal.01',
      defaultVariantId: 'horizontal',
      variants: [
        { id: 'horizontal', label: 'Horizontal', assetId: 'object.bridge.stone_arch_2p5d.horizontal.01' },
        { id: 'vertical', label: 'Vertical', assetId: 'object.bridge.stone_arch_2p5d.vertical.01' },
        { id: 'diagonal_left', label: 'Diagonale gauche', assetId: 'object.bridge.stone_arch_2p5d.diagonal_left.01' },
        { id: 'diagonal_right', label: 'Diagonale droite', assetId: 'object.bridge.stone_arch_2p5d.diagonal_right.01' }
      ]
    },
    baseSize: { length: 170, width: 96 },
    traversal: { enabled: true, lengthRatio: 0.92, widthRatio: 0.35, edgeAssistRatio: 0.15, traversalRuleId: 'terrain.bridge',
      viewAxesDeg: { horizontal: 0, vertical: 90, diagonal_left: -45, diagonal_right: 45 } }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.old_wood_2p5d.01',
    label: 'Vieux pont en bois 2,5D',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.old_wood_2p5d.horizontal.01',
      defaultVariantId: 'horizontal',
      variants: [
        { id: 'horizontal', label: 'Horizontal', assetId: 'object.bridge.old_wood_2p5d.horizontal.01' },
        { id: 'vertical', label: 'Vertical', assetId: 'object.bridge.old_wood_2p5d.vertical.01' },
        { id: 'diagonal_left', label: 'Diagonale gauche', assetId: 'object.bridge.old_wood_2p5d.diagonal_left.01' },
        { id: 'diagonal_right', label: 'Diagonale droite', assetId: 'object.bridge.old_wood_2p5d.diagonal_right.01' }
      ]
    },
    baseSize: { length: 170, width: 96 },
    traversal: { enabled: true, lengthRatio: 0.92, widthRatio: 0.35, edgeAssistRatio: 0.15, traversalRuleId: 'terrain.bridge',
      viewAxesDeg: { horizontal: 0, vertical: 90, diagonal_left: -45, diagonal_right: 45 } }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.elegant_2p5d.01',
    label: 'Pont élégant 2,5D',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.elegant_2p5d.horizontal.01',
      defaultVariantId: 'horizontal',
      variants: [
        { id: 'horizontal', label: 'Horizontal', assetId: 'object.bridge.elegant_2p5d.horizontal.01' },
        { id: 'vertical', label: 'Vertical', assetId: 'object.bridge.elegant_2p5d.vertical.01' },
        { id: 'diagonal_left', label: 'Diagonale gauche', assetId: 'object.bridge.elegant_2p5d.diagonal_left.01' },
        { id: 'diagonal_right', label: 'Diagonale droite', assetId: 'object.bridge.elegant_2p5d.diagonal_right.01' }
      ]
    },
    baseSize: { length: 170, width: 96 },
    traversal: { enabled: true, lengthRatio: 0.92, widthRatio: 0.35, edgeAssistRatio: 0.15, traversalRuleId: 'terrain.bridge',
      viewAxesDeg: { horizontal: 0, vertical: 90, diagonal_left: -45, diagonal_right: 45 } }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.castle_2p5d.01',
    label: 'Pont de château 2,5D',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.castle_2p5d.horizontal.01',
      defaultVariantId: 'horizontal',
      variants: [
        { id: 'horizontal', label: 'Horizontal', assetId: 'object.bridge.castle_2p5d.horizontal.01' },
        { id: 'vertical', label: 'Vertical', assetId: 'object.bridge.castle_2p5d.vertical.01' },
        { id: 'diagonal_left', label: 'Diagonale gauche', assetId: 'object.bridge.castle_2p5d.diagonal_left.01' },
        { id: 'diagonal_right', label: 'Diagonale droite', assetId: 'object.bridge.castle_2p5d.diagonal_right.01' }
      ]
    },
    baseSize: { length: 170, width: 96 },
    traversal: { enabled: true, lengthRatio: 0.92, widthRatio: 0.35, edgeAssistRatio: 0.15, traversalRuleId: 'terrain.bridge',
      viewAxesDeg: { horizontal: 0, vertical: 90, diagonal_left: -45, diagonal_right: 45 } }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.cobblestone_2p5d.01',
    label: 'Pont pavé 2,5D',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.cobblestone_2p5d.horizontal.01',
      defaultVariantId: 'horizontal',
      variants: [
        { id: 'horizontal', label: 'Horizontal', assetId: 'object.bridge.cobblestone_2p5d.horizontal.01' },
        { id: 'vertical', label: 'Vertical', assetId: 'object.bridge.cobblestone_2p5d.vertical.01' },
        { id: 'diagonal_left', label: 'Diagonale gauche', assetId: 'object.bridge.cobblestone_2p5d.diagonal_left.01' },
        { id: 'diagonal_right', label: 'Diagonale droite', assetId: 'object.bridge.cobblestone_2p5d.diagonal_right.01' }
      ]
    },
    baseSize: { length: 170, width: 96 },
    traversal: { enabled: true, lengthRatio: 0.92, widthRatio: 0.35, edgeAssistRatio: 0.15, traversalRuleId: 'terrain.bridge',
      viewAxesDeg: { horizontal: 0, vertical: 90, diagonal_left: -45, diagonal_right: 45 } }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.earth_crossing_2p5d.01',
    label: 'Passage de terre 2,5D',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.earth_crossing_2p5d.horizontal.01',
      defaultVariantId: 'horizontal',
      variants: [
        { id: 'horizontal', label: 'Horizontal', assetId: 'object.bridge.earth_crossing_2p5d.horizontal.01' },
        { id: 'vertical', label: 'Vertical', assetId: 'object.bridge.earth_crossing_2p5d.vertical.01' },
        { id: 'diagonal_left', label: 'Diagonale gauche', assetId: 'object.bridge.earth_crossing_2p5d.diagonal_left.01' },
        { id: 'diagonal_right', label: 'Diagonale droite', assetId: 'object.bridge.earth_crossing_2p5d.diagonal_right.01' }
      ]
    },
    baseSize: { length: 170, width: 96 },
    traversal: { enabled: true, lengthRatio: 0.92, widthRatio: 0.35, edgeAssistRatio: 0.15, traversalRuleId: 'terrain.bridge',
      viewAxesDeg: { horizontal: 0, vertical: 90, diagonal_left: -45, diagonal_right: 45 } }
  },

  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.wood.rustic_bank.01',
    label: 'Pont bois rustique',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.wood.rustic_bank.01'
    },
    baseSize: {
      length: 170,
      width: 96
    },
    traversal: {
      enabled: true,
      lengthRatio: 0.92,
      widthRatio: 0.82,
      edgeAssistRatio: 0.15,
      traversalRuleId: 'terrain.bridge'
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.stone.medieval_bank.01',
    label: 'Pont pierre médiéval',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.stone.medieval_bank.01'
    },
    baseSize: {
      length: 170,
      width: 96
    },
    traversal: {
      enabled: true,
      lengthRatio: 0.92,
      widthRatio: 0.82,
      edgeAssistRatio: 0.15,
      traversalRuleId: 'terrain.bridge'
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.wood.rope_bank.01',
    label: 'Pont suspendu bois',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.wood.rope_bank.01'
    },
    baseSize: {
      length: 170,
      width: 96
    },
    traversal: {
      enabled: true,
      lengthRatio: 0.92,
      widthRatio: 0.82,
      edgeAssistRatio: 0.15,
      traversalRuleId: 'terrain.bridge'
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.bridge.stone.moss_bank.01',
    label: 'Pont pierre moussu',
    kind: 'bridge',
    visual: {
      assetId: 'object.bridge.stone.moss_bank.01'
    },
    baseSize: {
      length: 170,
      width: 96
    },
    traversal: {
      enabled: true,
      lengthRatio: 0.92,
      widthRatio: 0.82,
      edgeAssistRatio: 0.15,
      traversalRuleId: 'terrain.bridge'
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.house.fantasy_wood_stone.01',
    label: 'Maison bois et pierre',
    kind: 'building',
    visual: {
      assetId: 'object.building.house.fantasy_wood_stone.01'
    },
    baseSize: {
      width: 300,
      height: 300
    },
    footprint: {
      enabled: true,
      widthRatio: 0.78,
      heightRatio: 0.62,
      offsetX: 0,
      offsetY: -0.08
    },
    doorAnchors: [
      {
        id: 'main-door',
        x: 0,
        y: 0.38
      }
    ]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.house.blue_cottage.01',
    label: 'Chaumière au toit bleu',
    kind: 'building',
    visual: {
      assetId:
        'object.building.house.blue_cottage.01',
      defaultVariantId: 'front',
      variants: [
        {
          id: 'front',
          label: 'Avant',
          assetId:
            'object.building.house.blue_cottage.01'
        },
        {
          id: 'side',
          label: 'Côté',
          assetId:
            'object.building.house.blue_cottage.side.01'
        },
        {
          id: 'back',
          label: 'Arrière',
          assetId:
            'object.building.house.blue_cottage.back.01'
        }
      ]
    },
    baseSize: { width: 260, height: 240 },
    footprint: { enabled: true, widthRatio: 0.76, heightRatio: 0.68, offsetX: 0, offsetY: 0.02 },
    doorAnchors: [{ id: 'main-door', x: 0, y: 0.46 }]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.house.red_tile.01',
    label: 'Maison au toit rouge',
    kind: 'building',
    visual: {
      assetId:
        'object.building.house.red_tile.01',
      defaultVariantId: 'front',
      variants: [
        {
          id: 'front',
          label: 'Avant',
          assetId:
            'object.building.house.red_tile.01'
        },
        {
          id: 'side',
          label: 'Côté',
          assetId:
            'object.building.house.red_tile.side.01'
        },
        {
          id: 'back',
          label: 'Arrière',
          assetId:
            'object.building.house.red_tile.back.01'
        }
      ]
    },
    baseSize: { width: 330, height: 280 },
    footprint: { enabled: true, widthRatio: 0.78, heightRatio: 0.7, offsetX: 0, offsetY: 0.02 },
    doorAnchors: [{ id: 'main-door', x: 0, y: 0.46 }]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.inn.golden_thatch.01',
    label: 'Grande auberge au toit doré',
    kind: 'building',
    visual: {
      assetId:
        'object.building.inn.golden_thatch.01',
      defaultVariantId: 'front',
      variants: [
        {
          id: 'front',
          label: 'Avant',
          assetId:
            'object.building.inn.golden_thatch.01'
        },
        {
          id: 'side',
          label: 'Côté',
          assetId:
            'object.building.inn.golden_thatch.side.01'
        },
        {
          id: 'back',
          label: 'Arrière',
          assetId:
            'object.building.inn.golden_thatch.back.01'
        }
      ]
    },
    baseSize: { width: 440, height: 330 },
    footprint: { enabled: true, widthRatio: 0.82, heightRatio: 0.72, offsetX: 0, offsetY: 0.02 },
    doorAnchors: [{ id: 'main-door', x: 0, y: 0.46 }]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.house.blue_cottage_2p5d.01',
    label: 'Maison 2,5D · Toit bleu',
    kind: 'building',
    visual: {
      assetId: 'object.building.house.blue_cottage_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Avant 2,5D', assetId: 'object.building.house.blue_cottage_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.building.house.blue_cottage_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.building.house.blue_cottage_2p5d.side.01' },
        { id: 'back', label: 'Arrière', assetId: 'object.building.house.blue_cottage_2p5d.back.01' }
      ]
    },
    baseSize: { width: 260, height: 240 },
    footprint: { enabled: true, widthRatio: 0.76, heightRatio: 0.68, offsetX: 0, offsetY: 0.02 },
    doorAnchors: [{ id: 'main-door', x: 0, y: 0.46 }]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.house.red_tile_2p5d.01',
    label: 'Maison 2,5D · Toit rouge',
    kind: 'building',
    visual: {
      assetId: 'object.building.house.red_tile_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Avant 2,5D', assetId: 'object.building.house.red_tile_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.building.house.red_tile_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.building.house.red_tile_2p5d.side.01' },
        { id: 'back', label: 'Arrière', assetId: 'object.building.house.red_tile_2p5d.back.01' }
      ]
    },
    baseSize: { width: 280, height: 250 },
    footprint: { enabled: true, widthRatio: 0.76, heightRatio: 0.68, offsetX: 0, offsetY: 0.02 },
    doorAnchors: [{ id: 'main-door', x: 0, y: 0.46 }]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.house.green_moss_2p5d.01',
    label: 'Maison 2,5D · Toit vert',
    kind: 'building',
    visual: {
      assetId: 'object.building.house.green_moss_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Avant 2,5D', assetId: 'object.building.house.green_moss_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.building.house.green_moss_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.building.house.green_moss_2p5d.side.01' },
        { id: 'back', label: 'Arrière', assetId: 'object.building.house.green_moss_2p5d.back.01' }
      ]
    },
    baseSize: { width: 270, height: 245 },
    footprint: { enabled: true, widthRatio: 0.76, heightRatio: 0.68, offsetX: 0, offsetY: 0.02 },
    doorAnchors: [{ id: 'main-door', x: 0, y: 0.46 }]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.inn.golden_thatch_2p5d.01',
    label: 'Auberge 2,5D · Chaume doré',
    kind: 'building',
    visual: {
      assetId: 'object.building.inn.golden_thatch_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Avant 2,5D', assetId: 'object.building.inn.golden_thatch_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.building.inn.golden_thatch_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.building.inn.golden_thatch_2p5d.side.01' },
        { id: 'back', label: 'Arrière', assetId: 'object.building.inn.golden_thatch_2p5d.back.01' }
      ]
    },
    baseSize: { width: 440, height: 330 },
    footprint: { enabled: true, widthRatio: 0.76, heightRatio: 0.68, offsetX: 0, offsetY: 0.02 },
    doorAnchors: [{ id: 'main-door', x: 0, y: 0.46 }]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.house.purple_ivy_2p5d.01',
    label: 'Maison 2,5D · Toit violet',
    kind: 'building',
    visual: {
      assetId: 'object.building.house.purple_ivy_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Avant 2,5D', assetId: 'object.building.house.purple_ivy_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.building.house.purple_ivy_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.building.house.purple_ivy_2p5d.side.01' },
        { id: 'back', label: 'Arrière', assetId: 'object.building.house.purple_ivy_2p5d.back.01' }
      ]
    },
    baseSize: { width: 275, height: 245 },
    footprint: { enabled: true, widthRatio: 0.76, heightRatio: 0.68, offsetX: 0, offsetY: 0.02 },
    doorAnchors: [{ id: 'main-door', x: 0, y: 0.46 }]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.building.house.terracotta_2p5d.01',
    label: 'Maison 2,5D · Terre cuite',
    kind: 'building',
    visual: {
      assetId: 'object.building.house.terracotta_2p5d.oblique.01',
      defaultVariantId: 'oblique',
      variants: [
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.building.house.terracotta_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.building.house.terracotta_2p5d.side.01' },
        { id: 'back', label: 'Arrière', assetId: 'object.building.house.terracotta_2p5d.back.01' }
      ]
    },
    baseSize: { width: 270, height: 240 },
    footprint: { enabled: true, widthRatio: 0.76, heightRatio: 0.68, offsetX: 0, offsetY: 0.02 },
    doorAnchors: [{ id: 'main-door', x: 0, y: 0.46 }]
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.tree.forest.pine_dense.01', label: 'Pin dense 2,5D', kind: 'tree',
    visual: { assetId: 'object.tree.forest.pine_dense.01' },
    baseSize: { width: 180, height: 230 },
    collision: {role:'obstacle',shape:'box',widthRatio:0.28,heightRatio:0.22,offsetX:0,offsetY:0.3}
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.tree.forest.spruce_tall.01', label: 'Sapin élancé 2,5D', kind: 'tree',
    visual: { assetId: 'object.tree.forest.spruce_tall.01' },
    baseSize: { width: 170, height: 250 },
    collision: {role:'obstacle',shape:'box',widthRatio:0.28,heightRatio:0.22,offsetX:0,offsetY:0.3}
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.tree.forest.broadleaf.01', label: 'Chêne feuillu 2,5D', kind: 'tree',
    visual: { assetId: 'object.tree.forest.broadleaf.01' },
    baseSize: { width: 220, height: 210 },
    collision: {role:'obstacle',shape:'box',widthRatio:0.3,heightRatio:0.24,offsetX:0,offsetY:0.28}
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.tree.fantasy.blossom.01', label: 'Arbre fleuri rose 2,5D', kind: 'tree',
    visual: { assetId: 'object.tree.fantasy.blossom.01' },
    baseSize: { width: 240, height: 225 },
    collision: {role:'obstacle',shape:'box',widthRatio:0.32,heightRatio:0.24,offsetX:0,offsetY:0.28}
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.tree.fantasy.ancient_twist.01', label: 'Vieil arbre noueux 2,5D', kind: 'tree',
    visual: { assetId: 'object.tree.fantasy.ancient_twist.01' },
    baseSize: { width: 240, height: 230 },
    collision: {role:'obstacle',shape:'box',widthRatio:0.32,heightRatio:0.24,offsetX:0,offsetY:0.28}
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.tree.forest.oak.01',
    label: 'Chêne forestier',
    kind: 'tree',
    visual: { assetId: 'object.tree.forest.oak.01' },
    baseSize: { width: 190, height: 190 },
    collision: {
      role: 'obstacle',
      shape: 'box',
      widthRatio: 0.3,
      heightRatio: 0.24,
      offsetX: 0,
      offsetY: 0.28
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.tree.forest.pine.01',
    label: 'Sapin forestier',
    kind: 'tree',
    visual: { assetId: 'object.tree.forest.pine.01' },
    baseSize: { width: 170, height: 210 },
    collision: {
      role: 'obstacle',
      shape: 'box',
      widthRatio: 0.28,
      heightRatio: 0.22,
      offsetX: 0,
      offsetY: 0.3
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.tree.fantasy.ancient_blossom.01',
    label: 'Arbre ancien fleuri',
    kind: 'tree',
    visual: { assetId: 'object.tree.fantasy.ancient_blossom.01' },
    baseSize: { width: 210, height: 200 },
    collision: {
      role: 'obstacle',
      shape: 'box',
      widthRatio: 0.32,
      heightRatio: 0.24,
      offsetX: 0,
      offsetY: 0.28
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.desert.layered_plateau.01',
    label: 'Roche désertique · Strates',
    kind: 'rock',
    visual: { assetId: 'object.rock.desert.layered_plateau.01' },
    baseSize: { width: 220, height: 155 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.desert.tall_spire.01',
    label: 'Roche désertique · Monolithe',
    kind: 'rock',
    visual: { assetId: 'object.rock.desert.tall_spire.01' },
    baseSize: { width: 150, height: 225 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.62, heightRatio: 0.38, offsetX: 0, offsetY: 0.16
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.desert.cracked_cluster.01',
    label: 'Roche désertique · Fractures',
    kind: 'rock',
    visual: { assetId: 'object.rock.desert.cracked_cluster.01' },
    baseSize: { width: 185, height: 175 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.desert.rounded_sandstone.01',
    label: 'Roche désertique · Galet massif',
    kind: 'rock',
    visual: { assetId: 'object.rock.desert.rounded_sandstone.01' },
    baseSize: { width: 220, height: 155 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.gray.round_boulder.01',
    label: 'Roche grise · Bloc arrondi',
    kind: 'rock',
    visual: { assetId: 'object.rock.gray.round_boulder.01' },
    baseSize: { width: 220, height: 155 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.gray.tall_spire.01',
    label: 'Roche grise · Pic',
    kind: 'rock',
    visual: { assetId: 'object.rock.gray.tall_spire.01' },
    baseSize: { width: 150, height: 225 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.62, heightRatio: 0.38, offsetX: 0, offsetY: 0.16
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.gray.layered_slab.01',
    label: 'Roche grise · Dalles',
    kind: 'rock',
    visual: { assetId: 'object.rock.gray.layered_slab.01' },
    baseSize: { width: 220, height: 155 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.gray.block_cluster.01',
    label: 'Roche grise · Blocs',
    kind: 'rock',
    visual: { assetId: 'object.rock.gray.block_cluster.01' },
    baseSize: { width: 185, height: 175 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.moss.wide_boulder.01',
    label: 'Roche moussue · Large',
    kind: 'rock',
    visual: { assetId: 'object.rock.moss.wide_boulder.01' },
    baseSize: { width: 220, height: 155 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.moss.tall_monolith.01',
    label: 'Roche moussue · Monolithe',
    kind: 'rock',
    visual: { assetId: 'object.rock.moss.tall_monolith.01' },
    baseSize: { width: 150, height: 225 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.62, heightRatio: 0.38, offsetX: 0, offsetY: 0.16
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.moss.split_cluster.01',
    label: 'Roche moussue · Double',
    kind: 'rock',
    visual: { assetId: 'object.rock.moss.split_cluster.01' },
    baseSize: { width: 185, height: 175 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.moss.layered_stack.01',
    label: 'Roche moussue · Empilée',
    kind: 'rock',
    visual: { assetId: 'object.rock.moss.layered_stack.01' },
    baseSize: { width: 220, height: 155 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.volcanic.dark_spire.01',
    label: 'Roche volcanique · Pic noir',
    kind: 'rock',
    visual: { assetId: 'object.rock.volcanic.dark_spire.01' },
    baseSize: { width: 150, height: 225 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.62, heightRatio: 0.38, offsetX: 0, offsetY: 0.16
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.volcanic.lava_plateau.01',
    label: 'Roche volcanique · Lave fissurée',
    kind: 'rock',
    visual: { assetId: 'object.rock.volcanic.lava_plateau.01' },
    baseSize: { width: 220, height: 155 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.volcanic.stacked_blocks.01',
    label: 'Roche volcanique · Blocs empilés',
    kind: 'rock',
    visual: { assetId: 'object.rock.volcanic.stacked_blocks.01' },
    baseSize: { width: 220, height: 155 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.volcanic.lava_block.01',
    label: 'Roche volcanique · Bloc incandescent',
    kind: 'rock',
    visual: { assetId: 'object.rock.volcanic.lava_block.01' },
    baseSize: { width: 185, height: 175 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.fantasy.crystal_spire.01',
    label: 'Roche fantastique · Cristal bleu',
    kind: 'rock',
    visual: { assetId: 'object.rock.fantasy.crystal_spire.01' },
    baseSize: { width: 150, height: 225 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.62, heightRatio: 0.38, offsetX: 0, offsetY: 0.16
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.fantasy.violet_moss_boulder.01',
    label: 'Roche fantastique · Violet moussu',
    kind: 'rock',
    visual: { assetId: 'object.rock.fantasy.violet_moss_boulder.01' },
    baseSize: { width: 220, height: 155 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.fantasy.turquoise_layered.01',
    label: 'Roche fantastique · Turquoise',
    kind: 'rock',
    visual: { assetId: 'object.rock.fantasy.turquoise_layered.01' },
    baseSize: { width: 220, height: 155 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.fantasy.pale_lichen_block.01',
    label: 'Roche fantastique · Lichen doré',
    kind: 'rock',
    visual: { assetId: 'object.rock.fantasy.pale_lichen_block.01' },
    baseSize: { width: 185, height: 175 },
    collision: {
      role: 'obstacle', shape: 'box',
      widthRatio: 0.78, heightRatio: 0.6, offsetX: 0, offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.forest.boulder.01',
    label: 'Rochers moussus',
    kind: 'rock',
    visual: { assetId: 'object.rock.forest.boulder.01' },
    baseSize: { width: 170, height: 160 },
    collision: {
      role: 'obstacle',
      shape: 'box',
      widthRatio: 0.78,
      heightRatio: 0.58,
      offsetX: 0,
      offsetY: 0.1
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.forest.spires.01',
    label: 'Aiguilles rocheuses',
    kind: 'rock',
    visual: { assetId: 'object.rock.forest.spires.01' },
    baseSize: { width: 160, height: 190 },
    collision: {
      role: 'obstacle',
      shape: 'box',
      widthRatio: 0.66,
      heightRatio: 0.58,
      offsetX: 0,
      offsetY: 0.12
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.rock.forest.plateau.01',
    label: 'Plateau rocheux',
    kind: 'rock',
    visual: { assetId: 'object.rock.forest.plateau.01' },
    baseSize: { width: 230, height: 150 },
    collision: {
      role: 'obstacle',
      shape: 'box',
      widthRatio: 0.82,
      heightRatio: 0.62,
      offsetX: 0,
      offsetY: 0.08
    }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.door.fantasy.wood.01',
    label: 'Entrée bois au toit bleu',
    kind: 'door',
    visual: { assetId: 'object.door.fantasy.wood.01' },
    baseSize: { width: 150, height: 140 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.door.fantasy.stone_redroof.01',
    label: 'Entrée pierre au toit rouge',
    kind: 'door',
    visual: { assetId: 'object.door.fantasy.stone_redroof.01' },
    baseSize: { width: 180, height: 155 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.door.fantasy.tavern_golden.01',
    label: 'Entrée auberge au toit doré',
    kind: 'door',
    visual: { assetId: 'object.door.fantasy.tavern_golden.01' },
    baseSize: { width: 220, height: 170 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.stone_rustic_2p5d.01',
    label: 'Escalier 2,5D · Pierre rustique',
    kind: 'stairs',
    visual: {
      assetId: 'object.stairs.stone_rustic_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Face', assetId: 'object.stairs.stone_rustic_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.stairs.stone_rustic_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.stairs.stone_rustic_2p5d.side.01' }
      ]
    },
    baseSize: { width: 210, height: 190 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.stone_temple_2p5d.01',
    label: 'Escalier 2,5D · Pierre de temple',
    kind: 'stairs',
    visual: {
      assetId: 'object.stairs.stone_temple_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Face', assetId: 'object.stairs.stone_temple_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.stairs.stone_temple_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.stairs.stone_temple_2p5d.side.01' }
      ]
    },
    baseSize: { width: 210, height: 190 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.wood_rustic_2p5d.01',
    label: 'Escalier 2,5D · Bois rustique',
    kind: 'stairs',
    visual: {
      assetId: 'object.stairs.wood_rustic_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Face', assetId: 'object.stairs.wood_rustic_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.stairs.wood_rustic_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.stairs.wood_rustic_2p5d.side.01' }
      ]
    },
    baseSize: { width: 210, height: 190 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.stone_ruins_moss_2p5d.01',
    label: 'Escalier 2,5D · Ruines moussues',
    kind: 'stairs',
    visual: {
      assetId: 'object.stairs.stone_ruins_moss_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Face', assetId: 'object.stairs.stone_ruins_moss_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.stairs.stone_ruins_moss_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.stairs.stone_ruins_moss_2p5d.side.01' }
      ]
    },
    baseSize: { width: 210, height: 190 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.marble_palace_2p5d.01',
    label: 'Escalier 2,5D · Marbre noble',
    kind: 'stairs',
    visual: {
      assetId: 'object.stairs.marble_palace_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Face', assetId: 'object.stairs.marble_palace_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.stairs.marble_palace_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.stairs.marble_palace_2p5d.side.01' }
      ]
    },
    baseSize: { width: 210, height: 190 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.timber_stone_village_2p5d.01',
    label: 'Escalier 2,5D · Bois et pierre village',
    kind: 'stairs',
    visual: {
      assetId: 'object.stairs.timber_stone_village_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Face', assetId: 'object.stairs.timber_stone_village_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.stairs.timber_stone_village_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.stairs.timber_stone_village_2p5d.side.01' }
      ]
    },
    baseSize: { width: 210, height: 190 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.stone_fortress_dark_2p5d.01',
    label: 'Escalier 2,5D · Forteresse sombre',
    kind: 'stairs',
    visual: {
      assetId: 'object.stairs.stone_fortress_dark_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Face', assetId: 'object.stairs.stone_fortress_dark_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.stairs.stone_fortress_dark_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.stairs.stone_fortress_dark_2p5d.side.01' }
      ]
    },
    baseSize: { width: 210, height: 190 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.earth_log_path_2p5d.01',
    label: 'Escalier 2,5D · Terre et rondins',
    kind: 'stairs',
    visual: {
      assetId: 'object.stairs.earth_log_path_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Face', assetId: 'object.stairs.earth_log_path_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.stairs.earth_log_path_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.stairs.earth_log_path_2p5d.side.01' }
      ]
    },
    baseSize: { width: 210, height: 190 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.stone_cobble_town_2p5d.01',
    label: 'Escalier 2,5D · Pavés de village',
    kind: 'stairs',
    visual: {
      assetId: 'object.stairs.stone_cobble_town_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Face', assetId: 'object.stairs.stone_cobble_town_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.stairs.stone_cobble_town_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.stairs.stone_cobble_town_2p5d.side.01' }
      ]
    },
    baseSize: { width: 210, height: 190 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.stone_cliff_moss_2p5d.01',
    label: 'Escalier 2,5D · Falaise moussue',
    kind: 'stairs',
    visual: {
      assetId: 'object.stairs.stone_cliff_moss_2p5d.front.01',
      defaultVariantId: 'front',
      variants: [
        { id: 'front', label: 'Face', assetId: 'object.stairs.stone_cliff_moss_2p5d.front.01' },
        { id: 'oblique', label: 'Trois-quarts', assetId: 'object.stairs.stone_cliff_moss_2p5d.oblique.01' },
        { id: 'side', label: 'Côté', assetId: 'object.stairs.stone_cliff_moss_2p5d.side.01' }
      ]
    },
    baseSize: { width: 210, height: 190 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.stone.simple.01',
    label: 'Escalier pierre simple',
    kind: 'stairs',
    visual: { assetId: 'object.stairs.stone.simple.01' },
    baseSize: { width: 150, height: 120 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.wood.porch.01',
    label: 'Escalier bois',
    kind: 'stairs',
    visual: { assetId: 'object.stairs.wood.porch.01' },
    baseSize: { width: 180, height: 135 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.stairs.stone.grand.01',
    label: 'Grand escalier pierre',
    kind: 'stairs',
    visual: { assetId: 'object.stairs.stone.grand.01' },
    baseSize: { width: 230, height: 170 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.relief.cliff.grassy_edge.01',
    label: '2,5D · Falaise herbeuse longue',
    kind: 'rock',
    library: { categoryId: 'rocks', folderId: 'rocks/general', provenance: 'pilot' },
    visual: { assetId: 'object.relief.cliff.grassy_edge.01' },
    baseSize: { width: 768, height: 384 },
    collision: { role: 'obstacle', shape: 'box', widthRatio: 0.90,
      heightRatio: 0.66, offsetX: 0, offsetY: 0.08 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.relief.cliff.broken_ledge.02',
    label: '2,5D · Falaise herbeuse, arête irrégulière',
    kind: 'rock',
    library: { categoryId: 'rocks', folderId: 'rocks/general', provenance: 'pilot' },
    visual: { assetId: 'object.relief.cliff.broken_ledge.02' },
    baseSize: { width: 768, height: 384 },
    // Inherit exactly the same footprint as the approved long cliff.
    collision: { role: 'obstacle', shape: 'box', widthRatio: 0.90,
      heightRatio: 0.66, offsetX: 0, offsetY: 0.08 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.relief.cliff.corner.01',
    label: '2,5D · Angle de falaise',
    kind: 'rock',
    library: { categoryId: 'rocks', folderId: 'rocks/general', provenance: 'pilot' },
    visual: { assetId: 'object.relief.cliff.corner.01' },
    baseSize: { width: 420, height: 405 },
    collision: { role: 'obstacle', shape: 'box', widthRatio: 0.82,
      heightRatio: 0.60, offsetX: 0, offsetY: 0.08 }
  },
  {
    schemaVersion: OBJECT_DEFINITION_SCHEMA_VERSION,
    id: 'objectdef.relief.waterfall.blue.01',
    label: '2,5D · Cascade bleue décorative',
    kind: 'decor',
    library: { categoryId: 'decor', folderId: 'decor/general', provenance: 'pilot' },
    visual: { assetId: 'object.relief.waterfall.blue.01' },
    baseSize: { width: 280, height: 440 }
  }

]);

export function createObjectDefinitionCatalog(
  definitions = DEFINITIONS
) {
  const entries = Array.isArray(definitions)
    ? definitions
    : [];
  const byId = new Map();

  for (const definition of entries) {
    if (
      !definition ||
      typeof definition.id !== 'string' ||
      !definition.id.trim() ||
      byId.has(definition.id.trim())
    ) {
      continue;
    }

    byId.set(
      definition.id.trim(),
      frozen(
        structuredClone(
          normalizeDefinition(definition)
        )
      )
    );
  }

  const list = Object.freeze([...byId.values()]);

  return Object.freeze({
    list() {
      return list;
    },

    get(id) {
      const key =
        typeof id === 'string'
          ? id.trim()
          : '';

      return key
        ? byId.get(key) ?? null
        : null;
    },

    require(id) {
      const definition = this.get(id);

      if (!definition) {
        throw new Error(
          `Unknown WorldObject definition: ${id}`
        );
      }

      return definition;
    }
  });
}

export function listNativeObjectDefinitions() {
  return Object.freeze(
    DEFINITIONS.map((definition) =>
      frozen(
        structuredClone(
          normalizeDefinition(definition)
        )
      )
    )
  );
}

export function createComposedObjectDefinitionCatalog(
  userDefinitions = []
) {
  return createObjectDefinitionCatalog([
    ...listNativeObjectDefinitions(),
    ...(Array.isArray(userDefinitions)
      ? userDefinitions
      : [])
  ]);
}

export const objectDefinitionCatalogV1 =
  createObjectDefinitionCatalog();
