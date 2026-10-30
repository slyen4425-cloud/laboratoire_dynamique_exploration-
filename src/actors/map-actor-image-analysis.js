function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function colorDistance(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function pixelAt(data, width, x, y) {
  const index = (y * width + x) * 4;
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3]
  };
}

export function alphaBounds(
  data,
  width,
  height,
  alphaThreshold = 8
) {
  if (
    !data ||
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha <= alphaThreshold) continue;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return null;

  return Object.freeze({
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  });
}

export function hasTransparentPixels(
  data,
  alphaThreshold = 250
) {
  if (!data) return false;

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < alphaThreshold) return true;
  }

  return false;
}

export function analyzeUniformBackground(
  data,
  width,
  height,
  tolerance = 34
) {
  if (!data || width <= 0 || height <= 0) {
    return Object.freeze({
      uniform: false,
      color: null
    });
  }

  const samples = [
    pixelAt(data, width, 0, 0),
    pixelAt(data, width, width - 1, 0),
    pixelAt(data, width, 0, height - 1),
    pixelAt(data, width, width - 1, height - 1)
  ];

  if (samples.some((sample) => sample.a < 250)) {
    return Object.freeze({
      uniform: false,
      color: null
    });
  }

  const color = {
    r: Math.round(samples.reduce((sum, item) => sum + item.r, 0) / samples.length),
    g: Math.round(samples.reduce((sum, item) => sum + item.g, 0) / samples.length),
    b: Math.round(samples.reduce((sum, item) => sum + item.b, 0) / samples.length)
  };

  const uniform = samples.every(
    (sample) => colorDistance(sample, color) <= tolerance
  );

  return Object.freeze({
    uniform,
    color: uniform ? Object.freeze(color) : null
  });
}

export function removeUniformBackground(
  data,
  width,
  height,
  backgroundColor,
  {
    transparentDistance = 34,
    featherDistance = 66
  } = {}
) {
  const output = new Uint8ClampedArray(data);

  if (!backgroundColor) return output;

  for (let index = 0; index < output.length; index += 4) {
    const color = {
      r: output[index],
      g: output[index + 1],
      b: output[index + 2]
    };
    const distance = colorDistance(color, backgroundColor);

    if (distance <= transparentDistance) {
      output[index + 3] = 0;
      continue;
    }

    if (distance < featherDistance) {
      const ratio =
        (distance - transparentDistance) /
        Math.max(1, featherDistance - transparentDistance);
      output[index + 3] = Math.round(
        output[index + 3] * clamp(ratio, 0, 1)
      );
    }
  }

  return output;
}

export function prepareMapActorPixels({
  data,
  width,
  height
}) {
  if (!data || width <= 0 || height <= 0) {
    throw new Error('Map Actor image pixels are invalid');
  }

  let pixels = new Uint8ClampedArray(data);
  let backgroundMode = 'alpha';

  if (!hasTransparentPixels(pixels)) {
    const background = analyzeUniformBackground(
      pixels,
      width,
      height
    );

    if (background.uniform) {
      pixels = removeUniformBackground(
        pixels,
        width,
        height,
        background.color
      );
      backgroundMode = 'uniform-removed';
    } else {
      backgroundMode = 'opaque-unresolved';
    }
  }

  const bounds =
    alphaBounds(pixels, width, height) ??
    Object.freeze({
      x: 0,
      y: 0,
      width,
      height
    });

  return Object.freeze({
    pixels,
    bounds,
    backgroundMode,
    anchor: Object.freeze({
      x: 0.5,
      y: 0.96
    })
  });
}
