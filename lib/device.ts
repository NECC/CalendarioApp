// Device detection. Can only be used in the browser.

export function isIOS() {
  const ua = navigator.userAgent;
  // Recent iPads identify as "Macintosh", but have a touch screen.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/** Is the app open from its icon, without the browser bar? */
export function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
