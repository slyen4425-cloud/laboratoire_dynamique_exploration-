const MAP_TOOLS = Object.freeze([
  'select',
  'actor-preview',
  'area-size',
  'terrain',
  'route',
  'river',
  'encounter'
]);

export function normalizeBuilderMapTool(tool) {
  return MAP_TOOLS.includes(tool)
    ? tool
    : 'select';
}

export function builderPanelForMapTool(tool) {
  const normalized = normalizeBuilderMapTool(tool);

  if (normalized === 'encounter') return 'encounters';
  if (
    normalized === 'terrain' ||
    normalized === 'route' ||
    normalized === 'river'
  ) {
    return 'terrain';
  }
  if (normalized === 'actor-preview') return 'actors';
  if (normalized === 'area-size') return 'area';

  return null;
}

export function builderPaintKindForMapTool(tool) {
  const normalized = normalizeBuilderMapTool(tool);

  return [
    'terrain',
    'route',
    'river',
    'encounter'
  ].includes(normalized)
    ? normalized
    : null;
}
