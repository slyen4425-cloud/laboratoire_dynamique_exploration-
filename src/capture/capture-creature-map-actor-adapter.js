import {
  normalizeMapActorVisual
} from '../actors/map-actor-visual-model.js?rev=map-actor-source-facing-v1';

export function mapActorVisualFromCaptureCreature(
  creature
) {
  const presentation =
    creature?.presentation;

  const assetId =
    presentation?.visual?.front?.assetId ??
    null;

  if (
    typeof assetId !== 'string' ||
    assetId.trim() === ''
  ) {
    return null;
  }

  return normalizeMapActorVisual({
    assetId: assetId.trim(),
    role: 'creature'
  });
}
