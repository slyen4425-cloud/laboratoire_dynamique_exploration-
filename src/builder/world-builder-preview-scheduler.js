export function createPreviewFrameScheduler({
  requestFrame,
  render
}) {
  if (
    typeof requestFrame !== 'function' ||
    typeof render !== 'function'
  ) {
    throw new TypeError(
      'requestFrame and render functions are required'
    );
  }

  let pending = false;

  return Object.freeze({
    request() {
      if (pending) return false;

      pending = true;
      requestFrame((time) => {
        pending = false;
        render(time);
      });

      return true;
    },

    get pending() {
      return pending;
    }
  });
}
