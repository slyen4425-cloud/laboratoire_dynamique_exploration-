// Presentation only: WorldDocument and Builder validation own the source of truth.
// Never adjust authors' selected elements or suppress validation codes here.
export function describeWorldBuilderValidation(errors = [], document = null) {
  const messages = [];
  let encounterFamilyId = null;

  for (const code of errors) {
    const match = /^encounter-elements-empty:(.+)$/.exec(code);
    if (!match) {
      messages.push(code);
      continue;
    }

    const familyId = match[1];
    const family = document?.terrainFamilies?.find(
      (item) => item.id === familyId
    );

    messages.push(
      `Rencontres « ${family?.label ?? familyId} » : coche au moins un élément possible dans Terrain → Rencontres par famille.`
    );
    encounterFamilyId ??= familyId;
  }

  return Object.freeze({
    message: messages.join(' · '),
    encounterFamilyId
  });
}
