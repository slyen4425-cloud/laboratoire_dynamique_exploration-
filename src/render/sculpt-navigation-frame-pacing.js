// Visual-only frame pacing for the Sculpt 2.5D Tester. Browser requestAnimationFrame
// is the display clock; there must be no second 30-FPS walking clock.
// World movement, collision and camera positions remain owned by their
// existing modules. The idle interval reduces redraw cost on mobile.
export const SCULPT_NAVIGATION_IDLE_PAINT_INTERVAL_MS=55;

export function shouldPaintSculptNavigationFrame({
  moving=false,
  altitudeChanging=false,
  elapsedSincePaintMs=0
}={}){
  return Boolean(moving||altitudeChanging||
    elapsedSincePaintMs>=SCULPT_NAVIGATION_IDLE_PAINT_INTERVAL_MS);
}
