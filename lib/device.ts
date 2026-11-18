// Deteção do dispositivo. Só pode ser usado no browser.

export function isIOS() {
  const ua = navigator.userAgent;
  // Os iPads recentes identificam-se como "Macintosh", mas têm ecrã tátil.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/**
 * O mesmo teste que `isInstalled`, como texto para um <script> que corre antes de a
 * página aparecer (antes de o React arrancar).
 */
export const INSTALLED_CHECK =
  "(matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: window-controls-overlay)').matches||navigator.standalone===true)";

/** A app está aberta a partir do ícone, sem a barra do browser? */
export function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // No computador, a app instalada pode usar a barra de título como espaço da app.
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * O mesmo teste que `isDesktop`, como texto para um <script> que corre antes de a
 * página aparecer.
 */
export const DESKTOP_CHECK =
  "(!/Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent)&&!(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1))";

/** Está num computador (não num telemóvel nem num tablet)? */
export function isDesktop() {
  const ua = navigator.userAgent;
  return !/Android|iPhone|iPad|iPod|Mobi/i.test(ua) && !isIOS();
}
