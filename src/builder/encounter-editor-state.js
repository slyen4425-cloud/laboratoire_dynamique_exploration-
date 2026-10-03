export function encounterEditorAvailability({
  hasLayer,
  hasEntry
}) {
  return Object.freeze({
    layerDelete: hasLayer === true,
    layerSettings: true,
    entryAdd: hasLayer === true,
    entryDelete: hasLayer === true && hasEntry === true,
    selectorKind: true,
    selectorValue: true,
    entryWeight: true
  });
}
