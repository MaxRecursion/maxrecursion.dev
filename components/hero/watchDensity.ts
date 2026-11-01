/**
 * Calls `onChange` when the screen's pixel density changes, as when a window
 * moves between a 1x and a 2x display. That changes no CSS size, so a
 * ResizeObserver never sees it. Returns the cleanup.
 */
export function watchDensity(onChange: () => void) {
  let query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  const change = () => {
    query.removeEventListener("change", change);
    query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    query.addEventListener("change", change);
    onChange();
  };
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}
