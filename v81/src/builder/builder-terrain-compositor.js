// Backward-compatible Builder entry: the same read-only terrain cache also
// powers the Exploration runtime, with no duplicate compositor implementation.
export {
  createTerrainRasterCompositor as createBuilderTerrainCompositor,
  partitionActiveSurface
} from '../render/terrain-raster-compositor.js?rev=runtime-terrain-cache-v1';
