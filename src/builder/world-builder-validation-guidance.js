// Presentation only: WorldDocument and Builder validation own the source of truth.
// Never adjust authors' encounter percentages or suppress validation codes here.
export function describeWorldBuilderValidation(errors = [], document = null) {
  const messages = [];
  let encounterFamilyId = null;

  for (const code of errors) {
    const match = /^encounter-element-total:(.+)$/.exec(code);
    if (!match) {
      messages.push(code);
      continue;
    }

    const familyId = match[1];
    const family = document?.terrainFamilies?.find(
      (item) => item.id === familyId
    );
    const profile = document?.encounterConfig?.families?.find(
      (item) => item.terrainFamilyId === familyId
    );
    const total = profile?.elementChances?.reduce(
      (sum, entry) => sum + entry.chancePercent, 0
    );
    const currentTotal = Number.isFinite(total)
      ? `${Math.round(total * 100) / 100} %`
      : 'inconnu';

    messages.push(
      `Rencontres « ${family?.label ?? familyId} » : total des éléments ${currentTotal} (100 % requis). Corrige dans Terrain → Rencontres par famille.`
    );
    encounterFamilyId ??= familyId;
  }

  return Object.freeze({
    message: messages.join(' · '),
    encounterFamilyId
  });
}
