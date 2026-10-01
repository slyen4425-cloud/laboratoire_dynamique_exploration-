export function createVirtualStick(root, knob, radius = 42) {
  const state = { x: 0, y: 0 };
  let pointerId = null;

  function reset() {
    state.x = 0;
    state.y = 0;
    knob.style.transform = 'translate(0, 0)';
  }

  function update(event) {
    const bounds = root.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const length = Math.hypot(dx, dy);

    if (length > radius) {
      dx = (dx / length) * radius;
      dy = (dy / length) * radius;
    }

    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    state.x = dx / radius;
    state.y = dy / radius;
  }

  root.addEventListener('pointerdown', (event) => {
    pointerId = event.pointerId;
    root.setPointerCapture(pointerId);
    update(event);
  });

  root.addEventListener('pointermove', (event) => {
    if (event.pointerId === pointerId) update(event);
  });

  const release = (event) => {
    if (pointerId !== null && event.pointerId === pointerId) {
      pointerId = null;
      reset();
    }
  };

  root.addEventListener('pointerup', release);
  root.addEventListener('pointercancel', release);

  return state;
}
