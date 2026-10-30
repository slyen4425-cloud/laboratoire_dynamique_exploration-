import {
  prepareMapActorPixels
} from '../actors/map-actor-image-analysis.js';

export function createMapActorVisualPreparer({
  imageLoader,
  canvasFactory = () => document.createElement('canvas')
} = {}) {
  if (!imageLoader || typeof imageLoader.get !== 'function') {
    throw new Error('Map Actor Visual Preparer requires imageLoader');
  }

  const prepared = new Map();
  const states = new Map();
  let disposed = false;

  function prepareOne(assetId) {
    if (disposed) {
      return Object.freeze({
        assetId,
        state: 'disposed'
      });
    }

    if (prepared.has(assetId)) {
      return Object.freeze({
        assetId,
        state: 'ready'
      });
    }

    const image = imageLoader.get(assetId);
    if (!image) {
      states.set(assetId, 'error');
      return Object.freeze({
        assetId,
        state: 'error'
      });
    }

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;

    if (!width || !height) {
      states.set(assetId, 'error');
      return Object.freeze({
        assetId,
        state: 'error'
      });
    }

    const sourceCanvas = canvasFactory();
    sourceCanvas.width = width;
    sourceCanvas.height = height;
    const sourceContext = sourceCanvas.getContext('2d', {
      willReadFrequently: true
    });

    sourceContext.clearRect(0, 0, width, height);
    sourceContext.drawImage(image, 0, 0, width, height);

    const sourceData = sourceContext.getImageData(
      0,
      0,
      width,
      height
    );
    const result = prepareMapActorPixels({
      data: sourceData.data,
      width,
      height
    });

    const processedData = sourceContext.createImageData(
      width,
      height
    );
    processedData.data.set(result.pixels);
    sourceContext.putImageData(processedData, 0, 0);

    const outputCanvas = canvasFactory();
    outputCanvas.width = result.bounds.width;
    outputCanvas.height = result.bounds.height;
    const outputContext = outputCanvas.getContext('2d');

    outputContext.clearRect(
      0,
      0,
      outputCanvas.width,
      outputCanvas.height
    );
    outputContext.drawImage(
      sourceCanvas,
      result.bounds.x,
      result.bounds.y,
      result.bounds.width,
      result.bounds.height,
      0,
      0,
      result.bounds.width,
      result.bounds.height
    );

    prepared.set(
      assetId,
      Object.freeze({
        assetId,
        source: outputCanvas,
        width: outputCanvas.width,
        height: outputCanvas.height,
        aspectRatio:
          outputCanvas.width / Math.max(1, outputCanvas.height),
        anchor: result.anchor,
        backgroundMode: result.backgroundMode
      })
    );
    states.set(assetId, 'ready');

    return Object.freeze({
      assetId,
      state: 'ready'
    });
  }

  function prepare(assetIds) {
    const ids = Array.isArray(assetIds)
      ? [...new Set(
          assetIds.filter(
            (assetId) =>
              typeof assetId === 'string' &&
              assetId.trim()
          )
        )]
      : [];

    const results = ids.map(prepareOne);

    return Object.freeze({
      total: results.length,
      ready: results.filter(
        (result) => result.state === 'ready'
      ).length,
      errors: results.filter(
        (result) => result.state === 'error'
      ).length,
      disposed
    });
  }

  function get(assetId) {
    return prepared.get(assetId) ?? null;
  }

  function state(assetId) {
    return states.get(assetId) ?? 'unprepared';
  }

  function dispose() {
    disposed = true;
    prepared.clear();
    states.clear();
  }

  return Object.freeze({
    prepare,
    get,
    state,
    dispose
  });
}
