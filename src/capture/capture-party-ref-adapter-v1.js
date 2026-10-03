export function resolveActiveCapturePartyRefV1(
  captureSession
) {
  if (
    !captureSession ||
    typeof captureSession !== 'object' ||
    Array.isArray(captureSession)
  ) {
    throw new TypeError(
      'captureSession must be an object'
    );
  }

  const partyRef =
    captureSession.activePartyRef;

  if (
    typeof partyRef !== 'string' ||
    !partyRef.trim()
  ) {
    throw new TypeError(
      'captureSession.activePartyRef is required'
    );
  }

  return partyRef.trim();
}
