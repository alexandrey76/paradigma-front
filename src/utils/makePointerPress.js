export default function makePointerPress(setPressed, action, disabled = false) {
  return {
    onPointerDown: (e) => {
      if (disabled) return;
      e.preventDefault();
      setPressed(true);
    },
    onPointerUp: (e) => {
      if (disabled) return;
      e.preventDefault();
      setPressed(false);
      action?.();
    },
    onPointerLeave: () => setPressed(false),
    onPointerCancel: () => setPressed(false),
  };
}