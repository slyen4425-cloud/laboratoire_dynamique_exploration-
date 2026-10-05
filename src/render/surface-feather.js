function finite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function surfaceFeatherPasses(
  zoneWidth,
  transition = { mode: 'none' }
) {
  const outerWidth = finite(zoneWidth, 0);

  if (outerWidth <= 0) return [];

  if (!transition || transition.mode !== 'feather') {
    return Object.freeze([
      Object.freeze({
        width: outerWidth,
        alpha: 1
      })
    ]);
  }

  const widthRatio = clamp(
    finite(transition.widthRatio, 0.18),
    0.01,
    0.45
  );
  const minWidth = Math.max(
    0,
    finite(transition.minWidth, 6)
  );
  const maxWidth = Math.max(
    minWidth,
    finite(transition.maxWidth, 64)
  );
  const steps = clamp(
    Math.round(finite(transition.steps, 7)),
    2,
    12
  );
  const edgeOpacity = clamp(
    finite(transition.edgeOpacity, 0.08),
    0,
    0.95
  );

  const requestedFeather = clamp(
    outerWidth * widthRatio,
    minWidth,
    maxWidth
  );
  const radialFeather = Math.min(
    requestedFeather,
    outerWidth * 0.4
  );

  if (radialFeather <= 0.25) {
    return Object.freeze([
      Object.freeze({
        width: outerWidth,
        alpha: 1
      })
    ]);
  }

  const innerWidth = Math.max(
    1,
    outerWidth - radialFeather * 2
  );
  const passes = [];
  let accumulatedOpacity = 0;

  for (let index = 0; index < steps; index += 1) {
    const t = index / (steps - 1);
    const targetOpacity =
      edgeOpacity +
      (1 - edgeOpacity) * smoothstep(t);

    const alpha =
      index === steps - 1
        ? 1
        : clamp(
            (targetOpacity - accumulatedOpacity) /
              Math.max(1e-9, 1 - accumulatedOpacity),
            0,
            1
          );

    passes.push(
      Object.freeze({
        width:
          outerWidth +
          (innerWidth - outerWidth) * t,
        alpha
      })
    );

    accumulatedOpacity =
      1 - (1 - accumulatedOpacity) * (1 - alpha);
  }

  return Object.freeze(passes);
}


export function surfaceFeatherMaskPlan(
  zoneWidth,
  transition = { mode: 'none' }
) {
  const outerWidth = finite(zoneWidth, 0);

  if (
    outerWidth <= 0 ||
    !transition ||
    transition.mode !== 'feather' ||
    transition.method !== 'smooth-mask'
  ) {
    return null;
  }

  const widthRatio = clamp(
    finite(transition.widthRatio, 0.18),
    0.01,
    0.45
  );
  const minWidth = Math.max(
    0,
    finite(transition.minWidth, 6)
  );
  const maxWidth = Math.max(
    minWidth,
    finite(transition.maxWidth, 64)
  );
  const edgeOpacity = clamp(
    finite(transition.edgeOpacity, 0),
    0,
    0.95
  );
  const blurRatio = clamp(
    finite(transition.blurRatio, 0.58),
    0.2,
    1
  );

  const requestedFeather = clamp(
    outerWidth * widthRatio,
    minWidth,
    maxWidth
  );
  const featherWidth = Math.min(
    requestedFeather,
    outerWidth * 0.4
  );

  if (featherWidth <= 0.25) {
    return Object.freeze({
      outerWidth,
      innerWidth: outerWidth,
      featherWidth: 0,
      blurRadius: 0,
      edgeOpacity
    });
  }

  const innerWidth = Math.max(
    1,
    outerWidth - featherWidth * 2
  );
  const blurRadius = Math.min(
    featherWidth,
    Math.max(
      0.75,
      featherWidth * blurRatio
    )
  );

  return Object.freeze({
    outerWidth,
    innerWidth,
    featherWidth,
    blurRadius,
    edgeOpacity
  });
}
